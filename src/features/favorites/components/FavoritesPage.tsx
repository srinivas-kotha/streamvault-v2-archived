import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  useSpatialFocusable,
  useSpatialContainer,
  FocusContext,
} from "@shared/hooks/useSpatialNav";
import { usePageFocus } from "@shared/hooks/usePageFocus";
import { useFavorites, useRemoveFavorite } from "../api";
import { PosterCard, ChannelCard } from "@/design-system";
import { EmptyState } from "@shared/components/EmptyState";
import { SkeletonGrid } from "@shared/components/Skeleton";
import { PageTransition } from "@shared/components/PageTransition";
import type { ContentType, DbFavorite } from "@shared/types/api";

type TabFilter = "all" | ContentType;

const TABS: { key: TabFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Channels" },
  { key: "vod", label: "Movies" },
  { key: "series", label: "Series" },
];

function FocusableTab({
  id,
  label,
  count,
  isActive,
  onSelect,
}: {
  id: string;
  label: string;
  count: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: id,
    onEnterPress: onSelect,
  });

  return (
    <button
      ref={ref}
      {...focusProps}
      onClick={onSelect}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-[background-color,border-color,color] ${
        isActive
          ? "bg-teal/10 text-teal border border-teal/30"
          : showFocusRing
            ? "bg-surface-raised text-text-primary border border-teal ring-2 ring-teal/50"
            : "bg-surface-raised text-text-secondary hover:text-text-primary hover:bg-surface-raised/80 border border-white/10"
      }`}
    >
      {label}
      <span className="ml-1.5 text-xs opacity-70">{count}</span>
    </button>
  );
}

export function FavoritesPage() {
  usePageFocus("fav-tab-all");
  const { ref: containerRef, focusKey } = useSpatialContainer({
    focusKey: "FAVORITES_PAGE",
    focusable: false,
  });
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const { data: favorites, isLoading } = useFavorites();
  const removeFavorite = useRemoveFavorite();
  const navigate = useNavigate();

  const counts = useMemo(() => {
    if (!favorites) return { all: 0, live: 0, vod: 0, series: 0 };
    return {
      all: favorites.length,
      live: favorites.filter((f) => f.content_type === "live").length,
      vod: favorites.filter((f) => f.content_type === "vod").length,
      series: favorites.filter((f) => f.content_type === "series").length,
    };
  }, [favorites]);

  const filtered = useMemo(() => {
    if (!favorites) return [];
    if (activeTab === "all") return favorites;
    return favorites.filter((f) => f.content_type === activeTab);
  }, [favorites, activeTab]);

  function handleClick(fav: DbFavorite) {
    const id = String(fav.content_id);
    switch (fav.content_type) {
      case "live":
        navigate({ to: "/live", search: { play: id } });
        break;
      case "vod":
        navigate({ to: "/vod/$vodId", params: { vodId: id } });
        break;
      case "series":
        navigate({ to: "/series/$seriesId", params: { seriesId: id } });
        break;
    }
  }

  function handleRemove(contentId: number, content_type: ContentType) {
    removeFavorite.mutate({ contentId: String(contentId), content_type });
  }

  return (
    <PageTransition>
      <FocusContext.Provider value={focusKey}>
        <div ref={containerRef}>
          <h1 className="font-display text-2xl font-bold text-text-primary mb-6">
            Favorites
          </h1>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {TABS.map((tab) => (
              <FocusableTab
                id={`fav-tab-${tab.key}`}
                key={tab.key}
                label={tab.label}
                count={counts[tab.key]}
                isActive={activeTab === tab.key}
                onSelect={() => setActiveTab(tab.key)}
              />
            ))}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
              <SkeletonGrid count={12} aspectRatio="poster" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title={
                activeTab === "all"
                  ? "No favorites yet"
                  : `No ${TABS.find((t) => t.key === activeTab)?.label.toLowerCase()} favorited`
              }
              message={
                activeTab === "all"
                  ? "Star channels, movies, or series to save them here"
                  : "Browse content and tap the star to add favorites"
              }
              icon="favorites"
            />
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
              {filtered.map((fav) =>
                fav.content_type === "live" ? (
                  <ChannelCard
                    key={`${fav.content_type}-${fav.content_id}`}
                    channelName={fav.content_name || ""}
                    channelNumber={fav.content_id}
                    logoUrl={fav.content_icon || ""}
                    focusKey={`fav-${fav.content_type}-${fav.content_id}`}
                    onClick={() => handleClick(fav)}
                    {...({ onFavoriteToggle: () => handleRemove(fav.content_id, fav.content_type) } as any)}
                  />
                ) : (
                  <PosterCard
                    key={`${fav.content_type}-${fav.content_id}`}
                    title={fav.content_name || `${fav.content_type} ${fav.content_id}`}
                    imageUrl={fav.content_icon || ""}
                    isFavorite={true}
                    onFavoriteToggle={() =>
                      handleRemove(fav.content_id, fav.content_type)
                    }
                    focusKey={`fav-${fav.content_type}-${fav.content_id}`}
                    onClick={() => handleClick(fav)}
                  />
                ),
              )}
            </div>
          )}
        </div>
      </FocusContext.Provider>
    </PageTransition>
  );
}
