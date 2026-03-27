/**
 * Sprint 4 — Issue #112
 * playerStore: Zustand store with state-machine transitions for the player.
 *
 * State machine:
 *   idle → loading
 *   loading → playing | error | idle
 *   playing → paused | buffering | seeking | error | idle
 *   paused → playing | seeking | idle
 *   buffering → playing | error | idle
 *   seeking → playing | buffering | error | idle
 *   error → loading | idle
 */

import { create } from "zustand";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PlayerStatus =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "buffering"
  | "seeking"
  | "error";

export type StreamType = "live" | "vod" | "series";

export interface QualityLevel {
  id: number;
  name: string;
  width?: number;
  height?: number;
  bitrate?: number;
}

export interface SubtitleTrack {
  id: number;
  name: string;
  lang?: string;
}

export interface AudioTrack {
  id: number;
  name: string;
  lang?: string;
}

export interface EpisodeEntry {
  id: string;
  episodeNum: number;
  title?: string;
  name?: string;
  streamUrl?: string;
  seasonNum?: number;
}

export interface SeriesContext {
  seriesId: string;
  seasonNum: number;
  episodeNum: number;
  episodes: EpisodeEntry[];
}

export interface PlayerError {
  code: string;
  message: string;
}

export interface StreamInfo {
  streamType: StreamType;
  streamName: string;
  startTime?: number;
  seriesContext?: SeriesContext | null;
}

// ── Valid transitions ─────────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<PlayerStatus, PlayerStatus[]> = {
  idle: ["loading"],
  loading: ["playing", "error", "idle"],
  playing: ["paused", "buffering", "seeking", "error", "idle"],
  paused: ["playing", "seeking", "idle"],
  buffering: ["playing", "error", "idle"],
  seeking: ["playing", "buffering", "error", "idle"],
  error: ["loading", "idle"],
};

// ── Store state interface ─────────────────────────────────────────────────────

interface PlayerState {
  // State machine
  status: PlayerStatus;

  // Stream identity
  currentStreamId: string | null;
  streamType: StreamType | null;
  streamName: string;
  startTime: number;

  // Series context
  seriesContext: SeriesContext | null;

  // Playback position
  currentTime: number;
  duration: number;
  bufferedEnd: number;

  // Audio/visual
  volume: number;
  isMuted: boolean;

  // Playback speed
  playbackRate: number;

  // Quality
  qualityLevels: QualityLevel[];
  currentQuality: number;

  // Subtitles
  subtitleTracks: SubtitleTrack[];
  currentSubtitle: number;

  // Audio tracks
  audioTracks: AudioTrack[];
  currentAudio: number;

  // Error
  error: PlayerError | string | null;

  // Actions
  playStream: (id: string, info: StreamInfo) => void;
  setStatus: (status: PlayerStatus) => void;
  stopPlayback: () => void;

