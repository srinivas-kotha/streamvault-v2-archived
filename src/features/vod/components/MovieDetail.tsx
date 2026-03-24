import { useMemo, useEffect } from 'react';
import { useParams, useRouter } from '@tanstack/react-router';
import { useVODInfo } from '../api';
import { useWatchHistory } from '@features/history/api';
import { useIsFavorite, useAddFavorite, useRemoveFavorite } from '@features/favorites/api';
import { StarRating } from '@shared/components/StarRating';
import { Badge } from '@shared/components/Badge';
import { Button } from '@shared/components/Button';
import { Skeleton } from '@shared/components/Skeleton';
import { formatDuration } from '@shared/utils/formatDuration';
import { parseGenres } from '@shared/utils/parseGenres';
import { usePlayerStore } from '@lib/store';
import { useSpatialFocusable, useSpatialContainer, FocusContext, setFocus } from '@shared/hooks/useSpatialNav';
import { useFocusStyles } from '@/design-system/focus/useFocusStyles';

function StartOverButton({ vodId, onStartOver }: { vodId: string; onStartOver: () => void }) {
  const { buttonFocus } = useFocusStyles();
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: `vod-restart-${vodId}`,
    onEnterPress: onStartOver,
  });

  return (
    <Button
      ref={ref}
      {...focusProps}
      variant="secondary"
      size="lg"
      onClick={onStartOver}
      className={showFocusRing ? `${buttonFocus} scale-105 bg-surface-hover shadow-[0_0_16px_rgba(45,212,191,0.2)] border-teal/40` : ''}
      data-focus-key={`vod-restart-${vodId}`}
    >
      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0113.09-3.09L20 9M20 15a8 8 0 01-13.09 3.09L4 15" />
      </svg>
      Start Over
    </Button>
  );
}

function FavoriteButton({ vodId, movieName, movieIcon }: { vodId: string; movieName: string; movieIcon?: string }) {
  const { buttonFocus } = useFocusStyles();
  const isFavorite = useIsFavorite(vodId);
  const { mutate: addFavorite } = useAddFavorite();
  const { mutate: removeFavorite } = useRemoveFavorite();

  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: `vod-favorite-${vodId}`,
    onEnterPress: () => handleToggle(),
  });

  function handleToggle() {
    if (isFavorite) {
      removeFavorite(vodId);
    } else {
      addFavorite({ contentId: vodId, content_type: 'vod', content_name: movieName, content_icon: movieIcon });
    }
  }

  return (
    <Button
      ref={ref}
      {...focusProps}
      variant="secondary"
      size="lg"
      onClick={handleToggle}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      className={showFocusRing ? `${buttonFocus} scale-105 bg-surface-hover shadow-[0_0_16px_rgba(45,212,191,0.2)] border-teal/40` : ''}
      data-focus-key={`vod-favorite-${vodId}`}
    >
      {isFavorite ? (
        <svg className="w-5 h-5 mr-2 text-teal" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )}
      {isFavorite ? 'Favorited' : 'Favorite'}
    </Button>
  );
}

export function MovieDetail() {
  const { vodId } = useParams({ from: '/_authenticated/vod/$vodId' });
  const router = useRouter();
  const goBack = () => router.history.back();
  const { data, isLoading } = useVODInfo(vodId);
  const { data: watchHistory } = useWatchHistory();
  const playStream = usePlayerStore((s) => s.playStream);
  const { buttonFocus } = useFocusStyles();

  // Find saved progress for this movie
  const savedProgress = useMemo(() => {
    if (!watchHistory) return 0;
    const entry = watchHistory.find(
      (h) => h.content_type === 'vod' && String(h.content_id) === vodId
    );
    return entry?.progress_seconds ?? 0;
  }, [watchHistory, vodId]);

  const { ref: contentRef, focusKey: contentFocusKey } = useSpatialContainer({
    focusKey: `movie-content-${vodId}`,
    focusable: false,
  });

  const { focusKey: actionsFocusKey } = useSpatialContainer({
    focusKey: `movie-actions-${vodId}`,
  });

  const { ref: backRef, showFocusRing: backFocusRing, focusProps: backFocusProps } = useSpatialFocusable({
    focusKey: `vod-back-${vodId}`,
    onEnterPress: goBack,
  });

  const { ref: playRef, showFocusRing: playFocusRing, focusProps: playFocusProps } = useSpatialFocusable({
    focusKey: `vod-play-${vodId}`,
    onEnterPress: () => {
      if (data?.info.name) playStream(vodId, 'vod', data.info.name, savedProgress);
    },
  });

  // Auto-focus Play button when page loads
  useEffect(() => {
    if (!isLoading && data) {
      const timer = setTimeout(() => {
        try { setFocus(`vod-play-${vodId}`); } catch { /* not mounted yet */ }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isLoading, data, vodId]);

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

  if (!data || !data.info || Array.isArray(data.info) || !data.info.name) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">Content unavailable. The provider may be temporarily down.</p>
        <button onClick={goBack} className="mt-4 px-4 py-2 bg-teal/15 text-teal rounded-lg text-sm hover:bg-teal/25 transition-colors">
          Go Back
        </button>
      </div>
    );
  }
  const { info, movie_data } = data;

  return (
    <FocusContext.Provider value={contentFocusKey}>
      <div ref={contentRef}>
        <FocusContext.Provider value={actionsFocusKey}>
          {/* Back button */}
          <button
            ref={backRef}
            {...backFocusProps}
            onClick={goBack}
            className={`flex items-center gap-1 text-text-secondary hover:text-text-primary text-sm mb-4 transition-colors rounded-lg px-2 py-1 ${
              backFocusRing ? 'ring-2 ring-teal bg-surface-raised' : ''
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Movies
          </button>

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
              <div className="flex gap-3 flex-wrap">
                <Button
                  ref={playRef}
                  {...playFocusProps}
                  size="lg"
                  onClick={() => playStream(vodId, 'vod', info.name, savedProgress)}
                  className={playFocusRing ? `${buttonFocus} scale-105 shadow-[0_0_20px_rgba(45,212,191,0.35)] brightness-110` : ''}
                  data-focus-key={`vod-play-${vodId}`}
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  {savedProgress > 0 ? 'Resume' : 'Play'}
                </Button>
                {savedProgress > 0 && (
                  <StartOverButton
                    vodId={vodId}
                    onStartOver={() => playStream(vodId, 'vod', info.name, 0)}
                  />
                )}
                <FavoriteButton
                  vodId={vodId}
                  movieName={info.name}
                  movieIcon={info.movie_image}
                />
              </div>
            </div>
          </div>
        </FocusContext.Provider>

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
    </FocusContext.Provider>
  );
}
