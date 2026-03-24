import { useCallback } from 'react';
import {
  useFocusable,
  FocusContext,
  setFocus,
  doesFocusableExist,
  type FocusableComponentLayout,
  type FocusDetails,
} from '@noriginmedia/norigin-spatial-navigation';

export { FocusContext, setFocus, doesFocusableExist };

// Re-export pause/resume for player TV mode
export { pause as pauseSpatialNav, resume as resumeSpatialNav } from '@noriginmedia/norigin-spatial-navigation';

interface UseSpatialFocusableOptions {
  focusKey?: string;
  focusable?: boolean;
  saveLastFocusedChild?: boolean;
  trackChildren?: boolean;
  autoRestoreFocus?: boolean;
  forceFocus?: boolean;
  isFocusBoundary?: boolean;
  focusBoundaryDirections?: ('up' | 'down' | 'left' | 'right')[];
  preferredChildFocusKey?: string;
  onEnterPress?: () => void;
  onArrowPress?: (direction: string) => boolean;
  onFocus?: (layout: FocusableComponentLayout, details: FocusDetails) => void;
  onBlur?: (layout: FocusableComponentLayout, details: FocusDetails) => void;
}

/**
 * Wrapper around norigin's useFocusable for focusable leaf elements
 * (cards, buttons, inputs). Adds mouse hover → focusSelf and showFocusRing.
 */
export function useSpatialFocusable(options: UseSpatialFocusableOptions = {}) {
  const { ref, focused, focusSelf, focusKey, hasFocusedChild } = useFocusable({
    focusKey: options.focusKey,
    focusable: options.focusable ?? true,
    saveLastFocusedChild: options.saveLastFocusedChild,
    trackChildren: options.trackChildren,
    autoRestoreFocus: options.autoRestoreFocus,
    forceFocus: options.forceFocus,
    isFocusBoundary: options.isFocusBoundary,
    focusBoundaryDirections: options.focusBoundaryDirections,
    preferredChildFocusKey: options.preferredChildFocusKey,
    onEnterPress: options.onEnterPress,
    onArrowPress: options.onArrowPress ? (dir: string) => options.onArrowPress!(dir) : undefined,
    onFocus: options.onFocus,
    onBlur: options.onBlur,
  });

  // Mouse hover → focus this element (bridges mouse + keyboard modes)
  const onMouseEnter = useCallback(() => {
    focusSelf();
  }, [focusSelf]);

  // Only show focus ring in keyboard mode.
  // Read from data attribute instead of Zustand to avoid re-render cascade
  // when inputMode changes (~110 subscribers would re-render otherwise).
  const showFocusRing = focused && document.documentElement.dataset.inputMode === 'keyboard';

  return {
    ref,
    focused,
    focusSelf,
    focusKey,
    hasFocusedChild,
    showFocusRing,
    focusProps: {
      onMouseEnter,
      'data-focus-key': focusKey,
    },
  };
}

interface UseSpatialContainerOptions {
  focusKey?: string;
  focusable?: boolean;
  saveLastFocusedChild?: boolean;
  trackChildren?: boolean;
  autoRestoreFocus?: boolean;
  forceFocus?: boolean;
  isFocusBoundary?: boolean;
  focusBoundaryDirections?: ('up' | 'down' | 'left' | 'right')[];
  preferredChildFocusKey?: string;
  onFocus?: (layout: FocusableComponentLayout, details: FocusDetails) => void;
  onBlur?: (layout: FocusableComponentLayout, details: FocusDetails) => void;
}

/**
 * Wrapper for container elements (rails, pages, nav groups).
 * Containers are focusable so norigin's focus tree can traverse through them
 * to reach leaf cards. Focus always delegates to children via getNextFocusKey.
 * Must wrap children in FocusContext.Provider.
 */
export function useSpatialContainer(options: UseSpatialContainerOptions = {}) {
  const { ref, focusSelf, focusKey, hasFocusedChild } = useFocusable({
    focusKey: options.focusKey,
    focusable: options.focusable ?? false,
    saveLastFocusedChild: options.saveLastFocusedChild ?? true,
    trackChildren: options.trackChildren ?? true,
    autoRestoreFocus: options.autoRestoreFocus,
    forceFocus: options.forceFocus,
    isFocusBoundary: options.isFocusBoundary,
    focusBoundaryDirections: options.focusBoundaryDirections,
    preferredChildFocusKey: options.preferredChildFocusKey,
    onFocus: options.onFocus,
    onBlur: options.onBlur,
  });

  return {
    ref,
    focusSelf,
    focusKey,
    hasFocusedChild,
  };
}
