import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSearch } from "../api";
import { useDebounce } from "@shared/hooks/useDebounce";
import { SkeletonGrid } from "@shared/components/Skeleton";
import { EmptyState } from "@shared/components/EmptyState";
import { usePlayerStore } from "@lib/store";
import { PageTransition } from "@shared/components/PageTransition";
import {
  useSpatialFocusable,
  useSpatialContainer,
  FocusContext,
  setFocus,
} from "@shared/hooks/useSpatialNav";
import { useLiveCategories } from "@features/live/api";
import { useVODCategories } from "@features/vod/api";
import { useSeriesCategories } from "@features/series/api";
import {
  getDetectedLanguages,
  getLiveCategoriesForLanguage,
  getMovieCategoriesForLanguage,
  getSeriesCategoriesForLanguage,
} from "@shared/utils/categoryParser";
import { SearchResultsList } from "./SearchResultsList";

type TabType = "all" | "live" | "vod" | "series";

function FocusableTab({
  id,
  label,
  count,
  isActive,
  showCount,
  onSelect,
}: {
  id: string;
  label: string;
  count: number;
  isActive: boolean;
  showCount: boolean;
  onSelect: () => void;
}) {
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: id,
    onEnterPress: onSelect,
  });

  return (
    <button
      ref={ref}
      {...focusProps}
      onClick={onSelect}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-[background-color,border-color,color] min-h-[44px] ${
        isActive
          ? "text-teal border-b-2 border-teal bg-teal/5"
          : showFocusRing
            ? "text-text-primary bg-surface-raised ring-2 ring-teal/50"
            : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
      }`}
    >
      {label}
      {showCount && (
        <span
          className={`ml-1.5 text-xs ${isActive ? "text-teal/70" : "text-text-muted"}`}
        >
          ({count})
        </span>
      )}
    </button>
  );
}

function FocusableSearchInput({
  inputRef,
  query,
  setQuery,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  query: string;
  setQuery: (q: string) => void;
}) {
  const {
    ref: focusRef,
    showFocusRing,
    focusProps,
  } = useSpatialFocusable({
    focusKey: "search-input",
    onEnterPress: () => inputRef.current?.focus(),
  });

  return (
    <div role="search" aria-label="Search content">
      <div ref={focusRef} {...focusProps} className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
          aria-hidden="true"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          aria-label="Search live TV, movies, series"
          placeholder="Search live TV, movies, series..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`w-full pl-12 pr-4 py-3 bg-surface border rounded-xl text-text-primary placeholder:text-text-muted text-base focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal transition-[border-color,box-shadow] ${
            showFocusRing
              ? "border-teal ring-2 ring-teal/50"
              : "border-white/10"
          }`}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
            aria-label="Clear search"
          >
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function FocusablePill({
  id,
  label,
  isActive,
  onSelect,
}: {
  id: string;
  label: string;
  isActive: boolean;
  onSelect: () => void;
}) {
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: id,
    onEnterPress: onSelect,
  });

  return (
    <button
      ref={ref}
      {...focusProps}
      onClick={onSelect}
      className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-[background-color,border-color,color] min-h-[36px] ${
        isActive
          ? "bg-teal/15 text-teal border border-teal/30"
          : showFocusRing
            ? "bg-surface-raised text-text-primary border border-teal ring-2 ring-teal/50"
            : "bg-surface-raised text-text-muted border border-border-subtle hover:text-text-secondary hover:border-border"
      }`}
    >
      {label}
    </button>
  );
}

function SearchBarContainer({ children }: { children: React.ReactNode }) {
  const { ref, focusKey } = useSpatialContainer({ focusKey: "search-bar" });
  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref}>{children}</div>
    </FocusContext.Provider>
  );
}

function SearchTabsContainer({ children }: { children: React.ReactNode }) {
  const { ref, focusKey } = useSpatialContainer({ focusKey: "search-tabs" });
  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref}>{children}</div>
    </FocusContext.Provider>
  );
}

