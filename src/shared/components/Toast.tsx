import { useToastStore } from '@lib/toastStore';

const typeStyles = {
  success: 'bg-teal-600 text-white',
  error: 'bg-red-600 text-white',
  warning: 'bg-amber-600 text-white',
  info: 'bg-indigo-600 text-white',
} as const;

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 bottom-4 z-[100] flex flex-col gap-2">
      {toasts.slice(-3).map((toast) => (
        <div
          key={toast.id}
          className={`animate-fade-in flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg ${typeStyles[toast.severity]}`}
          role="alert"
        >
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-2 text-white/70 hover:text-white"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
