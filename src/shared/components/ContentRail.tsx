import { createContext, useContext, type ReactNode } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useLRUD } from '@shared/hooks/useLRUD';
import { useUIStore } from '@lib/store';
import { HorizontalScroll } from './HorizontalScroll';

const RailContext = createContext<string>('root');
export function useRailParent() { return useContext(RailContext); }


interface ContentRailProps {
  title: string;
  seeAllTo?: string;
  children: ReactNode;
  className?: string;
  emptyMessage?: string;
  isEmpty?: boolean;
  isLoading?: boolean;
  focusKey?: string;
  parentFocusKey?: string;
}

function FocusableSeeAll({ to, parentFocusKey }: { to: string; parentFocusKey: string }) {
  const inputMode = useUIStore((s) => s.inputMode);
  const navigate = useNavigate();
  
  const { ref, isFocused, focusProps } = useLRUD({
    id: `see-all-${parentFocusKey}`,
    parent: parentFocusKey,
    onEnter: () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigate({ to: to as any });
    },
  });
  
  const showFocus = isFocused && inputMode === 'keyboard';

  return (
    <div ref={ref} {...focusProps}>
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        to={to as any}
        className={`text-sm text-teal hover:text-teal/80 transition-colors whitespace-nowrap min-h-[44px] flex items-center ${
          showFocus ? 'ring-2 ring-teal/50 rounded px-2' : ''
        }`}
      >
        See All →
      </Link>
    </div>
  );
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
  parentFocusKey = 'root',
}: ContentRailProps) {
  const focusKeyId = propFocusKey || `rail-${title.replace(/\s+/g, '-').toLowerCase()}`;

  const { ref } = useLRUD({
    id: focusKeyId,
    parent: parentFocusKey,
    orientation: 'horizontal',
    isWrapping: true,
    isIndexAlign: true,
    isFocusable: false,
  });

  if (isEmpty && !isLoading) return null;

  return (
    <section ref={ref} className={`${className}`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3 px-6 lg:px-10">
        <h2 className="font-display text-lg lg:text-xl font-semibold text-text-primary">
          {title}
        </h2>
        {seeAllTo && (
          <FocusableSeeAll to={seeAllTo} parentFocusKey={focusKeyId} />
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
              <RailContext.Provider value={focusKeyId}>
                {children}
              </RailContext.Provider>
            </HorizontalScroll>
          )}
        </div>
      </section>
  );
}

