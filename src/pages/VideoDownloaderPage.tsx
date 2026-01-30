import { useState } from 'react';
import {
    Video,
    Download,
    Trash2,
    Link,
    Loader2,
    Check,
    AlertCircle,
    Play,
    Music,
    Film,
    Clock,
    Eye
} from 'lucide-react';

interface VideoItem {
    id: string;
    url: string;
    title: string;
    thumbnail: string;
    duration: string;
    views: string;
    channel: string;
    status: 'pending' | 'fetching' | 'ready' | 'downloading' | 'done' | 'error';
    progress: number;
    selectedFormat: 'mp4' | 'mp3' | 'webm';
    selectedQuality: '1080p' | '720p' | '480p' | '360p';
    error?: string;
}

// Mock video data for demo
const mockVideos = [
    {
        title: 'Learn React in 30 Minutes - Complete Tutorial',
        thumbnail: 'https://picsum.photos/seed/react/320/180',
        duration: '32:45',
        views: '1.2M views',
        channel: 'Code Academy'
    },
    {
        title: 'The Future of AI: What You Need to Know',
        thumbnail: 'https://picsum.photos/seed/ai/320/180',
        duration: '15:22',
        views: '890K views',
        channel: 'Tech Insider'
    },
    {
        title: 'Beautiful Piano Music for Relaxation',
        thumbnail: 'https://picsum.photos/seed/piano/320/180',
        duration: '3:45:00',
        views: '5.4M views',
        channel: 'Peaceful Music'
    },
    {
        title: 'How to Build a Startup from Scratch',
        thumbnail: 'https://picsum.photos/seed/startup/320/180',
        duration: '28:15',
        views: '450K views',
        channel: 'Entrepreneur Daily'
    }
];

