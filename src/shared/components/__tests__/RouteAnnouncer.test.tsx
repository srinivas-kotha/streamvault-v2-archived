/**
 * Sprint 6C — Accessibility Tests
 * RouteAnnouncer: aria-live region for route change announcements
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

// Mock useRouterState from TanStack Router so we can control location.
// Must be declared before any imports that use it.
let mockPathname = "/";
vi.mock("@tanstack/react-router", () => ({
  useRouterState: ({
    select,
  }: {
    select: (s: { location: { pathname: string } }) => unknown;
  }) => select({ location: { pathname: mockPathname } }),
}));

// Dynamic import AFTER the mock so the module is resolved with the mock in place
const { RouteAnnouncer } = await import("../RouteAnnouncer");

/** Helper: advance timers and rAF */
async function flush() {
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
  });
}

describe("RouteAnnouncer", () => {
  beforeEach(() => {
    mockPathname = "/";
    vi.clearAllMocks();
  });

  it("renders a visually hidden aria-live region", () => {
    render(<RouteAnnouncer />);
    const region = screen.getByTestId("route-announcer");
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("aria-atomic", "true");
  });

  it("has sr-only class for visual hiding", () => {
    render(<RouteAnnouncer />);
    const region = screen.getByTestId("route-announcer");
    expect(region.className).toContain("sr-only");
  });

  it("starts with empty text on first render", () => {
    render(<RouteAnnouncer />);
    const region = screen.getByTestId("route-announcer");
    expect(region.textContent).toBe("");
  });

  it("does not announce on first render (avoids noise on page load)", () => {
    mockPathname = "/live";
    render(<RouteAnnouncer />);
    // On initial mount, the first pathname is stored as the "previous" without announcing
    const region = screen.getByTestId("route-announcer");
    expect(region.textContent).toBe("");
  });

  it("announces navigation to live TV", async () => {
    mockPathname = "/";
    const { rerender } = render(<RouteAnnouncer />);

    mockPathname = "/live";
    rerender(<RouteAnnouncer />);
    await flush();

    expect(screen.getByTestId("route-announcer").textContent).toContain(
      "Live TV",
    );
  });

  it("announces navigation to search", async () => {
    mockPathname = "/";
    const { rerender } = render(<RouteAnnouncer />);

    mockPathname = "/search";
    rerender(<RouteAnnouncer />);
    await flush();

    expect(screen.getByTestId("route-announcer").textContent).toContain(
      "Search",
    );
  });

  it("announces navigation to favorites", async () => {
    mockPathname = "/";
    const { rerender } = render(<RouteAnnouncer />);

    mockPathname = "/favorites";
    rerender(<RouteAnnouncer />);
    await flush();

    expect(screen.getByTestId("route-announcer").textContent).toContain(
      "Favorites",
    );
  });

  it("announces navigation to history", async () => {
    mockPathname = "/";
    const { rerender } = render(<RouteAnnouncer />);

    mockPathname = "/history";
    rerender(<RouteAnnouncer />);
    await flush();

    expect(screen.getByTestId("route-announcer").textContent).toContain(
      "Watch History",
    );
  });

  it("announces navigation to movies (vod)", async () => {
    mockPathname = "/";
    const { rerender } = render(<RouteAnnouncer />);

    mockPathname = "/vod";
    rerender(<RouteAnnouncer />);
    await flush();

    expect(screen.getByTestId("route-announcer").textContent).toContain(
      "Movies",
    );
  });

  it("announces navigation to settings", async () => {
    mockPathname = "/";
    const { rerender } = render(<RouteAnnouncer />);

    mockPathname = "/settings";
    rerender(<RouteAnnouncer />);
    await flush();

    expect(screen.getByTestId("route-announcer").textContent).toContain(
      "Settings",
    );
  });

  it("does not announce when pathname is unchanged (same route rerender)", async () => {
    mockPathname = "/home";
    const { rerender } = render(<RouteAnnouncer />);

    // Same pathname rerender — should not trigger announcement
    rerender(<RouteAnnouncer />);
    await flush();

    // Should still be empty (first render stored /home, second rerender same)
    expect(screen.getByTestId("route-announcer").textContent).toBe("");
  });
});
