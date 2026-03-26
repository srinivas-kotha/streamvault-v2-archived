import { describe, it, expect, beforeEach } from "vitest";
import { usePlayerStore, useAuthStore, useUIStore } from "../store";
import type { EpisodeEntry } from "../store";

// Reset zustand stores between tests
beforeEach(() => {
  usePlayerStore.setState({
    currentStreamId: null,
    currentStreamType: null,
    currentStreamName: null,
    startTime: 0,
    volume: 1,
    isMuted: false,
    seriesId: null,
    seasonNumber: null,
    episodeIndex: null,
    episodeList: [],
  });
  useAuthStore.setState({
    isAuthenticated: false,
    username: null,
  });
  useUIStore.setState({
    sidebarOpen: true,
    inputMode: "mouse",
  });
});

// ── PlayerStore ──────────────────────────────────────────────────────

describe("PlayerStore", () => {
  it("playStream sets currentStreamId, type, and name", () => {
    usePlayerStore
      .getState()
      .playStream("stream-1", { streamType: "live", streamName: "BBC One" });

    const state = usePlayerStore.getState();
    expect(state.currentStreamId).toBe("stream-1");
    expect(state.currentStreamType).toBe("live");
    expect(state.currentStreamName).toBe("BBC One");
  });

  it("playStream accepts optional startTime", () => {
    usePlayerStore
      .getState()
      .playStream("v-1", {
        streamType: "vod",
        streamName: "Movie",
        startTime: 120,
      });

    expect(usePlayerStore.getState().startTime).toBe(120);
  });

  it("playStream clears series context", () => {
    // Set up series context first
    usePlayerStore.getState().playStream("ep-1", {
      streamType: "series",
      streamName: "Ep 1",
      seriesContext: {
        seriesId: "ser-1",
        seasonNumber: 2,
        episodeIndex: 0,
        episodes: [],
      },
    });

    // Now play a non-series stream
    usePlayerStore
      .getState()
      .playStream("ch-1", { streamType: "live", streamName: "Channel" });

    const state = usePlayerStore.getState();
    expect(state.seriesId).toBeNull();
    expect(state.seasonNumber).toBeNull();
    expect(state.episodeIndex).toBeNull();
    expect(state.episodeList).toEqual([]);
  });

  it("stop clears all player state", () => {
    usePlayerStore
      .getState()
      .playStream("s-1", { streamType: "vod", streamName: "Film" });
    usePlayerStore.getState().stop();

    const state = usePlayerStore.getState();
    expect(state.currentStreamId).toBeNull();
    expect(state.currentStreamType).toBeNull();
    expect(state.currentStreamName).toBeNull();
    expect(state.startTime).toBe(0);
    expect(state.seriesId).toBeNull();
    expect(state.seasonNumber).toBeNull();
    expect(state.episodeIndex).toBeNull();
    expect(state.episodeList).toEqual([]);
  });

  it("playStream with seriesContext sets series context", () => {
    const episodes: EpisodeEntry[] = [
      { id: "ep-1", name: "Pilot" },
      { id: "ep-2", name: "Second" },
    ];

    usePlayerStore.getState().playStream("ep-1", {
      streamType: "series",
      streamName: "Pilot",
      startTime: 0,
      seriesContext: {
        seriesId: "ser-99",
        seasonNumber: 1,
        episodeIndex: 0,
        episodes,
      },
    });

    const state = usePlayerStore.getState();
    expect(state.seriesId).toBe("ser-99");
    expect(state.seasonNumber).toBe(1);
    expect(state.episodeIndex).toBe(0);
    expect(state.episodeList).toEqual(episodes);
    expect(state.currentStreamId).toBe("ep-1");
    expect(state.currentStreamName).toBe("Pilot");
  });

  it("playNextEpisode increments episodeIndex and updates stream", () => {
    const episodes: EpisodeEntry[] = [
      { id: "ep-1", name: "First" },
      { id: "ep-2", name: "Second" },
      { id: "ep-3", name: "Third" },
    ];
    usePlayerStore.getState().playStream("ep-1", {
      streamType: "series",
      streamName: "First",
      startTime: 0,
      seriesContext: {
        seriesId: "ser-1",
        seasonNumber: 1,
        episodeIndex: 0,
        episodes,
      },
    });

    usePlayerStore.getState().playNextEpisode();

    const state = usePlayerStore.getState();
    expect(state.episodeIndex).toBe(1);
    expect(state.currentStreamId).toBe("ep-2");
    expect(state.currentStreamName).toBe("Second");
  });

  it("playNextEpisode does not exceed list length", () => {
    const episodes: EpisodeEntry[] = [
      { id: "ep-1", name: "First" },
      { id: "ep-2", name: "Last" },
    ];
    usePlayerStore.getState().playStream("ep-2", {
      streamType: "series",
      streamName: "Last",
      startTime: 0,
      seriesContext: {
        seriesId: "ser-1",
        seasonNumber: 1,
        episodeIndex: 1,
        episodes,
      },
    });

    usePlayerStore.getState().playNextEpisode();

    // Should stay at index 1 (the last episode)
    expect(usePlayerStore.getState().episodeIndex).toBe(1);
    expect(usePlayerStore.getState().currentStreamId).toBe("ep-2");
  });

  it("playPrevEpisode decrements episodeIndex", () => {
    const episodes: EpisodeEntry[] = [
      { id: "ep-1", name: "First" },
      { id: "ep-2", name: "Second" },
    ];
    usePlayerStore.getState().playStream("ep-2", {
      streamType: "series",
      streamName: "Second",
      startTime: 0,
      seriesContext: {
        seriesId: "ser-1",
        seasonNumber: 1,
        episodeIndex: 1,
        episodes,
      },
    });

    usePlayerStore.getState().playPrevEpisode();

    const state = usePlayerStore.getState();
    expect(state.episodeIndex).toBe(0);
    expect(state.currentStreamId).toBe("ep-1");
    expect(state.currentStreamName).toBe("First");
  });

  it("playPrevEpisode does not go below 0", () => {
    const episodes: EpisodeEntry[] = [
      { id: "ep-1", name: "First" },
      { id: "ep-2", name: "Second" },
    ];
    usePlayerStore.getState().playStream("ep-1", {
      streamType: "series",
      streamName: "First",
      startTime: 0,
      seriesContext: {
        seriesId: "ser-1",
        seasonNumber: 1,
        episodeIndex: 0,
        episodes,
      },
    });

    usePlayerStore.getState().playPrevEpisode();

    expect(usePlayerStore.getState().episodeIndex).toBe(0);
    expect(usePlayerStore.getState().currentStreamId).toBe("ep-1");
  });

  it("playNextEpisode does nothing when no series context", () => {
    usePlayerStore
      .getState()
      .playStream("s-1", { streamType: "vod", streamName: "Movie" });

    usePlayerStore.getState().playNextEpisode();

    expect(usePlayerStore.getState().currentStreamId).toBe("s-1");
  });

  it("playPrevEpisode does nothing when no series context", () => {
    usePlayerStore
      .getState()
      .playStream("s-1", { streamType: "vod", streamName: "Movie" });

    usePlayerStore.getState().playPrevEpisode();

    expect(usePlayerStore.getState().currentStreamId).toBe("s-1");
  });
});

// ── AuthStore ────────────────────────────────────────────────────────

describe("AuthStore", () => {
  it("setAuth sets isAuthenticated true and username", () => {
    useAuthStore.getState().setAuth("testuser");

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.username).toBe("testuser");
  });

  it("clearAuth resets to false and empty username", () => {
    useAuthStore.getState().setAuth("testuser");
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.username).toBeNull();
  });
});

// ── UIStore ──────────────────────────────────────────────────────────

describe("UIStore", () => {
  it("setInputMode toggles between mouse and keyboard", () => {
    expect(useUIStore.getState().inputMode).toBe("mouse");

    useUIStore.getState().setInputMode("keyboard");
    expect(useUIStore.getState().inputMode).toBe("keyboard");

    useUIStore.getState().setInputMode("mouse");
    expect(useUIStore.getState().inputMode).toBe("mouse");
  });

  it("toggleSidebar flips sidebarOpen", () => {
    expect(useUIStore.getState().sidebarOpen).toBe(true);

    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false);

    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });
});
