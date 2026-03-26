/**
 * Sprint 8 Phase 3 — SpatialNavProvider tests
 *
 * Tests the global D-pad keyboard handler:
 * - inputMode switching (mouse → keyboard on nav keys, keyboard → mouse on mousemove)
 * - Back button: Fire TV (keyCode 4), Samsung Tizen (10009), LG webOS (461), Escape
 * - Back button is suppressed when player is active (usePlayerKeyboard handles it)
 * - Enter: clicks focused element via data-focus-key (skips elements wrapping inputs)
 * - Arrow keys: defers to usePlayerKeyboard in TV mode when player active
 * - Dedup: 50ms window prevents double-firing (Fire TV APK dispatches to both targets)
 * - Cleanup: removes all listeners on unmount
 *
 * NOTE: SpatialNavProvider calls init() at module level. We mock the entire
 * norigin module to avoid side effects in the test environment.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import React from "react";

// ── Mock norigin-spatial-navigation ──────────────────────────────────────────
// NOTE: vi.mock is hoisted before variable declarations, so we cannot reference
// module-level `const` variables inside the factory. Instead, we use vi.fn()
// directly in the factory and re-export the mocks via the module's mock object.

vi.mock("@noriginmedia/norigin-spatial-navigation", () => ({
  init: vi.fn(),
  setKeyMap: vi.fn(),
  getCurrentFocusKey: vi.fn(() => null as string | null),
  setFocus: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
}));

// Import the mocked module so we can access and reset the mock functions
import * as norigin from "@noriginmedia/norigin-spatial-navigation";

const mockGetCurrentFocusKey = norigin.getCurrentFocusKey as ReturnType<
  typeof vi.fn
>;
const mockSetFocus = norigin.setFocus as ReturnType<typeof vi.fn>;

// ── Mock isTVMode ─────────────────────────────────────────────────────────────

let isTVModeValue = false;

vi.mock("@shared/utils/isTVMode", () => ({
  get isTVMode() {
    return isTVModeValue;
  },
}));

// ── Import stores and component AFTER mocks ────────────────────────────────────

import { useUIStore, usePlayerStore } from "@lib/store";
import { SpatialNavProvider } from "../SpatialNavProvider";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fireKeyDown(
  key: string,
  keyCode?: number,
  target?: EventTarget,
  options: Partial<KeyboardEventInit> = {},
) {
  const event = new KeyboardEvent("keydown", {
    key,
    keyCode: keyCode ?? key.charCodeAt(0),
    bubbles: true,
    cancelable: true,
    ...options,
  });
  if (target) {
    Object.defineProperty(event, "target", { value: target, writable: false });
  }
  document.dispatchEvent(event);
  return event;
}

function fireMouseMove() {
  const event = new MouseEvent("mousemove", { bubbles: true });
  window.dispatchEvent(event);
}

function renderProvider(
  children: React.ReactNode = <div data-testid="child">content</div>,
) {
  return render(<SpatialNavProvider>{children}</SpatialNavProvider>);
}

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
  isTVModeValue = false;
  mockGetCurrentFocusKey.mockReturnValue(null);
  mockSetFocus.mockClear();

  // Reset stores
  useUIStore.setState({ inputMode: "mouse" });
  usePlayerStore.setState({
    currentStreamId: null,
    currentStreamType: null,
    currentStreamName: null,
    startTime: 0,
    volume: 1,
    isMuted: false,
    seriesId: null,
    seasonNumber: null,
    episodeIndex: null,
    episodeList: [],
  });

  // Reset dataset
  document.documentElement.dataset.inputMode = "mouse";
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

// ── Rendering ─────────────────────────────────────────────────────────────────

describe("SpatialNavProvider — rendering", () => {
  it("renders children without crashing", () => {
    const { getByTestId } = renderProvider();
    expect(getByTestId("child")).toBeTruthy();
  });

  it("does not add extra DOM wrapper elements", () => {
    const { container } = renderProvider(<span data-testid="inner">text</span>);
    expect(container.querySelector("[data-testid='inner']")).not.toBeNull();
  });
});

// ── inputMode switching — keyboard ────────────────────────────────────────────

describe("SpatialNavProvider — inputMode switches to keyboard on nav keys", () => {
  it("sets inputMode to keyboard when ArrowUp is pressed", () => {
    renderProvider();
    fireKeyDown("ArrowUp");
    expect(useUIStore.getState().inputMode).toBe("keyboard");
    expect(document.documentElement.dataset.inputMode).toBe("keyboard");
  });

  it("sets inputMode to keyboard when ArrowDown is pressed", () => {
    renderProvider();
    fireKeyDown("ArrowDown");
    expect(useUIStore.getState().inputMode).toBe("keyboard");
  });

  it("sets inputMode to keyboard when ArrowLeft is pressed", () => {
    renderProvider();
    fireKeyDown("ArrowLeft");
    expect(useUIStore.getState().inputMode).toBe("keyboard");
  });

  it("sets inputMode to keyboard when ArrowRight is pressed", () => {
    renderProvider();
    fireKeyDown("ArrowRight");
    expect(useUIStore.getState().inputMode).toBe("keyboard");
  });

  it("sets inputMode to keyboard when Enter is pressed", () => {
    renderProvider();
    fireKeyDown("Enter");
    expect(useUIStore.getState().inputMode).toBe("keyboard");
  });

  it("sets inputMode to keyboard when Escape is pressed", () => {
    renderProvider();
    fireKeyDown("Escape");
    expect(useUIStore.getState().inputMode).toBe("keyboard");
  });

  it("does NOT set keyboard mode on non-nav key (e.g., 'a')", () => {
    renderProvider();
    fireKeyDown("a");
    expect(useUIStore.getState().inputMode).toBe("mouse");
  });
});

// ── inputMode switching — mouse ───────────────────────────────────────────────

describe("SpatialNavProvider — inputMode switches to mouse on mousemove", () => {
  it("sets inputMode back to mouse when mouse moves", () => {
    renderProvider();

    // First switch to keyboard
    fireKeyDown("ArrowUp");
    expect(useUIStore.getState().inputMode).toBe("keyboard");

    // Then mouse move
    act(() => {
      fireMouseMove();
    });

    expect(useUIStore.getState().inputMode).toBe("mouse");
    expect(document.documentElement.dataset.inputMode).toBe("mouse");
  });
});

// ── Back button handling ──────────────────────────────────────────────────────

describe("SpatialNavProvider — back button (no active player)", () => {
  it("calls window.history.back() for Fire TV keyCode 4", () => {
    const backSpy = vi
      .spyOn(window.history, "back")
      .mockImplementation(() => {});
    renderProvider();
    fireKeyDown("GoBack", 4);
    expect(backSpy).toHaveBeenCalledTimes(1);
    backSpy.mockRestore();
  });

  it("calls window.history.back() for Samsung Tizen keyCode 10009", () => {
    const backSpy = vi
      .spyOn(window.history, "back")
      .mockImplementation(() => {});
    renderProvider();
    fireKeyDown("GoBack", 10009);
    expect(backSpy).toHaveBeenCalledTimes(1);
    backSpy.mockRestore();
  });

  it("calls window.history.back() for LG webOS keyCode 461", () => {
    const backSpy = vi
      .spyOn(window.history, "back")
      .mockImplementation(() => {});
    renderProvider();
    fireKeyDown("GoBack", 461);
    expect(backSpy).toHaveBeenCalledTimes(1);
    backSpy.mockRestore();
  });

  it("does NOT call history.back() for Escape (Escape is handled differently)", () => {
    // Escape is a nav key that switches inputMode but does NOT call history.back()
    // (Escape is used by the app's router via key === 'Escape' exclusion in back handler)
    const backSpy = vi
      .spyOn(window.history, "back")
      .mockImplementation(() => {});
    renderProvider();
    fireKeyDown("Escape");
    expect(backSpy).not.toHaveBeenCalled();
    backSpy.mockRestore();
  });
});

// ── Back button suppressed when player is active ──────────────────────────────

describe("SpatialNavProvider — back button suppressed when player active", () => {
  it("does NOT call history.back() when player has an active stream (Fire TV back)", () => {
    usePlayerStore.setState({ currentStreamId: "stream-1" });
    const backSpy = vi
      .spyOn(window.history, "back")
      .mockImplementation(() => {});
    renderProvider();
    fireKeyDown("GoBack", 4);
    expect(backSpy).not.toHaveBeenCalled();
    backSpy.mockRestore();
  });

  it("does NOT call history.back() when player has an active stream (Samsung back)", () => {
    usePlayerStore.setState({ currentStreamId: "live-ch-1" });
    const backSpy = vi
      .spyOn(window.history, "back")
      .mockImplementation(() => {});
    renderProvider();
    fireKeyDown("GoBack", 10009);
    expect(backSpy).not.toHaveBeenCalled();
    backSpy.mockRestore();
  });
});

// ── Arrow keys deferred to player in TV mode ──────────────────────────────────

describe("SpatialNavProvider — arrow keys deferred to player in TV mode", () => {
  it("does NOT set inputMode to keyboard for arrow in TV mode with active player", () => {
    isTVModeValue = true;
    usePlayerStore.setState({ currentStreamId: "stream-1" });
    renderProvider();

    // Reset to mouse to test if arrow changes it
    useUIStore.setState({ inputMode: "mouse" });
    document.documentElement.dataset.inputMode = "mouse";

    fireKeyDown("ArrowUp");

    // In TV mode with player active, arrow is deferred → no keyboard mode switch
    expect(useUIStore.getState().inputMode).toBe("mouse");
  });

  it("still sets keyboard mode on arrow if player is NOT active in TV mode", () => {
    isTVModeValue = true;
    // currentStreamId is null (no active player)
    renderProvider();
    fireKeyDown("ArrowUp");
    expect(useUIStore.getState().inputMode).toBe("keyboard");
  });
});

// ── Enter: click focused element via data-focus-key ───────────────────────────

describe("SpatialNavProvider — Enter clicks focused element", () => {
  it("clicks the element with data-focus-key matching current focus key", () => {
    const clickMock = vi.fn();
    const focusedEl = document.createElement("div");
    focusedEl.setAttribute("data-focus-key", "CARD_1");
    focusedEl.addEventListener("click", clickMock);
    document.body.appendChild(focusedEl);

    mockGetCurrentFocusKey.mockReturnValue("CARD_1");

    renderProvider();
    fireKeyDown("Enter");

    expect(clickMock).toHaveBeenCalledTimes(1);

    document.body.removeChild(focusedEl);
  });

  it("does NOT click when focused element wraps an input (allows input focus)", () => {
    const clickMock = vi.fn();
    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-focus-key", "SEARCH_INPUT");
    wrapper.addEventListener("click", clickMock);

    const input = document.createElement("input");
    wrapper.appendChild(input);
    document.body.appendChild(wrapper);

    mockGetCurrentFocusKey.mockReturnValue("SEARCH_INPUT");

    renderProvider();
    fireKeyDown("Enter");

    // click() should be skipped — let norigin's onEnterPress handle input focus
    expect(clickMock).not.toHaveBeenCalled();

    document.body.removeChild(wrapper);
  });

  it("does nothing when no element has the current focus key", () => {
    // focus key exists but no matching DOM element
    mockGetCurrentFocusKey.mockReturnValue("MISSING_KEY");
    renderProvider();
    // Should not throw
    expect(() => fireKeyDown("Enter")).not.toThrow();
  });

  it("does nothing when getCurrentFocusKey returns null", () => {
    mockGetCurrentFocusKey.mockReturnValue(null);
    renderProvider();
    expect(() => fireKeyDown("Enter")).not.toThrow();
  });
});

// ── Arrow keys skipped when typing in non-arrow keys ──────────────────────────

describe("SpatialNavProvider — skips non-arrow keys in inputs", () => {
  it("does not switch inputMode to keyboard on non-nav key pressed in input", () => {
    renderProvider();

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    // Fire 'p' key with input as active element
    fireKeyDown("p", undefined, input);
    expect(useUIStore.getState().inputMode).toBe("mouse");

    document.body.removeChild(input);
  });

  it("blurs input when arrow key is pressed (spatial nav takes over)", () => {
    renderProvider();

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    const blurSpy = vi.spyOn(input, "blur");

    // Temporarily override activeElement to return the input element.
    // MUST restore after the test to prevent subsequent tests from seeing
    // isInInput=true and short-circuiting before the back button handler.
    Object.defineProperty(document, "activeElement", {
      configurable: true,
      get: () => input,
    });

    // Simulate ArrowUp with input as active element
    const event = new KeyboardEvent("keydown", {
      key: "ArrowUp",
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);

    expect(blurSpy).toHaveBeenCalledTimes(1);

    // Restore activeElement to document.body (default jsdom behavior)
    Object.defineProperty(document, "activeElement", {
      configurable: true,
      get: () => document.body,
    });

    document.body.removeChild(input);
  });
});

// ── Dedup: 50ms window prevents double-firing ─────────────────────────────────

describe("SpatialNavProvider — 50ms dedup prevents double-firing", () => {
  // Explicit cleanup before each dedup test to ensure no stale event listeners
  // from previous tests accumulate (dedup state is closure-local, but Date.now()
  // mock can cause false-dedup if stale listeners are still attached).
  beforeEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.useFakeTimers();
  });

  it("ignores the same key within 50ms (Fire TV dispatches to both targets)", () => {
    const backSpy = vi
      .spyOn(window.history, "back")
      .mockImplementation(() => {});
    renderProvider();

    // Fire same key twice within 50ms
    fireKeyDown("GoBack", 4);
    fireKeyDown("GoBack", 4); // should be deduplicated

    expect(backSpy).toHaveBeenCalledTimes(1);
    backSpy.mockRestore();
  });

  it("allows the same key after 50ms has passed", () => {
    const backSpy = vi
      .spyOn(window.history, "back")
      .mockImplementation(() => {});
    renderProvider();

    fireKeyDown("GoBack", 4);
    vi.advanceTimersByTime(51);
    fireKeyDown("GoBack", 4); // distinct press after dedup window

    expect(backSpy).toHaveBeenCalledTimes(2);
    backSpy.mockRestore();
  });

  it("allows different e.key values in rapid succession (no dedup across distinct keys)", () => {
    // The dedup compares e.key (not keyCode). Two events with different e.key values
    // are treated as distinct keys even if fired rapidly.
    const backSpy = vi
      .spyOn(window.history, "back")
      .mockImplementation(() => {});
    renderProvider();

    // "GoBack" (keyCode 4 — Fire TV) and "Escape" are distinct e.key values.
    // Escape does NOT trigger history.back() per the provider code (it's excluded).
    // So use two distinct TV remote keyCodes that both trigger back, but pair them
    // with distinct e.key values by making the second one use ArrowLeft key
    // which won't trigger back at all.
    // Simpler: verify the dedup window resets after different e.key events.
    fireKeyDown("GoBack", 4); // first: fires history.back()
    // A different key ("ArrowLeft") won't fire history.back but resets lastKeyCode
    fireKeyDown("ArrowLeft");
    // Now "GoBack" again — not within 50ms of the last "GoBack", should fire
    fireKeyDown("GoBack", 10009);

    // back was called for the first GoBack and the second GoBack (after intervening key)
    expect(backSpy).toHaveBeenCalledTimes(2);
    backSpy.mockRestore();
  });
});

// ── Cleanup on unmount ────────────────────────────────────────────────────────

describe("SpatialNavProvider — cleanup on unmount", () => {
  it("removes document keydown listener on unmount", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = renderProvider();
    unmount();
    expect(removeSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function),
      expect.objectContaining({ capture: true }),
    );
  });

  it("removes window keydown listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderProvider();
    unmount();
    expect(removeSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function),
      expect.objectContaining({ capture: true }),
    );
  });

  it("removes mousemove listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderProvider();
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("mousemove", expect.any(Function));
  });

  it("does not update inputMode after unmount", () => {
    const { unmount } = renderProvider();
    unmount();

    // Fire nav key after unmount — store should not change
    useUIStore.setState({ inputMode: "mouse" });
    fireKeyDown("ArrowUp");

    expect(useUIStore.getState().inputMode).toBe("mouse");
  });
});

// ── Bootstrap focus on first nav key ─────────────────────────────────────────

describe("SpatialNavProvider — bootstrap focus on first nav key", () => {
  it("calls setFocus('SN:ROOT') when arrow key is pressed and nothing is focused", () => {
    // No data-focused="true" elements in DOM
    renderProvider();
    mockGetCurrentFocusKey.mockReturnValue(null);

    fireKeyDown("ArrowUp");

    expect(mockSetFocus).toHaveBeenCalledWith("SN:ROOT");
  });

  it("does NOT call setFocus when a focused element already exists", () => {
    const focusedEl = document.createElement("div");
    focusedEl.setAttribute("data-focused", "true");
    document.body.appendChild(focusedEl);

    renderProvider();
    fireKeyDown("ArrowUp");

    expect(mockSetFocus).not.toHaveBeenCalledWith("SN:ROOT");

    document.body.removeChild(focusedEl);
  });
});
