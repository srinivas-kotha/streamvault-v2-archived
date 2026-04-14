import { memo } from "react";
import { HorizontalScroll } from "@shared/components/HorizontalScroll";
import { useSpatialContainer, FocusContext } from "@shared/hooks/useSpatialNav";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContentRailProps<T = any> {
  title: string;
  items: T[];
  renderCard: (
    item: T,
    index: number,
    isFirstVisible: boolean,
  ) => React.ReactNode;
  isLoading?: boolean;
  showSeeAll?: boolean;
  onSeeAll?: () => void;
  /** Number of items treated as "first visible" for eager loading (default 6) */
  eagerCount?: number;
  /** Unique focus key — auto-derived from title when omitted */
  focusKey?: string;
}

// ---------------------------------------------------------------------------
// Skeleton cards
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div
      data-testid="card-skeleton"
      className="shrink-0 w-36 aspect-[2/3] rounded-[var(--radius-lg)] bg-bg-secondary animate-pulse snap-start"
    />
  );
}

// ---------------------------------------------------------------------------
// Inner component (always has hooks — no conditional hook calls)
// ---------------------------------------------------------------------------

const ContentRailInner = memo(function ContentRailInner<T = any>({
  title,
  items,
  renderCard,
  isLoading,
  showSeeAll,
  onSeeAll,
  eagerCount = 5,
  focusKey: propFocusKey,
}: ContentRailProps<T>) {
  const railId =
    propFocusKey || `home-rail-${title.replace(/\s+/g, "-").toLowerCase()}`;

  // D-pad focus container: boundary on left/right only so up/down escapes to
  // adjacent rails; saveLastFocusedChild restores focus on back navigation.
  const { ref, focusKey } = useSpatialContainer({
    focusKey: railId,
    saveLastFocusedChild: true,
    isFocusBoundary: true,
    focusBoundaryDirections: ["left", "right"],
  });

  const scrollContent = isLoading ? (
    <div
      data-testid="rail-scroll-container"
      className="flex gap-3 px-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
    >
      {Array.from({ length: eagerCount }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  ) : items.length === 0 ? (
    <div className="px-4 py-6 text-sm text-text-tertiary">
      No items to display
    </div>
  ) : (
    <HorizontalScroll data-testid="rail-scroll-container">
      {items.map((item, index) => {
        const isFirstVisible = index < eagerCount;
        return renderCard(item, index, isFirstVisible);
      })}
    </HorizontalScroll>
  );

  return (
    <FocusContext.Provider value={focusKey}>
      <section ref={ref} role="region" aria-label={title}>
        {/* Header row */}
        <div className="flex items-center justify-between px-4 mb-2">
          <h2 className="text-base font-semibold text-text-primary font-[family-name:var(--font-family-heading)]">
            {title}
          </h2>
          {showSeeAll && onSeeAll && (
            <button
              type="button"
              onClick={onSeeAll}
              className="text-sm text-accent-teal hover-capable:hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal rounded px-2 py-1"
            >
              See All
            </button>
          )}
        </div>

        {scrollContent}
      </section>
    </FocusContext.Provider>
  );
}) as <T>(props: ContentRailProps<T>) => React.ReactElement | null;

// ---------------------------------------------------------------------------
// Public component — early-returns before hooks to avoid ghost focus nodes
// ---------------------------------------------------------------------------

export function ContentRail<T = any>(props: ContentRailProps<T>) {
  const { items, isLoading } = props;
  if (!isLoading && items.length === 0) {
    return (
      <section role="region" aria-label={props.title}>
        <div className="flex items-center justify-between px-4 mb-2">
          <h2 className="text-base font-semibold text-text-primary font-[family-name:var(--font-family-heading)]">
            {props.title}
          </h2>
        </div>
        <div className="px-4 py-6 text-sm text-text-tertiary">
          No items to display
        </div>
      </section>
    );
  }

  return <ContentRailInner {...props} />;
}
