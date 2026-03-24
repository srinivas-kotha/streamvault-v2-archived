import { create } from 'zustand';

export type ToastSeverity = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  severity: ToastSeverity;
  /** Auto-dismiss duration in ms. Defaults to 5000. Pass 0 to disable. */
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  /**
   * Add a toast. The `type` parameter is accepted as a backward-compatible
   * alias for `severity` (used by the v1 shared/components/Toast.tsx) but is
   * NOT stored on the Toast object — only `severity` is kept.
   */
  addToast: (message: string, severity: ToastSeverity, duration?: number, type?: ToastSeverity) => void;
  removeToast: (id: string) => void;
}

/** Tracks pending auto-dismiss timeout IDs so they can be cancelled on early removal. */
const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (message, severity, duration = 5000, type) => {
    // `type` is accepted for backward compat but ignored in storage; severity wins.
    void type;
    const id = crypto.randomUUID();
    set((s) => ({
      toasts: [...s.toasts.slice(-2), { id, message, severity, duration }],
    }));
    if (duration > 0) {
      const timer = setTimeout(() => {
        dismissTimers.delete(id);
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, duration);
      dismissTimers.set(id, timer);
    }
  },

  removeToast: (id) => {
    // Cancel any pending auto-dismiss to avoid a double-removal race.
    const timer = dismissTimers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      dismissTimers.delete(id);
    }
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
