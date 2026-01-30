import { ToolCard } from './ToolCard';
import type { Tool } from '../types';

interface ToolsGridProps {
    tools: Tool[];
    onToolClick?: (tool: Tool) => void;
}

export function ToolsGrid({ tools, onToolClick }: ToolsGridProps) {
    return (
        <section id="tools" className="w-full py-16 px-8">
            {/* Section Header */}
            <div className="max-w-6xl mx-auto mb-12">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-8 bg-gradient-to-b from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] rounded-full" />
                    <h2 className="text-3xl font-bold text-white">Available Tools</h2>
                </div>
                <p className="text-[var(--color-text-secondary)] max-w-xl">
                    Select any tool below to get started. Watch the status indicators to see real-time activity.
                </p>

                {/* Legend */}
                <div className="flex items-center gap-6 mt-6">
                    <div className="flex items-center gap-2">
                        <div className="status-bulb active w-2 h-2" />
                        <span className="text-xs text-[var(--color-text-muted)]">Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="status-bulb using w-2 h-2" />
                        <span className="text-xs text-[var(--color-text-muted)]">In Use</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="status-bulb inactive w-2 h-2" />
                        <span className="text-xs text-[var(--color-text-muted)]">Offline</span>
                    </div>
                </div>
            </div>

            {/* Tools Grid */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {tools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} onClick={onToolClick} />
                ))}
            </div>
        </section>
    );
}
