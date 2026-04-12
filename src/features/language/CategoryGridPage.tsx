import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@lib/api";
import { STALE_TIMES } from "@lib/queryConfig";
import { useVODCategories } from "@features/vod/api";
import { useSeriesCategories } from "@features/series/api";
import { useLiveCategories } from "@features/live/api";
import { SortFilterBar } from "@features/vod/components/SortFilterBar";
import { PosterCard, LandscapeCard } from "@/design-system";
import { SkeletonGrid } from "@shared/components/Skeleton";
import { EmptyState } from "@shared/components/EmptyState";
import { PageTransition } from "@shared/components/PageTransition";
import {
  sortContent,
  SORT_OPTIONS,
  type SortOption,
} from "@shared/utils/sortContent";
import {
  filterContent,
  DEFAULT_FILTERS,
  type FilterState,
} from "@shared/utils/filterContent";
import { collectAllGenres } from "@shared/utils/parseGenres";
import { useDebounce } from "@shared/hooks/useDebounce";
import { usePlayerStore } from "@lib/store";
import type {
  XtreamVODStream,
  XtreamSeriesItem,
  XtreamLiveStream,
} from "@shared/types/api";

type ContentType = "vod" | "series" | "live" | null;

export function CategoryGridPage() {
  const { lang, categoryId } = useParams({ strict: false }) as {
    lang?: string;
    categoryId?: string;
  };
  const navigate = useNavigate();
  const playStream = usePlayerStore((s) => s.playStream);
  const language = lang ? lang.charAt(0).toUpperCase() + lang.slice(1) : "";

  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<SortOption>(SORT_OPTIONS[0]!);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const debouncedSearch = useDebounce(searchQuery);

  // Load all category lists to determine content type
  const { data: vodCategories } = useVODCategories();
  const { data: seriesCategories } = useSeriesCategories();
  const { data: liveCategories } = useLiveCategories();

  // Determine which content type this category belongs to
  const { contentType, categoryName } = useMemo<{
    contentType: ContentType;
    categoryName: string;
  }>(() => {
    if (!categoryId) return { contentType: null, categoryName: "" };

    const vodMatch = vodCategories?.find((c) => c.id === categoryId);
    if (vodMatch) return { contentType: "vod", categoryName: vodMatch.name };

    const seriesMatch = seriesCategories?.find((c) => c.id === categoryId);
    if (seriesMatch)
      return { contentType: "series", categoryName: seriesMatch.name };

    const liveMatch = liveCategories?.find((c) => c.id === categoryId);
    if (liveMatch) return { contentType: "live", categoryName: liveMatch.name };

    return { contentType: null, categoryName: "" };
  }, [categoryId, vodCategories, seriesCategories, liveCategories]);

  // Fetch streams based on content type
  const { data: vodStreams, isLoading: vodLoading } = useQuery({
    queryKey: ["vod", "streams", categoryId],
    queryFn: () => api<XtreamVODStream[]>(`/vod/streams/${categoryId}`),
    enabled: contentType === "vod" && !!categoryId,
    staleTime: STALE_TIMES.streams,
  });

  const { data: seriesList, isLoading: seriesLoading } = useQuery({
    queryKey: ["series", "list", categoryId],
    queryFn: () => api<XtreamSeriesItem[]>(`/series/list/${categoryId}`),
    enabled: contentType === "series" && !!categoryId,
    staleTime: STALE_TIMES.streams,
  });

  const { data: liveStreams, isLoading: liveLoading } = useQuery({
    queryKey: ["live", "streams", categoryId],
    queryFn: () => api<XtreamLiveStream[]>(`/live/streams/${categoryId}`),
    enabled: contentType === "live" && !!categoryId,
    staleTime: STALE_TIMES.liveStreams,
  });

  const isLoading = vodLoading || seriesLoading || liveLoading;

  // Collect genres (vod/series only)
  const genres = useMemo(() => {
    if (contentType === "vod" && vodStreams) {
      return collectAllGenres(
        vodStreams as unknown as Array<{ genre?: string }>,
      );
    }
    if (contentType === "series" && seriesList) {
      return collectAllGenres(
        seriesList as unknown as Array<{ genre?: string }>,
      );
    }
    return [];
  }, [contentType, vodStreams, seriesList]);

  // Process VOD streams
  const processedVod = useMemo(() => {
    if (contentType !== "vod" || !vodStreams) return [];
    let result = [...vodStreams];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }
    result = filterContent(
      result as unknown as Record<string, unknown>[],
      filters,
    ) as unknown as typeof result;
    result = sortContent(
      result as unknown as Record<string, unknown>[],
      sort.field,
      sort.direction,
    ) as unknown as typeof result;
    return result;
  }, [contentType, vodStreams, debouncedSearch, filters, sort]);

  // Process series
  const processedSeries = useMemo(() => {
    if (contentType !== "series" || !seriesList) return [];
    let result = [...seriesList];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }
    result = filterContent(
      result as unknown as Record<string, unknown>[],
      filters,
    ) as unknown as typeof result;
    result = sortContent(
      result as unknown as Record<string, unknown>[],
      sort.field,
      sort.direction,
    ) as unknown as typeof result;
    return result;
  }, [contentType, seriesList, debouncedSearch, filters, sort]);

  // Process live streams (search only, no sort/filter)
  const processedLive = useMemo(() => {
    if (contentType !== "live" || !liveStreams) return [];
    let result = [...liveStreams];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }
    return result;
  }, [contentType, liveStreams, debouncedSearch]);

  const totalItems =
    processedVod.length + processedSeries.length + processedLive.length;

  if (!lang || !categoryId) {
    return (
      <PageTransition>
        <div className="py-20 text-center">
          <p className="text-text-muted text-lg">Category not found</p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="py-6">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-sm text-text-muted mb-4"
        >
          <Link to="/" className="hover:text-text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            to={"/language/$lang" as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            params={{ lang } as any}
            className="hover:text-text-primary transition-colors capitalize"
          >
            {language}
          </Link>
          <span>/</span>
          <span className="text-text-primary">
            {categoryName || `Category ${categoryId}`}
          </span>
        </nav>

        <h1 className="font-display text-2xl font-bold text-text-primary mb-4">
          {categoryName || `Category ${categoryId}`}
        </h1>

        {/* Search */}
        <div className="flex items-center gap-4 mb-4">
          <input
            type="text"
            placeholder={`Search ${contentType === "live" ? "channels" : contentType === "series" ? "series" : "movies"}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-xs px-4 py-2 bg-surface-raised border border-border rounded-lg text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal-dim transition-[border-color,box-shadow]"
          />
        </div>

        {/* Sort/Filter bar (only for vod/series, not live) */}
        {contentType !== "live" && (
          <div className="relative z-10">
            <SortFilterBar
              sort={sort}
              onSortChange={setSort}
              filters={filters}
              onFiltersChange={setFilters}
              genres={genres}
            />
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
            <SkeletonGrid count={18} aspectRatio="poster" />
          </div>
        ) : totalItems === 0 ? (
          <EmptyState
            title="No content found"
            message="Try adjusting your search or filters"
            icon="content"
          />
        ) : (
          <div className="isolate grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
            {/* VOD items */}
            {processedVod.map((movie) => (
              <PosterCard
                key={movie.id}
                imageUrl={movie.icon || ""}
                title={movie.name}
                rating={
                  movie.rating && parseFloat(movie.rating) > 0
                    ? parseFloat(movie.rating).toFixed(1)
                    : undefined
                }
                onClick={() =>
                  navigate({
                    to: "/vod/$vodId",
                    params: { vodId: movie.id },
                  })
                }
              />
            ))}

            {/* Series items */}
            {processedSeries.map((series) => (
              <PosterCard
                key={series.id}
                imageUrl={series.icon || ""}
                title={series.name}
                year={
                  series.year
                    ? parseInt(series.year.slice(0, 4), 10)
                    : undefined
                }
                rating={
                  series.rating && parseFloat(series.rating) > 0
                    ? parseFloat(series.rating).toFixed(1)
                    : undefined
                }
                onClick={() =>
                  navigate({
                    to: "/series/$seriesId",
                    params: { seriesId: series.id },
                  })
                }
              />
            ))}

            {/* Live items */}
            {processedLive.map((channel) => (
              <LandscapeCard
                key={channel.id}
                imageUrl={channel.icon || ""}
                title={channel.name}
                onClick={() =>
                  playStream(channel.id, {
                    streamType: "live",
                    streamName: channel.name,
                  })
                }
              />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
