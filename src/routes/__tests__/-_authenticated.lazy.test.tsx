/**
 * Sprint 10 — Global nav bar D-pad cross-context navigation tests
 *
 * Verifies that GlobalNavLink items are wrapped in a proper norigin container
 * (global-nav) so D-pad can cross between the nav bar and page content.
 *
 * The bug: nav links were registered directly under SN:ROOT without a container,
 * isolating them from page content containers and preventing UP/DOWN nav crossing.
 * The fix: useSpatialContainer({ focusKey: "global-nav" }) + FocusContext.Provider.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// ── Track container registrations ─────────────────────────────────────────────

const containerCalls: Array<{
  focusKey?: string;
  saveLastFocusedChild?: boolean;
}> = [];
const focusableCalls: Array<{ focusKey?: string }> = [];

vi.mock("@shared/hooks/useSpatialNav", () => ({
  useSpatialFocusable: (opts: { focusKey?: string } = {}) => {
    focusableCalls.push({ focusKey: opts.focusKey });
    return {
      ref: { current: null },
      focused: false,
      showFocusRing: false,
      focusProps: { onMouseEnter: vi.fn(), "data-focus-key": opts.focusKey },
    };
  },
  useSpatialContainer: (
    opts: { focusKey?: string; saveLastFocusedChild?: boolean } = {},
  ) => {
    containerCalls.push(opts);
    return {
      ref: { current: null },
      focusKey: opts.focusKey ?? "test-container",
    };
  },
  FocusContext: {
    Provider: ({
      children,
      value,
    }: {
      children: React.ReactNode;
      value: string;
    }) => <div data-testid={`focus-ctx-${value}`}>{children}</div>,
  },
  setFocus: vi.fn(),
}));

vi.mock("@shared/components/TopNav", () => ({
  TopNav: () => <nav aria-label="Top nav" />,
}));

vi.mock("@features/auth/hooks/useAuth", () => ({
  useAuthCheck: vi.fn(),
}));

vi.mock("@shared/hooks/useBackNavigation", () => ({
  useBackNavigation: vi.fn(),
}));

vi.mock("@features/auth/hooks/useTokenRefresh", () => ({
  useTokenRefresh: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createLazyFileRoute: () => (cfg: { component: React.ComponentType }) => cfg,
  Outlet: () => <div data-testid="outlet" />,
  Link: ({
    children,
    to,
    ...rest
  }: {
    children: React.ReactNode;
    to: string;
    [key: string]: unknown;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useParams: () => ({}),
}));

// ── Import after mocks ────────────────────────────────────────────────────────

// We need to import the component function directly since the route export
// is wrapped. Import the module and render the component.
import type * as AuthModule from "../_authenticated.lazy";

let AuthenticatedLayout: React.ComponentType;

beforeEach(async () => {
  containerCalls.length = 0;
  focusableCalls.length = 0;
  vi.resetModules();

  // Dynamic import after mocks are set up
  const mod = await import("../_authenticated.lazy");
  // The route config has the component; since createLazyFileRoute is mocked
  // to return the config object, Route.component is the AuthenticatedLayout.
  // But createLazyFileRoute mock returns (cfg) => cfg, so Route = { component: AuthenticatedLayout }
  AuthenticatedLayout = (
    mod.Route as unknown as { component: React.ComponentType }
  ).component;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("AuthenticatedLayout — global nav FocusContext container", () => {
  it("registers a global-nav spatial container", async () => {
    render(<AuthenticatedLayout />);
    const globalNavContainer = containerCalls.find(
      (c) => c.focusKey === "global-nav",
    );
    expect(globalNavContainer).toBeDefined();
  });

  it("global-nav container has saveLastFocusedChild: true for D-pad memory", async () => {
    render(<AuthenticatedLayout />);
    const globalNavContainer = containerCalls.find(
      (c) => c.focusKey === "global-nav",
    );
    expect(globalNavContainer?.saveLastFocusedChild).toBe(true);
  });

  it("wraps nav links in FocusContext.Provider with global-nav focus key", async () => {
    render(<AuthenticatedLayout />);
    // The FocusContext.Provider mock renders as a div with data-testid="focus-ctx-<value>"
    const ctxProvider = screen.getByTestId("focus-ctx-global-nav");
    expect(ctxProvider).toBeInTheDocument();
  });

  it("renders all 5 global nav links inside the focus context provider", async () => {
    render(<AuthenticatedLayout />);
    const ctxProvider = screen.getByTestId("focus-ctx-global-nav");
    const navLinks = ctxProvider.querySelectorAll("a");
    expect(navLinks.length).toBe(5);
  });

  it("registers global-nav-telugu, global-nav-hindi, global-nav-english, global-nav-sports, global-nav-search as focusables", async () => {
    render(<AuthenticatedLayout />);
    const expectedKeys = [
      "global-nav-telugu",
      "global-nav-hindi",
      "global-nav-english",
      "global-nav-sports",
      "global-nav-search",
    ];
    for (const key of expectedKeys) {
      expect(focusableCalls.some((c) => c.focusKey === key)).toBe(true);
    }
  });

  it("renders Outlet (page content) outside the global-nav FocusContext", async () => {
    render(<AuthenticatedLayout />);
    const outlet = screen.getByTestId("outlet");
    const ctxProvider = screen.getByTestId("focus-ctx-global-nav");
    // Outlet must NOT be inside the global-nav FocusContext.Provider
    expect(ctxProvider.contains(outlet)).toBe(false);
  });

  it("nav links render with correct href values", async () => {
    render(<AuthenticatedLayout />);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/language/telugu");
    expect(hrefs).toContain("/language/hindi");
    expect(hrefs).toContain("/language/english");
    expect(hrefs).toContain("/sports");
    expect(hrefs).toContain("/search");
  });

  it("nav links carry data-focus-key attributes for norigin DOM lookup", async () => {
    render(<AuthenticatedLayout />);
    const ctxProvider = screen.getByTestId("focus-ctx-global-nav");
    const links = ctxProvider.querySelectorAll("[data-focus-key]");
    expect(links.length).toBe(5);
  });
});
