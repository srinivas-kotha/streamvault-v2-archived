import { useState, useMemo } from 'react';
import { useLiveCategories, useLiveStreams } from '../api';
import { ChannelGrid } from './ChannelGrid';
import { SkeletonGrid } from '@shared/components/Skeleton';
import { EmptyState } from '@shared/components/EmptyState';
import { useDebounce } from '@shared/hooks/useDebounce';
import { PageTransition } from '@shared/components/PageTransition';

export function LivePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery);

  const { data: categories, isLoading: catLoading } = useLiveCategories();
  const firstCatId = categories?.[0]?.category_id || '';
  const activeCatId = selectedCategory || firstCatId;

  const { data: streams, isLoading: streamsLoading } = useLiveStreams(activeCatId);

  const filteredStreams = useMemo(() => {
    if (!streams) return [];
    if (!debouncedSearch) return streams;
    const q = debouncedSearch.toLowerCase();
    return streams.filter((s) => s.name.toLowerCase().includes(q));
  }, [streams, debouncedSearch]);

  return (
    <PageTransition>
    <div className="flex gap-6 h-full">
      {/* Category Sidebar */}
      <div className="w-56 flex-shrink-0 overflow-y-auto space-y-1 pr-2 max-h-[calc(100vh-8rem)]">
        <h2 className="font-display text-lg font-bold text-text-primary mb-3">Live TV</h2>
        {catLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-9 bg-surface-raised rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          categories?.map((cat) => (
            <button
              key={cat.category_id}
              onClick={() => setSelectedCategory(cat.category_id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                activeCatId === cat.category_id
                  ? 'bg-teal/10 text-teal border-l-2 border-teal font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
              }`}
            >
              {cat.category_name}
            </button>
          ))
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Filter channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-sm px-4 py-2 bg-surface-raised border border-border rounded-lg text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal-dim transition-all"
          />
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
        ) : (
          <ChannelGrid channels={filteredStreams} />
        )}
      </div>
    </div>
    </PageTransition>
  );
}
