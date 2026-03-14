import { useRef, type ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useSpatialFocusable, useSpatialContainer, FocusContext } from '@shared/hooks/useSpatialNav';
import { HorizontalScroll } from './HorizontalScroll';

function FocusableSeeAllCard({ to, parentFocusKey }: { to: string; parentFocusKey: string }) {
  const navigate = useNavigate();

  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey: `see-all-${parentFocusKey}`,
    onEnterPress: () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic route path from props
      navigate({ to: to as any });
    },
  });

  return (
    <div className="rail-item flex-shrink-0">
      <div
        ref={ref}
        {...focusProps}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic route path from props
        onClick={() => navigate({ to: to as any })}
        className={`flex items-center justify-center aspect-[2/3] rounded-lg border cursor-pointer transition-all duration-200 ${
          showFocusRing
            ? 'border-teal bg-teal/10 scale-[1.08] ring-2 ring-teal/60 ring-offset-2 ring-offset-obsidian shadow-[0_0_24px_rgba(45,212,191,0.3)]'
            : 'border-border-subtle bg-surface-raised/50 hover:border-teal/30 hover:bg-surface-raised'
        }`}
      >
        <div className="text-center px-2">
          <svg className={`w-6 h-6 mx-auto mb-2 ${showFocusRing ? 'text-teal' : 'text-text-muted'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className={`text-xs font-medium ${showFocusRing ? 'text-teal' : 'text-text-muted'}`}>
            See All
          </span>
        </div>
      </div>
    </div>
  );
}

interface ContentRailProps {
  title: string;
  seeAllTo?: string;
  children: ReactNode;
  className?: string;
  isEmpty?: boolean;
  isLoading?: boolean;
  focusKey?: string;
}

/**
 * ContentRail — early-returns BEFORE mounting the inner component
 * to avoid the norigin conditional render anti-pattern
 * (calling useFocusable then returning null registers a ghost node).
 */
export function ContentRail(props: ContentRailProps) {
  const { isEmpty = false, isLoading = false } = props;

  // Return null BEFORE any hooks are called — prevents ghost focus nodes
  if (isEmpty && !isLoading) return null;

  return <ContentRailInner {...props} />;
}

/** Inner component — only mounts when rail has content or is loading */
function ContentRailInner({
  title,
  seeAllTo,
  children,
  className = '',
  isLoading = false,
  focusKey: propFocusKey,
}: ContentRailProps) {
  const railId = propFocusKey || `rail-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const scrollRef = useRef<HTMLDivElement>(null);

  const { ref, focusKey } = useSpatialContainer({
    focusKey: railId,
    saveLastFocusedChild: true,
    isFocusBoundary: true,
    focusBoundaryDirections: ['left', 'right'],
  });

  return (
    <FocusContext.Provider value={focusKey}>
      <section ref={ref} className={`${className}`}>
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="font-display text-lg lg:text-xl font-semibold text-text-primary">
            {title}
          </h2>
        </div>

        <div>
          {isLoading ? (
            <div className="flex gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="rail-item flex-shrink-0 animate-pulse">
                  <div className="aspect-[2/3] bg-surface-raised rounded-lg" />
                  <div className="mt-2 h-4 bg-surface-raised rounded w-3/4" />
                  <div className="mt-1 h-3 bg-surface-raised rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <HorizontalScroll ref={scrollRef}>
              {children}
              {seeAllTo && (
                <FocusableSeeAllCard to={seeAllTo} parentFocusKey={railId} />
              )}
            </HorizontalScroll>
          )}
        </div>
      </section>
    </FocusContext.Provider>
  );
}
