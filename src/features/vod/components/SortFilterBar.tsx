import { type SortOption, SORT_OPTIONS } from '@shared/utils/sortContent';
import type { FilterState } from '@shared/utils/filterContent';

interface SortFilterBarProps {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  genres: string[];
}

export function SortFilterBar({ sort, onSortChange, filters, onFiltersChange, genres }: SortFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {/* Sort dropdown */}
      <select
        value={`${sort.field}-${sort.direction}`}
        onChange={(e) => {
          const opt = SORT_OPTIONS.find((o) => `${o.field}-${o.direction}` === e.target.value);
          if (opt) onSortChange(opt);
        }}
        className="px-3 py-1.5 bg-surface-raised border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal/50"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={`${opt.field}-${opt.direction}`} value={`${opt.field}-${opt.direction}`}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Rating filter */}
      <div className="flex gap-1">
        {[null, 3.5, 4].map((r) => (
          <button
            key={r ?? 'all'}
            onClick={() => onFiltersChange({ ...filters, minRating: r })}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              filters.minRating === r
                ? 'bg-warning/15 text-warning border border-warning/30'
                : 'bg-surface-raised text-text-muted border border-border hover:text-text-secondary'
            }`}
          >
            {r === null ? 'Any' : `${r}+`} ★
          </button>
        ))}
      </div>

      {/* Genre chips - scrollable */}
      {genres.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-[50%]">
          <button
            onClick={() => onFiltersChange({ ...filters, genre: null })}
            className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
              !filters.genre
                ? 'bg-teal/15 text-teal border border-teal/30'
                : 'bg-surface-raised text-text-muted border border-border hover:text-text-secondary'
            }`}
          >
            All Genres
          </button>
          {genres.slice(0, 15).map((g) => (
            <button
              key={g}
              onClick={() => onFiltersChange({ ...filters, genre: filters.genre === g ? null : g })}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                filters.genre === g
                  ? 'bg-teal/15 text-teal border border-teal/30'
                  : 'bg-surface-raised text-text-muted border border-border hover:text-text-secondary'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
