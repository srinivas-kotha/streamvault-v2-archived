import { createFileRoute } from '@tanstack/react-router';
import { LivePage } from '@features/live/components/LivePage';

interface LiveSearch {
  play?: string;
}

export const Route = createFileRoute('/_authenticated/live')({
  component: LivePage,
  validateSearch: (search: Record<string, unknown>): LiveSearch => ({
    play: typeof search.play === 'string' ? search.play : undefined,
  }),
});
