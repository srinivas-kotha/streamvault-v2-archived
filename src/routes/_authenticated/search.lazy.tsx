import { createLazyFileRoute } from "@tanstack/react-router";
import { SearchPage } from "@features/search/components/SearchPage";

export const Route = createLazyFileRoute("/_authenticated/search")({
  component: SearchPage,
});
