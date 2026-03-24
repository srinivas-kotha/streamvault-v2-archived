import { useRef } from 'react';
import { useSpatialFocusable } from '@shared/hooks/useSpatialNav';

type EpisodeSortKey = 'latest' | 'oldest' | 'episode';

// ── FocusableSearchInput ──────────────────────────────────────────────────────

interface FocusableSearchInputProps {
  value: string;
  onChange: (v: string) => void;
  seriesId: string;
}

function FocusableSearchInput({ value, onChange, seriesId }: FocusableSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: `series-search-${seriesId}`,
    onEnterPress: () => inputRef.current?.focus(),
  });

  return (
    <div
      ref={ref}
      {...focusProps}
      className={`relative flex-1 min-w-[180px] max-w-xs rounded-lg transition-[box-shadow,transform] ${
        showFocusRing ? 'ring-2 ring-teal ring-offset-1 ring-offset-obsidian shadow-[0_0_16px_rgba(45,212,191,0.25)] scale-105' : ''
      }`}
    >
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search episodes..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 bg-surface-raised border border-border rounded-lg text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal-dim transition-[border-color,box-shadow]"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ── FocusableSortPill ─────────────────────────────────────────────────────────

interface FocusableSortPillProps {
  sortKey: EpisodeSortKey;
  label: string;
  isActive: boolean;
  onSelect: () => void;
  seriesId: string;
}

function FocusableSortPill({ sortKey, label, isActive, onSelect, seriesId }: FocusableSortPillProps) {
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: `series-sort-${sortKey}-${seriesId}`,
    onEnterPress: onSelect,
  });

  return (
    <button
      ref={ref}
      {...focusProps}
      onClick={onSelect}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-[background-color,border-color,color] ${
        isActive ? 'bg-teal/15 text-teal' : 'text-text-muted hover:text-text-secondary'
      } ${showFocusRing ? 'ring-2 ring-teal ring-offset-1 ring-offset-obsidian' : ''}`}
    >
      {label}
    </button>
  );
}

// ── EpisodeControls (public export) ──────────────────────────────────────────

interface EpisodeControlsProps {
  seriesId: string;
  episodeSearch: string;
  onSearchChange: (v: string) => void;
  episodeSort: EpisodeSortKey;
  onSortChange: (key: EpisodeSortKey) => void;
  episodeCount: number;
}

export function EpisodeControls({
  seriesId,
  episodeSearch,
  onSearchChange,
  episodeSort,
  onSortChange,
  episodeCount,
}: EpisodeControlsProps) {
  const sortOptions: { key: EpisodeSortKey; label: string }[] = [
    { key: 'latest', label: 'Latest First' },
    { key: 'oldest', label: 'Oldest First' },
    { key: 'episode', label: 'Episode #' },
  ];

  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 flex-wrap">
        <FocusableSearchInput
          value={episodeSearch}
          onChange={onSearchChange}
          seriesId={seriesId}
        />
        <div className="flex gap-1.5">
          {sortOptions.map((opt) => (
            <FocusableSortPill
              key={opt.key}
              sortKey={opt.key}
              label={opt.label}
              isActive={episodeSort === opt.key}
              onSelect={() => onSortChange(opt.key)}
              seriesId={seriesId}
            />
          ))}
        </div>
        <span className="text-text-muted text-xs ml-auto">
          {episodeCount} episode{episodeCount !== 1 ? 's' : ''}
          {episodeSearch && ` matching "${episodeSearch}"`}
        </span>
      </div>
    </div>
  );
}
