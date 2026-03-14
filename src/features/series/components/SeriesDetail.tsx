import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useSeriesInfo } from '../api';
import { useWatchHistory } from '@features/history/api';
import { StarRating } from '@shared/components/StarRating';
import { Badge } from '@shared/components/Badge';
import { Skeleton } from '@shared/components/Skeleton';
import { formatDuration } from '@shared/utils/formatDuration';
import { parseGenres } from '@shared/utils/parseGenres';
import { PageTransition } from '@shared/components/PageTransition';
import { usePlayerStore } from '@lib/store';
import { useSpatialFocusable, useSpatialContainer, FocusContext, setFocus } from '@shared/hooks/useSpatialNav';

type EpisodeSortKey = 'latest' | 'oldest' | 'episode';
const EPISODES_PER_PAGE = 50;

/** Focusable season tab — extracted for spatial navigation */
function FocusableSeasonTab({ seasonNumber, name, episodeCount, isActive, onSelect }: {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: `series-season-${seasonNumber}`,
    onEnterPress: onSelect,
  });

  return (
    <button
      ref={ref}
      {...focusProps}
      role="tab"
      aria-selected={isActive}
      onClick={onSelect}
      className={`px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all min-h-[44px] ${
        isActive
          ? 'bg-teal/15 text-teal border border-teal/30'
          : 'bg-surface-raised text-text-secondary border border-border hover:text-text-primary hover:border-teal/20'
      } ${showFocusRing ? 'ring-2 ring-teal ring-offset-1 ring-offset-obsidian' : ''}`}
    >
      {name} ({episodeCount})
    </button>
  );
}

