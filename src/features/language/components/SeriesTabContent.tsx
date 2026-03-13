import { useState, useMemo, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useSeriesByLanguage, type SeriesWithChannel } from '@features/series/api';
import { ContentRail } from '@shared/components/ContentRail';
import { FocusableCard } from '@shared/components/FocusableCard';
import { ContentCard } from '@shared/components/ContentCard';
import { SkeletonGrid } from '@shared/components/Skeleton';
import { EmptyState } from '@shared/components/EmptyState';
import { Badge } from '@shared/components/Badge';
import { useDebounce } from '@shared/hooks/useDebounce';
import { useSpatialFocusable } from '@shared/hooks/useSpatialNav';
import { isNewContent } from '@shared/utils/isNewContent';

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

function FocusableChip({ id, label, isActive, onSelect }: { id: string; label: string; isActive: boolean; onSelect: () => void }) {
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: id,
    onEnterPress: onSelect,
  });

  return (
    <button
      ref={ref}
      {...focusProps}
      onClick={onSelect}
      className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all min-h-[36px] whitespace-nowrap ${
        isActive
          ? 'bg-teal/15 text-teal border border-teal/30'
          : showFocusRing
            ? 'bg-surface-raised text-text-primary border border-teal/50 ring-2 ring-teal/40'
            : 'bg-surface-raised text-text-muted border border-border-subtle hover:text-text-secondary hover:border-border'
      }`}
    >
      {label}
    </button>
  );
}

function FocusableSortButton({ id, label, isActive, onSelect }: { id: string; label: string; isActive: boolean; onSelect: () => void }) {
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: id,
    onEnterPress: onSelect,
  });

  return (
    <button
      ref={ref}
      {...focusProps}
      onClick={onSelect}
      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all min-h-[36px] ${
        isActive
          ? 'bg-teal/15 text-teal'
          : showFocusRing
            ? 'text-text-primary ring-2 ring-teal/40'
            : 'text-text-muted hover:text-text-secondary'
      }`}
    >
      {label}
    </button>
  );
}

function FocusableSearchInput({ value, onChange, placeholder, focusKey }: { value: string; onChange: (v: string) => void; placeholder: string; focusKey: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey,
    onEnterPress: () => inputRef.current?.focus(),
  });

  return (
    <div ref={ref} {...focusProps} className={`relative flex-1 min-w-[200px] max-w-sm ${showFocusRing ? 'ring-2 ring-teal/50 rounded-lg' : ''}`}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 bg-surface-raised border border-border rounded-lg text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal-dim transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

function FocusableClearButton({ id, onSelect }: { id: string; onSelect: () => void }) {
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: id,
    onEnterPress: onSelect,
  });

  return (
    <button
      ref={ref}
      {...focusProps}
      onClick={onSelect}
      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all min-h-[36px] ${
        showFocusRing
          ? 'text-red-300 ring-2 ring-teal/40'
          : 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
      }`}
    >
      Clear filters
    </button>
  );
}

interface SeriesTabContentProps {
  language: string;
}

export function SeriesTabContent({ language }: SeriesTabContentProps) {
  const navigate = useNavigate();
  const { allSeries, channels, isLoading } = useSeriesByLanguage(language);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('name_asc');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const hasActiveFilters = !!debouncedSearch || activeChannel !== null || sortKey !== 'name_asc';

  const totalCount = allSeries.length;

  // Rails mode: group series by channel
  const seriesRails = useMemo(() => {
    if (!allSeries.length) return [];
    const byChannel = new Map<string, SeriesWithChannel[]>();
    for (const s of allSeries) {
      const list = byChannel.get(s.channelId) || [];
      list.push(s);
      byChannel.set(s.channelId, list);
    }
    return channels
      .filter((ch) => byChannel.has(ch.id))
      .map((ch) => ({
        channelId: ch.id,
        channelName: ch.name,
        items: (byChannel.get(ch.id) || []).slice(0, 20),
      }));
  }, [allSeries, channels]);

  // Grid mode: filter and sort
  const processedSeries = useMemo(() => {
    let result = allSeries;
    if (activeChannel) {
      result = result.filter((s) => s.channelId === activeChannel);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }
    result = sortSeries(result, sortKey);
    return result;
  }, [allSeries, activeChannel, debouncedSearch, sortKey]);

  const clearFilters = () => {
    setSearchQuery('');
    setActiveChannel(null);
    setSortKey('name_asc');
  };

  return (
    <div className="space-y-5">
      {/* Channel Filter Pills */}
      {channels.length > 1 && (
        <div className="flex gap-2 px-6 lg:px-10 overflow-x-auto scrollbar-hide pb-1">
          <FocusableChip
            id="series-chip-all"
            label={`All (${totalCount})`}
            isActive={activeChannel === null}
            onSelect={() => setActiveChannel(null)}
          />
          {channels.map((ch) => (
            <FocusableChip
              key={ch.id}
              id={`series-chip-${ch.id}`}
              label={`${ch.name} (${ch.count})`}
              isActive={activeChannel === ch.id}
              onSelect={() => setActiveChannel(ch.id === activeChannel ? null : ch.id)}
            />
          ))}
        </div>
      )}

      {/* Search + Sort Row */}
      <div className="flex items-center gap-3 px-6 lg:px-10 flex-wrap">
        <FocusableSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search series..."
          focusKey="series-search"
        />

        <div className="flex gap-1.5">
          {SORT_OPTIONS.map((opt) => (
            <FocusableSortButton
              key={opt.key}
              id={`series-sort-${opt.key}`}
              label={opt.label}
              isActive={sortKey === opt.key}
              onSelect={() => setSortKey(opt.key)}
            />
          ))}
        </div>

        {hasActiveFilters && (
          <FocusableClearButton
            id="series-clear-filters"
            onSelect={clearFilters}
          />
        )}
      </div>

      {/* Content: Rails mode vs Grid mode */}
      {isLoading ? (
        hasActiveFilters ? (
          <div className="px-6 lg:px-10">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              <SkeletonGrid count={18} aspectRatio="poster" />
            </div>
          </div>
        ) : (
          <ContentRail title="Loading..." isLoading={true}>
            <div />
          </ContentRail>
        )
      ) : !hasActiveFilters ? (
        /* Rails mode */
        <div className="space-y-8">
          {seriesRails.map((rail) => (
            <ContentRail key={rail.channelId} title={rail.channelName}>
              {rail.items.map((item) => (
                <FocusableCard
                  key={item.series_id}
                  focusKey={`series-${item.series_id}`}
                  image={item.cover}
                  title={item.name}
                  subtitle={item.genre || undefined}
                  isNew={isNewContent(item.last_modified)}
                  aspectRatio="poster"
                  onClick={() =>
                    navigate({
                      to: '/series/$seriesId',
                      params: { seriesId: String(item.series_id) },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any)
                  }
                />
              ))}
            </ContentRail>
          ))}
          {seriesRails.length === 0 && (
            <EmptyState
              title="No series available"
              message={`No ${language} series found.`}
              icon="content"
            />
          )}
        </div>
      ) : processedSeries.length === 0 ? (
        /* Grid mode: empty */
        <div className="px-6 lg:px-10">
          <EmptyState
            title="No matching series"
            message={
              debouncedSearch
                ? `No results for "${debouncedSearch}". Try a different search or clear filters.`
                : 'No series match the current filters. Try adjusting your selection.'
            }
            icon="content"
          />
        </div>
      ) : (
        /* Grid mode: results */
        <div className="px-6 lg:px-10">
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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any)
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
        </div>
      )}
    </div>
  );
}
