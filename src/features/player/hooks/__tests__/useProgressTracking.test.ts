/**
 * Sprint 4 — Issue #114
 * useProgressTracking hook tests for the v2 playerStore-based implementation.
 * Saves progress every 10s when playing, skips when paused/idle, saves on unmount.
 *
 * These tests are written FIRST (TDD) and will FAIL until charlie implements
 * src/features/player/hooks/useProgressTracking.ts (v2, using playerStore)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePlayerStore } from "@lib/stores/playerStore";

// ── Mock the player API ───────────────────────────────────────────────────────

const mockSaveProgress = vi.fn();

vi.mock("../../api", () => ({
  useUpdateHistory: () => ({ mutate: mockSaveProgress }),
}));

// ── Import after mock setup ───────────────────────────────────────────────────

import { useProgressTracking } from "../useProgressTracking";

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
  mockSaveProgress.mockClear();
  usePlayerStore.setState({
    status: "playing",
    currentStreamId: "stream-1",
    streamType: "vod",
    streamName: "Test Movie",
    currentTime: 0,
    duration: 3600,
    bufferedEnd: 0,
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

// ── Interval saving ───────────────────────────────────────────────────────────

describe("useProgressTracking — interval saving", () => {
  it("saves progress every 10 seconds when status is playing", () => {
    usePlayerStore.setState({ currentTime: 60, status: "playing" });
    renderHook(() => useProgressTracking("stream-1", "vod"));

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(mockSaveProgress).toHaveBeenCalledTimes(1);
    expect(mockSaveProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        contentId: "stream-1",
        progress_seconds: 60,
      }),
    );
  });

  it("saves progress multiple times at 10s intervals", () => {
    renderHook(() => useProgressTracking("stream-1", "vod"));

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(mockSaveProgress).toHaveBeenCalledTimes(3);
  });

  it("does NOT save when status is paused", () => {
    usePlayerStore.setState({ status: "paused", currentTime: 60 });
    renderHook(() => useProgressTracking("stream-1", "vod"));

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(mockSaveProgress).not.toHaveBeenCalled();
  });

  it("does NOT save when status is idle", () => {
    usePlayerStore.setState({ status: "idle", currentStreamId: null });
    renderHook(() => useProgressTracking("stream-1", "vod"));

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(mockSaveProgress).not.toHaveBeenCalled();
  });

  it("does NOT save when status is buffering", () => {
    usePlayerStore.setState({ status: "buffering", currentTime: 60 });
    renderHook(() => useProgressTracking("stream-1", "vod"));

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(mockSaveProgress).not.toHaveBeenCalled();
  });

  it("does NOT save for live streams (streamType live)", () => {
    usePlayerStore.setState({ status: "playing", streamType: "live" });
    renderHook(() => useProgressTracking("ch-1", "live"));

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(mockSaveProgress).not.toHaveBeenCalled();
  });
});

// ── Save on unmount ───────────────────────────────────────────────────────────

describe("useProgressTracking — save on unmount", () => {
  it("saves progress on unmount when playing", () => {
    usePlayerStore.setState({ status: "playing", currentTime: 90 });
    const { unmount } = renderHook(() =>
      useProgressTracking("stream-1", "vod"),
    );

    unmount();

    expect(mockSaveProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        contentId: "stream-1",
        progress_seconds: 90,
      }),
    );
  });

  it("saves progress on unmount when paused", () => {
    usePlayerStore.setState({ status: "paused", currentTime: 45 });
    const { unmount } = renderHook(() =>
      useProgressTracking("stream-1", "vod"),
    );

    unmount();

    expect(mockSaveProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        progress_seconds: 45,
      }),
    );
  });

  it("does NOT save on unmount for live streams", () => {
    usePlayerStore.setState({ status: "playing", streamType: "live" });
    const { unmount } = renderHook(() => useProgressTracking("ch-1", "live"));

    unmount();

    expect(mockSaveProgress).not.toHaveBeenCalled();
  });

  it("does NOT save on unmount when idle", () => {
    usePlayerStore.setState({ status: "idle", currentStreamId: null });
    const { unmount } = renderHook(() =>
      useProgressTracking("stream-1", "vod"),
    );

    unmount();

    expect(mockSaveProgress).not.toHaveBeenCalled();
  });
});

// ── API call structure ────────────────────────────────────────────────────────

describe("useProgressTracking — API call structure", () => {
  it("includes contentId in the save call", () => {
    usePlayerStore.setState({ status: "playing", currentTime: 30 });
    renderHook(() => useProgressTracking("movie-abc-123", "vod"));

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(mockSaveProgress).toHaveBeenCalledWith(
      expect.objectContaining({ contentId: "movie-abc-123" }),
    );
  });

  it("includes duration_seconds in the save call", () => {
    usePlayerStore.setState({
      status: "playing",
      currentTime: 30,
      duration: 7200,
    });
    renderHook(() => useProgressTracking("stream-1", "vod"));

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(mockSaveProgress).toHaveBeenCalledWith(
      expect.objectContaining({ duration_seconds: 7200 }),
    );
  });
});
