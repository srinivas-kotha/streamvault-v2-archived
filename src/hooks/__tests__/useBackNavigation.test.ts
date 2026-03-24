import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── import from expected implementation path (will fail until alpha implements) ─
import { useBackNavigation } from '../useBackNavigation';

// ── helpers ───────────────────────────────────────────────────────────────────

function fireKeyDown(keyCode: number, key?: string) {
  const event = new KeyboardEvent('keydown', {
    keyCode,
    key: key ?? '',
    bubbles: true,
    cancelable: true,
  });
  window.dispatchEvent(event);
  return event;
}

// ── setup / teardown ──────────────────────────────────────────────────────────

let historyBackSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  historyBackSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});
});

afterEach(() => {
  historyBackSpy.mockRestore();
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe('useBackNavigation — Fire TV back button', () => {
  it('handles Fire TV back key (keyCode 4)', () => {
    renderHook(() => useBackNavigation());

    act(() => {
      fireKeyDown(4, 'Backspace');
    });

    expect(historyBackSpy).toHaveBeenCalledTimes(1);
  });
});

describe('useBackNavigation — Samsung Tizen back button', () => {
  it('handles Tizen back key (keyCode 10009)', () => {
    renderHook(() => useBackNavigation());

    act(() => {
      fireKeyDown(10009);
    });

    expect(historyBackSpy).toHaveBeenCalledTimes(1);
  });
});

describe('useBackNavigation — LG webOS back button', () => {
  it('handles webOS back key (keyCode 461)', () => {
    renderHook(() => useBackNavigation());

    act(() => {
      fireKeyDown(461);
    });

    expect(historyBackSpy).toHaveBeenCalledTimes(1);
  });
});

describe('useBackNavigation — keyboard Escape and Backspace', () => {
  it('handles Escape key', () => {
    renderHook(() => useBackNavigation());

    act(() => {
      fireKeyDown(27, 'Escape');
    });

    expect(historyBackSpy).toHaveBeenCalledTimes(1);
  });

  it('handles Backspace key on desktop', () => {
    renderHook(() => useBackNavigation());

    act(() => {
      fireKeyDown(8, 'Backspace');
    });

    expect(historyBackSpy).toHaveBeenCalledTimes(1);
  });
});

describe('useBackNavigation — custom onBack callback', () => {
  it('calls custom onBack instead of history.back() when provided', () => {
    const onBack = vi.fn();
    renderHook(() => useBackNavigation({ onBack }));

    act(() => {
      fireKeyDown(27, 'Escape');
    });

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(historyBackSpy).not.toHaveBeenCalled();
  });

  it('calls custom onBack for Fire TV back key', () => {
    const onBack = vi.fn();
    renderHook(() => useBackNavigation({ onBack }));

    act(() => {
      fireKeyDown(4, 'Backspace');
    });

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(historyBackSpy).not.toHaveBeenCalled();
  });

  it('calls custom onBack for Tizen back key', () => {
    const onBack = vi.fn();
    renderHook(() => useBackNavigation({ onBack }));

    act(() => {
      fireKeyDown(10009);
    });

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('useBackNavigation — preventDefault', () => {
  it('prevents default on Fire TV back key event', () => {
    renderHook(() => useBackNavigation());

    const preventDefaultSpy = vi.fn();
    const event = new KeyboardEvent('keydown', {
      keyCode: 4,
      key: 'Backspace',
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'preventDefault', { value: preventDefaultSpy });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('prevents default on Escape key event', () => {
    renderHook(() => useBackNavigation());

    const preventDefaultSpy = vi.fn();
    const event = new KeyboardEvent('keydown', {
      keyCode: 27,
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'preventDefault', { value: preventDefaultSpy });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('prevents default on Tizen back key event', () => {
    renderHook(() => useBackNavigation());

    const preventDefaultSpy = vi.fn();
    const event = new KeyboardEvent('keydown', {
      keyCode: 10009,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'preventDefault', { value: preventDefaultSpy });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});

describe('useBackNavigation — ignores non-back keys', () => {
  it('does NOT trigger back navigation for regular keys', () => {
    const onBack = vi.fn();
    renderHook(() => useBackNavigation({ onBack }));

    act(() => {
      fireKeyDown(65, 'a'); // letter A
    });

    expect(onBack).not.toHaveBeenCalled();
    expect(historyBackSpy).not.toHaveBeenCalled();
  });

  it('does NOT trigger back navigation for Enter key', () => {
    renderHook(() => useBackNavigation());

    act(() => {
      fireKeyDown(13, 'Enter');
    });

    expect(historyBackSpy).not.toHaveBeenCalled();
  });
});

describe('useBackNavigation — cleanup', () => {
  it('removes event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useBackNavigation());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function),
    );
    removeEventListenerSpy.mockRestore();
  });
});
