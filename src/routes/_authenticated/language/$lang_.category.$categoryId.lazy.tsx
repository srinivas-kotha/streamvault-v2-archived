import { createLazyFileRoute } from '@tanstack/react-router';
import { CategoryGridPage } from '@features/language/CategoryGridPage';

export const Route = createLazyFileRoute(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  '/_authenticated/language/$lang_/category/$categoryId' as any,
)({
  component: CategoryGridPage,
});
