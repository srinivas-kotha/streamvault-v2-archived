import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useSeriesInfo } from '../api';
import { useWatchHistory } from '@features/history/api';
import { StarRating } from '@shared/components/StarRating';
import { Badge } from '@shared/components/Badge';
import { Skeleton } from '@shared/components/Skeleton';
import { formatDuration } from '@shared/utils/formatDuration';
import { parseGenres } from '@shared/utils/parseGenres';
import { PlayerPage } from '@features/player/components/PlayerPage';
import { PageTransition } from '@shared/components/PageTransition';
import { useUIStore } from '@lib/store';
import { useLRUD } from '@shared/hooks/useLRUD';

type EpisodeSortKey = 'latest' | 'oldest' | 'episode';
const EPISODES_PER_PAGE = 50;

function formatEpisodeDate(unixTimestamp: string): string {
  const ts = parseInt(unixTimestamp, 10);
  if (!ts || isNaN(ts)) return '';
  const date = new Date(ts * 1000);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface Episode {
  id: string;
  episode_num: number;
  title: string;
  container_extension: string;
  added: string;
  info: {
    movie_image: string;
    duration_secs: number;
    duration: string;
    plot: string;
  };
  season: number;
  direct_source: string;
}

// A wrapper component for episodes in the list to give them individual LRUD hooks cleanly
function FocusableEpisodeItem({
  ep,
  isPlaying,
  activeRef,
  playEpisode
}: {
  ep: Episode;
  isPlaying: boolean;
  activeRef?: React.RefObject<HTMLDivElement | null>;
  playEpisode: (ep: Episode) => void;
}) {
  const inputMode = useUIStore((s) => s.inputMode);
  const { ref, isFocused, focusProps } = useLRUD({
    id: `series-ep-${ep.id}`,
    parent: 'root',
    onEnter: () => playEpisode(ep),
  });
  
  const showFocus = isFocused && inputMode === 'keyboard';
  const addedDate = formatEpisodeDate(ep.added);

  return (
    <div
      ref={(el: HTMLDivElement | null) => {
        ref(el);
        if (activeRef && isPlaying) activeRef.current = el;
      }}
      {...focusProps}
      className={`flex gap-4 p-3 lg:p-4 rounded-xl transition-all group cursor-pointer min-h-[72px] outline-none ${
        isPlaying
          ? 'bg-teal/10 border border-teal/30'
          : showFocus 
            ? 'bg-surface-raised ring-2 ring-teal ring-offset-1 ring-offset-obsidian border border-teal'
            : 'bg-surface-raised/50 border border-border-subtle hover:border-teal/20 hover:bg-surface-raised'
      }`}
      onClick={() => playEpisode(ep)}
    >
      {/* Thumbnail */}
      <div className="w-28 lg:w-36 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-surface relative">
        {ep.info.movie_image ? (
          <img
            src={ep.info.movie_image}
            alt={ep.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
        )}
        {/* Play icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-obsidian/40">
          <svg className="w-8 h-8 text-teal" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        {isPlaying && (
          <div className="absolute top-1.5 left-1.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal text-obsidian">
              NOW PLAYING
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-teal text-xs font-mono font-bold">
            E{ep.episode_num}
          </span>
          <h4 className="text-sm lg:text-base font-medium text-text-primary truncate">
            {ep.title}
          </h4>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          {ep.info.duration_secs > 0 && (
            <span>{formatDuration(ep.info.duration_secs)}</span>
          )}
          {addedDate && <span>{addedDate}</span>}
        </div>
        {ep.info.plot && (
          <p className="text-xs text-text-secondary line-clamp-1 mt-1">
            {ep.info.plot}
          </p>
        )}
      </div>

      {/* Play button (visible area for touch) */}
      <div className="flex-shrink-0 flex items-center">
        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center group-hover:bg-teal/15 transition-colors">
          <svg
            className="w-5 h-5 text-text-muted group-hover:text-teal transition-colors"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function SeriesDetail() {
  const { seriesId } = useParams({ from: '/_authenticated/series/$seriesId' });
  const navigate = useNavigate();
  const { data, isLoading } = useSeriesInfo(seriesId);
  const { data: watchHistory } = useWatchHistory();

  const [activeSeason, setActiveSeason] = useState<number | null>(null);
  const [playingEpisodeId, setPlayingEpisodeId] = useState<string | null>(null);
  const [playingEpisodeName, setPlayingEpisodeName] = useState<string>('');
  const [resumeStartTime, setResumeStartTime] = useState(0);
  const [episodeSort, setEpisodeSort] = useState<EpisodeSortKey>('latest');
  const [episodeSearch, setEpisodeSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(EPISODES_PER_PAGE);
  const episodeListRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Find the last watched episode for this series from watch history
  const lastWatchedEpisode = useMemo(() => {
    if (!watchHistory) return null;
    const seriesHistory = watchHistory
      .filter((h) => h.content_type === 'series')
      .sort((a, b) => new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime());
    // Find most recent episode from this series (content_id matches episode id)
    return seriesHistory.find((h) => {
      // We match by content_name containing the series name
      if (!data?.info.name) return false;
      return h.content_name?.includes(data.info.name);
    }) ?? null;
  }, [watchHistory, data?.info.name]);

  // Dynamically compute seasons since some API responses omit data.seasons but populate data.episodes
  const computedSeasons = useMemo(() => {
    const seasonsMap = new Map<number, { season_number: number; name: string; episode_count: number }>();
    if (data?.seasons) {
      const explicitSeasons = Array.isArray(data.seasons)
        ? data.seasons
        : (Object.values(data.seasons) as typeof data.seasons);
      explicitSeasons.forEach((s) => {
        if (s && typeof s.season_number === 'number') {
          seasonsMap.set(s.season_number, s);
        }
      });
    }
    if (data?.episodes) {
      Object.keys(data.episodes).forEach((seasonStr) => {
        const sNum = parseInt(seasonStr, 10);
        if (!isNaN(sNum) && !seasonsMap.has(sNum)) {
          const eps = data.episodes[seasonStr];
          if (Array.isArray(eps) && eps.length > 0) {
            seasonsMap.set(sNum, {
              season_number: sNum,
              name: `Season ${sNum}`,
              episode_count: eps.length,
            });
          }
        }
      });
    }
    return Array.from(seasonsMap.values()).sort((a, b) => a.season_number - b.season_number);
  }, [data]);

  // All episodes for active season, sorted
  const allEpisodes = useMemo(() => {
    if (!data?.episodes || activeSeason === null) return [];
    const seasonKey = String(activeSeason);
    const eps = data.episodes[seasonKey] || [];
    const sorted = [...eps];
    switch (episodeSort) {
      case 'latest':
        return sorted.sort((a, b) => {
          const aAdded = parseInt(a.added || '0', 10);
          const bAdded = parseInt(b.added || '0', 10);
          if (aAdded !== bAdded) return bAdded - aAdded;
          return b.episode_num - a.episode_num; // Fallback to descending episode
        });
      case 'oldest':
        return sorted.sort((a, b) => {
          const aAdded = parseInt(a.added || '0', 10);
          const bAdded = parseInt(b.added || '0', 10);
          if (aAdded !== bAdded) return aAdded - bAdded;
          return a.episode_num - b.episode_num; // Fallback to ascending episode
        });
      case 'episode':
        return sorted.sort((a, b) => a.episode_num - b.episode_num);
      default:
        return sorted;
    }
  }, [data, activeSeason, episodeSort]);

  // Apply search filter
  const filteredEpisodes = useMemo(() => {
    if (!episodeSearch.trim()) return allEpisodes;
    const q = episodeSearch.toLowerCase();
    return allEpisodes.filter(
      (ep) =>
        ep.title.toLowerCase().includes(q) ||
        String(ep.episode_num).includes(q)
    );
  }, [allEpisodes, episodeSearch]);

  // Paginated episodes
  const visibleEpisodes = useMemo(
    () => filteredEpisodes.slice(0, visibleCount),
    [filteredEpisodes, visibleCount]
  );

  const hasMore = visibleCount < filteredEpisodes.length;

  // Auto-select latest season when data loads
  useEffect(() => {
    if (!computedSeasons.length || activeSeason !== null) return;
    const latestSeason = computedSeasons[computedSeasons.length - 1];
    if (latestSeason) setActiveSeason(latestSeason.season_number);
  }, [computedSeasons, activeSeason]);

  // Reset visible count when season/sort/search changes
  useEffect(() => {
    setVisibleCount(EPISODES_PER_PAGE);
  }, [activeSeason, episodeSort, episodeSearch]);

  // Determine channel name from category_id
  const channelName = useMemo(() => {
    if (!data?.info) return null;
    // The series info doesn't have category_id directly, but the category_id from the list does.
    // We try to detect it from the series data we have. If not available, return null.
    return null;
  }, [data?.info]);

  // Find current episode index for next/prev navigation
  const currentEpisodeIndex = useMemo(() => {
    if (!playingEpisodeId) return -1;
    return allEpisodes.findIndex((ep) => String(ep.id) === playingEpisodeId);
  }, [playingEpisodeId, allEpisodes]);

  const playEpisode = useCallback(
    (ep: (typeof allEpisodes)[0], startTime = 0) => {
      setPlayingEpisodeId(String(ep.id));
      setPlayingEpisodeName(
        `${data?.info.name || 'Series'} - S${activeSeason}E${ep.episode_num} - ${ep.title}`
      );
      setResumeStartTime(startTime);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [data?.info.name, activeSeason]
  );

  const playNext = useCallback(() => {
    // In "latest first" sort, "next" means the episode below (index + 1)
    const nextIdx = currentEpisodeIndex + 1;
    if (nextIdx < allEpisodes.length) {
      playEpisode(allEpisodes[nextIdx]!);
    }
  }, [currentEpisodeIndex, allEpisodes, playEpisode]);

  const playPrev = useCallback(() => {
    const prevIdx = currentEpisodeIndex - 1;
    if (prevIdx >= 0) {
      playEpisode(allEpisodes[prevIdx]!);
    }
  }, [currentEpisodeIndex, allEpisodes, playEpisode]);

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + EPISODES_PER_PAGE);
  }, []);

  // Season tab keyboard navigation
  const handleSeasonKeyDown = (e: React.KeyboardEvent) => {
    const currentIdx = computedSeasons.findIndex((s) => s.season_number === activeSeason);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = computedSeasons[Math.min(currentIdx + 1, computedSeasons.length - 1)];
      if (next) setActiveSeason(next.season_number);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = computedSeasons[Math.max(currentIdx - 1, 0)];
      if (prev) setActiveSeason(prev.season_number);
    }
  };

  const inputMode = useUIStore((s) => s.inputMode);

  const { ref: backRef, isFocused: backFocused, focusProps: backFocusProps } = useLRUD({
    id: `series-back-${seriesId}`,
    parent: 'root',
    onEnter: () => navigate({ to: '/series' }),
  });

  const { ref: closeRef, isFocused: closeFocused, focusProps: closeFocusProps } = useLRUD({
    id: `series-close-${seriesId}`,
    parent: 'root',
    onEnter: () => setPlayingEpisodeId(null),
  });

  const { ref: loadMoreRef, isFocused: loadMoreFocused, focusProps: loadMoreFocusProps } = useLRUD({
    id: `series-load-more-${seriesId}`,
    parent: 'root',
    onEnter: handleLoadMore,
  });

  const { ref: resumeRef, isFocused: resumeFocused, focusProps: resumeFocusProps } = useLRUD({
    id: `series-resume-${seriesId}`,
    parent: 'root',
    onEnter: () => {
      if (!lastWatchedEpisode) return;
      setPlayingEpisodeId(String(lastWatchedEpisode.content_id));
      setPlayingEpisodeName(lastWatchedEpisode.content_name || data?.info.name || '');
      setResumeStartTime(lastWatchedEpisode.progress_seconds ?? 0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-4 px-6 lg:px-10 pt-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </PageTransition>
    );
  }

  if (!data) return null;
  const { info, seasons } = data;

  return (
    <PageTransition>
      <div className="pb-12">
        {/* Back button */}
        <div className="px-6 lg:px-10 pt-4 mb-4">
          <button
            ref={backRef}
            {...backFocusProps}
            onClick={() => navigate({ to: '/series' })}
            className={`flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors min-h-[44px] rounded-lg px-2 py-1 ${
              backFocused && inputMode === 'keyboard' ? 'ring-2 ring-teal bg-surface-raised' : ''
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Series
          </button>
        </div>

        {/* Hero with backdrop */}
        <div className="relative overflow-hidden mb-6">
          <div className="aspect-[21/9] relative bg-surface max-h-[400px]">
            {info.backdrop_path?.[0] ? (
              <img
                src={info.backdrop_path[0]}
                alt={info.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : info.cover ? (
              <img
                src={info.cover}
                alt={info.name}
                className="w-full h-full object-cover blur-sm scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-obsidian/70 via-transparent to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 px-6 lg:px-10 pb-6">
            <h1 className="font-display text-3xl lg:text-4xl font-bold text-text-primary mb-3">
              {info.name}
            </h1>
            <div className="flex items-center gap-3 flex-wrap mb-3">
              {info.rating && (
                <StarRating rating={parseFloat(info.rating)} max={10} size="md" />
              )}
              {info.releaseDate && (
                <span className="text-text-secondary text-sm">
                  {info.releaseDate.slice(0, 4)}
                </span>
              )}
              <span className="text-text-secondary text-sm">
                {seasons.length} Season{seasons.length !== 1 ? 's' : ''}
              </span>
              {channelName && (
                <Badge variant="default">{channelName}</Badge>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {parseGenres(info.genre).map((g) => (
                <Badge key={g} variant="teal">
                  {g}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Inline Player */}
        {playingEpisodeId && (
          <div className="relative mb-6 mx-6 lg:mx-10">
            <button
              ref={closeRef}
              {...closeFocusProps}
              onClick={() => setPlayingEpisodeId(null)}
              className={`absolute top-3 right-3 z-20 p-2.5 bg-obsidian/80 rounded-full text-text-muted hover:text-text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                closeFocused && inputMode === 'keyboard' ? 'ring-2 ring-teal bg-teal/20 text-text-primary' : ''
              }`}
              title="Close player"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <PlayerPage
              streamType="series"
              streamId={playingEpisodeId}
              streamName={playingEpisodeName}
              startTime={resumeStartTime}
              hasNext={currentEpisodeIndex < allEpisodes.length - 1}
              hasPrev={currentEpisodeIndex > 0}
              onNext={playNext}
              onPrev={playPrev}
              onClose={() => setPlayingEpisodeId(null)}
            />
          </div>
        )}

        {/* Resume Banner */}
        {lastWatchedEpisode && !playingEpisodeId && (
          <div className="mx-6 lg:mx-10 mb-6">
            <button
              ref={resumeRef}
              {...resumeFocusProps}
              onClick={() => {
                setPlayingEpisodeId(String(lastWatchedEpisode.content_id));
                setPlayingEpisodeName(lastWatchedEpisode.content_name || info.name);
                setResumeStartTime(lastWatchedEpisode.progress_seconds ?? 0);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-teal/10 to-indigo/10 border border-teal/20 hover:border-teal/40 transition-all group ${
                resumeFocused && inputMode === 'keyboard' ? 'ring-2 ring-teal ring-offset-2 ring-offset-obsidian' : ''
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 group-hover:bg-teal/30 transition-colors">
                <svg className="w-6 h-6 text-teal" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-text-primary text-sm font-medium truncate">
                  Resume: {lastWatchedEpisode.content_name}
                </p>
                <p className="text-text-muted text-xs">
                  {lastWatchedEpisode.progress_seconds > 0 &&
                    lastWatchedEpisode.duration_seconds > 0 && (
                      <>
                        {formatDuration(lastWatchedEpisode.progress_seconds)} /{' '}
                        {formatDuration(lastWatchedEpisode.duration_seconds)} watched
                      </>
                    )}
                </p>
              </div>
              <div className="flex-shrink-0">
                {lastWatchedEpisode.progress_seconds > 0 &&
                  lastWatchedEpisode.duration_seconds > 0 && (
                    <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal rounded-full"
                        style={{
                          width: `${Math.min(
                            (lastWatchedEpisode.progress_seconds /
                              lastWatchedEpisode.duration_seconds) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  )}
              </div>
            </button>
          </div>
        )}

        {/* Plot */}
        {info.plot && (
          <p className="text-text-secondary text-sm lg:text-base leading-relaxed mb-6 px-6 lg:px-10 max-w-3xl">
            {info.plot}
          </p>
        )}

        {/* Cast/Director */}
        <div className="flex gap-6 mb-6 text-sm px-6 lg:px-10">
          {info.director && (
            <div>
              <span className="text-text-muted">Director: </span>
              <span className="text-text-primary">{info.director}</span>
            </div>
          )}
          {info.cast && (
            <div className="truncate max-w-md">
              <span className="text-text-muted">Cast: </span>
              <span className="text-text-secondary">{info.cast}</span>
            </div>
          )}
        </div>

        {/* Season Tabs */}
        <div className="px-6 lg:px-10 mb-4">
          <div
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-2"
            onKeyDown={handleSeasonKeyDown}
            role="tablist"
          >
            {computedSeasons.map((season) => (
              <button
                key={season.season_number}
                role="tab"
                aria-selected={activeSeason === season.season_number}
                onClick={() => {
                  setActiveSeason(season.season_number);
                  setEpisodeSearch('');
                }}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all min-h-[44px] ${
                  activeSeason === season.season_number
                    ? 'bg-teal/15 text-teal border border-teal/30'
                    : 'bg-surface-raised text-text-secondary border border-border hover:text-text-primary hover:border-teal/20'
                }`}
              >
                {season.name} ({season.episode_count})
              </button>
            ))}
          </div>
        </div>

        {/* Episode Controls: Search + Sort + Count */}
        <div className="px-6 lg:px-10 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Episode search */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search episodes..."
                value={episodeSearch}
                onChange={(e) => setEpisodeSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-raised border border-border rounded-lg text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal-dim transition-all"
              />
              {episodeSearch && (
                <button
                  onClick={() => setEpisodeSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Sort pills */}
            <div className="flex gap-1.5">
              {(
                [
                  { key: 'latest', label: 'Latest First' },
                  { key: 'oldest', label: 'Oldest First' },
                  { key: 'episode', label: 'Episode #' },
                ] as { key: EpisodeSortKey; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setEpisodeSort(opt.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    episodeSort === opt.key
                      ? 'bg-teal/15 text-teal'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Count */}
            <span className="text-text-muted text-xs ml-auto">
              {filteredEpisodes.length} episode{filteredEpisodes.length !== 1 ? 's' : ''}
              {episodeSearch && ` matching "${episodeSearch}"`}
            </span>
          </div>
        </div>

        {/* Episode List */}
        <div ref={episodeListRef} className="space-y-2 px-6 lg:px-10">
          {visibleEpisodes.length === 0 && episodeSearch ? (
            <div className="py-12 text-center">
              <p className="text-text-muted text-sm">
                No episodes matching "{episodeSearch}"
              </p>
            </div>
          ) : (
            visibleEpisodes.map((ep) => {
              const isPlaying = playingEpisodeId === String(ep.id);
              return (
                <FocusableEpisodeItem
                  key={ep.id}
                  ep={ep}
                  isPlaying={isPlaying}
                  activeRef={highlightRef}
                  playEpisode={playEpisode}
                />
              );
            })
          )}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="px-6 lg:px-10 mt-4">
            <button
              ref={loadMoreRef}
              {...loadMoreFocusProps}
              onClick={handleLoadMore}
              className={`w-full py-3 rounded-xl border text-sm font-medium transition-all ${
                loadMoreFocused && inputMode === 'keyboard' 
                  ? 'bg-surface-raised ring-2 ring-teal ring-offset-2 ring-offset-obsidian text-text-primary' 
                  : 'bg-surface-raised border-border text-text-secondary hover:border-teal/20 hover:text-text-primary'
              }`}
            >
              Load More ({filteredEpisodes.length - visibleCount} remaining)
            </button>
          </div>
        )}

        {/* Total episodes info */}
        {filteredEpisodes.length > EPISODES_PER_PAGE && (
          <div className="px-6 lg:px-10 mt-3">
            <p className="text-text-muted text-xs text-center">
              Showing {Math.min(visibleCount, filteredEpisodes.length)} of{' '}
              {filteredEpisodes.length} episodes
            </p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
