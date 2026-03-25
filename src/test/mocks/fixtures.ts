/**
 * Factory functions for mock data matching StreamVault Phase 2 API types.
 *
 * Each factory returns a realistic default that can be overridden via
 * Partial<T> spread, keeping tests concise and type-safe.
 */

import type {
  Category,
  CatalogItem,
  CatalogItemDetail,
  EpisodeInfo,
  EPGEntry,
  DbFavorite,
  DbWatchHistory,
  SearchResults,
  ContentType,
} from "@shared/types/api";

// ── Counters for unique IDs ─────────────────────────────────────────────────

let _id = 1000;
function nextId(): number {
  return _id++;
}

/** Reset the ID counter between test files if needed. */
export function resetIdCounter(start = 1000): void {
  _id = start;
}

// ── Categories ──────────────────────────────────────────────────────────────

export function mockCategory(overrides: Partial<Category> = {}): Category {
  const id = nextId();
  return {
    id: String(id),
    name: `Category ${id}`,
    parentId: null,
    type: "live",
    ...overrides,
  };
}

// ── Live Streams ────────────────────────────────────────────────────────────

export function mockLiveStream(
  overrides: Partial<CatalogItem> = {},
): CatalogItem {
  const id = nextId();
  return {
    id: String(id),
    name: `Live Channel ${id}`,
    type: "live",
    categoryId: "1",
    icon: `https://example.com/icons/live-${id}.png`,
    added: "1700000000",
    isAdult: false,
    ...overrides,
  };
}

// ── VOD Streams ─────────────────────────────────────────────────────────────

export function mockVODStream(
  overrides: Partial<CatalogItem> = {},
): CatalogItem {
  const id = nextId();
  return {
    id: String(id),
    name: `Movie ${id}`,
    type: "vod",
    categoryId: "10",
    icon: `https://example.com/posters/movie-${id}.jpg`,
    added: "1700000000",
    isAdult: false,
    rating: "7.5",
    ...overrides,
  };
}

// ── VOD Info ────────────────────────────────────────────────────────────────

export function mockVODInfo(
  overrides: Partial<CatalogItemDetail> = {},
): CatalogItemDetail {
  const id = nextId();
  return {
    id: String(id),
    name: `Movie ${id}`,
    type: "vod",
    categoryId: "10",
    icon: `https://example.com/posters/movie-${id}.jpg`,
    added: "1700000000",
    isAdult: false,
    rating: "7.5",
    plot: "A thrilling adventure across uncharted territories.",
    cast: "Actor One, Actor Two",
    director: "Director Name",
    genre: "Action, Adventure",
    duration: "02:15:30",
    durationSecs: 8130,
    containerExtension: "mp4",
    tmdbId: String(id),
    ...overrides,
  };
}

// ── Series Items ────────────────────────────────────────────────────────────

export function mockSeriesItem(
  overrides: Partial<CatalogItem> = {},
): CatalogItem {
  const id = nextId();
  return {
    id: String(id),
    name: `Series ${id}`,
    type: "series",
    categoryId: "20",
    icon: `https://example.com/covers/series-${id}.jpg`,
    added: "1700000000",
    isAdult: false,
    rating: "8.2",
    genre: "Drama",
    ...overrides,
  };
}

// ── Series Info ─────────────────────────────────────────────────────────────

export function mockSeriesInfo(
  overrides: Partial<CatalogItemDetail> = {},
): CatalogItemDetail {
  const episodes: Record<string, EpisodeInfo[]> = {
    "1": [
      {
        id: "101",
        episodeNumber: 1,
        title: "Pilot",
        containerExtension: "mp4",
        duration: 3600,
        plot: "The story begins.",
        icon: "https://example.com/ep/s1e1.jpg",
        added: "1704844800",
      },
      {
        id: "102",
        episodeNumber: 2,
        title: "Second Steps",
        containerExtension: "mp4",
        duration: 2700,
        plot: "New challenges arise.",
        icon: "https://example.com/ep/s1e2.jpg",
        added: "1705449600",
      },
    ],
    "2": [
      {
        id: "201",
        episodeNumber: 1,
        title: "New Beginnings",
        containerExtension: "mp4",
        duration: 3300,
        plot: "A fresh start.",
        icon: "https://example.com/ep/s2e1.jpg",
        added: "1736640000",
      },
    ],
  };

  return {
    id: "1000",
    name: "Test Series",
    type: "series",
    categoryId: "20",
    icon: "https://example.com/covers/series.jpg",
    added: "1700000000",
    isAdult: false,
    rating: "8.2",
    genre: "Drama",
    plot: "An epic drama spanning multiple seasons.",
    cast: "Lead Actor, Supporting Actor",
    director: "Show Runner",
    backdropUrl: "https://example.com/backdrops/series.jpg",
    seasons: [
      {
        seasonNumber: 1,
        name: "Season 1",
        episodeCount: 10,
        icon: "https://example.com/covers/s1.jpg",
      },
      {
        seasonNumber: 2,
        name: "Season 2",
        episodeCount: 8,
        icon: "https://example.com/covers/s2.jpg",
      },
    ],
    episodes,
    ...overrides,
  };
}

// ── EPG Items ───────────────────────────────────────────────────────────────

export function mockEPGItem(overrides: Partial<EPGEntry> = {}): EPGEntry {
  const id = nextId();
  const now = Math.floor(Date.now() / 1000);
  return {
    id: String(id),
    channelId: `ch-${id}`,
    title: `Program ${id}`,
    description: "An interesting program.",
    start: new Date(now * 1000).toISOString(),
    end: new Date((now + 3600) * 1000).toISOString(),
    ...overrides,
  };
}

// ── Favorites ───────────────────────────────────────────────────────────────

export function mockFavorite(overrides: Partial<DbFavorite> = {}): DbFavorite {
  const id = nextId();
  return {
    id,
    user_id: 1,
    content_type: "vod" as ContentType,
    content_id: id + 5000,
    content_name: `Favorite Item ${id}`,
    content_icon: `https://example.com/icons/fav-${id}.png`,
    category_name: "Action",
    sort_order: 0,
    added_at: new Date().toISOString(),
    ...overrides,
  };
}

// ── Watch History ───────────────────────────────────────────────────────────

export function mockWatchHistory(
  overrides: Partial<DbWatchHistory> = {},
): DbWatchHistory {
  const id = nextId();
  return {
    id,
    user_id: 1,
    content_type: "vod" as ContentType,
    content_id: id + 6000,
    content_name: `Watched Movie ${id}`,
    content_icon: `https://example.com/icons/hist-${id}.png`,
    progress_seconds: 1200,
    duration_seconds: 7200,
    watched_at: new Date().toISOString(),
    ...overrides,
  };
}

// ── Search Results ──────────────────────────────────────────────────────────

export function mockSearchResults(
  overrides: Partial<SearchResults> = {},
): SearchResults {
  return {
    live: [mockLiveStream({ name: "Search Live Result" })],
    vod: [mockVODStream({ name: "Search Movie Result" })],
    series: [mockSeriesItem({ name: "Search Series Result" })],
    ...overrides,
  };
}
