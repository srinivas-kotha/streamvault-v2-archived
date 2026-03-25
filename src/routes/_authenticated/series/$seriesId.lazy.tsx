import { createLazyFileRoute } from '@tanstack/react-router';
import { SeriesDetail } from '@features/series/components/SeriesDetail';

export const Route = createLazyFileRoute('/_authenticated/series/$seriesId')({
  component: SeriesDetail,
});
