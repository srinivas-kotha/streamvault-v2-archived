import { useRef, useState, useCallback, useEffect } from 'react';
import { useStreamUrl } from '../api';
import { VideoPlayer, type VideoPlayerHandle, type QualityLevel } from './VideoPlayer';
import { PlayerControls } from './PlayerControls';
import { usePlayerKeyboard } from '../hooks/usePlayerKeyboard';
import { useProgressTracking } from '../hooks/useProgressTracking';
import { usePlayerStore } from '@lib/store';
import { FocusContext, useFocusable } from '@noriginmedia/norigin-spatial-navigation';

interface PlayerPageProps {
  streamType: string;
  streamId: string;
  streamName?: string;
  startTime?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  onClose?: () => void;
}

export function PlayerPage({
  streamType,
  streamId,
  streamName,
  startTime = 0,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
  onClose,
}: PlayerPageProps) {
  const playerRef = useRef<VideoPlayerHandle>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);

  const { data: streamData, isLoading } = useStreamUrl(streamType, streamId);
  const isLive = streamData?.isLive ?? streamType === 'live';

  const { onTimeUpdate: trackProgress } = useProgressTracking({
    contentId: streamId,
    contentType: streamType === 'live' ? 'channel' : streamType === 'vod' ? 'vod' : 'series',
    contentName: streamName,
    isLive,
  });

  const handleTimeUpdate = useCallback(
    (time: number, dur: number) => {
      setCurrentTime(time);
      setDuration(dur);
      trackProgress(time, dur);
    },
    [trackProgress],
  );

  const handleQualityChange = useCallback((index: number) => {
    setCurrentQuality(index);
    playerRef.current?.setQuality(index);
  }, []);

  const handleVolumeUp = useCallback(() => setVolume(Math.min(1, volume + 0.1)), [volume, setVolume]);
  const handleVolumeDown = useCallback(() => setVolume(Math.max(0, volume - 0.1)), [volume, setVolume]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 4000);
  }, []);

  // Show controls when paused
  useEffect(() => {
    if (!isPlaying) showControls();
  }, [isPlaying, showControls]);

  // Spatial Navigation wrapper
  const { ref, focusKey, hasFocusedChild } = useFocusable({
    focusKey: 'player',
  });

  // Keep controls visible if user is navigating controls with D-pad
  useEffect(() => {
    if (hasFocusedChild) showControls();
  }, [hasFocusedChild, showControls]);

  usePlayerKeyboard({
    playerRef,
    isLive,
    onNext,
    onPrev,
    onMuteToggle: toggleMute,
    onVolumeUp: handleVolumeUp,
    onVolumeDown: handleVolumeDown,
    onClose,
  });

  // Sync volume to video element
  useEffect(() => {
    const video = playerRef.current?.getVideo();
    if (video) {
      video.volume = volume;
      video.muted = isMuted;
    }
  }, [volume, isMuted]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh] bg-obsidian rounded-xl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal/30 border-t-teal rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary text-sm">Loading stream...</p>
        </div>
      </div>
    );
  }

  if (error || !streamData) {
    return (
      <div className="flex items-center justify-center h-[70vh] bg-surface rounded-xl">
        <div className="text-center">
          <svg className="w-12 h-12 text-error mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-error font-medium mb-2">Playback Error</p>
          <p className="text-text-muted text-sm mb-4">{error || 'Could not load stream'}</p>
          <button
            onClick={() => setError(null)}
            className="px-4 py-2 bg-teal/15 text-teal rounded-lg text-sm hover:bg-teal/25 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <FocusContext.Provider value={focusKey}>
      <div 
        ref={ref}
        className="relative aspect-video bg-black rounded-xl overflow-hidden focus:outline-none"
        onMouseMove={showControls}
        onMouseLeave={() => isPlaying && setControlsVisible(false)}
      >
        <VideoPlayer
        ref={playerRef}
        url={streamData.url}
        isLive={streamData.isLive}
        format={streamData.format}
        startTime={startTime}
        onTimeUpdate={handleTimeUpdate}
        onEnded={onNext}
        onError={setError}
        onQualityLevelsReady={setQualityLevels}
        onPlayStateChange={setIsPlaying}
      />
      <PlayerControls
        playerRef={playerRef}
        isPlaying={isPlaying}
        isLive={isLive}
        currentTime={currentTime}
        duration={duration}
        qualityLevels={qualityLevels}
        currentQuality={currentQuality}
        onQualityChange={handleQualityChange}
        volume={volume}
        isMuted={isMuted}
        onVolumeChange={setVolume}
        onMuteToggle={toggleMute}
        hasNext={hasNext}
        hasPrev={hasPrev}
        onNext={onNext}
        onPrev={onPrev}
        visible={controlsVisible}
      />
      {streamName && (
        <div className="absolute top-4 left-4 text-white/80 text-sm font-medium bg-obsidian/50 px-3 py-1 rounded-lg backdrop-blur-sm">
          {streamName}
        </div>
      )}
      </div>
    </FocusContext.Provider>
  );
}
