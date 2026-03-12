import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useSeriesByLanguage, getSupportedLanguages, type SeriesWithChannel } from '../api';
import { ContentCard } from '@shared/components/ContentCard';
import { SkeletonGrid } from '@shared/components/Skeleton';
import { EmptyState } from '@shared/components/EmptyState';
import { Badge } from '@shared/components/Badge';
import { useDebounce } from '@shared/hooks/useDebounce';
import { PageTransition } from '@shared/components/PageTransition';

type SortKey = 'name_asc' | 'name_desc' | 'recent' | 'rating';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'name_asc', label: 'A-Z' },
  { key: 'name_desc', label: 'Z-A' },
  { key: 'recent', label: 'Recently Added' },
  { key: 'rating', label: 'Rating' },
];

function sortSeries(items: SeriesWithChannel[], sortKey: SortKey): SeriesWithChannel[] {
  const sorted = [...items];
  switch (sortKey) {
    case 'name_asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name_desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'recent':
      return sorted.sort((a, b) => {
        const aTime = parseInt(a.last_modified || '0', 10);
        const bTime = parseInt(b.last_modified || '0', 10);
        return bTime - aTime;
      });
    case 'rating':
      return sorted.sort((a, b) => (b.rating_5based || 0) - (a.rating_5based || 0));
    default:
      return sorted;
  }
}

export function SeriesPage() {
  const navigate = useNavigate();
  const languages = getSupportedLanguages();
  const [activeLanguage, setActiveLanguage] = useState(languages[0] || 'Telugu');
  const [activeChannel, setActiveChannel] = useState<string | null>(null); // null = All
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name_asc');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { allSeries, channels, isLoading } = useSeriesByLanguage(activeLanguage);

  // Filter and sort
  const processedSeries = useMemo(() => {
    let result = allSeries;

    // Channel filter
    if (activeChannel) {
      result = result.filter((s) => s.channelId === activeChannel);
    }

    // Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }

    // Sort
    result = sortSeries(result, sortKey);

    return result;
  }, [allSeries, activeChannel, debouncedSearch, sortKey]);

  const handleLanguageChange = useCallback((lang: string) => {
    setActiveLanguage(lang);
    setActiveChannel(null); // Reset channel filter when switching language
    setSearchQuery('');
  }, []);

  const totalCount = allSeries.length;

  return (
    <PageTransition>
      <div className="px-6 lg:px-10 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-display text-2xl font-bold text-text-primary">Series</h1>
          {totalCount > 0 && (
            <span className="text-text-muted text-sm">{totalCount} series</span>
          )}
        </div>

        {/* Language Tabs */}
        <div className="flex gap-2 mb-5">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                activeLanguage === lang
                  ? 'bg-gradient-to-r from-teal/20 to-indigo/20 text-text-primary border border-teal/30'
                  : 'bg-surface-raised text-text-secondary border border-border hover:text-text-primary hover:border-teal/20'
              }`}
            >
              {lang}
            </button>
          ))}
          <button
            onClick={() => handleLanguageChange('all')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
              activeLanguage === 'all'
                ? 'bg-gradient-to-r from-teal/20 to-indigo/20 text-text-primary border border-teal/30'
                : 'bg-surface-raised text-text-secondary border border-border hover:text-text-primary hover:border-teal/20'
            }`}
          >
            All
          </button>
        </div>

        {/* Channel Filter Pills */}
        {channels.length > 1 && (
          <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setActiveChannel(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all min-h-[36px] ${
                activeChannel === null
                  ? 'bg-teal/15 text-teal border border-teal/30'
                  : 'bg-surface-raised text-text-muted border border-border-subtle hover:text-text-secondary hover:border-border'
              }`}
            >
              All ({totalCount})
            </button>
            {channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id === activeChannel ? null : ch.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all min-h-[36px] whitespace-nowrap ${
                  activeChannel === ch.id
                    ? 'bg-teal/15 text-teal border border-teal/30'
                    : 'bg-surface-raised text-text-muted border border-border-subtle hover:text-text-secondary hover:border-border'
                }`}
              >
                {ch.name} ({ch.count})
              </button>
            ))}
          </div>
        )}

        {/* Search + Sort Row */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-raised border border-border rounded-lg text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal-dim transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            <SkeletonGrid count={18} aspectRatio="poster" />
          </div>
        ) : processedSeries.length === 0 ? (
          <EmptyState
            title={debouncedSearch ? 'No matching series' : 'No series available'}
            message={
              debouncedSearch
                ? `No results for "${debouncedSearch}". Try a different search.`
                : `No ${activeLanguage === 'all' ? '' : activeLanguage + ' '}series found.`
            }
            icon="content"
          />
        ) : (
          <>
            {/* Results count */}
            {debouncedSearch && (
              <p className="text-text-muted text-xs mb-3">
                {processedSeries.length} result{processedSeries.length !== 1 ? 's' : ''}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {processedSeries.map((series) => (
                <div key={series.series_id} className="relative">
                  <ContentCard
                    image={series.cover}
                    title={series.name}
                    subtitle={series.releaseDate ? series.releaseDate.slice(0, 4) : undefined}
                    badge={
                      series.rating_5based > 0 ? (
                        <Badge variant="warning">{series.rating_5based.toFixed(1)} ★</Badge>
                      ) : undefined
                    }
                    onClick={() =>
                      navigate({
                        to: '/series/$seriesId',
                        params: { seriesId: String(series.series_id) },
                      })
                    }
                  />
                  {/* Channel badge overlay */}
                  <div className="absolute bottom-[52px] right-2 z-10">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-obsidian/80 text-text-secondary backdrop-blur-sm border border-border-subtle">
                      {series.channelName}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
