/**
 * FocusableCard (design-system)
 *
 * Generic card wrapper that adds norigin spatial navigation focus to any
 * child card component. Use this to make PosterCard, LandscapeCard, or
 * HeroCard focusable with D-pad navigation.
 *
 * Critical norigin rules applied here:
 * - ref from useFocusable is forwarded to the outermost DOM element so
 *   norigin can measure bounding rects. Without this, distance calculations
 *   fail and focus jumps unpredictably.
 * - useFocusable() is called unconditionally — the component must never
 *   conditionally return null after calling it. Callers must guard rendering
 *   at the call site.
 * - scrollIntoView uses behavior:'instant' not 'smooth' — smooth causes
 *   mid-navigation layout shifts that break pixel distance calculations.
 * - scale applied via className, NOT transform on a focusable wrapper, to
 *   avoid breaking position:fixed children (players, modals).
 * - Container focusable is not set here — this is a leaf focusable.
 *   Containers wrapping multiple FocusableCards should use useSpatialContainer
 *   with focusable:false to avoid blocking cross-section navigation.
 */

import { useCallback, type ReactNode } from 'react';
import { type FocusableComponentLayout, type FocusDetails } from '@noriginmedia/norigin-spatial-navigation';
import { useSpatialFocusable } from '@shared/hooks/useSpatialNav';
import { FocusRing } from '@/design-system/focus/FocusRing';
import { cn } from '@/shared/utils/cn';

export interface FocusableCardProps {
  children: ReactNode;
  /** Called when Enter/Select is pressed while focused */
  onEnterPress?: () => void;
  /** Called when the element receives spatial nav focus */
  onFocus?: (layout: FocusableComponentLayout, details: FocusDetails) => void;
  /** Spatial navigation focus key — must be unique within the focus tree */
  focusKey?: string;
  /** Additional classes on the focusable wrapper */
  className?: string;
}

export function FocusableCard({
  children,
  onEnterPress,
  onFocus,
  focusKey,
  className,
}: FocusableCardProps) {
  const handleFocus = useCallback(
    (layout: FocusableComponentLayout, details: FocusDetails) => {
      // Scroll focused card into view without layout-shift side-effects.
      // 'instant' is critical — 'smooth' animates while norigin is measuring
      // bounding rects, causing the measured position to drift.
      layout.node?.scrollIntoView({ behavior: 'instant', block: 'nearest' });
      onFocus?.(layout, details);
    },
    [onFocus],
  );

  const { ref, showFocusRing, focused, focusProps } = useSpatialFocusable({
    focusKey,
    onEnterPress,
    onFocus: handleFocus,
  });

  return (
    // FocusRing wraps the card content and applies the ring + shadow.
    // The inner div carries the ref so norigin measures the card dimensions,
    // not the FocusRing wrapper (they have identical dimensions but this keeps
    // the data-focus-key on the correct element for the global Enter handler).
    <FocusRing
      isFocused={showFocusRing}
      variant="card"
      className={cn(
        // Scale on spatial focus (not just showFocusRing) so TV users see
        // feedback even before keyboard-mode is detected on first D-pad press.
        focused && 'scale-[1.04]',
        'transition-[transform,box-shadow,ring-color] duration-200 ease-out',
        className,
      )}
    >
      <div
        ref={ref}
        {...focusProps}
      >
        {children}
      </div>
    </FocusRing>
  );
}
