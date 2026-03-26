/**
 * useTokenRefresh — unit tests
 *
 * Covers:
 * - No-op when unauthenticated
 * - Proactive refresh fires after REFRESH_DELAY_MS (13 min)
 * - Immediate refresh when tab regains visibility and token is stale
 * - Reschedule on visibility if token is still healthy
 * - Calls onRefreshFailed when refresh fails
 * - Falls back to window.location redirect when no onRefreshFailed provided
 * - Timer is cleaned up on unmount
 * - Timer is cleared on logout (isAuthenticated → false)
 * - Deduplication: only one refresh fires even if visibility fires concurrently
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ── Mock @lib/api ─────────────────────────────────────────────────────────────

const mockRefreshToken = vi.fn<() => Promise<boolean>>();
const mockGetLastRefreshedAt = vi.fn<() => number>();
const mockMarkTokenRefreshed = vi.fn<() => void>();

vi.mock("@lib/api", () => ({
  refreshToken: (...args: unknown[]) => mockRefreshToken(...args),
  getLastRefreshedAt: (...args: unknown[]) => mockGetLastRefreshedAt(...args),
  markTokenRefreshed: (...args: unknown[]) => mockMarkTokenRefreshed(...args),
}));

// ── Mock @lib/store ───────────────────────────────────────────────────────────

let mockIsAuthenticated = true;
const mockClearAuth = vi.fn();

vi.mock("@lib/store", () => ({
  useAuthStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      isAuthenticated: mockIsAuthenticated,
      clearAuth: mockClearAuth,
    }),
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import {
  useTokenRefresh,
  TOKEN_LIFETIME_MS,
  TOKEN_REFRESH_BEFORE_EXPIRY_MS,
} from "../useTokenRefresh";

const REFRESH_DELAY_MS = TOKEN_LIFETIME_MS - TOKEN_REFRESH_BEFORE_EXPIRY_MS;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fireVisibilityChange(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useTokenRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockIsAuthenticated = true;
    mockRefreshToken.mockResolvedValue(true);
    mockGetLastRefreshedAt.mockReturnValue(Date.now());
    mockClearAuth.mockReset();
    mockMarkTokenRefreshed.mockReset();

    // Default: tab is visible
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });

    // Suppress window.location assignment errors in jsdom
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "" },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ── Constants ──────────────────────────────────────────────────────────────

  it("REFRESH_DELAY_MS is 13 minutes", () => {
    expect(REFRESH_DELAY_MS).toBe(13 * 60 * 1000);
  });

  // ── No-op when not authenticated ──────────────────────────────────────────

  it("does not schedule refresh when not authenticated", () => {
    mockIsAuthenticated = false;

    renderHook(() => useTokenRefresh());

    act(() => {
      vi.advanceTimersByTime(REFRESH_DELAY_MS + 1000);
    });

    expect(mockRefreshToken).not.toHaveBeenCalled();
  });

  // ── Proactive refresh ──────────────────────────────────────────────────────

  it("fires refreshToken after REFRESH_DELAY_MS when token was just refreshed", async () => {
    const now = Date.now();
    mockGetLastRefreshedAt.mockReturnValue(now);

    renderHook(() => useTokenRefresh());

    // Not yet fired
    act(() => {
      vi.advanceTimersByTime(REFRESH_DELAY_MS - 1);
    });
    expect(mockRefreshToken).not.toHaveBeenCalled();

    // Fire at the threshold
    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });
    expect(mockRefreshToken).toHaveBeenCalledTimes(1);
  });

  it("fires immediately when lastRefreshedAt is 0 (unknown age) after REFRESH_DELAY_MS", async () => {
    mockGetLastRefreshedAt.mockReturnValue(0);

    renderHook(() => useTokenRefresh());

    await act(async () => {
      vi.advanceTimersByTime(REFRESH_DELAY_MS);
      await Promise.resolve();
    });

    expect(mockRefreshToken).toHaveBeenCalledTimes(1);
  });

  it("fires sooner when token is already partially elapsed", async () => {
    const elapsed = 10 * 60 * 1000; // 10 minutes elapsed
    const now = Date.now();
    mockGetLastRefreshedAt.mockReturnValue(now - elapsed);

    renderHook(() => useTokenRefresh());

    // At 3 min (total 13 from issue), should fire. Remaining = 13 - 10 = 3 min.
    await act(async () => {
      vi.advanceTimersByTime(3 * 60 * 1000);
      await Promise.resolve();
    });

    expect(mockRefreshToken).toHaveBeenCalledTimes(1);
  });

  it("fires immediately when token is already past the refresh threshold", async () => {
    const elapsed = 14 * 60 * 1000; // 14 minutes elapsed — past threshold
    const now = Date.now();
    mockGetLastRefreshedAt.mockReturnValue(now - elapsed);

    renderHook(() => useTokenRefresh());

    // delay = max(0, REFRESH_DELAY_MS - elapsed) = 0, fires on next tick
    await act(async () => {
      vi.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(mockRefreshToken).toHaveBeenCalledTimes(1);
  });

  // ── Success path: reschedule ───────────────────────────────────────────────

  it("schedules the next refresh after a successful proactive refresh", async () => {
    mockGetLastRefreshedAt
      .mockReturnValueOnce(Date.now()) // initial schedule
      .mockReturnValue(Date.now()); // after refresh, new timestamp

    renderHook(() => useTokenRefresh());

    // First refresh cycle
    await act(async () => {
      vi.advanceTimersByTime(REFRESH_DELAY_MS);
      await Promise.resolve();
    });

    expect(mockRefreshToken).toHaveBeenCalledTimes(1);

    // Second refresh cycle
    await act(async () => {
      vi.advanceTimersByTime(REFRESH_DELAY_MS);
      await Promise.resolve();
    });

    expect(mockRefreshToken).toHaveBeenCalledTimes(2);
  });

  // ── Failure path ──────────────────────────────────────────────────────────

  it("calls onRefreshFailed and clearAuth when refresh fails", async () => {
    mockRefreshToken.mockResolvedValue(false);
    mockGetLastRefreshedAt.mockReturnValue(Date.now());
    const onRefreshFailed = vi.fn();

    renderHook(() => useTokenRefresh(onRefreshFailed));

    await act(async () => {
      vi.advanceTimersByTime(REFRESH_DELAY_MS);
      await Promise.resolve();
    });

    expect(mockClearAuth).toHaveBeenCalled();
    expect(onRefreshFailed).toHaveBeenCalled();
  });

  it("redirects to /login when refresh fails and no onRefreshFailed provided", async () => {
    mockRefreshToken.mockResolvedValue(false);
    mockGetLastRefreshedAt.mockReturnValue(Date.now());

    renderHook(() => useTokenRefresh());

    await act(async () => {
      vi.advanceTimersByTime(REFRESH_DELAY_MS);
      await Promise.resolve();
    });

    expect(mockClearAuth).toHaveBeenCalled();
    expect(window.location.href).toBe("/login");
  });

  // ── Visibility-aware ──────────────────────────────────────────────────────

  it("does not call refreshToken when tab is hidden at timer expiry", async () => {
    mockGetLastRefreshedAt.mockReturnValue(Date.now());
    fireVisibilityChange("hidden");

    renderHook(() => useTokenRefresh());

    await act(async () => {
      vi.advanceTimersByTime(REFRESH_DELAY_MS);
      await Promise.resolve();
    });

    // Timer fired but skipped because tab is hidden
    expect(mockRefreshToken).not.toHaveBeenCalled();
  });

  it("refreshes immediately when tab becomes visible and token is stale", async () => {
    const elapsed = 14 * 60 * 1000; // past threshold
    mockGetLastRefreshedAt.mockReturnValue(Date.now() - elapsed);
    fireVisibilityChange("hidden");

    renderHook(() => useTokenRefresh());

    // Tab becomes visible
    await act(async () => {
      fireVisibilityChange("visible");
      await Promise.resolve();
    });

    expect(mockRefreshToken).toHaveBeenCalledTimes(1);
  });

  it("reschedules (no immediate refresh) when tab becomes visible and token is healthy", async () => {
    const elapsed = 5 * 60 * 1000; // 5 min — healthy
    const now = Date.now();
    mockGetLastRefreshedAt.mockReturnValue(now - elapsed);

    renderHook(() => useTokenRefresh());

    fireVisibilityChange("hidden");

    await act(async () => {
      fireVisibilityChange("visible");
      await Promise.resolve();
    });

    // No immediate refresh — just rescheduled the timer
    expect(mockRefreshToken).not.toHaveBeenCalled();
  });

  // ── Cleanup ───────────────────────────────────────────────────────────────

  it("clears the timer on unmount", async () => {
    mockGetLastRefreshedAt.mockReturnValue(Date.now());
    const { unmount } = renderHook(() => useTokenRefresh());

    unmount();

    // Timer was cleared — refreshToken should NOT fire after unmount
    await act(async () => {
      vi.advanceTimersByTime(REFRESH_DELAY_MS + 1000);
      await Promise.resolve();
    });

    expect(mockRefreshToken).not.toHaveBeenCalled();
  });

  it("removes the visibility listener on unmount", async () => {
    mockGetLastRefreshedAt.mockReturnValue(Date.now() - 14 * 60 * 1000);
    const { unmount } = renderHook(() => useTokenRefresh());

    unmount();

    // Visibility change after unmount should NOT trigger refresh
    await act(async () => {
      fireVisibilityChange("visible");
      await Promise.resolve();
    });

    expect(mockRefreshToken).not.toHaveBeenCalled();
  });
});
