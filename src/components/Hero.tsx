import { Zap } from 'lucide-react';

export function Hero() {
    return (
        <section className="w-full py-16 px-8 text-center relative overflow-hidden">
            {/* Background Glow Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--color-accent-primary)]/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-[var(--color-accent-secondary)]/5 rounded-full blur-[80px] pointer-events-none" />

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
                    <span className="bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] bg-clip-text text-transparent">
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
                        <span className="text-3xl font-bold text-white">8+</span>
                        <span className="text-sm text-[var(--color-text-muted)]">Free Tools</span>
                    </div>
                    <div className="w-px h-12 bg-[var(--color-dark-400)]" />
                    <div className="flex flex-col">
                        <span className="text-3xl font-bold text-white">50K+</span>
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
    );
}
