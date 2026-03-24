import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';

// ── import from expected implementation paths (will fail until alpha implements) ─
import { InputModeProvider, useInputMode } from '../InputModeProvider';

// ── helpers ───────────────────────────────────────────────────────────────────

function wrapper({ children }: { children: ReactNode }) {
  return <InputModeProvider>{children}</InputModeProvider>;
}

function firePointerMove() {
  window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
}

function fireKeyDown(key: string, keyCode: number) {
  window.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      keyCode,
      bubbles: true,
      cancelable: true,
    }),
  );
}

function fireArrowKey(direction: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight') {
  const keyCodes: Record<string, number> = {
    ArrowUp: 38,
    ArrowDown: 40,
    ArrowLeft: 37,
    ArrowRight: 39,
  };
  fireKeyDown(direction, keyCodes[direction]);
}

// ── setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  document.documentElement.classList.remove('input-pointer', 'input-keyboard');
});

afterEach(() => {
  document.documentElement.classList.remove('input-pointer', 'input-keyboard');
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe('InputModeProvider — pointer mode', () => {
  it('sets mode to "pointer" on pointermove', () => {
    const { result } = renderHook(() => useInputMode(), { wrapper });

    act(() => {
      firePointerMove();
    });

    expect(result.current).toBe('pointer');
  });

  it('adds "input-pointer" class to documentElement on pointermove', () => {
    renderHook(() => useInputMode(), { wrapper });

    act(() => {
      firePointerMove();
    });

    expect(document.documentElement.classList.contains('input-pointer')).toBe(true);
    expect(document.documentElement.classList.contains('input-keyboard')).toBe(false);
  });
});

describe('InputModeProvider — keyboard mode', () => {
  it('sets mode to "keyboard" on ArrowUp keydown', () => {
    const { result } = renderHook(() => useInputMode(), { wrapper });

    act(() => {
      fireArrowKey('ArrowUp');
    });

    expect(result.current).toBe('keyboard');
  });

  it('sets mode to "keyboard" on ArrowDown keydown', () => {
    const { result } = renderHook(() => useInputMode(), { wrapper });

    act(() => {
      fireArrowKey('ArrowDown');
    });

    expect(result.current).toBe('keyboard');
  });

  it('sets mode to "keyboard" on ArrowLeft keydown', () => {
    const { result } = renderHook(() => useInputMode(), { wrapper });

    act(() => {
      fireArrowKey('ArrowLeft');
    });

    expect(result.current).toBe('keyboard');
  });

  it('sets mode to "keyboard" on ArrowRight keydown', () => {
    const { result } = renderHook(() => useInputMode(), { wrapper });

    act(() => {
      fireArrowKey('ArrowRight');
    });

    expect(result.current).toBe('keyboard');
  });

  it('adds "input-keyboard" class to documentElement on arrow keydown', () => {
    renderHook(() => useInputMode(), { wrapper });

    act(() => {
      fireArrowKey('ArrowDown');
    });

    expect(document.documentElement.classList.contains('input-keyboard')).toBe(true);
    expect(document.documentElement.classList.contains('input-pointer')).toBe(false);
  });
});

describe('InputModeProvider — mode transitions', () => {
  it('switches from pointer to keyboard on arrow key', () => {
    const { result } = renderHook(() => useInputMode(), { wrapper });

    act(() => {
      firePointerMove();
    });
    expect(result.current).toBe('pointer');

    act(() => {
      fireArrowKey('ArrowUp');
    });
    expect(result.current).toBe('keyboard');
  });

  it('switches from keyboard to pointer on pointermove', () => {
    const { result } = renderHook(() => useInputMode(), { wrapper });

    act(() => {
      fireArrowKey('ArrowDown');
    });
    expect(result.current).toBe('keyboard');

    act(() => {
      firePointerMove();
    });
    expect(result.current).toBe('pointer');
  });

  it('replaces class on documentElement when mode transitions', () => {
    renderHook(() => useInputMode(), { wrapper });

    act(() => {
      firePointerMove();
    });
    expect(document.documentElement.classList.contains('input-pointer')).toBe(true);

    act(() => {
      fireArrowKey('ArrowLeft');
    });
    expect(document.documentElement.classList.contains('input-keyboard')).toBe(true);
    expect(document.documentElement.classList.contains('input-pointer')).toBe(false);

    act(() => {
      firePointerMove();
    });
    expect(document.documentElement.classList.contains('input-pointer')).toBe(true);
    expect(document.documentElement.classList.contains('input-keyboard')).toBe(false);
  });
});

describe('InputModeProvider — non-arrow keys do NOT trigger keyboard mode', () => {
  it('does NOT switch to keyboard on Enter key', () => {
    const { result } = renderHook(() => useInputMode(), { wrapper });

    // Start in pointer mode
    act(() => {
      firePointerMove();
    });
    expect(result.current).toBe('pointer');

    act(() => {
      fireKeyDown('Enter', 13);
    });

    // Should remain pointer (only arrow keys switch to keyboard mode)
    expect(result.current).toBe('pointer');
  });

  it('does NOT switch to keyboard on letter keys', () => {
    const { result } = renderHook(() => useInputMode(), { wrapper });

    act(() => {
      firePointerMove();
    });

    act(() => {
      fireKeyDown('a', 65);
    });

    expect(result.current).toBe('pointer');
  });
});

describe('useInputMode — context access', () => {
  it('provides current inputMode via useInputMode hook', () => {
    const { result } = renderHook(() => useInputMode(), { wrapper });

    // Should return a string value (the initial mode)
    expect(typeof result.current).toBe('string');
  });
});

describe('InputModeProvider — cleanup', () => {
  it('removes event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useInputMode(), { wrapper });

    unmount();

    // Should clean up both pointermove and keydown listeners
    const removedEvents = removeEventListenerSpy.mock.calls.map((call) => call[0]);
    expect(removedEvents).toContain('pointermove');
    expect(removedEvents).toContain('keydown');

    removeEventListenerSpy.mockRestore();
  });
});
