import {
  memo,
  useRef,
  useState,
  useEffect,
  useCallback,
  forwardRef,
  type ReactNode,
} from "react";
import { useUIStore } from "@lib/store";
import { isTVMode } from "@shared/utils/isTVMode";

function ScrollArrow({
  direction,
  onClick,
  arrowOpacity,
}: {
  direction: "left" | "right";
  onClick: () => void;
  arrowOpacity: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`absolute ${direction === "left" ? "left-0" : "right-0"} top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-obsidian/80 border border-border-subtle text-text-primary transition-opacity duration-200 hover:bg-surface-raised hover:border-teal/30 ${arrowOpacity}`}
      aria-label={`Scroll ${direction}`}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={direction === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
        />
      </svg>
    </button>
  );
}

interface HorizontalScrollProps {
  children: ReactNode;
  className?: string;
}

/**
 * HorizontalScroll — scroll container for content rails.
 *
 * Features:
 * - scroll-snap-type: x mandatory so D-pad navigation snaps cards cleanly
 * - Peek: right-side padding (64px) reveals partial next card, signalling scrollability
 * - Mouse/keyboard: scroll arrows on hover or keyboard mode
 * - TV mode: arrows hidden (D-pad drives navigation); peek is always visible
 * - scrollbar-hide: no visible scrollbar on any platform
 * - ResizeObserver keeps arrow visibility in sync on viewport changes
 */
export const HorizontalScroll = memo(
  forwardRef<HTMLDivElement, HorizontalScrollProps>(function HorizontalScroll(
    { children, className = "" },
    forwardedRef,
  ) {
    const internalRef = useRef<HTMLDivElement>(null);
    const scrollRef =
      (forwardedRef as React.RefObject<HTMLDivElement | null>) ?? internalRef;

    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const inputMode = useUIStore((s) => s.inputMode);

    const checkScroll = useCallback(() => {
      const el = scrollRef.current;
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, [scrollRef]);

    useEffect(() => {
      checkScroll();
      const el = scrollRef.current;
      if (!el) return;
      el.addEventListener("scroll", checkScroll, { passive: true });
      const observer = new ResizeObserver(checkScroll);
      observer.observe(el);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        observer.disconnect();
      };
    }, [checkScroll, scrollRef]);

    const scroll = (direction: "left" | "right") => {
      const el = scrollRef.current;
      if (!el) return;
      // Scroll by ~3 card widths (card ≈140px + gap 16px = 156px → 3×156 ≈ 468px)
      const scrollAmount = el.clientWidth * 0.75;
      el.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    };

    const isKeyboard = inputMode === "keyboard";

    const arrowOpacity = isKeyboard
      ? "opacity-100"
      : "opacity-0 group-hover/scroll:opacity-100";

    return (
      // Outer wrapper: clips overflow so the peek gradient works correctly,
      // but still allows the peek amount (padding-right on scroll container) to show.
      <div className={`group/scroll relative ${className}`}>
        {!isTVMode && canScrollLeft && (
          <ScrollArrow
            direction="left"
            onClick={() => scroll("left")}
            arrowOpacity={arrowOpacity}
          />
        )}

        <div
          ref={scrollRef}
          data-testid="horizontal-scroll"
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pr-16"
        >
          {children}
        </div>

        {!isTVMode && canScrollRight && (
          <ScrollArrow
            direction="right"
            onClick={() => scroll("right")}
            arrowOpacity={arrowOpacity}
          />
        )}
      </div>
    );
  }),
);
