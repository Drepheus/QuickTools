import { Outlet, Link, useLocation } from 'react-router-dom';
import { Wrench, ChevronLeft, Sparkles } from 'lucide-react';

export function Layout() {
    const location = useLocation();
    const isToolPage = location.pathname !== '/';

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="w-full py-6 px-8 flex items-center justify-between border-b border-[var(--color-dark-500)]">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 group">
                    {isToolPage && (
                        <div className="flex items-center gap-2 mr-2 text-[var(--color-text-muted)] group-hover:text-white transition-colors">
                            <ChevronLeft size={20} />
                        </div>
                    )}
                    <div className="w-10 h-10 rounded-xl glow-border flex items-center justify-center">
                        <Wrench size={22} className="text-[var(--color-glow)]" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-white tracking-tight">
                            Quick<span className="text-[var(--color-glow)]">Tools</span>
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)] tracking-wide">
                            Premium Free Utilities
                        </span>
                    </div>
                </Link>

                {/* Navigation */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link to="/" className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors">
                        All Tools
                    </Link>
                    <a href="#about" className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors">
                        About
                    </a>
                    <a href="#contact" className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors">
                        Contact
                    </a>
                </nav>

                {/* CTA Button */}
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-full glow-button text-white text-sm font-medium">
                    <Sparkles size={16} />
                    <span>Get Started</span>
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="w-full py-6 px-8 border-t border-[var(--color-dark-500)]">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <span className="text-sm text-[var(--color-text-muted)]">
                        © {new Date().getFullYear()} QuickTools. Free tools for everyone.
                    </span>
                    <div className="flex items-center gap-4">
                        <a href="#" className="text-sm text-[var(--color-text-muted)] hover:text-white transition-colors">
                            Privacy
                        </a>
                        <a href="#" className="text-sm text-[var(--color-text-muted)] hover:text-white transition-colors">
                            Terms
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
