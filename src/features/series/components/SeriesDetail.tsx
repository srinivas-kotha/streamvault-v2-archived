import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useSeriesInfo } from '../api';
import { StarRating } from '@shared/components/StarRating';
import { Badge } from '@shared/components/Badge';
import { Skeleton } from '@shared/components/Skeleton';
import { formatDuration } from '@shared/utils/formatDuration';
import { parseGenres } from '@shared/utils/parseGenres';
import { PlayerPage } from '@features/player/components/PlayerPage';

export function SeriesDetail() {
  const { seriesId } = useParams({ from: '/_authenticated/series/$seriesId' });
  const navigate = useNavigate();
  const { data, isLoading } = useSeriesInfo(seriesId);
  const [activeSeason, setActiveSeason] = useState<number>(1);
  const [playingEpisodeId, setPlayingEpisodeId] = useState<string | null>(null);
  const [playingEpisodeName, setPlayingEpisodeName] = useState<string>('');

  const episodes = useMemo(() => {
    if (!data?.episodes) return [];
    const seasonKey = String(activeSeason);
    return data.episodes[seasonKey] || [];
  }, [data, activeSeason]);

  // Auto-set first season when data loads
  useEffect(() => {
    if (data?.seasons?.length) {
      setActiveSeason(data.seasons![0]!.season_number);
    }
  }, [data?.seasons]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  }

  if (!data) return null;
  const { info, seasons } = data;

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => navigate({ to: '/series' })}
        className="flex items-center gap-1 text-text-secondary hover:text-text-primary text-sm mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Series
      </button>

      {/* Hero with backdrop */}
      <div className="relative rounded-xl overflow-hidden mb-6">
        <div className="aspect-[21/9] relative bg-surface">
          {info.backdrop_path?.[0] ? (
            <img src={info.backdrop_path[0]} alt={info.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : info.cover ? (
            <img src={info.cover} alt={info.name} className="w-full h-full object-cover blur-sm scale-110" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="font-display text-3xl font-bold text-text-primary mb-2">{info.name}</h1>
          <div className="flex items-center gap-3 flex-wrap mb-2">
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
        <div className="relative mb-6">
          <button
            onClick={() => setPlayingEpisodeId(null)}
            className="absolute top-3 right-3 z-20 p-2 bg-obsidian/80 rounded-full text-text-muted hover:text-text-primary transition-colors"
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
        <p className="text-text-secondary text-sm leading-relaxed mb-6">{info.plot}</p>
      )}

      {/* Cast/Director */}
      <div className="flex gap-6 mb-6 text-sm">
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
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {seasons.sort((a, b) => a.season_number - b.season_number).map((season) => (
          <button
            key={season.season_number}
            onClick={() => setActiveSeason(season.season_number)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeSeason === season.season_number
                ? 'bg-teal/15 text-teal border border-teal/30'
                : 'bg-surface-raised text-text-secondary border border-border hover:text-text-primary'
            }`}
          >
            {season.name} ({season.episode_count})
          </button>
        ))}
      </div>

      {/* Episode List */}
      <div className="space-y-3">
        {episodes.sort((a, b) => a.episode_num - b.episode_num).map((ep, idx) => (
          <div
            key={ep.id}
            className="flex gap-4 p-3 rounded-lg bg-surface-raised border border-border-subtle hover:border-teal/30 transition-all group cursor-pointer"
            onClick={() => {
              setPlayingEpisodeId(String(ep.id));
              setPlayingEpisodeName(`${info.name} - S${activeSeason}E${ep.episode_num} - ${ep.title}`);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            {/* Thumbnail */}
            <div className="w-40 flex-shrink-0 aspect-video rounded-md overflow-hidden bg-surface relative">
              {ep.info.movie_image ? (
                <img src={ep.info.movie_image} alt={ep.title} className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : null}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-obsidian/40">
                <svg className="w-8 h-8 text-teal" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-text-muted text-xs">E{ep.episode_num}</span>
                <h4 className="text-sm font-medium text-text-primary truncate">{ep.title}</h4>
              </div>
              {ep.info.duration_secs > 0 && (
                <span className="text-xs text-text-muted">{formatDuration(ep.info.duration_secs)}</span>
              )}
              {ep.info.plot && (
                <p className="text-xs text-text-secondary mt-1 line-clamp-2">{ep.info.plot}</p>
              )}
            </div>

            {/* Episode nav */}
            <div className="flex items-center gap-1 self-center opacity-0 group-hover:opacity-100 transition-opacity">
              {idx > 0 && (
                <button className="p-1 rounded text-text-muted hover:text-text-primary" title="Previous episode">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {idx < episodes.length - 1 && (
                <button className="p-1 rounded text-text-muted hover:text-text-primary" title="Next episode">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
