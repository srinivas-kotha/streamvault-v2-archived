import { type SortOption, SORT_OPTIONS } from '@shared/utils/sortContent';
import type { FilterState } from '@shared/utils/filterContent';
import { useSpatialFocusable } from '@shared/hooks/useSpatialNav';

interface SortFilterBarProps {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  genres: string[];
}

function FocusableChip({ id, label, isActive, onSelect, activeClass, inactiveClass }: {
  id: string;
  label: string;
  isActive: boolean;
  onSelect: () => void;
  activeClass: string;
  inactiveClass: string;
}) {
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: id,
    onEnterPress: onSelect,
  });

  return (
    <button
      ref={ref}
      {...focusProps}
      onClick={onSelect}
      className={isActive ? activeClass : showFocusRing ? `${inactiveClass} ring-2 ring-teal/50 scale-110 shadow-[0_0_12px_rgba(45,212,191,0.2)] text-teal` : inactiveClass}
    >
      {label}
    </button>
  );
}

export function SortFilterBar({ sort, onSortChange, filters, onFiltersChange, genres }: SortFilterBarProps) {

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {/* Sort dropdown - native select works with D-pad */}
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
          <FocusableChip
            id={`vod-rating-${r ?? 'none'}`}
            key={r ?? 'all'}
            label={`${r === null ? 'Any' : `${r}+`} ★`}
            isActive={filters.minRating === r}
            onSelect={() => onFiltersChange({ ...filters, minRating: r })}
            activeClass="px-2.5 py-1 rounded-md text-xs font-medium transition-[background-color,border-color,color,transform,box-shadow] bg-warning/15 text-warning border border-warning/30"
            inactiveClass="px-2.5 py-1 rounded-md text-xs font-medium transition-[background-color,border-color,color,transform,box-shadow] bg-surface-raised text-text-muted border border-border hover:text-text-secondary"
          />
        ))}
      </div>

      {/* Genre chips */}
      {genres.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-[50%]">
          <FocusableChip
            id="vod-genre-all"
            label="All Genres"
            isActive={!filters.genre}
            onSelect={() => onFiltersChange({ ...filters, genre: null })}
            activeClass="px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-[background-color,border-color,color,transform,box-shadow] bg-teal/15 text-teal border border-teal/30"
            inactiveClass="px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-[background-color,border-color,color,transform,box-shadow] bg-surface-raised text-text-muted border border-border hover:text-text-secondary"
          />
          {genres.slice(0, 15).map((g) => (
            <FocusableChip
              id={`vod-genre-${g}`}
              key={g}
              label={g}
              isActive={filters.genre === g}
              onSelect={() => onFiltersChange({ ...filters, genre: filters.genre === g ? null : g })}
              activeClass="px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-[background-color,border-color,color,transform,box-shadow] bg-teal/15 text-teal border border-teal/30"
              inactiveClass="px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-[background-color,border-color,color,transform,box-shadow] bg-surface-raised text-text-muted border border-border hover:text-text-secondary"
            />
          ))}
        </div>
      )}
    </div>
  );
}
