import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useRecentlyAdded } from '../api';
import { usePlayerStore } from '@lib/store';
import { HorizontalScroll } from '@shared/components/HorizontalScroll';
import { ContentCard } from '@shared/components/ContentCard';
import type { XtreamLiveStream, XtreamVODStream, XtreamSeriesItem } from '@shared/types/api';

type TabType = 'live' | 'vod' | 'series';

const tabs: { key: TabType; label: string }[] = [
  { key: 'live', label: 'Live' },
  { key: 'vod', label: 'Movies' },
  { key: 'series', label: 'Series' },
];

export function RecentlyAdded() {
  const [activeTab, setActiveTab] = useState<TabType>('live');
  const navigate = useNavigate();
  const playStream = usePlayerStore((s) => s.playStream);

  const { data: liveData, isLoading: liveLoading } = useRecentlyAdded('live');
  const { data: vodData, isLoading: vodLoading } = useRecentlyAdded('vod');
  const { data: seriesData, isLoading: seriesLoading } = useRecentlyAdded('series');

  const isLoading = activeTab === 'live' ? liveLoading : activeTab === 'vod' ? vodLoading : seriesLoading;

  const handleLiveClick = (item: XtreamLiveStream) => {
    playStream(String(item.stream_id), 'live', item.name);
    navigate({ to: '/player' as string });
  };

  const handleVodClick = (item: XtreamVODStream) => {
    navigate({ to: '/vod/$vodId', params: { vodId: String(item.stream_id) } });
  };

  const handleSeriesClick = (item: XtreamSeriesItem) => {
    navigate({ to: '/series/$seriesId', params: { seriesId: String(item.series_id) } });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="min-w-[160px] max-w-[160px] animate-pulse">
              <div className="aspect-[2/3] bg-surface-raised rounded-lg" />
              <div className="mt-2 h-4 bg-surface-raised rounded w-3/4" />
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'live') {
      const items = liveData ?? [];
      if (items.length === 0) return <p className="text-text-muted text-sm">No live streams found.</p>;
      return (
        <HorizontalScroll>
          {items.map((item) => (
            <div key={item.stream_id} className="min-w-[160px] max-w-[160px]" style={{ scrollSnapAlign: 'start' }}>
              <ContentCard
                image={item.stream_icon}
                title={item.name}
                aspectRatio="square"
                onClick={() => handleLiveClick(item)}
              />
            </div>
          ))}
        </HorizontalScroll>
      );
    }

    if (activeTab === 'vod') {
      const items = vodData ?? [];
      if (items.length === 0) return <p className="text-text-muted text-sm">No movies found.</p>;
      return (
        <HorizontalScroll>
          {items.map((item) => (
            <div key={item.stream_id} className="min-w-[160px] max-w-[160px]" style={{ scrollSnapAlign: 'start' }}>
              <ContentCard
                image={item.stream_icon}
                title={item.name}
                subtitle={item.rating ? `Rating: ${item.rating}` : undefined}
                aspectRatio="poster"
                onClick={() => handleVodClick(item)}
              />
            </div>
          ))}
        </HorizontalScroll>
      );
    }

    // series
    const items = seriesData ?? [];
    if (items.length === 0) return <p className="text-text-muted text-sm">No series found.</p>;
    return (
      <HorizontalScroll>
        {items.map((item) => (
          <div key={item.series_id} className="min-w-[160px] max-w-[160px]" style={{ scrollSnapAlign: 'start' }}>
            <ContentCard
              image={item.cover}
              title={item.name}
              subtitle={item.genre || undefined}
              aspectRatio="poster"
              onClick={() => handleSeriesClick(item)}
            />
          </div>
        ))}
      </HorizontalScroll>
    );
  };

  return (
    <section>
      <div className="flex items-center gap-4 mb-3">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Recently Added
        </h2>
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-teal/15 text-teal'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {renderContent()}
    </section>
  );
}
