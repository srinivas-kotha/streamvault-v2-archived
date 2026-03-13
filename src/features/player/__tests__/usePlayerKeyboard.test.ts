import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock isTVMode before importing usePlayerKeyboard (it evaluates at module load)
vi.mock('@shared/utils/isTVMode', () => ({ isTVMode: false }));

import { usePlayerKeyboard } from '../hooks/usePlayerKeyboard';
import type { VideoPlayerHandle } from '../components/VideoPlayer';

function createMockPlayer(overrides: Partial<{ paused: boolean; currentTime: number }> = {}) {
  const video = {
    paused: overrides.paused ?? true,
    currentTime: overrides.currentTime ?? 50,
  } as unknown as HTMLVideoElement;
  return {
    current: {
      getVideo: () => video,
      play: vi.fn(),
      pause: vi.fn(),
      toggleFullscreen: vi.fn(),
      togglePiP: vi.fn().mockResolvedValue(undefined),
      seek: vi.fn(),
      setQuality: vi.fn(),
    } satisfies VideoPlayerHandle,
  } as React.RefObject<VideoPlayerHandle | null>;
}

function fireKey(key: string, target?: EventTarget | null) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true });
  if (target) {
    Object.defineProperty(event, 'target', { value: target });
  }
  window.dispatchEvent(event);
  return event;
}

describe('usePlayerKeyboard', () => {
  let onNext: ReturnType<typeof vi.fn>;
  let onPrev: ReturnType<typeof vi.fn>;
  let onMuteToggle: ReturnType<typeof vi.fn>;
  let onVolumeUp: ReturnType<typeof vi.fn>;
  let onVolumeDown: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onNext = vi.fn();
    onPrev = vi.fn();
    onMuteToggle = vi.fn();
    onVolumeUp = vi.fn();
    onVolumeDown = vi.fn();
  });

  it('Space toggles play when paused', () => {
    const playerRef = createMockPlayer({ paused: true });
    renderHook(() =>
      usePlayerKeyboard({
        playerRef,
        isLive: false,
        onNext,
        onPrev,
        onMuteToggle,
        onVolumeUp,
        onVolumeDown,
      }),
    );

    fireKey(' ');
    expect(playerRef.current!.play).toHaveBeenCalled();
  });

  it('Space toggles pause when playing', () => {
    const playerRef = createMockPlayer({ paused: false });
    renderHook(() =>
      usePlayerKeyboard({
        playerRef,
        isLive: false,
        onNext,
        onPrev,
        onMuteToggle,
        onVolumeUp,
        onVolumeDown,
      }),
    );

    fireKey(' ');
    expect(playerRef.current!.pause).toHaveBeenCalled();
  });

  it('K toggles play/pause', () => {
    const playerRef = createMockPlayer({ paused: true });
    renderHook(() =>
      usePlayerKeyboard({
        playerRef,
        isLive: false,
        onNext,
        onPrev,
        onMuteToggle,
        onVolumeUp,
        onVolumeDown,
      }),
    );

    fireKey('k');
    expect(playerRef.current!.play).toHaveBeenCalled();
  });

  it('F triggers fullscreen toggle', () => {
    const playerRef = createMockPlayer();
    renderHook(() =>
      usePlayerKeyboard({
        playerRef,
        isLive: false,
        onNext,
        onPrev,
        onMuteToggle,
        onVolumeUp,
        onVolumeDown,
      }),
    );

    fireKey('f');
    expect(playerRef.current!.toggleFullscreen).toHaveBeenCalled();
  });

  it('M triggers mute toggle', () => {
    const playerRef = createMockPlayer();
    renderHook(() =>
      usePlayerKeyboard({
        playerRef,
        isLive: false,
        onNext,
        onPrev,
        onMuteToggle,
        onVolumeUp,
        onVolumeDown,
      }),
    );

    fireKey('m');
    expect(onMuteToggle).toHaveBeenCalled();
  });

  it('ArrowLeft seeks -10s when not live', () => {
    const playerRef = createMockPlayer({ currentTime: 50 });
    renderHook(() =>
      usePlayerKeyboard({
        playerRef,
        isLive: false,
        onNext,
        onPrev,
        onMuteToggle,
        onVolumeUp,
        onVolumeDown,
      }),
    );

    fireKey('ArrowLeft');
    expect(playerRef.current!.seek).toHaveBeenCalledWith(40);
  });

  it('ArrowRight seeks +10s when not live', () => {
    const playerRef = createMockPlayer({ currentTime: 50 });
    renderHook(() =>
      usePlayerKeyboard({
        playerRef,
        isLive: false,
        onNext,
        onPrev,
        onMuteToggle,
        onVolumeUp,
        onVolumeDown,
      }),
    );

    fireKey('ArrowRight');
    expect(playerRef.current!.seek).toHaveBeenCalledWith(60);
  });

  it('ArrowLeft does NOT seek when isLive=true', () => {
    const playerRef = createMockPlayer({ currentTime: 50 });
    renderHook(() =>
      usePlayerKeyboard({
        playerRef,
        isLive: true,
        onNext,
        onPrev,
        onMuteToggle,
        onVolumeUp,
        onVolumeDown,
      }),
    );

    fireKey('ArrowLeft');
    expect(playerRef.current!.seek).not.toHaveBeenCalled();
  });

  it('ArrowRight does NOT seek when isLive=true', () => {
    const playerRef = createMockPlayer({ currentTime: 50 });
    renderHook(() =>
      usePlayerKeyboard({
        playerRef,
        isLive: true,
        onNext,
        onPrev,
        onMuteToggle,
        onVolumeUp,
        onVolumeDown,
      }),
    );

    fireKey('ArrowRight');
    expect(playerRef.current!.seek).not.toHaveBeenCalled();
  });

  it('N calls onNext', () => {
    const playerRef = createMockPlayer();
    renderHook(() =>
      usePlayerKeyboard({
        playerRef,
        isLive: false,
        onNext,
        onPrev,
        onMuteToggle,
        onVolumeUp,
        onVolumeDown,
      }),
    );

    fireKey('n');
    expect(onNext).toHaveBeenCalled();
  });

  it('P calls onPrev', () => {
    const playerRef = createMockPlayer();
    renderHook(() =>
      usePlayerKeyboard({
        playerRef,
        isLive: false,
        onNext,
        onPrev,
        onMuteToggle,
        onVolumeUp,
        onVolumeDown,
      }),
    );

    fireKey('p');
    expect(onPrev).toHaveBeenCalled();
  });

  it('ignores keys when target is an input element', () => {
    const playerRef = createMockPlayer({ paused: true });
    renderHook(() =>
      usePlayerKeyboard({
        playerRef,
        isLive: false,
        onNext,
        onPrev,
        onMuteToggle,
        onVolumeUp,
        onVolumeDown,
      }),
    );

    const input = document.createElement('input');
    document.body.appendChild(input);
    fireKey(' ', input);

    expect(playerRef.current!.play).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('ignores keys when target is a textarea element', () => {
    const playerRef = createMockPlayer({ paused: true });
    renderHook(() =>
      usePlayerKeyboard({
        playerRef,
        isLive: false,
        onNext,
        onPrev,
        onMuteToggle,
        onVolumeUp,
        onVolumeDown,
      }),
    );

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    fireKey(' ', textarea);

    expect(playerRef.current!.play).not.toHaveBeenCalled();
    document.body.removeChild(textarea);
  });
});
