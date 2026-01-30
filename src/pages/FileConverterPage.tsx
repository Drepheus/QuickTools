import { useState, useCallback, useRef, useEffect } from 'react';
import {
    FileAudio,
    Upload,
    Download,
    Trash2,
    RefreshCw,
    Check,
    AlertCircle,
    FileVideo,
    FileImage,
    File,
    Music,
    Loader2
} from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface ConvertedFile {
    id: string;
    originalName: string;
    originalType: string;
    originalSize: number;
    outputFormat: string;
    status: 'pending' | 'converting' | 'done' | 'error';
    progress: number;
    outputBlob?: Blob;
    outputUrl?: string;
    error?: string;
}

// Store files separately since File objects can't be serialized in React state
const fileStore = new Map<string, File>();

const audioFormats = ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'];
const videoFormats = ['mp4', 'webm', 'avi', 'mov', 'mkv'];
const imageFormats = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'];

const getFileIcon = (type: string) => {
    if (type.startsWith('audio/')) return <Music size={20} className="text-green-400" />;
    if (type.startsWith('video/')) return <FileVideo size={20} className="text-purple-400" />;
    if (type.startsWith('image/')) return <FileImage size={20} className="text-blue-400" />;
    return <File size={20} className="text-gray-400" />;
};

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function FileConverterPage() {
    const [files, setFiles] = useState<ConvertedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
    const [ffmpegLoading, setFfmpegLoading] = useState(false);
    const [ffmpegError, setFfmpegError] = useState<string | null>(null);
    const [isConverting, setIsConverting] = useState(false);
    const ffmpegRef = useRef<FFmpeg | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const loadAttempted = useRef(false);

    // Load FFmpeg on mount
    useEffect(() => {
        if (!loadAttempted.current) {
            loadAttempted.current = true;
            loadFFmpeg();
        }
    }, []);

    const loadFFmpeg = async () => {
        if (ffmpegRef.current || ffmpegLoading) return;

        setFfmpegLoading(true);
        setFfmpegError(null);

        try {
            console.log('Starting FFmpeg load...');
            const ffmpeg = new FFmpeg();

            ffmpeg.on('log', ({ message }) => {
                console.log('FFmpeg log:', message);
            });

            ffmpeg.on('progress', ({ progress }) => {
                console.log('FFmpeg progress:', progress);
                setFiles(prev => prev.map(f =>
                    f.status === 'converting' ? { ...f, progress: Math.round(progress * 100) } : f
                ));
            });

            // Try loading from unpkg CDN
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

            console.log('Fetching FFmpeg core...');
            const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
            console.log('Fetching FFmpeg WASM...');
            const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');

            console.log('Loading FFmpeg...');
            await ffmpeg.load({
                coreURL,
                wasmURL,
            });

            console.log('FFmpeg loaded successfully!');
            ffmpegRef.current = ffmpeg;
            setFfmpegLoaded(true);
            setFfmpegError(null);
        } catch (error) {
            console.error('Failed to load FFmpeg:', error);
            setFfmpegError(error instanceof Error ? error.message : 'Failed to load conversion engine');
        } finally {
            setFfmpegLoading(false);
        }
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        addFiles(droppedFiles);
    }, []);

    const addFiles = (newFiles: File[]) => {
        const convertedFiles: ConvertedFile[] = newFiles.map(file => {
            const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            // Store the actual File object in our Map
            fileStore.set(id, file);
            console.log('Added file to store:', id, file.name);
            return {
                id,
                originalName: file.name,
                originalType: file.type,
                originalSize: file.size,
                outputFormat: getDefaultOutputFormat(file.type),
                status: 'pending' as const,
                progress: 0,
            };
        });

        setFiles(prev => [...prev, ...convertedFiles]);
    };

    const getDefaultOutputFormat = (type: string): string => {
        if (type.startsWith('audio/')) return 'mp3';
        if (type.startsWith('video/')) return 'mp3'; // Default video to mp3 extraction
        if (type.startsWith('image/')) return 'png';
        return 'mp3';
    };

    const getAvailableFormats = (type: string): string[] => {
        if (type.startsWith('audio/')) return audioFormats;
        if (type.startsWith('video/')) return [...audioFormats, ...videoFormats];
        if (type.startsWith('image/')) return imageFormats;
        return audioFormats;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(Array.from(e.target.files));
        }
    };

    const updateFileFormat = (id: string, format: string) => {
        setFiles(prev => prev.map(f =>
            f.id === id ? { ...f, outputFormat: format } : f
        ));
    };

    const removeFile = (id: string) => {
        setFiles(prev => {
            const file = prev.find(f => f.id === id);
            if (file?.outputUrl) {
                URL.revokeObjectURL(file.outputUrl);
            }
            fileStore.delete(id);
            return prev.filter(f => f.id !== id);
        });
    };

    const convertFile = async (fileData: ConvertedFile) => {
        if (!ffmpegRef.current) {
            console.error('FFmpeg not loaded');
            return;
        }

        const originalFile = fileStore.get(fileData.id);
        if (!originalFile) {
            console.error('File not found in store:', fileData.id);
            setFiles(prev => prev.map(f =>
                f.id === fileData.id ? { ...f, status: 'error', error: 'File not found' } : f
            ));
            return;
        }

        const ffmpeg = ffmpegRef.current;
        const inputExt = fileData.originalName.split('.').pop() || 'bin';
        const inputFileName = `input_${fileData.id}.${inputExt}`;
        const outputFileName = `output_${fileData.id}.${fileData.outputFormat}`;

        setFiles(prev => prev.map(f =>
            f.id === fileData.id ? { ...f, status: 'converting', progress: 0 } : f
        ));

        try {
            console.log('Converting file:', fileData.originalName);

            // Write input file
            const fileBytes = await fetchFile(originalFile);
            await ffmpeg.writeFile(inputFileName, fileBytes);

            // Build FFmpeg command based on output format
            let command: string[];
            if (audioFormats.includes(fileData.outputFormat)) {
                // Extract/convert audio
                command = ['-i', inputFileName, '-vn'];
                switch (fileData.outputFormat) {
                    case 'mp3':
                        command.push('-acodec', 'libmp3lame', '-q:a', '2');
                        break;
                    case 'wav':
                        command.push('-acodec', 'pcm_s16le');
                        break;
                    case 'ogg':
                        command.push('-acodec', 'libvorbis', '-q:a', '4');
                        break;
                    case 'aac':
                    case 'm4a':
                        command.push('-acodec', 'aac', '-b:a', '192k');
                        break;
                    case 'flac':
                        command.push('-acodec', 'flac');
                        break;
                    default:
                        command.push('-acodec', 'copy');
                }
                command.push(outputFileName);
            } else {
                // Video/image conversion
                command = ['-i', inputFileName, outputFileName];
            }

            console.log('Running FFmpeg command:', command.join(' '));
            await ffmpeg.exec(command);

            // Read output file
            const data = await ffmpeg.readFile(outputFileName);
            const mimeType = audioFormats.includes(fileData.outputFormat)
                ? `audio/${fileData.outputFormat}`
                : `video/${fileData.outputFormat}`;
            const blob = new Blob([data as BlobPart], { type: mimeType });
            const url = URL.createObjectURL(blob);

            console.log('Conversion complete:', fileData.originalName);

            setFiles(prev => prev.map(f =>
                f.id === fileData.id ? {
                    ...f,
                    status: 'done',
                    progress: 100,
                    outputBlob: blob,
                    outputUrl: url
                } : f
            ));

            // Cleanup
            await ffmpeg.deleteFile(inputFileName);
            await ffmpeg.deleteFile(outputFileName);
        } catch (error) {
            console.error('Conversion error:', error);
            setFiles(prev => prev.map(f =>
                f.id === fileData.id ? {
                    ...f,
                    status: 'error',
                    error: 'Conversion failed. Please try a different format.'
                } : f
            ));
        }
    };

    const convertAll = async () => {
        if (!ffmpegLoaded) {
            // Try loading again if not loaded
            await loadFFmpeg();
            if (!ffmpegRef.current) {
                alert('Conversion engine failed to load. Please refresh the page and try again.');
                return;
            }
        }

        if (isConverting) return;

        setIsConverting(true);
        const pendingFiles = files.filter(f => f.status === 'pending');

        for (const file of pendingFiles) {
            await convertFile(file);
        }

        setIsConverting(false);
    };

    const downloadFile = (file: ConvertedFile) => {
        if (!file.outputUrl) return;
        const link = document.createElement('a');
        link.href = file.outputUrl;
        link.download = `${file.originalName.split('.')[0]}.${file.outputFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadAll = () => {
        files.filter(f => f.status === 'done').forEach(downloadFile);
    };

    const clearAll = () => {
        files.forEach(f => {
            if (f.outputUrl) URL.revokeObjectURL(f.outputUrl);
            fileStore.delete(f.id);
        });
        setFiles([]);
    };

    const hasPendingFiles = files.some(f => f.status === 'pending');
    const hasDoneFiles = files.some(f => f.status === 'done');

    return (
        <div className="min-h-[calc(100vh-180px)] py-12 px-8">
            <div className="max-w-4xl mx-auto">
                {/* Page Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glow-border mb-6">
                        <FileAudio size={32} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">File Converter</h1>
                    <p className="text-[var(--color-text-secondary)] max-w-xl mx-auto">
                        Convert files between formats instantly. Extract audio from videos, convert audio formats,
                        and more—all processed locally in your browser.
                    </p>

                    {/* FFmpeg Status */}
                    <div className="mt-4 flex items-center justify-center gap-2">
                        {ffmpegLoading ? (
                            <>
                                <Loader2 size={14} className="animate-spin text-[var(--color-using-amber)]" />
                                <span className="text-xs text-[var(--color-text-muted)]">Loading conversion engine...</span>
                            </>
                        ) : ffmpegLoaded ? (
                            <>
                                <div className="status-bulb active w-2 h-2" />
                                <span className="text-xs text-[var(--color-text-muted)]">Ready to convert</span>
                            </>
                        ) : ffmpegError ? (
                            <>
                                <div className="status-bulb inactive w-2 h-2" />
                                <span className="text-xs text-[var(--color-inactive-red)]">Engine error - click Convert to retry</span>
                            </>
                        ) : (
                            <>
                                <div className="status-bulb inactive w-2 h-2" />
                                <span className="text-xs text-[var(--color-text-muted)]">Engine not loaded</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Upload Area */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
                        ${isDragging
                            ? 'border-[var(--color-glow)] bg-[var(--color-glow)]/5 shadow-[0_0_30px_var(--color-glow-alpha)]'
                            : 'border-[var(--color-dark-400)] hover:border-[var(--color-dark-300)] bg-[var(--color-dark-700)]/50'
                        }
                    `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="audio/*,video/*,image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <Upload size={48} className={`mx-auto mb-4 ${isDragging ? 'text-[var(--color-glow)]' : 'text-[var(--color-text-muted)]'}`} />
                    <h3 className="text-lg font-semibold text-white mb-2">
                        {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                    </h3>
                    <p className="text-sm text-[var(--color-text-muted)]">
                        or click to browse • Supports audio, video, and image files
                    </p>
                </div>

                {/* Files List */}
                {files.length > 0 && (
                    <div className="mt-8">
                        {/* Actions Bar */}
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-[var(--color-text-secondary)]">
                                {files.length} file{files.length !== 1 ? 's' : ''} selected
                            </span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={clearAll}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-dark-500)] transition-colors"
                                >
                                    <Trash2 size={16} />
                                    Clear All
                                </button>
                                {hasDoneFiles && (
                                    <button
                                        onClick={downloadAll}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-[var(--color-dark-500)] text-white hover:bg-[var(--color-dark-400)] transition-colors"
                                    >
                                        <Download size={16} />
                                        Download All
                                    </button>
                                )}
                                {/* ALWAYS show Convert button when there are pending files */}
                                {hasPendingFiles && (
                                    <button
                                        onClick={convertAll}
                                        disabled={isConverting}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-[var(--color-active-green)] text-black hover:bg-[var(--color-active-green)]/90 transition-all disabled:opacity-50 shadow-[0_0_20px_var(--color-active-green-glow)]"
                                    >
                                        {isConverting ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Converting...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw size={16} />
                                                Convert All
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Files Table */}
                        <div className="bg-[var(--color-dark-700)] rounded-2xl border border-[var(--color-dark-500)] overflow-hidden">
                            {files.map((file, index) => (
                                <div
                                    key={file.id}
                                    className={`flex items-center gap-4 p-4 ${index !== files.length - 1 ? 'border-b border-[var(--color-dark-500)]' : ''}`}
                                >
                                    {/* File Icon */}
                                    <div className="w-10 h-10 rounded-xl bg-[var(--color-dark-600)] flex items-center justify-center">
                                        {getFileIcon(file.originalType)}
                                    </div>

                                    {/* File Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{file.originalName}</p>
                                        <p className="text-xs text-[var(--color-text-muted)]">{formatFileSize(file.originalSize)}</p>
                                    </div>

                                    {/* Format Selector */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-[var(--color-text-muted)]">→</span>
                                        <select
                                            value={file.outputFormat}
                                            onChange={(e) => updateFileFormat(file.id, e.target.value)}
                                            disabled={file.status !== 'pending'}
                                            className="px-3 py-1.5 rounded-lg text-sm bg-[var(--color-dark-600)] text-white border border-[var(--color-dark-400)] focus:outline-none focus:border-[var(--color-glow)] disabled:opacity-50"
                                        >
                                            {getAvailableFormats(file.originalType).map(format => (
                                                <option key={format} value={format}>.{format}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Status */}
                                    <div className="w-24 flex items-center justify-center">
                                        {file.status === 'pending' && (
                                            <span className="text-xs text-[var(--color-using-amber)]">Ready</span>
                                        )}
                                        {file.status === 'converting' && (
                                            <div className="flex items-center gap-2">
                                                <Loader2 size={14} className="animate-spin text-[var(--color-using-amber)]" />
                                                <span className="text-xs text-[var(--color-using-amber)]">{file.progress}%</span>
                                            </div>
                                        )}
                                        {file.status === 'done' && (
                                            <div className="flex items-center gap-1 text-[var(--color-active-green)]">
                                                <Check size={14} />
                                                <span className="text-xs">Done</span>
                                            </div>
                                        )}
                                        {file.status === 'error' && (
                                            <div className="flex items-center gap-1 text-[var(--color-inactive-red)]">
                                                <AlertCircle size={14} />
                                                <span className="text-xs">Error</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {file.status === 'done' && (
                                            <button
                                                onClick={() => downloadFile(file)}
                                                className="p-2 rounded-lg text-[var(--color-active-green)] hover:bg-[var(--color-dark-500)] transition-colors"
                                                title="Download"
                                            >
                                                <Download size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => removeFile(file.id)}
                                            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-inactive-red)] hover:bg-[var(--color-dark-500)] transition-colors"
                                            title="Remove"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Supported Formats Info */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-[var(--color-dark-700)]/50 border border-[var(--color-dark-500)]">
                        <div className="flex items-center gap-3 mb-3">
                            <Music size={20} className="text-green-400" />
                            <h3 className="font-semibold text-white">Audio Formats</h3>
                        </div>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            MP3, WAV, OGG, AAC, M4A, FLAC
                        </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-[var(--color-dark-700)]/50 border border-[var(--color-dark-500)]">
                        <div className="flex items-center gap-3 mb-3">
                            <FileVideo size={20} className="text-purple-400" />
                            <h3 className="font-semibold text-white">Video Formats</h3>
                        </div>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            MP4, WebM, AVI, MOV, MKV → Audio extraction
                        </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-[var(--color-dark-700)]/50 border border-[var(--color-dark-500)]">
                        <div className="flex items-center gap-3 mb-3">
                            <FileImage size={20} className="text-blue-400" />
                            <h3 className="font-semibold text-white">Image Formats</h3>
                        </div>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            PNG, JPG, WebP, GIF, BMP
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
