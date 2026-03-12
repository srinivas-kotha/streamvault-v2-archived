import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { api } from '@lib/api';
import { useLiveCategories } from '@features/live/api';
import { useVODCategories } from '@features/vod/api';
import { useSeriesCategories } from '@features/series/api';
import { getCategoriesForLanguage } from '@shared/utils/categoryParser';
import type { XtreamVODStream, XtreamSeriesItem, XtreamLiveStream } from '@shared/types/api';

/**
 * Get grouped categories for a language.
 */
export function useLanguageCategories(language: string) {
  const { data: liveCategories } = useLiveCategories();
  const { data: vodCategories } = useVODCategories();
  const { data: seriesCategories } = useSeriesCategories();

  const categories = useMemo(() => getCategoriesForLanguage(
    language,
    liveCategories ?? [],
    vodCategories ?? [],
    seriesCategories ?? []
  ), [language, liveCategories, vodCategories, seriesCategories]);

  return {
    movies: categories.movies,
    series: categories.series,
    live: categories.live,
    isReady: !!(liveCategories && vodCategories && seriesCategories),
  };
}

/**
 * Fetch first N streams for each movie sub-category in a language.
 */
export function useLanguageMovieRails(language: string, limit = 20) {
  const { movies, isReady } = useLanguageCategories(language);

  const queries = useQueries({
    queries: movies.slice(0, 10).map((cat) => ({
      queryKey: ['vod', 'streams', cat.id],
      queryFn: () => api<XtreamVODStream[]>(`/vod/streams/${cat.id}`),
      enabled: isReady,
      staleTime: 2 * 60 * 60 * 1000,
      select: (data: XtreamVODStream[]) => ({
        category: cat,
        items: data.slice(0, limit),
      }),
    })),
  });

  return {
    rails: queries
      .filter((q) => q.data && q.data.items.length > 0)
      .map((q) => q.data!),
    isLoading: queries.some((q) => q.isLoading),
  };
}

/**
 * Fetch series for a language.
 */
export function useLanguageSeriesRails(language: string, limit = 20) {
  const { series, isReady } = useLanguageCategories(language);

  const queries = useQueries({
    queries: series.slice(0, 10).map((cat) => ({
      queryKey: ['series', 'list', cat.id],
      queryFn: () => api<XtreamSeriesItem[]>(`/series/list/${cat.id}`),
      enabled: isReady,
      staleTime: 2 * 60 * 60 * 1000,
      select: (data: XtreamSeriesItem[]) => ({
        category: cat,
        items: data.slice(0, limit),
      }),
    })),
  });

  return {
    rails: queries
      .filter((q) => q.data && q.data.items.length > 0)
      .map((q) => q.data!),
    isLoading: queries.some((q) => q.isLoading),
  };
}

/**
 * Fetch live channels for a language.
 */
export function useLanguageLiveChannels(language: string) {
  const { live, isReady } = useLanguageCategories(language);

  const queries = useQueries({
    queries: live.slice(0, 10).map((cat) => ({
      queryKey: ['live', 'streams', cat.id],
      queryFn: () => api<XtreamLiveStream[]>(`/live/streams/${cat.id}`),
      enabled: isReady,
      staleTime: 30 * 60 * 1000,
      select: (data: XtreamLiveStream[]) => ({
        category: cat,
        items: data,
      }),
    })),
  });

  return {
    rails: queries
      .filter((q) => q.data && q.data.items.length > 0)
      .map((q) => q.data!),
    isLoading: queries.some((q) => q.isLoading),
    allChannels: queries
      .filter((q) => q.data)
      .flatMap((q) => q.data!.items),
  };
}
