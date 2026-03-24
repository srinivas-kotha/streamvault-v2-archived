import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from '@tanstack/react-router';
import { useSeriesInfo } from '../api';
import { useWatchHistory } from '@features/history/api';
import { Skeleton } from '@shared/components/Skeleton';
import { PageTransition } from '@shared/components/PageTransition';
import { usePlayerStore } from '@lib/store';
import type { EpisodeEntry } from '@lib/store';
import { useSpatialFocusable, useSpatialContainer, FocusContext, setFocus, doesFocusableExist } from '@shared/hooks/useSpatialNav';
import { SeriesDetailHero } from './SeriesDetailHero';
import { EpisodeControls } from './EpisodeControls';
import { FocusableEpisodeItem } from './EpisodeItem';
import type { Episode } from './EpisodeItem';
import { FocusableSeasonTab, ResumeButton, LoadMoreButton } from './SeriesDetailSubComponents';

type EpisodeSortKey = 'latest' | 'oldest' | 'episode';

export const EPISODES_PER_PAGE = 50;

export function SeriesDetail() {
  const { seriesId } = useParams({ from: '/_authenticated/series/$seriesId' });
  const router = useRouter();
  const goBack = () => router.history.back();
  const { data, isLoading } = useSeriesInfo(seriesId);
  const { data: watchHistory } = useWatchHistory();
  const playSeries = usePlayerStore((s) => s.playSeries);

  const [activeSeason, setActiveSeason] = useState<number | null>(null);
  const [episodeSort, setEpisodeSort] = useState<EpisodeSortKey>('episode');
  const [episodeSearch, setEpisodeSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(EPISODES_PER_PAGE);
  const episodeListRef = useRef<HTMLDivElement>(null);

  const lastWatchedEpisode = useMemo(() => {
    if (!watchHistory) return null;
    const sorted = watchHistory
      .filter((h) => h.content_type === 'series')
      .sort((a, b) => new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime());
    return sorted.find((h) => data?.info.name && h.content_name?.includes(data.info.name)) ?? null;
  }, [watchHistory, data?.info.name]);

  const computedSeasons = useMemo(() => {
    const map = new Map<number, { season_number: number; name: string; episode_count: number }>();
    if (data?.seasons) {
      const list = Array.isArray(data.seasons) ? data.seasons : (Object.values(data.seasons) as typeof data.seasons);
      list.forEach((s) => { if (s && typeof s.season_number === 'number') map.set(s.season_number, s); });
    }
    if (data?.episodes) {
      Object.keys(data.episodes).forEach((sStr) => {
        const sNum = parseInt(sStr, 10);
        if (!isNaN(sNum) && !map.has(sNum)) {
          const eps = data.episodes[sStr];
          if (Array.isArray(eps) && eps.length > 0) map.set(sNum, { season_number: sNum, name: `Season ${sNum}`, episode_count: eps.length });
        }
      });
    }
    return Array.from(map.values()).sort((a, b) => a.season_number - b.season_number);
  }, [data]);

  const allEpisodes = useMemo(() => {
    if (!data?.episodes || activeSeason === null) return [];
    const eps = [...(data.episodes[String(activeSeason)] || [])];
    switch (episodeSort) {
      case 'latest': return eps.sort((a, b) => { const d = parseInt(b.added || '0', 10) - parseInt(a.added || '0', 10); return d !== 0 ? d : b.episode_num - a.episode_num; });
      case 'oldest': return eps.sort((a, b) => { const d = parseInt(a.added || '0', 10) - parseInt(b.added || '0', 10); return d !== 0 ? d : a.episode_num - b.episode_num; });
      default: return eps.sort((a, b) => a.episode_num - b.episode_num);
    }
  }, [data, activeSeason, episodeSort]);

  const filteredEpisodes = useMemo(() => {
    if (!episodeSearch.trim()) return allEpisodes;
    const q = episodeSearch.toLowerCase();
    return allEpisodes.filter((ep) => ep.title.toLowerCase().includes(q) || String(ep.episode_num).includes(q));
  }, [allEpisodes, episodeSearch]);

  const visibleEpisodes = useMemo(() => filteredEpisodes.slice(0, visibleCount), [filteredEpisodes, visibleCount]);
  const hasMore = visibleCount < filteredEpisodes.length;

  useEffect(() => {
    if (!computedSeasons.length || activeSeason !== null) return;
    const first = computedSeasons[0];
    if (first) setActiveSeason(first.season_number);
  }, [computedSeasons, activeSeason]);

  useEffect(() => { setVisibleCount(EPISODES_PER_PAGE); }, [activeSeason, episodeSort, episodeSearch]);

  const playEpisode = useCallback(
    (ep: Episode, startTime = 0) => {
      const name = `${data?.info.name || 'Series'} - S${activeSeason}E${ep.episode_num} - ${ep.title}`;
      const epIndex = allEpisodes.findIndex((e) => e.id === ep.id);
      const episodeList: EpisodeEntry[] = allEpisodes.map((e) => ({
        id: String(e.id),
        name: `${data?.info.name || 'Series'} - S${activeSeason}E${e.episode_num} - ${e.title}`,
      }));
      playSeries(String(ep.id), 'series', name, seriesId, activeSeason ?? 1, epIndex, startTime, episodeList);
    },
    [data?.info.name, activeSeason, allEpisodes, seriesId, playSeries]
  );

  const handleLoadMore = useCallback(() => setVisibleCount((prev) => prev + EPISODES_PER_PAGE), []);

  const { ref: contentRef, focusKey: contentFocusKey } = useSpatialContainer({ focusKey: `series-content-${seriesId}`, focusable: false, saveLastFocusedChild: true });
  const { ref: actionsRef, focusKey: actionsFocusKey } = useSpatialContainer({ focusKey: `series-actions-${seriesId}`, isFocusBoundary: true, focusBoundaryDirections: ['left', 'right'] });
  const { ref: controlsRef, focusKey: controlsFocusKey } = useSpatialContainer({ focusKey: `series-controls-${seriesId}`, isFocusBoundary: true, focusBoundaryDirections: ['left', 'right'] });
  const { ref: episodesRef, focusKey: episodesFocusKey } = useSpatialContainer({ focusKey: `series-episodes-${seriesId}`, isFocusBoundary: true, focusBoundaryDirections: ['left', 'right'] });
  const { ref: backRef, showFocusRing: backFocusRing, focusProps: backFocusProps } = useSpatialFocusable({ focusKey: `series-back-${seriesId}`, onEnterPress: goBack });

  useEffect(() => {
    if (!isLoading && data) {
      const tryFocus = () => {
        const rk = `series-resume-${seriesId}`;
        if (doesFocusableExist(rk)) { setFocus(rk); return; }
        if (computedSeasons[0]) { const sk = `series-season-${computedSeasons[0].season_number}`; if (doesFocusableExist(sk)) { setFocus(sk); return; } }
        const bk = `series-back-${seriesId}`;
        if (doesFocusableExist(bk)) { setFocus(bk); return; }
        try { setFocus('SN:ROOT'); } catch { /* noop */ }
      };
      const t1 = setTimeout(tryFocus, 200);
      const t2 = setTimeout(tryFocus, 500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [isLoading, data, seriesId, computedSeasons]);

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-4 pt-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </PageTransition>
    );
  }

  if (!data || !data.info || Array.isArray(data.info) || !data.info.name) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">Content unavailable. The provider may be temporarily down.</p>
        <button onClick={goBack} className="mt-4 px-4 py-2 bg-teal/15 text-teal rounded-lg text-sm hover:bg-teal/25 transition-colors">Go Back</button>
      </div>
    );
  }

  const { info, seasons } = data;

  return (
    <PageTransition>
      <FocusContext.Provider value={contentFocusKey}>
        <div ref={contentRef} className="pb-12">
          <FocusContext.Provider value={actionsFocusKey}>
            <div ref={actionsRef}>
              <div className="pt-4 mb-4">
                <button ref={backRef} {...backFocusProps} onClick={goBack}
                  className={`flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors min-h-[44px] rounded-lg px-2 py-1 ${backFocusRing ? 'ring-2 ring-teal bg-surface-raised' : ''}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  Back to Series
                </button>
              </div>
              <SeriesDetailHero info={info} seasonsCount={seasons.length} channelName={null} />
              {lastWatchedEpisode && (
                <ResumeButton
                  seriesId={seriesId}
                  episode={lastWatchedEpisode}
                  seriesName={info.name}
                  onResume={(contentId, contentName, progressSeconds) => {
                    const ep = allEpisodes.find((e) => String(e.id) === String(contentId));
                    if (ep) { playEpisode(ep, progressSeconds); return; }
                    const epIdx = Math.max(allEpisodes.findIndex((e) => String(e.id) === String(contentId)), 0);
                    const epList: EpisodeEntry[] = allEpisodes.map((e) => ({ id: String(e.id), name: `${info.name} - S${activeSeason}E${e.episode_num} - ${e.title}` }));
                    playSeries(String(contentId), 'series', contentName, seriesId, activeSeason ?? 1, epIdx, progressSeconds, epList);
                  }}
                />
              )}
            </div>
          </FocusContext.Provider>

          {info.plot && <p className="text-text-secondary text-sm lg:text-base leading-relaxed mb-6 max-w-3xl">{info.plot}</p>}

          <div className="flex gap-6 mb-6 text-sm">
            {info.director && <div><span className="text-text-muted">Director: </span><span className="text-text-primary">{info.director}</span></div>}
            {info.cast && <div className="truncate max-w-md"><span className="text-text-muted">Cast: </span><span className="text-text-secondary">{info.cast}</span></div>}
          </div>

          <FocusContext.Provider value={controlsFocusKey}>
            <div ref={controlsRef}>
              <div className="mb-4">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2" role="tablist">
                  {computedSeasons.map((season) => (
                    <FocusableSeasonTab
                      key={season.season_number}
                      seasonNumber={season.season_number}
                      name={season.name}
                      episodeCount={season.episode_count}
                      isActive={activeSeason === season.season_number}
                      onSelect={() => { setActiveSeason(season.season_number); setEpisodeSearch(''); }}
                    />
                  ))}
                </div>
              </div>
              <EpisodeControls
                seriesId={seriesId}
                episodeSearch={episodeSearch}
                onSearchChange={setEpisodeSearch}
                episodeSort={episodeSort}
                onSortChange={setEpisodeSort}
                episodeCount={filteredEpisodes.length}
              />
            </div>
          </FocusContext.Provider>

          <FocusContext.Provider value={episodesFocusKey}>
            <div
              ref={(el: HTMLDivElement | null) => {
                (episodesRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                episodeListRef.current = el;
              }}
              className="space-y-2"
            >
              {visibleEpisodes.length === 0 && episodeSearch ? (
                <div className="py-12 text-center"><p className="text-text-muted text-sm">No episodes matching "{episodeSearch}"</p></div>
              ) : (
                visibleEpisodes.map((ep) => (
                  <FocusableEpisodeItem key={ep.id} ep={ep} isPlaying={false} playEpisode={playEpisode} />
                ))
              )}
            </div>
          </FocusContext.Provider>

          {hasMore && <LoadMoreButton seriesId={seriesId} remaining={filteredEpisodes.length - visibleCount} onLoadMore={handleLoadMore} />}

          {filteredEpisodes.length > EPISODES_PER_PAGE && (
            <div className="mt-3">
              <p className="text-text-muted text-xs text-center">
                Showing {Math.min(visibleCount, filteredEpisodes.length)} of {filteredEpisodes.length} episodes
              </p>
            </div>
          )}
        </div>
      </FocusContext.Provider>
    </PageTransition>
  );
}
