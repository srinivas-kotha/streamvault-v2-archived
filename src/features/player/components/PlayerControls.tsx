import { useState, useRef, useCallback } from 'react';
import type { QualityLevel, VideoPlayerHandle } from './VideoPlayer';
import type React from 'react';
import { formatDuration } from '@shared/utils/formatDuration';
import { isTVMode } from '@shared/utils/isTVMode';
import {
  useSpatialFocusable,
  useSpatialContainer,
  FocusContext,
} from '@shared/hooks/useSpatialNav';

function FocusableButton({
  id,
  onClick,
  children,
  className = '',
  title,
}: {
  id: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: id,
    onEnterPress: onClick,
  });

  return (
    <button
      ref={ref}
      {...focusProps}
      onClick={onClick}
      className={`${className} ${
        showFocusRing ? 'ring-2 ring-teal bg-teal/20 rounded-lg outline-none' : ''
      }`}
      title={title}
    >
      {children}
    </button>
  );
}

function FocusableVolumeSlider({ volume, isMuted, onVolumeChange }: {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (v: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: 'player-volume-slider',
    focusable: !isTVMode,
    onEnterPress: () => inputRef.current?.focus(),
    onArrowPress: (dir: string) => {
      if (dir === 'left') {
        onVolumeChange(Math.max(0, volume - 0.1));
        return false;
      }
      if (dir === 'right') {
        onVolumeChange(Math.min(1, volume + 0.1));
        return false;
      }
      return true;
    },
  });

  return (
    <div ref={ref} {...focusProps} className={`flex items-center gap-1 px-1 py-0.5 rounded ${showFocusRing ? 'ring-2 ring-teal bg-teal/20' : ''}`}>
      <input
        ref={inputRef}
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={isMuted ? 0 : volume}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
        className="w-20 h-1 accent-teal"
      />
    </div>
  );
}

function FocusableProgressBar({ progressRef, progress, onSeek, playerRef, duration, isLive }: {
  progressRef: React.RefObject<HTMLDivElement | null>;
  progress: number;
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void;
  playerRef: React.RefObject<VideoPlayerHandle | null>;
  duration: number;
  isLive: boolean;
}) {
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: 'player-progress-bar',
    focusable: !isTVMode,
    onArrowPress: (dir: string) => {
      if (dir === 'left') {
        const video = playerRef.current?.getVideo();
        if (video) playerRef.current?.seek(Math.max(0, video.currentTime - 10));
        return false;
      }
      if (dir === 'right') {
        const video = playerRef.current?.getVideo();
        if (video) playerRef.current?.seek(Math.min(duration, video.currentTime + 10));
        return false;
      }
      return true;
    },
  });

  const handleTouchSeek = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!progressRef.current || isLive || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];
    if (!touch) return;
    const pct = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    playerRef.current?.seek(pct * duration);
  }, [progressRef, playerRef, duration, isLive]);

  return (
    <div ref={ref} {...focusProps} className="px-4 mb-1">
      <div
        ref={progressRef}
        onClick={onSeek}
        onTouchStart={handleTouchSeek}
        onTouchMove={handleTouchSeek}
        className={`w-full h-1.5 bg-white/20 cursor-pointer group/progress hover:h-3 transition-all rounded-full touch-none ${showFocusRing ? 'h-3 ring-2 ring-teal/60' : ''}`}
      >
        <div className="h-full bg-teal rounded-full relative" style={{ width: `${progress}%` }}>
          <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-teal rounded-full transition-opacity ${showFocusRing ? 'opacity-100' : 'opacity-0 group-hover/progress:opacity-100'}`} />
        </div>
      </div>
    </div>
  );
}

/** Quality dropdown items — only mounted when dropdown is open (conditional render pattern) */
function QualityDropdownItems({
  qualityLevels,
  currentQuality,
  onQualityChange,
  onClose,
}: {
  qualityLevels: QualityLevel[];
  currentQuality: number;
  onQualityChange: (index: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-full right-0 mb-2 bg-surface border border-border rounded-lg overflow-hidden shadow-card min-w-[120px]">
      {qualityLevels.map((level) => (
        <FocusableButton
          id={`player-quality-${level.index}`}
          key={level.index}
          onClick={() => {
            onQualityChange(level.index);
            onClose();
          }}
          className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
            currentQuality === level.index ? 'bg-teal/15 text-teal' : 'text-text-secondary hover:bg-surface-raised'
          }`}
        >
          {level.label}
        </FocusableButton>
      ))}
    </div>
  );
}

interface PlayerControlsProps {
  playerRef: React.RefObject<VideoPlayerHandle | null>;
  isPlaying: boolean;
  isLive: boolean;
  currentTime: number;
  duration: number;
  qualityLevels: QualityLevel[];
  currentQuality: number;
  onQualityChange: (index: number) => void;
  volume: number;
  isMuted: boolean;
  onVolumeChange: (v: number) => void;
  onMuteToggle: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  visible?: boolean;
}

