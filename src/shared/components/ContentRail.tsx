import { type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';
import { HorizontalScroll } from './HorizontalScroll';

interface ContentRailProps {
  title: string;
  seeAllTo?: string;
  children: ReactNode;
  className?: string;
  emptyMessage?: string;
  isEmpty?: boolean;
  isLoading?: boolean;
  focusKey?: string;
}

export function ContentRail({
  title,
  seeAllTo,
  children,
  className = '',
  emptyMessage: _emptyMessage = 'Nothing here yet',
  isEmpty = false,
  isLoading = false,
  focusKey: propFocusKey,
}: ContentRailProps) {
  const { ref, focusKey } = useFocusable({
    focusKey: propFocusKey,
    saveLastFocusedChild: true,
    trackChildren: true,
  });

  if (isEmpty && !isLoading) return null;

  return (
    <FocusContext.Provider value={focusKey}>
      <section ref={ref} className={`${className}`}>
        {/* Header row */}
        <div className="flex items-center justify-between mb-3 px-6 lg:px-10">
          <h2 className="font-display text-lg lg:text-xl font-semibold text-text-primary">
            {title}
          </h2>
          {seeAllTo && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              to={seeAllTo as any}
              className="text-sm text-teal hover:text-teal/80 transition-colors whitespace-nowrap min-h-[44px] flex items-center"
            >
              See All →
            </Link>
          )}
        </div>

        {/* Content */}
        <div className="px-6 lg:px-10">
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
            <HorizontalScroll>
              {children}
            </HorizontalScroll>
          )}
        </div>
      </section>
    </FocusContext.Provider>
  );
}

