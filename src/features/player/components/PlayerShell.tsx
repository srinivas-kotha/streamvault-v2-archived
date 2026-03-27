/**
 * Sprint 4 — Issue #112
 * PlayerShell: single unified player component. Reads all state from playerStore.
 * Renders nothing when status === 'idle'. Uses device-appropriate controls.
 * Must be mounted OUTSIDE CSS transform ancestors (AC-01).
 */

import { useRef, useCallback, useEffect, useState } from "react";
import { usePlayerStore } from "@lib/stores/playerStore";
import type { PlayerStatus } from "@lib/stores/playerStore";
import { useDeviceContext } from "@shared/hooks/useDeviceContext";
import { usePlayerKeyboard } from "../hooks/usePlayerKeyboard";
import { BufferingOverlay } from "./BufferingOverlay";
import { ErrorRecovery } from "./ErrorRecovery";
import { DesktopControls } from "./controls/DesktopControls";
import { TVControls } from "./controls/TVControls";
import { MobileControls } from "./controls/MobileControls";
import { VideoElement } from "./VideoElement";
import type { VideoElementHandle } from "./VideoElement";
import { SeekIndicator } from "./SeekIndicator";
import { SpeedIndicator } from "./SpeedIndicator";
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
  const currentQuality = usePlayerStore((s) => s.currentQuality);
  const currentSubtitle = usePlayerStore((s) => s.currentSubtitle);
  const playbackRate = usePlayerStore((s) => s.playbackRate);

  const { deviceClass, isTVMode } = useDeviceContext();
  const playerRef = useRef<VideoElementHandle>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInternalStatusChangeRef = useRef(false);
  const [seekDirection, setSeekDirection] = useState<
    "forward" | "backward" | null
  >(null);
  const [seekCount, setSeekCount] = useState(0);

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

  const handleStatusChange = useCallback(
    (newStatus: PlayerStatus) => {
      if (isInternalStatusChangeRef.current) return;
      setStatus(newStatus);
    },
    [setStatus],
  );

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

  // Bridge: playerStore.status → video element play/pause
  useEffect(() => {
    const video = playerRef.current?.getVideo();
    if (!video) return;

    if (status === "playing" && video.paused) {
      isInternalStatusChangeRef.current = true;
      video
        .play()
        .catch(() => {})
        .finally(() => {
          isInternalStatusChangeRef.current = false;
        });
    } else if (status === "paused" && !video.paused) {
      isInternalStatusChangeRef.current = true;
      video.pause();
      // pause() is synchronous, reset flag on next tick
      queueMicrotask(() => {
        isInternalStatusChangeRef.current = false;
      });
    }
  }, [status]);

  // Bridge: playerStore.currentQuality → HLS quality level
  useEffect(() => {
    playerRef.current?.setQuality(currentQuality);
  }, [currentQuality]);

  // Bridge: playerStore.currentSubtitle → HLS subtitle track
  useEffect(() => {
    playerRef.current?.setSubtitleTrack(currentSubtitle);
  }, [currentSubtitle]);

  // Bridge: playerStore.playbackRate → video element
  useEffect(() => {
    playerRef.current?.setPlaybackRate(playbackRate);
  }, [playbackRate]);

  // Keyboard seek handler — bridges to video element
  const handleSeek = useCallback((time: number) => {
    const currentState = usePlayerStore.getState();
    const direction = time > currentState.currentTime ? "forward" : "backward";
    setSeekDirection(direction);
    setSeekCount((c) => c + 1);
    playerRef.current?.seek(time);
  }, []);

  // Keyboard controls (v2 — store-based)
  usePlayerKeyboard({
    isTVMode,
    onChannelUp: isLive ? playNextEpisode : undefined,
    onChannelDown: isLive ? playPrevEpisode : undefined,
    onSeek: handleSeek,
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
      onClick={(e) => {
        // Only toggle play/pause if clicking directly on the video area (not on controls)
        const target = e.target as HTMLElement;
        if (target.closest('[role="toolbar"]') || target.closest("button"))
          return;
        if (deviceClass === "mobile" || deviceClass === "tablet") return; // MobileControls handles its own toggle
        // Desktop: click to play/pause (standard video player UX)
        const state = usePlayerStore.getState();
        if (state.status === "playing") {
          setStatus("paused");
        } else if (state.status === "paused") {
          setStatus("playing");
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
          onStatusChange={handleStatusChange}
          onTimeUpdate={handleTimeUpdate}
          onEnded={hasNext ? playNextEpisode : undefined}
        />
      )}

      {/* Buffering / loading overlay */}
      {(status === "buffering" || status === "loading") && <BufferingOverlay />}

      {/* Seek direction indicator */}
      <SeekIndicator direction={seekDirection} seekCount={seekCount} />

      {/* Speed change indicator */}
      <SpeedIndicator speed={playbackRate} />

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
        <TVControls visible={controlsVisible} onActivity={showControls} />
      ) : deviceClass === "desktop" ? (
        <DesktopControls
          playerRef={playerRef as any}
          visible={controlsVisible}
          onActivity={showControls}
        />
      ) : (
        <MobileControls
          playerRef={playerRef as any}
          visible={controlsVisible}
          onToggle={() => {
            if (controlsVisible) {
              setControlsVisible(false);
              if (controlsTimeoutRef.current)
                clearTimeout(controlsTimeoutRef.current);
            } else {
              showControls();
            }
          }}
        />
      )}
    </div>
  );
}
