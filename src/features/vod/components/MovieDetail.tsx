import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useVODInfo } from '../api';
import { StarRating } from '@shared/components/StarRating';
import { Badge } from '@shared/components/Badge';
import { Button } from '@shared/components/Button';
import { Skeleton } from '@shared/components/Skeleton';
import { formatDuration } from '@shared/utils/formatDuration';
import { parseGenres } from '@shared/utils/parseGenres';
import { PlayerPage } from '@features/player/components/PlayerPage';

export function MovieDetail() {
  const { vodId } = useParams({ from: '/_authenticated/vod/$vodId' });
  const navigate = useNavigate();
  const { data, isLoading } = useVODInfo(vodId);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!data) return null;
  const { info, movie_data } = data;

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => navigate({ to: '/vod' })}
        className="flex items-center gap-1 text-text-secondary hover:text-text-primary text-sm mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Movies
      </button>

      {/* Inline Player */}
      {isPlayerOpen && (
        <div className="relative mb-6">
          <button
            onClick={() => setIsPlayerOpen(false)}
            className="absolute top-3 right-3 z-20 p-2 bg-obsidian/80 rounded-full text-text-muted hover:text-text-primary transition-colors"
            title="Close player"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <PlayerPage
            streamType="vod"
            streamId={vodId}
            streamName={info.name}
          />
        </div>
      )}

      {/* Hero */}
      <div className="relative rounded-xl overflow-hidden mb-6">
        <div className="aspect-[21/9] relative">
          <img
            src={info.movie_image}
            alt={info.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="font-display text-3xl font-bold text-text-primary mb-2">{info.name}</h1>
          {info.o_name && info.o_name !== info.name && (
            <p className="text-text-muted text-sm mb-2">{info.o_name}</p>
          )}
          <div className="flex items-center gap-3 flex-wrap mb-3">
            {info.rating && <StarRating rating={parseFloat(info.rating)} max={10} size="md" />}
            {info.releaseDate && <span className="text-text-secondary text-sm">{info.releaseDate.slice(0, 4)}</span>}
            {info.duration_secs > 0 && <span className="text-text-secondary text-sm">{formatDuration(info.duration_secs)}</span>}
            {movie_data.container_extension && (
              <Badge>{movie_data.container_extension.toUpperCase()}</Badge>
            )}
          </div>
          <div className="flex gap-2 flex-wrap mb-3">
            {parseGenres(info.genre).map((g) => (
              <Badge key={g} variant="teal">{g}</Badge>
            ))}
          </div>
          <Button size="lg" onClick={() => setIsPlayerOpen(true)}>
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play
          </Button>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {info.plot && (
            <div className="mb-4">
              <h2 className="font-display text-lg font-semibold text-text-primary mb-2">Plot</h2>
              <p className="text-text-secondary text-sm leading-relaxed">{info.plot}</p>
            </div>
          )}
        </div>
        <div className="space-y-4">
          {info.director && (
            <div>
              <h3 className="text-xs text-text-muted uppercase tracking-wider mb-1">Director</h3>
              <p className="text-sm text-text-primary">{info.director}</p>
            </div>
          )}
          {info.cast && (
            <div>
              <h3 className="text-xs text-text-muted uppercase tracking-wider mb-1">Cast</h3>
              <p className="text-sm text-text-secondary">{info.cast}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
