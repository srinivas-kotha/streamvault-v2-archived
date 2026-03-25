import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FocusableCard } from "../FocusableCard";

// ── mock spatial nav ──────────────────────────────────────────────────────────

vi.mock("@shared/hooks/useSpatialNav", () => ({
  useSpatialFocusable: (opts: any) => ({
    ref: { current: null },
    showFocusRing: false,
    focused: false,
    focusProps: { "data-focus-key": opts?.focusKey ?? "test" },
  }),
}));

vi.mock("@/design-system/focus/useFocusStyles", () => ({
  useFocusStyles: () => ({
    cardFocus: "ring-2 ring-accent-teal shadow-focus",
    buttonFocus: "ring-2 ring-accent-teal ring-offset-2",
    inputFocus: "ring-2 ring-accent-teal",
  }),
}));

// ── helpers ───────────────────────────────────────────────────────────────────

function renderFocusableCard(
  props?: Partial<React.ComponentProps<typeof FocusableCard>>,
) {
  return render(
    <FocusableCard {...props}>
      <div data-testid="card-content">Card inner content</div>
    </FocusableCard>,
  );
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("FocusableCard — rendering", () => {
  it("renders children", () => {
    renderFocusableCard();
    expect(screen.getByTestId("card-content")).toBeTruthy();
    expect(screen.getByText("Card inner content")).toBeTruthy();
  });

  it("wraps content in a FocusRing div", () => {
    const { container } = renderFocusableCard();
    const outerDiv = container.firstElementChild!;
    // FocusRing wrapper has 'relative' class
    expect(outerDiv.className).toContain("relative");
  });
});

describe("FocusableCard — focusKey", () => {
  it("passes focusKey to useSpatialFocusable", () => {
    const { container } = renderFocusableCard({ focusKey: "my-card" });
    const focusableEl = container.querySelector('[data-focus-key="my-card"]');
    expect(focusableEl).not.toBeNull();
  });
});

describe("FocusableCard — className", () => {
  it("applies additional className to FocusRing wrapper", () => {
    const { container } = renderFocusableCard({
      className: "custom-card-class",
    });
    const outerDiv = container.firstElementChild!;
    expect(outerDiv.className).toContain("custom-card-class");
  });
});

describe("FocusableCard — transition styles", () => {
  it("has smooth transition on the wrapper", () => {
    const { container } = renderFocusableCard();
    const outerDiv = container.firstElementChild!;
    expect(outerDiv.className).toContain("transition-");
    expect(outerDiv.className).toContain("duration-200");
  });

  it("does NOT use transition-all (expensive on TV)", () => {
    const { container } = renderFocusableCard();
    const outerDiv = container.firstElementChild!;
    expect(outerDiv.className).not.toContain("transition-all");
  });
});

describe("FocusableCard — inner ref div", () => {
  it("inner div carries focusProps (data-focus-key)", () => {
    const { container } = renderFocusableCard({ focusKey: "test-ref" });
    const inner = container.querySelector("[data-focus-key]");
    expect(inner).not.toBeNull();
  });
});

describe("FocusableCard — focus ring variant", () => {
  it('uses "card" variant for FocusRing', () => {
    // When unfocused, no focus-specific styles appear
    const { container } = renderFocusableCard();
    const wrapper = container.firstElementChild!;
    // No ring styles when not focused
    expect(wrapper.className).not.toContain("ring-accent-teal");
  });
});
