import { createFileRoute } from '@tanstack/react-router';
import { LivePage } from '@features/live/components/LivePage';

export const Route = createFileRoute('/_authenticated/live')({
  component: LivePage,
});
