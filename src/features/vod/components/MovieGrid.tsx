import { memo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PosterCard } from "@/design-system/cards/PosterCard";
import { EmptyState } from "@shared/components/EmptyState";
import { VirtualGrid } from "@shared/components/VirtualGrid";
import type { XtreamVODStream } from "@shared/types/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MovieGridProps {
  movies: XtreamVODStream[];
  onFavoriteToggle?: (movie: XtreamVODStream) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MovieGrid = memo(function MovieGrid({
  movies,
  onFavoriteToggle,
}: MovieGridProps) {
  const navigate = useNavigate();

  if (movies.length === 0) {
    return <EmptyState title="No movies found" />;
  }

  return (
    <VirtualGrid
      items={movies}
      estimateSize={280}
      overscan={3}
      renderItem={(movie) => {
        // Extract year from the added timestamp (approximate — no releaseDate on stream list)
        const year = movie.added
          ? new Date(parseInt(movie.added, 10) * 1000).getFullYear()
          : undefined;

        return (
          <PosterCard
            title={movie.name}
            imageUrl={movie.icon || ""}
            rating={
              movie.rating
                ? parseFloat(movie.rating) > 0
                  ? parseFloat(movie.rating).toFixed(1)
                  : undefined
                : undefined
            }
            year={year}
            onClick={() =>
              navigate({
                to: "/vod/$vodId",
                params: { vodId: movie.id },
              })
            }
            onFavoriteToggle={
              onFavoriteToggle ? () => onFavoriteToggle(movie) : undefined
            }
            focusKey={`movie-grid-${movie.id}`}
          />
        );
      }}
    />
  );
});
