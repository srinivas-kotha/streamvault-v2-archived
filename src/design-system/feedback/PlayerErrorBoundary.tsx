import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/design-system/primitives/Button';
import { cn } from '@/shared/utils/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  children: ReactNode;
  /** Optional callback invoked when the user dismisses / closes the player error. */
  onClose?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

function PlaybackErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-10 h-10', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m0 3.75h.008v.008H12v-.008Z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * PlayerErrorBoundary — isolates the video player from the rest of the app.
 *
 * If the player's React render tree throws (e.g. HLS.js integration error,
 * broken component state), this boundary catches it and shows a dark overlay
 * matching the player aesthetic. The rest of the app continues running.
 *
 * Usage: wrap the PlayerPage component tree:
 *
 *   <PlayerErrorBoundary onClose={stop}>
 *     <PlayerPage ... />
 *   </PlayerErrorBoundary>
 */
export class PlayerErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('[PlayerErrorBoundary] Playback render error:', error);
      console.error('[PlayerErrorBoundary] Component stack:', info.componentStack);
    }
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  private handleClose = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onClose?.();
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isDev = import.meta.env.DEV;
    const hasCloseHandler = !!this.props.onClose;

    return (
      <div
        role="alert"
        className="bg-bg-overlay w-full h-full flex items-center justify-center"
      >
        <div className="flex flex-col items-center gap-5 text-center px-6 max-w-sm">
          {/* Icon */}
          <PlaybackErrorIcon className="text-text-secondary" />

          {/* Heading */}
          <div className="flex flex-col gap-1.5">
            <h3 className="text-base font-semibold text-text-primary">
              Playback error
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              An error occurred while rendering the player. You can retry or close.
            </p>
          </div>

          {/* Dev-only error message */}
          {isDev && this.state.error && (
            <div className="w-full rounded-[var(--radius-sm)] bg-black/40 border border-white/10 p-3 text-left">
              <p className="text-xs font-mono text-text-secondary break-words whitespace-pre-wrap">
                {this.state.error.message}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            {hasCloseHandler && (
              <Button
                variant="secondary"
                size="md"
                onClick={this.handleClose}
              >
                Close
              </Button>
            )}
            <Button
              variant="primary"
              size="md"
              onClick={this.handleRetry}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
