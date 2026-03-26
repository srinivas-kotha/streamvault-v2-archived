import type { ReactNode } from "react";

interface DesktopLayoutProps {
  children: ReactNode;
}

/**
 * Desktop layout with top navbar and scrollable content area.
 * Sidebar placeholder included for future navigation expansion.
 * NO CSS transform on wrapper (AC-01).
 */
export function DesktopLayout({ children }: DesktopLayoutProps) {
  return (
    <div className="min-h-screen bg-obsidian">
      {/* Top navbar placeholder — uses "breadcrumb" role to avoid duplicate
          "Main navigation" landmark conflict with TopNav rendered inside children */}
      <div
        role="banner"
        className="h-14 bg-surface border-b border-border-subtle flex items-center px-6"
      >
        <span className="text-text-muted text-sm">StreamVault</span>
      </div>

      <div className="flex">
        {/* Sidebar placeholder */}
        <aside className="hidden lg:block w-60 bg-surface border-r border-border-subtle min-h-[calc(100vh-3.5rem)]">
          <div className="p-4">
            <span className="text-text-muted text-xs">Navigation</span>
          </div>
        </aside>

        {/* Scrollable content area */}
        <main className="flex-1 min-h-[calc(100vh-3.5rem)] overflow-y-auto scrollbar-hide px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
