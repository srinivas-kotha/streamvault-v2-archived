import { createLazyFileRoute } from "@tanstack/react-router";
import { HistoryPage } from "@features/history/components/HistoryPage";

export const Route = createLazyFileRoute("/_authenticated/history")({
  component: HistoryPage,
});
