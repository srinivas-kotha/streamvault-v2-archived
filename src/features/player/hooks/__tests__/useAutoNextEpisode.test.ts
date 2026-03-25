/**
 * Sprint 4 — Issue #116
 * useAutoNextEpisode tests: 5s countdown at VOD end, cancel support,
 * playNextEpisode dispatch, season boundary no-op, live TV no-op.
 *
 * These tests are written FIRST (TDD) and will FAIL until charlie implements
 * src/features/player/hooks/useAutoNextEpisode.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePlayerStore } from "@lib/stores/playerStore";

// ── Setup ─────────────────────────────────────────────────────────────────────

const mockEpisodes = [
  { id: "ep-1", episodeNum: 1, title: "Episode 1", streamUrl: "ep1.m3u8" },
  { id: "ep-2", episodeNum: 2, title: "Episode 2", streamUrl: "ep2.m3u8" },
  { id: "ep-3", episodeNum: 3, title: "Episode 3", streamUrl: "ep3.m3u8" },
];

const seriesState = {
  status: "playing" as const,
  currentStreamId: "ep-1",
  streamType: "series" as const,
  streamName: "Episode 1",
  currentTime: 1790,
  duration: 1800,
  bufferedEnd: 1800,
  volume: 1,
  isMuted: false,
  qualityLevels: [],
  currentQuality: -1,
  subtitleTracks: [],
  currentSubtitle: -1,
  audioTracks: [],
  currentAudio: 0,
  error: null,
  seriesContext: {
    seriesId: "series-1",
    seasonNum: 1,
    episodeNum: 1,
    episodes: mockEpisodes,
  },
};

beforeEach(() => {
  vi.useFakeTimers();
  usePlayerStore.setState(seriesState);
});

afterEach(() => {
  vi.useRealTimers();
});

import { useAutoNextEpisode } from "../useAutoNextEpisode";

// ── Countdown trigger ─────────────────────────────────────────────────────────

describe("useAutoNextEpisode — countdown trigger", () => {
  it("does NOT trigger countdown when currentTime < duration - 5", () => {
    usePlayerStore.setState({ currentTime: 1780, duration: 1800 });
    const { result } = renderHook(() => useAutoNextEpisode());

    // Not near the end yet
    expect(result.current.countdown).toBeNull();
  });

  it("starts 5s countdown when currentTime >= duration - 5", () => {
    usePlayerStore.setState({ currentTime: 1796, duration: 1800 });
    const { result } = renderHook(() => useAutoNextEpisode());

    expect(result.current.countdown).toBe(5);
  });

  it("countdown ticks down each second", () => {
    usePlayerStore.setState({ currentTime: 1796, duration: 1800 });
    const { result } = renderHook(() => useAutoNextEpisode());

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.countdown).toBe(4);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.countdown).toBe(3);
  });

  it("calls playNextEpisode after 5s countdown completes", () => {
    usePlayerStore.setState({ currentTime: 1796, duration: 1800 });
    renderHook(() => useAutoNextEpisode());

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Next episode should be active
    expect(usePlayerStore.getState().currentStreamId).toBe("ep-2");
  });
});

// ── Cancel countdown ──────────────────────────────────────────────────────────

describe("useAutoNextEpisode — cancel", () => {
  it("cancel() stops the countdown", () => {
    usePlayerStore.setState({ currentTime: 1796, duration: 1800 });
    const { result } = renderHook(() => useAutoNextEpisode());

    act(() => {
      result.current.cancel();
    });

    expect(result.current.countdown).toBeNull();
  });

  it("cancel() prevents auto-next from firing", () => {
    usePlayerStore.setState({ currentTime: 1796, duration: 1800 });
    const { result } = renderHook(() => useAutoNextEpisode());
    const initialStreamId = usePlayerStore.getState().currentStreamId;

    act(() => {
      result.current.cancel();
    });

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Stream should NOT have changed
    expect(usePlayerStore.getState().currentStreamId).toBe(initialStreamId);
  });
});

// ── Season boundary ───────────────────────────────────────────────────────────

describe("useAutoNextEpisode — season boundary", () => {
  it("does NOT auto-next when on the last episode of the season", () => {
    usePlayerStore.setState({
      currentTime: 1796,
      duration: 1800,
      currentStreamId: "ep-3",
      seriesContext: {
        seriesId: "series-1",
        seasonNum: 1,
        episodeNum: 3, // last episode
        episodes: mockEpisodes,
      },
    });

    const { result } = renderHook(() => useAutoNextEpisode());

    // Countdown should not start (or start but not change episode)
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // currentStreamId should remain ep-3 (no ep-4 exists)
    expect(usePlayerStore.getState().currentStreamId).toBe("ep-3");
    // countdown should be null when at season boundary
    expect(result.current.countdown).toBeNull();
  });
});

// ── Stream type guards ────────────────────────────────────────────────────────

describe("useAutoNextEpisode — stream type guards", () => {
  it("does NOT trigger for live TV streams", () => {
    usePlayerStore.setState({
      streamType: "live",
      currentStreamId: "ch-1",
      currentTime: 10000,
      duration: 0, // live has no fixed duration
      seriesContext: null,
    });

    const { result } = renderHook(() => useAutoNextEpisode());

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.countdown).toBeNull();
  });

  it("does NOT trigger for standalone VOD (no seriesContext)", () => {
    usePlayerStore.setState({
      streamType: "vod",
      currentStreamId: "movie-1",
      currentTime: 7190,
      duration: 7200,
      seriesContext: null,
    });

    const { result } = renderHook(() => useAutoNextEpisode());

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.countdown).toBeNull();
  });

  it("does NOT trigger when status is idle", () => {
    usePlayerStore.setState({
      status: "idle",
      currentStreamId: null,
      seriesContext: null,
    });

    const { result } = renderHook(() => useAutoNextEpisode());

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.countdown).toBeNull();
  });
});

// ── Cleanup ───────────────────────────────────────────────────────────────────

describe("useAutoNextEpisode — cleanup", () => {
  it("clears countdown timer on unmount", () => {
    usePlayerStore.setState({ currentTime: 1796, duration: 1800 });
    const initialStreamId = usePlayerStore.getState().currentStreamId;

    const { unmount } = renderHook(() => useAutoNextEpisode());

    // Unmount before countdown completes
    unmount();

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Stream should NOT have changed after unmount
    expect(usePlayerStore.getState().currentStreamId).toBe(initialStreamId);
  });
});