  // Media property setters
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setBufferedEnd: (end: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setPlaybackRate: (rate: number) => void;

  // Quality / track setters
  setQualityLevels: (levels: QualityLevel[]) => void;
  setCurrentQuality: (index: number) => void;
  setSubtitleTracks: (tracks: SubtitleTrack[]) => void;
  setCurrentSubtitle: (index: number) => void;
  setAudioTracks: (tracks: AudioTrack[]) => void;
  setCurrentAudio: (index: number) => void;

  // Error
  setError: (error: PlayerError | string) => void;

  // Episode navigation
  playNextEpisode: () => void;
  playPrevEpisode: () => void;
}

// ── Store implementation ──────────────────────────────────────────────────────

export const usePlayerStore = create<PlayerState>((set, get) => ({
  // Initial state
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
  playbackRate: 1,
  qualityLevels: [],
  currentQuality: -1,
  subtitleTracks: [],
  currentSubtitle: -1,
  audioTracks: [],
  currentAudio: 0,
  error: null,

  // ── playStream ──────────────────────────────────────────────────────────────
  playStream: (id, info) => {
    set({
      status: "loading",
      currentStreamId: id,
      streamType: info.streamType,
      streamName: info.streamName,
      startTime: info.startTime ?? 0,
      seriesContext: info.seriesContext ?? null,
      currentTime: 0,
      duration: 0,
      bufferedEnd: 0,
      error: null,
      playbackRate: 1,
      qualityLevels: [],
      currentQuality: -1,
      subtitleTracks: [],
      currentSubtitle: -1,
      audioTracks: [],
      currentAudio: 0,
    });
  },

  // ── setStatus (state machine) ───────────────────────────────────────────────
  setStatus: (nextStatus) => {
    const current = get().status;
    if (!VALID_TRANSITIONS[current].includes(nextStatus)) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[playerStore] Invalid transition: ${current} → ${nextStatus}`,
        );
      }
      return; // no-op for invalid transitions
    }
    set({ status: nextStatus });
  },

  // ── stopPlayback ────────────────────────────────────────────────────────────
  stopPlayback: () => {
    set({
      status: "idle",
      currentStreamId: null,
      streamType: null,
      streamName: "",
      startTime: 0,
      seriesContext: null,
      currentTime: 0,
      duration: 0,
      bufferedEnd: 0,
      error: null,
      playbackRate: 1,
      qualityLevels: [],
      currentQuality: -1,
      subtitleTracks: [],
      currentSubtitle: -1,
      audioTracks: [],
      currentAudio: 0,
    });
  },

  // ── Media property setters ──────────────────────────────────────────────────
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setBufferedEnd: (end) => set({ bufferedEnd: end }),

  setVolume: (volume) => {
    set({ volume, isMuted: volume === 0 ? true : false });
    // If volume > 0 and was muted, unmute
    if (volume > 0 && get().isMuted) {
      set({ isMuted: false });
    }
  },

  setMuted: (muted) => set({ isMuted: muted }),

  setPlaybackRate: (rate) => set({ playbackRate: rate }),

  // ── Quality / track setters ─────────────────────────────────────────────────
  setQualityLevels: (levels) => set({ qualityLevels: levels }),
  setCurrentQuality: (index) => set({ currentQuality: index }),
  setSubtitleTracks: (tracks) => set({ subtitleTracks: tracks }),
  setCurrentSubtitle: (index) => set({ currentSubtitle: index }),
  setAudioTracks: (tracks) => set({ audioTracks: tracks }),
  setCurrentAudio: (index) => set({ currentAudio: index }),

  // ── setError ────────────────────────────────────────────────────────────────
  setError: (error) => {
    const current = get().status;
    const canTransition = VALID_TRANSITIONS[current].includes("error");
    set({
      error,
      status: canTransition ? "error" : get().status,
    });
  },

  // ── Episode navigation ──────────────────────────────────────────────────────
  playNextEpisode: () => {
    const { seriesContext, currentStreamId } = get();
    if (!seriesContext) return;

    const { episodes, episodeNum, seriesId, seasonNum } = seriesContext;
    const currentIndex = episodes.findIndex(
      (ep) => ep.id === currentStreamId || ep.episodeNum === episodeNum,
    );
    if (currentIndex < 0 || currentIndex >= episodes.length - 1) return;

    const nextEp = episodes[currentIndex + 1];
    if (!nextEp) return;

    set({
      currentStreamId: nextEp.id,
      streamName: nextEp.title ?? nextEp.name ?? `Episode ${nextEp.episodeNum}`,
      currentTime: 0,
      startTime: 0,
      status: "loading",
      seriesContext: {
        seriesId,
        seasonNum,
        episodeNum: nextEp.episodeNum,
        episodes,
      },
    });
  },

  playPrevEpisode: () => {
    const { seriesContext, currentStreamId } = get();
    if (!seriesContext) return;

    const { episodes, episodeNum, seriesId, seasonNum } = seriesContext;
    const currentIndex = episodes.findIndex(
      (ep) => ep.id === currentStreamId || ep.episodeNum === episodeNum,
    );
    if (currentIndex <= 0) return;

    const prevEp = episodes[currentIndex - 1];
    if (!prevEp) return;

    set({
      currentStreamId: prevEp.id,
      streamName: prevEp.title ?? prevEp.name ?? `Episode ${prevEp.episodeNum}`,
      currentTime: 0,
      startTime: 0,
      status: "loading",
      seriesContext: {
        seriesId,
        seasonNum,
        episodeNum: prevEp.episodeNum,
        episodes,
      },
    });
  },
}));
