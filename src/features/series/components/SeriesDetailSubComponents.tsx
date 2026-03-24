/**
 * Sub-components for SeriesDetail:
 * - FocusableSeasonTab
 * - ResumeButton
 * - LoadMoreButton
 *
 * Extracted to keep SeriesDetail.tsx under 300 lines (AC-03).
 */
import { useSpatialFocusable } from '@shared/hooks/useSpatialNav';
import { useFocusStyles } from '@/design-system/focus/useFocusStyles';
import { formatDuration } from '@shared/utils/formatDuration';

// ── FocusableSeasonTab ────────────────────────────────────────────────────────

export function FocusableSeasonTab({ seasonNumber, name, episodeCount, isActive, onSelect }: {
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
      className={`px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color] min-h-[44px] ${
        isActive
          ? 'bg-teal/15 text-teal border border-teal/30'
          : 'bg-surface-raised text-text-secondary border border-border hover:text-text-primary hover:border-teal/20'
      } ${showFocusRing ? 'ring-2 ring-teal ring-offset-1 ring-offset-obsidian' : ''}`}
    >
      {name} ({episodeCount})
    </button>
  );
}

// ── ResumeButton ──────────────────────────────────────────────────────────────

export function ResumeButton({ seriesId, episode, seriesName, onResume }: {
  seriesId: string;
  episode: { content_id: number; content_name: string | null; progress_seconds: number; duration_seconds: number };
  seriesName: string;
  onResume: (contentId: number, contentName: string, progressSeconds: number) => void;
}) {
  const { cardFocus } = useFocusStyles();
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: `series-resume-${seriesId}`,
    onEnterPress: () => onResume(episode.content_id, episode.content_name || seriesName, episode.progress_seconds ?? 0),
  });

  return (
    <div className="mb-6">
      <button
        ref={ref}
        {...focusProps}
        onClick={() => onResume(episode.content_id, episode.content_name || seriesName, episode.progress_seconds ?? 0)}
        className={`w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-teal/10 to-indigo/10 border border-teal/20 hover:border-teal/40 transition-[border-color,box-shadow] group ${showFocusRing ? cardFocus : ''}`}
      >
        <div className="w-12 h-12 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 group-hover:bg-teal/30 transition-colors">
          <svg className="w-6 h-6 text-teal" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-text-primary text-sm font-medium truncate">Resume: {episode.content_name}</p>
          <p className="text-text-muted text-xs">
            {episode.progress_seconds > 0 && episode.duration_seconds > 0 && (
              <>{formatDuration(episode.progress_seconds)} / {formatDuration(episode.duration_seconds)} watched</>
            )}
          </p>
        </div>
        <div className="flex-shrink-0">
          {episode.progress_seconds > 0 && episode.duration_seconds > 0 && (
            <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden">
              <div className="h-full bg-teal rounded-full" style={{ width: `${Math.min((episode.progress_seconds / episode.duration_seconds) * 100, 100)}%` }} />
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

// ── LoadMoreButton ────────────────────────────────────────────────────────────

export function LoadMoreButton({ seriesId, remaining, onLoadMore }: {
  seriesId: string;
  remaining: number;
  onLoadMore: () => void;
}) {
  const { buttonFocus } = useFocusStyles();
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: `series-load-more-${seriesId}`,
    onEnterPress: onLoadMore,
  });

  return (
    <div className="mt-4">
      <button
        ref={ref}
        {...focusProps}
        onClick={onLoadMore}
        className={`w-full py-3 rounded-xl border text-sm font-medium transition-[background-color,border-color,color] ${
          showFocusRing
            ? `bg-surface-raised ${buttonFocus} text-text-primary`
            : 'bg-surface-raised border-border text-text-secondary hover:border-teal/20 hover:text-text-primary'
        }`}
      >
        Load More ({remaining} remaining)
      </button>
    </div>
  );
}
