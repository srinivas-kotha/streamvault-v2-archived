/**
 * Sprint 4 — Issue #112
 * VideoElement: pure video rendering component with HLS.js / mpegts.js support.
 * Exposes ref handle for imperative control. Reports status changes via callback.
 */

import {
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import type HlsType from "hls.js";
import type mpegtsType from "mpegts.js";
import type { PlayerStatus } from "@lib/stores/playerStore";

export interface QualityLevel {
  index: number;
  height: number;
  bitrate: number;
  label: string;
}

export interface SubtitleTrack {
  index: number;
  lang: string;
  label: string;
}

export interface AudioTrack {
  index: number;
  lang: string;
  label: string;
}

export interface VideoElementHandle {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setQuality: (index: number) => void;
  setSubtitleTrack: (index: number) => void;
  seekToLiveEdge: () => void;
  getVideo: () => HTMLVideoElement | null;
  toggleFullscreen: () => void;
  togglePiP: () => Promise<void>;
}

interface VideoElementProps {
  url: string;
  isLive: boolean;
  format: string;
  autoPlay?: boolean;
  startTime?: number;
  isTVMode?: boolean;
  onStatusChange?: (status: PlayerStatus) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onQualityLevelsReady?: (levels: QualityLevel[]) => void;
  onSubtitleTracksReady?: (tracks: SubtitleTrack[]) => void;
  onLiveEdgeChange?: (atLiveEdge: boolean) => void;
}

export const VideoElement = forwardRef<VideoElementHandle, VideoElementProps>(
  function VideoElement(
    {
      url,
      isLive,
      format,
      autoPlay = true,
      startTime = 0,
      isTVMode = false,
      onStatusChange,
      onTimeUpdate,
      onEnded,
      onQualityLevelsReady,
      onSubtitleTracksReady,
      onLiveEdgeChange,
    },
    ref,
  ) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<HlsType | null>(null);
    const mpegtsRef = useRef<mpegtsType.Player | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastAtLiveEdgeRef = useRef(true);

    // ── Destroy helpers ────────────────────────────────────────────────────────

    const destroyPlayers = useCallback(() => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (mpegtsRef.current) {
        mpegtsRef.current.pause();
        mpegtsRef.current.unload();
        mpegtsRef.current.detachMediaElement();
        mpegtsRef.current.destroy();
        mpegtsRef.current = null;
      }
    }, []);

    // ── Imperative handle ──────────────────────────────────────────────────────

    useImperativeHandle(ref, () => ({
      play: () => {
        videoRef.current?.play();
      },
      pause: () => {
        videoRef.current?.pause();
      },
      seek: (time: number) => {
        if (videoRef.current) videoRef.current.currentTime = time;
      },
      setQuality: (index: number) => {
        if (hlsRef.current) hlsRef.current.nextLevel = index; // AC-10: nextLevel not currentLevel
      },
      setSubtitleTrack: (index: number) => {
        if (hlsRef.current) hlsRef.current.subtitleTrack = index;
      },
      seekToLiveEdge: () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.seekable.length) {
          video.currentTime = video.seekable.end(video.seekable.length - 1) - 2;
        } else if (hlsRef.current?.liveSyncPosition) {
          video.currentTime = hlsRef.current.liveSyncPosition;
        }
      },
      getVideo: () => videoRef.current,
      toggleFullscreen: () => {
        const doc = document as Document & {
          webkitFullscreenElement?: Element;
          webkitExitFullscreen?: () => void;
        };
        const isFullscreen =
          doc.fullscreenElement || doc.webkitFullscreenElement;
        if (isFullscreen) {
          if (doc.exitFullscreen) doc.exitFullscreen();
          else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
          return;
        }
        const el = containerRef.current as
          | (HTMLDivElement & {
              webkitRequestFullscreen?: () => void;
            })
          | null;
        if (el?.requestFullscreen) el.requestFullscreen().catch(() => {});
        else if (el?.webkitRequestFullscreen) el.webkitRequestFullscreen();
      },
      togglePiP: async () => {
        const video = videoRef.current;
        if (!video) return;
        if (document.pictureInPictureElement)
          await document.exitPictureInPicture();
        else if (document.pictureInPictureEnabled)
          await video.requestPictureInPicture();
      },
    }));

    // ── Main playback effect ───────────────────────────────────────────────────

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !url) return;

      let cancelled = false;
      let fragLoadedFired = false;
      let hlsRetryCount = 0;
      const HLS_MAX_RETRIES = 3;
      let fallbackAttempted = false;

      onStatusChange?.("loading");

      const isHls = format === "m3u8" || url.endsWith(".m3u8");

      // ── Direct playback ──────────────────────────────────────────────────────

      const startDirectPlayback = () => {
        if (cancelled) return;
        destroyPlayers();
        video.src = url;
        video.onloadeddata = () => {
          if (cancelled) return;
          if (startTime > 0 && !isLive) video.currentTime = startTime;
          if (autoPlay) video.play().catch(() => {});
        };
        video.onerror = () => {
          if (cancelled) return;
          if (!fallbackAttempted && !isHls) {
            fallbackAttempted = true;
            initHls();
          } else {
            onStatusChange?.("error");
          }
        };
        if (autoPlay) video.play().catch(() => {});
      };

      // ── HLS playback ─────────────────────────────────────────────────────────

      const startHlsPlayback = (Hls: typeof HlsType) => {
        if (cancelled) return;
        destroyPlayers();
        // TODO: Consider wiring useDeviceContext hook for HLS config values.
        // Currently not done because useDeviceContext provides single hlsBackBuffer/hlsMaxBuffer
        // values per device, but VideoElement needs different values for live vs VOD
        // (e.g., TV live backBuffer=15 vs TV VOD backBuffer=20). Refactoring useDeviceContext
        // to accept isLive would allow consolidation.
        const hls = new Hls({
          enableWorker: !isTVMode, // AC-07: false on TV
          capLevelToPlayerSize: true,
          maxBufferLength: isLive ? 10 : 30,
          maxMaxBufferLength: isLive ? 30 : 120,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.5,
          startLevel: -1,
          ...(isLive
            ? {
                lowLatencyMode: true,
                liveSyncDuration: 3,
                liveMaxLatencyDuration: 10,
                liveBackBufferLength: isTVMode ? 15 : 30, // AC-07: 15 on TV
                backBufferLength: isTVMode ? 15 : 30,
              }
            : {
                backBufferLength: isTVMode ? 20 : 60, // AC-07: 20 on TV
              }),
        });
        hlsRef.current = hls;
        hls.attachMedia(video);
        hls.loadSource(url);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (cancelled) return;
          if (onQualityLevelsReady) {
            const levels: QualityLevel[] = hls.levels.map((level, i) => ({
              index: i,
              height: level.height,
              bitrate: level.bitrate,
              label: level.height
                ? `${level.height}p`
                : `${Math.round(level.bitrate / 1000)}kbps`,
            }));
            levels.unshift({ index: -1, height: 0, bitrate: 0, label: "Auto" });
            onQualityLevelsReady(levels);
          }
          if (startTime > 0 && !isLive) video.currentTime = startTime;
          if (autoPlay) video.play().catch(() => {});
        });

        // First FRAG_LOADED → transition to playing
        hls.on(Hls.Events.BUFFER_APPENDED, () => {
          if (cancelled || fragLoadedFired) return;
          fragLoadedFired = true;
          onStatusChange?.("playing");
        });

        hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
          if (cancelled || !onSubtitleTracksReady) return;
          const tracks: SubtitleTrack[] = hls.subtitleTracks.map((t, i) => ({
            index: i,
            lang: t.lang || "",
            label: t.name || `Track ${i + 1}`,
          }));
          onSubtitleTracksReady(tracks);
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (cancelled) return;
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hlsRetryCount++;
              if (hlsRetryCount <= HLS_MAX_RETRIES) {
                hls.startLoad();
              } else {
                if (!fallbackAttempted) {
                  fallbackAttempted = true;
                  startDirectPlayback();
                } else {
                  onStatusChange?.("error");
                }
              }
            } else {
              if (!fallbackAttempted) {
                fallbackAttempted = true;
                startDirectPlayback();
              } else {
                onStatusChange?.("error");
              }
            }
          }
        });
      };

      const initHls = async () => {
        const { default: Hls } = await import("hls.js");
        if (cancelled) return;
        if (Hls.isSupported()) {
          startHlsPlayback(Hls);
        } else {
          startDirectPlayback();
        }
      };

      // ── mpegts playback ──────────────────────────────────────────────────────

      const startMpegtsPlayback = async () => {
        if (cancelled) return;
        destroyPlayers();
        try {
          const mpegts = await import("mpegts.js");
          if (cancelled || !mpegts.default.isSupported()) {
            startDirectPlayback();
            return;
          }
          const player = mpegts.default.createPlayer(
            { type: "mpegts", isLive: true, url },
            {
              enableWorker: false,
              enableStashBuffer: false,
              stashInitialSize: 128 * 1024,
              liveBufferLatencyChasing: true,
              liveBufferLatencyMaxLatency: 3,
              liveBufferLatencyMinRemain: 0.5,
            },
          );
          mpegtsRef.current = player;
          player.attachMediaElement(video);
          player.load();

          player.on(mpegts.default.Events.ERROR, () => {
            if (cancelled) return;
            if (!fallbackAttempted) {
              fallbackAttempted = true;
              startDirectPlayback();
            } else {
              onStatusChange?.("error");
            }
          });

          video.onloadeddata = () => {
            if (cancelled) return;
            onStatusChange?.("playing");
          };
          if (autoPlay) player.play();
        } catch {
          if (!cancelled) startDirectPlayback();
        }
      };

      // ── Format routing ───────────────────────────────────────────────────────

      const isTs = format === "ts";

      if (isTs) {
        startMpegtsPlayback();
      } else if (isHls) {
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = url;
          onStatusChange?.("playing");
          if (startTime > 0 && !isLive) video.currentTime = startTime;
          if (autoPlay) video.play().catch(() => {});
        } else {
          initHls();
        }
      } else {
        startDirectPlayback();
      }

      return () => {
        cancelled = true;
        destroyPlayers();
        video.onloadeddata = null;
        video.onerror = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, format, isLive, autoPlay, startTime, isTVMode]);

    // ── Video event listeners ──────────────────────────────────────────────────

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !onTimeUpdate) return;
      const handler = () =>
        onTimeUpdate(video.currentTime, video.duration || 0);
      video.addEventListener("timeupdate", handler);
      return () => video.removeEventListener("timeupdate", handler);
    }, [onTimeUpdate]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !isLive || !onLiveEdgeChange) return;
      const handler = () => {
        let atEdge = true;
        if (video.seekable.length) {
          const liveEdge = video.seekable.end(video.seekable.length - 1);
          atEdge = liveEdge - video.currentTime < 15;
        } else if (hlsRef.current?.liveSyncPosition) {
          atEdge = hlsRef.current.liveSyncPosition - video.currentTime < 15;
        }
        if (atEdge !== lastAtLiveEdgeRef.current) {
          lastAtLiveEdgeRef.current = atEdge;
          onLiveEdgeChange(atEdge);
        }
      };
      video.addEventListener("timeupdate", handler);
      return () => video.removeEventListener("timeupdate", handler);
    }, [isLive, onLiveEdgeChange]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !onEnded) return;
      video.addEventListener("ended", onEnded);
      return () => video.removeEventListener("ended", onEnded);
    }, [onEnded]);

    // ── Status tracking (play/pause/waiting events) ────────────────────────────

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const onPlay = () => onStatusChange?.("playing");
      const onPause = () => onStatusChange?.("paused");
      const onWaiting = () => onStatusChange?.("buffering");
      const onCanPlay = () => {
        // Only transition to playing if actually playing
        if (!video.paused) onStatusChange?.("playing");
      };

      video.addEventListener("play", onPlay);
      video.addEventListener("pause", onPause);
      video.addEventListener("waiting", onWaiting);
      video.addEventListener("canplay", onCanPlay);

      return () => {
        video.removeEventListener("play", onPlay);
        video.removeEventListener("pause", onPause);
        video.removeEventListener("waiting", onWaiting);
        video.removeEventListener("canplay", onCanPlay);
      };
    }, [onStatusChange]);

    return (
      <div
        ref={containerRef}
        data-testid="video-element"
        className="relative w-full h-full bg-black"
      >
        <video ref={videoRef} className="w-full h-full" playsInline />
      </div>
    );
  },
);
