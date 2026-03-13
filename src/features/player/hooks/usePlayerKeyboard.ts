import { useEffect, useRef } from 'react';
import type { VideoPlayerHandle } from '../components/VideoPlayer';
import { isTVMode } from '@shared/utils/isTVMode';

interface SeekHoldState {
  key: 'ArrowLeft' | 'ArrowRight';
  startTime: number;
  accumulatedSeek: number;
}

/** Returns the seek step (in seconds) based on how long the key has been held */
function getSeekStep(holdDurationMs: number): { step: number; speed: number } {
  if (holdDurationMs >= 4000) return { step: 120, speed: 8 };
  if (holdDurationMs >= 2000) return { step: 60, speed: 4 };
  if (holdDurationMs >= 500) return { step: 30, speed: 2 };
  return { step: 10, speed: 1 };
}

interface UsePlayerKeyboardOptions {
  playerRef: React.RefObject<VideoPlayerHandle | null>;
  isLive: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  onMuteToggle: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onClose?: () => void;
  onOSD?: (action: { type: string; value?: number; speed?: number; timestamp: number }) => void;
}

export function usePlayerKeyboard({
  playerRef,
  isLive,
  onNext,
  onPrev,
  onMuteToggle,
  onVolumeUp,
  onVolumeDown,
  onClose,
  onOSD,
}: UsePlayerKeyboardOptions) {
  const holdStateRef = useRef<SeekHoldState | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const video = playerRef.current?.getVideo();
      if (!video) return;

      // Handle Enter (Play/Pause) directly if navigating generic UI
      if (e.key === 'Enter') {
        const active = document.activeElement;
        const isGenericFocus =
          !active ||
          active === document.body ||
          active === video ||
          active.tagName === 'VIDEO';
        if (isGenericFocus) {
          e.preventDefault();
          e.stopPropagation();
          const wasPaused = video.paused;
          if (wasPaused) playerRef.current?.play();
          else playerRef.current?.pause();
          onOSD?.({ type: wasPaused ? 'play' : 'pause', timestamp: Date.now() });
          return;
        }
      }

      // Number keys 0-9: seek to percentage of duration
      if (!isLive && video.duration > 0 && e.key >= '0' && e.key <= '9' && !e.repeat) {
        e.preventDefault();
        e.stopPropagation();
        const pct = parseInt(e.key, 10) / 10; // 0 = 0%, 5 = 50%, 9 = 90%
        const targetTime = pct * video.duration;
        playerRef.current?.seek(targetTime);
        onOSD?.({ type: 'seek-percent', value: pct * 100, timestamp: Date.now() });
        return;
      }

      // Arrow keys: seek ±10s (LEFT/RIGHT) and volume ±0.1 (UP/DOWN)
      const isArrowKey = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key);
      if (isArrowKey) {
        // In TV mode, ALWAYS intercept arrows for seek/volume — even if a control button has LRUD focus.
        // On desktop, only intercept when no specific control is focused (let LRUD handle button navigation).
        if (!isTVMode) {
          const active = document.activeElement;
          const isGenericFocus =
            !active ||
            active === document.body ||
            active === video ||
            active.tagName === 'VIDEO';
          if (!isGenericFocus) return;
        }

        e.stopPropagation();
        e.preventDefault();

        // Handle horizontal arrows with hold-to-seek acceleration
        if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !isLive) {
          const direction = e.key === 'ArrowRight' ? 1 : -1;

          if (!e.repeat) {
            // First press — seek ±10s and start tracking hold
            holdStateRef.current = {
              key: e.key,
              startTime: Date.now(),
              accumulatedSeek: 10 * direction,
            };
            const newTime = video.currentTime + 10 * direction;
            playerRef.current?.seek(Math.max(0, Math.min(video.duration, newTime)));
            onOSD?.({
              type: direction > 0 ? 'seek-forward' : 'seek-back',
              timestamp: Date.now(),
            });
          } else {
            // Repeat event (key held down) — accelerated seek
            const hold = holdStateRef.current;
            if (hold && hold.key === e.key) {
              const holdDuration = Date.now() - hold.startTime;
              const { step, speed } = getSeekStep(holdDuration);
              const seekAmount = step * direction;
              hold.accumulatedSeek += seekAmount;

              const newTime = video.currentTime + seekAmount;
              playerRef.current?.seek(Math.max(0, Math.min(video.duration, newTime)));

              if (speed > 1) {
                onOSD?.({
                  type: direction > 0 ? 'fast-forward' : 'fast-rewind',
                  speed,
                  value: Math.abs(hold.accumulatedSeek),
                  timestamp: Date.now(),
                });
              } else {
                onOSD?.({
                  type: direction > 0 ? 'seek-forward' : 'seek-back',
                  timestamp: Date.now(),
                });
              }
            }
          }
          return;
        }

        switch (e.key) {
          case 'ArrowUp':
            onVolumeUp();
            onOSD?.({ type: 'volume', timestamp: Date.now() });
            break;
          case 'ArrowDown':
            onVolumeDown();
            onOSD?.({ type: 'volume', timestamp: Date.now() });
            break;
        }
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k': {
          e.preventDefault();
          const wasPaused = video.paused;
          if (wasPaused) playerRef.current?.play();
          else playerRef.current?.pause();
          onOSD?.({ type: wasPaused ? 'play' : 'pause', timestamp: Date.now() });
          break;
        }
        case 'f':
          e.preventDefault();
          playerRef.current?.toggleFullscreen();
          break;
        case 'm': {
          e.preventDefault();
          const wasMuted = video.muted;
          onMuteToggle();
          onOSD?.({ type: wasMuted ? 'unmute' : 'mute', timestamp: Date.now() });
          break;
        }
        case 'n':
          if (onNext) { e.preventDefault(); onNext(); }
          break;
        case 'p':
          if (onPrev) { e.preventDefault(); onPrev(); }
          break;
        case 'Backspace':
        case 'Escape':
        case 'GoBack': // Samsung TV Back Key
          e.preventDefault();
          e.stopPropagation();
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else if (onClose) {
            onClose();
          }
          break;
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        holdStateRef.current = null;
      }
    }

    // We use capture phase so we can stopPropagation before LRUD gets it
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
    };
  }, [playerRef, isLive, onNext, onPrev, onMuteToggle, onVolumeUp, onVolumeDown, onClose, onOSD]);
}
