import { createFileRoute } from '@tanstack/react-router';
import { SeriesDetail } from '@features/series/components/SeriesDetail';

export const Route = createFileRoute('/_authenticated/series/$seriesId')({
  component: SeriesDetail,
});
