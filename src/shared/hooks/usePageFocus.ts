import { useEffect } from 'react';
import { lrud } from '@shared/providers/LRUDProvider';

/**
 * Sets spatial navigation focus to a target focusKey when the page mounts.
 * Always assigns focus so D-pad works immediately on TV; mouse hover
 * overrides in desktop mode.
 */
export function usePageFocus(focusKey: string, delay = 100) {
  useEffect(() => {
    const timer = setTimeout(() => {
      try { lrud.assignFocus(focusKey); } catch { /* focusKey may not be registered yet */ }
    }, delay);

    return () => clearTimeout(timer);
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
