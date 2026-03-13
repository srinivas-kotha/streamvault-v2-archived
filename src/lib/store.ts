import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  setAuth: (username: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: sessionStorage.getItem('sv_auth') === '1',
  username: sessionStorage.getItem('sv_user'),
  setAuth: (username) => {
    sessionStorage.setItem('sv_auth', '1');
    sessionStorage.setItem('sv_user', username);
    set({ isAuthenticated: true, username });
  },
  clearAuth: () => {
    sessionStorage.removeItem('sv_auth');
    sessionStorage.removeItem('sv_user');
    set({ isAuthenticated: false, username: null });
  },
}));

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  inputMode: 'mouse' | 'keyboard';
  setInputMode: (mode: 'mouse' | 'keyboard') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  inputMode: 'mouse' as const,
  setInputMode: (mode) => set({ inputMode: mode }),
}));

export type StreamType = 'live' | 'vod' | 'series';

interface PlayerState {
  currentStreamId: string | null;
  currentStreamType: StreamType | null;
  currentStreamName: string | null;
  isPlaying: boolean;
  isMiniPlayer: boolean;
  volume: number;
  isMuted: boolean;
  // Series context
  seriesId: string | null;
  seasonNumber: number | null;
  episodeIndex: number | null;
  // Actions
  playStream: (id: string, type: StreamType, name: string) => void;
  playSeries: (id: string, type: StreamType, name: string, seriesId: string, season: number, epIndex: number) => void;
  stop: () => void;
  togglePlay: () => void;
  toggleMiniPlayer: () => void;
  toggleMute: () => void;
  setVolume: (v: number) => void;
  setEpisodeIndex: (idx: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentStreamId: null,
  currentStreamType: null,
  currentStreamName: null,
  isPlaying: false,
  isMiniPlayer: false,
  volume: 1,
  isMuted: false,
  seriesId: null,
  seasonNumber: null,
  episodeIndex: null,
  playStream: (id, type, name) => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    set({
      currentStreamId: id,
      currentStreamType: type,
      currentStreamName: name,
      isPlaying: true,
      isMiniPlayer: !isStandalone,
      seriesId: null,
      seasonNumber: null,
      episodeIndex: null,
    });
  },
  playSeries: (id, type, name, seriesId, season, epIndex) => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    set({
      currentStreamId: id,
      currentStreamType: type,
      currentStreamName: name,
      isPlaying: true,
      isMiniPlayer: !isStandalone,
      seriesId,
      seasonNumber: season,
      episodeIndex: epIndex,
    });
  },
  stop: () =>
    set({
      currentStreamId: null,
      currentStreamType: null,
      currentStreamName: null,
      isPlaying: false,
      isMiniPlayer: false,
      seriesId: null,
      seasonNumber: null,
      episodeIndex: null,
    }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  toggleMiniPlayer: () => set((s) => ({ isMiniPlayer: !s.isMiniPlayer })),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  setVolume: (v) => set({ volume: v, isMuted: v === 0 }),
  setEpisodeIndex: (idx) => set({ episodeIndex: idx }),
}));
