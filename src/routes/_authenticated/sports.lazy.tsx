import { createLazyFileRoute } from "@tanstack/react-router";
import { SportsPage } from "@features/sports/SportsPage";

export const Route = createLazyFileRoute("/_authenticated/sports")({
  component: SportsPage,
});
