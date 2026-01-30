import { Wrench, Sparkles } from 'lucide-react';

export function Header() {
    return (
        <header className="w-full py-6 px-8 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] flex items-center justify-center">
                    <Wrench size={22} className="text-white" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-bold text-white tracking-tight">
                        Quick<span className="text-[var(--color-accent-primary)]">Tools</span>
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)] tracking-wide">
                        Premium Free Utilities
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
                <a href="#tools" className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors">
                    Tools
                </a>
                <a href="#about" className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors">
                    About
                </a>
                <a href="#contact" className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors">
                    Contact
                </a>
            </nav>

            {/* CTA Button */}
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-[var(--color-accent-primary)]/20">
                <Sparkles size={16} />
                <span>Get Started</span>
            </button>
        </header>
    );
}
