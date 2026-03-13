import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import Hls from 'hls.js';

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
    const hlsRef = useRef<Hls | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);

    const destroyHls = useCallback(() => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
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
        const el = containerRef.current as (HTMLDivElement & {
          webkitRequestFullscreen?: () => void;
          mozRequestFullScreen?: () => void;
          msRequestFullscreen?: () => void;
        }) | null;
        if (!el) return;

        const isFullscreen = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;

        if (isFullscreen) {
          if (doc.exitFullscreen) doc.exitFullscreen();
          else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
          else if (doc.mozCancelFullScreen) doc.mozCancelFullScreen();
          else if (doc.msExitFullscreen) doc.msExitFullscreen();
        } else {
          if (el.requestFullscreen) el.requestFullscreen();
          else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
          else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
          else if (el.msRequestFullscreen) el.msRequestFullscreen();
        }
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

      setIsReady(false);
      const isHls = format === 'm3u8' || url.endsWith('.m3u8');
      let hlsRetryCount = 0;
      const HLS_MAX_RETRIES = 3;
      let fallbackAttempted = false;

      const startDirectPlayback = () => {
        destroyHls();
        video.src = url;
        video.onloadeddata = () => {
          setIsReady(true);
          if (startTime > 0 && !isLive) video.currentTime = startTime;
          if (autoPlay) video.play().catch(() => {});
        };
        video.onerror = () => {
          // If direct playback fails and we haven't tried HLS yet, attempt HLS fallback
          if (!fallbackAttempted && !isHls && Hls.isSupported()) {
            fallbackAttempted = true;
            startHlsPlayback();
          } else {
            onError?.('Channel unavailable');
          }
        };
        if (autoPlay) video.play().catch(() => {});
      };

      const startHlsPlayback = () => {
        destroyHls();
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

      if (isHls && Hls.isSupported()) {
        startHlsPlayback();
      } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = url;
        setIsReady(true);
        if (startTime > 0 && !isLive) video.currentTime = startTime;
        if (autoPlay) video.play().catch(() => {});
      } else {
        // Direct playback for .ts, .mp4, or non-HLS streams
        startDirectPlayback();
      }

      return () => {
        destroyHls();
        video.onloadeddata = null;
        video.onerror = null;
      };
    }, [url, format, isLive, autoPlay, startTime, onError, onQualityLevelsReady, destroyHls]);

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
