import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useLanguageMovieRails, useLanguageAllMovies } from '../api';
import { ContentRail } from '@shared/components/ContentRail';
import { FocusableCard } from '@shared/components/FocusableCard';
import { ContentCard } from '@shared/components/ContentCard';
import { SkeletonGrid } from '@shared/components/Skeleton';
import { EmptyState } from '@shared/components/EmptyState';
import { useDebounce } from '@shared/hooks/useDebounce';
import type { XtreamVODStream } from '@shared/types/api';

type SortKey = 'name_asc' | 'name_desc' | 'recent' | 'rating';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'name_asc', label: 'A-Z' },
  { key: 'name_desc', label: 'Z-A' },
  { key: 'recent', label: 'Recently Added' },
  { key: 'rating', label: 'Rating' },
];

type MovieWithCategory = XtreamVODStream & { category_id: string; category_name: string };

function sortMovies(items: MovieWithCategory[], sortKey: SortKey): MovieWithCategory[] {
  const sorted = [...items];
  switch (sortKey) {
    case 'name_asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name_desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'recent':
      return sorted.sort(
        (a, b) => parseInt(b.added || '0', 10) - parseInt(a.added || '0', 10),
      );
    case 'rating':
      return sorted.sort(
        (a, b) => parseFloat(b.rating || '0') - parseFloat(a.rating || '0'),
      );
    default:
      return sorted;
  }
}

interface MoviesTabContentProps {
  language: string;
  lang: string;
}

export function MoviesTabContent({ language, lang }: MoviesTabContentProps) {
  const navigate = useNavigate();
  const { rails: movieRails, isLoading: railsLoading } = useLanguageMovieRails(language);
  const { allMovies, isLoading: allLoading } = useLanguageAllMovies(language);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('name_asc');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const hasActiveFilters = !!debouncedSearch || activeCategory !== null || sortKey !== 'name_asc';

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
      result = result.filter((m) => m.category_id === activeCategory);
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(q));
    }

    result = sortMovies(result, sortKey);

    return result;
  }, [allMovies, activeCategory, debouncedSearch, sortKey]);

  const clearFilters = () => {
    setSearchQuery('');
    setActiveCategory(null);
    setSortKey('name_asc');
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="px-6 lg:px-10 space-y-4">
        {/* Category Chips */}
        {categoryChips.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all min-h-[36px] ${
                activeCategory === null
                  ? 'bg-teal/15 text-teal border border-teal/30'
                  : 'bg-surface-raised text-text-muted border border-border-subtle hover:text-text-secondary hover:border-border'
              }`}
            >
              All ({totalCount})
            </button>
            {categoryChips.map((chip) => (
              <button
                key={chip.id}
                onClick={() =>
                  setActiveCategory(chip.id === activeCategory ? null : chip.id)
                }
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all min-h-[36px] whitespace-nowrap ${
                  activeCategory === chip.id
                    ? 'bg-teal/15 text-teal border border-teal/30'
                    : 'bg-surface-raised text-text-muted border border-border-subtle hover:text-text-secondary hover:border-border'
                }`}
              >
                {chip.name} ({chip.count})
              </button>
            ))}
          </div>
        )}

        {/* Search + Sort Row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
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
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-raised border border-border rounded-lg text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal-dim transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
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

          <div className="flex gap-1.5">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSortKey(opt.key)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all min-h-[36px] ${
                  sortKey === opt.key
                    ? 'bg-teal/15 text-teal'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 rounded-lg text-xs font-medium text-text-muted hover:text-text-primary transition-all min-h-[36px] border border-border-subtle hover:border-border"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!hasActiveFilters ? (
        /* Rails mode (no filters active) */
        <div className="space-y-8">
          {railsLoading && (
            <ContentRail title="Loading..." isLoading={true}>
              <div />
            </ContentRail>
          )}
          {movieRails.map((rail) => (
            <ContentRail
              key={rail.category.id}
              title={rail.category.name || rail.category.originalName}
              seeAllTo={`/language/${lang}/category/${rail.category.id}`}
            >
              {rail.items.map((item) => (
                <FocusableCard
                  key={item.stream_id}
                  image={item.stream_icon}
                  title={item.name}
                  subtitle={item.rating ? `⭐ ${item.rating}` : undefined}
                  aspectRatio="poster"
                  onClick={() =>
                    navigate({
                      to: '/vod/$vodId',
                      params: { vodId: String(item.stream_id) },
                    })
                  }
                />
              ))}
            </ContentRail>
          ))}
          {!railsLoading && movieRails.length === 0 && (
            <div className="px-6 lg:px-10 py-12 text-center">
              <p className="text-text-muted text-lg">No {language} movies found</p>
            </div>
          )}
        </div>
      ) : (
        /* Grid mode (filters active) */
        <div className="px-6 lg:px-10">
          {allLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              <SkeletonGrid count={18} aspectRatio="poster" />
            </div>
          ) : processedMovies.length === 0 ? (
            <EmptyState
              title={debouncedSearch ? 'No matching movies' : 'No movies available'}
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
                  {processedMovies.length !== 1 ? 's' : ''}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {processedMovies.map((movie) => (
                  <ContentCard
                    key={movie.stream_id}
                    image={movie.stream_icon}
                    title={movie.name}
                    subtitle={movie.rating ? `⭐ ${movie.rating}` : undefined}
                    onClick={() =>
                      navigate({
                        to: '/vod/$vodId',
                        params: { vodId: String(movie.stream_id) },
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
