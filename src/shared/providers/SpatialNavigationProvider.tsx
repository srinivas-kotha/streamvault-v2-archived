import { useEffect, type ReactNode } from 'react';
import { init } from '@noriginmedia/norigin-spatial-navigation';
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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Backspace'].includes(e.key)) {
        setInputMode('keyboard');
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
