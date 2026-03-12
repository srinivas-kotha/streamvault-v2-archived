import { parseGenres } from './parseGenres';

export interface FilterState {
  genre: string | null;
  minRating: number | null;
  hideAdult: boolean;
}

export const DEFAULT_FILTERS: FilterState = {
  genre: null,
  minRating: null,
  hideAdult: true,
};

export function filterContent<T extends Record<string, unknown>>(
  items: T[],
  filters: FilterState,
): T[] {
  return items.filter((item) => {
    // Adult filter
    if (filters.hideAdult && String(item.is_adult) === '1') return false;

    // Genre filter
    if (filters.genre) {
      const genres = parseGenres(item.genre as string | undefined);
      if (!genres.includes(filters.genre)) return false;
    }

    // Rating filter
    if (filters.minRating !== null) {
      const rating = Number(item.rating_5based || 0);
      if (rating < filters.minRating) return false;
    }

    return true;
  });
}
