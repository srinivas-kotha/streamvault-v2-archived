/**
 * FocusableButton
 *
 * Composes the design-system Button primitive with norigin spatial navigation
 * so D-pad Enter and mouse click both trigger the action.
 *
 * Critical norigin rules applied here:
 * - useFocusable() is called unconditionally (never behind a conditional render)
 * - ref from useFocusable is forwarded to the DOM element so norigin can
 *   measure bounding rects for pixel-based distance calculations
 * - focusProps spreads data-focus-key and onMouseEnter so the global Enter
 *   handler in SpatialNavProvider can find and click this element
 *
 * Focus ring is driven by showFocusRing (keyboard-mode only, from
 * useSpatialFocusable) via the FocusRing wrapper — not via CSS :focus-visible,
 * which doesn't fire reliably from D-pad events.
 */

import { useCallback, type ElementType } from 'react';
import { useSpatialFocusable } from '@shared/hooks/useSpatialNav';
import { Button, type ButtonVariant, type ButtonSize } from '@/design-system/primitives/Button';
import { FocusRing } from './FocusRing';
import { cn } from '@/shared/utils/cn';

export interface FocusableButtonProps {
  /** Spatial navigation focus key — must be unique within the focus tree */
  focusKey?: string;
  /** Called when Enter/Select is pressed while focused, or when clicked */
  onEnterPress?: () => void;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Render the button as a different element (e.g. 'a') */
  as?: ElementType;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
  /** aria-label for icon-only buttons */
  'aria-label'?: string;
}

export function FocusableButton({
  focusKey,
  onEnterPress,
  onClick,
  variant = 'primary',
  size = 'md',
  as,
  className,
  disabled,
  children,
  'aria-label': ariaLabel,
}: FocusableButtonProps) {
  const handleEnter = useCallback(() => {
    if (onEnterPress) {
      onEnterPress();
    } else {
      onClick?.();
    }
  }, [onEnterPress, onClick]);

  const { ref, showFocusRing, focusProps } = useSpatialFocusable({
    focusKey,
    focusable: !disabled,
    onEnterPress: handleEnter,
  });

  return (
    // FocusRing wraps the Button so the ring renders around the button's own
    // border radius. We pass rounded-[inherit] via className to forward radius.
    <FocusRing isFocused={showFocusRing} variant="button">
      <Button
        ref={ref}
        as={as}
        variant={variant}
        size={size}
        disabled={disabled}
        aria-label={ariaLabel}
        onClick={onClick}
        className={cn(
          // Remove the native focus-visible ring — FocusRing handles it
          'focus-visible:ring-0 focus-visible:ring-offset-0',
          className,
        )}
        {...focusProps}
      >
        {children}
      </Button>
    </FocusRing>
  );
}
