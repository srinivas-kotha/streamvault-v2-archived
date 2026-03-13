import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { Lrud } from '@bam.tech/lrud';
import { useUIStore } from '@lib/store';
// Note: useUIStore.getState() is used directly (not as a hook) inside the keydown handler
// to read suppressArrowNav synchronously without re-rendering LRUDProvider.

// Create a global singleton instance of LRUD for the app.
// Root must be registered at module level — NOT in useEffect — because React fires
// child useEffects before parent useEffects. If root is registered in LRUDProvider's
// useEffect, all child useLRUD registrations silently fail (parent 'root' not found).
export const lrud = new Lrud();
lrud.registerNode('root', { orientation: 'vertical' });

// Expose to window for Fire TV debug overlay
(window as unknown as Record<string, unknown>).__LRUD_INSTANCE__ = lrud;

// Debug: dump LRUD tree structure (call from console: __LRUD_DUMP__())
(window as unknown as Record<string, unknown>).__LRUD_DUMP__ = () => {
  function dumpNode(node: Record<string, unknown>, depth = 0): string {
    const indent = '  '.repeat(depth);
    const id = node.id as string;
    const orient = node.orientation ? ` (${node.orientation})` : '';
    const focusable = node.isFocusable ? ' [F]' : '';
    const focused = lrud.currentFocusNode?.id === id ? ' <<<' : '';
    const children = node.children as Record<string, unknown>[] | undefined;
    let result = `${indent}${id}${orient}${focusable}${focused}\n`;
    if (children) {
      for (const child of children) {
        result += dumpNode(child, depth + 1);
      }
    }
    return result;
  }
  const root = lrud.getRootNode();
  const nodeCount = Object.keys((lrud as unknown as Record<string, unknown>).nodes as object).length;
  const focusId = lrud.currentFocusNode?.id ?? 'none';
  const dump = root ? dumpNode(root as unknown as Record<string, unknown>) : 'No root node';
  console.log(`[LRUD Tree] ${nodeCount} nodes, focus: ${focusId}\n${dump}`);
  return dump;
};

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

  useEffect(() => {
    // Root is registered at module level (above) so it exists before any child effects.

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

      // When suppressArrowNav is true (e.g. player is active in TV mode),
      // skip arrow handling so usePlayerKeyboard can handle seek/volume exclusively
      if (isArrow && useUIStore.getState().suppressArrowNav) return;

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
      const dirMap: Record<string, string> = {
        ArrowUp: 'up', Up: 'up',
        ArrowDown: 'down', Down: 'down',
        ArrowLeft: 'left', Left: 'left',
        ArrowRight: 'right', Right: 'right',
        Enter: 'enter',
      };
      const dir = dirMap[e.key];
      if (dir) {
        const before = lrud.currentFocusNode?.id;
        const result = lrud.handleKeyEvent({ direction: dir as 'up' | 'down' | 'left' | 'right' | 'enter' });
        const after = lrud.currentFocusNode?.id;
        // Debug: log navigation moves (remove after D-pad is verified working)
        if (dir !== 'enter') {
          console.debug(`[LRUD] ${dir}: ${before} → ${after}${result ? '' : ' (no move)'}`);
        }
        e.preventDefault();
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
