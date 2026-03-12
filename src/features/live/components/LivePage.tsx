import { useState, useMemo } from 'react';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { useLiveCategories, useLiveStreams } from '../api';
import { ChannelGrid } from './ChannelGrid';
import { EPGGrid } from './EPGGrid';
import { FeaturedChannels } from './FeaturedChannels';
import { SkeletonGrid } from '@shared/components/Skeleton';
import { EmptyState } from '@shared/components/EmptyState';
import { useDebounce } from '@shared/hooks/useDebounce';
import { PageTransition } from '@shared/components/PageTransition';
import { PlayerPage } from '@features/player/components/PlayerPage';
import { usePlayerStore, useUIStore } from '@lib/store';
import type { XtreamCategory } from '@shared/types/api';

type ViewMode = 'grid' | 'epg';

// Telugu/Indian categories first
const PRIORITY_KEYWORDS = ['telugu', 'india', 'indian', 'hindi', 'tamil', 'kannada', 'malayalam'];

function categoryPriority(name: string): number {
  const lower = name.toLowerCase();
  for (let i = 0; i < PRIORITY_KEYWORDS.length; i++) {
    if (lower.includes(PRIORITY_KEYWORDS[i]!)) return i;
  }
  return 999;
}

// --- SidebarNav: category list with spatial navigation ---
interface SidebarNavProps {
  categories: XtreamCategory[];
  activeCatId: string;
  isLoading: boolean;
  onSelect: (id: string) => void;
}

function SidebarCategoryButton({
  cat,
  isActive,
  onSelect,
}: {
  cat: XtreamCategory;
  isActive: boolean;
  onSelect: (id: string) => void;
}) {
  const inputMode = useUIStore((s) => s.inputMode);
  const { ref, focused } = useFocusable({
    onEnterPress: () => onSelect(cat.category_id),
    onFocus: ({ node }) => {
      node?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    },
  });
  const showFocus = focused && inputMode === 'keyboard';

  return (
    <button
      ref={ref}
      onClick={() => onSelect(cat.category_id)}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
        isActive
          ? 'bg-teal/10 text-teal border-l-2 border-teal font-medium'
          : showFocus
            ? 'bg-surface-raised text-text-primary ring-2 ring-teal/50 ring-offset-1 ring-offset-obsidian'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
      }`}
    >
      {cat.category_name}
    </button>
  );
}

function SidebarNav({ categories, activeCatId, isLoading, onSelect }: SidebarNavProps) {
  const { ref, focusKey } = useFocusable({
    focusKey: 'live-sidebar',
    saveLastFocusedChild: true,
    trackChildren: true,
    isFocusBoundary: true,
    focusBoundaryDirections: ['up', 'down'],
  });

  return (
    <FocusContext.Provider value={focusKey}>
      <div ref={ref} className="w-56 flex-shrink-0 overflow-y-auto space-y-1 pr-2 max-h-[calc(100vh-8rem)]">
        <h2 className="font-display text-lg font-bold text-text-primary mb-3">Live TV</h2>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-9 bg-surface-raised rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          categories.map((cat) => (
            <SidebarCategoryButton
              key={cat.category_id}
              cat={cat}
              isActive={activeCatId === cat.category_id}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </FocusContext.Provider>
  );
}

export function LivePage() {
  const { play } = useSearch({ from: '/_authenticated/live' });
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const debouncedSearch = useDebounce(searchQuery);

  const { data: categories, isLoading: catLoading } = useLiveCategories();
  const firstCatId = categories?.[0]?.category_id || '';
  const activeCatId = selectedCategory || firstCatId;

  const { data: streams, isLoading: streamsLoading } = useLiveStreams(activeCatId);

  const currentStreamName = usePlayerStore((s) => s.currentStreamName);

  // Sort categories with Telugu/Indian first
  const sortedCategories = useMemo(() => {
    if (!categories) return [];
    return [...categories].sort((a, b) =>
      categoryPriority(a.category_name) - categoryPriority(b.category_name)
    );
  }, [categories]);

  const filteredStreams = useMemo(() => {
    if (!streams) return [];
    if (!debouncedSearch) return streams;
    const q = debouncedSearch.toLowerCase();
    return streams.filter((s) => s.name.toLowerCase().includes(q));
  }, [streams, debouncedSearch]);

  const closePlayer = () => {
    usePlayerStore.getState().stop();
    navigate({ to: '/live', search: {} });
  };

  return (
    <PageTransition>
    <div className="flex flex-col gap-4 h-full">
      {/* Inline Player */}
      {play && (
        <div className="relative">
          <button
            onClick={closePlayer}
            className="absolute top-3 right-3 z-20 p-2 bg-obsidian/80 rounded-full text-text-muted hover:text-text-primary transition-colors"
            title="Close player"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <PlayerPage
            streamType="live"
            streamId={play}
            streamName={currentStreamName || undefined}
          />
        </div>
      )}

      {/* Featured Channels Section */}
      {!play && <FeaturedChannels />}

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Category Sidebar — vertical focus boundary */}
        <SidebarNav
          categories={sortedCategories}
          activeCatId={activeCatId}
          isLoading={catLoading}
          onSelect={setSelectedCategory}
        />


        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Top bar: Search + View toggle */}
          <div className="flex items-center gap-3 mb-4">
            <input
              type="text"
              placeholder="Filter channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 max-w-sm px-4 py-2 bg-surface-raised border border-border rounded-lg text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal-dim transition-all"
            />

            {/* View mode toggle */}
            <div className="flex items-center bg-surface-raised border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-teal/15 text-teal'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                title="Grid view"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('epg')}
                className={`p-2 transition-colors ${
                  viewMode === 'epg'
                    ? 'bg-teal/15 text-teal'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                title="EPG guide"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 4h18v2H3V4zm0 5h18v2H3V9zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
                </svg>
              </button>
            </div>
          </div>

          {streamsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              <SkeletonGrid count={18} aspectRatio="square" />
            </div>
          ) : filteredStreams.length === 0 ? (
            <EmptyState
              title="No channels found"
              message={debouncedSearch ? 'Try a different search term' : 'This category is empty'}
              icon="content"
            />
          ) : viewMode === 'epg' ? (
            <EPGGrid channels={filteredStreams} />
          ) : (
            <ChannelGrid channels={filteredStreams} />
          )}
        </div>
      </div>
    </div>
    </PageTransition>
  );
}
