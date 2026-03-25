import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { NetworkBanner } from "../NetworkBanner";

// ── Helpers ───────────────────────────────────────────────────────────────────

function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    get: () => value,
  });
}

function fireOnline() {
  act(() => {
    setOnline(true);
    window.dispatchEvent(new Event("online"));
  });
}

function fireOffline() {
  act(() => {
    setOnline(false);
    window.dispatchEvent(new Event("offline"));
  });
}

describe("NetworkBanner", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setOnline(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ── Offline state ─────────────────────────────────────────────────────────

  it("renders offline banner when navigator.onLine is false at mount", () => {
    setOnline(false);
    render(<NetworkBanner />);

    const banner = screen.getByTestId("network-banner-offline");
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent("You are offline");
  });

  it("offline banner has correct ARIA attributes", () => {
    setOnline(false);
    render(<NetworkBanner />);

    const banner = screen.getByTestId("network-banner-offline");
    expect(banner).toHaveAttribute("role", "alert");
    expect(banner).toHaveAttribute("aria-live", "assertive");
    expect(banner).toHaveAttribute("aria-atomic", "true");
  });

  it("shows full offline message text", () => {
    setOnline(false);
    render(<NetworkBanner />);

    expect(
      screen.getByText(/you are offline — some features may be unavailable/i),
    ).toBeInTheDocument();
  });

  it("shows offline banner when offline event fires", () => {
    setOnline(true);
    render(<NetworkBanner />);

    // No banner initially
    expect(
      screen.queryByTestId("network-banner-offline"),
    ).not.toBeInTheDocument();

    fireOffline();

    expect(screen.getByTestId("network-banner-offline")).toBeInTheDocument();
  });

  // ── Online state ──────────────────────────────────────────────────────────

  it("renders nothing when online at mount (no prior offline state)", () => {
    setOnline(true);
    const { container } = render(<NetworkBanner />);

    expect(container.firstChild).toBeNull();
  });

  it("does not show reconnected banner on initial mount when already online", () => {
    setOnline(true);
    render(<NetworkBanner />);

    expect(
      screen.queryByTestId("network-banner-reconnected"),
    ).not.toBeInTheDocument();
  });

  // ── Reconnected state ─────────────────────────────────────────────────────

  it('shows "Connection restored" banner when going from offline to online', () => {
    setOnline(false);
    render(<NetworkBanner />);

    // Confirm offline state
    expect(screen.getByTestId("network-banner-offline")).toBeInTheDocument();

    fireOnline();

    expect(
      screen.getByTestId("network-banner-reconnected"),
    ).toBeInTheDocument();
    expect(screen.getByText(/connection restored/i)).toBeInTheDocument();
  });

  it("reconnected banner has correct ARIA attributes", () => {
    setOnline(false);
    render(<NetworkBanner />);
    fireOnline();

    const banner = screen.getByTestId("network-banner-reconnected");
    expect(banner).toHaveAttribute("role", "status");
    expect(banner).toHaveAttribute("aria-live", "polite");
    expect(banner).toHaveAttribute("aria-atomic", "true");
  });

  it('auto-dismisses the "Connection restored" banner after 3 seconds', () => {
    setOnline(false);
    render(<NetworkBanner />);
    fireOnline();

    expect(
      screen.getByTestId("network-banner-reconnected"),
    ).toBeInTheDocument();

    // Advance by 2.9s — still showing
    act(() => {
      vi.advanceTimersByTime(2900);
    });
    expect(
      screen.getByTestId("network-banner-reconnected"),
    ).toBeInTheDocument();

    // Advance past the 3s threshold
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(
      screen.queryByTestId("network-banner-reconnected"),
    ).not.toBeInTheDocument();
  });

  it("replaces offline banner with reconnected banner after online event", () => {
    setOnline(false);
    render(<NetworkBanner />);

    // Offline banner showing
    expect(screen.getByTestId("network-banner-offline")).toBeInTheDocument();

    fireOnline();

    // Offline gone, reconnected showing
    expect(
      screen.queryByTestId("network-banner-offline"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("network-banner-reconnected"),
    ).toBeInTheDocument();
  });

  it("shows offline banner again if network drops again after reconnection", () => {
    setOnline(false);
    render(<NetworkBanner />);

    fireOnline();
    expect(
      screen.getByTestId("network-banner-reconnected"),
    ).toBeInTheDocument();

    fireOffline();
    expect(screen.getByTestId("network-banner-offline")).toBeInTheDocument();
    expect(
      screen.queryByTestId("network-banner-reconnected"),
    ).not.toBeInTheDocument();
  });

  it("cancels auto-dismiss timer if network drops again before 3s", () => {
    setOnline(false);
    render(<NetworkBanner />);

    fireOnline();
    expect(
      screen.getByTestId("network-banner-reconnected"),
    ).toBeInTheDocument();

    // Drop before 3s
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    fireOffline();

    // Should now show offline banner, not the "reconnected" after timer
    expect(screen.getByTestId("network-banner-offline")).toBeInTheDocument();

    // Advancing past 3s should NOT cause errors or double-render
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId("network-banner-offline")).toBeInTheDocument();
  });
});
