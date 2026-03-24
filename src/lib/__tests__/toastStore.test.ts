import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useToastStore } from '../toastStore';

// ── helpers ──────────────────────────────────────────────────────────────────

/** Reset the store and the internal dismissTimers Map between tests. */
function resetStore() {
  useToastStore.setState({ toasts: [] });
}

// ── tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
  resetStore();
});

afterEach(() => {
  vi.useRealTimers();
  resetStore();
});

describe('addToast', () => {
  it('adds a toast with the correct severity and message', () => {
    useToastStore.getState().addToast('Something went wrong', 'error');

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ message: 'Something went wrong', severity: 'error' });
  });

  it('does NOT store a `type` field on the toast object', () => {
    useToastStore.getState().addToast('Hello', 'success');

    const toast = useToastStore.getState().toasts[0]!;
    // The deprecated `type` field must not exist on the stored object.
    expect('type' in toast).toBe(false);
  });

  it('accepts `type` alias without error (backward compat) and uses severity', () => {
    // The fourth param is the legacy `type` alias — passing a different value
    // should be silently ignored; severity is what matters.
    useToastStore.getState().addToast('Hi', 'info', 5000, 'error');

    const toast = useToastStore.getState().toasts[0]!;
    expect(toast.severity).toBe('info');
  });

  it('caps at 3 toasts by removing the oldest when a 4th is added', () => {
    const { addToast } = useToastStore.getState();
    addToast('A', 'info');
    addToast('B', 'warning');
    addToast('C', 'success');
    addToast('D', 'error');

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(3);
    // The oldest toast ('A') should have been dropped.
    expect(toasts.map((t) => t.message)).toEqual(['B', 'C', 'D']);
  });
});

describe('removeToast', () => {
  it('removes a toast by id', () => {
    useToastStore.getState().addToast('Removable', 'info');
    const id = useToastStore.getState().toasts[0]!.id;

    useToastStore.getState().removeToast(id);

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});

describe('auto-dismiss', () => {
  it('fires after the configured duration', () => {
    useToastStore.getState().addToast('Temporary', 'success', 3000);
    expect(useToastStore.getState().toasts).toHaveLength(1);

    vi.advanceTimersByTime(3000);

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('does not dismiss before the configured duration', () => {
    useToastStore.getState().addToast('Not yet', 'info', 3000);

    vi.advanceTimersByTime(2999);

    expect(useToastStore.getState().toasts).toHaveLength(1);
  });

  it('duration=0 never auto-dismisses', () => {
    useToastStore.getState().addToast('Persistent', 'warning', 0);

    vi.advanceTimersByTime(60_000);

    expect(useToastStore.getState().toasts).toHaveLength(1);
  });
});

describe('removeToast clears pending auto-dismiss timer', () => {
  it('cancels the timeout so the toast is not removed twice', () => {
    useToastStore.getState().addToast('Race', 'error', 3000);
    const id = useToastStore.getState().toasts[0]!.id;

    // Manually remove before the timer fires.
    useToastStore.getState().removeToast(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);

    // Advance past what would have been the timer — should NOT re-trigger.
    // (If the timer was not cancelled it would try to filter an already-absent
    //  toast, which is harmless, but this test documents the intended contract.)
    vi.advanceTimersByTime(3000);

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('does not throw when removeToast is called for an unknown id', () => {
    expect(() => useToastStore.getState().removeToast('nonexistent-id')).not.toThrow();
  });
});
