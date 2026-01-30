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

const getFileIcon = (type: string) => {
    if (type.startsWith('audio/')) return <Music size={18} className="text-green-400" />;
    if (type.startsWith('video/')) return <FileVideo size={18} className="text-purple-400" />;
    if (type.startsWith('image/')) return <FileImage size={18} className="text-blue-400" />;
    return <File size={18} className="text-gray-400" />;
};

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export function FileConverterPage() {
    const [files, setFiles] = useState<ConvertedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
    const [ffmpegLoading, setFfmpegLoading] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const ffmpegRef = useRef<FFmpeg | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const loadAttempted = useRef(false);

    useEffect(() => {
        if (!loadAttempted.current) {
            loadAttempted.current = true;
            loadFFmpeg();
        }
    }, []);

    const loadFFmpeg = async () => {
        if (ffmpegRef.current || ffmpegLoading) return;

        setFfmpegLoading(true);

        try {
            const ffmpeg = new FFmpeg();

            ffmpeg.on('progress', ({ progress }) => {
                setFiles(prev => prev.map(f =>
                    f.status === 'converting' ? { ...f, progress: Math.round(progress * 100) } : f
                ));
            });

            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
            const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
            const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');

            await ffmpeg.load({ coreURL, wasmURL });

            ffmpegRef.current = ffmpeg;
            setFfmpegLoaded(true);
        } catch (error) {
            console.error('Failed to load FFmpeg:', error);
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
            fileStore.set(id, file);
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
        if (type.startsWith('video/')) return 'mp3';
        return 'mp3';
    };

    const getAvailableFormats = (type: string): string[] => {
        if (type.startsWith('audio/')) return audioFormats;
        if (type.startsWith('video/')) return [...audioFormats, ...videoFormats];
        return audioFormats;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(Array.from(e.target.files));
        }
    };

    const updateFileFormat = (id: string, format: string) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, outputFormat: format } : f));
    };

    const removeFile = (id: string) => {
        setFiles(prev => {
            const file = prev.find(f => f.id === id);
            if (file?.outputUrl) URL.revokeObjectURL(file.outputUrl);
            fileStore.delete(id);
            return prev.filter(f => f.id !== id);
        });
    };

    const convertFile = async (fileData: ConvertedFile) => {
        if (!ffmpegRef.current) return;

        const originalFile = fileStore.get(fileData.id);
        if (!originalFile) {
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
            const fileBytes = await fetchFile(originalFile);
            await ffmpeg.writeFile(inputFileName, fileBytes);

            let command: string[];
            if (audioFormats.includes(fileData.outputFormat)) {
                command = ['-i', inputFileName, '-vn'];
                switch (fileData.outputFormat) {
                    case 'mp3': command.push('-acodec', 'libmp3lame', '-q:a', '2'); break;
                    case 'wav': command.push('-acodec', 'pcm_s16le'); break;
                    case 'ogg': command.push('-acodec', 'libvorbis', '-q:a', '4'); break;
                    case 'aac': case 'm4a': command.push('-acodec', 'aac', '-b:a', '192k'); break;
                    case 'flac': command.push('-acodec', 'flac'); break;
                    default: command.push('-acodec', 'copy');
                }
                command.push(outputFileName);
            } else {
                command = ['-i', inputFileName, outputFileName];
            }

            await ffmpeg.exec(command);

            const data = await ffmpeg.readFile(outputFileName);
            const mimeType = audioFormats.includes(fileData.outputFormat)
                ? `audio/${fileData.outputFormat}` : `video/${fileData.outputFormat}`;
            const blob = new Blob([data as BlobPart], { type: mimeType });
            const url = URL.createObjectURL(blob);

            setFiles(prev => prev.map(f =>
                f.id === fileData.id ? { ...f, status: 'done', progress: 100, outputBlob: blob, outputUrl: url } : f
            ));

            await ffmpeg.deleteFile(inputFileName);
            await ffmpeg.deleteFile(outputFileName);
        } catch (error) {
            console.error('Conversion error:', error);
            setFiles(prev => prev.map(f =>
                f.id === fileData.id ? { ...f, status: 'error', error: 'Conversion failed' } : f
            ));
        }
    };

    const convertAll = async () => {
        if (!ffmpegLoaded) {
            await loadFFmpeg();
            if (!ffmpegRef.current) {
                alert('Conversion engine failed to load. Please refresh the page.');
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
        <div className="h-[calc(100vh-140px)] flex flex-col py-6 px-8">
            <div className="max-w-4xl mx-auto w-full flex flex-col h-full">
                {/* Compact Header */}
                <div className="text-center mb-4 flex-shrink-0">
                    <div className="flex items-center justify-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-xl glow-border flex items-center justify-center">
                            <FileAudio size={24} className="text-white" />
                        </div>
                        <div className="text-left">
                            <h1 className="text-2xl font-bold text-white">File Converter</h1>
                            <div className="flex items-center gap-2">
                                {ffmpegLoading ? (
                                    <>
                                        <Loader2 size={12} className="animate-spin text-[var(--color-using-amber)]" />
                                        <span className="text-xs text-[var(--color-text-muted)]">Loading engine...</span>
                                    </>
                                ) : ffmpegLoaded ? (
                                    <>
                                        <div className="status-bulb active w-2 h-2" />
                                        <span className="text-xs text-[var(--color-text-muted)]">Ready</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="status-bulb inactive w-2 h-2" />
                                        <span className="text-xs text-[var(--color-inactive-red)]">Click Convert to load</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-h-0">
                    {files.length === 0 ? (
                        /* Upload Area - Full height when empty */
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                                flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all
                                ${isDragging
                                    ? 'border-[var(--color-glow)] bg-[var(--color-glow)]/5'
                                    : 'border-[var(--color-dark-400)] hover:border-[var(--color-dark-300)] bg-[var(--color-dark-700)]/50'
                                }
                            `}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="audio/*,video/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Upload size={48} className="mb-4 text-[var(--color-text-muted)]" />
                            <h3 className="text-lg font-semibold text-white mb-2">Drag & drop files here</h3>
                            <p className="text-sm text-[var(--color-text-muted)]">or click to browse • Audio & Video files</p>
                        </div>
                    ) : (
                        /* Files List */
                        <div className="flex-1 flex flex-col min-h-0">
                            {/* Actions Bar */}
                            <div className="flex items-center justify-between mb-3 flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-[var(--color-text-secondary)]">
                                        {files.length} file{files.length !== 1 ? 's' : ''}
                                    </span>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-xs text-[var(--color-glow)] hover:underline"
                                    >
                                        + Add more
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept="audio/*,video/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={clearAll}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-dark-500)] transition-colors"
                                    >
                                        <Trash2 size={14} />
                                        Clear
                                    </button>
                                    {hasDoneFiles && (
                                        <button
                                            onClick={() => files.filter(f => f.status === 'done').forEach(downloadFile)}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-[var(--color-dark-500)] text-white hover:bg-[var(--color-dark-400)] transition-colors"
                                        >
                                            <Download size={14} />
                                            Download All
                                        </button>
                                    )}
                                    {hasPendingFiles && (
                                        <button
                                            onClick={convertAll}
                                            disabled={isConverting}
                                            className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-active-green)] text-black hover:bg-[var(--color-active-green)]/90 transition-all disabled:opacity-50 shadow-[0_0_15px_var(--color-active-green-glow)]"
                                        >
                                            {isConverting ? (
                                                <><Loader2 size={14} className="animate-spin" /> Converting...</>
                                            ) : (
                                                <><RefreshCw size={14} /> Convert All</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Scrollable Files List */}
                            <div className="flex-1 overflow-y-auto rounded-xl border border-[var(--color-dark-500)] bg-[var(--color-dark-700)]">
                                {files.map((file, index) => (
                                    <div
                                        key={file.id}
                                        className={`flex items-center gap-3 px-4 py-3 ${index !== files.length - 1 ? 'border-b border-[var(--color-dark-500)]' : ''}`}
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-[var(--color-dark-600)] flex items-center justify-center flex-shrink-0">
                                            {getFileIcon(file.originalType)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{file.originalName}</p>
                                            <p className="text-xs text-[var(--color-text-muted)]">{formatFileSize(file.originalSize)}</p>
                                        </div>
                                        <span className="text-xs text-[var(--color-text-muted)]">→</span>
                                        <select
                                            value={file.outputFormat}
                                            onChange={(e) => updateFileFormat(file.id, e.target.value)}
                                            disabled={file.status !== 'pending'}
                                            className="px-2 py-1 rounded text-xs bg-[var(--color-dark-600)] text-white border border-[var(--color-dark-400)] focus:outline-none disabled:opacity-50"
                                        >
                                            {getAvailableFormats(file.originalType).map(format => (
                                                <option key={format} value={format}>.{format}</option>
                                            ))}
                                        </select>
                                        <div className="w-20 flex items-center justify-center flex-shrink-0">
                                            {file.status === 'pending' && <span className="text-xs text-[var(--color-using-amber)]">Ready</span>}
                                            {file.status === 'converting' && (
                                                <div className="flex items-center gap-1">
                                                    <Loader2 size={12} className="animate-spin text-[var(--color-using-amber)]" />
                                                    <span className="text-xs text-[var(--color-using-amber)]">{file.progress}%</span>
                                                </div>
                                            )}
                                            {file.status === 'done' && (
                                                <div className="flex items-center gap-1 text-[var(--color-active-green)]">
                                                    <Check size={12} /><span className="text-xs">Done</span>
                                                </div>
                                            )}
                                            {file.status === 'error' && (
                                                <div className="flex items-center gap-1 text-[var(--color-inactive-red)]">
                                                    <AlertCircle size={12} /><span className="text-xs">Error</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            {file.status === 'done' && (
                                                <button onClick={() => downloadFile(file)} className="p-1.5 rounded text-[var(--color-active-green)] hover:bg-[var(--color-dark-500)]">
                                                    <Download size={16} />
                                                </button>
                                            )}
                                            <button onClick={() => removeFile(file.id)} className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-inactive-red)] hover:bg-[var(--color-dark-500)]">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Compact Format Info */}
                <div className="flex items-center justify-center gap-6 mt-4 flex-shrink-0">
                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                        <Music size={14} className="text-green-400" />
                        <span>MP3, WAV, OGG, AAC, FLAC</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                        <FileVideo size={14} className="text-purple-400" />
                        <span>MP4, WebM, AVI, MOV → Audio</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
