import { memo } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SeasonData {
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  season_number: number;
  cover: string;
}

export interface SeasonNavProps {
  seasons: SeasonData[];
  activeSeason: number;
  seriesId: string;
  onSeasonChange: (seasonNumber: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SeasonNav = memo(function SeasonNav({
  seasons,
  activeSeason,
  onSeasonChange,
}: SeasonNavProps) {
  return (
    <div role="tablist" aria-label="Seasons" className="flex gap-2 flex-wrap mb-4">
      {seasons.map((season) => {
        const isActive = season.season_number === activeSeason;
        return (
          <button
            key={season.season_number}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSeasonChange(season.season_number)}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap min-h-[44px]',
              'transition-[background-color,border-color,color]',
              isActive
                ? 'bg-teal/15 text-teal border border-teal/30'
                : 'bg-surface-raised text-text-secondary border border-border hover:text-text-primary hover:border-teal/20',
            ].join(' ')}
          >
            {season.name} ({season.episode_count})
          </button>
        );
      })}
    </div>
  );
});
