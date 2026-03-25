import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockUseFocusable = vi.fn();
const mockSetFocus = vi.fn();
const mockDoesExist = vi.fn();
const mockPause = vi.fn();
const mockResume = vi.fn();

vi.mock("@noriginmedia/norigin-spatial-navigation", () => ({
  useFocusable: (...args: unknown[]) => mockUseFocusable(...args),
  FocusContext: { Provider: ({ children }: { children: unknown }) => children },
  setFocus: (...args: unknown[]) => mockSetFocus(...args),
  doesFocusableExist: (...args: unknown[]) => mockDoesExist(...args),
  pause: (...args: unknown[]) => mockPause(...args),
  resume: (...args: unknown[]) => mockResume(...args),
}));

import {
  useSpatialFocusable,
  useSpatialContainer,
  setFocus,
  doesFocusableExist,
  pauseSpatialNav,
  resumeSpatialNav,
} from "../useSpatialNav";

describe("useSpatialFocusable", () => {
  const defaultFocusableReturn = {
    ref: { current: null },
    focused: false,
    focusSelf: vi.fn(),
    focusKey: "test-key",
    hasFocusedChild: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFocusable.mockReturnValue({
      ...defaultFocusableReturn,
      focusSelf: vi.fn(),
    });
    // Set up document.documentElement.dataset
    document.documentElement.dataset.inputMode = "keyboard";
  });

  it("returns ref, focused, focusSelf, focusKey, hasFocusedChild, showFocusRing, focusProps", () => {
    const { result } = renderHook(() => useSpatialFocusable());

    expect(result.current).toHaveProperty("ref");
    expect(result.current).toHaveProperty("focused");
    expect(result.current).toHaveProperty("focusSelf");
    expect(result.current).toHaveProperty("focusKey");
    expect(result.current).toHaveProperty("hasFocusedChild");
    expect(result.current).toHaveProperty("showFocusRing");
    expect(result.current).toHaveProperty("focusProps");
  });

  it("passes focusKey option to useFocusable", () => {
    renderHook(() => useSpatialFocusable({ focusKey: "MY_CARD" }));

    expect(mockUseFocusable).toHaveBeenCalledWith(
      expect.objectContaining({ focusKey: "MY_CARD" }),
    );
  });

  it("defaults focusable to true", () => {
    renderHook(() => useSpatialFocusable());

    expect(mockUseFocusable).toHaveBeenCalledWith(
      expect.objectContaining({ focusable: true }),
    );
  });

  it("allows overriding focusable to false", () => {
    renderHook(() => useSpatialFocusable({ focusable: false }));

    expect(mockUseFocusable).toHaveBeenCalledWith(
      expect.objectContaining({ focusable: false }),
    );
  });

  it("showFocusRing is true when focused and inputMode is keyboard", () => {
    mockUseFocusable.mockReturnValue({
      ...defaultFocusableReturn,
      focused: true,
    });
    document.documentElement.dataset.inputMode = "keyboard";

    const { result } = renderHook(() => useSpatialFocusable());

    expect(result.current.showFocusRing).toBe(true);
  });

  it("showFocusRing is false when focused but inputMode is mouse", () => {
    mockUseFocusable.mockReturnValue({
      ...defaultFocusableReturn,
      focused: true,
    });
    document.documentElement.dataset.inputMode = "mouse";

    const { result } = renderHook(() => useSpatialFocusable());

    expect(result.current.showFocusRing).toBe(false);
  });

  it("showFocusRing is false when not focused", () => {
    mockUseFocusable.mockReturnValue({
      ...defaultFocusableReturn,
      focused: false,
    });
    document.documentElement.dataset.inputMode = "keyboard";

    const { result } = renderHook(() => useSpatialFocusable());

    expect(result.current.showFocusRing).toBe(false);
  });

  it("focusProps.onMouseEnter calls focusSelf", () => {
    const focusSelf = vi.fn();
    mockUseFocusable.mockReturnValue({ ...defaultFocusableReturn, focusSelf });

    const { result } = renderHook(() => useSpatialFocusable());

    act(() => {
      result.current.focusProps.onMouseEnter();
    });

    expect(focusSelf).toHaveBeenCalledTimes(1);
  });

  it("focusProps includes data-focus-key attribute", () => {
    mockUseFocusable.mockReturnValue({
      ...defaultFocusableReturn,
      focusKey: "card-42",
    });

    const { result } = renderHook(() => useSpatialFocusable());

    expect(result.current.focusProps["data-focus-key"]).toBe("card-42");
  });

  it("passes onEnterPress callback to useFocusable", () => {
    const onEnterPress = vi.fn();
    renderHook(() => useSpatialFocusable({ onEnterPress }));

    expect(mockUseFocusable).toHaveBeenCalledWith(
      expect.objectContaining({ onEnterPress }),
    );
  });

  it("passes onArrowPress wrapped callback to useFocusable", () => {
    const onArrowPress = vi.fn().mockReturnValue(true);
    renderHook(() => useSpatialFocusable({ onArrowPress }));

    const passedOptions = mockUseFocusable.mock.calls[0][0];
    expect(passedOptions.onArrowPress).toBeDefined();

    // Call the wrapped version
    passedOptions.onArrowPress("left");
    expect(onArrowPress).toHaveBeenCalledWith("left");
  });

  it("passes isFocusBoundary and focusBoundaryDirections", () => {
    renderHook(() =>
      useSpatialFocusable({
        isFocusBoundary: true,
        focusBoundaryDirections: ["left", "right"],
      }),
    );

    expect(mockUseFocusable).toHaveBeenCalledWith(
      expect.objectContaining({
        isFocusBoundary: true,
        focusBoundaryDirections: ["left", "right"],
      }),
    );
  });
});