export function VideoDownloaderPage() {
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [urlInput, setUrlInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const addVideo = async () => {
        if (!urlInput.trim()) return;

        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newVideo: VideoItem = {
            id,
            url: urlInput,
            title: '',
            thumbnail: '',
            duration: '',
            views: '',
            channel: '',
            status: 'fetching',
            progress: 0,
            selectedFormat: 'mp4',
            selectedQuality: '720p'
        };

        setVideos(prev => [...prev, newVideo]);
        setUrlInput('');

        // Simulate fetching video info
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Use random mock data
        const mockData = mockVideos[Math.floor(Math.random() * mockVideos.length)];

        setVideos(prev => prev.map(v =>
            v.id === id ? {
                ...v,
                status: 'ready',
                ...mockData
            } : v
        ));
    };

    const downloadVideo = async (video: VideoItem) => {
        setVideos(prev => prev.map(v =>
            v.id === video.id ? { ...v, status: 'downloading', progress: 0 } : v
        ));

        // Simulate download progress
        for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 200));
            setVideos(prev => prev.map(v =>
                v.id === video.id ? { ...v, progress: i } : v
            ));
        }

        setVideos(prev => prev.map(v =>
            v.id === video.id ? { ...v, status: 'done', progress: 100 } : v
        ));

        // Show mock download message
        alert(`Mock Download Complete!\n\nIn the full version, "${video.title}" would be downloaded as ${video.selectedFormat.toUpperCase()} (${video.selectedQuality}).`);
    };

    const downloadAll = async () => {
        setIsProcessing(true);
        const readyVideos = videos.filter(v => v.status === 'ready');
        for (const video of readyVideos) {
            await downloadVideo(video);
        }
        setIsProcessing(false);
    };

    const updateVideoFormat = (id: string, format: 'mp4' | 'mp3' | 'webm') => {
        setVideos(prev => prev.map(v =>
            v.id === id ? { ...v, selectedFormat: format } : v
        ));
    };

    const updateVideoQuality = (id: string, quality: '1080p' | '720p' | '480p' | '360p') => {
        setVideos(prev => prev.map(v =>
            v.id === id ? { ...v, selectedQuality: quality } : v
        ));
    };

    const removeVideo = (id: string) => {
        setVideos(prev => prev.filter(v => v.id !== id));
    };

    const clearAll = () => {
        setVideos([]);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            addVideo();
        }
    };

    const readyCount = videos.filter(v => v.status === 'ready').length;
    const doneCount = videos.filter(v => v.status === 'done').length;

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col py-4 px-6">
            <div className="max-w-4xl mx-auto w-full flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl glow-border flex items-center justify-center">
                            <Video size={20} className="text-[var(--color-glow)]" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">Video Downloader</h1>
                            <p className="text-xs text-[var(--color-text-muted)]">Download videos from YouTube & more</p>
                        </div>
                    </div>
                    {videos.length > 0 && (
                        <div className="flex items-center gap-2">
                            {doneCount > 0 && (
                                <span className="text-xs text-[var(--color-active-green)] flex items-center gap-1">
                                    <Check size={12} /> {doneCount} downloaded
                                </span>
                            )}
                            <button
                                onClick={clearAll}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-dark-500)]"
                            >
                                <Trash2 size={14} /> Clear
                            </button>
                            {readyCount > 0 && (
                                <button
                                    onClick={downloadAll}
                                    disabled={isProcessing}
                                    className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium bg-[var(--color-active-green)] text-black shadow-[0_0_15px_var(--color-active-green-glow)] disabled:opacity-50"
                                >
                                    {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                    Download All ({readyCount})
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* URL Input */}
                <div className="mb-4 flex-shrink-0">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Link size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                            <input
                                type="text"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Paste YouTube or video URL here..."
                                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-[var(--color-dark-700)] text-white border border-[var(--color-dark-500)] focus:outline-none focus:border-[var(--color-glow)] placeholder-[var(--color-text-muted)]"
                            />
                        </div>
                        <button
                            onClick={addVideo}
                            disabled={!urlInput.trim()}
                            className="px-6 py-3 rounded-xl text-sm font-medium glow-button text-white disabled:opacity-50"
                        >
                            Add Video
                        </button>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-2">
                        Supports: YouTube, Vimeo, Dailymotion, and more
                    </p>
                </div>

                {/* Video List */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    {videos.length === 0 ? (
                        <div className="h-full rounded-xl border-2 border-dashed border-[var(--color-dark-500)] flex flex-col items-center justify-center">
                            <Play size={48} className="text-[var(--color-text-muted)] mb-3 opacity-30" />
                            <p className="text-sm text-[var(--color-text-muted)]">Paste a video URL to get started</p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">Your videos will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {videos.map(video => (
                                <div
                                    key={video.id}
                                    className={`p-4 rounded-xl bg-[var(--color-dark-700)] border transition-all ${video.status === 'done'
                                            ? 'border-[var(--color-active-green)] shadow-[0_0_15px_var(--color-active-green-glow)]'
                                            : 'border-[var(--color-dark-500)]'
                                        }`}
                                >
                                    {video.status === 'fetching' ? (
                                        <div className="flex items-center gap-4">
                                            <div className="w-32 h-20 rounded-lg bg-[var(--color-dark-600)] flex items-center justify-center">
                                                <Loader2 size={24} className="animate-spin text-[var(--color-text-muted)]" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-[var(--color-text-muted)]">Fetching video info...</p>
                                                <p className="text-xs text-[var(--color-text-muted)] truncate mt-1">{video.url}</p>
                                            </div>
                                        </div>
                                    ) : video.status === 'error' ? (
                                        <div className="flex items-center gap-4">
                                            <div className="w-32 h-20 rounded-lg bg-[var(--color-inactive-red)]/20 flex items-center justify-center">
                                                <AlertCircle size={24} className="text-[var(--color-inactive-red)]" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-[var(--color-inactive-red)]">Failed to fetch video</p>
                                                <p className="text-xs text-[var(--color-text-muted)]">{video.error || 'Unknown error'}</p>
                                            </div>
                                            <button
                                                onClick={() => removeVideo(video.id)}
                                                className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-inactive-red)] hover:bg-[var(--color-dark-500)]"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-4">
                                            {/* Thumbnail */}
                                            <div className="w-32 h-20 rounded-lg bg-[var(--color-dark-600)] overflow-hidden flex-shrink-0 relative">
                                                <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                                                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-white flex items-center gap-1">
                                                    <Clock size={10} /> {video.duration}
                                                </div>
                                                {video.status === 'done' && (
                                                    <div className="absolute inset-0 bg-[var(--color-active-green)]/20 flex items-center justify-center">
                                                        <Check size={24} className="text-[var(--color-active-green)]" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white line-clamp-2">{video.title}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs text-[var(--color-text-muted)]">{video.channel}</span>
                                                    <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                                                        <Eye size={10} /> {video.views}
                                                    </span>
                                                </div>

                                                {/* Options */}
                                                {(video.status === 'ready' || video.status === 'done') && (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <div className="flex gap-1">
                                                            {(['mp4', 'mp3', 'webm'] as const).map(format => (
                                                                <button
                                                                    key={format}
                                                                    onClick={() => updateVideoFormat(video.id, format)}
                                                                    disabled={video.status !== 'ready'}
                                                                    className={`px-2 py-1 rounded text-[10px] font-medium transition-colors flex items-center gap-1 ${video.selectedFormat === format
                                                                            ? 'bg-[var(--color-glow)]/20 text-[var(--color-glow)] border border-[var(--color-glow)]'
                                                                            : 'bg-[var(--color-dark-600)] text-[var(--color-text-muted)] disabled:opacity-50'
                                                                        }`}
                                                                >
                                                                    {format === 'mp3' ? <Music size={10} /> : <Film size={10} />}
                                                                    {format.toUpperCase()}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        {video.selectedFormat !== 'mp3' && (
                                                            <select
                                                                value={video.selectedQuality}
                                                                onChange={(e) => updateVideoQuality(video.id, e.target.value as any)}
                                                                disabled={video.status !== 'ready'}
                                                                className="px-2 py-1 rounded text-[10px] bg-[var(--color-dark-600)] text-white border border-[var(--color-dark-400)] focus:outline-none disabled:opacity-50"
                                                            >
                                                                <option value="1080p">1080p</option>
                                                                <option value="720p">720p</option>
                                                                <option value="480p">480p</option>
                                                                <option value="360p">360p</option>
                                                            </select>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Progress Bar */}
                                                {video.status === 'downloading' && (
                                                    <div className="mt-2">
                                                        <div className="h-1.5 rounded-full bg-[var(--color-dark-600)] overflow-hidden">
                                                            <div
                                                                className="h-full bg-[var(--color-glow)] transition-all duration-200"
                                                                style={{ width: `${video.progress}%` }}
                                                            />
                                                        </div>
                                                        <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Downloading... {video.progress}%</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {video.status === 'ready' && (
                                                    <button
                                                        onClick={() => downloadVideo(video)}
                                                        className="p-2 rounded-lg bg-[var(--color-active-green)] text-black hover:bg-[var(--color-active-green)]/80"
                                                    >
                                                        <Download size={18} />
                                                    </button>
                                                )}
                                                {video.status === 'downloading' && (
                                                    <Loader2 size={18} className="animate-spin text-[var(--color-glow)]" />
                                                )}
                                                {video.status === 'done' && (
                                                    <div className="p-2 rounded-lg bg-[var(--color-active-green)]/20 text-[var(--color-active-green)]">
                                                        <Check size={18} />
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => removeVideo(video.id)}
                                                    className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-inactive-red)] hover:bg-[var(--color-dark-500)]"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Disclaimer */}
                <div className="mt-4 pt-3 border-t border-[var(--color-dark-500)] flex-shrink-0">
                    <p className="text-[10px] text-[var(--color-text-muted)] text-center">
                        ⚠️ This tool is for personal use only. Please respect copyright and the terms of service of video platforms.
                    </p>
                </div>
            </div>
        </div>
    );
}
