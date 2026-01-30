import { Github, Twitter, Heart } from 'lucide-react';

export function Footer() {
    return (
        <footer className="w-full py-8 px-8 border-t border-[var(--color-dark-500)]">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Copyright */}
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                    <span>Made with</span>
                    <Heart size={14} className="text-red-500 fill-red-500" />
                    <span>• QuickTools © {new Date().getFullYear()}</span>
                </div>

                {/* Links */}
                <div className="flex items-center gap-6">
                    <a href="#" className="text-[var(--color-text-muted)] hover:text-white transition-colors">
                        <Github size={20} />
                    </a>
                    <a href="#" className="text-[var(--color-text-muted)] hover:text-white transition-colors">
                        <Twitter size={20} />
                    </a>
                </div>

                {/* Tagline */}
                <div className="text-sm text-[var(--color-text-muted)]">
                    Free tools for everyone
                </div>
            </div>
        </footer>
    );
}
