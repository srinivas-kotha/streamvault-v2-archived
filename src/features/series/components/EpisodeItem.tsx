import { useSpatialFocusable } from '@shared/hooks/useSpatialNav';
import { useFocusStyles } from '@/design-system/focus/useFocusStyles';
import { formatDuration } from '@shared/utils/formatDuration';

export interface Episode {
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

function formatEpisodeDate(unixTimestamp: string): string {
  const ts = parseInt(unixTimestamp, 10);
  if (!ts || isNaN(ts)) return '';
  const date = new Date(ts * 1000);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function FocusableEpisodeItem({
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
  const { cardFocus } = useFocusStyles();
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
      className={`flex gap-4 p-3 lg:p-4 rounded-xl transition-[background-color,border-color] group cursor-pointer min-h-[72px] outline-none ${
        isPlaying
          ? 'bg-teal/10 border border-teal/30'
          : showFocusRing
            ? `bg-surface-raised ${cardFocus} border border-teal`
            : 'bg-surface-raised/50 border border-border-subtle hover:border-teal/20 hover:bg-surface-raised'
      }`}
      onClick={() => playEpisode(ep)}
    >
      <div className="w-28 lg:w-36 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-surface relative">
        {ep.info.movie_image ? (
          <img
            src={ep.info.movie_image}
            alt={ep.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
        )}
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
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-teal text-xs font-mono font-bold">
            S{String(ep.season).padStart(2, '0')}E{String(ep.episode_num).padStart(2, '0')}
          </span>
          <h4 className="text-sm lg:text-base font-medium text-text-primary truncate">
            {ep.title}
          </h4>
        </div>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          {ep.info.duration_secs > 0 && <span>{formatDuration(ep.info.duration_secs)}</span>}
          {addedDate && <span>{addedDate}</span>}
        </div>
        {ep.info.plot && (
          <p className="text-xs text-text-secondary line-clamp-1 mt-1">{ep.info.plot}</p>
        )}
      </div>
      <div className="flex-shrink-0 flex items-center">
        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center group-hover:bg-teal/15 transition-colors">
          <svg className="w-5 h-5 text-text-muted group-hover:text-teal transition-colors" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
