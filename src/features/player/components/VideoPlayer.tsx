import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import type HlsType from 'hls.js';
import type mpegtsType from 'mpegts.js';

export interface QualityLevel {
  index: number;
  height: number;
  bitrate: number;
  label: string;
}

export interface VideoPlayerHandle {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setQuality: (index: number) => void;
  getVideo: () => HTMLVideoElement | null;
  toggleFullscreen: () => void;
  togglePiP: () => Promise<void>;
}

interface VideoPlayerProps {
  url: string;
  isLive: boolean;
  format: string;
  autoPlay?: boolean;
  startTime?: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onQualityLevelsReady?: (levels: QualityLevel[]) => void;
  onPlayStateChange?: (playing: boolean) => void;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  function VideoPlayer(
    { url, isLive, format, autoPlay = true, startTime = 0, onTimeUpdate, onEnded, onError, onQualityLevelsReady, onPlayStateChange },
    ref,
  ) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<HlsType | null>(null);
    const mpegtsRef = useRef<mpegtsType.Player | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);

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

    useImperativeHandle(ref, () => ({
      play: () => { videoRef.current?.play(); },
      pause: () => { videoRef.current?.pause(); },
      seek: (time: number) => {
        if (videoRef.current) videoRef.current.currentTime = time;
      },
      setQuality: (index: number) => {
        if (hlsRef.current) hlsRef.current.currentLevel = index;
      },
      getVideo: () => videoRef.current,
      toggleFullscreen: () => {
        const doc = document as Document & {
          webkitFullscreenElement?: Element;
          mozFullScreenElement?: Element;
          msFullscreenElement?: Element;
          webkitExitFullscreen?: () => void;
          mozCancelFullScreen?: () => void;
          msExitFullscreen?: () => void;
        };

        const isFullscreen = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;

        if (isFullscreen) {
          if (doc.exitFullscreen) doc.exitFullscreen();
          else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
          else if (doc.mozCancelFullScreen) doc.mozCancelFullScreen();
          else if (doc.msExitFullscreen) doc.msExitFullscreen();
          return;
        }

        // Try container fullscreen first (shows controls overlay), fall back to video element (iOS)
        const el = containerRef.current as (HTMLDivElement & {
          webkitRequestFullscreen?: () => void;
          mozRequestFullScreen?: () => void;
          msRequestFullscreen?: () => void;
        }) | null;

        const video = videoRef.current as (HTMLVideoElement & {
          webkitEnterFullscreen?: () => void;
        }) | null;

        if (el?.requestFullscreen) el.requestFullscreen().catch(() => { video?.webkitEnterFullscreen?.(); });
        else if (el?.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el?.mozRequestFullScreen) el.mozRequestFullScreen();
        else if (el?.msRequestFullscreen) el.msRequestFullscreen();
        else if (video?.webkitEnterFullscreen) video.webkitEnterFullscreen(); // iOS Safari fallback
      },
      togglePiP: async () => {
        const video = videoRef.current;
        if (!video) return;
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else if (document.pictureInPictureEnabled) await video.requestPictureInPicture();
      },
    }));

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !url) return;

      let cancelled = false;
      setIsReady(false);
      const isHls = format === 'm3u8' || url.endsWith('.m3u8');
      let hlsRetryCount = 0;
      const HLS_MAX_RETRIES = 3;
      let fallbackAttempted = false;

      const startDirectPlayback = () => {
        if (cancelled) return;
        destroyPlayers();
        video.src = url;
        video.onloadeddata = () => {
          if (cancelled) return;
          setIsReady(true);
          if (startTime > 0 && !isLive) video.currentTime = startTime;
          if (autoPlay) video.play().catch(() => {});
        };
        video.onerror = () => {
          if (cancelled) return;
          // If direct playback fails and we haven't tried HLS yet, attempt HLS fallback
          if (!fallbackAttempted && !isHls) {
            fallbackAttempted = true;
            initHls();
          } else {
            onError?.('Channel unavailable');
          }
        };
        if (autoPlay) video.play().catch(() => {});
      };

      const startHlsPlayback = (Hls: typeof HlsType) => {
        if (cancelled) return;
        destroyPlayers();
        const hls = new Hls({
          enableWorker: true,
          capLevelToPlayerSize: true,
          maxBufferLength: isLive ? 10 : 30,
          maxMaxBufferLength: isLive ? 30 : 120,
          maxBufferSize: 60 * 1000 * 1000, // 60MB
          maxBufferHole: 0.5,
          startLevel: -1,
          ...(isLive ? {
            lowLatencyMode: true,
            liveSyncDuration: 3,
            liveMaxLatencyDuration: 10,
            liveBackBufferLength: 30,
            backBufferLength: 30,
          } : {
            backBufferLength: 60,
          }),
        });
        hlsRef.current = hls;
        hls.attachMedia(video);
        hls.loadSource(url);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (cancelled) return;
          setIsReady(true);
          if (onQualityLevelsReady) {
            const levels: QualityLevel[] = hls.levels.map((level, i) => ({
              index: i,
              height: level.height,
              bitrate: level.bitrate,
              label: level.height ? `${level.height}p` : `${Math.round(level.bitrate / 1000)}kbps`,
            }));
            levels.unshift({ index: -1, height: 0, bitrate: 0, label: 'Auto' });
            onQualityLevelsReady(levels);
          }
          if (startTime > 0 && !isLive) video.currentTime = startTime;
          if (autoPlay) video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (cancelled) return;
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hlsRetryCount++;
              if (hlsRetryCount <= HLS_MAX_RETRIES) {
                onError?.(`Network error - retry ${hlsRetryCount}/${HLS_MAX_RETRIES}...`);
                hls.startLoad();
              } else {
                // HLS retries exhausted -- fall back to direct playback
                if (!fallbackAttempted) {
                  fallbackAttempted = true;
                  startDirectPlayback();
                } else {
                  onError?.('Channel unavailable');
                }
              }
            } else {
              // Non-recoverable HLS error -- fall back to direct playback
              if (!fallbackAttempted) {
                fallbackAttempted = true;
                startDirectPlayback();
              } else {
                onError?.('Channel unavailable');
              }
            }
          }
        });
      };

      const initHls = async () => {
        const { default: Hls } = await import('hls.js');
        if (cancelled) return;
        if (Hls.isSupported()) {
          startHlsPlayback(Hls);
        } else {
          startDirectPlayback();
        }
      };

      const startMpegtsPlayback = async () => {
        if (cancelled) return;
        destroyPlayers();
        try {
          const mpegts = await import('mpegts.js');
          if (cancelled || !mpegts.default.isSupported()) {
            startDirectPlayback();
            return;
          }
          const player = mpegts.default.createPlayer({
            type: 'mpegts',
            isLive: true,
            url,
          }, {
            enableWorker: true,
            enableStashBuffer: false,
            stashInitialSize: 128 * 1024, // 128KB
            liveBufferLatencyChasing: true,
            liveBufferLatencyMaxLatency: 3,
            liveBufferLatencyMinRemain: 0.5,
          });
          mpegtsRef.current = player;
          player.attachMediaElement(video);
          player.load();

          player.on(mpegts.default.Events.ERROR, () => {
            if (cancelled) return;
            if (!fallbackAttempted) {
              fallbackAttempted = true;
              startDirectPlayback();
            } else {
              onError?.('Channel unavailable');
            }
          });

          video.onloadeddata = () => {
            if (cancelled) return;
            setIsReady(true);
          };
          if (autoPlay) player.play();
        } catch {
          if (!cancelled) startDirectPlayback();
        }
      };

      const isTs = format === 'ts';

      if (isTs) {
        // MPEG-TS stream — use mpegts.js
        startMpegtsPlayback();
      } else if (isHls) {
        // Check native HLS support first (Safari), otherwise dynamic-import hls.js
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url;
          setIsReady(true);
          if (startTime > 0 && !isLive) video.currentTime = startTime;
          if (autoPlay) video.play().catch(() => {});
        } else {
          initHls();
        }
      } else {
        // Direct playback for .mp4 or other formats
        startDirectPlayback();
      }

      return () => {
        cancelled = true;
        destroyPlayers();
        video.onloadeddata = null;
        video.onerror = null;
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, format, isLive, autoPlay, startTime, onError, onQualityLevelsReady, destroyPlayers]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !onTimeUpdate) return;
      const handler = () => onTimeUpdate(video.currentTime, video.duration || 0);
      video.addEventListener('timeupdate', handler);
      return () => video.removeEventListener('timeupdate', handler);
    }, [onTimeUpdate]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !onEnded) return;
      video.addEventListener('ended', onEnded);
      return () => video.removeEventListener('ended', onEnded);
    }, [onEnded]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !onPlayStateChange) return;
      const onPlay = () => onPlayStateChange(true);
      const onPause = () => onPlayStateChange(false);
      video.addEventListener('play', onPlay);
      video.addEventListener('pause', onPause);
      return () => {
        video.removeEventListener('play', onPlay);
        video.removeEventListener('pause', onPause);
      };
    }, [onPlayStateChange]);

    return (
      <div ref={containerRef} className="relative w-full h-full bg-black">
        <video ref={videoRef} className="w-full h-full" playsInline />
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-obsidian">
            <div className="w-12 h-12 border-4 border-teal/30 border-t-teal rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  },
);
