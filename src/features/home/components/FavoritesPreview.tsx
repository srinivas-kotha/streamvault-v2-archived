import { useNavigate } from "@tanstack/react-router";
import { useFavorites } from "../api";
import { usePlayerStore } from "@lib/store";
import { PosterCard } from "@/design-system";

export function FavoritesPreview() {
  const { data: favorites, isLoading } = useFavorites();
  const navigate = useNavigate();
  const playStream = usePlayerStore((s) => s.playStream);

  const preview = (favorites ?? []).slice(0, 6);

  if (isLoading || preview.length === 0) return null;

  const handleClick = (item: (typeof preview)[0]) => {
    if (item.content_type === "live") {
      playStream(String(item.content_id), {
        streamType: "live",
        streamName: item.content_name ?? "Unknown",
      });
      navigate({ to: "/player" as string });
    } else if (item.content_type === "vod") {
      navigate({
        to: "/vod/$vodId",
        params: { vodId: String(item.content_id) },
      });
    } else {
      navigate({
        to: "/series/$seriesId",
        params: { seriesId: String(item.content_id) },
      });
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Favorites
        </h2>
        <button
          onClick={() => navigate({ to: "/favorites" })}
          className="text-sm text-teal hover:text-teal/80 transition-colors"
        >
          View All
        </button>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
        {preview.map((item) => (
          <PosterCard
            key={`${item.content_type}-${item.content_id}`}
            imageUrl={item.content_icon ?? ""}
            title={item.content_name ?? "Unknown"}
            isFavorite
            onClick={() => handleClick(item)}
          />
        ))}
      </div>
    </section>
  );
}
