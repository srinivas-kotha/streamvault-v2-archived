import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  '/_authenticated/language/$lang_/category/$categoryId' as any,
)({});
