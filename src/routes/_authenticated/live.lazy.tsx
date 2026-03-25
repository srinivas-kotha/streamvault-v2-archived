import { createLazyFileRoute } from "@tanstack/react-router";
import { LivePage } from "@features/live/components/LivePage";

export const Route = createLazyFileRoute("/_authenticated/live")({
  component: LivePage,
});