/** Focusable search input — Enter activates typing, arrows blur back to spatial nav */
function FocusableSearchInput({ value, onChange, seriesId }: {
  value: string;
  onChange: (v: string) => void;
  seriesId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: `series-search-${seriesId}`,
    onEnterPress: () => inputRef.current?.focus(),
  });

  return (
    <div
      ref={ref}
      {...focusProps}
      className={`relative flex-1 min-w-[180px] max-w-xs rounded-lg ${
        showFocusRing ? 'ring-2 ring-teal ring-offset-1 ring-offset-obsidian' : ''
      }`}
    >
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
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
        placeholder="Search episodes..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 bg-surface-raised border border-border rounded-lg text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal-dim transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

/** Focusable sort pill — Enter toggles sort mode */
function FocusableSortPill({ sortKey, label, isActive, onSelect, seriesId }: {
  sortKey: EpisodeSortKey;
  label: string;
  isActive: boolean;
  onSelect: () => void;
  seriesId: string;
}) {
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: `series-sort-${sortKey}-${seriesId}`,
    onEnterPress: onSelect,
  });

  return (
    <button
      ref={ref}
      {...focusProps}
      onClick={onSelect}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        isActive ? 'bg-teal/15 text-teal' : 'text-text-muted hover:text-text-secondary'
      } ${showFocusRing ? 'ring-2 ring-teal ring-offset-1 ring-offset-obsidian' : ''}`}
    >
      {label}
    </button>
  );
}

/** Extracted so useSpatialFocusable only runs when the button is actually mounted */
function ResumeButton({ seriesId, episode, seriesName, onResume }: {
  seriesId: string;
  episode: { content_id: number; content_name: string | null; progress_seconds: number; duration_seconds: number };
  seriesName: string;
  onResume: (contentId: number, contentName: string, progressSeconds: number) => void;
}) {
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: `series-resume-${seriesId}`,
    onEnterPress: () => onResume(episode.content_id, episode.content_name || seriesName, episode.progress_seconds ?? 0),
  });

  return (
    <div className="mx-6 lg:mx-10 mb-6">
      <button
        ref={ref}
        {...focusProps}
        onClick={() => onResume(episode.content_id, episode.content_name || seriesName, episode.progress_seconds ?? 0)}
        className={`w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-teal/10 to-indigo/10 border border-teal/20 hover:border-teal/40 transition-all group ${
          showFocusRing ? 'ring-2 ring-teal ring-offset-2 ring-offset-obsidian' : ''
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 group-hover:bg-teal/30 transition-colors">
          <svg className="w-6 h-6 text-teal" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-text-primary text-sm font-medium truncate">
            Resume: {episode.content_name}
          </p>
          <p className="text-text-muted text-xs">
            {episode.progress_seconds > 0 && episode.duration_seconds > 0 && (
              <>
                {formatDuration(episode.progress_seconds)} / {formatDuration(episode.duration_seconds)} watched
              </>
            )}
          </p>
        </div>
        <div className="flex-shrink-0">
          {episode.progress_seconds > 0 && episode.duration_seconds > 0 && (
            <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-teal rounded-full"
                style={{ width: `${Math.min((episode.progress_seconds / episode.duration_seconds) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

/** Extracted so useSpatialFocusable only runs when the button is actually mounted */
function LoadMoreButton({ seriesId, remaining, onLoadMore }: {
  seriesId: string;
  remaining: number;
  onLoadMore: () => void;
}) {
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: `series-load-more-${seriesId}`,
    onEnterPress: onLoadMore,
  });

  return (
    <div className="px-6 lg:px-10 mt-4">
      <button
        ref={ref}
        {...focusProps}
        onClick={onLoadMore}
        className={`w-full py-3 rounded-xl border text-sm font-medium transition-all ${
          showFocusRing
            ? 'bg-surface-raised ring-2 ring-teal ring-offset-2 ring-offset-obsidian text-text-primary'
            : 'bg-surface-raised border-border text-text-secondary hover:border-teal/20 hover:text-text-primary'
        }`}
      >
        Load More ({remaining} remaining)
      </button>
    </div>
  );
}

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

// A wrapper component for episodes in the list to give them individual spatial nav hooks cleanly
function FocusableEpisodeItem({
  ep,
  isPlaying,
  activeRef,
  playEpisode,
}: {
  ep: Episode;
  isPlaying: boolean;
  activeRef?: React.RefObject<HTMLDivElement | null>;
  playEpisode: (ep: Episode) => void;
}) {
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: `series-ep-${ep.id}`,
    onEnterPress: () => playEpisode(ep),
    onFocus: (layout) => {
      layout.node?.scrollIntoView({ behavior: 'instant', block: 'nearest' });
    },
  });

  const addedDate = formatEpisodeDate(ep.added);

  return (
    <div
      ref={(el: HTMLDivElement | null) => {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
        if (activeRef && isPlaying) activeRef.current = el;
      }}
      {...focusProps}
      className={`flex gap-4 p-3 lg:p-4 rounded-xl transition-all group cursor-pointer min-h-[72px] outline-none ${
        isPlaying
          ? 'bg-teal/10 border border-teal/30'
          : showFocusRing
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
  const [episodeSort, setEpisodeSort] = useState<EpisodeSortKey>('latest');
  const [episodeSearch, setEpisodeSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(EPISODES_PER_PAGE);
  const episodeListRef = useRef<HTMLDivElement>(null);


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

  const playSeries = usePlayerStore((s) => s.playSeries);

  // Build episode list for next/prev navigation (in display order)
  const episodeEntries = useMemo(() => {
    return allEpisodes.map((ep) => ({
      id: String(ep.id),
      name: `${data?.info.name || 'Series'} - S${activeSeason}E${ep.episode_num} - ${ep.title}`,
    }));
  }, [allEpisodes, data?.info.name, activeSeason]);

  const playEpisode = useCallback(
    (ep: (typeof allEpisodes)[0], startTime = 0) => {
      const name = `${data?.info.name || 'Series'} - S${activeSeason}E${ep.episode_num} - ${ep.title}`;
      const epIndex = allEpisodes.findIndex((e) => e.id === ep.id);
      playSeries(String(ep.id), 'series', name, seriesId, activeSeason ?? 1, epIndex, startTime, episodeEntries);
    },
    [data?.info.name, activeSeason, playSeries, seriesId, allEpisodes, episodeEntries]
  );


  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + EPISODES_PER_PAGE);
  }, []);

  const { ref: contentRef, focusKey: contentFocusKey } = useSpatialContainer({
    focusKey: `series-content-${seriesId}`,
    focusable: true,
    saveLastFocusedChild: true,
  });

  const { ref: actionsRef, focusKey: actionsFocusKey } = useSpatialContainer({
    focusKey: `series-actions-${seriesId}`,
    isFocusBoundary: true,
    focusBoundaryDirections: ['left', 'right'],
  });

  const { ref: controlsRef, focusKey: controlsFocusKey } = useSpatialContainer({
    focusKey: `series-controls-${seriesId}`,
    isFocusBoundary: true,
    focusBoundaryDirections: ['left', 'right'],
  });

  const { ref: episodesRef, focusKey: episodesFocusKey } = useSpatialContainer({
    focusKey: `series-episodes-${seriesId}`,
    isFocusBoundary: true,
    focusBoundaryDirections: ['left', 'right'],
  });

  const { ref: backRef, showFocusRing: backFocusRing, focusProps: backFocusProps } = useSpatialFocusable({
    focusKey: `series-back-${seriesId}`,
    onEnterPress: () => navigate({ to: '/series' }),
  });

  // Auto-focus: try specific targets, then fall back to SN:ROOT which finds any focusable
  useEffect(() => {
    if (!isLoading && data) {
      const tryFocus = () => {
        try { setFocus(`series-resume-${seriesId}`); return; } catch { /* not mounted */ }
        if (computedSeasons.length > 0 && computedSeasons[0]) {
          try { setFocus(`series-season-${computedSeasons[0].season_number}`); return; } catch { /* noop */ }
        }
        try { setFocus(`series-back-${seriesId}`); return; } catch { /* noop */ }
        // Final fallback: let norigin find any registered focusable
        try { setFocus('SN:ROOT'); } catch { /* noop */ }
      };
      // Try at 200ms, retry at 500ms if focus is still none
      const t1 = setTimeout(tryFocus, 200);
      const t2 = setTimeout(tryFocus, 500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [isLoading, data, seriesId, computedSeasons]);

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

  if (!data || !data.info || Array.isArray(data.info) || !data.info.name) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">Content unavailable. The provider may be temporarily down.</p>
        <button onClick={() => navigate({ to: '/series' })} className="mt-4 px-4 py-2 bg-teal/15 text-teal rounded-lg text-sm hover:bg-teal/25 transition-colors">
          Back to Series
        </button>
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
            {/* Back button */}
            <div className="px-6 lg:px-10 pt-4 mb-4">
              <button
                ref={backRef}
                {...backFocusProps}
                onClick={() => navigate({ to: '/series' })}
                className={`flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors min-h-[44px] rounded-lg px-2 py-1 ${
                  backFocusRing ? 'ring-2 ring-teal bg-surface-raised' : ''
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

            {/* Resume Banner — extracted to avoid conditional useSpatialFocusable anti-pattern */}
            {lastWatchedEpisode && (
              <ResumeButton
                seriesId={seriesId}
                episode={lastWatchedEpisode}
                seriesName={info.name}
                onResume={(contentId, contentName, progressSeconds) => {
                  const epIndex = allEpisodes.findIndex((e) => String(e.id) === String(contentId));
                  playSeries(String(contentId), 'series', contentName, seriesId, activeSeason ?? 1, Math.max(epIndex, 0), progressSeconds, episodeEntries);
                }}
              />
            )}
            </div>
          </FocusContext.Provider>

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

          {/* Season Tabs + Episode Controls — wrapped in spatial container */}
          <FocusContext.Provider value={controlsFocusKey}>
            <div ref={controlsRef}>
              {/* Season Tabs */}
              <div className="px-6 lg:px-10 mb-4">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2" role="tablist">
                  {computedSeasons.map((season) => (
                    <FocusableSeasonTab
                      key={season.season_number}
                      seasonNumber={season.season_number}
                      name={season.name}
                      episodeCount={season.episode_count}
                      isActive={activeSeason === season.season_number}
                      onSelect={() => {
                        setActiveSeason(season.season_number);
                        setEpisodeSearch('');
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Episode Controls: Search + Sort + Count */}
              <div className="px-6 lg:px-10 mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <FocusableSearchInput
                    value={episodeSearch}
                    onChange={setEpisodeSearch}
                    seriesId={seriesId}
                  />

                  {/* Sort pills */}
                  <div className="flex gap-1.5">
                    {(
                      [
                        { key: 'latest', label: 'Latest First' },
                        { key: 'oldest', label: 'Oldest First' },
                        { key: 'episode', label: 'Episode #' },
                      ] as { key: EpisodeSortKey; label: string }[]
                    ).map((opt) => (
                      <FocusableSortPill
                        key={opt.key}
                        sortKey={opt.key}
                        label={opt.label}
                        isActive={episodeSort === opt.key}
                        onSelect={() => setEpisodeSort(opt.key)}
                        seriesId={seriesId}
                      />
                    ))}
                  </div>

                  {/* Count */}
                  <span className="text-text-muted text-xs ml-auto">
                    {filteredEpisodes.length} episode{filteredEpisodes.length !== 1 ? 's' : ''}
                    {episodeSearch && ` matching "${episodeSearch}"`}
                  </span>
                </div>
              </div>
            </div>
          </FocusContext.Provider>

          {/* Episode List */}
          <FocusContext.Provider value={episodesFocusKey}>
            <div ref={(el: HTMLDivElement | null) => {
              (episodesRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
              episodeListRef.current = el;
            }} className="space-y-2 px-6 lg:px-10">
              {visibleEpisodes.length === 0 && episodeSearch ? (
                <div className="py-12 text-center">
                  <p className="text-text-muted text-sm">
                    No episodes matching "{episodeSearch}"
                  </p>
                </div>
              ) : (
                visibleEpisodes.map((ep) => (
                    <FocusableEpisodeItem
                      key={ep.id}
                      ep={ep}
                      isPlaying={false}
                      playEpisode={playEpisode}
                    />
                ))
              )}
            </div>
          </FocusContext.Provider>

          {/* Load More — extracted to avoid conditional useSpatialFocusable anti-pattern */}
          {hasMore && (
            <LoadMoreButton
              seriesId={seriesId}
              remaining={filteredEpisodes.length - visibleCount}
              onLoadMore={handleLoadMore}
            />
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
      </FocusContext.Provider>
    </PageTransition>
  );
}
