import { Link } from 'react-router-dom';
import { Zap, FileAudio, ImageIcon, FileText, Video, ScanText, DollarSign, Calculator, Lock, QrCode, Palette, Clock } from 'lucide-react';
import type { ToolStatus } from '../types';

interface ToolItem {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    category: string;
    status: ToolStatus;
    usageCount: number;
    path: string;
}

const tools: ToolItem[] = [
    {
        id: 'file-converter',
        name: 'File Converter',
        description: 'Convert files between formats. Audio & video to MP3, documents, and more.',
        icon: <FileAudio size={28} />,
        category: 'Media',
        status: 'active',
        usageCount: 24531,
        path: '/tools/file-converter',
    },
    {
        id: 'image-scaler',
        name: 'Image Scaler',
        description: 'Resize and scale images to exact dimensions. Perfect for ads and social media.',
        icon: <ImageIcon size={28} />,
        category: 'Media',
        status: 'active',
        usageCount: 18234,
        path: '/tools/image-scaler',
    },
    {
        id: 'paystub-generator',
        name: 'Paystub Generator',
        description: 'Create professional pay stubs with automatic calculations and PDF export.',
        icon: <DollarSign size={28} />,
        category: 'Finance',
        status: 'active',
        usageCount: 15890,
        path: '/tools/paystub-generator',
    },
    {
        id: 'ocr-editor',
        name: 'OCR Text Editor',
        description: 'Extract and edit text from images and scanned documents instantly.',
        icon: <ScanText size={28} />,
        category: 'Document',
        status: 'active',
        usageCount: 12456,
        path: '/tools/ocr-editor',
    },
    {
        id: 'video-downloader',
        name: 'Video Downloader',
        description: 'Download videos from YouTube, Vimeo, and other platforms in any format.',
        icon: <Video size={28} />,
        category: 'Media',
        status: 'active',
        usageCount: 31245,
        path: '/tools/video-downloader',
    },
    {
        id: 'calculator',
        name: 'Calculator',
        description: 'Advanced scientific calculator with history and unit conversions.',
        icon: <Calculator size={28} />,
        category: 'Math',
        status: 'inactive',
        usageCount: 15243,
        path: '#',
    },
    {
        id: 'json-formatter',
        name: 'JSON Formatter',
        description: 'Format, validate, and minify JSON with syntax highlighting.',
        icon: <FileText size={28} />,
        category: 'Dev',
        status: 'inactive',
        usageCount: 14567,
        path: '#',
    },
    {
        id: 'password-generator',
        name: 'Password Generator',
        description: 'Generate secure, random passwords with custom rules.',
        icon: <Lock size={28} />,
        category: 'Security',
        status: 'inactive',
        usageCount: 12891,
        path: '#',
    },
    {
        id: 'qr-generator',
        name: 'QR Code Generator',
        description: 'Create QR codes for URLs, text, WiFi, and vCards instantly.',
        icon: <QrCode size={28} />,
        category: 'Utility',
        status: 'inactive',
        usageCount: 11456,
        path: '#',
    },
    {
        id: 'color-picker',
        name: 'Color Picker',
        description: 'Pick colors, generate palettes, and convert between formats.',
        icon: <Palette size={28} />,
        category: 'Design',
        status: 'inactive',
        usageCount: 8234,
        path: '#',
    },
    {
        id: 'timestamp-converter',
        name: 'Timestamp Converter',
        description: 'Convert between Unix timestamps and human-readable dates.',
        icon: <Clock size={28} />,
        category: 'Utility',
        status: 'inactive',
        usageCount: 7891,
        path: '#',
    },
];

function StatusBulb({ status }: { status: ToolStatus }) {
    return <div className={`status-bulb ${status} w-2 h-2`} />;
}

