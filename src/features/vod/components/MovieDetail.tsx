import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useVODInfo } from '../api';
import { useWatchHistory } from '@features/history/api';
import { StarRating } from '@shared/components/StarRating';
import { Badge } from '@shared/components/Badge';
import { Button } from '@shared/components/Button';
import { Skeleton } from '@shared/components/Skeleton';
import { formatDuration } from '@shared/utils/formatDuration';
import { parseGenres } from '@shared/utils/parseGenres';
import { PlayerPage } from '@features/player/components/PlayerPage';
import { useSpatialFocusable, useSpatialContainer, FocusContext, setFocus } from '@shared/hooks/useSpatialNav';

export function MovieDetail() {
  const { vodId } = useParams({ from: '/_authenticated/vod/$vodId' });
  const navigate = useNavigate();
  const { data, isLoading } = useVODInfo(vodId);
  const { data: watchHistory } = useWatchHistory();
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

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
    onEnterPress: () => navigate({ to: '/vod' }),
  });

  const { ref: closeRef, showFocusRing: closeFocusRing, focusProps: closeFocusProps } = useSpatialFocusable({
    focusKey: `vod-close-${vodId}`,
    onEnterPress: () => setIsPlayerOpen(false),
  });

  const { ref: playRef, showFocusRing: playFocusRing, focusProps: playFocusProps } = useSpatialFocusable({
    focusKey: `vod-play-${vodId}`,
    onEnterPress: () => setIsPlayerOpen(true),
  });

  // Auto-focus Play button when page loads
  useEffect(() => {
    if (!isLoading && data && !isPlayerOpen) {
      const timer = setTimeout(() => {
        try { setFocus(`vod-play-${vodId}`); } catch { /* not mounted yet */ }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isLoading, data, vodId, isPlayerOpen]);

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
        <button onClick={() => navigate({ to: '/vod' })} className="mt-4 px-4 py-2 bg-teal/15 text-teal rounded-lg text-sm hover:bg-teal/25 transition-colors">
          Back to Movies
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
            onClick={() => navigate({ to: '/vod' })}
            className={`flex items-center gap-1 text-text-secondary hover:text-text-primary text-sm mb-4 transition-colors rounded-lg px-2 py-1 ${
              backFocusRing ? 'ring-2 ring-teal bg-surface-raised' : ''
            }`}
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
                ref={closeRef}
                {...closeFocusProps}
                onClick={() => setIsPlayerOpen(false)}
                className={`absolute top-3 right-3 z-20 p-2 bg-obsidian/80 rounded-full text-text-muted hover:text-text-primary transition-colors ${
                  closeFocusRing ? 'ring-2 ring-teal bg-teal/20 text-text-primary' : ''
                }`}
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
                startTime={savedProgress}
                onClose={() => setIsPlayerOpen(false)}
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
              <Button
                ref={playRef}
                {...playFocusProps}
                size="lg"
                onClick={() => setIsPlayerOpen(true)}
                className={playFocusRing ? 'ring-2 ring-offset-2 ring-offset-obsidian ring-teal' : ''}
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {savedProgress > 0 ? 'Resume' : 'Play'}
              </Button>
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
