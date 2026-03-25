import { createLazyFileRoute } from '@tanstack/react-router';
import { LanguageHubPage } from '@features/language/LanguageHubPage';

export const Route = createLazyFileRoute('/_authenticated/language/$lang')({
  component: LanguageHubPage,
});
