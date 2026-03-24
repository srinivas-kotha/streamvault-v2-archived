import { useEffect, useRef, useState } from 'react';
import { useToastStore, type Toast as ToastData, type ToastSeverity } from '@/lib/toastStore';
import { cn } from '@/shared/utils/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Style maps
// ---------------------------------------------------------------------------

/**
 * Border + background + text per severity.
 * error/warning use role="alert" aria-live="assertive" (urgent announcements).
 * info/success use role="status" aria-live="polite" (non-urgent).
 */
const severityStyles: Record<
  ToastSeverity,
  { container: string; icon: string; ariaRole: 'alert' | 'status'; ariaLive: 'assertive' | 'polite' }
> = {
  error: {
    container: 'border-error/50 bg-error/10 text-error',
    icon: '✕',
    ariaRole: 'alert',
    ariaLive: 'assertive',
  },
  warning: {
    container: 'border-warning/50 bg-warning/10 text-warning',
    icon: '⚠',
    ariaRole: 'alert',
    ariaLive: 'assertive',
  },
  info: {
    container: 'border-info/50 bg-info/10 text-info',
    icon: 'ℹ',
    ariaRole: 'status',
    ariaLive: 'polite',
  },
  success: {
    container: 'border-success/50 bg-success/10 text-success',
    icon: '✓',
    ariaRole: 'status',
    ariaLive: 'polite',
  },
};

// ---------------------------------------------------------------------------
// ToastItem
// ---------------------------------------------------------------------------

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [visible, setVisible] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { container, icon, ariaRole, ariaLive } = severityStyles[toast.severity];

  // Slide-in on mount
  useEffect(() => {
    // Defer one frame so the initial opacity:0 / translateY is rendered first,
    // giving the CSS transition something to animate from.
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-dismiss with fade-out
  useEffect(() => {
    const duration = toast.duration ?? 5000;
    if (duration <= 0) return;

    dismissTimerRef.current = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id, toast.duration]);

  function handleDismiss() {
    setVisible(false);
    // Wait for the CSS fade-out transition (200ms) before removing from store
    setTimeout(() => onDismiss(toast.id), 200);
  }

  return (
    <div
      role={ariaRole}
      aria-live={ariaLive}
      aria-atomic="true"
      className={cn(
        'flex items-start gap-3 min-w-[280px] max-w-sm',
        'px-4 py-3 rounded-[var(--radius-lg)] border',
        'shadow-lg',
        'transition-[opacity,transform] duration-200 ease-out',
        container,
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-2',
      )}
    >
      {/* Severity icon */}
      <span aria-hidden="true" className="text-base leading-5 shrink-0 font-bold mt-0.5">
        {icon}
      </span>

      {/* Message */}
      <p className="flex-1 text-sm font-medium leading-snug break-words">
        {toast.message}
      </p>

      {/* Dismiss button */}
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={handleDismiss}
        className={cn(
          'shrink-0 opacity-60 hover:opacity-100',
          'transition-[opacity] duration-[var(--transition-fast)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:rounded-sm',
          'cursor-pointer',
        )}
      >
        <svg aria-hidden="true" viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3">
          <path d="M1.4 1.4a1 1 0 0 1 1.42 0L6 4.6l3.18-3.2a1 1 0 1 1 1.42 1.42L7.4 6l3.2 3.18a1 1 0 0 1-1.42 1.42L6 7.4l-3.18 3.2a1 1 0 0 1-1.42-1.42L4.6 6 1.4 2.82a1 1 0 0 1 0-1.42z" />
        </svg>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ToastContainer — render at app root
// ---------------------------------------------------------------------------

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className={cn(
        'fixed bottom-4 right-4',
        'z-[var(--z-toast)]',
        'flex flex-col gap-2',
        'pointer-events-none',
      )}
    >
      {toasts.map((toast) => (
        // pointer-events-auto re-enables interaction on individual items
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={removeToast} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// useToast — convenience hook for triggering toasts
// ---------------------------------------------------------------------------

export function useToast() {
  const addToast = useToastStore((s) => s.addToast);
  return {
    toast: addToast,
    error: (message: string, duration?: number) => addToast(message, 'error', duration),
    warning: (message: string, duration?: number) => addToast(message, 'warning', duration),
    info: (message: string, duration?: number) => addToast(message, 'info', duration),
    success: (message: string, duration?: number) => addToast(message, 'success', duration),
  };
}
