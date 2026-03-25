/**
 * Sprint 6C — Accessibility Tests
 * useReducedMotion: responds to prefers-reduced-motion media query changes
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReducedMotion } from "../useReducedMotion";

type MediaQueryCallback = (e: MediaQueryListEvent) => void;

function createMockMediaQuery(matches: boolean) {
  const listeners: MediaQueryCallback[] = [];

  const mql = {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: vi.fn((event: string, cb: MediaQueryCallback) => {
      if (event === "change") listeners.push(cb);
    }),
    removeEventListener: vi.fn((event: string, cb: MediaQueryCallback) => {
      if (event === "change") {
        const idx = listeners.indexOf(cb);
        if (idx !== -1) listeners.splice(idx, 1);
      }
    }),
    dispatchEvent: vi.fn(),
    // Helper to simulate a media query change
    _trigger: (newMatches: boolean) => {
      const event = { matches: newMatches } as MediaQueryListEvent;
      listeners.forEach((cb) => cb(event));
    },
  };

  return mql;
}

describe("useReducedMotion", () => {
  let mockMql: ReturnType<typeof createMockMediaQuery>;

  beforeEach(() => {
    mockMql = createMockMediaQuery(false);
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mockMql as unknown as MediaQueryList,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false when prefers-reduced-motion is not set", () => {
    mockMql = createMockMediaQuery(false);
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mockMql as unknown as MediaQueryList,
    );
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("returns true when prefers-reduced-motion: reduce is active", () => {
    mockMql = createMockMediaQuery(true);
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mockMql as unknown as MediaQueryList,
    );
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("updates when user enables reduced motion", () => {
    mockMql = createMockMediaQuery(false);
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mockMql as unknown as MediaQueryList,
    );
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);

    act(() => {
      mockMql._trigger(true);
    });

    expect(result.current).toBe(true);
  });

  it("updates when user disables reduced motion", () => {
    mockMql = createMockMediaQuery(true);
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mockMql as unknown as MediaQueryList,
    );
    const { result } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(true);

    act(() => {
      mockMql._trigger(false);
    });

    expect(result.current).toBe(false);
  });

  it("calls addEventListener on mount", () => {
    mockMql = createMockMediaQuery(false);
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mockMql as unknown as MediaQueryList,
    );
    renderHook(() => useReducedMotion());
    expect(mockMql.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  it("removes event listener on unmount", () => {
    mockMql = createMockMediaQuery(false);
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mockMql as unknown as MediaQueryList,
    );
    const { unmount } = renderHook(() => useReducedMotion());
    unmount();
    expect(mockMql.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  it("queries the correct media query string", () => {
    renderHook(() => useReducedMotion());
    expect(window.matchMedia).toHaveBeenCalledWith(
      "(prefers-reduced-motion: reduce)",
    );
  });
});
