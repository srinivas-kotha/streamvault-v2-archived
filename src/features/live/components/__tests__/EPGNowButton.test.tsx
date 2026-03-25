/**
 * Sprint 5 — EPGNowButton tests
 *
 * These tests WILL FAIL because EPGNowButton does not exist yet.
 * Expected path: src/features/live/components/EPGNowButton.tsx
 *
 * Contract:
 *   - Renders "Now" text
 *   - Clicking scrolls EPG timeline to current time (calls a scroll callback)
 *   - Visually highlighted when EPG viewport is not showing current time
 *   - Not highlighted when EPG is already showing current time
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EPGNowButton } from "../EPGNowButton";

// ── mock spatial nav ──────────────────────────────────────────────────────────

vi.mock("@shared/hooks/useSpatialNav", () => ({
  useSpatialFocusable: ({ focusKey }: any) => ({
    ref: { current: null },
    showFocusRing: false,
    focusProps: { "data-focus-key": focusKey },
  }),
  FocusContext: { Provider: ({ children }: any) => children },
  setFocus: vi.fn(),
}));

// ── helpers ───────────────────────────────────────────────────────────────────

const mockOnScrollToNow = vi.fn();

function renderNowButton(
  props?: Partial<React.ComponentProps<typeof EPGNowButton>>,
) {
  return render(
    <EPGNowButton
      onScrollToNow={mockOnScrollToNow}
      isAtNow={false}
      {...props}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe("EPGNowButton — rendering", () => {
  it("renders 'Now' text", () => {
    renderNowButton();
    expect(screen.getByText("Now")).toBeTruthy();
  });

  it("renders as a button element", () => {
    renderNowButton();
    expect(screen.getByRole("button", { name: /now/i })).toBeTruthy();
  });

  it("has aria-label describing its purpose", () => {
    renderNowButton();
    const btn = screen.getByRole("button", { name: /now/i });
    // Should have descriptive label for screen readers
    expect(btn.getAttribute("aria-label") || btn.textContent).toMatch(/now/i);
  });
});

describe("EPGNowButton — scroll to now", () => {
  it("calls onScrollToNow when clicked", () => {
    renderNowButton();
    fireEvent.click(screen.getByRole("button", { name: /now/i }));
    expect(mockOnScrollToNow).toHaveBeenCalledTimes(1);
  });

  it("calls onScrollToNow when Enter key is pressed", () => {
    renderNowButton();
    fireEvent.keyDown(screen.getByRole("button", { name: /now/i }), {
      key: "Enter",
    });
    expect(mockOnScrollToNow).toHaveBeenCalledTimes(1);
  });
});

describe("EPGNowButton — highlighted state", () => {
  it("is highlighted (active style) when EPG is NOT at current time (isAtNow=false)", () => {
    const { container } = renderNowButton({ isAtNow: false });
    const btn = container.querySelector("button");
    // When not at now, button should be visually prominent
    // Check for highlight class (teal or indigo accent)
    const classList = btn?.className ?? "";
    expect(
      classList.includes("teal") ||
        classList.includes("indigo") ||
        classList.includes("active") ||
        classList.includes("highlight"),
    ).toBe(true);
  });

  it("is NOT highlighted when EPG is already showing current time (isAtNow=true)", () => {
    const { container } = renderNowButton({ isAtNow: true });
    const btn = container.querySelector("button");
    // When already at now, button should appear muted/inactive
    const classList = btn?.className ?? "";
    // Should have a muted class when at now (e.g., text-muted, opacity, etc.)
    expect(
      classList.includes("muted") ||
        classList.includes("opacity") ||
        classList.includes("disabled") ||
        btn?.getAttribute("aria-pressed") === "true",
    ).toBe(true);
  });

  it("has aria-pressed=false when not at current time", () => {
    renderNowButton({ isAtNow: false });
    const btn = screen.getByRole("button", { name: /now/i });
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });

  it("has aria-pressed=true when already at current time", () => {
    renderNowButton({ isAtNow: true });
    const btn = screen.getByRole("button", { name: /now/i });
    expect(btn.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("EPGNowButton — spatial navigation", () => {
  it("has a focus key for D-pad navigation", () => {
    const { container } = renderNowButton();
    const btn = container.querySelector("button");
    // Should have data-focus-key set by useSpatialFocusable
    expect(btn?.getAttribute("data-focus-key")).toBeTruthy();
  });
});
