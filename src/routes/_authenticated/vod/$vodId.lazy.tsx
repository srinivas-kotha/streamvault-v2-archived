import { createLazyFileRoute } from '@tanstack/react-router';
import { MovieDetail } from '@features/vod/components/MovieDetail';

export const Route = createLazyFileRoute('/_authenticated/vod/$vodId')({
  component: MovieDetail,
});
