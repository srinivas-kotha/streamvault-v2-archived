import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

type InputMode = 'pointer' | 'keyboard';

const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

const InputModeContext = createContext<InputMode>('pointer');

/**
 * Tracks whether the user is using pointer (mouse/touch) or keyboard (D-pad/arrows).
 * Toggles `input-pointer` / `input-keyboard` classes on document.documentElement.
 * Only arrow keys trigger keyboard mode (Enter, letters, etc. do not).
 */
export function InputModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<InputMode>('pointer');

  const handlePointerMove = useCallback(() => {
    document.documentElement.classList.remove('input-keyboard');
    document.documentElement.classList.add('input-pointer');
    setMode('pointer');
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!ARROW_KEYS.has(e.key)) return;

    document.documentElement.classList.remove('input-pointer');
    document.documentElement.classList.add('input-keyboard');
    setMode('keyboard');
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePointerMove, handleKeyDown]);

  return (
    <InputModeContext.Provider value={mode}>{children}</InputModeContext.Provider>
  );
}

/**
 * Returns the current input mode: 'pointer' or 'keyboard'.
 * Must be used within InputModeProvider.
 */
export function useInputMode(): InputMode {
  return useContext(InputModeContext);
}
