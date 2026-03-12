import { useEffect } from 'react';
import { setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useUIStore } from '@lib/store';

/**
 * Sets spatial navigation focus to a target focusKey when the page mounts.
 * Only activates when in keyboard/TV mode (not mouse).
 */
export function usePageFocus(focusKey: string, delay = 100) {
  const inputMode = useUIStore((s) => s.inputMode);

  useEffect(() => {
    if (inputMode !== 'keyboard') return;

    const timer = setTimeout(() => {
      try { setFocus(focusKey); } catch { /* focusKey may not be registered yet */ }
    }, delay);

    return () => clearTimeout(timer);
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
