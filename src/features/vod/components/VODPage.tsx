import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useVODCategories, useVODStreams } from '../api';
import { SortFilterBar } from './SortFilterBar';
import { ContentCard } from '@shared/components/ContentCard';
import { CategoryGrid } from '@shared/components/CategoryGrid';
import { SkeletonGrid } from '@shared/components/Skeleton';
import { EmptyState } from '@shared/components/EmptyState';
import { Badge } from '@shared/components/Badge';
import { sortContent, SORT_OPTIONS, type SortOption } from '@shared/utils/sortContent';
import { filterContent, DEFAULT_FILTERS, type FilterState } from '@shared/utils/filterContent';
import { collectAllGenres, parseGenres } from '@shared/utils/parseGenres';
import { useDebounce } from '@shared/hooks/useDebounce';
import { PageTransition } from '@shared/components/PageTransition';
import { useSpatialFocusable, useSpatialContainer, FocusContext, setFocus } from '@shared/hooks/useSpatialNav';

function FocusableSearchInput({ searchQuery, setSearchQuery }: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { ref: focusRef, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: 'vod-search-input',
    onEnterPress: () => inputRef.current?.focus(),
  });

  // When the wrapper div has DOM focus (via shouldFocusDOMNode) and user types,
  // forward keystrokes to the actual input element
  const handleWrapperKeyDown = (e: React.KeyboardEvent) => {
    if (document.activeElement === inputRef.current) return;
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      inputRef.current?.focus();
      setSearchQuery(searchQuery + e.key);
      e.preventDefault();
    } else if (e.key === 'Backspace' && searchQuery) {
      inputRef.current?.focus();
      setSearchQuery(searchQuery.slice(0, -1));
      e.preventDefault();
    }
  };

  return (
    <div ref={focusRef} {...focusProps} onKeyDown={handleWrapperKeyDown} className="flex items-center gap-4 mb-4">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search movies..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={`w-full max-w-xs px-4 py-2 bg-surface-raised border rounded-lg text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal-dim transition-all ${
          showFocusRing ? 'border-teal ring-2 ring-teal/50' : 'border-border'
        }`}
      />
    </div>
  );
}

export function VODPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<SortOption>(SORT_OPTIONS[0]!);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const debouncedSearch = useDebounce(searchQuery);

  const { ref: contentRef, focusKey: contentFocusKey } = useSpatialContainer({
    focusKey: 'vod-content',
    focusable: false,
  });

  // Auto-focus search input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try { setFocus('vod-search-input'); } catch { /* not mounted */ }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const { data: categories, isLoading: catLoading } = useVODCategories();
  const firstCatId = categories?.[0]?.category_id || '';
  const activeCatId = selectedCategory || firstCatId;

  const { data: streams, isLoading: streamsLoading } = useVODStreams(activeCatId);

  const genres = useMemo(() => {
    if (!streams) return [];
    return collectAllGenres(streams as unknown as Array<{ genre?: string }>);
  }, [streams]);

  const processedStreams = useMemo(() => {
    if (!streams) return [];
    let result = [...streams];

    // Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }

    // Filter (need to cast for generic filter function)
    result = filterContent(result as unknown as Record<string, unknown>[], filters) as unknown as typeof result;

    // Sort
    result = sortContent(result as unknown as Record<string, unknown>[], sort.field, sort.direction) as unknown as typeof result;

    return result;
  }, [streams, debouncedSearch, filters, sort]);

  return (
    <PageTransition>
    <FocusContext.Provider value={contentFocusKey}>
    <div ref={contentRef}>
      <h1 className="font-display text-2xl font-bold text-text-primary mb-4">Movies</h1>

      {/* Categories */}
      {catLoading ? (
        <div className="flex gap-2 mb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-surface-raised rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="mb-4">
          <CategoryGrid
            categories={categories || []}
            selectedId={selectedCategory || null}
            onSelect={setSelectedCategory}
          />
        </div>
      )}

      {/* Search + Sort/Filter */}
      <FocusableSearchInput searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <SortFilterBar
        sort={sort}
        onSortChange={setSort}
        filters={filters}
        onFiltersChange={setFilters}
        genres={genres}
      />

      {/* Results */}
      {streamsLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
          <SkeletonGrid count={12} aspectRatio="poster" />
        </div>
      ) : processedStreams.length === 0 ? (
        <EmptyState title="No movies found" message="Try adjusting your filters" icon="content" />
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
          {processedStreams.map((movie) => (
            <ContentCard
              key={movie.stream_id}
              image={movie.stream_icon}
              title={movie.name}
              subtitle={parseGenres(movie.container_extension).length > 0 ? movie.container_extension.toUpperCase() : undefined}
              badge={
                movie.rating_5based > 0 ? (
                  <Badge variant="warning">{movie.rating_5based.toFixed(1)} ★</Badge>
                ) : undefined
              }
              onClick={() => navigate({ to: '/vod/$vodId', params: { vodId: String(movie.stream_id) } })}
            />
          ))}
        </div>
      )}
    </div>
    </FocusContext.Provider>
    </PageTransition>
  );
}
