import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  setAuth: (username: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: localStorage.getItem('sv_auth') === '1',
  username: localStorage.getItem('sv_user'),
  setAuth: (username) => {
    localStorage.setItem('sv_auth', '1');
    localStorage.setItem('sv_user', username);
    set({ isAuthenticated: true, username });
  },
  clearAuth: () => {
    localStorage.removeItem('sv_auth');
    localStorage.removeItem('sv_user');
    set({ isAuthenticated: false, username: null });
  },
}));

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  inputMode: 'mouse' | 'keyboard';
  setInputMode: (mode: 'mouse' | 'keyboard') => void;
  /** When true, SpatialNavProvider skips arrow key handling (e.g. player captures arrows for seek/volume) */
  suppressArrowNav: boolean;
  setSuppressArrowNav: (suppress: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  inputMode: 'mouse' as const,
  setInputMode: (mode) => set({ inputMode: mode }),
  suppressArrowNav: false,
  setSuppressArrowNav: (suppress) => set({ suppressArrowNav: suppress }),
}));

export type StreamType = 'live' | 'vod' | 'series';

export interface EpisodeEntry {
  id: string;
  name: string;
}

interface PlayerState {
  currentStreamId: string | null;
  currentStreamType: StreamType | null;
  currentStreamName: string | null;
  startTime: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  // Series context
  seriesId: string | null;
  seasonNumber: number | null;
  episodeIndex: number | null;
  /** Ordered episode list for next/prev navigation */
  episodeList: EpisodeEntry[];
  // Actions
  playStream: (id: string, type: StreamType, name: string, startTime?: number) => void;
  playSeries: (id: string, type: StreamType, name: string, seriesId: string, season: number, epIndex: number, startTime?: number, episodes?: EpisodeEntry[]) => void;
  playNextEpisode: () => void;
  playPrevEpisode: () => void;
  stop: () => void;
  togglePlay: () => void;
  toggleMute: () => void;
  setVolume: (v: number) => void;
  setEpisodeIndex: (idx: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentStreamId: null,
  currentStreamType: null,
  currentStreamName: null,
  startTime: 0,
  isPlaying: false,
  volume: 1,
  isMuted: false,
  seriesId: null,
  seasonNumber: null,
  episodeIndex: null,
  episodeList: [],
  playStream: (id, type, name, startTime = 0) => {
    set({
      currentStreamId: id,
      currentStreamType: type,
      currentStreamName: name,
      startTime,
      isPlaying: true,
      seriesId: null,
      seasonNumber: null,
      episodeIndex: null,
      episodeList: [],
    });
  },
  playSeries: (id, type, name, seriesId, season, epIndex, startTime = 0, episodes = []) => {
    set({
      currentStreamId: id,
      currentStreamType: type,
      currentStreamName: name,
      startTime,
      isPlaying: true,
      seriesId,
      seasonNumber: season,
      episodeIndex: epIndex,
      episodeList: episodes,
    });
  },
  playNextEpisode: () => {
    const { episodeList, episodeIndex } = get();
    if (episodeIndex === null || !episodeList.length || episodeIndex >= episodeList.length - 1) return;
    const nextIdx = episodeIndex + 1;
    const next = episodeList[nextIdx];
    if (!next) return;
    set({
      currentStreamId: next.id,
      currentStreamName: next.name,
      startTime: 0,
      episodeIndex: nextIdx,
      isPlaying: true,
    });
  },
  playPrevEpisode: () => {
    const { episodeList, episodeIndex } = get();
    if (episodeIndex === null || !episodeList.length || episodeIndex <= 0) return;
    const prevIdx = episodeIndex - 1;
    const prev = episodeList[prevIdx];
    if (!prev) return;
    set({
      currentStreamId: prev.id,
      currentStreamName: prev.name,
      startTime: 0,
      episodeIndex: prevIdx,
      isPlaying: true,
    });
  },
  stop: () =>
    set({
      currentStreamId: null,
      currentStreamType: null,
      currentStreamName: null,
      startTime: 0,
      isPlaying: false,
      seriesId: null,
      seasonNumber: null,
      episodeIndex: null,
      episodeList: [],
    }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  setVolume: (v) => set({ volume: v, isMuted: v === 0 }),
  setEpisodeIndex: (idx) => set({ episodeIndex: idx }),
}));
