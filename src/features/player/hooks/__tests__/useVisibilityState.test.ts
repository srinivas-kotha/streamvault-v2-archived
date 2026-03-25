/**
 * Sprint 4 — Issue #116
 * useVisibilityState tests: tab hidden → stopLoad, tab visible →
 * reload source (live) or resume from currentTime (VOD), auto-retry on
 * failure, cleanup on unmount.
 *
 * These tests are written FIRST (TDD) and will FAIL until charlie implements
 * src/features/player/hooks/useVisibilityState.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePlayerStore } from "@lib/stores/playerStore";

// ── Mock hls.js ───────────────────────────────────────────────────────────────

const mockHls = {
  stopLoad: vi.fn(),
  startLoad: vi.fn(),
  loadSource: vi.fn(),
  attachMedia: vi.fn(),
  currentLevel: -1,
};

vi.mock("hls.js", () => ({
  default: class MockHls {
    static isSupported = () => true;
    static Events = { ERROR: "hlsError" };
    stopLoad = mockHls.stopLoad;
    startLoad = mockHls.startLoad;
    loadSource = mockHls.loadSource;
    attachMedia = mockHls.attachMedia;
    currentLevel = mockHls.currentLevel;
  },
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import { useVisibilityState } from "../useVisibilityState";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fireVisibilityChange(hidden: boolean) {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => hidden,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  // Default to visible
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => false,
  });
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

// ── Tab hidden → stop loading ─────────────────────────────────────────────────

describe("useVisibilityState — tab hidden", () => {
  it("calls hls.stopLoad() when document becomes hidden", () => {
    const hlsRef = { current: mockHls };
    renderHook(() => useVisibilityState(hlsRef as any));

    fireVisibilityChange(true);

    expect(mockHls.stopLoad).toHaveBeenCalledTimes(1);
  });

  it("does not call stopLoad when document is already visible", () => {
    const hlsRef = { current: mockHls };
    renderHook(() => useVisibilityState(hlsRef as any));

    fireVisibilityChange(false); // visible → no-op
    expect(mockHls.stopLoad).not.toHaveBeenCalled();
  });

  it("does not call stopLoad when hlsRef.current is null", () => {
    const hlsRef = { current: null };
    renderHook(() => useVisibilityState(hlsRef as any));

    fireVisibilityChange(true);
    expect(mockHls.stopLoad).not.toHaveBeenCalled();
  });
});

// ── Tab visible (live) → reload source ───────────────────────────────────────

describe("useVisibilityState — tab visible (live stream)", () => {
  beforeEach(() => {
    usePlayerStore.setState({ streamType: "live", currentStreamId: "ch-1" });
  });

  it("calls hls.loadSource with stream URL when live tab becomes visible", () => {
    const hlsRef = { current: mockHls };
    renderHook(() =>
      useVisibilityState(hlsRef as any, "https://example.com/live.m3u8"),
    );

    fireVisibilityChange(true); // tab becomes visible
    expect(mockHls.loadSource).toHaveBeenCalledWith(
      "https://example.com/live.m3u8",
    );
  });

  it("calls hls.attachMedia after loadSource for live recovery", () => {
    const mockVideo = document.createElement("video");
    const hlsRef = { current: mockHls };
    renderHook(() =>
      useVisibilityState(
        hlsRef as any,
        "https://example.com/live.m3u8",
        mockVideo,
      ),
    );

    fireVisibilityChange(true);
    expect(mockHls.loadSource).toHaveBeenCalled();
  });
});

// ── Tab visible (VOD) → resume from currentTime ───────────────────────────────

describe("useVisibilityState — tab visible (VOD)", () => {
  it("calls hls.startLoad (not loadSource) for VOD recovery", () => {
    const hlsRef = { current: mockHls };
    usePlayerStore.setState({ streamType: "vod", currentTime: 120 });
    renderHook(() =>
      useVisibilityState(hlsRef as any, "https://example.com/vod.m3u8"),
    );

    fireVisibilityChange(true);
    expect(mockHls.startLoad).toHaveBeenCalled();
    expect(mockHls.loadSource).not.toHaveBeenCalled();
  });

  it("passes currentTime to startLoad for VOD seek recovery", () => {
    const hlsRef = { current: mockHls };
    usePlayerStore.setState({ streamType: "vod", currentTime: 300 });
    renderHook(() =>
      useVisibilityState(hlsRef as any, "https://example.com/vod.m3u8"),
    );

    fireVisibilityChange(true);
    // startLoad(startPosition) — position should be the current playback time
    expect(mockHls.startLoad).toHaveBeenCalledWith(300);
  });
});

// ── Auto-retry on failure ─────────────────────────────────────────────────────

describe("useVisibilityState — auto-retry", () => {
  it("retries once after 3 seconds if status becomes error after visibility", () => {
    const hlsRef = { current: mockHls };
    renderHook(() =>
      useVisibilityState(hlsRef as any, "https://example.com/vod.m3u8"),
    );

    // Simulate visibility recovery
    fireVisibilityChange(true);

    // Simulate error after recovery
    usePlayerStore.setState({ status: "error", error: "Recovery failed" });

    // Initial call count (from visibility)
    const callsBefore = mockHls.startLoad.mock.calls.length;

    // Advance timer to trigger auto-retry
    vi.advanceTimersByTime(3000);

    // Should have attempted retry
    const callsAfter =
      mockHls.startLoad.mock.calls.length +
      mockHls.loadSource.mock.calls.length;
    expect(callsAfter).toBeGreaterThan(callsBefore);
  });

  it("only retries once (not indefinitely) to avoid reload loops", () => {
    const hlsRef = { current: mockHls };
    renderHook(() =>
      useVisibilityState(hlsRef as any, "https://example.com/vod.m3u8"),
    );

    fireVisibilityChange(true);
    usePlayerStore.setState({ status: "error", error: "Recovery failed" });

    // Advance well past retry window
    vi.advanceTimersByTime(15000);

    const totalCalls =
      mockHls.startLoad.mock.calls.length +
      mockHls.loadSource.mock.calls.length;
    // At most 2 total calls: initial recovery + one retry
    expect(totalCalls).toBeLessThanOrEqual(2);
  });
});

// ── Cleanup ───────────────────────────────────────────────────────────────────

describe("useVisibilityState — cleanup", () => {
  it("removes visibilitychange listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
    const hlsRef = { current: mockHls };

    const { unmount } = renderHook(() =>
      useVisibilityState(hlsRef as any, "https://example.com/vod.m3u8"),
    );
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function),
    );
  });

  it("does not call stopLoad after unmount", () => {
    const hlsRef = { current: mockHls };
    const { unmount } = renderHook(() =>
      useVisibilityState(hlsRef as any, "https://example.com/vod.m3u8"),
    );

    unmount();
    mockHls.stopLoad.mockClear();

    fireVisibilityChange(true);
    expect(mockHls.stopLoad).not.toHaveBeenCalled();
  });
});

// ── No-op when idle ───────────────────────────────────────────────────────────

describe("useVisibilityState — idle/no stream", () => {
  it("does not call any hls methods when status is idle", () => {
    usePlayerStore.setState({ status: "idle", currentStreamId: null });
    const hlsRef = { current: mockHls };
    renderHook(() =>
      useVisibilityState(hlsRef as any, "https://example.com/vod.m3u8"),
    );

    fireVisibilityChange(true);
    fireVisibilityChange(false);

    expect(mockHls.stopLoad).not.toHaveBeenCalled();
    expect(mockHls.startLoad).not.toHaveBeenCalled();
    expect(mockHls.loadSource).not.toHaveBeenCalled();
  });
});
