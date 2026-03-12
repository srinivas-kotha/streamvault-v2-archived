import { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { PageTransition } from '@shared/components/PageTransition';
import { HeroBanner, type HeroItem } from '@shared/components/HeroBanner';
import { ContentRail } from '@shared/components/ContentRail';
import { FocusableCard } from '@shared/components/FocusableCard';
import { ContinueWatching } from './ContinueWatching';
import {
  useLanguageMovieRail,
  useLanguageSeriesRail,
  type SeriesWithChannel,
} from '../api';

import type { XtreamVODStream } from '@shared/types/api';

export function HomePage() {
  const navigate = useNavigate();

  // Data hooks -- Telugu & Hindi movies and series
  const { items: teluguMovies, isLoading: teluguMoviesLoading } = useLanguageMovieRail('Telugu');
  const { items: teluguSeries, isLoading: teluguSeriesLoading } = useLanguageSeriesRail('Telugu');
  const { items: hindiMovies, isLoading: hindiMoviesLoading } = useLanguageMovieRail('Hindi');
  const { items: hindiSeries, isLoading: hindiSeriesLoading } = useLanguageSeriesRail('Hindi');

  // Hero banner: top 5 from Telugu movies + Telugu series (mixed)
  const heroItems = useMemo<HeroItem[]>(() => {
    const items: HeroItem[] = [];

    // Add top Telugu movies
    for (const m of teluguMovies.slice(0, 3)) {
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

    // Add top Telugu series
    for (const s of teluguSeries.slice(0, 2)) {
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

    return items.slice(0, 5);
  }, [teluguMovies, teluguSeries]);

  const handleVodClick = (item: XtreamVODStream) => {
    navigate({ to: '/vod/$vodId', params: { vodId: String(item.stream_id) } });
  };

  const handleSeriesClick = (item: SeriesWithChannel) => {
    navigate({ to: '/series/$seriesId', params: { seriesId: String(item.series_id) } });
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

        {/* Latest Telugu Movies */}
        <ContentRail
          title="Latest Telugu Movies"
          seeAllTo="/language/telugu"
          isLoading={teluguMoviesLoading}
          isEmpty={!teluguMovies.length}
        >
          {teluguMovies.map((item) => (
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

        {/* Telugu Series */}
        <ContentRail
          title="Telugu Series"
          seeAllTo="/language/telugu"
          isLoading={teluguSeriesLoading}
          isEmpty={!teluguSeries.length}
        >
          {teluguSeries.map((item) => (
            <FocusableCard
              key={item.series_id}
              image={item.cover}
              title={item.name}
              subtitle={item.channelName ? `via ${item.channelName}` : (item.genre || undefined)}
              aspectRatio="poster"
              onClick={() => handleSeriesClick(item)}
            />
          ))}
        </ContentRail>

        {/* Latest Hindi Movies */}
        <ContentRail
          title="Latest Hindi Movies"
          seeAllTo="/language/hindi"
          isLoading={hindiMoviesLoading}
          isEmpty={!hindiMovies.length}
        >
          {hindiMovies.map((item) => (
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

        {/* Hindi Series */}
        <ContentRail
          title="Hindi Series"
          seeAllTo="/language/hindi"
          isLoading={hindiSeriesLoading}
          isEmpty={!hindiSeries.length}
        >
          {hindiSeries.map((item) => (
            <FocusableCard
              key={item.series_id}
              image={item.cover}
              title={item.name}
              subtitle={item.channelName ? `via ${item.channelName}` : (item.genre || undefined)}
              aspectRatio="poster"
              onClick={() => handleSeriesClick(item)}
            />
          ))}
        </ContentRail>
      </div>
    </PageTransition>
  );
}
