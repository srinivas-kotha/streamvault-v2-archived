import { StarRating } from "@shared/components/StarRating";
import { Badge } from "@shared/components/Badge";
import { parseGenres } from "@shared/utils/parseGenres";

interface SeriesDetailHeroProps {
  info: {
    name: string;
    icon?: string | null;
    plot?: string;
    rating?: string;
    year?: string;
    genre?: string;
    backdropUrl?: string;
  };
  seasonsCount: number;
  channelName: string | null;
}

export function SeriesDetailHero({
  info,
  seasonsCount,
  channelName,
}: SeriesDetailHeroProps) {
  return (
    <div className="relative overflow-hidden mb-6">
      <div className="aspect-[21/9] relative bg-surface max-h-[400px]">
        {info.backdropUrl ? (
          <img
            src={info.backdropUrl}
            alt={info.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : info.icon ? (
          <img
            src={info.icon}
            alt={info.name}
            className="w-full h-full object-cover blur-sm scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian/70 via-transparent to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 px-6 lg:px-10 pb-6">
        <h1 className="font-display text-3xl lg:text-4xl font-bold text-text-primary mb-3">
          {info.name}
        </h1>
        <div className="flex items-center gap-3 flex-wrap mb-3">
          {info.rating && (
            <StarRating rating={parseFloat(info.rating)} max={10} size="md" />
          )}
          {info.year && (
            <span className="text-text-secondary text-sm">
              {info.year.slice(0, 4)}
            </span>
          )}
          <span className="text-text-secondary text-sm">
            {seasonsCount} Season{seasonsCount !== 1 ? "s" : ""}
          </span>
          {channelName && <Badge variant="default">{channelName}</Badge>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {parseGenres(info.genre ?? "").map((g) => (
            <Badge key={g} variant="teal">
              {g}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
