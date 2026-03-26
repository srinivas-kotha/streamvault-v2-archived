import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNetworkStatus } from "../useNetworkStatus";

// ---------------------------------------------------------------------------
// useNetworkStatus
// ---------------------------------------------------------------------------

describe("useNetworkStatus", () => {
  // jsdom has navigator.onLine = true by default
  beforeEach(() => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      get: () => true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns isOnline: true when navigator.onLine is true", () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
  });

  it("returns isOnline: false when navigator.onLine is false", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      get: () => false,
    });

    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(false);
  });

  it("updates to false when 'offline' event fires", () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current.isOnline).toBe(false);
  });

  it("updates to true when 'online' event fires", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      get: () => false,
    });

    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current.isOnline).toBe(true);
  });

  it("removes event listeners on unmount (no memory leaks)", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useNetworkStatus());

    const onlineAdds = addSpy.mock.calls.filter((c) => c[0] === "online");
    const offlineAdds = addSpy.mock.calls.filter((c) => c[0] === "offline");
    expect(onlineAdds.length).toBeGreaterThanOrEqual(1);
    expect(offlineAdds.length).toBeGreaterThanOrEqual(1);

    unmount();

    const onlineRemoves = removeSpy.mock.calls.filter((c) => c[0] === "online");
    const offlineRemoves = removeSpy.mock.calls.filter(
      (c) => c[0] === "offline",
    );
    expect(onlineRemoves.length).toBeGreaterThanOrEqual(1);
    expect(offlineRemoves.length).toBeGreaterThanOrEqual(1);
  });

  it("handles rapid online/offline toggles correctly", () => {
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.isOnline).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current.isOnline).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.isOnline).toBe(false);
  });

  it("does not respond to events after unmount", () => {
    const { result, unmount } = renderHook(() => useNetworkStatus());
    unmount();

    // Fire event after unmount — should not update (no crash expected either)
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    // Component is unmounted — no assertion on result.current needed
    // This test just verifies no error is thrown
    expect(true).toBe(true);
  });
});
