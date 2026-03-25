/**
 * EPGNowButton — scrolls the EPG timeline back to the current time.
 * Highlighted when EPG viewport is not showing current time.
 */

import { useSpatialFocusable } from "@shared/hooks/useSpatialNav";

interface EPGNowButtonProps {
  onScrollToNow: () => void;
  isAtNow: boolean;
}

export function EPGNowButton({ onScrollToNow, isAtNow }: EPGNowButtonProps) {
  const { ref, focusProps } = useSpatialFocusable({
    focusKey: "epg-now-button",
    onEnterPress: onScrollToNow,
  });

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      onScrollToNow();
    }
  }

  return (
    <button
      ref={ref}
      {...focusProps}
      onClick={onScrollToNow}
      onKeyDown={handleKeyDown}
      aria-label="Scroll to now"
      aria-pressed={isAtNow}
      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-[background-color,border-color,color] ${
        isAtNow
          ? "bg-surface-raised border-border-subtle text-text-muted opacity-60"
          : "bg-teal/15 border-teal/40 text-teal hover-capable:hover:bg-teal/25"
      }`}
    >
      Now
    </button>
  );
}
