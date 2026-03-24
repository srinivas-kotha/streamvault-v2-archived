import { useEffect, useCallback } from 'react';
import { BACK_KEYS } from '@/constants/keyMappings';

interface UseBackNavigationOptions {
  onBack?: () => void;
}

/**
 * Listens for platform-specific back key events and navigates back.
 *
 * Handles: Fire TV (4), Tizen (10009), webOS (461), Escape (27), Backspace (8).
 * Calls onBack if provided, otherwise window.history.back().
 * Always calls preventDefault on matched back key events.
 */
export function useBackNavigation(options?: UseBackNavigationOptions): void {
  const onBack = options?.onBack;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (BACK_KEYS.includes(e.keyCode)) {
        e.preventDefault();
        if (onBack) {
          onBack();
        } else {
          window.history.back();
        }
      }
    },
    [onBack],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
