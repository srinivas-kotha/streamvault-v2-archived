/**
 * Sprint 4 — Issue #116
 * ErrorRecovery: shown when status is 'error'. Provides retry and close actions.
 */

import { usePlayerStore } from "@lib/stores/playerStore";

export function ErrorRecovery() {
  const error = usePlayerStore((s) => s.error);
  const stopPlayback = usePlayerStore((s) => s.stopPlayback);
  const setStatus = usePlayerStore((s) => s.setStatus);

  const errorMessage =
    typeof error === "string"
      ? error
      : (error?.message ?? "Something went wrong. Please try again.");

  const handleRetry = () => {
    // Clear error and transition to loading
    usePlayerStore.setState({ error: null });
    setStatus("loading");
  };

  const handleClose = () => {
    stopPlayback();
  };

  return (
    <div
      data-testid="error-recovery"
      role="alert"
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 text-white p-6"
    >
      {/* Error icon */}
      <svg
        className="w-12 h-12 text-error mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>

      <p className="text-lg font-semibold text-white mb-2">Playback Error</p>
      <p className="text-sm text-white/70 mb-6 text-center max-w-md">
        {errorMessage}
      </p>

      <div className="flex gap-3">
        <button
          onClick={handleRetry}
          className="px-5 py-2 bg-teal text-black font-medium rounded-lg hover:bg-teal/90 transition-colors"
          aria-label="Retry"
        >
          Retry
        </button>
        <button
          onClick={handleClose}
          className="px-5 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
          aria-label="Close player"
        >
          Close
        </button>
      </div>
    </div>
  );
}
