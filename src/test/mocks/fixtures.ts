/**
 * Factory functions for mock data matching StreamVault API types.
 *
 * Each factory returns a realistic default that can be overridden via
 * Partial<T> spread, keeping tests concise and type-safe.
 */

import type {
  XtreamCategory,
  XtreamLiveStream,
  XtreamVODStream,
  XtreamVODInfo,
  XtreamSeriesItem,
  XtreamSeriesInfo,
  XtreamEPGItem,
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

export function mockCategory(
  overrides: Partial<XtreamCategory> = {},
): XtreamCategory {
  const id = nextId();
  return {
    category_id: String(id),
    category_name: `Category ${id}`,
    parent_id: 0,
    ...overrides,
  };
}

// ── Live Streams ────────────────────────────────────────────────────────────

export function mockLiveStream(
  overrides: Partial<XtreamLiveStream> = {},
): XtreamLiveStream {
  const id = nextId();
  return {
    num: id,
    name: `Live Channel ${id}`,
    stream_type: "live",
    stream_id: id,
    stream_icon: `https://example.com/icons/live-${id}.png`,
    epg_channel_id: `epg-${id}`,
    added: "1700000000",
    is_adult: "0",
    category_id: "1",
    category_ids: [1],
    custom_sid: "",
    tv_archive: 0,
    direct_source: "",
    tv_archive_duration: 0,
    ...overrides,
  };
}

// ── VOD Streams ─────────────────────────────────────────────────────────────

export function mockVODStream(
  overrides: Partial<XtreamVODStream> = {},
): XtreamVODStream {
  const id = nextId();
  return {
    num: id,
    name: `Movie ${id}`,
    stream_type: "movie",
    stream_id: id,
    stream_icon: `https://example.com/posters/movie-${id}.jpg`,
    rating: "7.5",
    rating_5based: 3.75,
    added: "1700000000",
    is_adult: "0",
    category_id: "10",
    category_ids: [10],
    container_extension: "mp4",
    custom_sid: "",
    direct_source: "",
    ...overrides,
  };
}

// ── VOD Info ────────────────────────────────────────────────────────────────

export function mockVODInfo(
  overrides: Partial<XtreamVODInfo> = {},
): XtreamVODInfo {
  const id = nextId();
  return {
    info: {
      movie_image: `https://example.com/posters/movie-${id}.jpg`,
      tmdb_id: String(id),
      name: `Movie ${id}`,
      o_name: `Original Movie ${id}`,
      plot: "A thrilling adventure across uncharted territories.",
      cast: "Actor One, Actor Two",
      director: "Director Name",
      genre: "Action, Adventure",
      releaseDate: "2025-06-15",
      duration: "02:15:30",
      duration_secs: 8130,
      rating: "7.5",
    },
    movie_data: {
      stream_id: id,
      name: `Movie ${id}`,
      added: "1700000000",
      category_id: "10",
      container_extension: "mp4",
      custom_sid: "",
      direct_source: "",
    },
    ...overrides,
  };
}

// ── Series Items ────────────────────────────────────────────────────────────

export function mockSeriesItem(
  overrides: Partial<XtreamSeriesItem> = {},
): XtreamSeriesItem {
  const id = nextId();
  return {
    num: id,
    name: `Series ${id}`,
    series_id: id,
    cover: `https://example.com/covers/series-${id}.jpg`,
    plot: "An epic drama spanning multiple seasons.",
    cast: "Lead Actor, Supporting Actor",
    director: "Show Runner",
    genre: "Drama",
    releaseDate: "2024-01-10",
    last_modified: "1700000000",
    rating: "8.2",
    rating_5based: 4.1,
    backdrop_path: [`https://example.com/backdrops/series-${id}.jpg`],
    category_id: "20",
    category_ids: [20],
    ...overrides,
  };
}

// ── Series Info ─────────────────────────────────────────────────────────────

export function mockSeriesInfo(
  overrides: Partial<XtreamSeriesInfo> = {},
): XtreamSeriesInfo {
  return {
    seasons: [
      {
        air_date: "2024-01-10",
        episode_count: 10,
        id: 1,
        name: "Season 1",
        overview: "The beginning of the story.",
        season_number: 1,
        cover: "https://example.com/covers/s1.jpg",
      },
      {
        air_date: "2025-01-10",
        episode_count: 8,
        id: 2,
        name: "Season 2",
        overview: "The story continues.",
        season_number: 2,
        cover: "https://example.com/covers/s2.jpg",
      },
    ],
    info: {
      name: "Test Series",
      cover: "https://example.com/covers/series.jpg",
      plot: "An epic drama spanning multiple seasons.",
      cast: "Lead Actor, Supporting Actor",
      director: "Show Runner",
      genre: "Drama",
      releaseDate: "2024-01-10",
      rating: "8.2",
      backdrop_path: ["https://example.com/backdrops/series.jpg"],
    },
    episodes: {
      "1": [
        {
          id: "101",
          episode_num: 1,
          title: "Pilot",
          container_extension: "mp4",
          added: "1704844800",
          info: {
            duration_secs: 3600,
            duration: "01:00:00",
            plot: "The story begins.",
            movie_image: "https://example.com/ep/s1e1.jpg",
          },
          season: 1,
          direct_source: "",
        },
        {
          id: "102",
          episode_num: 2,
          title: "Second Steps",
          container_extension: "mp4",
          added: "1705449600",
          info: {
            duration_secs: 2700,
            duration: "00:45:00",
            plot: "New challenges arise.",
            movie_image: "https://example.com/ep/s1e2.jpg",
          },
          season: 1,
          direct_source: "",
        },
      ],
      "2": [
        {
          id: "201",
          episode_num: 1,
          title: "New Beginnings",
          container_extension: "mp4",
          added: "1736640000",
          info: {
            duration_secs: 3300,
            duration: "00:55:00",
            plot: "A fresh start.",
            movie_image: "https://example.com/ep/s2e1.jpg",
          },
          season: 2,
          direct_source: "",
        },
      ],
    },
    ...overrides,
  };
}

// ── EPG Items ───────────────────────────────────────────────────────────────

export function mockEPGItem(
  overrides: Partial<XtreamEPGItem> = {},
): XtreamEPGItem {
  const id = nextId();
  const now = Math.floor(Date.now() / 1000);
  return {
    id: String(id),
    epg_id: `epg-${id}`,
    title: `Program ${id}`,
    lang: "en",
    start: new Date(now * 1000).toISOString(),
    end: new Date((now + 3600) * 1000).toISOString(),
    description: "An interesting program.",
    channel_id: `ch-${id}`,
    start_timestamp: String(now),
    stop_timestamp: String(now + 3600),
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
