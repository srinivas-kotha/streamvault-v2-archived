import { useEffect, useRef } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { queryClient } from '@lib/queryClient';
import { routeTree } from './routeTree.gen';
import { isTVMode } from '@shared/utils/isTVMode';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  const appRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // In TV mode (Fire Stick WebView, TWA, Samsung TV), ensure the root element
    // has focus so Android WebView dispatches D-pad key events to JavaScript.
    // In browser mode, skip this — mouse/touch interactions work without it.
    if (!isTVMode) return;

    appRef.current?.focus({ preventScroll: true });

    // Re-focus when focus completely escapes the app (overlay dismiss, etc.)
    const handleFocusOut = (e: FocusEvent) => {
      if (e.relatedTarget && appRef.current?.contains(e.relatedTarget as Node)) return;
      requestAnimationFrame(() => {
        const active = document.activeElement;
        if (!active || active === document.body || active === document.documentElement) {
          appRef.current?.focus({ preventScroll: true });
        }
      });
    };

    // Re-focus when app returns from background (Fire Stick home → back to app)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(() => appRef.current?.focus({ preventScroll: true }), 100);
      }
    };

    document.addEventListener('focusout', handleFocusOut);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('focusout', handleFocusOut);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <div ref={appRef} tabIndex={isTVMode ? -1 : undefined} style={{ outline: 'none' }}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </div>
  );
}
