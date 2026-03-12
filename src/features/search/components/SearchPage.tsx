import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useSearch } from '../api';
import { useDebounce } from '@shared/hooks/useDebounce';
import { ContentCard } from '@shared/components/ContentCard';
import { SkeletonGrid } from '@shared/components/Skeleton';
import { EmptyState } from '@shared/components/EmptyState';
import { usePlayerStore } from '@lib/store';
import { PageTransition } from '@shared/components/PageTransition';

type TabType = 'all' | 'live' | 'vod' | 'series';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const playStream = usePlayerStore((s) => s.playStream);

  const debouncedQuery = useDebounce(query, 300);
  const { data, isLoading, isFetching } = useSearch(debouncedQuery);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const counts = useMemo(() => ({
    live: data?.live?.length ?? 0,
    vod: data?.vod?.length ?? 0,
    series: data?.series?.length ?? 0,
    all: (data?.live?.length ?? 0) + (data?.vod?.length ?? 0) + (data?.series?.length ?? 0),
  }), [data]);

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'live', label: 'Live TV', count: counts.live },
    { key: 'vod', label: 'Movies', count: counts.vod },
    { key: 'series', label: 'Series', count: counts.series },
  ];

  const handleLiveClick = (stream: { stream_id: number; name: string; stream_icon: string }) => {
    playStream(String(stream.stream_id), 'live', stream.name);
    navigate({ to: '/live', search: { play: String(stream.stream_id) } });
  };

  const handleVodClick = (vodId: number) => {
    navigate({ to: '/vod/$vodId', params: { vodId: String(vodId) } });
  };

  const handleSeriesClick = (seriesId: number) => {
    navigate({ to: '/series/$seriesId', params: { seriesId: String(seriesId) } });
  };

  const hasQuery = debouncedQuery.length >= 2;
  const showLoading = hasQuery && (isLoading || isFetching);
  const showResults = hasQuery && data && !isLoading;
  const showEmpty = showResults && counts.all === 0;
  const showPrompt = !hasQuery;

  return (
    <PageTransition>
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search live TV, movies, series..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-surface border border-white/10 rounded-xl text-text-primary placeholder:text-text-muted text-base focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
            aria-label="Clear search"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tabs */}
      {hasQuery && (
        <div className="flex gap-1 border-b border-white/10 pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                activeTab === tab.key
                  ? 'text-teal border-b-2 border-teal bg-teal/5'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
              }`}
            >
              {tab.label}
              {showResults && (
                <span className={`ml-1.5 text-xs ${activeTab === tab.key ? 'text-teal/70' : 'text-text-muted'}`}>
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {showLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          <SkeletonGrid count={12} />
        </div>
      )}

      {/* Prompt */}
      {showPrompt && (
        <EmptyState
          title="Search StreamVault"
          message="Type at least 2 characters to search across live TV, movies, and series"
          icon="search"
        />
      )}

      {/* Empty results */}
      {showEmpty && (
        <EmptyState
          title="No results found"
          message={`Nothing matched "${debouncedQuery}". Try a different search term.`}
          icon="search"
        />
      )}

      {/* Results */}
      {showResults && !showEmpty && (
        <div className="space-y-8">
          {/* Live TV */}
          {(activeTab === 'all' || activeTab === 'live') && data.live.length > 0 && (
            <section>
              {activeTab === 'all' && (
                <h2 className="font-display text-lg font-bold text-text-primary mb-3">
                  Live TV
                  <span className="ml-2 text-sm font-normal text-text-secondary">({data.live.length})</span>
                </h2>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {data.live.map((stream) => (
                  <ContentCard
                    key={`live-${stream.stream_id}`}
                    image={stream.stream_icon}
                    title={stream.name}
                    aspectRatio="square"
                    badge={
                      <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-red-500/90 text-white rounded">
                        Live
                      </span>
                    }
                    onClick={() => handleLiveClick(stream)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Movies / VOD */}
          {(activeTab === 'all' || activeTab === 'vod') && data.vod.length > 0 && (
            <section>
              {activeTab === 'all' && (
                <h2 className="font-display text-lg font-bold text-text-primary mb-3">
                  Movies
                  <span className="ml-2 text-sm font-normal text-text-secondary">({data.vod.length})</span>
                </h2>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {data.vod.map((movie) => (
                  <ContentCard
                    key={`vod-${movie.stream_id}`}
                    image={movie.stream_icon}
                    title={movie.name}
                    subtitle={movie.rating ? `${movie.rating}/10` : undefined}
                    aspectRatio="poster"
                    onClick={() => handleVodClick(movie.stream_id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Series */}
          {(activeTab === 'all' || activeTab === 'series') && data.series.length > 0 && (
            <section>
              {activeTab === 'all' && (
                <h2 className="font-display text-lg font-bold text-text-primary mb-3">
                  Series
                  <span className="ml-2 text-sm font-normal text-text-secondary">({data.series.length})</span>
                </h2>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {data.series.map((show) => (
                  <ContentCard
                    key={`series-${show.series_id}`}
                    image={show.cover}
                    title={show.name}
                    subtitle={show.genre || undefined}
                    aspectRatio="poster"
                    onClick={() => handleSeriesClick(show.series_id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
    </PageTransition>
  );
}
