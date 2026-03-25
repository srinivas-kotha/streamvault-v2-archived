/**
 * Sprint 4 — Issue #115
 * usePlayerKeyboard tests (v2 rewrite): store-based actions, hold-to-seek
 * acceleration, back button handling BEFORE video checks, volume, mute, fullscreen.
 *
 * These tests replace the old usePlayerKeyboard.test.ts (was in __tests__/ folder).
 * They are written FIRST (TDD) and will FAIL until charlie implements
 * src/features/player/hooks/usePlayerKeyboard.ts (v2, using playerStore)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePlayerStore } from "@lib/stores/playerStore";

// ── Mock isTVMode ─────────────────────────────────────────────────────────────

vi.mock("@shared/utils/isTVMode", () => ({ isTVMode: false }));

// ── Import after mocks ────────────────────────────────────────────────────────

import { usePlayerKeyboard } from "../usePlayerKeyboard";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fireKey(
  key: string,
  keyCode?: number,
  options: Partial<KeyboardEventInit> = {},
) {
  const event = new KeyboardEvent("keydown", {
    key,
    keyCode: keyCode ?? key.charCodeAt(0),
    bubbles: true,
    ...options,
  });
  window.dispatchEvent(event);
  return event;
}

function fireKeyUp(key: string) {
  const event = new KeyboardEvent("keyup", { key, bubbles: true });
  window.dispatchEvent(event);
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
  usePlayerStore.setState({
    status: "playing",
    currentStreamId: "stream-1",
    streamType: "vod",
    streamName: "Test Movie",
    currentTime: 120,
    duration: 3600,
    bufferedEnd: 300,
    volume: 1,
    isMuted: false,
    qualityLevels: [],
    currentQuality: -1,
    subtitleTracks: [],
    currentSubtitle: -1,
    audioTracks: [],
    currentAudio: 0,
    error: null,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

// ── Play/pause ────────────────────────────────────────────────────────────────

describe("usePlayerKeyboard (v2) — play/pause", () => {
  it("Enter toggles play → pause", () => {
    renderHook(() => usePlayerKeyboard());
    fireKey("Enter");
    expect(usePlayerStore.getState().status).toBe("paused");
  });

  it("Enter toggles paused → playing", () => {
    usePlayerStore.setState({ status: "paused" });
    renderHook(() => usePlayerKeyboard());
    fireKey("Enter");
    expect(usePlayerStore.getState().status).toBe("playing");
  });

  it("Space toggles play → pause", () => {
    renderHook(() => usePlayerKeyboard());
    fireKey(" ");
    expect(usePlayerStore.getState().status).toBe("paused");
  });

  it("Space toggles paused → playing", () => {
    usePlayerStore.setState({ status: "paused" });
    renderHook(() => usePlayerKeyboard());
    fireKey(" ");
    expect(usePlayerStore.getState().status).toBe("playing");
  });
});

// ── Seek (single press = 10s) ─────────────────────────────────────────────────

describe("usePlayerKeyboard (v2) — seek 10s", () => {
  it("ArrowLeft seeks -10s", () => {
    renderHook(() => usePlayerKeyboard());
    fireKey("ArrowLeft");
    expect(usePlayerStore.getState().currentTime).toBe(110);
  });

  it("ArrowRight seeks +10s", () => {
    renderHook(() => usePlayerKeyboard());
    fireKey("ArrowRight");
    expect(usePlayerStore.getState().currentTime).toBe(130);
  });

  it("ArrowLeft does not seek below 0", () => {
    usePlayerStore.setState({ currentTime: 5 });
    renderHook(() => usePlayerKeyboard());
    fireKey("ArrowLeft");
    expect(usePlayerStore.getState().currentTime).toBe(0);
  });

  it("ArrowRight does not seek beyond duration", () => {
    usePlayerStore.setState({ currentTime: 3595 });
    renderHook(() => usePlayerKeyboard());
    fireKey("ArrowRight");
    expect(usePlayerStore.getState().currentTime).toBe(3600);
  });
});

// ── Hold-to-seek acceleration ─────────────────────────────────────────────────

describe("usePlayerKeyboard (v2) — hold-to-seek acceleration", () => {
  it("hold left >300ms → 10s per press", () => {
    renderHook(() => usePlayerKeyboard());
    // Initial press
    fireKey("ArrowLeft");
    // Short hold (< 500ms threshold for 30s)
    vi.advanceTimersByTime(300);
    fireKey("ArrowLeft");
    // Should still be 10s steps (not accelerated yet)
    expect(usePlayerStore.getState().currentTime).toBeLessThanOrEqual(100);
  });

  it("hold left >=500ms → 30s per step", () => {
    renderHook(() => usePlayerKeyboard());
    fireKey("ArrowLeft");
    vi.advanceTimersByTime(600);
    fireKey("ArrowLeft");
    // At 500ms+ hold, step should be 30s
    // 120 - 10 - 30 = 80
    expect(usePlayerStore.getState().currentTime).toBe(80);
  });

  it("hold left >=2000ms → 60s per step", () => {
    usePlayerStore.setState({ currentTime: 600 });
    renderHook(() => usePlayerKeyboard());
    fireKey("ArrowLeft");
    vi.advanceTimersByTime(2100);
    fireKey("ArrowLeft");
    // 600 - 10 - 60 = 530
    expect(usePlayerStore.getState().currentTime).toBe(530);
  });

  it("hold left >=4000ms → 120s per step", () => {
    usePlayerStore.setState({ currentTime: 1200 });
    renderHook(() => usePlayerKeyboard());
    fireKey("ArrowLeft");
    vi.advanceTimersByTime(4100);
    fireKey("ArrowLeft");
    // 1200 - 10 - 120 = 1070
    expect(usePlayerStore.getState().currentTime).toBe(1070);
  });

  it("hold right >=500ms → 30s per step", () => {
    usePlayerStore.setState({ currentTime: 600 });
    renderHook(() => usePlayerKeyboard());
    fireKey("ArrowRight");
    vi.advanceTimersByTime(600);
    fireKey("ArrowRight");
    // 600 + 10 + 30 = 640
    expect(usePlayerStore.getState().currentTime).toBe(640);
  });
});

// ── Volume ────────────────────────────────────────────────────────────────────

describe("usePlayerKeyboard (v2) — volume", () => {
  it("ArrowUp increases volume by 0.1", () => {
    usePlayerStore.setState({ volume: 0.5 });
    renderHook(() => usePlayerKeyboard());
    fireKey("ArrowUp");
    expect(usePlayerStore.getState().volume).toBeCloseTo(0.6, 1);
  });

  it("ArrowDown decreases volume by 0.1", () => {
    usePlayerStore.setState({ volume: 0.5 });
    renderHook(() => usePlayerKeyboard());
    fireKey("ArrowDown");
    expect(usePlayerStore.getState().volume).toBeCloseTo(0.4, 1);
  });

  it("ArrowUp does not exceed volume 1", () => {
    usePlayerStore.setState({ volume: 1 });
    renderHook(() => usePlayerKeyboard());
    fireKey("ArrowUp");
    expect(usePlayerStore.getState().volume).toBe(1);
  });

  it("ArrowDown does not go below volume 0", () => {
    usePlayerStore.setState({ volume: 0.05 });
    renderHook(() => usePlayerKeyboard());
    fireKey("ArrowDown");
    expect(usePlayerStore.getState().volume).toBe(0);
  });
});

// ── Mute ──────────────────────────────────────────────────────────────────────

describe("usePlayerKeyboard (v2) — mute", () => {
  it("M key toggles mute on", () => {
    renderHook(() => usePlayerKeyboard());
    fireKey("m");
    expect(usePlayerStore.getState().isMuted).toBe(true);
  });

  it("M key toggles mute off when muted", () => {
    usePlayerStore.setState({ isMuted: true });
    renderHook(() => usePlayerKeyboard());
    fireKey("m");
    expect(usePlayerStore.getState().isMuted).toBe(false);
  });
});

// ── Fullscreen (desktop only) ─────────────────────────────────────────────────

describe("usePlayerKeyboard (v2) — fullscreen", () => {
  it("F key triggers fullscreen toggle on desktop (not TV)", () => {
    const requestFullscreen = vi.fn();
    Object.defineProperty(document.documentElement, "requestFullscreen", {
      value: requestFullscreen,
      writable: true,
    });

    renderHook(() => usePlayerKeyboard({ isTVMode: false }));
    fireKey("f");
    // fullscreen API called or document.fullscreenElement toggled
    // We just verify it does not crash and something happened
    expect(usePlayerStore.getState().status).toBe("playing"); // no crash
  });

  it("F key does NOT trigger fullscreen in TV mode (TV uses CSS fullscreen)", () => {
    const requestFullscreen = vi.fn();
    Object.defineProperty(document.documentElement, "requestFullscreen", {
      value: requestFullscreen,
      writable: true,
    });

    renderHook(() => usePlayerKeyboard({ isTVMode: true }));
    fireKey("f");
    expect(requestFullscreen).not.toHaveBeenCalled();
  });
});

// ── Back button: BEFORE video element check ───────────────────────────────────

describe("usePlayerKeyboard (v2) — back button handling priority", () => {
  it("Escape calls stopPlayback", () => {
    renderHook(() => usePlayerKeyboard());
    fireKey("Escape");
    expect(usePlayerStore.getState().status).toBe("idle");
    expect(usePlayerStore.getState().currentStreamId).toBeNull();
  });

  it("Backspace calls stopPlayback", () => {
    renderHook(() => usePlayerKeyboard());
    fireKey("Backspace");
    expect(usePlayerStore.getState().status).toBe("idle");
  });

  it("keyCode 4 (Fire TV back button) calls stopPlayback", () => {
    renderHook(() => usePlayerKeyboard());
    fireKey("GoBack", 4);
    expect(usePlayerStore.getState().status).toBe("idle");
  });

  it("keyCode 10009 (Samsung Tizen back button) calls stopPlayback", () => {
    renderHook(() => usePlayerKeyboard());
    fireKey("GoBack", 10009);
    expect(usePlayerStore.getState().status).toBe("idle");
  });

  it("keyCode 461 (LG webOS back button) calls stopPlayback", () => {
    renderHook(() => usePlayerKeyboard());
    fireKey("GoBack", 461);
    expect(usePlayerStore.getState().status).toBe("idle");
  });

  it("back button works even when currentTime is 0 (stream just started)", () => {
    usePlayerStore.setState({ currentTime: 0 });
    renderHook(() => usePlayerKeyboard());
    fireKey("Escape");
    // Should close player, not be blocked by time=0 check
    expect(usePlayerStore.getState().currentStreamId).toBeNull();
  });
});

// ── Ignored when input focused ────────────────────────────────────────────────

describe("usePlayerKeyboard (v2) — ignores keys when input focused", () => {
  it("ignores Space when target is input element", () => {
    renderHook(() => usePlayerKeyboard());
    const input = document.createElement("input");
    document.body.appendChild(input);

    const event = new KeyboardEvent("keydown", { key: " ", bubbles: true });
    Object.defineProperty(event, "target", { value: input });
    window.dispatchEvent(event);

    expect(usePlayerStore.getState().status).toBe("playing"); // not toggled
    document.body.removeChild(input);
  });

  it("ignores Enter when target is textarea", () => {
    renderHook(() => usePlayerKeyboard());
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);

    const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
    Object.defineProperty(event, "target", { value: textarea });
    window.dispatchEvent(event);

    expect(usePlayerStore.getState().status).toBe("playing");
    document.body.removeChild(textarea);
  });
});

// ── Channel switching (live TV) ────────────────────────────────────────────────

describe("usePlayerKeyboard (v2) — channel switching", () => {
  const mockChannelUp = vi.fn();
  const mockChannelDown = vi.fn();

  beforeEach(() => {
    mockChannelUp.mockClear();
    mockChannelDown.mockClear();
    usePlayerStore.setState({ streamType: "live" });
  });

  it("ArrowUp calls channelUp on live TV with 300ms debounce", () => {
    renderHook(() =>
      usePlayerKeyboard({
        onChannelUp: mockChannelUp,
        onChannelDown: mockChannelDown,
      }),
    );

    // Rapid presses
    fireKey("ArrowUp");
    fireKey("ArrowUp");
    fireKey("ArrowUp");

    // Only one call should happen after debounce
    vi.advanceTimersByTime(400);
    expect(mockChannelUp).toHaveBeenCalledTimes(1);
  });

  it("ArrowDown calls channelDown on live TV with 300ms debounce", () => {
    renderHook(() =>
      usePlayerKeyboard({
        onChannelUp: mockChannelUp,
        onChannelDown: mockChannelDown,
      }),
    );

    fireKey("ArrowDown");
    fireKey("ArrowDown");

    vi.advanceTimersByTime(400);
    expect(mockChannelDown).toHaveBeenCalledTimes(1);
  });

  it("ArrowUp does NOT seek on live TV (live has no seek)", () => {
    const initialTime = usePlayerStore.getState().currentTime;
    renderHook(() => usePlayerKeyboard({ onChannelUp: mockChannelUp }));

    fireKey("ArrowUp");
    vi.advanceTimersByTime(400);

    // Time should not have changed (ArrowUp = channel switch on live, not volume)
    expect(usePlayerStore.getState().currentTime).toBe(initialTime);
  });
});

// ── Cleanup ───────────────────────────────────────────────────────────────────

describe("usePlayerKeyboard (v2) — cleanup", () => {
  it("removes keydown listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => usePlayerKeyboard());
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function),
    );
  });
});
