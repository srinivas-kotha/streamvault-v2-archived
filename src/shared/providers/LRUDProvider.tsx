import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { Lrud } from '@bam.tech/lrud';
import { useUIStore } from '@lib/store';

// Create a global singleton instance of LRUD for the app
export const lrud = new Lrud();

interface LRUDContextType {
  lrud: Lrud;
}

const LRUDContext = createContext<LRUDContextType | null>(null);

export function useLRUDContext() {
  const context = useContext(LRUDContext);
  if (!context) {
    throw new Error('useLRUDContext must be used within an LRUDProvider');
  }
  return context;
}

interface LRUDProviderProps {
  children: ReactNode;
}

export function LRUDProvider({ children }: LRUDProviderProps) {
  const setInputMode = useUIStore((s) => s.setInputMode);
  const rootRegistered = useRef(false);

  useEffect(() => {
    // Register the root node if not already done
    if (!rootRegistered.current) {
      lrud.registerNode('root', { orientation: 'vertical' });
      rootRegistered.current = true;
    }

    // Handle keydown events to drive LRUD
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept keys when user is typing in an input
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const isNavKey = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Up', 'Down', 'Left', 'Right',
        'Enter', 'Escape', 'Backspace'
      ].includes(e.key);
      
      if (isNavKey) {
        setInputMode('keyboard');
      }

      // Map keys to LRUD directions
      switch (e.key) {
        case 'ArrowUp':
        case 'Up':
          lrud.handleKeyEvent({ direction: 'up' });
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 'Down':
          lrud.handleKeyEvent({ direction: 'down' });
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'Left':
          lrud.handleKeyEvent({ direction: 'left' });
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'Right':
          lrud.handleKeyEvent({ direction: 'right' });
          e.preventDefault();
          break;
        case 'Enter':
          lrud.handleKeyEvent({ direction: 'enter' });
          e.preventDefault();
          break;
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

  return (
    <LRUDContext.Provider value={{ lrud }}>
      {children}
    </LRUDContext.Provider>
  );
}
