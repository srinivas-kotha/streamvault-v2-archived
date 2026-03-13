import { useEffect, useRef } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { queryClient } from '@lib/queryClient';
import { routeTree } from './routeTree.gen';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  const appRef = useRef<HTMLDivElement>(null);

  // Android TV WebViews need a focused DOM element to dispatch D-pad events
  useEffect(() => {
    appRef.current?.focus();
  }, []);

  return (
    <div ref={appRef} tabIndex={-1} style={{ outline: 'none' }}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </div>
  );
}
