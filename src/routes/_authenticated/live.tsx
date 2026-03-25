import { createFileRoute } from "@tanstack/react-router";

interface LiveSearch {
  play?: string;
}

export const Route = createFileRoute("/_authenticated/live")({
  validateSearch: (search: Record<string, unknown>): LiveSearch => ({
    play: typeof search.play === "string" ? search.play : undefined,
  }),
});
