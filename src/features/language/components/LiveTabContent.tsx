import { useState, useMemo, useRef } from 'react';
import { useLanguageLiveChannels } from '../api';
import { ContentRail } from '@shared/components/ContentRail';
import { FocusableCard } from '@shared/components/FocusableCard';
import { ContentCard } from '@shared/components/ContentCard';
import { SkeletonGrid } from '@shared/components/Skeleton';
import { EmptyState } from '@shared/components/EmptyState';
import { useDebounce } from '@shared/hooks/useDebounce';
import { useSpatialFocusable } from '@shared/hooks/useSpatialNav';
import { isNewContent } from '@shared/utils/isNewContent';
import { usePlayerStore } from '@lib/store';
import type { XtreamLiveStream } from '@shared/types/api';

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

function FocusableSearchInput({ value, onChange, placeholder, focusKey }: { value: string; onChange: (v: string) => void; placeholder: string; focusKey: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey,
    onEnterPress: () => {
      setTimeout(() => inputRef.current?.focus(), 0);
    },
  });

  // When the wrapper div has DOM focus (via shouldFocusDOMNode) and user types,
  // forward keystrokes to the actual input element
  const handleWrapperKeyDown = (e: React.KeyboardEvent) => {
    if (document.activeElement === inputRef.current) return;
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      inputRef.current?.focus();
      onChange(value + e.key);
      e.preventDefault();
    } else if (e.key === 'Backspace' && value) {
      inputRef.current?.focus();
      onChange(value.slice(0, -1));
      e.preventDefault();
    }
  };

  return (
    <div ref={ref} {...focusProps} onKeyDown={handleWrapperKeyDown} className={`relative flex-1 min-w-[200px] max-w-sm ${showFocusRing ? 'ring-2 ring-teal/50 rounded-lg' : ''}`}>
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') inputRef.current?.blur();
        }}
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
          ? 'text-text-primary ring-2 ring-teal/40'
          : 'text-text-muted hover:text-text-secondary'
      }`}
    >
      Clear filters
    </button>
  );
}

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
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <FocusableChip
            id="live-chip-all"
            label={`All (${totalCount})`}
            isActive={activeCategory === null}
            onSelect={() => setActiveCategory(null)}
          />
          {categoryChips.map((chip) => (
            <FocusableChip
              key={chip.id}
              id={`live-chip-${chip.id}`}
              label={`${chip.name} (${chip.count})`}
              isActive={activeCategory === chip.id}
              onSelect={() =>
                setActiveCategory(chip.id === activeCategory ? null : chip.id)
              }
            />
          ))}
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <FocusableSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search channels..."
          focusKey="live-search"
        />

        {/* Clear filters button */}
        {hasActiveFilters && (
          <FocusableClearButton
            id="live-clear-filters"
            onSelect={() => {
              setSearchQuery('');
              setActiveCategory(null);
            }}
          />
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
          <div>
            <p className="text-text-muted text-xs mb-3">
              {processedChannels.length} channel
              {processedChannels.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
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
