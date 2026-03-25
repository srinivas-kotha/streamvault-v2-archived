/**
 * Sprint 4 — Issue #113
 * MobileControls: tap-to-toggle controls for mobile and tablet.
 * Touch-optimized with large tap targets, swipe-to-seek, quality/subtitle selectors.
 * Hidden by default — tap to reveal.
 */

import { useState, useCallback, useRef } from "react";
import { usePlayerStore } from "@lib/stores/playerStore";
import { formatDuration } from "@shared/utils/formatDuration";
import { QualitySelector } from "./QualitySelector";
import { SubtitleSelector } from "./SubtitleSelector";

interface MobileControlsProps {
  playerRef?: React.RefObject<{
    seek: (t: number) => void;
  } | null>;
}

const SWIPE_THRESHOLD = 50; // px minimum to register as a swipe
const SEEK_AMOUNT = 10; // seconds

export function MobileControls({ playerRef }: MobileControlsProps) {
  const status = usePlayerStore((s) => s.status);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const streamType = usePlayerStore((s) => s.streamType);
  const setStatus = usePlayerStore((s) => s.setStatus);
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);

  const [visible, setVisible] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  const isLive = streamType === "live";
  const isPlaying = status === "playing";
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleOverlayClick = useCallback(() => {
    setVisible((v) => !v);
  }, []);

  const handlePlayPause = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isPlaying) {
        setStatus("paused");
      } else if (status === "paused") {
        setStatus("playing");
      }
    },
    [isPlaying, status, setStatus],
  );

  const handleRewind = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const newTime = Math.max(0, currentTime - SEEK_AMOUNT);
      if (playerRef?.current) {
        playerRef.current.seek(newTime);
      } else {
        setCurrentTime(newTime);
      }
    },
    [currentTime, playerRef, setCurrentTime],
  );

  const handleForward = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const newTime = Math.min(duration, currentTime + SEEK_AMOUNT);
      if (playerRef?.current) {
        playerRef.current.seek(newTime);
      } else {
        setCurrentTime(newTime);
      }
    },
    [currentTime, duration, playerRef, setCurrentTime],
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartXRef.current === null) return;
      const changedTouch = e.changedTouches[0];
      if (!changedTouch) return;
      const deltaX = changedTouch.clientX - touchStartXRef.current;
      touchStartXRef.current = null;

      if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;

      const direction = deltaX > 0 ? 1 : -1;
      const newTime = Math.max(
        0,
        Math.min(duration, currentTime + direction * SEEK_AMOUNT),
      );
      setCurrentTime(newTime);
    },
    [currentTime, duration, setCurrentTime],
  );

  return (
    <div
      data-testid="mobile-controls-overlay"
      data-visible={visible ? "true" : "false"}
      onClick={handleOverlayClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="absolute inset-0 flex flex-col justify-between"
    >
      {/* Gradient overlay — only when visible */}
      {visible && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
      )}

      {visible && (
        <>
          <div className="flex-1" />

          {/* Center controls */}
          <div className="relative flex items-center justify-center gap-8 mb-6">
            {/* Rewind */}
            {!isLive && (
              <button
                onClick={handleRewind}
                className="p-3 text-white"
                aria-label="Seek back 10 seconds"
              >
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.5 3C7.81 3 4.01 6.54 3.57 11H1l3.5 4 3.5-4H5.59c.44-3.36 3.3-6 6.91-6 3.87 0 7 3.13 7 7s-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C7.82 20.04 10.05 21 12.5 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z" />
                </svg>
              </button>
            )}

            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="p-4 text-white"
              aria-label={isPlaying ? "Pause" : "Play"}
              data-testid="mobile-play-pause"
            >
              {isPlaying ? (
                <svg
                  className="w-12 h-12"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
                </svg>
              ) : (
                <svg
                  className="w-12 h-12"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Forward */}
            {!isLive && (
              <button
                onClick={handleForward}
                className="p-3 text-white"
                aria-label="Seek forward 10 seconds"
              >
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.5 3c4.69 0 8.49 3.54 8.93 8H23l-3.5 4-3.5-4h2.02c-.44-3.36-3.3-6-6.91-6-3.87 0-7 3.13-7 7s3.13 7 7 7c1.93 0 3.68-.79 4.94-2.06l1.42 1.42C15.68 20.04 13.45 21 11.5 21c-4.97 0-9-4.03-9-9s4.03-9 9-9z" />
                </svg>
              </button>
            )}
          </div>

          {/* Bottom bar: selectors + progress + time */}
          <div className="relative px-4 pb-4">
            {/* Quality / subtitle row */}
            <div
              className="flex justify-end gap-2 mb-2"
              onClick={(e) => e.stopPropagation()}
            >
              <QualitySelector />
              <SubtitleSelector />
            </div>

            {!isLive && duration > 0 && (
              <>
                <div className="flex justify-between text-xs text-white/70 mb-1">
                  <span>{formatDuration(Math.floor(currentTime))}</span>
                  <span>{formatDuration(Math.floor(duration))}</span>
                </div>
                <div
                  role="slider"
                  aria-label="Video progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress)}
                  aria-valuetext={`${formatDuration(Math.floor(currentTime))} of ${formatDuration(Math.floor(duration))}`}
                  className="w-full h-1.5 bg-white/20 rounded-full"
                >
                  <div
                    className="h-full bg-teal rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </>
            )}

            {isLive && (
              <div className="flex items-center gap-1 text-xs text-red-500">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                LIVE
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
