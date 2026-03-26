import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  setAuth: (username: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: localStorage.getItem("sv_auth") === "1",
  username: localStorage.getItem("sv_user"),
  setAuth: (username) => {
    localStorage.setItem("sv_auth", "1");
    localStorage.setItem("sv_user", username);
    set({ isAuthenticated: true, username });
  },
  clearAuth: () => {
    localStorage.removeItem("sv_auth");
    localStorage.removeItem("sv_user");
    set({ isAuthenticated: false, username: null });
  },
}));

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  inputMode: "mouse" | "keyboard";
  setInputMode: (mode: "mouse" | "keyboard") => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  inputMode: "mouse" as const,
  setInputMode: (mode) => set({ inputMode: mode }),
}));

export type StreamType = "live" | "vod" | "series";

export interface EpisodeEntry {
  id: string;
  name: string;
}

export interface SeriesContext {
  seriesId: string;
  seasonNumber: number;
  episodeIndex: number;
  episodes: EpisodeEntry[];
}

export interface StreamInfo {
  streamType: StreamType;
  streamName: string;
  startTime?: number;
  seriesContext?: SeriesContext | null;
}

interface PlayerState {
  currentStreamId: string | null;
  currentStreamType: StreamType | null;
  currentStreamName: string | null;
  startTime: number;
  volume: number;
  isMuted: boolean;
  // Series context
  seriesId: string | null;
  seasonNumber: number | null;
  episodeIndex: number | null;
  /** Ordered episode list for next/prev navigation */
  episodeList: EpisodeEntry[];
  // Actions
  playStream: (id: string, info: StreamInfo) => void;
  playNextEpisode: () => void;
  playPrevEpisode: () => void;
  stop: () => void;
  toggleMute: () => void;
  setVolume: (v: number) => void;
  setEpisodeIndex: (idx: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
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
  playStream: (id, info) => {
    const sc = info.seriesContext;
    set({
      currentStreamId: id,
      currentStreamType: info.streamType,
      currentStreamName: info.streamName,
      startTime: info.startTime ?? 0,
      seriesId: sc?.seriesId ?? null,
      seasonNumber: sc?.seasonNumber ?? null,
      episodeIndex: sc?.episodeIndex ?? null,
      episodeList: sc?.episodes ?? [],
    });
  },
  playNextEpisode: () => {
    const { episodeList, episodeIndex } = get();
    if (
      episodeIndex === null ||
      !episodeList.length ||
      episodeIndex >= episodeList.length - 1
    )
      return;
    const nextIdx = episodeIndex + 1;
    const next = episodeList[nextIdx];
    if (!next) return;
    set({
      currentStreamId: next.id,
      currentStreamName: next.name,
      startTime: 0,
      episodeIndex: nextIdx,
    });
  },
  playPrevEpisode: () => {
    const { episodeList, episodeIndex } = get();
    if (episodeIndex === null || !episodeList.length || episodeIndex <= 0)
      return;
    const prevIdx = episodeIndex - 1;
    const prev = episodeList[prevIdx];
    if (!prev) return;
    set({
      currentStreamId: prev.id,
      currentStreamName: prev.name,
      startTime: 0,
      episodeIndex: prevIdx,
    });
  },
  stop: () =>
    set({
      currentStreamId: null,
      currentStreamType: null,
      currentStreamName: null,
      startTime: 0,
      seriesId: null,
      seasonNumber: null,
      episodeIndex: null,
      episodeList: [],
    }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  setVolume: (v) => set({ volume: v, isMuted: v === 0 }),
  setEpisodeIndex: (idx) => set({ episodeIndex: idx }),
}));

/** Derived selector: true when a stream is loaded in the player */
export const useIsPlayerActive = () =>
  usePlayerStore((s) => !!s.currentStreamId);
