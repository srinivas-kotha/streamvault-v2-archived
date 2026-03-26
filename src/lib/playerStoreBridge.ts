/**
 * Bridge: syncs the legacy player store (@lib/store) → new playerStore (@lib/stores/playerStore).
 *
 * Pages (MovieDetail, SeriesDetail, LivePage, etc.) call playStream on the legacy store.
 * PlayerShell (root-level) reads from the new playerStore.
 * This bridge keeps them in sync so PlayerShell renders when any page triggers playback.
 *
 * Call initPlayerStoreBridge() once at app startup (e.g., in main.tsx).
 */

import { usePlayerStore as useLegacyStore } from "./store";
import { usePlayerStore as useNewStore } from "./stores/playerStore";
import type {
  SeriesContext as NewSeriesContext,
  EpisodeEntry as NewEpisodeEntry,
} from "./stores/playerStore";

/** Map legacy SeriesContext → new SeriesContext */
function mapSeriesContext(legacy: {
  seriesId: string | null;
  seasonNumber: number | null;
  episodeIndex: number | null;
  episodeList: { id: string; name: string }[];
}): NewSeriesContext | null {
  if (!legacy.seriesId) return null;

  const episodes: NewEpisodeEntry[] = legacy.episodeList.map((ep, idx) => ({
    id: ep.id,
    episodeNum: idx + 1,
    name: ep.name,
  }));

  return {
    seriesId: legacy.seriesId,
    seasonNum: legacy.seasonNumber ?? 1,
    episodeNum: (legacy.episodeIndex ?? 0) + 1,
    episodes,
  };
}

export function initPlayerStoreBridge() {
  // Sync legacy store → new store
  useLegacyStore.subscribe((state, prev) => {
    const newStore = useNewStore.getState();

    // playStream: legacy got a new stream
    if (
      state.currentStreamId &&
      state.currentStreamId !== prev.currentStreamId
    ) {
      const seriesContext = mapSeriesContext({
        seriesId: state.seriesId,
        seasonNumber: state.seasonNumber,
        episodeIndex: state.episodeIndex,
        episodeList: state.episodeList,
      });

      newStore.playStream(state.currentStreamId, {
        streamType: (state.currentStreamType ?? "live") as
          | "live"
          | "vod"
          | "series",
        streamName: state.currentStreamName ?? "",
        startTime: state.startTime,
        seriesContext,
      });
      return;
    }

    // stop: legacy cleared the stream
    if (!state.currentStreamId && prev.currentStreamId) {
      newStore.stopPlayback();
      return;
    }

    // episodeIndex changed (next/prev episode from legacy store)
    if (
      state.currentStreamId &&
      state.episodeIndex !== prev.episodeIndex &&
      state.currentStreamId !== prev.currentStreamId
    ) {
      const seriesContext = mapSeriesContext({
        seriesId: state.seriesId,
        seasonNumber: state.seasonNumber,
        episodeIndex: state.episodeIndex,
        episodeList: state.episodeList,
      });

      newStore.playStream(state.currentStreamId, {
        streamType: (state.currentStreamType ?? "series") as
          | "live"
          | "vod"
          | "series",
        streamName: state.currentStreamName ?? "",
        startTime: state.startTime,
        seriesContext,
      });
    }
  });

  // Sync new store → legacy store (for stop/episode navigation from PlayerShell)
  useNewStore.subscribe((state, prev) => {
    const legacyStore = useLegacyStore.getState();

    // stopPlayback: new store went idle
    if (
      state.status === "idle" &&
      prev.status !== "idle" &&
      legacyStore.currentStreamId
    ) {
      legacyStore.stop();
      return;
    }

    // Episode navigation from new store (PlayerShell controls)
    if (
      state.currentStreamId &&
      state.currentStreamId !== prev.currentStreamId &&
      state.seriesContext &&
      prev.status !== "idle"
    ) {
      // Don't re-sync if legacy already has this stream (avoid infinite loop)
      if (legacyStore.currentStreamId === state.currentStreamId) return;

      const sc = state.seriesContext;
      const epIndex = sc.episodes.findIndex(
        (ep) => ep.id === state.currentStreamId,
      );

      useLegacyStore.setState({
        currentStreamId: state.currentStreamId,
        currentStreamName: state.streamName,
        startTime: state.startTime,
        episodeIndex: epIndex >= 0 ? epIndex : legacyStore.episodeIndex,
      });
    }
  });
}