describe("useSpatialContainer", () => {
  const defaultContainerReturn = {
    ref: { current: null },
    focused: false,
    focusSelf: vi.fn(),
    focusKey: "container-key",
    hasFocusedChild: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFocusable.mockReturnValue({
      ...defaultContainerReturn,
      focusSelf: vi.fn(),
    });
  });

  it("returns ref, focusSelf, focusKey, hasFocusedChild", () => {
    const { result } = renderHook(() => useSpatialContainer());

    expect(result.current).toHaveProperty("ref");
    expect(result.current).toHaveProperty("focusSelf");
    expect(result.current).toHaveProperty("focusKey");
    expect(result.current).toHaveProperty("hasFocusedChild");
  });

  it("defaults focusable to false (containers should not be focusable)", () => {
    renderHook(() => useSpatialContainer());

    expect(mockUseFocusable).toHaveBeenCalledWith(
      expect.objectContaining({ focusable: false }),
    );
  });

  it("defaults saveLastFocusedChild to true", () => {
    renderHook(() => useSpatialContainer());

    expect(mockUseFocusable).toHaveBeenCalledWith(
      expect.objectContaining({ saveLastFocusedChild: true }),
    );
  });

  it("defaults trackChildren to true", () => {
    renderHook(() => useSpatialContainer());

    expect(mockUseFocusable).toHaveBeenCalledWith(
      expect.objectContaining({ trackChildren: true }),
    );
  });

  it("allows overriding focusable to true", () => {
    renderHook(() => useSpatialContainer({ focusable: true }));

    expect(mockUseFocusable).toHaveBeenCalledWith(
      expect.objectContaining({ focusable: true }),
    );
  });

  it("passes focusKey to useFocusable", () => {
    renderHook(() => useSpatialContainer({ focusKey: "HOME_RAIL" }));

    expect(mockUseFocusable).toHaveBeenCalledWith(
      expect.objectContaining({ focusKey: "HOME_RAIL" }),
    );
  });

  it("passes isFocusBoundary and focusBoundaryDirections", () => {
    renderHook(() =>
      useSpatialContainer({
        isFocusBoundary: true,
        focusBoundaryDirections: ["up", "down"],
      }),
    );

    expect(mockUseFocusable).toHaveBeenCalledWith(
      expect.objectContaining({
        isFocusBoundary: true,
        focusBoundaryDirections: ["up", "down"],
      }),
    );
  });

  it("passes onFocus and onBlur callbacks", () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();

    renderHook(() => useSpatialContainer({ onFocus, onBlur }));

    expect(mockUseFocusable).toHaveBeenCalledWith(
      expect.objectContaining({ onFocus, onBlur }),
    );
  });
});

describe("re-exported utilities", () => {
  it("setFocus delegates to norigin setFocus", () => {
    setFocus("SOME_KEY");
    expect(mockSetFocus).toHaveBeenCalledWith("SOME_KEY");
  });

  it("doesFocusableExist delegates to norigin", () => {
    mockDoesExist.mockReturnValue(true);
    expect(doesFocusableExist("MY_KEY")).toBe(true);
    expect(mockDoesExist).toHaveBeenCalledWith("MY_KEY");
  });

  it("pauseSpatialNav delegates to norigin pause", () => {
    pauseSpatialNav();
    expect(mockPause).toHaveBeenCalled();
  });

  it("resumeSpatialNav delegates to norigin resume", () => {
    resumeSpatialNav();
    expect(mockResume).toHaveBeenCalled();
  });
});
