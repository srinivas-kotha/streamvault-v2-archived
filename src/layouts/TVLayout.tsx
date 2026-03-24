import type { ReactNode } from 'react';

interface TVLayoutProps {
  children: ReactNode;
}

/**
 * TV layout with spatial navigation safe zones.
 * - 20-40px margins for TV overscan safe area
 * - overflow hidden to prevent scroll on TV
 * - Skip-to-content link for accessibility
 * - NO CSS transform on wrapper (AC-01)
 */
export function TVLayout({ children }: TVLayoutProps) {
  return (
    <div className="min-h-screen bg-obsidian overflow-hidden">
      {/* Skip-to-content link for accessibility (visible on focus) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-teal focus:text-obsidian focus:rounded"
      >
        Skip to content
      </a>
      <main
        id="main-content"
        className="px-10 py-8 h-screen overflow-hidden"
        style={{ margin: '20px' }}
      >
        {children}
      </main>
    </div>
  );
}
