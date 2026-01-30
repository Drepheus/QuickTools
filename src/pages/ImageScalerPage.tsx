import { useState, useCallback, useRef } from 'react';
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
    RotateCcw
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
    { name: 'Twitter Post', width: 1200, height: 675, icon: '🐦' },
    { name: 'LinkedIn Post', width: 1200, height: 627, icon: '💼' },
    { name: 'YouTube Thumbnail', width: 1280, height: 720, icon: '▶️' },
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
    const [selectedPreset, setSelectedPreset] = useState<Preset>(presets[6]); // Ad Square default
    const [customWidth, setCustomWidth] = useState(640);
    const [customHeight, setCustomHeight] = useState(640);
    const [maintainAspectRatio, setMaintainAspectRatio] = useState(false);
    const [outputFormat, setOutputFormat] = useState<'png' | 'jpg' | 'webp'>('png');
    const [quality, setQuality] = useState(92);
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewImage, setPreviewImage] = useState<ScaledImage | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const targetWidth = selectedPreset.width || customWidth;
    const targetHeight = selectedPreset.height || customHeight;

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

                // Fill with white/transparent background
                if (outputFormat === 'jpg') {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                // Center the image if aspect ratio is maintained
                const x = (canvas.width - finalWidth) / 2;
                const y = (canvas.height - finalHeight) / 2;

                // Use high-quality scaling
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, x, y, finalWidth, finalHeight);

                const mimeType = outputFormat === 'jpg' ? 'image/jpeg' : `image/${outputFormat}`;
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const outputUrl = URL.createObjectURL(blob);
                            resolve({
                                ...image,
                                status: 'done',
                                outputUrl,
                                outputBlob: blob,
                                outputSize: blob.size,
                            });
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

        // Update all images with current target dimensions
        const updatedImages = images.map(img => ({
            ...img,
            targetWidth,
            targetHeight,
            status: 'processing' as const,
        }));
        setImages(updatedImages);

        // Process each image
        const results: ScaledImage[] = [];
        for (const image of updatedImages) {
            const result = await scaleImage(image);
            results.push(result);
            setImages(prev => prev.map(img => img.id === result.id ? result : img));
        }

        setIsProcessing(false);
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
    };

    const resetSettings = () => {
        setSelectedPreset(presets[6]);
        setCustomWidth(640);
        setCustomHeight(640);
        setMaintainAspectRatio(false);
        setOutputFormat('png');
        setQuality(92);
    };

    return (
        <div className="min-h-[calc(100vh-180px)] py-12 px-8">
            <div className="max-w-6xl mx-auto">
                {/* Page Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glow-border mb-6">
                        <ImageIcon size={32} className="text-[var(--color-glow)]" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">Image Scaler</h1>
                    <p className="text-[var(--color-text-secondary)] max-w-xl mx-auto">
                        Resize multiple images to exact dimensions instantly. Perfect for ads, social media,
                        and any platform with specific size requirements.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Settings */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Size Presets */}
                        <div className="p-6 rounded-2xl bg-[var(--color-dark-700)] border border-[var(--color-dark-500)]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-white">Size Preset</h3>
                                <button
                                    onClick={resetSettings}
                                    className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-dark-500)] transition-colors"
                                    title="Reset settings"
                                >
                                    <RotateCcw size={16} />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {presets.map((preset) => (
                                    <button
                                        key={preset.name}
                                        onClick={() => setSelectedPreset(preset)}
                                        className={`p-3 rounded-xl text-left transition-all ${selectedPreset.name === preset.name
                                            ? 'bg-[var(--color-accent-primary)] text-white'
                                            : 'bg-[var(--color-dark-600)] text-[var(--color-text-secondary)] hover:bg-[var(--color-dark-500)]'
                                            }`}
                                    >
                                        <span className="text-lg">{preset.icon}</span>
                                        <p className="text-xs font-medium mt-1 truncate">{preset.name}</p>
                                        {preset.width > 0 && (
                                            <p className="text-xs opacity-70">{preset.width}×{preset.height}</p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Dimensions */}
                        <div className="p-6 rounded-2xl bg-[var(--color-dark-700)] border border-[var(--color-dark-500)]">
                            <h3 className="font-semibold text-white mb-4">Dimensions</h3>
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Width</label>
                                    <input
                                        type="number"
                                        value={selectedPreset.width || customWidth}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 0;
                                            setCustomWidth(val);
                                            setSelectedPreset(presets.find(p => p.name === 'Custom')!);
                                        }}
                                        className="w-full px-3 py-2 rounded-lg bg-[var(--color-dark-600)] text-white border border-[var(--color-dark-400)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                                    />
                                </div>
                                <div className="pt-5">
                                    <button
                                        onClick={() => setMaintainAspectRatio(!maintainAspectRatio)}
                                        className={`p-2 rounded-lg transition-colors ${maintainAspectRatio
                                            ? 'bg-[var(--color-accent-primary)] text-white'
                                            : 'bg-[var(--color-dark-600)] text-[var(--color-text-muted)]'
                                            }`}
                                        title={maintainAspectRatio ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
                                    >
                                        {maintainAspectRatio ? <Link2 size={18} /> : <Link2Off size={18} />}
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Height</label>
                                    <input
                                        type="number"
                                        value={selectedPreset.height || customHeight}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 0;
                                            setCustomHeight(val);
                                            setSelectedPreset(presets.find(p => p.name === 'Custom')!);
                                        }}
                                        className="w-full px-3 py-2 rounded-lg bg-[var(--color-dark-600)] text-white border border-[var(--color-dark-400)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                                    />
                                </div>
                            </div>

                            {/* Aspect Ratio Info */}
                            <div className="mt-3 flex items-center gap-2">
                                <div className={`status-bulb ${maintainAspectRatio ? 'active' : 'inactive'} w-2 h-2`} />
                                <span className="text-xs text-[var(--color-text-muted)]">
                                    {maintainAspectRatio ? 'Fit image within bounds, centered' : 'Stretch to exact dimensions'}
                                </span>
                            </div>
                        </div>

                        {/* Output Options */}
                        <div className="p-6 rounded-2xl bg-[var(--color-dark-700)] border border-[var(--color-dark-500)]">
                            <h3 className="font-semibold text-white mb-4">Output Options</h3>

                            <div className="mb-4">
                                <label className="text-xs text-[var(--color-text-muted)] mb-2 block">Format</label>
                                <div className="flex gap-2">
                                    {(['png', 'jpg', 'webp'] as const).map((format) => (
                                        <button
                                            key={format}
                                            onClick={() => setOutputFormat(format)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${outputFormat === format
                                                ? 'bg-[var(--color-accent-primary)] text-white'
                                                : 'bg-[var(--color-dark-600)] text-[var(--color-text-secondary)] hover:bg-[var(--color-dark-500)]'
                                                }`}
                                        >
                                            {format.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs text-[var(--color-text-muted)]">Quality</label>
                                    <span className="text-xs text-white font-medium">{quality}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    value={quality}
                                    onChange={(e) => setQuality(parseInt(e.target.value))}
                                    className="w-full h-2 rounded-full bg-[var(--color-dark-500)] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-accent-primary)]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Upload & Images */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Upload Area */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
                ${isDragging
                                    ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/5'
                                    : 'border-[var(--color-dark-400)] hover:border-[var(--color-dark-300)] bg-[var(--color-dark-700)]/50'
                                }
              `}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Upload size={48} className={`mx-auto mb-4 ${isDragging ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-muted)]'}`} />
                            <h3 className="text-lg font-semibold text-white mb-2">
                                {isDragging ? 'Drop images here' : 'Drag & drop images here'}
                            </h3>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                or click to browse • PNG, JPG, WebP, GIF supported
                            </p>
                        </div>

                        {/* Images Grid */}
                        {images.length > 0 && (
                            <div>
                                {/* Actions Bar */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-[var(--color-text-secondary)]">
                                        {images.length} image{images.length !== 1 ? 's' : ''} • Output: {targetWidth}×{targetHeight}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={clearAll}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-dark-500)] transition-colors"
                                        >
                                            <Trash2 size={16} />
                                            Clear All
                                        </button>
                                        {images.some(img => img.status === 'done') && (
                                            <button
                                                onClick={downloadAllAsZip}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-[var(--color-dark-500)] text-white hover:bg-[var(--color-dark-400)] transition-colors"
                                            >
                                                <Download size={16} />
                                                Download ZIP
                                            </button>
                                        )}
                                        <button
                                            onClick={processAllImages}
                                            disabled={isProcessing || images.length === 0}
                                            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium glow-button text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <ZoomIn size={16} />
                                                    Scale All
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Images Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {images.map((image) => (
                                        <div
                                            key={image.id}
                                            className="relative group rounded-xl overflow-hidden bg-[var(--color-dark-700)] border border-[var(--color-dark-500)]"
                                        >
                                            {/* Image Preview */}
                                            <div
                                                className="aspect-square relative cursor-pointer"
                                                onClick={() => setPreviewImage(image)}
                                            >
                                                <img
                                                    src={image.outputUrl || image.originalUrl}
                                                    alt={image.originalName}
                                                    className="w-full h-full object-cover"
                                                />

                                                {/* Status Overlay */}
                                                {image.status === 'processing' && (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                        <Loader2 size={24} className="animate-spin text-white" />
                                                    </div>
                                                )}
                                                {image.status === 'done' && (
                                                    <div className="absolute top-2 right-2">
                                                        <div className="w-6 h-6 rounded-full bg-[var(--color-active-green)] flex items-center justify-center">
                                                            <Check size={14} className="text-black" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info Bar */}
                                            <div className="p-2">
                                                <p className="text-xs text-white truncate font-medium">{image.originalName}</p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-xs text-[var(--color-text-muted)]">
                                                        {image.originalWidth}×{image.originalHeight}
                                                    </span>
                                                    {image.outputSize && (
                                                        <span className="text-xs text-[var(--color-active-green)]">
                                                            {formatFileSize(image.outputSize)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Hover Actions */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                {image.status === 'done' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); downloadImage(image); }}
                                                        className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                                                        title="Download"
                                                    >
                                                        <Download size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeImage(image.id); }}
                                                    className="p-2 rounded-lg bg-white/20 text-white hover:bg-red-500/80 transition-colors"
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
                    </div>
                </div>

                {/* Preview Modal */}
                {previewImage && (
                    <div
                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
                        onClick={() => setPreviewImage(null)}
                    >
                        <div className="relative max-w-4xl max-h-full">
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="absolute -top-12 right-0 p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <img
                                src={previewImage.outputUrl || previewImage.originalUrl}
                                alt={previewImage.originalName}
                                className="max-w-full max-h-[80vh] rounded-xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <div className="mt-4 text-center">
                                <p className="text-white font-medium">{previewImage.originalName}</p>
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    {previewImage.outputUrl ? `${previewImage.targetWidth}×${previewImage.targetHeight}` : `${previewImage.originalWidth}×${previewImage.originalHeight}`}
                                    {previewImage.outputSize && ` • ${formatFileSize(previewImage.outputSize)}`}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    );
}
