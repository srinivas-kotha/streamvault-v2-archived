/**
 * Sprint 4 — Issue #113
 * DesktopControls: hover overlay with progress bar, volume, quality, subtitles,
 * fullscreen for mouse/keyboard users. Auto-hides after 3s of inactivity.
 */

import { useCallback } from "react";
import { usePlayerStore } from "@lib/stores/playerStore";
import { formatDuration } from "@shared/utils/formatDuration";
import { ProgressBar } from "./ProgressBar";
import { QualitySelector } from "./QualitySelector";
import { SubtitleSelector } from "./SubtitleSelector";
import { SpeedSelector } from "./SpeedSelector";

interface DesktopControlsProps {
  playerRef?: React.RefObject<{
    seek: (t: number) => void;
    toggleFullscreen: () => void;
    togglePiP: () => Promise<void>;
  } | null>;
  visible?: boolean;
  onActivity?: () => void;
}

export function DesktopControls({
  playerRef,
  visible = true,
  onActivity,
}: DesktopControlsProps) {
  const status = usePlayerStore((s) => s.status);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const setMuted = usePlayerStore((s) => s.setMuted);
  const setStatus = usePlayerStore((s) => s.setStatus);
  const streamType = usePlayerStore((s) => s.streamType);

  const isLive = streamType === "live";
  const isPlaying = status === "playing";

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      setStatus("paused");
    } else if (status === "paused") {
      setStatus("playing");
    }
  }, [isPlaying, status, setStatus]);

  const handleMuteToggle = useCallback(() => {
    setMuted(!isMuted);
  }, [isMuted, setMuted]);

  return (
    <div
      data-testid="desktop-controls-overlay"
      data-visible={visible ? "true" : "false"}
      onMouseMove={onActivity}
      className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 bg-gradient-to-t from-black/80 via-transparent to-black/30 ${visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
    >
      {/* Progress bar */}
      {!isLive && duration > 0 && (
        <div className="px-4 mb-1">
          <ProgressBar
            isDesktop
            showTime={false}
            onSeek={(t) => playerRef?.current?.seek(t)}
          />
        </div>
      )}

      {/* Controls bar */}
      <div
        role="toolbar"
        aria-label="Player controls"
        className="flex items-center gap-2 px-4 pb-4 pt-2"
      >
        {/* Play/Pause */}
        <button
          onClick={handlePlayPause}
          className="p-2 text-white hover:text-teal transition-colors focus-visible:ring-2 focus-visible:ring-teal focus-visible:outline-none rounded"
          aria-label={isPlaying ? "Pause" : "Play"}
          data-testid="desktop-play-pause"
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Mute */}
        <button
          onClick={handleMuteToggle}
          className="p-1.5 text-white/70 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-teal focus-visible:outline-none rounded"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted || volume === 0 ? (
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
            </svg>
          )}
        </button>

        {/* Volume slider */}
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round((isMuted ? 0 : volume) * 100)}
          onChange={(e) => setVolume(Number(e.target.value) / 100)}
          className="w-20 h-1 accent-teal focus-visible:ring-2 focus-visible:ring-teal focus-visible:outline-none rounded"
          aria-label="Volume"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round((isMuted ? 0 : volume) * 100)}
          aria-valuetext={`${Math.round((isMuted ? 0 : volume) * 100)} percent`}
        />

        {/* Time */}
        {!isLive && duration > 0 && (
          <span className="text-xs text-white/70 ml-1 flex items-center gap-1">
            <span>{formatDuration(Math.floor(currentTime))}</span>
            <span>/</span>
            <span>{formatDuration(Math.floor(duration))}</span>
          </span>
        )}

        {isLive && (
          <span className="flex items-center gap-1 text-xs text-red-500 ml-1">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            LIVE
          </span>
        )}

        <div className="flex-1" />

        {/* Quality selector */}
        <QualitySelector />

        {/* Subtitle selector */}
        <SubtitleSelector />

        {/* Speed selector */}
        <SpeedSelector />

        {/* Fullscreen */}
        <button
          onClick={() => {
            if (playerRef?.current) {
              playerRef.current.toggleFullscreen();
            } else if (document.fullscreenElement) {
              document.exitFullscreen().catch(() => {});
            } else {
              document.documentElement.requestFullscreen().catch(() => {});
            }
          }}
          className="p-1.5 text-white/70 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-teal focus-visible:outline-none rounded"
          aria-label="Fullscreen"
          data-testid="desktop-fullscreen"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        </button>

        {/* PiP */}
        <button
          onClick={() => playerRef?.current?.togglePiP()}
          className="p-1.5 text-white/70 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-teal focus-visible:outline-none rounded"
          aria-label="Picture-in-Picture"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <rect
              x="11"
              y="9"
              width="9"
              height="7"
              rx="1"
              fill="currentColor"
              opacity="0.3"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
