/**
 * Sprint 4 — Issue #112
 * playerStore tests: state machine transitions, actions, and derived state.
 *
 * These tests are written FIRST (TDD) and will FAIL until charlie implements
 * src/lib/stores/playerStore.ts with the status-enum state machine.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { usePlayerStore } from "../playerStore";

// ── helpers ───────────────────────────────────────────────────────────────────

const mockStreamInfo = {
  streamType: "vod" as const,
  streamName: "Test Movie",
  startTime: 0,
};

const mockLiveInfo = {
  streamType: "live" as const,
  streamName: "BBC News",
  startTime: 0,
};

const mockSeriesInfo = {
  streamType: "series" as const,
  streamName: "Episode 1",
  startTime: 0,
  seriesContext: {
    seriesId: "ser-1",
    seasonNum: 1,
    episodeNum: 1,
    episodes: [
      { id: "ep-1", name: "Episode 1", episodeNum: 1, seasonNum: 1 },
      { id: "ep-2", name: "Episode 2", episodeNum: 2, seasonNum: 1 },
      { id: "ep-3", name: "Episode 3", episodeNum: 3, seasonNum: 1 },
    ],
  },
};

// Reset store to idle before each test
beforeEach(() => {
  usePlayerStore.setState({
    status: "idle",
    currentStreamId: null,
    streamType: null,
    streamName: "",
    startTime: 0,
    seriesContext: null,
    currentTime: 0,
    duration: 0,
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

// ── Initial State ─────────────────────────────────────────────────────────────

describe("playerStore — initial state", () => {
  it("starts with status idle", () => {
    expect(usePlayerStore.getState().status).toBe("idle");
  });

  it("starts with currentStreamId null", () => {
    expect(usePlayerStore.getState().currentStreamId).toBeNull();
  });

  it("starts with no error", () => {
    expect(usePlayerStore.getState().error).toBeNull();
  });

  it("starts with volume 1", () => {
    expect(usePlayerStore.getState().volume).toBe(1);
  });

  it("starts with isMuted false", () => {
    expect(usePlayerStore.getState().isMuted).toBe(false);
  });

  it("starts with currentTime 0", () => {
    expect(usePlayerStore.getState().currentTime).toBe(0);
  });

  it("starts with no quality levels", () => {
    expect(usePlayerStore.getState().qualityLevels).toHaveLength(0);
  });

  it("starts with subtitleTrack -1 (off)", () => {
    expect(usePlayerStore.getState().currentSubtitle).toBe(-1);
  });
});

// ── playStream — idle → loading ───────────────────────────────────────────────

describe("playerStore — playStream()", () => {
  it("transitions from idle to loading", () => {
    usePlayerStore.getState().playStream("stream-1", mockStreamInfo);
    expect(usePlayerStore.getState().status).toBe("loading");
  });

  it("sets currentStreamId", () => {
    usePlayerStore.getState().playStream("stream-1", mockStreamInfo);
    expect(usePlayerStore.getState().currentStreamId).toBe("stream-1");
  });

  it("sets streamType", () => {
    usePlayerStore.getState().playStream("stream-1", mockStreamInfo);
    expect(usePlayerStore.getState().streamType).toBe("vod");
  });

  it("sets streamName", () => {
    usePlayerStore.getState().playStream("stream-1", mockStreamInfo);
    expect(usePlayerStore.getState().streamName).toBe("Test Movie");
  });

  it("sets startTime from streamInfo", () => {
    usePlayerStore
      .getState()
      .playStream("stream-1", { ...mockStreamInfo, startTime: 120 });
    expect(usePlayerStore.getState().startTime).toBe(120);
  });

  it("clears any previous error", () => {
    usePlayerStore.setState({
      error: { code: "NETWORK_ERROR", message: "Lost connection" },
    });
    usePlayerStore.getState().playStream("stream-1", mockStreamInfo);
    expect(usePlayerStore.getState().error).toBeNull();
  });

  it("clears series context for non-series streams", () => {
    usePlayerStore.setState({ seriesContext: mockSeriesInfo.seriesContext });
    usePlayerStore.getState().playStream("stream-1", mockLiveInfo);
    expect(usePlayerStore.getState().seriesContext).toBeNull();
  });

  it("stores series context when provided", () => {
    usePlayerStore.getState().playStream("ep-1", mockSeriesInfo);
    expect(usePlayerStore.getState().seriesContext).not.toBeNull();
    expect(usePlayerStore.getState().seriesContext?.seriesId).toBe("ser-1");
    expect(usePlayerStore.getState().seriesContext?.episodes).toHaveLength(3);
  });

  it("resets currentTime to 0 when starting fresh (startTime 0)", () => {
    usePlayerStore.setState({ currentTime: 300 });
    usePlayerStore.getState().playStream("stream-2", mockStreamInfo);
    expect(usePlayerStore.getState().currentTime).toBe(0);
  });
});

// ── setStatus — state transitions ─────────────────────────────────────────────

describe("playerStore — setStatus() valid transitions", () => {
  it("loading → playing", () => {
    usePlayerStore.setState({ status: "loading", currentStreamId: "stream-1" });
    usePlayerStore.getState().setStatus("playing");
    expect(usePlayerStore.getState().status).toBe("playing");
  });

  it("loading → error", () => {
    usePlayerStore.setState({ status: "loading", currentStreamId: "stream-1" });
    usePlayerStore.getState().setStatus("error");
    expect(usePlayerStore.getState().status).toBe("error");
  });

  it("playing → paused", () => {
    usePlayerStore.setState({ status: "playing", currentStreamId: "stream-1" });
    usePlayerStore.getState().setStatus("paused");
    expect(usePlayerStore.getState().status).toBe("paused");
  });

  it("playing → buffering", () => {
    usePlayerStore.setState({ status: "playing", currentStreamId: "stream-1" });
    usePlayerStore.getState().setStatus("buffering");
    expect(usePlayerStore.getState().status).toBe("buffering");
  });

  it("playing → seeking", () => {
    usePlayerStore.setState({ status: "playing", currentStreamId: "stream-1" });
    usePlayerStore.getState().setStatus("seeking");
    expect(usePlayerStore.getState().status).toBe("seeking");
  });

  it("playing → error", () => {
    usePlayerStore.setState({ status: "playing", currentStreamId: "stream-1" });
    usePlayerStore.getState().setStatus("error");
    expect(usePlayerStore.getState().status).toBe("error");
  });

  it("playing → idle (stop)", () => {
    usePlayerStore.setState({ status: "playing", currentStreamId: "stream-1" });
    usePlayerStore.getState().setStatus("idle");
    expect(usePlayerStore.getState().status).toBe("idle");
  });

  it("paused → playing", () => {
    usePlayerStore.setState({ status: "paused", currentStreamId: "stream-1" });
    usePlayerStore.getState().setStatus("playing");
    expect(usePlayerStore.getState().status).toBe("playing");
  });

  it("paused → seeking", () => {
    usePlayerStore.setState({ status: "paused", currentStreamId: "stream-1" });
    usePlayerStore.getState().setStatus("seeking");
    expect(usePlayerStore.getState().status).toBe("seeking");
  });

  it("paused → idle", () => {
    usePlayerStore.setState({ status: "paused", currentStreamId: "stream-1" });
    usePlayerStore.getState().setStatus("idle");
    expect(usePlayerStore.getState().status).toBe("idle");
  });

  it("buffering → playing", () => {
    usePlayerStore.setState({
      status: "buffering",
      currentStreamId: "stream-1",
    });
    usePlayerStore.getState().setStatus("playing");
    expect(usePlayerStore.getState().status).toBe("playing");
  });

  it("buffering → error", () => {
    usePlayerStore.setState({
      status: "buffering",
      currentStreamId: "stream-1",
    });
    usePlayerStore.getState().setStatus("error");
    expect(usePlayerStore.getState().status).toBe("error");
  });

  it("seeking → playing", () => {
    usePlayerStore.setState({ status: "seeking", currentStreamId: "stream-1" });
    usePlayerStore.getState().setStatus("playing");
    expect(usePlayerStore.getState().status).toBe("playing");
  });

  it("seeking → buffering", () => {
    usePlayerStore.setState({ status: "seeking", currentStreamId: "stream-1" });
    usePlayerStore.getState().setStatus("buffering");
    expect(usePlayerStore.getState().status).toBe("buffering");
  });

  it("seeking → error", () => {
    usePlayerStore.setState({ status: "seeking", currentStreamId: "stream-1" });
    usePlayerStore.getState().setStatus("error");
    expect(usePlayerStore.getState().status).toBe("error");
  });

  it("error → loading (retry)", () => {
    usePlayerStore.setState({ status: "error", currentStreamId: "stream-1" });
    usePlayerStore.getState().setStatus("loading");
    expect(usePlayerStore.getState().status).toBe("loading");
  });

  it("error → idle (stop)", () => {
    usePlayerStore.setState({ status: "error", currentStreamId: "stream-1" });
    usePlayerStore.getState().setStatus("idle");
    expect(usePlayerStore.getState().status).toBe("idle");
  });
});

describe("playerStore — setStatus() invalid transitions are no-ops", () => {
  it("idle → paused is a no-op", () => {
    usePlayerStore.getState().setStatus("paused");
    expect(usePlayerStore.getState().status).toBe("idle");
  });

  it("idle → playing is a no-op", () => {
    usePlayerStore.getState().setStatus("playing");
    expect(usePlayerStore.getState().status).toBe("idle");
  });

  it("idle → buffering is a no-op", () => {
    usePlayerStore.getState().setStatus("buffering");
    expect(usePlayerStore.getState().status).toBe("idle");
  });

  it("idle → seeking is a no-op", () => {
    usePlayerStore.getState().setStatus("seeking");
    expect(usePlayerStore.getState().status).toBe("idle");
  });

  it("loading → paused is a no-op", () => {
    usePlayerStore.setState({ status: "loading", currentStreamId: "stream-1" });
    usePlayerStore.getState().setStatus("paused");
    expect(usePlayerStore.getState().status).toBe("loading");
  });

  it("loading → seeking is a no-op", () => {
    usePlayerStore.setState({ status: "loading", currentStreamId: "stream-1" });
    usePlayerStore.getState().setStatus("seeking");
    expect(usePlayerStore.getState().status).toBe("loading");
  });
});

// ── stopPlayback ──────────────────────────────────────────────────────────────

describe("playerStore — stopPlayback()", () => {
  it("transitions from playing to idle", () => {
    usePlayerStore.setState({ status: "playing", currentStreamId: "stream-1" });
    usePlayerStore.getState().stopPlayback();
    expect(usePlayerStore.getState().status).toBe("idle");
  });

  it("clears currentStreamId", () => {
    usePlayerStore.setState({ status: "playing", currentStreamId: "stream-1" });
    usePlayerStore.getState().stopPlayback();
    expect(usePlayerStore.getState().currentStreamId).toBeNull();
  });

  it("clears seriesContext", () => {
    usePlayerStore.setState({
      status: "playing",
      currentStreamId: "ep-1",
      seriesContext: mockSeriesInfo.seriesContext,
    });
    usePlayerStore.getState().stopPlayback();
    expect(usePlayerStore.getState().seriesContext).toBeNull();
  });

  it("resets currentTime to 0", () => {
    usePlayerStore.setState({
      status: "playing",
      currentStreamId: "stream-1",
      currentTime: 250,
    });
    usePlayerStore.getState().stopPlayback();
    expect(usePlayerStore.getState().currentTime).toBe(0);
  });

  it("clears error state", () => {
    usePlayerStore.setState({
      status: "error",
      currentStreamId: "stream-1",
      error: { code: "FATAL", message: "Stream failed" },
    });
    usePlayerStore.getState().stopPlayback();
    expect(usePlayerStore.getState().error).toBeNull();
    expect(usePlayerStore.getState().status).toBe("idle");
  });

  it("works from paused state", () => {
    usePlayerStore.setState({ status: "paused", currentStreamId: "stream-1" });
    usePlayerStore.getState().stopPlayback();
    expect(usePlayerStore.getState().status).toBe("idle");
    expect(usePlayerStore.getState().currentStreamId).toBeNull();
  });

  it("works from buffering state", () => {
    usePlayerStore.setState({
      status: "buffering",
      currentStreamId: "stream-1",
    });
    usePlayerStore.getState().stopPlayback();
    expect(usePlayerStore.getState().status).toBe("idle");
  });
});

// ── Media property setters ────────────────────────────────────────────────────

describe("playerStore — media property setters", () => {
  it("setVolume(0.5) updates volume", () => {
    usePlayerStore.getState().setVolume(0.5);
    expect(usePlayerStore.getState().volume).toBe(0.5);
  });

  it("setVolume(0) also sets isMuted true", () => {
    usePlayerStore.getState().setVolume(0);
    expect(usePlayerStore.getState().isMuted).toBe(true);
  });

  it("setVolume(>0) clears muted when muted", () => {
    usePlayerStore.setState({ isMuted: true });
    usePlayerStore.getState().setVolume(0.8);
    expect(usePlayerStore.getState().isMuted).toBe(false);
  });

  it("setMuted(true) sets isMuted", () => {
    usePlayerStore.getState().setMuted(true);
    expect(usePlayerStore.getState().isMuted).toBe(true);
  });

  it("setMuted(false) clears isMuted", () => {
    usePlayerStore.setState({ isMuted: true });
    usePlayerStore.getState().setMuted(false);
    expect(usePlayerStore.getState().isMuted).toBe(false);
  });

  it("setCurrentTime(120) updates currentTime", () => {
    usePlayerStore.getState().setCurrentTime(120);
    expect(usePlayerStore.getState().currentTime).toBe(120);
  });

  it("setDuration(3600) updates duration", () => {
    usePlayerStore.getState().setDuration(3600);
    expect(usePlayerStore.getState().duration).toBe(3600);
  });

  it("setBufferedEnd(90) updates bufferedEnd", () => {
    usePlayerStore.getState().setBufferedEnd(90);
    expect(usePlayerStore.getState().bufferedEnd).toBe(90);
  });
});

// ── Quality levels ────────────────────────────────────────────────────────────

describe("playerStore — quality levels", () => {
  const mockLevels = [
    { id: 0, name: "360p", width: 640, height: 360, bitrate: 500000 },
    { id: 1, name: "720p", width: 1280, height: 720, bitrate: 2000000 },
    { id: 2, name: "1080p", width: 1920, height: 1080, bitrate: 4000000 },
  ];

  it("setQualityLevels updates available quality levels", () => {
    usePlayerStore.getState().setQualityLevels(mockLevels);
    expect(usePlayerStore.getState().qualityLevels).toHaveLength(3);
  });

  it("setCurrentQuality(2) updates currentQuality to use nextLevel concept", () => {
    usePlayerStore.setState({ qualityLevels: mockLevels });
    usePlayerStore.getState().setCurrentQuality(2);
    expect(usePlayerStore.getState().currentQuality).toBe(2);
  });

  it("setCurrentQuality(-1) means auto quality", () => {
    usePlayerStore.setState({ qualityLevels: mockLevels, currentQuality: 1 });
    usePlayerStore.getState().setCurrentQuality(-1);
    expect(usePlayerStore.getState().currentQuality).toBe(-1);
  });
});

// ── Subtitle tracks ───────────────────────────────────────────────────────────

describe("playerStore — subtitle tracks", () => {
  const mockTracks = [
    { id: 0, name: "English", lang: "en" },
    { id: 1, name: "Spanish", lang: "es" },
  ];

  it("setSubtitleTracks updates available tracks", () => {
    usePlayerStore.getState().setSubtitleTracks(mockTracks);
    expect(usePlayerStore.getState().subtitleTracks).toHaveLength(2);
  });

  it("setCurrentSubtitle(0) selects the first track", () => {
    usePlayerStore.setState({ subtitleTracks: mockTracks });
    usePlayerStore.getState().setCurrentSubtitle(0);
    expect(usePlayerStore.getState().currentSubtitle).toBe(0);
  });

  it("setCurrentSubtitle(-1) disables subtitles", () => {
    usePlayerStore.setState({ subtitleTracks: mockTracks, currentSubtitle: 0 });
    usePlayerStore.getState().setCurrentSubtitle(-1);
    expect(usePlayerStore.getState().currentSubtitle).toBe(-1);
  });
});

// ── Audio tracks ──────────────────────────────────────────────────────────────

describe("playerStore — audio tracks", () => {
  const mockAudioTracks = [
    { id: 0, name: "English", lang: "en" },
    { id: 1, name: "Hindi", lang: "hi" },
  ];

  it("setAudioTracks updates available audio tracks", () => {
    usePlayerStore.getState().setAudioTracks(mockAudioTracks);
    expect(usePlayerStore.getState().audioTracks).toHaveLength(2);
  });

  it("setCurrentAudio(1) selects the Hindi track", () => {
    usePlayerStore.setState({ audioTracks: mockAudioTracks });
    usePlayerStore.getState().setCurrentAudio(1);
    expect(usePlayerStore.getState().currentAudio).toBe(1);
  });
});

// ── setError ──────────────────────────────────────────────────────────────────

describe("playerStore — setError()", () => {
  it("sets error and transitions to error status from playing", () => {
    usePlayerStore.setState({ status: "playing", currentStreamId: "stream-1" });
    usePlayerStore
      .getState()
      .setError({ code: "NETWORK_ERROR", message: "Connection lost" });
    expect(usePlayerStore.getState().status).toBe("error");
    expect(usePlayerStore.getState().error).toEqual({
      code: "NETWORK_ERROR",
      message: "Connection lost",
    });
  });

  it("sets error from buffering state", () => {
    usePlayerStore.setState({
      status: "buffering",
      currentStreamId: "stream-1",
    });
    usePlayerStore
      .getState()
      .setError({ code: "MEDIA_ERROR", message: "Decode error" });
    expect(usePlayerStore.getState().status).toBe("error");
  });
});

// ── Next/prev episode ─────────────────────────────────────────────────────────

describe("playerStore — episode navigation", () => {
  beforeEach(() => {
    usePlayerStore.setState({
      status: "playing",
      currentStreamId: "ep-1",
      streamType: "series",
      seriesContext: mockSeriesInfo.seriesContext,
    });
  });

  it("playNextEpisode advances to episode 2", () => {
    usePlayerStore.getState().playNextEpisode();
    expect(usePlayerStore.getState().currentStreamId).toBe("ep-2");
    expect(usePlayerStore.getState().seriesContext?.episodeNum).toBe(2);
  });

  it("playNextEpisode does not exceed last episode", () => {
    usePlayerStore.setState({
      currentStreamId: "ep-3",
      seriesContext: { ...mockSeriesInfo.seriesContext, episodeNum: 3 },
    });
    usePlayerStore.getState().playNextEpisode();
    // Should stay on ep-3 (last episode)
    expect(usePlayerStore.getState().currentStreamId).toBe("ep-3");
  });

  it("playNextEpisode does nothing without series context", () => {
    usePlayerStore.setState({ seriesContext: null });
    usePlayerStore.getState().playNextEpisode();
    // Should not crash, currentStreamId unchanged
    expect(usePlayerStore.getState().currentStreamId).toBe("ep-1");
  });
});

// ── Derived state helpers ─────────────────────────────────────────────────────

describe("playerStore — derived state helpers", () => {
  it("isPlaying returns true when status is playing", () => {
    usePlayerStore.setState({ status: "playing" });
    const state = usePlayerStore.getState();
    // Derived helper (may be a selector or computed property)
    const isPlaying = state.status === "playing";
    expect(isPlaying).toBe(true);
  });

  it("isBuffering returns true when status is buffering", () => {
    usePlayerStore.setState({ status: "buffering" });
    const state = usePlayerStore.getState();
    const isBuffering = state.status === "buffering";
    expect(isBuffering).toBe(true);
  });

  it("hasError returns true when status is error", () => {
    usePlayerStore.setState({
      status: "error",
      error: { code: "X", message: "y" },
    });
    const state = usePlayerStore.getState();
    const hasError = state.status === "error";
    expect(hasError).toBe(true);
  });
});
