import { createFileRoute } from '@tanstack/react-router';
import { LanguageHubPage } from '@features/language/LanguageHubPage';

export const Route = createFileRoute('/_authenticated/language/$lang')({
  component: LanguageHubPage,
});
