/**
 * Sprint 6A — Settings Store
 *
 * Zustand store with persist middleware (localStorage key: sv_settings).
 * Manages user preferences: quality, subtitle language, auto-play, and server URL.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ─────────────────────────────────────────────────────────────────────

export type DefaultQuality = "auto" | "high" | "medium" | "low";

export interface SettingsState {
  defaultQuality: DefaultQuality;
  defaultSubtitleLang: string; // empty string = subtitles disabled
  autoPlayNextEpisode: boolean;
  serverUrl: string; // base URL for API (empty = use window.location.origin)

  // Actions
  setDefaultQuality: (q: DefaultQuality) => void;
  setDefaultSubtitleLang: (lang: string) => void;
  setAutoPlayNextEpisode: (v: boolean) => void;
  setServerUrl: (url: string) => void;
  resetAll: () => void;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_STATE = {
  defaultQuality: "auto" as DefaultQuality,
  defaultSubtitleLang: "",
  autoPlayNextEpisode: true,
  serverUrl: "",
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      setDefaultQuality: (defaultQuality) => set({ defaultQuality }),
      setDefaultSubtitleLang: (defaultSubtitleLang) =>
        set({ defaultSubtitleLang }),
      setAutoPlayNextEpisode: (autoPlayNextEpisode) =>
        set({ autoPlayNextEpisode }),
      setServerUrl: (serverUrl) => set({ serverUrl }),
      resetAll: () => set({ ...DEFAULT_STATE }),
    }),
    {
      name: "sv_settings",
      // Only persist the data fields, not the action functions
      partialize: (state) => ({
        defaultQuality: state.defaultQuality,
        defaultSubtitleLang: state.defaultSubtitleLang,
        autoPlayNextEpisode: state.autoPlayNextEpisode,
        serverUrl: state.serverUrl,
      }),
    },
  ),
);
