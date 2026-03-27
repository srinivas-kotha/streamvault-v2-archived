/**
 * Sprint 4 — Issue #113
 * ProgressBar: shared progress bar component for all control variants.
 * Supports click-to-seek (desktop), keyboard seek (TV), buffered range display.
 */

import { useRef, useCallback } from "react";
import { usePlayerStore } from "@lib/stores/playerStore";
import { formatDuration } from "@shared/utils/formatDuration";

interface ProgressBarProps {
  /** Enable click-to-seek (desktop mode) */
  isDesktop?: boolean;
  /** Enable keyboard seek when focused (TV mode) */
  isFocused?: boolean;
  /** Show time labels */
  showTime?: boolean;
  /** Imperative seek callback (moves the video playhead) */
  onSeek?: (time: number) => void;
}

export function ProgressBar({
  isDesktop = false,
  isFocused = false,
  showTime = true,
  onSeek,
}: ProgressBarProps) {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const bufferedEnd = usePlayerStore((s) => s.bufferedEnd);
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);

  const trackRef = useRef<HTMLDivElement>(null);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (bufferedEnd / duration) * 100 : 0;
  const progressPct = Math.round(progress);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDesktop || !trackRef.current || !duration) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width),
      );
      const seekTime = pct * duration;
      setCurrentTime(seekTime);
      onSeek?.(seekTime);
    },
    [isDesktop, duration, setCurrentTime, onSeek],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isFocused) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const seekTime = Math.max(0, currentTime - 10);
        setCurrentTime(seekTime);
        onSeek?.(seekTime);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const seekTime = Math.min(duration, currentTime + 10);
        setCurrentTime(seekTime);
        onSeek?.(seekTime);
      }
    },
    [isFocused, currentTime, duration, setCurrentTime, onSeek],
  );

  return (
    <div className="flex flex-col gap-1 w-full">
      {showTime && (
        <div className="flex justify-between text-xs text-white/70">
          <span>{formatDuration(Math.floor(currentTime))}</span>
          <span>{formatDuration(Math.floor(duration))}</span>
        </div>
      )}

      <div
        ref={trackRef}
        role="slider"
        aria-label="Video progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPct}
        aria-valuetext={`${formatDuration(Math.floor(currentTime))} of ${formatDuration(Math.floor(duration))}`}
        data-testid="progress-track"
        tabIndex={isFocused ? 0 : -1}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="relative w-full h-2 bg-white/20 rounded-full cursor-pointer"
      >
        {/* Buffered range */}
        <div
          data-testid="buffered-fill"
          className="absolute inset-y-0 left-0 bg-white/30 rounded-full"
          style={{ width: `${bufferedPct}%` }}
        />

        {/* Played range */}
        <div
          data-testid="progress-fill"
          className="absolute inset-y-0 left-0 bg-teal rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
