/**
 * Sprint 4 — Issue #112
 * PlayerShell: single unified player component. Reads all state from playerStore.
 * Renders nothing when status === 'idle'. Uses device-appropriate controls.
 * Must be mounted OUTSIDE CSS transform ancestors (AC-01).
 */

import { useRef, useCallback, useEffect, useState } from "react";
import { usePlayerStore } from "@lib/stores/playerStore";
import { useDeviceContext } from "@shared/hooks/useDeviceContext";
import { usePlayerKeyboard } from "../hooks/usePlayerKeyboard";
import { BufferingOverlay } from "./BufferingOverlay";
import { ErrorRecovery } from "./ErrorRecovery";
import { DesktopControls } from "./controls/DesktopControls";
import { TVControls } from "./controls/TVControls";
import { MobileControls } from "./controls/MobileControls";
import { VideoElement } from "./VideoElement";
import type { VideoElementHandle } from "./VideoElement";
import { useStreamUrl } from "../api";

export function PlayerShell() {
  const status = usePlayerStore((s) => s.status);
  const currentStreamId = usePlayerStore((s) => s.currentStreamId);
  const streamType = usePlayerStore((s) => s.streamType);
  const streamName = usePlayerStore((s) => s.streamName);
  const startTime = usePlayerStore((s) => s.startTime);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const setStatus = usePlayerStore((s) => s.setStatus);
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const stopPlayback = usePlayerStore((s) => s.stopPlayback);
  const playNextEpisode = usePlayerStore((s) => s.playNextEpisode);
  const playPrevEpisode = usePlayerStore((s) => s.playPrevEpisode);
  const seriesContext = usePlayerStore((s) => s.seriesContext);

  const { deviceClass, isTVMode } = useDeviceContext();
  const playerRef = useRef<VideoElementHandle>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch stream URL (only when active)
  const { data: streamData } = useStreamUrl(
    streamType ?? "live",
    currentStreamId ?? "",
  );

  const isLive = streamData?.isLive ?? streamType === "live";

  // Episode navigation
  const hasNext =
    seriesContext !== null &&
    seriesContext.episodes.length > 0 &&
    seriesContext.episodeNum < seriesContext.episodes.length;

  const handleTimeUpdate = useCallback(
    (time: number, dur: number) => {
      setCurrentTime(time);
      setDuration(dur);
    },
    [setCurrentTime, setDuration],
  );

  // Controls auto-hide
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(
      () => {
        setControlsVisible(false);
      },
      isTVMode ? 5000 : 4000,
    );
  }, [isTVMode]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Show controls when paused
  useEffect(() => {
    if (status === "paused") showControls();
  }, [status, showControls]);

  // Volume sync to video element
  useEffect(() => {
    const video = playerRef.current?.getVideo();
    if (video) {
      video.volume = volume;
      video.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Keyboard controls (v2 — store-based)
  usePlayerKeyboard({
    isTVMode,
    onChannelUp: isLive ? playNextEpisode : undefined,
    onChannelDown: isLive ? playPrevEpisode : undefined,
  });

  // Idle → render nothing
  if (status === "idle" || !currentStreamId) {
    return null;
  }

  return (
    <div
      data-testid="player-shell"
      className="fixed inset-0 z-50 bg-black"
      onMouseMove={showControls}
      onMouseLeave={() => status === "playing" && setControlsVisible(false)}
      onClick={() => {
        if (controlsVisible) {
          setControlsVisible(false);
        } else {
          showControls();
        }
      }}
    >
      {/* Video element — always rendered when stream is active */}
      {streamData && (
        <VideoElement
          ref={playerRef}
          url={streamData.url}
          isLive={streamData.isLive}
          format={streamData.format}
          startTime={startTime}
          isTVMode={isTVMode}
          onStatusChange={setStatus}
          onTimeUpdate={handleTimeUpdate}
          onEnded={hasNext ? playNextEpisode : undefined}
        />
      )}

      {/* Buffering / loading overlay */}
      {(status === "buffering" || status === "loading") && <BufferingOverlay />}

      {/* Error recovery */}
      {status === "error" && <ErrorRecovery />}

      {/* Stream name label */}
      {streamName && (
        <div className="absolute top-4 left-4 text-white/80 text-sm font-medium bg-black/50 px-3 py-1 rounded-lg z-10">
          {streamName}
        </div>
      )}

      {/* Close button */}
      <button
        onClick={stopPlayback}
        className="absolute top-4 right-4 z-[60] p-2 bg-black/70 rounded-full text-white/80 hover:text-white hover:bg-black/90 transition-colors"
        aria-label="Close player"
        data-testid="player-close"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Device-specific controls */}
      {deviceClass === "tv" ? (
        <TVControls />
      ) : deviceClass === "desktop" ? (
        <DesktopControls playerRef={playerRef as any} />
      ) : (
        <MobileControls playerRef={playerRef as any} />
      )}
    </div>
  );
}
