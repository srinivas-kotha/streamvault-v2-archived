import { useState, useMemo, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useLanguageMovieRails, useLanguageAllMovies } from "../api";
import { ContentRail } from "@shared/components/ContentRail";
import { FocusableCard, PosterCard } from "@/design-system";
import { SkeletonGrid } from "@shared/components/Skeleton";
import { EmptyState } from "@shared/components/EmptyState";
import { useDebounce } from "@shared/hooks/useDebounce";
import { useSpatialFocusable } from "@shared/hooks/useSpatialNav";
import { isNewContent } from "@shared/utils/isNewContent";
import type { XtreamVODStream } from "@shared/types/api";

type SortKey = "name_asc" | "name_desc" | "recent" | "rating";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "name_asc", label: "A-Z" },
  { key: "name_desc", label: "Z-A" },
  { key: "recent", label: "Recently Added" },
  { key: "rating", label: "Rating" },
];

function sortMovies(
  items: XtreamVODStream[],
  sortKey: SortKey,
): XtreamVODStream[] {
  const sorted = [...items];
  switch (sortKey) {
    case "name_asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "name_desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case "recent":
      return sorted.sort(
        (a, b) => parseInt(b.added || "0", 10) - parseInt(a.added || "0", 10),
      );
    case "rating":
      return sorted.sort(
        (a, b) => parseFloat(b.rating || "0") - parseFloat(a.rating || "0"),
      );
    default:
      return sorted;
  }
}

