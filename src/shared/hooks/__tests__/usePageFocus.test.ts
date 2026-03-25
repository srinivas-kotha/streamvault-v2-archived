import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

const mockSetFocus = vi.fn();

vi.mock("@noriginmedia/norigin-spatial-navigation", () => ({
  setFocus: (...args: unknown[]) => mockSetFocus(...args),
}));

import { usePageFocus } from "../usePageFocus";

describe("usePageFocus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSetFocus.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls setFocus with the provided focusKey after default delay", () => {
    renderHook(() => usePageFocus("HOME_PAGE"));

    expect(mockSetFocus).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(mockSetFocus).toHaveBeenCalledWith("HOME_PAGE");
    expect(mockSetFocus).toHaveBeenCalledTimes(1);
  });

  it("respects custom delay parameter", () => {
    renderHook(() => usePageFocus("SETTINGS_PAGE", 250));

    vi.advanceTimersByTime(100);
    expect(mockSetFocus).not.toHaveBeenCalled();

    vi.advanceTimersByTime(150);
    expect(mockSetFocus).toHaveBeenCalledWith("SETTINGS_PAGE");
  });

  it("calls setFocus with delay of 0", () => {
    renderHook(() => usePageFocus("INSTANT_PAGE", 0));

    vi.advanceTimersByTime(0);
    expect(mockSetFocus).toHaveBeenCalledWith("INSTANT_PAGE");
  });

  it("clears timeout on unmount before delay fires", () => {
    const { unmount } = renderHook(() => usePageFocus("UNMOUNT_PAGE", 200));

    vi.advanceTimersByTime(100);
    unmount();
    vi.advanceTimersByTime(200);

    expect(mockSetFocus).not.toHaveBeenCalled();
  });

  it("does not throw if setFocus throws (focusKey not registered)", () => {
    mockSetFocus.mockImplementation(() => {
      throw new Error("Focus key not found");
    });

    renderHook(() => usePageFocus("MISSING_KEY"));

    expect(() => vi.advanceTimersByTime(100)).not.toThrow();
  });

  it("only runs on mount (does not re-fire on rerender)", () => {
    const { rerender } = renderHook(({ key }) => usePageFocus(key), {
      initialProps: { key: "PAGE_A" },
    });

    vi.advanceTimersByTime(100);
    expect(mockSetFocus).toHaveBeenCalledTimes(1);
    expect(mockSetFocus).toHaveBeenCalledWith("PAGE_A");

    mockSetFocus.mockClear();
    rerender({ key: "PAGE_B" });

    vi.advanceTimersByTime(200);
    // Should NOT call again since effect only runs on mount
    expect(mockSetFocus).not.toHaveBeenCalled();
  });

  it("handles empty string focusKey without error", () => {
    renderHook(() => usePageFocus(""));

    vi.advanceTimersByTime(100);
    expect(mockSetFocus).toHaveBeenCalledWith("");
  });

  it("works with a very long delay", () => {
    renderHook(() => usePageFocus("SLOW_PAGE", 5000));

    vi.advanceTimersByTime(4999);
    expect(mockSetFocus).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(mockSetFocus).toHaveBeenCalledWith("SLOW_PAGE");
  });
});
