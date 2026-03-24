/**
 * useFocusStyles
 *
 * Returns device-appropriate Tailwind focus class strings for cards, buttons,
 * and inputs. Centralises the TV vs desktop focus ring tokens so every
 * focusable component stays in sync with design changes.
 *
 * Values are derived from the CSS custom properties defined in tailwind.css:
 *   --shadow-focus     : 0 0 0 2px rgba(20,184,166,0.6)
 *   --shadow-focus-tv  : 0 0 0 3px rgba(20,184,166,0.8), 0 0 20px rgba(20,184,166,0.15)
 *   --color-focus      : #14b8a6 (= accent-teal)
 *
 * Note: isTVMode is a module-level constant (evaluated once at app boot), so
 * FOCUS_STYLES is computed exactly once — the hook has zero runtime cost.
 */

import { isTVMode } from '@shared/utils/isTVMode';

export interface FocusStyleSet {
  /** Classes to apply to a focused card/tile */
  cardFocus: string;
  /** Classes to apply to a focused button */
  buttonFocus: string;
  /** Classes to apply to a focused text input */
  inputFocus: string;
}

// ---------------------------------------------------------------------------
// Module-level constant — computed once at app boot, never recreated
// ---------------------------------------------------------------------------

const FOCUS_STYLES: FocusStyleSet = isTVMode
  ? {
      // TV: thicker ring + ambient glow, readable at 10-foot viewing distance
      // shadow values map to --shadow-focus-tv token
      cardFocus: [
        'ring-[3px] ring-accent-teal',
        'shadow-[var(--shadow-focus-tv)]',
      ].join(' '),

      // TV: thicker ring, no ring-offset (dark bg already provides contrast)
      buttonFocus: 'ring-[3px] ring-accent-teal',

      // TV: standard field highlight — consistent with card style
      inputFocus: 'ring-[3px] ring-accent-teal',
    }
  : {
      // Desktop: subtle 2px ring + translucent glow
      // shadow values map to --shadow-focus token
      cardFocus: [
        'ring-2 ring-accent-teal',
        'shadow-[var(--shadow-focus)]',
      ].join(' '),

      // Desktop: ring with offset so the ring floats above the button bg
      buttonFocus: 'ring-2 ring-accent-teal ring-offset-2 ring-offset-bg-primary',

      // Desktop: clean ring, no offset (inputs have their own border)
      inputFocus: 'ring-2 ring-accent-teal',
    };

// ---------------------------------------------------------------------------
// Hook — returns the pre-computed constant
// ---------------------------------------------------------------------------

/**
 * Returns stable class strings for focus states.
 * Safe to call at module scope or inside any component — no side-effects.
 */
export function useFocusStyles(): FocusStyleSet {
  return FOCUS_STYLES;
}
