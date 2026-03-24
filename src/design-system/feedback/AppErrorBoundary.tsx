import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/design-system/primitives/Button';
import { cn } from '@/shared/utils/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-12 h-12', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AppErrorBoundary — root-level catch-all for catastrophic React render errors.
 *
 * Renders a full-page centered card so the user always has a recovery path.
 * Error message is shown only in development to avoid leaking internals.
 *
 * Usage: wrap the outermost <Outlet /> in __root.tsx with this component.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('[AppErrorBoundary] Catastrophic render error:', error);
      console.error('[AppErrorBoundary] Component stack:', info.componentStack);
    }
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isDev = import.meta.env.DEV;

    return (
      <div
        role="alert"
        className="bg-bg-primary min-h-screen flex items-center justify-center p-6"
      >
        <div className="max-w-md w-full text-center flex flex-col items-center gap-6">
          {/* Icon */}
          <ErrorIcon className="text-accent-teal opacity-80" />

          {/* Heading */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Something went wrong
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              The application encountered an unexpected error and could not recover.
            </p>
          </div>

          {/* Dev-only error message */}
          {isDev && this.state.error && (
            <div className="w-full rounded-[var(--radius-md)] bg-bg-tertiary border border-white/10 p-4 text-left">
              <p className="text-xs font-mono text-text-secondary break-words whitespace-pre-wrap">
                {this.state.error.message}
              </p>
            </div>
          )}

          {/* Action */}
          <Button
            variant="primary"
            size="lg"
            onClick={this.handleReload}
            className="min-w-[160px]"
          >
            Reload App
          </Button>
        </div>
      </div>
    );
  }
}
