/**
 * Sprint 4 — Issue #116
 * BufferingOverlay: shown when status is 'buffering' or 'loading'.
 * Hidden otherwise (playing, paused, idle, error).
 */

import { usePlayerStore } from "@lib/stores/playerStore";

export function BufferingOverlay() {
  const status = usePlayerStore((s) => s.status);

  if (status !== "buffering" && status !== "loading") {
    return null;
  }

  return (
    <div
      data-testid="buffering-overlay"
      role="status"
      aria-label="Buffering"
      aria-busy="true"
      className="absolute inset-0 z-10 flex items-center justify-center bg-black/40"
    >
      <div
        data-testid="buffering-spinner"
        className="w-12 h-12 border-4 border-teal/30 border-t-teal rounded-full animate-spin"
      />
    </div>
  );
}
