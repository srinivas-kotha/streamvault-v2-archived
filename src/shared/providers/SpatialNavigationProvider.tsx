import { useEffect, useRef, type ReactNode } from 'react';
import { init, setFocus } from '@noriginmedia/norigin-spatial-navigation';
import { useUIStore } from '@lib/store';

// Initialize spatial navigation
init({
  debug: false,
  visualDebug: false,
  distanceCalculationMethod: 'center',
});

interface Props {
  children: ReactNode;
}

export function SpatialNavigationProvider({ children }: Props) {
  const setInputMode = useUIStore((s) => s.setInputMode);
  const hasAutoFocused = useRef(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isNavKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Backspace'].includes(e.key);
      if (isNavKey) {
        setInputMode('keyboard');

        // Auto-focus the first focusable element on first D-pad press
        if (!hasAutoFocused.current) {
          hasAutoFocused.current = true;
          // Try hero banner first, then top nav
          try { setFocus('hero-banner'); } catch { try { setFocus('top-nav'); } catch { /* noop */ } }
        }
      }
    }
    function handleMouseMove() {
      setInputMode('mouse');
    }
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [setInputMode]);

  return <>{children}</>;
}
