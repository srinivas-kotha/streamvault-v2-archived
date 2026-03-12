import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useFavorites, useRemoveFavorite } from '../api';
import { ContentCard } from '@shared/components/ContentCard';
import { EmptyState } from '@shared/components/EmptyState';
import { SkeletonGrid } from '@shared/components/Skeleton';
import { PageTransition } from '@shared/components/PageTransition';
import type { ContentType, DbFavorite } from '@shared/types/api';

type TabFilter = 'all' | ContentType;

const TABS: { key: TabFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'channel', label: 'Channels' },
  { key: 'vod', label: 'Movies' },
  { key: 'series', label: 'Series' },
];

export function FavoritesPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const { data: favorites, isLoading } = useFavorites();
  const removeFavorite = useRemoveFavorite();
  const navigate = useNavigate();

  const counts = useMemo(() => {
    if (!favorites) return { all: 0, channel: 0, vod: 0, series: 0 };
    return {
      all: favorites.length,
      channel: favorites.filter((f) => f.content_type === 'channel').length,
      vod: favorites.filter((f) => f.content_type === 'vod').length,
      series: favorites.filter((f) => f.content_type === 'series').length,
    };
  }, [favorites]);

  const filtered = useMemo(() => {
    if (!favorites) return [];
    if (activeTab === 'all') return favorites;
    return favorites.filter((f) => f.content_type === activeTab);
  }, [favorites, activeTab]);

  function handleClick(fav: DbFavorite) {
    const id = String(fav.content_id);
    switch (fav.content_type) {
      case 'channel':
        navigate({ to: '/live', search: { play: id } });
        break;
      case 'vod':
        navigate({ to: '/vod/$vodId', params: { vodId: id } });
        break;
      case 'series':
        navigate({ to: '/series/$seriesId', params: { seriesId: id } });
        break;
    }
  }

  function handleRemove(contentId: number) {
    removeFavorite.mutate(String(contentId));
  }

  function getAspectRatio(type: ContentType) {
    switch (type) {
      case 'channel':
        return 'square' as const;
      case 'vod':
      case 'series':
        return 'poster' as const;
    }
  }

  return (
    <PageTransition>
    <div>
      <h1 className="font-display text-2xl font-bold text-text-primary mb-6">Favorites</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-teal/10 text-teal border border-teal/30'
                : 'bg-surface-raised text-text-secondary hover:text-text-primary hover:bg-surface-raised/80 border border-white/10'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-70">
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <SkeletonGrid count={12} aspectRatio="poster" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={activeTab === 'all' ? 'No favorites yet' : `No ${TABS.find((t) => t.key === activeTab)?.label.toLowerCase()} favorited`}
          message={activeTab === 'all' ? 'Star channels, movies, or series to save them here' : 'Browse content and tap the star to add favorites'}
          icon="favorites"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((fav) => (
            <ContentCard
              key={`${fav.content_type}-${fav.content_id}`}
              image={fav.content_icon || ''}
              title={fav.content_name || `${fav.content_type} ${fav.content_id}`}
              subtitle={fav.category_name || undefined}
              isFavorite={true}
              onFavoriteToggle={() => handleRemove(fav.content_id)}
              onClick={() => handleClick(fav)}
              aspectRatio={getAspectRatio(fav.content_type)}
            />
          ))}
        </div>
      )}
    </div>
    </PageTransition>
  );
}
