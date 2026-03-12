import { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { PageTransition } from '@shared/components/PageTransition';
import { HeroBanner, type HeroItem } from '@shared/components/HeroBanner';
import { ContentRail } from '@shared/components/ContentRail';
import { FocusableCard } from '@shared/components/FocusableCard';
import { ContinueWatching } from './ContinueWatching';
import { useRecentlyAdded, useLatestMoviesByLanguage } from '../api';
import { usePlayerStore } from '@lib/store';
import type { XtreamVODStream, XtreamSeriesItem, XtreamLiveStream } from '@shared/types/api';

export function HomePage() {
  const navigate = useNavigate();
  const playStream = usePlayerStore((s) => s.playStream);

  const { rails: languageRails, isLoading: moviesLoading } = useLatestMoviesByLanguage();
  const { data: recentSeries, isLoading: seriesLoading } = useRecentlyAdded('series');
  const { data: recentLive, isLoading: liveLoading } = useRecentlyAdded('live');

  // Build hero items from first language rail's movies + series
  const heroItems = useMemo<HeroItem[]>(() => {
    const items: HeroItem[] = [];

    // Add top movies from the first language rail
    const firstRail = languageRails[0];
    if (firstRail) {
      for (const m of firstRail.items.slice(0, 3)) {
        if (m.stream_icon) {
          items.push({
            id: m.stream_id,
            type: 'vod',
            title: m.name,
            image: m.stream_icon,
            rating: m.rating || undefined,
          });
        }
      }
    }

    // Add top series
    if (recentSeries) {
      for (const s of recentSeries.slice(0, 2)) {
        const backdrop = s.backdrop_path?.[0] || s.cover;
        if (backdrop) {
          items.push({
            id: s.series_id,
            type: 'series',
            title: s.name,
            description: s.plot || undefined,
            image: backdrop,
            rating: s.rating || undefined,
            genre: s.genre || undefined,
            year: s.releaseDate?.slice(0, 4) || undefined,
          });
        }
      }
    }

    return items.slice(0, 5);
  }, [languageRails, recentSeries]);

  const handleVodClick = (item: XtreamVODStream) => {
    navigate({ to: '/vod/$vodId', params: { vodId: String(item.stream_id) } });
  };

  const handleSeriesClick = (item: XtreamSeriesItem) => {
    navigate({ to: '/series/$seriesId', params: { seriesId: String(item.series_id) } });
  };

  const handleLiveClick = (item: XtreamLiveStream) => {
    playStream(String(item.stream_id), 'live', item.name);
  };

  return (
    <PageTransition>
      <div className="space-y-8 pb-12">
        {/* Hero Banner */}
        {heroItems.length > 0 && (
          <HeroBanner items={heroItems} />
        )}

        {/* Continue Watching */}
        <ContinueWatching />

        {/* Language-grouped Latest Movies */}
        {languageRails.map((rail) => (
          <ContentRail
            key={rail.languageKey}
            title={`Latest ${rail.language} Movies`}
            seeAllTo={`/language/${rail.languageKey}`}
            isLoading={moviesLoading}
            isEmpty={!rail.items.length}
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

        {/* Recently Added Series */}
        <ContentRail
          title="Recently Added Series"
          isLoading={seriesLoading}
          isEmpty={!recentSeries?.length}
        >
          {(recentSeries ?? []).map((item) => (
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

        {/* Recently Added Live */}
        <ContentRail
          title="Live Channels"
          isLoading={liveLoading}
          isEmpty={!recentLive?.length}
        >
          {(recentLive ?? []).map((item) => (
            <FocusableCard
              key={item.stream_id}
              image={item.stream_icon}
              title={item.name}
              aspectRatio="square"
              onClick={() => handleLiveClick(item)}
            />
          ))}
        </ContentRail>
      </div>
    </PageTransition>
  );
}
