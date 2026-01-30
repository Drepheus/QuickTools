import {
    Calculator,
    FileText,
    Image,
    Lock,
    QrCode,
    TextCursor,
    Palette,
    Clock,
    type LucideIcon
} from 'lucide-react';
import { StatusBulb } from './StatusBulb';
import type { Tool } from '../types';

interface ToolCardProps {
    tool: Tool;
    onClick?: (tool: Tool) => void;
}

const iconMap: Record<string, LucideIcon> = {
    calculator: Calculator,
    'file-text': FileText,
    image: Image,
    lock: Lock,
    'qr-code': QrCode,
    'text-cursor': TextCursor,
    palette: Palette,
    clock: Clock,
};

export function ToolCard({ tool, onClick }: ToolCardProps) {
    const IconComponent = iconMap[tool.icon] || Calculator;

    return (
        <div
            className="tool-card cursor-pointer group"
            onClick={() => onClick?.(tool)}
        >
            {/* Status Indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
                <StatusBulb status={tool.status} size="sm" />
                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
                    {tool.status}
                </span>
            </div>

            {/* Icon Container */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-dark-500)] to-[var(--color-dark-600)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <IconComponent
                    size={28}
                    className="text-[var(--color-text-secondary)] group-hover:text-white transition-colors duration-300"
                />
            </div>

            {/* Tool Info */}
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[var(--color-accent-primary)] transition-colors duration-300">
                {tool.name}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
                {tool.description}
            </p>

            {/* Category Tag */}
            <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-dark-500)] text-[var(--color-text-muted)] border border-[rgba(255,255,255,0.05)]">
                    {tool.category}
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                    {tool.usageCount.toLocaleString()} uses
                </span>
            </div>

            {/* Hover Gradient Border Effect */}
            <div className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 rounded-[20px] border border-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] opacity-30" />
            </div>
        </div>
    );
}
