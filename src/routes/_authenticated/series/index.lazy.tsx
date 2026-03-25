import { createLazyFileRoute } from "@tanstack/react-router";
import { SeriesPage } from "@features/series/components/SeriesPage";

export const Route = createLazyFileRoute("/_authenticated/series/")({
  component: SeriesPage,
});
