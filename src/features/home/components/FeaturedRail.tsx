import { useLanguageMovieRail } from "../api";
import { ContentRail } from "./ContentRail";
import { useNavigate } from "@tanstack/react-router";
import { FocusableCard, PosterCard } from "@/design-system";

/**
 * FeaturedRail — pulls recently-added VOD content (Telugu movies as a default
 * "featured" selection) and renders them in a spatially-navigable content rail.
 * Uses the home ContentRail which has D-pad boundary, focus memory, and snap.
 */
export function FeaturedRail() {
  const { items, isLoading } = useLanguageMovieRail("telugu");
  const navigate = useNavigate();

  return (
    <ContentRail
      title="Featured"
      focusKey="home-rail-featured"
      items={items}
      isLoading={isLoading}
      eagerCount={6}
      renderCard={(item, _index, _isFirstVisible) => (
        <FocusableCard
          key={item.id}
          focusKey={`featured-${item.id}`}
          onEnterPress={() =>
            navigate({ to: "/vod/$vodId", params: { vodId: item.id } })
          }
        >
          <PosterCard
            imageUrl={item.icon || ""}
            title={item.name}
            onClick={() =>
              navigate({ to: "/vod/$vodId", params: { vodId: item.id } })
            }
          />
        </FocusableCard>
      )}
    />
  );
}
