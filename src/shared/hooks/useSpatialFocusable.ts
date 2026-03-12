import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { useUIStore } from '@lib/store';

interface UseSpatialFocusableOptions {
  focusKey?: string;
  onEnterPress?: () => void;
  onArrowPress?: (direction: string) => boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  extraProps?: Record<string, unknown>;
}

export function useSpatialFocusable(options: UseSpatialFocusableOptions = {}) {
  const inputMode = useUIStore((s) => s.inputMode);

  const { ref, focused, focusSelf, focusKey } = useFocusable({
    focusKey: options.focusKey,
    onEnterPress: options.onEnterPress,
    onArrowPress: options.onArrowPress,
    onFocus: options.onFocus,
    onBlur: options.onBlur,
    extraProps: options.extraProps,
  });

  const showFocusRing = focused && inputMode === 'keyboard';

  const focusClassName = showFocusRing
    ? 'ring-2 ring-teal/60 ring-offset-2 ring-offset-obsidian shadow-[0_0_20px_rgba(45,212,191,0.25)] scale-[1.05] z-10 relative transition-all duration-200'
    : 'transition-all duration-200';

  return { ref, focused, focusSelf, focusKey, showFocusRing, focusClassName, inputMode };
}
