import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNetworkStatus } from "@shared/hooks/useNetworkStatus";

describe("useNetworkStatus()", () => {
  // Save original navigator.onLine descriptor
  const originalDescriptor = Object.getOwnPropertyDescriptor(
    Navigator.prototype,
    "onLine",
  );

  function setOnline(value: boolean) {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      get: () => value,
    });
  }

  beforeEach(() => {
    // Default: online
    setOnline(true);
  });

  afterEach(() => {
    // Restore original descriptor
    if (originalDescriptor) {
      Object.defineProperty(Navigator.prototype, "onLine", originalDescriptor);
    }
  });

  it("returns isOnline: true when navigator.onLine is true", () => {
    setOnline(true);
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
  });

  it("returns isOnline: false when navigator.onLine is false", () => {
    setOnline(false);
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(false);
  });

  it('updates to false when "offline" event fires', () => {
    setOnline(true);
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('updates to true when "online" event fires', () => {
    setOnline(false);
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(false);

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current.isOnline).toBe(true);
  });

  it("handles multiple offline/online transitions", () => {
    setOnline(true);
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.isOnline).toBe(false);

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current.isOnline).toBe(true);

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.isOnline).toBe(false);
  });

  it("removes event listeners on unmount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useNetworkStatus());

    const onlineCallCount = addSpy.mock.calls.filter(
      ([e]) => e === "online",
    ).length;
    const offlineCallCount = addSpy.mock.calls.filter(
      ([e]) => e === "offline",
    ).length;

    unmount();

    const removeOnlineCount = removeSpy.mock.calls.filter(
      ([e]) => e === "online",
    ).length;
    const removeOfflineCount = removeSpy.mock.calls.filter(
      ([e]) => e === "offline",
    ).length;

    expect(removeOnlineCount).toBe(onlineCallCount);
    expect(removeOfflineCount).toBe(offlineCallCount);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("does not throw when called multiple times", () => {
    expect(() => {
      renderHook(() => useNetworkStatus());
      renderHook(() => useNetworkStatus());
    }).not.toThrow();
  });
});
