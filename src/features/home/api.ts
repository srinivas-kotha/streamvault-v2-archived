import { useMemo } from "react";
import { api } from "@lib/api";
import { STALE_TIMES } from "@lib/queryConfig";
import { useVODCategories } from "@features/vod/api";
import { useSeriesCategories } from "@features/series/api";
import { groupCategoriesByLanguage } from "@shared/utils/categoryParser";
import { useContentRailData } from "@shared/hooks/useContentRailData";
import type { XtreamVODStream, XtreamSeriesItem } from "@shared/types/api";

// Re-export from feature modules to avoid duplicate hook definitions
export { useWatchHistory } from "@features/history/api";
export { useFavorites } from "@features/favorites/api";

const ITEMS_PER_RAIL = 20;

// --- Language Movie Rail ---

export function useLanguageMovieRail(language: string) {
  const { data: vodCategories, isLoading: categoriesLoading } =
    useVODCategories();

  // Find ALL VOD category IDs for this language
  const categoryIds = useMemo(() => {
    if (!vodCategories) return [];
    const groups = groupCategoriesByLanguage(vodCategories, "movies");
    const group = groups.find((g) => g.languageKey === language.toLowerCase());
    if (!group) return [];
    return group.movies.map((c) => c.id);
  }, [vodCategories, language]);

  const { items, isLoading: railLoading } = useContentRailData<XtreamVODStream>(
    {
      categoryIds,
      fetchFn: (catId) => api<XtreamVODStream[]>(`/vod/streams/${catId}`),
      queryKeyPrefix: ["vod", "streams"],
      dedupeKey: "id",
      sortBy: "added",
      limit: ITEMS_PER_RAIL,
      staleTime: STALE_TIMES.streams,
      enabled: !categoriesLoading && categoryIds.length > 0,
    },
  );

  return { items, isLoading: categoriesLoading || railLoading };
}

// --- Language Series Rail ---

export interface SeriesWithChannel extends XtreamSeriesItem {
  channelName?: string;
}

export function useLanguageSeriesRail(language: string) {
  const { data: seriesCategories, isLoading: categoriesLoading } =
    useSeriesCategories();

  // Find ALL series category IDs for this language, with channel name info
  const categoryDefs = useMemo(() => {
    if (!seriesCategories) return [];
    const groups = groupCategoriesByLanguage(seriesCategories, "series");
    const group = groups.find((g) => g.languageKey === language.toLowerCase());
    if (!group) return [];
    return group.series.map((c) => ({
      id: c.id,
      // The sub-category name is the channel name (e.g., "STAR MAA", "ZEE TELUGU")
      channelName: c.name,
    }));
  }, [seriesCategories, language]);

  const categoryIds = useMemo(
    () => categoryDefs.map((d) => d.id),
    [categoryDefs],
  );

  const { items: rawItems, isLoading: railLoading } =
    useContentRailData<XtreamSeriesItem>({
      categoryIds,
      fetchFn: (catId) => api<XtreamSeriesItem[]>(`/series/list/${catId}`),
      queryKeyPrefix: ["series", "list"],
      dedupeKey: "id",
      sortBy: "added", // Uses last_modified via the fallback in getSortValue
      limit: ITEMS_PER_RAIL,
      staleTime: STALE_TIMES.streams,
      enabled: !categoriesLoading && categoryDefs.length > 0,
    });

  // Enrich items with channelName from the category definitions
  const items = useMemo<SeriesWithChannel[]>(() => {
    // Build a lookup from category id to channel name
    const channelMap = new Map<number | string, string>();
    for (const def of categoryDefs) {
      channelMap.set(def.id, def.channelName);
    }

    return rawItems.map((item) => ({
      ...item,
      channelName: channelMap.get(item.categoryId),
    }));
  }, [rawItems, categoryDefs]);

  return { items, isLoading: categoriesLoading || railLoading };
}
