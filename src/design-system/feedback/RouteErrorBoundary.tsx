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

function PageErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-8 h-8', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * RouteErrorBoundary — route-level isolation boundary.
 *
 * A crash in one route (e.g. /series) does NOT cascade to the entire app.
 * Shows an inline error card within the page layout (not full-screen).
 *
 * Usage: wrap individual route <Outlet /> calls or route components:
 *
 *   <RouteErrorBoundary>
 *     <SeriesPage />
 *   </RouteErrorBoundary>
 */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('[RouteErrorBoundary] Route render error:', error);
      console.error('[RouteErrorBoundary] Component stack:', info.componentStack);
    }
  }

  private handleBack = (): void => {
    window.history.back();
  };

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isDev = import.meta.env.DEV;

    return (
      <div
        role="alert"
        className="flex items-center justify-center min-h-[400px] p-6"
      >
        <div className="max-w-md w-full">
          {/* Card */}
          <div className="rounded-[var(--radius-lg)] bg-bg-secondary border border-white/8 p-8 flex flex-col items-center gap-5 text-center">
            {/* Icon */}
            <PageErrorIcon className="text-text-secondary" />

            {/* Heading */}
            <div className="flex flex-col gap-1.5">
              <h2 className="text-lg font-semibold text-text-primary">
                This page encountered an error
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                Something went wrong while rendering this page. You can go back or try again.
              </p>
            </div>

            {/* Dev-only error message */}
            {isDev && this.state.error && (
              <div className="w-full rounded-[var(--radius-sm)] bg-bg-tertiary border border-white/10 p-3 text-left">
                <p className="text-xs font-mono text-text-secondary break-words whitespace-pre-wrap">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={this.handleBack}
              >
                Go Back
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={this.handleRetry}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
