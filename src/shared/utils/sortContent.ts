type SortField = 'name' | 'rating' | 'added' | 'releaseDate';
type SortDirection = 'asc' | 'desc';

export interface SortOption {
  field: SortField;
  direction: SortDirection;
  label: string;
}

export const SORT_OPTIONS: SortOption[] = [
  { field: 'name', direction: 'asc', label: 'Name A-Z' },
  { field: 'name', direction: 'desc', label: 'Name Z-A' },
  { field: 'rating', direction: 'desc', label: 'Highest Rated' },
  { field: 'added', direction: 'desc', label: 'Recently Added' },
  { field: 'releaseDate', direction: 'desc', label: 'Newest Release' },
  { field: 'releaseDate', direction: 'asc', label: 'Oldest Release' },
];

export function sortContent<T extends Record<string, unknown>>(
  items: T[],
  field: SortField,
  direction: SortDirection,
): T[] {
  const sorted = [...items].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    switch (field) {
      case 'name':
        aVal = String(a.name || '').toLowerCase();
        bVal = String(b.name || '').toLowerCase();
        return aVal.localeCompare(bVal);
      case 'rating':
        aVal = Number(a.rating_5based || a.rating || 0);
        bVal = Number(b.rating_5based || b.rating || 0);
        return aVal - bVal;
      case 'added':
        aVal = String(a.added || '0');
        bVal = String(b.added || '0');
        return aVal.localeCompare(bVal);
      case 'releaseDate':
        aVal = String(a.releaseDate || '0');
        bVal = String(b.releaseDate || '0');
        return aVal.localeCompare(bVal);
      default:
        return 0;
    }
  });

  return direction === 'desc' ? sorted.reverse() : sorted;
}
