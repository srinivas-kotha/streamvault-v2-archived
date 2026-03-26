import type { ReactNode } from "react";

interface MobileLayoutProps {
  children: ReactNode;
}

/**
 * Mobile layout with bottom tab navigation placeholder.
 * Content area scrollable with bottom padding for the tab bar.
 * NO CSS transform on wrapper (AC-01).
 */
export function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-obsidian">
      {/* Main content area — leaves room for bottom tab bar */}
      <main className="min-h-screen pb-16 px-4 py-4 overflow-y-auto">
        {children}
      </main>

      {/* Bottom tab navigation — uses distinct label to avoid duplicate
          "Main navigation" landmark conflict with TopNav rendered inside children */}
      <nav
        aria-label="Tab navigation"
        className="fixed bottom-0 inset-x-0 h-14 bg-surface border-t border-border-subtle flex items-center justify-around z-40"
      >
        <span className="text-text-muted text-xs">Home</span>
        <span className="text-text-muted text-xs">Search</span>
        <span className="text-text-muted text-xs">Library</span>
      </nav>
    </div>
  );
}
