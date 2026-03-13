import { useEffect } from 'react';
import type { VideoPlayerHandle } from '../components/VideoPlayer';
import { isTVMode } from '@shared/utils/isTVMode';

interface UsePlayerKeyboardOptions {
  playerRef: React.RefObject<VideoPlayerHandle | null>;
  isLive: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  onMuteToggle: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onClose?: () => void;
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
}: UsePlayerKeyboardOptions) {
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
          if (video.paused) playerRef.current?.play();
          else playerRef.current?.pause();
          return;
        }
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

        switch (e.key) {
          case 'ArrowLeft':
            if (!isLive) playerRef.current?.seek(Math.max(0, video.currentTime - 10));
            break;
          case 'ArrowRight':
            if (!isLive) playerRef.current?.seek(video.currentTime + 10);
            break;
          case 'ArrowUp':
            onVolumeUp();
            break;
          case 'ArrowDown':
            onVolumeDown();
            break;
        }
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          if (video.paused) playerRef.current?.play();
          else playerRef.current?.pause();
          break;
        case 'f':
          e.preventDefault();
          playerRef.current?.toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          onMuteToggle();
          break;
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

    // We use capture phase so we can stopPropagation before LRUD gets it
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [playerRef, isLive, onNext, onPrev, onMuteToggle, onVolumeUp, onVolumeDown, onClose]);
}
