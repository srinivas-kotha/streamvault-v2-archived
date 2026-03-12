import { useState, useRef, useCallback } from 'react';
import type { QualityLevel, VideoPlayerHandle } from './VideoPlayer';
import { formatDuration } from '@shared/utils/formatDuration';
import { useUIStore, usePlayerStore } from '@lib/store';
import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';

function FocusableButton({
  onClick,
  children,
  className = '',
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  const inputMode = useUIStore((s) => s.inputMode);
  const { ref, focused } = useFocusable({
    onEnterPress: onClick,
  });

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`${className} ${
        focused && inputMode === 'keyboard' ? 'ring-2 ring-teal bg-teal/20 rounded-lg outline-none' : ''
      }`}
      title={title}
    >
      {children}
    </button>
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
  const [showVolume, setShowVolume] = useState(false);
  const toggleMiniPlayer = usePlayerStore((s) => s.toggleMiniPlayer);
  const progressRef = useRef<HTMLDivElement>(null);

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
    <div
      className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 bg-gradient-to-t from-obsidian/80 via-transparent to-obsidian/30 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Progress bar */}
      {!isLive && duration > 0 && (
        <div className="px-4 mb-1">
          <div
            ref={progressRef}
            onClick={handleSeek}
            className="w-full h-1.5 bg-white/20 cursor-pointer group/progress hover:h-3 transition-all rounded-full"
          >
            <div className="h-full bg-teal rounded-full relative" style={{ width: `${progress}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-teal rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div className="flex items-center gap-2 px-4 pb-4 pt-2">
        {/* Play/Pause */}
        <FocusableButton
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

        {/* Prev/Next */}
        {hasPrev && (
          <FocusableButton onClick={onPrev!} className="p-1.5 text-white/70 hover:text-white transition-colors" title="Previous">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </FocusableButton>
        )}
        {hasNext && (
          <FocusableButton onClick={onNext!} className="p-1.5 text-white/70 hover:text-white transition-colors" title="Next">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 18h2V6h-2zM4 18l8.5-6L4 6z" transform="scale(-1,1) translate(-24,0)" />
            </svg>
          </FocusableButton>
        )}

        {/* Volume */}
        <div className="relative flex items-center" onMouseEnter={() => setShowVolume(true)} onMouseLeave={() => setShowVolume(false)}>
          <FocusableButton onClick={onMuteToggle} className="p-1.5 text-white/70 hover:text-white transition-colors">
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
          {showVolume && (
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-20 h-1 accent-teal ml-1"
            />
          )}
        </div>

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
            <FocusableButton onClick={() => setShowQuality(!showQuality)} className="p-1.5 text-white/70 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </FocusableButton>
            {showQuality && (
              <div className="absolute bottom-full right-0 mb-2 bg-surface border border-border rounded-lg overflow-hidden shadow-card min-w-[120px]">
                {qualityLevels.map((level) => (
                  <FocusableButton
                    key={level.index}
                    onClick={() => {
                      onQualityChange(level.index);
                      setShowQuality(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      currentQuality === level.index ? 'bg-teal/15 text-teal' : 'text-text-secondary hover:bg-surface-raised'
                    }`}
                  >
                    {level.label}
                  </FocusableButton>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mini-player */}
        <FocusableButton onClick={toggleMiniPlayer} className="p-1.5 text-white/70 hover:text-white transition-colors" title="Mini player">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <rect x="11" y="9" width="9" height="7" rx="1" />
          </svg>
        </FocusableButton>

        {/* PiP */}
        <FocusableButton onClick={() => playerRef.current?.togglePiP()} className="p-1.5 text-white/70 hover:text-white transition-colors" title="Picture-in-Picture">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <rect x="11" y="9" width="9" height="7" rx="1" fill="currentColor" opacity="0.3" />
          </svg>
        </FocusableButton>

        {/* Fullscreen */}
        <FocusableButton onClick={() => playerRef.current?.toggleFullscreen()} className="p-1.5 text-white/70 hover:text-white transition-colors" title="Fullscreen">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </FocusableButton>
      </div>
    </div>
  );
}
