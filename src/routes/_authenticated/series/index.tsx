import { createFileRoute } from '@tanstack/react-router';
import { SeriesPage } from '@features/series/components/SeriesPage';

export const Route = createFileRoute('/_authenticated/series/')({
  component: SeriesPage,
});