function FocusableChip({
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
      className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-[background-color,border-color,color] min-h-[36px] whitespace-nowrap ${
        isActive
          ? "bg-teal/15 text-teal border border-teal/30"
          : showFocusRing
            ? "bg-surface-raised text-text-primary border border-teal/50 ring-2 ring-teal/40"
            : "bg-surface-raised text-text-muted border border-border-subtle hover:text-text-secondary hover:border-border"
      }`}
    >
      {label}
    </button>
  );
}

function FocusableSortButton({
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
      className={`px-3 py-2 rounded-lg text-xs font-medium transition-[background-color,border-color,color] min-h-[36px] ${
        isActive
          ? "bg-teal/15 text-teal"
          : showFocusRing
            ? "text-text-primary ring-2 ring-teal/40"
            : "text-text-muted hover:text-text-secondary"
      }`}
    >
      {label}
    </button>
  );
}

function FocusableSearchInput({
  value,
  onChange,
  placeholder,
  focusKey,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  focusKey: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey,
    onEnterPress: () => {
      // Delay to ensure norigin finishes processing before we steal DOM focus
      setTimeout(() => inputRef.current?.focus(), 0);
    },
  });

  return (
    <div
      ref={ref}
      {...focusProps}
      className={`relative flex-1 min-w-[200px] max-w-sm ${showFocusRing ? "ring-2 ring-teal/50 rounded-lg" : ""}`}
    >
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
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
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // Escape blurs back to spatial nav
          if (e.key === "Escape") {
            inputRef.current?.blur();
          }
        }}
        className="w-full pl-10 pr-4 py-2.5 bg-surface-raised border border-border rounded-lg text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal-dim transition-[border-color,box-shadow]"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
        >
          <svg
            className="w-4 h-4"
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
  );
}

function FocusableClearButton({
  id,
  onSelect,
}: {
  id: string;
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
      className={`px-3 py-2 rounded-lg text-xs font-medium transition-[background-color,border-color,color] min-h-[36px] border border-border-subtle hover:border-border ${
        showFocusRing
          ? "text-text-primary ring-2 ring-teal/40"
          : "text-text-muted hover:text-text-primary"
      }`}
    >
      Clear filters
    </button>
  );
}

interface MoviesTabContentProps {
  language: string;
  lang: string;
}

export function MoviesTabContent({ language, lang }: MoviesTabContentProps) {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name_asc");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const hasActiveFilters =
    !!debouncedSearch || activeCategory !== null || sortKey !== "name_asc";

  const { rails: movieRails, isLoading: railsLoading } =
    useLanguageMovieRails(language);
  // Only fetch all movies when filters are active — avoids 10 parallel queries on initial mount
  const { allMovies, isLoading: allLoading } = useLanguageAllMovies(
    language,
    hasActiveFilters,
  );

  // Latest movies rail: top 30 by added date (derived from rails data)
  const latestMovies = useMemo(() => {
    const source =
      hasActiveFilters && allMovies.length
        ? allMovies
        : movieRails.flatMap((r) => r.items);
    if (!source.length) return [];
    return [...source]
      .sort(
        (a, b) => parseInt(b.added || "0", 10) - parseInt(a.added || "0", 10),
      )
      .slice(0, 30);
  }, [hasActiveFilters, allMovies, movieRails]);

  // Category chips from rails data
  const categoryChips = useMemo(
    () =>
      movieRails.map((r) => ({
        id: r.category.id,
        name: r.category.name || r.category.originalName,
        count: r.items.length,
      })),
    [movieRails],
  );

  const totalCount = useMemo(
    () => categoryChips.reduce((sum, c) => sum + c.count, 0),
    [categoryChips],
  );

  // Grid mode: filter + sort all movies
  const processedMovies = useMemo(() => {
    let result = allMovies;

    if (activeCategory) {
      result = result.filter((m) => m.categoryId === activeCategory);
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(q));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result = sortMovies(result, sortKey) as any;

    return result;
  }, [allMovies, activeCategory, debouncedSearch, sortKey]);

  const clearFilters = () => {
    setSearchQuery("");
    setActiveCategory(null);
    setSortKey("name_asc");
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="space-y-4">
        {/* Category Chips */}
        {categoryChips.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <FocusableChip
              id="movies-chip-all"
              label={`All (${totalCount})`}
              isActive={activeCategory === null}
              onSelect={() => setActiveCategory(null)}
            />
            {categoryChips.map((chip) => (
              <FocusableChip
                key={chip.id}
                id={`movies-chip-${chip.id}`}
                label={`${chip.name} (${chip.count})`}
                isActive={activeCategory === chip.id}
                onSelect={() =>
                  setActiveCategory(chip.id === activeCategory ? null : chip.id)
                }
              />
            ))}
          </div>
        )}

        {/* Search + Sort Row */}
        <div className="flex items-center gap-3 flex-wrap">
          <FocusableSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search movies..."
            focusKey="movies-search"
          />

          <div className="flex gap-1.5">
            {SORT_OPTIONS.map((opt) => (
              <FocusableSortButton
                key={opt.key}
                id={`movies-sort-${opt.key}`}
                label={opt.label}
                isActive={sortKey === opt.key}
                onSelect={() => setSortKey(opt.key)}
              />
            ))}
          </div>

          {hasActiveFilters && (
            <FocusableClearButton
              id="movies-clear-filters"
              onSelect={clearFilters}
            />
          )}
        </div>
      </div>

      {/* Content */}
      {!hasActiveFilters ? (
        /* Rails mode (no filters active) */
        <div className="space-y-8">
          {railsLoading && (
            <ContentRail title="Loading..." isLoading={true} flat>
              <div />
            </ContentRail>
          )}
          {/* Latest Movies rail */}
          {latestMovies.length > 0 && !railsLoading && (
            <ContentRail title="Latest Movies" flat>
              {latestMovies.map((item) => (
                <FocusableCard
                  key={item.id}
                  focusKey={`vod-latest-${item.id}`}
                  onEnterPress={() =>
                    navigate({ to: "/vod/$vodId", params: { vodId: item.id } })
                  }
                >
                  <PosterCard
                    imageUrl={item.icon || ""}
                    title={item.name}
                    rating={item.rating || undefined}
                    isNew={isNewContent(item.added ?? undefined)}
                    onClick={() =>
                      navigate({
                        to: "/vod/$vodId",
                        params: { vodId: item.id },
                      })
                    }
                  />
                </FocusableCard>
              ))}
            </ContentRail>
          )}
          {movieRails.map((rail) => (
            <ContentRail
              key={rail.category.id}
              title={rail.category.name || rail.category.originalName}
              seeAllTo={`/language/${lang}/category/${rail.category.id}`}
              flat
            >
              {rail.items.map((item) => (
                <FocusableCard
                  key={item.id}
                  focusKey={`vod-${item.id}`}
                  onEnterPress={() =>
                    navigate({ to: "/vod/$vodId", params: { vodId: item.id } })
                  }
                >
                  <PosterCard
                    imageUrl={item.icon || ""}
                    title={item.name}
                    rating={item.rating || undefined}
                    isNew={isNewContent(item.added ?? undefined)}
                    onClick={() =>
                      navigate({
                        to: "/vod/$vodId",
                        params: { vodId: item.id },
                      })
                    }
                  />
                </FocusableCard>
              ))}
            </ContentRail>
          ))}
          {!railsLoading && movieRails.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-text-muted text-lg">
                No {language} movies found
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Grid mode (filters active) */
        <div>
          {allLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
              <SkeletonGrid count={18} aspectRatio="poster" />
            </div>
          ) : processedMovies.length === 0 ? (
            <EmptyState
              title={
                debouncedSearch ? "No matching movies" : "No movies available"
              }
              message={
                debouncedSearch
                  ? `No results for "${debouncedSearch}". Try a different search.`
                  : `No ${language} movies found in this category.`
              }
              icon="content"
            />
          ) : (
            <>
              {/* Results count */}
              {debouncedSearch && (
                <p className="text-text-muted text-xs mb-3">
                  {processedMovies.length} result
                  {processedMovies.length !== 1 ? "s" : ""}
                </p>
              )}

              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                {processedMovies.map((movie) => (
                  <PosterCard
                    key={movie.id}
                    imageUrl={movie.icon || ""}
                    title={movie.name}
                    rating={movie.rating || undefined}
                    onClick={() =>
                      navigate({
                        to: "/vod/$vodId",
                        params: { vodId: movie.id },
                      })
                    }
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
