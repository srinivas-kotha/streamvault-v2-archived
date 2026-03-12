import { useEffect } from 'react';
import type { VideoPlayerHandle } from '../components/VideoPlayer';

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
        case 'ArrowLeft':
          e.preventDefault();
          if (!isLive) playerRef.current?.seek(Math.max(0, video.currentTime - 10));
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (!isLive) playerRef.current?.seek(video.currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          onVolumeUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          onVolumeDown();
          break;
        case 'n':
          if (onNext) { e.preventDefault(); onNext(); }
          break;
        case 'p':
          if (onPrev) { e.preventDefault(); onPrev(); }
          break;
        case 'Backspace':
        case 'Escape':
          e.preventDefault();
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else if (onClose) {
            onClose();
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerRef, isLive, onNext, onPrev, onMuteToggle, onVolumeUp, onVolumeDown, onClose]);
}
