import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useUIStore } from '@lib/store';
import { isTVMode } from '@shared/utils/isTVMode';

function ScrollArrow({ direction, onClick, arrowOpacity }: {
  direction: 'left' | 'right';
  onClick: () => void;
  arrowOpacity: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`absolute ${direction === 'left' ? 'left-0' : 'right-0'} top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-obsidian/80 border border-border-subtle text-text-primary transition-opacity duration-200 hover:bg-surface-raised hover:border-teal/30 ${arrowOpacity}`}
      aria-label={`Scroll ${direction}`}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={direction === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  );
}

interface HorizontalScrollProps {
  children: ReactNode;
  className?: string;
}

export function HorizontalScroll({ children, className = '' }: HorizontalScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const inputMode = useUIStore((s) => s.inputMode);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      observer.disconnect();
    };
  }, [checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const isKeyboard = inputMode === 'keyboard';

  // In keyboard mode, arrows are always visible; in mouse mode, only on hover
  const arrowOpacity = isKeyboard
    ? 'opacity-100'
    : 'opacity-0 group-hover/scroll:opacity-100';

  return (
    <div className={`group/scroll relative ${className}`}>
      {/* Left arrow — hidden in TV mode (D-pad users scroll via focus + scrollIntoView) */}
      {!isTVMode && canScrollLeft && (
        <ScrollArrow direction="left" onClick={() => scroll('left')} arrowOpacity={arrowOpacity} />
      )}

      {/* Scrollable area */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
      >
        {children}
      </div>

      {/* Right arrow — hidden in TV mode */}
      {!isTVMode && canScrollRight && (
        <ScrollArrow direction="right" onClick={() => scroll('right')} arrowOpacity={arrowOpacity} />
      )}
    </div>
  );
}
