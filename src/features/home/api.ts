import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { api } from '@lib/api';
import { useVODCategories } from '@features/vod/api';
import { useSeriesCategories } from '@features/series/api';
import { groupCategoriesByLanguage } from '@shared/utils/categoryParser';
import type {
  XtreamVODStream,
  XtreamSeriesItem,
} from '@shared/types/api';

// Re-export from feature modules to avoid duplicate hook definitions
export { useWatchHistory } from '@features/history/api';
export { useFavorites } from '@features/favorites/api';

// --- Helpers ---

function parseAdded(val: string): number {
  const num = Number(val);
  if (!isNaN(num) && num > 1e9) return num; // Unix timestamp
  const parsed = Date.parse(val);
  return isNaN(parsed) ? 0 : parsed / 1000;
}

const ITEMS_PER_RAIL = 20;

// --- Language Movie Rail ---

export function useLanguageMovieRail(language: string) {
  const { data: vodCategories, isLoading: categoriesLoading } = useVODCategories();

  // Find ALL VOD category IDs for this language
  const categoryIds = useMemo(() => {
    if (!vodCategories) return [];
    const groups = groupCategoriesByLanguage(vodCategories, 'movies');
    const group = groups.find((g) => g.languageKey === language.toLowerCase());
    if (!group) return [];
    return group.movies.map((c) => c.id);
  }, [vodCategories, language]);

  // Fetch ALL categories for this language in parallel
  const queries = useQueries({
    queries: categoryIds.map((catId) => ({
      queryKey: ['vod', 'streams', catId],
      queryFn: () => api<XtreamVODStream[]>(`/vod/streams/${catId}`),
      enabled: !categoriesLoading && categoryIds.length > 0,
      staleTime: 2 * 60 * 60 * 1000,
    })),
  });

  const isLoading = categoriesLoading || queries.some((q) => q.isLoading);

  // Merge, dedupe by stream_id, sort by added DESC, take top N
  const items = useMemo<XtreamVODStream[]>(() => {
    const all: XtreamVODStream[] = [];
    for (const q of queries) {
      if (q.data) all.push(...q.data);
    }
    if (all.length === 0) return [];

    const seen = new Set<number>();
    const unique = all.filter((item) => {
      if (seen.has(item.stream_id)) return false;
      seen.add(item.stream_id);
      return true;
    });

    unique.sort((a, b) => parseAdded(b.added) - parseAdded(a.added));
    return unique.slice(0, ITEMS_PER_RAIL);
  }, [queries]);

  return { items, isLoading };
}

// --- Language Series Rail ---

export interface SeriesWithChannel extends XtreamSeriesItem {
  channelName?: string;
}

export function useLanguageSeriesRail(language: string) {
  const { data: seriesCategories, isLoading: categoriesLoading } = useSeriesCategories();

  // Find ALL series category IDs for this language, with channel name info
  const categoryDefs = useMemo(() => {
    if (!seriesCategories) return [];
    const groups = groupCategoriesByLanguage(seriesCategories, 'series');
    const group = groups.find((g) => g.languageKey === language.toLowerCase());
    if (!group) return [];
    return group.series.map((c) => ({
      id: c.id,
      // The sub-category name is the channel name (e.g., "STAR MAA", "ZEE TELUGU")
      channelName: c.name,
    }));
  }, [seriesCategories, language]);

  // Fetch ALL categories for this language in parallel
  const queries = useQueries({
    queries: categoryDefs.map((def) => ({
      queryKey: ['series', 'list', def.id],
      queryFn: () => api<XtreamSeriesItem[]>(`/series/list/${def.id}`),
      enabled: !categoriesLoading && categoryDefs.length > 0,
      staleTime: 2 * 60 * 60 * 1000,
    })),
  });

  const isLoading = categoriesLoading || queries.some((q) => q.isLoading);

  // Merge, dedupe by series_id, sort by last_modified DESC, take top N
  // Attach channelName from the category definition
  const items = useMemo<SeriesWithChannel[]>(() => {
    const all: SeriesWithChannel[] = [];
    for (let i = 0; i < categoryDefs.length; i++) {
      const data = queries[i]?.data;
      if (!data) continue;
      const channelName = categoryDefs[i]!.channelName;
      for (const item of data) {
        all.push({ ...item, channelName });
      }
    }
    if (all.length === 0) return [];

    const seen = new Set<number>();
    const unique = all.filter((item) => {
      if (seen.has(item.series_id)) return false;
      seen.add(item.series_id);
      return true;
    });

    unique.sort((a, b) => {
      const aDate = Number(a.last_modified) || 0;
      const bDate = Number(b.last_modified) || 0;
      return bDate - aDate;
    });

    return unique.slice(0, ITEMS_PER_RAIL);
  }, [queries, categoryDefs]);

  return { items, isLoading };
}
