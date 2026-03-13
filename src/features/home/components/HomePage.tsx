import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { PageTransition } from '@shared/components/PageTransition';
import { ContentRail } from '@shared/components/ContentRail';
import { FocusableCard } from '@shared/components/FocusableCard';
import { ContinueWatching } from './ContinueWatching';
import { useSpatialContainer, FocusContext, setFocus } from '@shared/hooks/useSpatialNav';
import {
  useLanguageMovieRail,
  useLanguageSeriesRail,
  type SeriesWithChannel,
} from '../api';

import { isNewContent } from '@shared/utils/isNewContent';
import type { XtreamVODStream } from '@shared/types/api';

export function HomePage() {
  const navigate = useNavigate();

  const { ref: contentRef, focusKey } = useSpatialContainer({
    focusKey: 'home-content',
    focusable: false,
    autoRestoreFocus: true,
  });

  // Data hooks -- Telugu & Hindi movies and series
  const { items: teluguMovies, isLoading: teluguMoviesLoading } = useLanguageMovieRail('Telugu');
  const { items: teluguSeries, isLoading: teluguSeriesLoading } = useLanguageSeriesRail('Telugu');
  const { items: hindiMovies, isLoading: hindiMoviesLoading } = useLanguageMovieRail('Hindi');
  const { items: hindiSeries, isLoading: hindiSeriesLoading } = useLanguageSeriesRail('Hindi');

  // Auto-focus first available content after data loads
  const allLoading = teluguMoviesLoading || teluguSeriesLoading || hindiMoviesLoading || hindiSeriesLoading;

  useEffect(() => {
    if (allLoading) return;
    // Data loaded — focus the first available rail
    const timer = setTimeout(() => {
      try { setFocus('rail-continue-watching'); } catch {
        try { setFocus('rail-latest-telugu-movies'); } catch {
          try { setFocus('rail-telugu-series'); } catch { /* noop */ }
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [allLoading]);

  const handleVodClick = (item: XtreamVODStream) => {
    navigate({ to: '/vod/$vodId', params: { vodId: String(item.stream_id) } });
  };

  const handleSeriesClick = (item: SeriesWithChannel) => {
    navigate({ to: '/series/$seriesId', params: { seriesId: String(item.series_id) } });
  };

  return (
    <PageTransition>
      <FocusContext.Provider value={focusKey}>
        <div ref={contentRef} className="space-y-4 pt-4 pb-12">
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
                focusKey={`vod-${item.stream_id}`}
                image={item.stream_icon}
                title={item.name}
                subtitle={item.rating ? `⭐ ${item.rating}` : undefined}
                isNew={isNewContent(item.added)}
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
                focusKey={`series-${item.series_id}`}
                image={item.cover}
                title={item.name}
                subtitle={item.channelName ? `via ${item.channelName}` : (item.genre || undefined)}
                isNew={isNewContent(item.last_modified)}
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
                focusKey={`vod-${item.stream_id}`}
                image={item.stream_icon}
                title={item.name}
                subtitle={item.rating ? `⭐ ${item.rating}` : undefined}
                isNew={isNewContent(item.added)}
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
                focusKey={`series-${item.series_id}`}
                image={item.cover}
                title={item.name}
                subtitle={item.channelName ? `via ${item.channelName}` : (item.genre || undefined)}
                isNew={isNewContent(item.last_modified)}
                aspectRatio="poster"
                onClick={() => handleSeriesClick(item)}
              />
            ))}
          </ContentRail>
        </div>
      </FocusContext.Provider>
    </PageTransition>
  );
}
