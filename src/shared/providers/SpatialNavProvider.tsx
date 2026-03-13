import { useEffect, type ReactNode } from 'react';
import { init, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useUIStore } from '@lib/store';

// Initialize spatial navigation at module level (before any component renders).
// init() is idempotent — safe to call multiple times.
init({
  debug: false,
  visualDebug: false,
  distanceCalculationMethod: 'center',
  shouldUseNativeEvents: true,
  shouldFocusDOMNode: true,
  useGetBoundingClientRect: true,
  throttle: 100,
  throttleKeypresses: true,
});

interface SpatialNavProviderProps {
  children: ReactNode;
}

export function SpatialNavProvider({ children }: SpatialNavProviderProps) {
  const setInputMode = useUIStore((s) => s.setInputMode);

  useEffect(() => {
    // Fire TV APK dispatches KeyboardEvents to both window AND document.
    // Dedup: skip if same key fires twice within 50ms.
    let lastKeyTime = 0;
    let lastKeyCode = '';

    function handleKeyDown(e: KeyboardEvent) {
      const now = Date.now();
      if (e.key === lastKeyCode && now - lastKeyTime < 50) return;
      lastKeyTime = now;
      lastKeyCode = e.key;

      // Don't intercept when typing in inputs — EXCEPT arrow keys
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const isInInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
                        'Up', 'Down', 'Left', 'Right'].includes(e.key);

      if (isInInput && !isArrow) return;

      // When suppressArrowNav is true (player active in TV mode), skip arrow handling
      if (isArrow && useUIStore.getState().suppressArrowNav) return;

      if (isArrow) {
        e.preventDefault();  // Prevent native scroll — norigin handles focus movement, card onFocus scrolls into view
      }

      const isNavKey = isArrow || ['Enter', 'Escape', 'Backspace'].includes(e.key);

      if (isNavKey) {
        setInputMode('keyboard');
      }

      // If in an input and arrow pressed, blur so spatial nav takes over
      if (isInInput && isArrow) {
        (document.activeElement as HTMLElement)?.blur();
      }

      // Back button handler (TV remotes: Escape, Tizen: 10009, LG: 461)
      if (e.key === 'Escape' || e.keyCode === 10009 || e.keyCode === 461) {
        // Back navigation — let the app's router handle it
        // norigin doesn't handle back, so we rely on browser/app history
        if (e.key !== 'Escape') {
          window.history.back();
          e.preventDefault();
        }
      }

      // Bootstrap focus on first nav key if nothing is focused
      if (isNavKey && !document.querySelector('[data-focused="true"]')) {
        try { setFocus('SN:ROOT'); } catch { /* no focusable nodes yet */ }
      }
    }

    function handleMouseMove() {
      setInputMode('mouse');
    }

    // Listen on BOTH document and window with capture phase.
    // Fire TV APK dispatches synthetic events to both targets.
    // 50ms dedup above prevents double-firing.
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [setInputMode]);

  return <>{children}</>;
}
