import { useState, useMemo } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { PageTransition } from '@shared/components/PageTransition';
import { HeroBanner, type HeroItem } from '@shared/components/HeroBanner';
import { ContentRail } from '@shared/components/ContentRail';
import { FocusableCard } from '@shared/components/FocusableCard';
import { useLanguageMovieRails, useLanguageLiveChannels } from './api';
import { useSeriesByLanguage, type SeriesWithChannel } from '@features/series/api';
import { usePlayerStore } from '@lib/store';
import type { XtreamVODStream, XtreamLiveStream } from '@shared/types/api';

type TabKey = 'movies' | 'series' | 'live';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'movies', label: 'Movies' },
  { key: 'series', label: 'Series' },
  { key: 'live', label: 'Live TV' },
];

export function LanguageHubPage() {
  const { lang } = useParams({ strict: false }) as { lang?: string };
  const language = lang ? lang.charAt(0).toUpperCase() + lang.slice(1) : '';
  const navigate = useNavigate();
  const playStream = usePlayerStore((s) => s.playStream);
  const [activeTab, setActiveTab] = useState<TabKey>('movies');

  const { rails: movieRails, isLoading: moviesLoading } = useLanguageMovieRails(language);
  const { allSeries, channels: seriesChannels, isLoading: seriesLoading } = useSeriesByLanguage(language);
  const { rails: liveRails, isLoading: liveLoading } = useLanguageLiveChannels(language);

  // Group series by channel for rails display
  const seriesRails = useMemo(() => {
    if (!allSeries.length) return [];
    const byChannel = new Map<string, SeriesWithChannel[]>();
    for (const s of allSeries) {
      const list = byChannel.get(s.channelId) || [];
      list.push(s);
      byChannel.set(s.channelId, list);
    }
    return seriesChannels
      .filter((ch) => byChannel.has(ch.id))
      .map((ch) => ({
        channelId: ch.id,
        channelName: ch.name,
        items: (byChannel.get(ch.id) || []).slice(0, 20),
      }));
  }, [allSeries, seriesChannels]);

  // Hero items from top movies
  const heroItems = useMemo<HeroItem[]>(() => {
    if (activeTab === 'movies' && movieRails.length > 0) {
      return (movieRails[0]?.items ?? []).slice(0, 5).map((m) => ({
        id: m.stream_id,
        type: 'vod' as const,
        title: m.name,
        image: m.stream_icon,
        rating: m.rating || undefined,
      }));
    }
    if (activeTab === 'series' && allSeries.length > 0) {
      return allSeries.slice(0, 5).map((s) => ({
        id: s.series_id,
        type: 'series' as const,
        title: s.name,
        description: s.plot || undefined,
        image: s.backdrop_path?.[0] || s.cover,
        rating: s.rating || undefined,
        genre: s.genre || undefined,
      }));
    }
    return [];
  }, [activeTab, movieRails, allSeries]);

  if (!lang) {
    return <PageTransition><div className="px-6 lg:px-10 py-20 text-center"><p className="text-text-muted text-lg">Language not found</p></div></PageTransition>;
  }

  const handleVodClick = (item: XtreamVODStream) => {
    navigate({ to: '/vod/$vodId', params: { vodId: String(item.stream_id) } });
  };

  const handleSeriesClick = (item: SeriesWithChannel) => {
    navigate({ to: '/series/$seriesId', params: { seriesId: String(item.series_id) } });
  };

  const handleLiveClick = (item: XtreamLiveStream) => {
    playStream(String(item.stream_id), 'live', item.name);
  };

  // Keyboard tab switching
  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    const currentIdx = tabs.findIndex((t) => t.key === activeTab);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = tabs[(currentIdx + 1) % tabs.length];
      if (next) setActiveTab(next.key);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = tabs[(currentIdx - 1 + tabs.length) % tabs.length];
      if (prev) setActiveTab(prev.key);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6 pb-12">
        {/* Hero Banner */}
        {heroItems.length > 0 && <HeroBanner items={heroItems} />}

        {/* Content Tabs */}
        <div className="px-6 lg:px-10 relative z-10">
          <div
            className="flex items-center gap-1 border-b border-border-subtle"
            onKeyDown={handleTabKeyDown}
            role="tablist"
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-5 py-3 text-sm font-medium transition-all min-h-[48px] ${
                  activeTab === tab.key
                    ? 'text-text-primary'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-gradient-to-r from-teal to-indigo rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Movies Tab */}
        {activeTab === 'movies' && (
          <div className="space-y-8">
            {moviesLoading && (
              <ContentRail title="Loading..." isLoading={true}>
                <div />
              </ContentRail>
            )}
            {movieRails.map((rail) => (
              <ContentRail
                key={rail.category.id}
                title={rail.category.name || rail.category.originalName}
                seeAllTo={`/language/${lang}/category/${rail.category.id}`}
              >
                {rail.items.map((item) => (
                  <FocusableCard
                    key={item.stream_id}
                    image={item.stream_icon}
                    title={item.name}
                    subtitle={item.rating ? `⭐ ${item.rating}` : undefined}
                    aspectRatio="poster"
                    onClick={() => handleVodClick(item)}
                  />
                ))}
              </ContentRail>
            ))}
            {!moviesLoading && movieRails.length === 0 && (
              <div className="px-6 lg:px-10 py-12 text-center">
                <p className="text-text-muted text-lg">No {language} movies found</p>
              </div>
            )}
          </div>
        )}

        {/* Series Tab */}
        {activeTab === 'series' && (
          <div className="space-y-8">
            {seriesLoading && (
              <ContentRail title="Loading..." isLoading={true}>
                <div />
              </ContentRail>
            )}
            {seriesRails.map((rail) => (
              <ContentRail
                key={rail.channelId}
                title={rail.channelName}
              >
                {rail.items.map((item) => (
                  <FocusableCard
                    key={item.series_id}
                    image={item.cover}
                    title={item.name}
                    subtitle={item.genre || undefined}
                    aspectRatio="poster"
                    onClick={() => handleSeriesClick(item)}
                  />
                ))}
              </ContentRail>
            ))}
            {!seriesLoading && seriesRails.length === 0 && (
              <div className="px-6 lg:px-10 py-12 text-center">
                <p className="text-text-muted text-lg">No {language} series found</p>
              </div>
            )}
          </div>
        )}

        {/* Live TV Tab */}
        {activeTab === 'live' && (
          <div className="space-y-8">
            {liveLoading && (
              <ContentRail title="Loading..." isLoading={true}>
                <div />
              </ContentRail>
            )}
            {liveRails.map((rail) => (
              <ContentRail
                key={rail.category.id}
                title={rail.category.name || rail.category.originalName}
                seeAllTo={`/language/${lang}/category/${rail.category.id}`}
              >
                {rail.items.map((item) => (
                  <FocusableCard
                    key={item.stream_id}
                    image={item.stream_icon}
                    title={item.name}
                    aspectRatio="square"
                    onClick={() => handleLiveClick(item)}
                  />
                ))}
              </ContentRail>
            ))}
            {!liveLoading && liveRails.length === 0 && (
              <div className="px-6 lg:px-10 py-12 text-center">
                <p className="text-text-muted text-lg">No {language} live channels found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
