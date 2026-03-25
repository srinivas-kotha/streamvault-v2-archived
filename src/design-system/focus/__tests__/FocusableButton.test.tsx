import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FocusableButton } from "../FocusableButton";

// ── mock spatial nav ──────────────────────────────────────────────────────────

const mockOnEnterPress = vi.fn();

vi.mock("@shared/hooks/useSpatialNav", () => ({
  useSpatialFocusable: (opts: any) => ({
    ref: { current: null },
    showFocusRing: false,
    focused: false,
    focusProps: { "data-focus-key": opts?.focusKey ?? "test" },
  }),
}));

vi.mock("../useFocusStyles", () => ({
  useFocusStyles: () => ({
    cardFocus: "ring-2 ring-accent-teal shadow-focus",
    buttonFocus: "ring-2 ring-accent-teal ring-offset-2",
    inputFocus: "ring-2 ring-accent-teal",
  }),
}));

// ── helpers ───────────────────────────────────────────────────────────────────

function renderFocusableButton(
  props?: Partial<React.ComponentProps<typeof FocusableButton>>,
) {
  return render(
    <FocusableButton {...props}>
      {props?.children ?? "Click me"}
    </FocusableButton>,
  );
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("FocusableButton — rendering", () => {
  it("renders a button element", () => {
    renderFocusableButton();
    expect(screen.getByRole("button")).toBeTruthy();
  });

  it("renders children text", () => {
    renderFocusableButton({ children: "Submit" });
    expect(screen.getByText("Submit")).toBeTruthy();
  });

  it("renders with primary variant by default", () => {
    renderFocusableButton();
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-accent-teal");
  });
});

describe("FocusableButton — variants", () => {
  it("renders secondary variant", () => {
    renderFocusableButton({ variant: "secondary" });
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-bg-tertiary");
  });

  it("renders ghost variant", () => {
    renderFocusableButton({ variant: "ghost" });
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-transparent");
  });
});

describe("FocusableButton — disabled state", () => {
  it("sets disabled attribute when disabled", () => {
    renderFocusableButton({ disabled: true });
    const btn = screen.getByRole("button") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});

describe("FocusableButton — click handler", () => {
  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    renderFocusableButton({ onClick });
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe("FocusableButton — aria-label", () => {
  it("passes aria-label to the button for icon-only use", () => {
    renderFocusableButton({ "aria-label": "Close dialog" });
    expect(screen.getByLabelText("Close dialog")).toBeTruthy();
  });
});

describe("FocusableButton — focus ring wrapper", () => {
  it("wraps button in a FocusRing div with relative positioning", () => {
    const { container } = renderFocusableButton();
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("relative");
  });

  it("removes native focus-visible ring from button", () => {
    renderFocusableButton();
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("focus-visible:ring-0");
  });
});

describe("FocusableButton — data-focus-key", () => {
  it("spreads focusProps onto the button element", () => {
    renderFocusableButton({ focusKey: "my-btn" });
    const btn = screen.getByRole("button");
    expect(btn.getAttribute("data-focus-key")).toBe("my-btn");
  });
});
