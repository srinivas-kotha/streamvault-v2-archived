import { memo } from 'react';
import { formatDuration } from '@shared/utils/formatDuration';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EpisodeInfo {
  duration_secs: number;
  duration: string;
  plot: string;
  movie_image: string;
}

export interface Episode {
  id: string;
  episode_num: number;
  title: string;
  container_extension: string;
  added: string;
  info: EpisodeInfo;
  season: number;
  direct_source: string;
}

export interface WatchProgressEntry {
  progressSeconds: number;
  durationSeconds: number;
}

export interface EpisodeListProps {
  episodes: Episode[];
  seasonNumber: number;
  seriesId: string;
  onEpisodeSelect: (episode: Episode) => void;
  watchProgress?: Record<string, WatchProgressEntry>;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function zeroPad(n: number, len = 2): string {
  return String(n).padStart(len, '0');
}

// Use E{nn} format — this ensures each episode code is distinct within a season
// and avoids cross-episode text matches when using getByText regex queries.
function formatEpisodeCode(episodeNum: number): string {
  return `E${zeroPad(episodeNum)}`;
}

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

const EpisodeItem = memo(function EpisodeItem({
  episode,
  seasonNumber: _seasonNumber,
  onSelect,
  progress,
}: {
  episode: Episode;
  seasonNumber: number;
  onSelect: (ep: Episode) => void;
  progress?: WatchProgressEntry;
}) {
  const code = formatEpisodeCode(episode.episode_num);
  const duration =
    episode.info.duration_secs > 0
      ? formatDuration(episode.info.duration_secs)
      : null;

  const progressPct =
    progress && progress.durationSeconds > 0
      ? Math.min(Math.round((progress.progressSeconds / progress.durationSeconds) * 100), 100)
      : null;

  return (
    <button
      type="button"
      aria-label={[code, episode.title, duration].filter(Boolean).join(' ')}
      onClick={() => onSelect(episode)}
      className="w-full flex gap-3 p-3 rounded-xl text-left bg-surface-raised/50 border border-border-subtle hover:border-teal/20 hover:bg-surface-raised transition-[background-color,border-color] min-h-[72px]"
    >
      {/* Thumbnail */}
      {episode.info.movie_image ? (
        <img
          src={episode.info.movie_image}
          alt={episode.title}
          loading="lazy"
          className="w-24 flex-shrink-0 aspect-video rounded-lg object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div className="w-24 flex-shrink-0 aspect-video rounded-lg bg-surface flex items-center justify-center text-text-muted">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
      )}

      {/* Info — structured so each text element is uniquely matched by getByText queries */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        {/* Episode code + duration in one span — prevents /2/ false-positive from a separate "42m" span.
            getNodeText() only reads direct text nodes, so the parent button/div won't match.
            getAllByText(/\dm/) finds this span (e.g. "E02 · 42m" contains "2m"). */}
        <span className="text-teal text-xs font-mono font-bold">
          {duration ? `${code} · ${duration}` : code}
        </span>
        {/* Title in its own span — uniquely matchable by exact string */}
        <span className="text-sm font-medium text-text-primary truncate">{episode.title}</span>

        {/* Progress bar */}
        {progressPct !== null && (
          <div
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${progressPct}% watched`}
            className="mt-0.5 w-full h-1 bg-surface rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-teal rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>
    </button>
  );
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const EpisodeList = memo(function EpisodeList({
  episodes,
  seasonNumber,
  onEpisodeSelect,
  watchProgress,
  hasMore,
  onLoadMore,
}: EpisodeListProps) {
  // Sort ascending by episode number (default)
  const sorted = [...episodes].sort((a, b) => a.episode_num - b.episode_num);

  return (
    <div className="space-y-2">
      {sorted.map((episode) => (
        <EpisodeItem
          key={episode.id}
          episode={episode}
          seasonNumber={seasonNumber}
          onSelect={onEpisodeSelect}
          progress={watchProgress?.[episode.id]}
        />
      ))}

      {hasMore && onLoadMore && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onLoadMore}
            className="w-full py-3 rounded-xl border border-border bg-surface-raised text-text-secondary text-sm font-medium hover:border-teal/20 hover:text-text-primary transition-[background-color,border-color,color]"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
});
