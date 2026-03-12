// Content types
export type ContentType = 'channel' | 'vod' | 'series';

// Xtream API types
export interface XtreamCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface XtreamLiveStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  added: string;
  is_adult: string;
  category_id: string;
  category_ids: number[];
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
}

export interface XtreamVODStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  rating: string;
  rating_5based: number;
  added: string;
  is_adult: string;
  category_id: string;
  category_ids: number[];
  container_extension: string;
  custom_sid: string;
  direct_source: string;
}

export interface XtreamVODInfo {
  info: {
    movie_image: string;
    tmdb_id: string;
    name: string;
    o_name: string;
    plot: string;
    cast: string;
    director: string;
    genre: string;
    releaseDate: string;
    duration: string;
    duration_secs: number;
    rating: string;
  };
  movie_data: {
    stream_id: number;
    name: string;
    added: string;
    category_id: string;
    container_extension: string;
    custom_sid: string;
    direct_source: string;
  };
}

export interface XtreamSeriesItem {
  num: number;
  name: string;
  series_id: number;
  cover: string;
  plot: string;
  cast: string;
  director: string;
  genre: string;
  releaseDate: string;
  last_modified: string;
  rating: string;
  rating_5based: number;
  backdrop_path: string[];
  category_id: string;
  category_ids: number[];
}

export interface XtreamSeriesInfo {
  seasons: Array<{
    air_date: string;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    season_number: number;
    cover: string;
  }>;
  info: {
    name: string;
    cover: string;
    plot: string;
    cast: string;
    director: string;
    genre: string;
    releaseDate: string;
    rating: string;
    backdrop_path: string[];
  };
  episodes: Record<
    string,
    Array<{
      id: string;
      episode_num: number;
      title: string;
      container_extension: string;
      added: string; // unix timestamp
      info: {
        duration_secs: number;
        duration: string;
        plot: string;
        movie_image: string;
      };
      season: number;
      direct_source: string;
    }>
  >;
}

export interface XtreamEPGItem {
  id: string;
  epg_id: string;
  title: string;
  lang: string;
  start: string;
  end: string;
  description: string;
  channel_id: string;
  start_timestamp: string;
  stop_timestamp: string;
}

// App types
export interface SearchResults {
  live: XtreamLiveStream[];
  vod: XtreamVODStream[];
  series: XtreamSeriesItem[];
}

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
