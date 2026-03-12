import { createFileRoute } from '@tanstack/react-router';
import { MovieDetail } from '@features/vod/components/MovieDetail';

export const Route = createFileRoute('/_authenticated/vod/$vodId')({
  component: MovieDetail,
});
