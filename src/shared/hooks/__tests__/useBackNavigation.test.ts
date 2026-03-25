import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock TanStack Router
const mockHistoryBack = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({
    history: {
      back: mockHistoryBack,
    },
  }),
}));

// Mock player store with getState
vi.mock("@lib/store", () => ({
  usePlayerStore: Object.assign(() => null, {
    getState: vi.fn().mockReturnValue({ currentStreamId: null }),
  }),
}));

import { useBackNavigation } from "../useBackNavigation";
import { usePlayerStore } from "@lib/store";

describe("useBackNavigation (shared)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (usePlayerStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
      currentStreamId: null,
    });
  });

  afterEach(() => {
    // Clean up event listeners by unmounting
  });

  function fireKeydown(props: Partial<KeyboardEvent> & { keyCode?: number }) {
    const event = new KeyboardEvent("keydown", {
      key: props.key ?? "",
      bubbles: true,
      cancelable: true,
    });
    // keyCode is read-only on KeyboardEvent, so we define it manually
    if (props.keyCode !== undefined) {
      Object.defineProperty(event, "keyCode", { value: props.keyCode });
    }
    window.dispatchEvent(event);
    return event;
  }

  it("navigates back on Escape key", () => {
    renderHook(() => useBackNavigation());

    fireKeydown({ key: "Escape" });

    expect(mockHistoryBack).toHaveBeenCalledTimes(1);
  });

  it("navigates back on Backspace key", () => {
    renderHook(() => useBackNavigation());

    fireKeydown({ key: "Backspace" });

    expect(mockHistoryBack).toHaveBeenCalledTimes(1);
  });

  it("navigates back on Fire TV back button (keyCode 4)", () => {
    renderHook(() => useBackNavigation());

    fireKeydown({ keyCode: 4 });

    expect(mockHistoryBack).toHaveBeenCalledTimes(1);
  });

  it("does not navigate back for regular keys", () => {
    renderHook(() => useBackNavigation());

    fireKeydown({ key: "a" });
    fireKeydown({ key: "Enter" });
    fireKeydown({ key: "ArrowLeft" });

    expect(mockHistoryBack).not.toHaveBeenCalled();
  });

  it("does not navigate when target is an input element", () => {
    renderHook(() => useBackNavigation());

    const input = document.createElement("input");
    document.body.appendChild(input);

    // Dispatch from the element so e.target is the input
    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(event);

    expect(mockHistoryBack).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("does not navigate when target is a textarea element", () => {
    renderHook(() => useBackNavigation());

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);

    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    textarea.dispatchEvent(event);

    expect(mockHistoryBack).not.toHaveBeenCalled();
    document.body.removeChild(textarea);
  });

  it("does not navigate when player is active", () => {
    (usePlayerStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
      currentStreamId: "stream-123",
    });

    renderHook(() => useBackNavigation());

    fireKeydown({ key: "Escape" });

    expect(mockHistoryBack).not.toHaveBeenCalled();
  });

  it("removes event listener on unmount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useBackNavigation());

    const addCount = addSpy.mock.calls.filter(([e]) => e === "keydown").length;

    unmount();

    const removeCount = removeSpy.mock.calls.filter(
      ([e]) => e === "keydown",
    ).length;
    expect(removeCount).toBe(addCount);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("handles multiple back key presses", () => {
    renderHook(() => useBackNavigation());

    fireKeydown({ key: "Escape" });
    fireKeydown({ key: "Backspace" });

    expect(mockHistoryBack).toHaveBeenCalledTimes(2);
  });

  it("does not navigate when target is a select element", () => {
    renderHook(() => useBackNavigation());

    const select = document.createElement("select");
    document.body.appendChild(select);

    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    select.dispatchEvent(event);

    expect(mockHistoryBack).not.toHaveBeenCalled();
    document.body.removeChild(select);
  });
});
