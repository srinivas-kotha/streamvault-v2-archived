import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

// We need to control isTVMode before the module loads
let mockIsTVMode = false;

vi.mock("@shared/utils/isTVMode", () => ({
  get isTVMode() {
    return mockIsTVMode;
  },
}));

describe("useFocusStyles", () => {
  beforeEach(() => {
    vi.resetModules();
    mockIsTVMode = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns an object with cardFocus, buttonFocus, inputFocus", async () => {
    const { useFocusStyles } = await import("../useFocusStyles");
    const { result } = renderHook(() => useFocusStyles());

    expect(result.current).toHaveProperty("cardFocus");
    expect(result.current).toHaveProperty("buttonFocus");
    expect(result.current).toHaveProperty("inputFocus");
  });

  it("returns string values for all focus styles", async () => {
    const { useFocusStyles } = await import("../useFocusStyles");
    const { result } = renderHook(() => useFocusStyles());

    expect(typeof result.current.cardFocus).toBe("string");
    expect(typeof result.current.buttonFocus).toBe("string");
    expect(typeof result.current.inputFocus).toBe("string");
  });

  it("desktop mode: cardFocus includes ring-2", async () => {
    mockIsTVMode = false;
    const { useFocusStyles } = await import("../useFocusStyles");
    const { result } = renderHook(() => useFocusStyles());

    expect(result.current.cardFocus).toContain("ring-2");
    expect(result.current.cardFocus).toContain("ring-accent-teal");
  });

  it("desktop mode: buttonFocus includes ring-offset", async () => {
    mockIsTVMode = false;
    const { useFocusStyles } = await import("../useFocusStyles");
    const { result } = renderHook(() => useFocusStyles());

    expect(result.current.buttonFocus).toContain("ring-offset-2");
  });

  it("desktop mode: inputFocus includes ring-2", async () => {
    mockIsTVMode = false;
    const { useFocusStyles } = await import("../useFocusStyles");
    const { result } = renderHook(() => useFocusStyles());

    expect(result.current.inputFocus).toContain("ring-2");
    expect(result.current.inputFocus).toContain("ring-accent-teal");
  });

  it("returns the same object reference across re-renders (stable)", async () => {
    const { useFocusStyles } = await import("../useFocusStyles");
    const { result, rerender } = renderHook(() => useFocusStyles());
    const first = result.current;

    rerender();
    expect(result.current).toBe(first);
  });

  it("all style values are non-empty strings", async () => {
    const { useFocusStyles } = await import("../useFocusStyles");
    const { result } = renderHook(() => useFocusStyles());

    expect(result.current.cardFocus.length).toBeGreaterThan(0);
    expect(result.current.buttonFocus.length).toBeGreaterThan(0);
    expect(result.current.inputFocus.length).toBeGreaterThan(0);
  });

  it("cardFocus includes shadow reference", async () => {
    mockIsTVMode = false;
    const { useFocusStyles } = await import("../useFocusStyles");
    const { result } = renderHook(() => useFocusStyles());

    expect(result.current.cardFocus).toContain("shadow-");
  });
});
