import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { Lrud } from '@bam.tech/lrud';
import { useUIStore } from '@lib/store';

// Create a global singleton instance of LRUD for the app
export const lrud = new Lrud();

// Expose to window for Fire TV debug overlay
(window as unknown as Record<string, unknown>).__LRUD_INSTANCE__ = lrud;

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

    // Dedup: Fire TV APK dispatches to both window AND document to handle
    // cached vs fresh frontend. Skip if same key fires twice within 50ms.
    let lastKeyTime = 0;
    let lastKeyCode = '';

    // Handle keydown events to drive LRUD.
    // Use capture phase so we intercept before any child element can swallow the event.
    function handleKeyDown(e: KeyboardEvent) {
      const now = Date.now();
      if (e.key === lastKeyCode && now - lastKeyTime < 50) return;
      lastKeyTime = now;
      lastKeyCode = e.key;
      // Don't intercept keys when user is typing in an input — EXCEPT arrow
      // keys which should escape the input and navigate via LRUD
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const isInInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
                        'Up', 'Down', 'Left', 'Right'].includes(e.key);

      // Let non-arrow keys through to inputs normally
      if (isInInput && !isArrow) return;

      const isNavKey = isArrow || ['Enter', 'Escape', 'Backspace'].includes(e.key);

      if (isNavKey) {
        setInputMode('keyboard');

        // On first key press, if LRUD has no focused node, assign focus to root.
        // This bootstraps D-pad navigation on TV/Fire Stick where there's no mouse.
        if (!lrud.currentFocusNode) {
          try { lrud.assignFocus('root'); } catch { /* no focusable nodes yet */ }
        }
      }

      // If in an input and arrow pressed, blur the input first so LRUD takes over
      if (isInInput && isArrow) {
        (document.activeElement as HTMLElement)?.blur();
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

    // Listen on BOTH document and window with capture phase.
    // Fire TV APK dispatches synthetic KeyboardEvents to both targets.
    // Dedup above prevents double-firing LRUD.
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [setInputMode]);

  return (
    <LRUDContext.Provider value={{ lrud }}>
      {children}
    </LRUDContext.Provider>
  );
}
