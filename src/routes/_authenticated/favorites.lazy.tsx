import { createLazyFileRoute } from "@tanstack/react-router";
import { FavoritesPage } from "@features/favorites/components/FavoritesPage";

export const Route = createLazyFileRoute("/_authenticated/favorites")({
  component: FavoritesPage,
});
