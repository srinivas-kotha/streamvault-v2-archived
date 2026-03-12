import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useSeriesCategories, useSeriesList } from '../api';
import { ContentCard } from '@shared/components/ContentCard';
import { CategoryGrid } from '@shared/components/CategoryGrid';
import { SkeletonGrid } from '@shared/components/Skeleton';
import { EmptyState } from '@shared/components/EmptyState';
import { Badge } from '@shared/components/Badge';
import { SortFilterBar } from '@features/vod/components/SortFilterBar';
import { sortContent, SORT_OPTIONS, type SortOption } from '@shared/utils/sortContent';
import { filterContent, DEFAULT_FILTERS, type FilterState } from '@shared/utils/filterContent';
import { collectAllGenres } from '@shared/utils/parseGenres';
import { useDebounce } from '@shared/hooks/useDebounce';
import { PageTransition } from '@shared/components/PageTransition';

export function SeriesPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<SortOption>(SORT_OPTIONS[0]!);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const debouncedSearch = useDebounce(searchQuery);

  const { data: categories, isLoading: catLoading } = useSeriesCategories();
  const firstCatId = categories?.[0]?.category_id || '';
  const activeCatId = selectedCategory || firstCatId;

  const { data: seriesList, isLoading: listLoading } = useSeriesList(activeCatId);

  const genres = useMemo(() => {
    if (!seriesList) return [];
    return collectAllGenres(seriesList as unknown as Array<{ genre?: string }>);
  }, [seriesList]);

  const processedSeries = useMemo(() => {
    if (!seriesList) return [];
    let result = [...seriesList];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }
    result = filterContent(result as unknown as Record<string, unknown>[], filters) as unknown as typeof result;
    result = sortContent(result as unknown as Record<string, unknown>[], sort.field, sort.direction) as unknown as typeof result;
    return result;
  }, [seriesList, debouncedSearch, filters, sort]);

  return (
    <PageTransition>
    <div>
      <h1 className="font-display text-2xl font-bold text-text-primary mb-4">Series</h1>

      {catLoading ? (
        <div className="flex gap-2 mb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-surface-raised rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !categories?.length ? (
        <EmptyState title="No series available" message="Your provider doesn't include series content" icon="content" />
      ) : (
        <>
          <div className="mb-4">
            <CategoryGrid categories={categories || []} selectedId={selectedCategory || null} onSelect={setSelectedCategory} />
          </div>

          <div className="flex items-center gap-4 mb-4">
            <input
              type="text"
              placeholder="Search series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-xs px-4 py-2 bg-surface-raised border border-border rounded-lg text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal-dim transition-all"
            />
          </div>

          <SortFilterBar sort={sort} onSortChange={setSort} filters={filters} onFiltersChange={setFilters} genres={genres} />

          {listLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              <SkeletonGrid count={12} aspectRatio="poster" />
            </div>
          ) : processedSeries.length === 0 ? (
            <EmptyState title="No series found" message="Try a different category" icon="content" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {processedSeries.map((series) => (
                <ContentCard
                  key={series.series_id}
                  image={series.cover}
                  title={series.name}
                  subtitle={series.releaseDate ? series.releaseDate.slice(0, 4) : undefined}
                  badge={series.rating_5based > 0 ? <Badge variant="warning">{series.rating_5based.toFixed(1)} ★</Badge> : undefined}
                  onClick={() => navigate({ to: '/series/$seriesId', params: { seriesId: String(series.series_id) } })}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
    </PageTransition>
  );
}
