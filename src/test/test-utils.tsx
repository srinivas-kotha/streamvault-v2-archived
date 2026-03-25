/**
 * Centralized test utilities for StreamVault frontend.
 *
 * Usage:
 *   import { renderWithProviders, screen } from '@/test/test-utils';
 *
 *   it('renders', () => {
 *     renderWithProviders(<MyComponent />);
 *     expect(screen.getByText('Hello')).toBeInTheDocument();
 *   });
 */

import React, { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ── Query client factory ────────────────────────────────────────────────────

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ── Provider wrapper ────────────────────────────────────────────────────────

interface WrapperProps {
  children: React.ReactNode;
}

function createWrapper(queryClient?: QueryClient) {
  const client = queryClient ?? createTestQueryClient();

  function TestProviders({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }

  return TestProviders;
}

// ── Custom render ───────────────────────────────────────────────────────────

interface ExtendedRenderOptions extends Omit<RenderOptions, "wrapper"> {
  /** Provide a custom QueryClient (e.g. pre-seeded cache). */
  queryClient?: QueryClient;
}

/**
 * Renders a component wrapped with all required providers:
 * - QueryClientProvider (retry: false, gcTime: 0 for test isolation)
 *
 * Returns the standard @testing-library/react render result.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: ExtendedRenderOptions = {},
) {
  const { queryClient, ...renderOptions } = options;
  return render(ui, {
    wrapper: createWrapper(queryClient),
    ...renderOptions,
  });
}

/** Export a pre-configured QueryClient for tests that need direct access. */
export { createTestQueryClient };

// ── Re-exports ──────────────────────────────────────────────────────────────

export * from "@testing-library/react";
// Override render with our wrapped version (named export takes precedence)
export { renderWithProviders as render };
