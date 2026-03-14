import { useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { api } from '@lib/api';
import type { XtreamCategory, XtreamSeriesItem, XtreamSeriesInfo } from '@shared/types/api';

// ── Channel-to-language mapping (fallback until category parser is rewritten) ──

const SERIES_CHANNEL_LANGUAGE: Record<string, string> = {
  // Telugu TV channels (ordered by popularity)
  '455': 'Telugu', // ZEE TELUGU
  '453': 'Telugu', // STAR MAA
  '469': 'Telugu', // AHA
  '493': 'Telugu', // ETV
  '494': 'Telugu', // GEMINI
  '552': 'Telugu', // SONY TELUGU
  // OTT Platforms (mixed-language — filtered by series name)
  '104': 'Multi', // ZEE5+ALT BALAJI
  '105': 'Multi', // SONY LIV
  '106': 'Multi', // NETFLIX
  '102': 'Multi', // DISNEY+ HOTSTAR
  '310': 'Multi', // JIO CINEMA
  // Hindi TV channels
  '442': 'Hindi', // COLORS HINDI
  '443': 'Hindi', // SONY (SET)
  '444': 'Hindi', // STAR PLUS
  '446': 'Hindi', // STAR BHARAT
  '445': 'Hindi', // ZEE TV
  '447': 'Hindi', // SAB
  '448': 'Hindi', // AND TV
  '491': 'Hindi', // MTV HINDI
  '596': 'Hindi', // SUN NEO HINDI
  '161': 'Hindi', // HINDI TV SERIES
  '276': 'Hindi', // INDIAN Reality Shows
  '200': 'Hindi', // BIGG BOSS OTT
};

const CHANNEL_NAMES: Record<string, string> = {
  '453': 'Star Maa',
  '455': 'Zee Telugu',
  '494': 'Gemini',
  '493': 'ETV',
  '552': 'Sony Telugu',
  '469': 'Aha',
  '442': 'Colors Hindi',
  '443': 'Sony SET',
  '444': 'Star Plus',
  '446': 'Star Bharat',
  '445': 'Zee TV',
  '447': 'SAB',
  '448': 'And TV',
  '491': 'MTV Hindi',
  '596': 'Sun Neo Hindi',
  '161': 'Hindi TV',
  '276': 'Reality Shows',
  '200': 'Bigg Boss OTT',
  '102': 'Disney+ Hotstar',
  '104': 'ZEE5',
  '105': 'Sony LIV',
  '106': 'Netflix',
  '310': 'Jio Cinema',
};

// ── Types ──

export interface SeriesWithChannel extends XtreamSeriesItem {
  channelName: string;
  channelId: string;
}

export interface ChannelInfo {
  id: string;
  name: string;
  count: number;
}

// ── Helpers ──

/** Get all category IDs for a given language (includes Multi/OTT categories). */
export function getChannelIdsForLanguage(language: string): string[] {
  const lang = language.toLowerCase();
  return Object.entries(SERIES_CHANNEL_LANGUAGE)
    .filter(([, l]) => {
      const mapped = l.toLowerCase();
      return mapped === lang || mapped === 'multi';
    })
    .map(([id]) => id);
}

/** Get all supported languages. */
export function getSupportedLanguages(): string[] {
  const langs = new Set(Object.values(SERIES_CHANNEL_LANGUAGE));
  return ['Telugu', 'Hindi'].filter((l) => langs.has(l));
}

/** Get channel name for a category ID. */
export function getChannelName(categoryId: string): string {
  return CHANNEL_NAMES[categoryId] || `Channel ${categoryId}`;
}

/** Get language for a category ID, or null if unknown. */
export function getChannelLanguage(categoryId: string): string | null {
  return SERIES_CHANNEL_LANGUAGE[categoryId] || null;
}

/** Strip trailing language tag like "(Telugu)" from series name for cleaner display. */
function stripLanguageTag(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

// ── Hooks ──

/** Fetch raw series categories from API. */
export function useSeriesCategories() {
  return useQuery({
    queryKey: ['series', 'categories'],
    queryFn: () => api<XtreamCategory[]>('/series/categories'),
    staleTime: 6 * 60 * 60 * 1000,
  });
}

/** Fetch a single category's series list. */
export function useSeriesList(categoryId: string) {
  return useQuery({
    queryKey: ['series', 'list', categoryId],
    queryFn: () => api<XtreamSeriesItem[]>(`/series/list/${categoryId}`),
    enabled: !!categoryId,
    staleTime: 2 * 60 * 60 * 1000,
  });
}

/** Fetch series info/detail for a given series ID. */
export function useSeriesInfo(seriesId: string) {
  return useQuery({
    queryKey: ['series', 'info', seriesId],
    queryFn: () => api<XtreamSeriesInfo>(`/series/info/${seriesId}`),
    enabled: !!seriesId,
    staleTime: 2 * 60 * 60 * 1000,
  });
}

/**
 * Fetch ALL series from all channels for a given language in parallel.
 * Merges results and enriches each item with channelName / channelId.
 * If language is 'all', fetches every known channel.
 */
export function useSeriesByLanguage(language: string) {
  const channelIds =
    language.toLowerCase() === 'all'
      ? Object.keys(SERIES_CHANNEL_LANGUAGE)
      : getChannelIdsForLanguage(language);

  const queries = useQueries({
    queries: channelIds.map((catId) => ({
      queryKey: ['series', 'list', catId],
      queryFn: () => api<XtreamSeriesItem[]>(`/series/list/${catId}`),
      staleTime: 2 * 60 * 60 * 1000,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const isFetching = queries.some((q) => q.isFetching);

  const allSeries = useMemo<SeriesWithChannel[]>(() => {
    const result: SeriesWithChannel[] = [];
    const seen = new Set<number>();
    const seenNames = new Set<string>();
    const isAll = language.toLowerCase() === 'all';

    queries.forEach((q, idx) => {
      if (!q.data) return;
      const catId = channelIds[idx]!;
      const catLang = SERIES_CHANNEL_LANGUAGE[catId];
      const isMulti = catLang === 'Multi';

      for (const item of q.data) {
        // Deduplicate by series_id (some series appear in multiple categories)
        if (seen.has(item.series_id)) continue;

        // For Multi/OTT categories, only include series matching the requested language
        if (isMulti && !isAll) {
          if (!item.name.toLowerCase().includes(language.toLowerCase())) continue;
        }

        // Name-based dedup: same series listed on multiple OTT platforms with different IDs
        const normalizedName = item.name.replace(/\s*\([^)]*\)\s*$/g, '').trim().toLowerCase();
        if (seenNames.has(normalizedName)) continue;

        seen.add(item.series_id);
        seenNames.add(normalizedName);
        result.push({
          ...item,
          name: isMulti ? stripLanguageTag(item.name) : item.name,
          channelName: getChannelName(catId),
          channelId: catId,
        });
      }
    });

    return result;
  }, [queries, channelIds, language]);

  // Compute channel list with counts
  const channels = useMemo<ChannelInfo[]>(() => {
    const countMap = new Map<string, number>();
    for (const s of allSeries) {
      countMap.set(s.channelId, (countMap.get(s.channelId) || 0) + 1);
    }
    return channelIds
      .filter((id) => countMap.has(id))
      .map((id) => ({
        id,
        name: getChannelName(id),
        count: countMap.get(id) || 0,
      }));
  }, [allSeries, channelIds]);

  return { allSeries, channels, isLoading, isFetching };
}
