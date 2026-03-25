import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FocusRing, type FocusRingVariant } from "../FocusRing";

// ── mock useFocusStyles ──────────────────────────────────────────────────────

vi.mock("../useFocusStyles", () => ({
  useFocusStyles: () => ({
    cardFocus: "ring-2 ring-accent-teal shadow-focus",
    buttonFocus: "ring-2 ring-accent-teal ring-offset-2",
    inputFocus: "ring-2 ring-accent-teal",
  }),
}));

// ── helpers ───────────────────────────────────────────────────────────────────

function renderFocusRing(
  props?: Partial<React.ComponentProps<typeof FocusRing>>,
) {
  return render(
    <FocusRing isFocused={false} variant="card" {...props}>
      <span>Child content</span>
    </FocusRing>,
  );
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("FocusRing — basic rendering", () => {
  it("renders children", () => {
    renderFocusRing();
    expect(screen.getByText("Child content")).toBeTruthy();
  });

  it("wraps children in a relative div", () => {
    const { container } = renderFocusRing();
    const wrapper = container.firstElementChild!;
    expect(wrapper.tagName).toBe("DIV");
    expect(wrapper.className).toContain("relative");
  });
});

describe("FocusRing — unfocused state", () => {
  it("does not apply focus class when isFocused is false", () => {
    const { container } = renderFocusRing({
      isFocused: false,
      variant: "card",
    });
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).not.toContain("ring-accent-teal");
  });
});

describe("FocusRing — focused state per variant", () => {
  const variants: FocusRingVariant[] = ["card", "button", "input"];

  it.each(variants)(
    "applies focus styles for %s variant when focused",
    (variant) => {
      const { container } = renderFocusRing({ isFocused: true, variant });
      const wrapper = container.firstElementChild!;
      expect(wrapper.className).toContain("ring-accent-teal");
    },
  );

  it("card variant includes shadow-focus when focused", () => {
    const { container } = renderFocusRing({ isFocused: true, variant: "card" });
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("shadow-focus");
  });

  it("button variant includes ring-offset-2 when focused", () => {
    const { container } = renderFocusRing({
      isFocused: true,
      variant: "button",
    });
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("ring-offset-2");
  });
});

describe("FocusRing — transitions", () => {
  it("always applies transition classes for smooth focus ring", () => {
    const { container } = renderFocusRing({ isFocused: false });
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("transition-[box-shadow,ring-color]");
    expect(wrapper.className).toContain("duration-200");
  });

  it("does NOT use transition-all (expensive on TV)", () => {
    const { container } = renderFocusRing({ isFocused: true, variant: "card" });
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).not.toContain("transition-all");
  });
});

describe("FocusRing — className passthrough", () => {
  it("forwards className to the wrapper", () => {
    const { container } = renderFocusRing({ className: "custom-radius" });
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("custom-radius");
  });
});
