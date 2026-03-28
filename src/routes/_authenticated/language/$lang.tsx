import { createFileRoute } from '@tanstack/react-router';

interface LanguageHubSearch {
  tab?: 'movies' | 'series' | 'live';
}

export const Route = createFileRoute('/_authenticated/language/$lang')({
  validateSearch: (search: Record<string, unknown>): LanguageHubSearch => ({
    tab: ['movies', 'series', 'live'].includes(search.tab as string)
      ? (search.tab as 'movies' | 'series' | 'live')
      : undefined,
  }),
});
