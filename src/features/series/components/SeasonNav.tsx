import { memo } from "react";
import { useSpatialFocusable } from "@shared/hooks/useSpatialNav";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SeasonData {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  airDate?: string;
  icon?: string;
}

export interface SeasonNavProps {
  seasons: SeasonData[];
  activeSeason: number;
  seriesId: string;
  onSeasonChange: (seasonNumber: number) => void;
}

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

function FocusableSeasonTabInner({
  season,
  isActive,
  onSeasonChange,
}: {
  season: SeasonData;
  isActive: boolean;
  onSeasonChange: (n: number) => void;
}) {
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: `series-season-${season.seasonNumber}`,
    onEnterPress: () => onSeasonChange(season.seasonNumber),
  });

  return (
    <button
      ref={ref}
      {...focusProps}
      role="tab"
      aria-selected={isActive}
      onClick={() => onSeasonChange(season.seasonNumber)}
      className={[
        "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap min-h-[44px]",
        "transition-[background-color,border-color,color]",
        isActive
          ? "bg-teal/15 text-teal border border-teal/30"
          : "bg-surface-raised text-text-secondary border border-border hover:text-text-primary hover:border-teal/20",
        showFocusRing
          ? "ring-2 ring-teal ring-offset-1 ring-offset-obsidian"
          : "",
      ].join(" ")}
    >
      {season.name} ({season.episodeCount})
    </button>
  );
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
    <div
      role="tablist"
      aria-label="Seasons"
      className="flex gap-2 flex-wrap mb-4"
    >
      {seasons.map((season) => (
        <FocusableSeasonTabInner
          key={season.seasonNumber}
          season={season}
          isActive={season.seasonNumber === activeSeason}
          onSeasonChange={onSeasonChange}
        />
      ))}
    </div>
  );
});
