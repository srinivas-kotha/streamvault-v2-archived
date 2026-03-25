// Content types
export type ContentType = "live" | "vod" | "series";

// ── Normalized API types ─────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  type: ContentType;
  count?: number;
}

export interface CatalogItem {
  id: string;
  name: string;
  type: ContentType;
  categoryId: string;
  icon: string | null;
  added: string | null;
  isAdult: boolean;
  rating?: string;
  genre?: string;
  year?: string;
}

export interface SeasonInfo {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  icon?: string;
}

export interface EpisodeInfo {
  id: string;
  episodeNumber: number;
  title: string;
  containerExtension?: string;
  duration?: number;
  plot?: string;
  rating?: string;
  icon?: string;
  added?: string;
}

export interface CatalogItemDetail extends CatalogItem {
  plot?: string;
  cast?: string;
  director?: string;
  duration?: string;
  durationSecs?: number;
  containerExtension?: string;
  backdropUrl?: string;
  tmdbId?: string;
  seasons?: SeasonInfo[];
  episodes?: Record<string, EpisodeInfo[]>;
}

export interface EPGEntry {
  id: string;
  channelId: string;
  title: string;
  description: string;
  start: string;
  end: string;
  category?: string;
  icon?: string;
}

export interface SearchResults {
  live: CatalogItem[];
  vod: CatalogItem[];
  series: CatalogItem[];
}

// ── Backward-compatible aliases ──────────────────────────────────────────────
// Components may import these old names — keep them pointing at the new types.

export type XtreamLiveStream = CatalogItem;
export type XtreamVODStream = CatalogItem;
export type XtreamSeriesItem = CatalogItem;
export type XtreamVODInfo = CatalogItemDetail;
export type XtreamSeriesInfo = CatalogItemDetail;
export type XtreamEPGItem = EPGEntry;
export type XtreamCategory = Category;

// ── App / DB types (unchanged) ───────────────────────────────────────────────

export interface DbFavorite {
  id: number;
  user_id: number;
  content_type: ContentType;
  content_id: number;
  content_name: string | null;
  content_icon: string | null;
  category_name: string | null;
  sort_order: number;
  added_at: string;
}

export interface DbWatchHistory {
  id: number;
  user_id: number;
  content_type: ContentType;
  content_id: number;
  content_name: string | null;
  content_icon: string | null;
  progress_seconds: number;
  duration_seconds: number;
  watched_at: string;
}

export interface StreamUrlResponse {
  url: string;
  format: string;
  isLive: boolean;
}

export interface FavoriteRequest {
  content_type: ContentType;
  content_name?: string;
  content_icon?: string;
  category_name?: string;
}

export interface HistoryUpdateRequest {
  content_type: ContentType;
  content_name?: string;
  content_icon?: string;
  progress_seconds: number;
  duration_seconds: number;
}
