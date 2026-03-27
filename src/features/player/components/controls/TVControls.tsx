/**
 * Sprint 4 — Issue #113
 * TVControls: minimal controls for TV D-pad navigation.
 * Large text, auto-hide after 5s on any key press, shows time and stream name.
 * Shows seek indicator (+10s/-10s) on arrow key press for VOD.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { usePlayerStore } from "@lib/stores/playerStore";
import { formatDuration } from "@shared/utils/formatDuration";

interface TVControlsProps {
  visible?: boolean;
  onActivity?: () => void;
}

export function TVControls({ visible = true, onActivity }: TVControlsProps) {
  const status = usePlayerStore((s) => s.status);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const streamName = usePlayerStore((s) => s.streamName);
  const streamType = usePlayerStore((s) => s.streamType);
  const setStatus = usePlayerStore((s) => s.setStatus);

  const [seekIndicator, setSeekIndicator] = useState<string | null>(null);
  const seekIndicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const isLive = streamType === "live";
  const isPlaying = status === "playing";
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Cleanup seek indicator timer on unmount
  useEffect(() => {
    return () => {
      if (seekIndicatorTimerRef.current)
        clearTimeout(seekIndicatorTimerRef.current);
    };
  }, []);

  // Listen for key presses to notify parent and show seek indicator
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      onActivity?.();

      if (!isLive && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        const dir = e.key === "ArrowRight" ? "+10s" : "-10s";
        setSeekIndicator(dir);
        if (seekIndicatorTimerRef.current)
          clearTimeout(seekIndicatorTimerRef.current);
        seekIndicatorTimerRef.current = setTimeout(() => {
          setSeekIndicator(null);
        }, 1500);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLive, onActivity]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      setStatus("paused");
    } else if (status === "paused") {
      setStatus("playing");
    }
  }, [isPlaying, status, setStatus]);

  return (
    <div
      data-testid="tv-controls-overlay"
      data-visible={visible ? "true" : "false"}
      className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-transparent to-transparent transition-opacity duration-300 ${visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
    >
      {/* Stream title at top */}
      {streamName && (
        <div
          data-testid="channel-name"
          className="absolute top-6 left-10 text-white text-2xl font-semibold drop-shadow-lg"
        >
          {streamName}
        </div>
      )}

      {/* Seek indicator (VOD only) */}
      {seekIndicator && (
        <div
          data-testid="seek-indicator"
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="bg-black/70 rounded-xl px-6 py-3 text-white text-2xl font-bold">
            {seekIndicator}
          </div>
        </div>
      )}

      <div className="px-10 pb-8">
        {/* Progress bar (VOD only) */}
        {!isLive && duration > 0 && (
          <>
            <div className="flex justify-between text-sm text-white/80 mb-2">
              <span>{formatDuration(Math.floor(currentTime))}</span>
              <span>{formatDuration(Math.floor(duration))}</span>
            </div>
            <div
              role="progressbar"
              aria-label="Video progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              aria-valuetext={`${formatDuration(Math.floor(currentTime))} of ${formatDuration(Math.floor(duration))}`}
              className="w-full h-2 bg-white/30 rounded-full mb-4"
            >
              <div
                className="h-full bg-teal rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        )}

        {/* Live indicator */}
        {isLive && (
          <div
            data-testid="live-indicator"
            className="flex items-center gap-2 text-red-500 text-sm mb-4"
          >
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="font-semibold">LIVE</span>
          </div>
        )}

        {/* Controls row */}
        <div
          role="toolbar"
          aria-label="Player controls"
          className="flex items-center justify-center gap-8"
        >
          <button
            onClick={handlePlayPause}
            className="p-4 text-white text-4xl focus:outline-none"
            aria-label={isPlaying ? "Pause" : "Play"}
            data-testid="tv-play-pause"
          >
            {isPlaying ? (
              <svg
                className="w-10 h-10"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
              </svg>
            ) : (
              <svg
                className="w-10 h-10"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
