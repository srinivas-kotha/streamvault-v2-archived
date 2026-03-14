import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearch, useNavigate } from '@tanstack/react-router';

import { useLiveCategories, useLiveStreams } from '../api';
import { ChannelGrid } from './ChannelGrid';
import { EPGGrid } from './EPGGrid';
import { FeaturedChannels } from './FeaturedChannels';
import { SkeletonGrid } from '@shared/components/Skeleton';
import { EmptyState } from '@shared/components/EmptyState';
import { useDebounce } from '@shared/hooks/useDebounce';
import { PageTransition } from '@shared/components/PageTransition';
import { PlayerPage } from '@features/player/components/PlayerPage';
import { usePlayerStore } from '@lib/store';
import { useSpatialFocusable, useSpatialContainer, FocusContext, setFocus } from '@shared/hooks/useSpatialNav';
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
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: `sidebar-cat-${cat.category_id}`,
    onEnterPress: () => onSelect(cat.category_id),
  });

  return (
    <button
      ref={ref}
      {...focusProps}
      onClick={() => onSelect(cat.category_id)}
      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
        isActive
          ? 'bg-teal/10 text-teal border-l-2 border-teal font-medium'
          : showFocusRing
            ? 'bg-surface-raised text-text-primary ring-2 ring-teal/50 ring-offset-1 ring-offset-obsidian'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
      }`}
    >
      {cat.category_name}
    </button>
  );
}

function FocusableViewToggle({ isActive, onSelect, title, icon, id }: {
  mode?: string;
  isActive: boolean;
  onSelect: () => void;
  title: string;
  icon: React.ReactNode;
  id: string;
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
      className={`p-2 transition-colors ${
        isActive
          ? 'bg-teal/15 text-teal'
          : showFocusRing
            ? 'text-text-primary ring-2 ring-teal/50'
            : 'text-text-muted hover:text-text-primary'
      }`}
      title={title}
    >
      {icon}
    </button>
  );
}

function FocusableLiveSearch({ searchQuery, setSearchQuery }: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { ref: focusRef, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: 'live-search',
    onEnterPress: () => inputRef.current?.focus(),
  });

  return (
    <div ref={focusRef} {...focusProps} className="flex-1 max-w-sm">
      <input
        ref={inputRef}
        type="text"
        placeholder="Filter channels..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={`w-full px-4 py-2 bg-surface-raised border rounded-lg text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal-dim transition-all ${
          showFocusRing ? 'border-teal ring-2 ring-teal/50' : 'border-border'
        }`}
      />
    </div>
  );
}

function SidebarNav({ categories, activeCatId, isLoading, onSelect }: SidebarNavProps) {
  const { ref, focusKey } = useSpatialContainer({
    focusKey: 'live-sidebar',
    isFocusBoundary: true,
    focusBoundaryDirections: ['left'],
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
  const searchParams = useSearch({ from: '/_authenticated/live' });
  const play = searchParams.play;
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const debouncedSearch = useDebounce(searchQuery);

  // Page container
  const { ref: contentRef, focusKey: contentFocusKey } = useSpatialContainer({
    focusKey: 'live-content',
    focusable: false,
  });

  // Auto-focus sidebar on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try { setFocus('live-sidebar'); } catch { /* not mounted */ }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Horizontal split: sidebar | main
  const { ref: layoutRef, focusKey: layoutFocusKey } = useSpatialContainer({
    focusKey: 'live-layout',
  });

  // Main content area
  const { ref: mainRef, focusKey: mainFocusKey } = useSpatialContainer({
    focusKey: 'live-main',
  });

  // Controls bar (search + view toggles)
  const { focusKey: controlsFocusKey } = useSpatialContainer({
    focusKey: 'live-controls',
  });

  // Channel grid container
  const { focusKey: channelGridFocusKey } = useSpatialContainer({
    focusKey: 'live-channel-grid',
  });

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
    <FocusContext.Provider value={contentFocusKey}>
    <div ref={contentRef} className="flex flex-col gap-4 h-full">
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TanStack Router search params type requires cast
            onClose={() => navigate({ search: { ...searchParams, play: undefined } } as any)}
          />
        </div>
      )}

      {/* Featured Channels Section */}
      {!play && <FeaturedChannels />}

      <FocusContext.Provider value={layoutFocusKey}>
      <div ref={layoutRef} className="flex gap-6 flex-1 min-h-0">
        {/* Category Sidebar — vertical focus boundary */}
        <SidebarNav
          categories={sortedCategories}
          activeCatId={activeCatId}
          isLoading={catLoading}
          onSelect={setSelectedCategory}
        />

        {/* Main Content */}
        <FocusContext.Provider value={mainFocusKey}>
        <div ref={mainRef} className="flex-1 min-w-0">
          {/* Top bar: Search + View toggle */}
          <FocusContext.Provider value={controlsFocusKey}>
          <div className="flex items-center gap-3 mb-4">
            <FocusableLiveSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

            {/* View mode toggle */}
            <div className="flex items-center bg-surface-raised border border-border rounded-lg overflow-hidden">
              <FocusableViewToggle
                id="toggle-view-grid"
                mode="grid"
                isActive={viewMode === 'grid'}
                onSelect={() => setViewMode('grid')}
                title="Grid view"
                icon={
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" />
                  </svg>
                }
              />
              <FocusableViewToggle
                id="toggle-view-epg"
                mode="epg"
                isActive={viewMode === 'epg'}
                onSelect={() => setViewMode('epg')}
                title="EPG guide"
                icon={
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 4h18v2H3V4zm0 5h18v2H3V9zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
                  </svg>
                }
              />
            </div>
          </div>
          </FocusContext.Provider>

          <FocusContext.Provider value={channelGridFocusKey}>
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
          </FocusContext.Provider>
        </div>
        </FocusContext.Provider>
      </div>
      </FocusContext.Provider>
    </div>
    </FocusContext.Provider>
    </PageTransition>
  );
}
