import { useState, useCallback, useRef, useEffect } from 'react';
import {
    ImageIcon,
    Upload,
    Download,
    Trash2,
    Check,
    X,
    ZoomIn,
    Loader2,
    Link2,
    Link2Off,
    CheckCircle2,
    Sparkles
} from 'lucide-react';
import JSZip from 'jszip';

interface ScaledImage {
    id: string;
    originalName: string;
    originalWidth: number;
    originalHeight: number;
    originalSize: number;
    originalUrl: string;
    targetWidth: number;
    targetHeight: number;
    status: 'pending' | 'processing' | 'done' | 'error';
    outputUrl?: string;
    outputBlob?: Blob;
    outputSize?: number;
}

interface Preset {
    name: string;
    width: number;
    height: number;
    icon: string;
}

const presets: Preset[] = [
    { name: 'Instagram Post', width: 1080, height: 1080, icon: '📷' },
    { name: 'Instagram Story', width: 1080, height: 1920, icon: '📱' },
    { name: 'Facebook Ad', width: 1200, height: 628, icon: '📘' },
    { name: 'YouTube Thumb', width: 1280, height: 720, icon: '▶️' },
    { name: 'Ad Square', width: 640, height: 640, icon: '🎯' },
    { name: 'Custom', width: 0, height: 0, icon: '⚙️' },
];

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export function ImageScalerPage() {
    const [images, setImages] = useState<ScaledImage[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState<Preset>(presets[4]);
    const [customWidth, setCustomWidth] = useState(640);
    const [customHeight, setCustomHeight] = useState(640);
    const [maintainAspectRatio, setMaintainAspectRatio] = useState(false);
    const [outputFormat, setOutputFormat] = useState<'png' | 'jpg' | 'webp'>('png');
    const [quality, setQuality] = useState(92);
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewImage, setPreviewImage] = useState<ScaledImage | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successCount, setSuccessCount] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const targetWidth = selectedPreset.width || customWidth;
    const targetHeight = selectedPreset.height || customHeight;

    // Auto-hide success notification
    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => setShowSuccess(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

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
        const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        addImages(droppedFiles);
    }, []);

    const addImages = async (files: File[]) => {
        const newImages: ScaledImage[] = [];
        for (const file of files) {
            const url = URL.createObjectURL(file);
            const dimensions = await getImageDimensions(url);
            newImages.push({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                originalName: file.name,
                originalWidth: dimensions.width,
                originalHeight: dimensions.height,
                originalSize: file.size,
                originalUrl: url,
                targetWidth,
                targetHeight,
                status: 'pending',
            });
        }
        setImages(prev => [...prev, ...newImages]);
    };

    const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.src = url;
        });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const imageFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
            addImages(imageFiles);
        }
    };

    const scaleImage = async (image: ScaledImage): Promise<ScaledImage> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d')!;

                let finalWidth = image.targetWidth;
                let finalHeight = image.targetHeight;

                if (maintainAspectRatio) {
                    const aspectRatio = img.width / img.height;
                    if (finalWidth / finalHeight > aspectRatio) {
                        finalWidth = Math.round(finalHeight * aspectRatio);
                    } else {
                        finalHeight = Math.round(finalWidth / aspectRatio);
                    }
                }

                canvas.width = image.targetWidth;
                canvas.height = image.targetHeight;

                if (outputFormat === 'jpg') {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                const x = (canvas.width - finalWidth) / 2;
                const y = (canvas.height - finalHeight) / 2;

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, x, y, finalWidth, finalHeight);

                const mimeType = outputFormat === 'jpg' ? 'image/jpeg' : `image/${outputFormat}`;
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const outputUrl = URL.createObjectURL(blob);
                            resolve({ ...image, status: 'done', outputUrl, outputBlob: blob, outputSize: blob.size });
                        } else {
                            resolve({ ...image, status: 'error' });
                        }
                    },
                    mimeType,
                    quality / 100
                );
            };
            img.onerror = () => resolve({ ...image, status: 'error' });
            img.src = image.originalUrl;
        });
    };

    const processAllImages = async () => {
        setIsProcessing(true);
        setShowSuccess(false);

        const updatedImages = images.map(img => ({
            ...img,
            targetWidth,
            targetHeight,
            status: 'processing' as const,
        }));
        setImages(updatedImages);

        let doneCount = 0;
        for (const image of updatedImages) {
            const result = await scaleImage(image);
            if (result.status === 'done') doneCount++;
            setImages(prev => prev.map(img => img.id === result.id ? result : img));
        }

        setIsProcessing(false);
        setSuccessCount(doneCount);
        setShowSuccess(true);
    };

    const downloadImage = (image: ScaledImage) => {
        if (!image.outputUrl) return;
        const extension = outputFormat === 'jpg' ? 'jpg' : outputFormat;
        const baseName = image.originalName.replace(/\.[^/.]+$/, '');
        const link = document.createElement('a');
        link.href = image.outputUrl;
        link.download = `${baseName}_${image.targetWidth}x${image.targetHeight}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadAllAsZip = async () => {
        const doneImages = images.filter(img => img.status === 'done' && img.outputBlob);
        if (doneImages.length === 0) return;

        const zip = new JSZip();
        const extension = outputFormat === 'jpg' ? 'jpg' : outputFormat;

        doneImages.forEach((image) => {
            if (image.outputBlob) {
                const baseName = image.originalName.replace(/\.[^/.]+$/, '');
                zip.file(`${baseName}_${image.targetWidth}x${image.targetHeight}.${extension}`, image.outputBlob);
            }
        });

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `scaled_images_${targetWidth}x${targetHeight}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const removeImage = (id: string) => {
        setImages(prev => {
            const image = prev.find(img => img.id === id);
            if (image) {
                URL.revokeObjectURL(image.originalUrl);
                if (image.outputUrl) URL.revokeObjectURL(image.outputUrl);
            }
            return prev.filter(img => img.id !== id);
        });
    };

    const clearAll = () => {
        images.forEach(img => {
            URL.revokeObjectURL(img.originalUrl);
            if (img.outputUrl) URL.revokeObjectURL(img.outputUrl);
        });
        setImages([]);
        setShowSuccess(false);
    };

    const doneCount = images.filter(img => img.status === 'done').length;
    const totalCount = images.length;

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col py-4 px-6 relative">
            {/* Success Toast Notification */}
            {showSuccess && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-[var(--color-active-green)] text-black shadow-[0_0_30px_var(--color-active-green-glow)]">
                        <CheckCircle2 size={22} />
                        <div>
                            <p className="font-semibold">Scaling Complete!</p>
                            <p className="text-sm opacity-80">{successCount} image{successCount !== 1 ? 's' : ''} scaled successfully</p>
                        </div>
                        <button onClick={() => setShowSuccess(false)} className="ml-2 p-1 rounded hover:bg-black/10">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto w-full flex flex-col h-full">
                {/* Compact Header */}
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl glow-border flex items-center justify-center">
                            <ImageIcon size={20} className="text-[var(--color-glow)]" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Image Scaler</h1>
                            <p className="text-xs text-[var(--color-text-muted)]">Resize images to exact dimensions</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Status Summary */}
                        {totalCount > 0 && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-dark-600)]">
                                {doneCount === totalCount && doneCount > 0 ? (
                                    <>
                                        <Check size={14} className="text-[var(--color-active-green)]" />
                                        <span className="text-xs text-[var(--color-active-green)] font-medium">All Done!</span>
                                    </>
                                ) : (
                                    <span className="text-xs text-[var(--color-text-muted)]">
                                        {doneCount}/{totalCount} scaled
                                    </span>
                                )}
                            </div>
                        )}
                        <div className="text-sm text-[var(--color-text-secondary)]">
                            Output: <span className="text-white font-medium">{targetWidth}×{targetHeight}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content - Grid */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
                    {/* Left: Settings Panel */}
                    <div className="lg:col-span-1 flex flex-col gap-3 overflow-y-auto">
                        {/* Presets */}
                        <div className="p-3 rounded-xl bg-[var(--color-dark-700)] border border-[var(--color-dark-500)]">
                            <h3 className="text-xs font-semibold text-white mb-2">Presets</h3>
                            <div className="grid grid-cols-2 gap-1.5">
                                {presets.map((preset) => (
                                    <button
                                        key={preset.name}
                                        onClick={() => setSelectedPreset(preset)}
                                        className={`p-2 rounded-lg text-left transition-all text-xs ${selectedPreset.name === preset.name
                                                ? 'bg-[var(--color-glow)]/20 border border-[var(--color-glow)] text-white'
                                                : 'bg-[var(--color-dark-600)] text-[var(--color-text-secondary)] hover:bg-[var(--color-dark-500)]'
                                            }`}
                                    >
                                        <span>{preset.icon}</span>
                                        <p className="font-medium truncate">{preset.name}</p>
                                        {preset.width > 0 && <p className="text-[10px] opacity-70">{preset.width}×{preset.height}</p>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Dimensions */}
                        <div className="p-3 rounded-xl bg-[var(--color-dark-700)] border border-[var(--color-dark-500)]">
                            <h3 className="text-xs font-semibold text-white mb-2">Dimensions</h3>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={selectedPreset.width || customWidth}
                                    onChange={(e) => {
                                        setCustomWidth(parseInt(e.target.value) || 0);
                                        setSelectedPreset(presets.find(p => p.name === 'Custom')!);
                                    }}
                                    className="w-full px-2 py-1.5 rounded text-xs bg-[var(--color-dark-600)] text-white border border-[var(--color-dark-400)] focus:outline-none focus:border-[var(--color-glow)]"
                                    placeholder="Width"
                                />
                                <button
                                    onClick={() => setMaintainAspectRatio(!maintainAspectRatio)}
                                    className={`p-1.5 rounded transition-colors flex-shrink-0 ${maintainAspectRatio ? 'bg-[var(--color-glow)]/20 text-[var(--color-glow)]' : 'bg-[var(--color-dark-600)] text-[var(--color-text-muted)]'
                                        }`}
                                >
                                    {maintainAspectRatio ? <Link2 size={14} /> : <Link2Off size={14} />}
                                </button>
                                <input
                                    type="number"
                                    value={selectedPreset.height || customHeight}
                                    onChange={(e) => {
                                        setCustomHeight(parseInt(e.target.value) || 0);
                                        setSelectedPreset(presets.find(p => p.name === 'Custom')!);
                                    }}
                                    className="w-full px-2 py-1.5 rounded text-xs bg-[var(--color-dark-600)] text-white border border-[var(--color-dark-400)] focus:outline-none focus:border-[var(--color-glow)]"
                                    placeholder="Height"
                                />
                            </div>
                        </div>

                        {/* Output Options */}
                        <div className="p-3 rounded-xl bg-[var(--color-dark-700)] border border-[var(--color-dark-500)]">
                            <h3 className="text-xs font-semibold text-white mb-2">Output</h3>
                            <div className="flex gap-1 mb-2">
                                {(['png', 'jpg', 'webp'] as const).map((format) => (
                                    <button
                                        key={format}
                                        onClick={() => setOutputFormat(format)}
                                        className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${outputFormat === format
                                                ? 'bg-[var(--color-glow)]/20 text-[var(--color-glow)] border border-[var(--color-glow)]'
                                                : 'bg-[var(--color-dark-600)] text-[var(--color-text-secondary)]'
                                            }`}
                                    >
                                        {format.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-[var(--color-text-muted)]">Quality</span>
                                <span className="text-xs text-white">{quality}%</span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={quality}
                                onChange={(e) => setQuality(parseInt(e.target.value))}
                                className="w-full h-1.5 mt-1 rounded-full bg-[var(--color-dark-500)] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-glow)]"
                            />
                        </div>
                    </div>

                    {/* Right: Upload & Images */}
                    <div className="lg:col-span-3 flex flex-col min-h-0">
                        {images.length === 0 ? (
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${isDragging
                                        ? 'border-[var(--color-glow)] bg-[var(--color-glow)]/5'
                                        : 'border-[var(--color-dark-400)] hover:border-[var(--color-dark-300)] bg-[var(--color-dark-700)]/50'
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <Upload size={40} className="mb-3 text-[var(--color-text-muted)]" />
                                <h3 className="text-base font-semibold text-white mb-1">Drop images here</h3>
                                <p className="text-xs text-[var(--color-text-muted)]">or click to browse</p>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full min-h-0">
                                {/* Actions */}
                                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-[var(--color-text-secondary)]">{images.length} image{images.length !== 1 ? 's' : ''}</span>
                                        <button onClick={() => fileInputRef.current?.click()} className="text-xs text-[var(--color-glow)] hover:underline">+ Add</button>
                                        <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={clearAll} className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-dark-500)]">
                                            <Trash2 size={12} /> Clear
                                        </button>
                                        {images.some(img => img.status === 'done') && (
                                            <button onClick={downloadAllAsZip} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-[var(--color-active-green)] text-black shadow-[0_0_15px_var(--color-active-green-glow)]">
                                                <Download size={12} /> Download All ({doneCount})
                                            </button>
                                        )}
                                        {images.some(img => img.status === 'pending') && (
                                            <button
                                                onClick={processAllImages}
                                                disabled={isProcessing}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium glow-button text-white disabled:opacity-50"
                                            >
                                                {isProcessing ? <><Loader2 size={12} className="animate-spin" /> Processing...</> : <><ZoomIn size={12} /> Scale All</>}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Images Grid */}
                                <div className="flex-1 overflow-y-auto rounded-xl border border-[var(--color-dark-500)] bg-[var(--color-dark-700)] p-2">
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                        {images.map((image) => (
                                            <div
                                                key={image.id}
                                                className={`relative group rounded-lg overflow-hidden aspect-square transition-all duration-300 ${image.status === 'done'
                                                        ? 'ring-2 ring-[var(--color-active-green)] shadow-[0_0_15px_var(--color-active-green-glow)]'
                                                        : 'bg-[var(--color-dark-600)]'
                                                    }`}
                                            >
                                                <img
                                                    src={image.outputUrl || image.originalUrl}
                                                    alt={image.originalName}
                                                    className="w-full h-full object-cover cursor-pointer"
                                                    onClick={() => setPreviewImage(image)}
                                                />
                                                {image.status === 'processing' && (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                        <Loader2 size={20} className="animate-spin text-white" />
                                                    </div>
                                                )}
                                                {image.status === 'done' && (
                                                    <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[var(--color-active-green)] flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                                                        <Check size={14} className="text-black" />
                                                    </div>
                                                )}
                                                {image.status === 'done' && (
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                                                        <div className="flex items-center justify-center gap-1 text-[10px] text-[var(--color-active-green)] font-medium">
                                                            <Sparkles size={10} />
                                                            <span>Scaled</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                                    {image.status === 'done' && (
                                                        <button onClick={(e) => { e.stopPropagation(); downloadImage(image); }} className="p-1.5 rounded bg-[var(--color-active-green)] text-black hover:bg-[var(--color-active-green)]/80">
                                                            <Download size={14} />
                                                        </button>
                                                    )}
                                                    <button onClick={(e) => { e.stopPropagation(); removeImage(image.id); }} className="p-1.5 rounded bg-white/20 text-white hover:bg-red-500/80">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
                    <div className="relative max-w-3xl max-h-full">
                        <button onClick={() => setPreviewImage(null)} className="absolute -top-10 right-0 p-2 rounded text-white hover:bg-white/10">
                            <X size={20} />
                        </button>
                        <img
                            src={previewImage.outputUrl || previewImage.originalUrl}
                            alt={previewImage.originalName}
                            className="max-w-full max-h-[75vh] rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <div className="mt-2 text-center">
                            <p className="text-white text-sm font-medium">{previewImage.originalName}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">
                                {previewImage.outputUrl ? `${previewImage.targetWidth}×${previewImage.targetHeight}` : `${previewImage.originalWidth}×${previewImage.originalHeight}`}
                                {previewImage.outputSize && ` • ${formatFileSize(previewImage.outputSize)}`}
                            </p>
                            {previewImage.status === 'done' && (
                                <div className="mt-2 flex items-center justify-center gap-1 text-[var(--color-active-green)]">
                                    <CheckCircle2 size={14} />
                                    <span className="text-xs font-medium">Successfully Scaled</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
