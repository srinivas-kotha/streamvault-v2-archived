import { createLazyFileRoute } from "@tanstack/react-router";
import { VODPage } from "@features/vod/components/VODPage";

export const Route = createLazyFileRoute("/_authenticated/vod/")({
  component: VODPage,
});
