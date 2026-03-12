import { createFileRoute } from '@tanstack/react-router';
import { LanguageHubPage } from '@features/language/LanguageHubPage';

interface LanguageHubSearch {
  tab?: 'movies' | 'series' | 'live';
}

export const Route = createFileRoute('/_authenticated/language/$lang')({
  component: LanguageHubPage,
  validateSearch: (search: Record<string, unknown>): LanguageHubSearch => ({
    tab: ['movies', 'series', 'live'].includes(search.tab as string)
      ? (search.tab as 'movies' | 'series' | 'live')
      : undefined,
  }),
});
