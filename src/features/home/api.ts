import { useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { api } from '@lib/api';
import { useVODCategories } from '@features/vod/api';
import { groupCategoriesByLanguage } from '@shared/utils/categoryParser';
import type {
  XtreamLiveStream,
  XtreamVODStream,
  XtreamSeriesItem,
} from '@shared/types/api';

// Re-export from feature modules to avoid duplicate hook definitions
export { useWatchHistory } from '@features/history/api';
export { useFavorites } from '@features/favorites/api';

type RecentlyAddedType = 'live' | 'vod' | 'series';

type RecentlyAddedResult<T extends RecentlyAddedType> = T extends 'live'
  ? XtreamLiveStream[]
  : T extends 'vod'
    ? XtreamVODStream[]
    : XtreamSeriesItem[];

export function useRecentlyAdded<T extends RecentlyAddedType>(type: T) {
  return useQuery({
    queryKey: ['home', 'recentlyAdded', type],
    queryFn: async () => {
      const endpoint =
        type === 'live'
          ? '/live/streams/0'
          : type === 'vod'
            ? '/vod/streams/0'
            : '/series/list/0';
      const data = await api<RecentlyAddedResult<T>>(endpoint);
      // Sort by added/last_modified DESC and take top 20
      const sorted = [...data].sort((a, b) => {
        const aDate = 'added' in a ? a.added : (a as XtreamSeriesItem).last_modified;
        const bDate = 'added' in b ? b.added : (b as XtreamSeriesItem).last_modified;
        return Number(bDate) - Number(aDate);
      });
      return sorted.slice(0, 20) as RecentlyAddedResult<T>;
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

// --- Language-grouped latest movies ---

function parseAdded(val: string): number {
  const num = Number(val);
  if (!isNaN(num) && num > 1e9) return num; // Unix timestamp
  const parsed = Date.parse(val);
  return isNaN(parsed) ? 0 : parsed / 1000;
}

export interface LanguageMovieRail {
  language: string;
  languageKey: string;
  items: XtreamVODStream[];
}

const MAX_LANGUAGES = 6;
const CATEGORIES_PER_LANGUAGE = 2;
const ITEMS_PER_LANGUAGE = 15;

export function useLatestMoviesByLanguage() {
  const { data: vodCategories, isLoading: categoriesLoading } = useVODCategories();

  // Group VOD categories by language (priority-sorted)
  const languageGroups = useMemo(
    () => groupCategoriesByLanguage(vodCategories ?? [], 'movies').slice(0, MAX_LANGUAGES),
    [vodCategories],
  );

  // Build a flat list of queries: up to 2 category fetches per language
  const queryDefs = useMemo(() => {
    const defs: { languageKey: string; language: string; categoryId: string }[] = [];
    for (const group of languageGroups) {
      for (const cat of group.movies.slice(0, CATEGORIES_PER_LANGUAGE)) {
        defs.push({ languageKey: group.languageKey, language: group.language, categoryId: cat.id });
      }
    }
    return defs;
  }, [languageGroups]);

  const queries = useQueries({
    queries: queryDefs.map((def) => ({
      queryKey: ['vod', 'streams', def.categoryId],
      queryFn: () => api<XtreamVODStream[]>(`/vod/streams/${def.categoryId}`),
      enabled: !categoriesLoading && queryDefs.length > 0,
      staleTime: 2 * 60 * 60 * 1000,
    })),
  });

  const isLoading = categoriesLoading || queries.some((q) => q.isLoading);

  // Merge streams per language, sort by added DESC, take top N
  const rails = useMemo<LanguageMovieRail[]>(() => {
    if (queries.length === 0) return [];

    const byLanguage = new Map<string, { language: string; languageKey: string; items: XtreamVODStream[] }>();

    for (let i = 0; i < queryDefs.length; i++) {
      const def = queryDefs[i]!;
      const data = queries[i]?.data;
      if (!data) continue;

      if (!byLanguage.has(def.languageKey)) {
        byLanguage.set(def.languageKey, { language: def.language, languageKey: def.languageKey, items: [] });
      }
      byLanguage.get(def.languageKey)!.items.push(...data);
    }

    // Maintain priority order from languageGroups
    const result: LanguageMovieRail[] = [];
    for (const group of languageGroups) {
      const entry = byLanguage.get(group.languageKey);
      if (!entry || entry.items.length === 0) continue;

      // Sort by added DESC and dedupe by stream_id
      const seen = new Set<number>();
      const unique = entry.items.filter((item) => {
        if (seen.has(item.stream_id)) return false;
        seen.add(item.stream_id);
        return true;
      });

      unique.sort((a, b) => parseAdded(b.added) - parseAdded(a.added));
      result.push({
        language: entry.language,
        languageKey: entry.languageKey,
        items: unique.slice(0, ITEMS_PER_LANGUAGE),
      });
    }

    return result;
  }, [queries, queryDefs, languageGroups]);

  return { rails, isLoading };
}
