/**
 * FocusRing
 *
 * Single source of truth for all focus visual styles. Wraps children and
 * conditionally applies a focus ring when isFocused is true.
 *
 * Design decisions:
 * - TV mode detection via isTVMode constant (not a class check) — avoids DOM
 *   coupling and is evaluated once at module load.
 * - Transition limited to box-shadow and ring-color (never transition-all) to
 *   avoid expensive full-property diffing on TV WebViews.
 * - The wrapper is a <div> with `relative` so children with absolute
 *   positioning (badges, overlays) still clip correctly.
 * - `rounded-inherit` is not supported by all browsers; we pass through the
 *   caller's className so radius is set on the outer wrapper directly.
 */

import { type ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';
import { useFocusStyles } from './useFocusStyles';

export type FocusRingVariant = 'card' | 'button' | 'input';

export interface FocusRingProps {
  /** Whether this element currently has spatial nav focus */
  isFocused: boolean;
  /** Determines which focus ring style to apply */
  variant: FocusRingVariant;
  children: ReactNode;
  /** Extra classes forwarded to the wrapper element (e.g. border-radius) */
  className?: string;
}

export function FocusRing({ isFocused, variant, children, className }: FocusRingProps) {
  const focusStyles = useFocusStyles();

  // Map variant → the class string for the focused state
  const focusedClass: Record<FocusRingVariant, string> = {
    card: focusStyles.cardFocus,
    button: focusStyles.buttonFocus,
    input: focusStyles.inputFocus,
  };

  return (
    <div
      className={cn(
        'relative',
        // Always apply transition so ring fades in/out smoothly — never transition-all
        'transition-[box-shadow,ring-color] duration-200 ease-out',
        isFocused && focusedClass[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