export function PlayerControls({
  playerRef,
  isPlaying,
  isLive,
  currentTime,
  duration,
  qualityLevels,
  currentQuality,
  onQualityChange,
  volume,
  isMuted,
  onVolumeChange,
  onMuteToggle,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
  visible = true,
}: PlayerControlsProps) {
  const [showQuality, setShowQuality] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  // Spatial Navigation: controls container
  const { ref: containerRef, focusKey } = useSpatialContainer({
    focusKey: 'player-controls',
  });

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || isLive || !duration) return;
      const rect = progressRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      playerRef.current?.seek(pct * duration);
    },
    [playerRef, isLive, duration],
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={containerRef}
        className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 bg-gradient-to-t from-obsidian/80 via-transparent to-obsidian/30 ${
          visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress bar */}
        {!isLive && duration > 0 && (
          <FocusableProgressBar
            progressRef={progressRef}
            progress={progress}
            onSeek={handleSeek}
            playerRef={playerRef}
            duration={duration}
            isLive={isLive}
          />
        )}

        {/* Controls bar */}
        <div className="flex items-center gap-2 px-4 pb-4 pt-2">
          {/* Play/Pause */}
          <FocusableButton
            id="player-play-pause"
            onClick={() => (isPlaying ? playerRef.current?.pause() : playerRef.current?.play())}
            className="p-2 text-white hover:text-teal transition-colors"
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
          </FocusableButton>

          {/* Rewind -10s */}
          {!isLive && duration > 0 && (
            <FocusableButton
              id="player-rewind"
              onClick={() => playerRef.current?.seek(Math.max(0, currentTime - 10))}
              className="p-1.5 text-white/70 hover:text-white transition-colors"
              title="Rewind 10s"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.5 3C7.81 3 4.01 6.54 3.57 11H1l3.5 4 3.5-4H5.59c.44-3.36 3.3-6 6.91-6 3.87 0 7 3.13 7 7s-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C7.82 20.04 10.05 21 12.5 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z" />
                <text x="10" y="15.5" fontSize="7.5" fontWeight="bold" textAnchor="middle" fill="currentColor">10</text>
              </svg>
            </FocusableButton>
          )}

          {/* Fast-forward +10s */}
          {!isLive && duration > 0 && (
            <FocusableButton
              id="player-forward"
              onClick={() => playerRef.current?.seek(Math.min(duration, currentTime + 10))}
              className="p-1.5 text-white/70 hover:text-white transition-colors"
              title="Forward 10s"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.5 3c4.69 0 8.49 3.54 8.93 8H23l-3.5 4-3.5-4h2.02c-.44-3.36-3.3-6-6.91-6-3.87 0-7 3.13-7 7s3.13 7 7 7c1.93 0 3.68-.79 4.94-2.06l1.42 1.42C15.68 20.04 13.45 21 11.5 21c-4.97 0-9-4.03-9-9s4.03-9 9-9z" />
                <text x="14" y="15.5" fontSize="7.5" fontWeight="bold" textAnchor="middle" fill="currentColor">10</text>
              </svg>
            </FocusableButton>
          )}

          {/* Prev/Next */}
          {hasPrev && (
            <FocusableButton id="player-prev" onClick={onPrev!} className="p-1.5 text-white/70 hover:text-white transition-colors" title="Previous">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </FocusableButton>
          )}
          {hasNext && (
            <FocusableButton id="player-next" onClick={onNext!} className="p-1.5 text-white/70 hover:text-white transition-colors" title="Next">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 18h2V6h-2zM4 18l8.5-6L4 6z" transform="scale(-1,1) translate(-24,0)" />
              </svg>
            </FocusableButton>
          )}

          {/* Volume */}
          <FocusableButton id="player-mute" onClick={onMuteToggle} className="p-1.5 text-white/70 hover:text-white transition-colors">
            {isMuted || volume === 0 ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </FocusableButton>
          <FocusableVolumeSlider volume={volume} isMuted={isMuted} onVolumeChange={onVolumeChange} />

          {/* Time */}
          {!isLive && duration > 0 && (
            <span className="text-xs text-white/70 ml-1">
              {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
            </span>
          )}
          {isLive && (
            <span className="flex items-center gap-1 text-xs text-error ml-1">
              <span className="w-2 h-2 bg-error rounded-full animate-pulse" />
              LIVE
            </span>
          )}

          <div className="flex-1" />

          {/* Quality */}
          {qualityLevels.length > 1 && (
            <div className="relative">
              <FocusableButton id="player-quality-toggle" onClick={() => setShowQuality(!showQuality)} className="p-1.5 text-white/70 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </FocusableButton>
              {showQuality && (
                <QualityDropdownItems
                  qualityLevels={qualityLevels}
                  currentQuality={currentQuality}
                  onQualityChange={onQualityChange}
                  onClose={() => setShowQuality(false)}
                />
              )}
            </div>
          )}

          {/* PiP — hidden in standalone/TV mode */}
          {!isTVMode && (
            <FocusableButton id="player-pip" onClick={() => playerRef.current?.togglePiP()} className="p-1.5 text-white/70 hover:text-white transition-colors" title="Picture-in-Picture">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <rect x="11" y="9" width="9" height="7" rx="1" fill="currentColor" opacity="0.3" />
              </svg>
            </FocusableButton>
          )}

          {/* Fullscreen — hidden in TV mode (already fullscreen) */}
          {!isTVMode && (
            <FocusableButton id="player-fullscreen" onClick={() => playerRef.current?.toggleFullscreen()} className="p-1.5 text-white/70 hover:text-white transition-colors" title="Fullscreen">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </FocusableButton>
          )}
        </div>
      </div>
    </FocusContext.Provider>
  );
}
