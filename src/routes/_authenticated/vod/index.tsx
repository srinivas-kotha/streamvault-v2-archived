import { createFileRoute } from '@tanstack/react-router';
import { VODPage } from '@features/vod/components/VODPage';

export const Route = createFileRoute('/_authenticated/vod/')({
  component: VODPage,
});