export function HomePage() {
    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="w-full py-16 px-8 text-center relative overflow-hidden">
                {/* Background Glow Effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--color-glow)]/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-[var(--color-glow)]/3 rounded-full blur-[80px] pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 max-w-3xl mx-auto">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
                        <Zap size={14} className="text-[var(--color-using-amber)]" />
                        <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                            100% Free • No Sign-up Required
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                        Premium Tools,{' '}
                        <span className="text-[var(--color-glow)]">
                            Zero Cost
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg text-[var(--color-text-secondary)] max-w-xl mx-auto mb-8 leading-relaxed">
                        Access a curated collection of powerful utilities designed to boost your productivity.
                        No subscriptions, no hidden fees—just tools that work.
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-center gap-8 md:gap-16">
                        <div className="flex flex-col">
                            <span className="text-3xl font-bold text-white">11+</span>
                            <span className="text-sm text-[var(--color-text-muted)]">Free Tools</span>
                        </div>
                        <div className="w-px h-12 bg-[var(--color-dark-400)]" />
                        <div className="flex flex-col">
                            <span className="text-3xl font-bold text-white">100K+</span>
                            <span className="text-sm text-[var(--color-text-muted)]">Daily Uses</span>
                        </div>
                        <div className="w-px h-12 bg-[var(--color-dark-400)]" />
                        <div className="flex flex-col">
                            <span className="text-3xl font-bold text-white">100%</span>
                            <span className="text-sm text-[var(--color-text-muted)]">Free Forever</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tools Grid */}
            <section id="tools" className="w-full py-16 px-8">
                {/* Section Header */}
                <div className="max-w-6xl mx-auto mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-1 h-8 bg-[var(--color-glow)] rounded-full shadow-[0_0_10px_var(--color-glow-alpha)]" />
                        <h2 className="text-3xl font-bold text-white">Available Tools</h2>
                    </div>
                    <p className="text-[var(--color-text-secondary)] max-w-xl">
                        Select any tool below to get started. Watch the status indicators to see real-time activity.
                    </p>

                    {/* Legend */}
                    <div className="flex items-center gap-6 mt-6">
                        <div className="flex items-center gap-2">
                            <div className="status-bulb active w-2 h-2" />
                            <span className="text-xs text-[var(--color-text-muted)]">Available</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="status-bulb using w-2 h-2" />
                            <span className="text-xs text-[var(--color-text-muted)]">In Use</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="status-bulb inactive w-2 h-2" />
                            <span className="text-xs text-[var(--color-text-muted)]">Coming Soon</span>
                        </div>
                    </div>
                </div>

                {/* Tools Grid */}
                <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tools.map((tool) => (
                        <Link
                            key={tool.id}
                            to={tool.path}
                            className={`tool-card group ${tool.status === 'inactive' ? 'opacity-60 pointer-events-none' : 'cursor-pointer'}`}
                        >
                            {/* Status Indicator */}
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                <StatusBulb status={tool.status} />
                                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
                                    {tool.status === 'inactive' ? 'Soon' : tool.status}
                                </span>
                            </div>

                            {/* Icon Container */}
                            <div className="w-14 h-14 rounded-2xl bg-transparent border border-[var(--color-dark-400)] group-hover:border-[var(--color-glow)] group-hover:shadow-[0_0_15px_var(--color-glow-alpha)] flex items-center justify-center mb-4 transition-all duration-300">
                                <div className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-glow)] transition-colors duration-300">
                                    {tool.icon}
                                </div>
                            </div>

                            {/* Tool Info */}
                            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[var(--color-glow)] transition-colors duration-300">
                                {tool.name}
                            </h3>
                            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
                                {tool.description}
                            </p>

                            {/* Category Tag */}
                            <div className="flex items-center justify-between">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-transparent border border-[var(--color-dark-400)] text-[var(--color-text-muted)]">
                                    {tool.category}
                                </span>
                                <span className="text-xs text-[var(--color-text-muted)]">
                                    {tool.usageCount.toLocaleString()} uses
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