// ── SearchPage ────────────────────────────────────────────────────────────────

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [activeLang, setActiveLang] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const playStream = usePlayerStore((s) => s.playStream);

  const { ref: contentRef, focusKey: contentFocusKey } = useSpatialContainer({
    focusKey: "search-content",
    focusable: false,
  });
  const debouncedQuery = useDebounce(query, 300);
  const { data, isLoading, isFetching } = useSearch(debouncedQuery);

  const { data: liveCategories } = useLiveCategories();
  const { data: vodCategories } = useVODCategories();
  const { data: seriesCategories } = useSeriesCategories();
  const languages = getDetectedLanguages(
    liveCategories ?? [],
    vodCategories ?? [],
    seriesCategories ?? [],
  );

  useEffect(() => {
    inputRef.current?.focus();
    const timer = setTimeout(() => {
      try {
        setFocus("search-input");
      } catch {
        /* not mounted */
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const filteredData = useMemo(() => {
    if (!data || !activeLang) return data;
    const liveCatIds = new Set(
      getLiveCategoriesForLanguage(activeLang, liveCategories ?? []).map(
        (c) => c.id,
      ),
    );
    const vodCatIds = new Set(
      getMovieCategoriesForLanguage(activeLang, vodCategories ?? []).map(
        (c) => c.id,
      ),
    );
    const seriesCatIds = new Set(
      getSeriesCategoriesForLanguage(activeLang, seriesCategories ?? []).map(
        (c) => c.id,
      ),
    );
    return {
      live: data.live.filter((s) => liveCatIds.has(s.categoryId)),
      vod: data.vod.filter((m) => vodCatIds.has(m.categoryId)),
      series: data.series.filter((s) => seriesCatIds.has(s.categoryId)),
    };
  }, [data, activeLang, liveCategories, vodCategories, seriesCategories]);

  const counts = useMemo(
    () => ({
      live: filteredData?.live?.length ?? 0,
      vod: filteredData?.vod?.length ?? 0,
      series: filteredData?.series?.length ?? 0,
      all:
        (filteredData?.live?.length ?? 0) +
        (filteredData?.vod?.length ?? 0) +
        (filteredData?.series?.length ?? 0),
    }),
    [filteredData],
  );

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "live", label: "Live TV", count: counts.live },
    { key: "vod", label: "Movies", count: counts.vod },
    { key: "series", label: "Series", count: counts.series },
  ];

  const handleLiveClick = useCallback(
    (stream: import("@shared/types/api").XtreamLiveStream) => {
      playStream(stream.id, "live", stream.name);
      navigate({ to: "/live", search: { play: stream.id } });
    },
    [playStream, navigate],
  );

  const handleVodClick = useCallback(
    (vodId: string) => {
      navigate({ to: "/vod/$vodId", params: { vodId } });
    },
    [navigate],
  );

  const handleSeriesClick = useCallback(
    (seriesId: string) => {
      navigate({
        to: "/series/$seriesId",
        params: { seriesId },
      });
    },
    [navigate],
  );

  const handleTabSelect = useCallback((key: TabType) => setActiveTab(key), []);

  const hasQuery = debouncedQuery.length >= 2;
  const showLoading = hasQuery && (isLoading || isFetching);
  const showResults = hasQuery && filteredData && !isLoading;
  const showEmpty = showResults && counts.all === 0;
  const showPrompt = !hasQuery;

  return (
    <PageTransition>
      <FocusContext.Provider value={contentFocusKey}>
        <div ref={contentRef} className="space-y-6">
          <SearchBarContainer>
            <FocusableSearchInput
              inputRef={inputRef}
              query={query}
              setQuery={setQuery}
            />
            {hasQuery && languages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mt-6">
                <FocusablePill
                  id="search-lang-all"
                  label="All Languages"
                  isActive={activeLang === null}
                  onSelect={() => setActiveLang(null)}
                />
                {languages.map((lang) => (
                  <FocusablePill
                    id={`search-lang-${lang}`}
                    key={lang}
                    label={lang}
                    isActive={activeLang === lang}
                    onSelect={() =>
                      setActiveLang(activeLang === lang ? null : lang)
                    }
                  />
                ))}
              </div>
            )}
          </SearchBarContainer>

          {hasQuery && (
            <SearchTabsContainer>
              <div className="flex gap-1 border-b border-white/10 pb-px">
                {tabs.map((tab) => (
                  <FocusableTab
                    id={`search-tab-${tab.key}`}
                    key={tab.key}
                    label={tab.label}
                    count={tab.count}
                    isActive={activeTab === tab.key}
                    showCount={!!showResults}
                    onSelect={() => handleTabSelect(tab.key)}
                  />
                ))}
              </div>
            </SearchTabsContainer>
          )}

          {showLoading && (
            <div
              aria-busy="true"
              aria-label="Loading search results"
              className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3"
            >
              <SkeletonGrid count={12} />
            </div>
          )}
          {showPrompt && (
            <EmptyState
              title="Search StreamVault"
              message="Type at least 2 characters to search across live TV, movies, and series"
              icon="search"
            />
          )}
          {showEmpty && (
            <EmptyState
              title="No results found"
              message={`Nothing matched "${debouncedQuery}". Try a different search term.`}
              icon="search"
            />
          )}
          {showResults && !showEmpty && (
            <SearchResultsList
              filteredData={filteredData}
              activeTab={activeTab}
              onLiveClick={handleLiveClick}
              onVodClick={handleVodClick}
              onSeriesClick={handleSeriesClick}
            />
          )}
        </div>
      </FocusContext.Provider>
    </PageTransition>
  );
}
