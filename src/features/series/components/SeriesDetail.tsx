import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useSeriesInfo } from '../api';

import { StarRating } from '@shared/components/StarRating';
import { Badge } from '@shared/components/Badge';
import { Skeleton } from '@shared/components/Skeleton';
import { formatDuration } from '@shared/utils/formatDuration';
import { parseGenres } from '@shared/utils/parseGenres';
import { PlayerPage } from '@features/player/components/PlayerPage';
import { PageTransition } from '@shared/components/PageTransition';

export function SeriesDetail() {
  const { seriesId } = useParams({ from: '/_authenticated/series/$seriesId' });
  const navigate = useNavigate();
  const { data, isLoading } = useSeriesInfo(seriesId);

  const [activeSeason, setActiveSeason] = useState<number | null>(null);
  const [playingEpisodeId, setPlayingEpisodeId] = useState<string | null>(null);
  const [playingEpisodeName, setPlayingEpisodeName] = useState<string>('');
  const [highlightedEpId, setHighlightedEpId] = useState<string | null>(null);

  // Sort seasons descending (latest first for selection, but display ascending)
  const sortedSeasons = useMemo(() => {
    if (!data?.seasons?.length) return [];
    return [...data.seasons].sort((a, b) => a.season_number - b.season_number);
  }, [data?.seasons]);

  // Episodes sorted descending (newest first)
  const episodes = useMemo(() => {
    if (!data?.episodes || activeSeason === null) return [];
    const seasonKey = String(activeSeason);
    const eps = data.episodes[seasonKey] || [];
    return [...eps].sort((a, b) => b.episode_num - a.episode_num);
  }, [data, activeSeason]);

  // Auto-select latest season when data loads
  useEffect(() => {
    if (!sortedSeasons.length || activeSeason !== null) return;

    // Check if user has watch history for this series
    // Default to latest season (highest number)
    const latestSeason = sortedSeasons[sortedSeasons.length - 1];
    if (latestSeason) setActiveSeason(latestSeason.season_number);
  }, [sortedSeasons, activeSeason]);

  // Auto-highlight latest episode (or next unwatched)
  useEffect(() => {
    if (!episodes.length) return;
    // For now, highlight the latest (first in descending list)
    setHighlightedEpId(episodes[0]?.id ?? null);
  }, [episodes]);

  // Keyboard navigation for season tabs
  const handleSeasonKeyDown = (e: React.KeyboardEvent) => {
    const currentIdx = sortedSeasons.findIndex((s) => s.season_number === activeSeason);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = sortedSeasons[Math.min(currentIdx + 1, sortedSeasons.length - 1)];
      if (next) setActiveSeason(next.season_number);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = sortedSeasons[Math.max(currentIdx - 1, 0)];
      if (prev) setActiveSeason(prev.season_number);
    }
  };

  const playEpisode = (ep: (typeof episodes)[0]) => {
    setPlayingEpisodeId(String(ep.id));
    setPlayingEpisodeName(`${data?.info.name} - S${activeSeason}E${ep.episode_num} - ${ep.title}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
            onClick={() => navigate({ to: '/series' })}
            className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm transition-colors min-h-[44px]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
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
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : info.cover ? (
              <img
                src={info.cover}
                alt={info.name}
                className="w-full h-full object-cover blur-sm scale-110"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-obsidian/70 via-transparent to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 px-6 lg:px-10 pb-6">
            <h1 className="font-display text-3xl lg:text-4xl font-bold text-text-primary mb-3">{info.name}</h1>
            <div className="flex items-center gap-3 flex-wrap mb-3">
              {info.rating && <StarRating rating={parseFloat(info.rating)} max={10} size="md" />}
              {info.releaseDate && <span className="text-text-secondary text-sm">{info.releaseDate.slice(0, 4)}</span>}
              <span className="text-text-secondary text-sm">{seasons.length} Season{seasons.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {parseGenres(info.genre).map((g) => (
                <Badge key={g} variant="teal">{g}</Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Inline Player */}
        {playingEpisodeId && (
          <div className="relative mb-6 mx-6 lg:mx-10">
            <button
              onClick={() => setPlayingEpisodeId(null)}
              className="absolute top-3 right-3 z-20 p-2.5 bg-obsidian/80 rounded-full text-text-muted hover:text-text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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
            />
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
            {sortedSeasons.map((season) => (
              <button
                key={season.season_number}
                role="tab"
                aria-selected={activeSeason === season.season_number}
                onClick={() => setActiveSeason(season.season_number)}
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

        {/* Episode count + sort indicator */}
        <div className="px-6 lg:px-10 mb-3">
          <p className="text-text-muted text-xs">
            {episodes.length} episode{episodes.length !== 1 ? 's' : ''} · Newest first
          </p>
        </div>

        {/* Episode List (newest first) */}
        <div className="space-y-2 px-6 lg:px-10">
          {episodes.map((ep) => {
            const isHighlighted = ep.id === highlightedEpId;
            const isPlaying = playingEpisodeId === String(ep.id);

            return (
              <div
                key={ep.id}
                className={`flex gap-4 p-3 lg:p-4 rounded-xl transition-all group cursor-pointer min-h-[80px] ${
                  isPlaying
                    ? 'bg-teal/10 border border-teal/30'
                    : isHighlighted
                      ? 'bg-surface-raised border border-teal/20'
                      : 'bg-surface-raised/50 border border-border-subtle hover:border-teal/20 hover:bg-surface-raised'
                }`}
                onClick={() => playEpisode(ep)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    playEpisode(ep);
                  }
                }}
              >
                {/* Thumbnail */}
                <div className="w-36 lg:w-44 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-surface relative">
                  {ep.info.movie_image ? (
                    <img
                      src={ep.info.movie_image}
                      alt={ep.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-obsidian/40">
                    <svg className="w-10 h-10 text-teal" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  {isPlaying && (
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-teal text-obsidian">
                        ▶ Playing
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-teal text-xs font-mono">E{ep.episode_num}</span>
                    <h4 className="text-sm lg:text-base font-medium text-text-primary truncate">{ep.title}</h4>
                  </div>
                  {ep.info.duration_secs > 0 && (
                    <span className="text-xs text-text-muted mb-1">{formatDuration(ep.info.duration_secs)}</span>
                  )}
                  {ep.info.plot && (
                    <p className="text-xs text-text-secondary line-clamp-2">{ep.info.plot}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}
