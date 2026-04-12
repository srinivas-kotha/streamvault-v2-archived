import { useState, useMemo, useRef } from "react";
import { useSportsChannels } from "@features/language/api";
import { ContentRail } from "@shared/components/ContentRail";
import { ChannelCard } from "@/design-system";
import { SkeletonGrid } from "@shared/components/Skeleton";
import { EmptyState } from "@shared/components/EmptyState";
import { PageTransition } from "@shared/components/PageTransition";
import { useDebounce } from "@shared/hooks/useDebounce";
import {
  useSpatialFocusable,
  useSpatialContainer,
} from "@shared/hooks/useSpatialNav";
import { usePageFocus } from "@shared/hooks/usePageFocus";
import { usePlayerStore } from "@lib/store";
import type { XtreamLiveStream } from "@shared/types/api";

function FocusableChip({
  id,
  label,
  isActive,
  onSelect,
}: {
  id: string;
  label: string;
  isActive: boolean;
  onSelect: () => void;
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
      className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-[background-color,border-color,color] min-h-[36px] whitespace-nowrap ${
        isActive
          ? "bg-teal/15 text-teal border border-teal/30"
          : showFocusRing
            ? "bg-surface-raised text-text-primary border border-teal/50 ring-2 ring-teal/40"
            : "bg-surface-raised text-text-muted border border-border-subtle hover:text-text-secondary hover:border-border"
      }`}
    >
      {label}
    </button>
  );
}

function FocusableSearchInput({
  value,
  onChange,
  placeholder,
  focusKey,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  focusKey: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey,
    onEnterPress: () => {
      setTimeout(() => inputRef.current?.focus(), 0);
    },
  });

  return (
    <div
      ref={ref}
      {...focusProps}
      className={`relative flex-1 min-w-[200px] max-w-sm ${showFocusRing ? "ring-2 ring-teal/50 rounded-lg" : ""}`}
    >
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") inputRef.current?.blur();
        }}
        className="w-full pl-10 pr-4 py-2.5 bg-surface-raised border border-border rounded-lg text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal-dim transition-[border-color,box-shadow]"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export function SportsPage() {
  const { rails, isLoading, allChannels, hasCategories } = useSportsChannels();
  const playStream = usePlayerStore((s) => s.playStream);
  usePageFocus("sports-chip-all");

  const { ref: containerRef } = useSpatialContainer({
    focusKey: "SPORTS_PAGE",
    focusable: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const hasActiveFilters = !!debouncedSearch || activeCategory !== null;

  const categoryChips = useMemo(
    () =>
      rails.map((r) => ({
        id: r.category.id,
        name: r.category.name || r.category.originalName,
        count: r.items.length,
      })),
    [rails],
  );

  const totalCount = allChannels.length;

  const processedChannels = useMemo(() => {
    let result: XtreamLiveStream[] = [];

    if (activeCategory) {
      const rail = rails.find((r) => r.category.id === activeCategory);
      result = rail ? rail.items : [];
    } else {
      result = rails.flatMap((r) => r.items);
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((ch) => ch.name.toLowerCase().includes(q));
    }

    return result;
  }, [rails, activeCategory, debouncedSearch]);

  const handlePlay = (channel: XtreamLiveStream) => {
    playStream(channel.id, { streamType: "live", streamName: channel.name });
  };

  return (
    <PageTransition>
      <div ref={containerRef} className="space-y-6 pb-12">
        <h1 className="text-2xl font-bold text-text-primary pt-2">Sports</h1>

        {isLoading ? (
          <SkeletonGrid count={12} aspectRatio="landscape" />
        ) : !hasCategories ? (
          <EmptyState
            title="No sports channels"
            message="No sports categories found. Check back during live events."
            icon="content"
          />
        ) : (
          <>
            {/* Category Filter Chips */}
            {categoryChips.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                <FocusableChip
                  id="sports-chip-all"
                  label={`All (${totalCount})`}
                  isActive={activeCategory === null}
                  onSelect={() => setActiveCategory(null)}
                />
                {categoryChips.map((chip) => (
                  <FocusableChip
                    key={chip.id}
                    id={`sports-chip-${chip.id}`}
                    label={`${chip.name} (${chip.count})`}
                    isActive={activeCategory === chip.id}
                    onSelect={() =>
                      setActiveCategory(
                        chip.id === activeCategory ? null : chip.id,
                      )
                    }
                  />
                ))}
              </div>
            )}

            {/* Search Bar */}
            <FocusableSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search sports channels..."
              focusKey="sports-search"
            />

            {/* Content */}
            {hasActiveFilters ? (
              processedChannels.length === 0 ? (
                <EmptyState
                  title="No matching channels"
                  message={
                    debouncedSearch
                      ? `No channels matching "${debouncedSearch}".`
                      : "No channels in this category."
                  }
                  icon="content"
                />
              ) : (
                <div>
                  <p className="text-text-muted text-xs mb-3">
                    {processedChannels.length} channel
                    {processedChannels.length !== 1 ? "s" : ""}
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
                    {processedChannels.map((channel) => (
                      <ChannelCard
                        key={channel.id}
                        channelName={channel.name}
                        logoUrl={channel.icon || ""}
                        isLive={true}
                        onClick={() => handlePlay(channel)}
                      />
                    ))}
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-8">
                {rails.map((rail) => (
                  <ContentRail
                    key={rail.category.id}
                    title={rail.category.name || rail.category.originalName}
                    flat
                  >
                    {rail.items.map((item) => (
                      <ChannelCard
                        key={item.id}
                        focusKey={`sports-${item.id}`}
                        channelName={item.name}
                        logoUrl={item.icon || ""}
                        isLive={true}
                        onClick={() => handlePlay(item)}
                      />
                    ))}
                  </ContentRail>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
