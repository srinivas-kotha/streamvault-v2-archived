import { useState, useMemo } from 'react';
import { useLanguageLiveChannels } from '../api';
import { ContentRail } from '@shared/components/ContentRail';
import { FocusableCard } from '@shared/components/FocusableCard';
import { ContentCard } from '@shared/components/ContentCard';
import { SkeletonGrid } from '@shared/components/Skeleton';
import { EmptyState } from '@shared/components/EmptyState';
import { useDebounce } from '@shared/hooks/useDebounce';
import { isNewContent } from '@shared/utils/isNewContent';
import { usePlayerStore } from '@lib/store';
import type { XtreamLiveStream } from '@shared/types/api';

interface LiveTabContentProps {
  language: string;
  lang: string;
}

export function LiveTabContent({ language, lang }: LiveTabContentProps) {
  const { rails, isLoading, allChannels } = useLanguageLiveChannels(language);
  const playStream = usePlayerStore((s) => s.playStream);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const hasActiveFilters = !!debouncedSearch || activeCategory !== null;

  // Build category chips data
  const categoryChips = useMemo(
    () =>
      rails.map((r) => ({
        id: r.category.id,
        name: r.category.name || r.category.originalName,
        count: r.items.length,
      })),
    [rails],
  );

  const totalCount = allChannels.length;

  // Filtered channels for grid mode
  const processedChannels = useMemo(() => {
    let result: XtreamLiveStream[] = [];

    if (activeCategory) {
      const rail = rails.find((r) => r.category.id === activeCategory);
      result = rail ? rail.items : [];
    } else {
      result = rails.flatMap((r) => r.items);
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((ch) => ch.name.toLowerCase().includes(q));
    }

    return result;
  }, [rails, activeCategory, debouncedSearch]);

  const handlePlay = (channel: XtreamLiveStream) => {
    playStream(String(channel.stream_id), 'live', channel.name);
  };

  return (
    <div className="space-y-6">
      {/* Category Filter Chips */}
      {categoryChips.length > 1 && (
        <div className="flex gap-2 px-6 lg:px-10 overflow-x-auto scrollbar-hide pb-1">
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

      {/* Search Bar */}
      <div className="flex items-center gap-3 px-6 lg:px-10 flex-wrap">
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
            placeholder="Search channels..."
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

        {/* Clear filters button */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveCategory(null);
            }}
            className="px-3 py-2 rounded-lg text-xs font-medium text-text-muted hover:text-text-secondary transition-all min-h-[36px]"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Content: Rails mode (no filters) or Grid mode (filters active) */}
      {isLoading ? (
        hasActiveFilters ? (
          <SkeletonGrid count={24} aspectRatio="landscape" />
        ) : (
          <ContentRail title="Loading..." isLoading={true}>
            <div />
          </ContentRail>
        )
      ) : hasActiveFilters ? (
        /* Grid mode */
        processedChannels.length === 0 ? (
          <EmptyState
            title="No matching channels"
            message={
              debouncedSearch
                ? `No channels matching "${debouncedSearch}". Try a different search.`
                : 'No channels in this category.'
            }
            icon="content"
          />
        ) : (
          <div className="px-6 lg:px-10">
            <p className="text-text-muted text-xs mb-3">
              {processedChannels.length} channel
              {processedChannels.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {processedChannels.map((channel) => (
                <ContentCard
                  key={channel.stream_id}
                  image={channel.stream_icon}
                  title={channel.name}
                  aspectRatio="landscape"
                  onClick={() => handlePlay(channel)}
                />
              ))}
            </div>
          </div>
        )
      ) : (
        /* Rails mode */
        <>
          {rails.map((rail) => (
            <ContentRail
              key={rail.category.id}
              title={rail.category.name || rail.category.originalName}
              seeAllTo={`/language/${lang}/category/${rail.category.id}`}
            >
              {rail.items.map((item) => (
                <FocusableCard
                  key={item.stream_id}
                  focusKey={`live-${item.stream_id}`}
                  image={item.stream_icon}
                  title={item.name}
                  isNew={isNewContent(item.added)}
                  aspectRatio="landscape"
                  onClick={() => handlePlay(item)}
                />
              ))}
            </ContentRail>
          ))}
          {rails.length === 0 && (
            <EmptyState
              title="No live channels"
              message={`No ${language} live channels found.`}
              icon="content"
            />
          )}
        </>
      )}
    </div>
  );
}
