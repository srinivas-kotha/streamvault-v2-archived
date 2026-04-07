import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Toggle } from "../Toggle";

// ── helpers ───────────────────────────────────────────────────────────────────

function renderToggle(props?: React.ComponentPropsWithRef<typeof Toggle>) {
  return render(<Toggle label="Enable feature" {...props} />);
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("Toggle — rendering", () => {
  it("renders a checkbox with role=switch", () => {
    renderToggle();
    expect(screen.getByRole("switch")).toBeTruthy();
  });

  it("renders label text", () => {
    renderToggle({ label: "Dark mode" });
    expect(screen.getByText("Dark mode")).toBeTruthy();
  });

  it("hides label visually when hideLabel=true but keeps it accessible", () => {
    renderToggle({ label: "Dark mode", hideLabel: true });
    const labelEl = screen.getByText("Dark mode");
    expect(labelEl.className).toContain("sr-only");
  });
});

describe("Toggle — checked state", () => {
  it("reflects checked=true on the input", () => {
    renderToggle({ checked: true, onChange: vi.fn() });
    const input = screen.getByRole("switch") as HTMLInputElement;
    expect(input.checked).toBe(true);
  });

  it("reflects checked=false on the input", () => {
    renderToggle({ checked: false, onChange: vi.fn() });
    const input = screen.getByRole("switch") as HTMLInputElement;
    expect(input.checked).toBe(false);
  });

  it("track applies bg-accent-teal when checked=true", () => {
    const { container } = renderToggle({ checked: true, onChange: vi.fn() });
    // The track is the aria-hidden span sibling to the sr-only input
    const track = container.querySelector("span[aria-hidden='true']");
    expect(track?.className).toContain("bg-accent-teal");
  });

  it("track does NOT apply bg-accent-teal when checked=false", () => {
    const { container } = renderToggle({ checked: false, onChange: vi.fn() });
    const track = container.querySelector("span[aria-hidden='true']");
    expect(track?.className).not.toContain("bg-accent-teal");
  });
});

describe("Toggle — disabled state", () => {
  it("has disabled attribute when disabled=true", () => {
    renderToggle({ disabled: true });
    const input = screen.getByRole("switch") as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it("applies opacity-50 and cursor-not-allowed on the label when disabled", () => {
    const { container } = renderToggle({ disabled: true });
    const label = container.querySelector("label");
    expect(label?.className).toContain("opacity-50");
    expect(label?.className).toContain("cursor-not-allowed");
  });
});

describe("Toggle — onChange", () => {
  it("calls onChange when clicked", () => {
    const onChange = vi.fn();
    renderToggle({ onChange });
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("input has disabled attribute, preventing real interaction", () => {
    // Verifies the disabled prop is forwarded to the underlying input.
    // Native browser + real userEvent will not fire onChange on a disabled input;
    // fireEvent bypasses native behaviour so we assert the attribute instead.
    renderToggle({ disabled: true, onChange: vi.fn() });
    expect((screen.getByRole("switch") as HTMLInputElement).disabled).toBe(
      true,
    );
  });
});

describe("Toggle — TV focus", () => {
  it("applies TV focus ring on track when isTVFocused=true", () => {
    const { container } = renderToggle({ isTVFocused: true });
    const track = container.querySelector("span[aria-hidden='true']");
    expect(track?.className).toContain("ring-");
    expect(track?.className).toContain("accent-teal");
  });
});

describe("Toggle — sizes", () => {
  it("sm size applies w-8 track", () => {
    const { container } = renderToggle({ size: "sm" });
    const track = container.querySelector("span[aria-hidden='true']");
    expect(track?.className).toContain("w-8");
  });

  it("lg size applies w-14 track", () => {
    const { container } = renderToggle({ size: "lg" });
    const track = container.querySelector("span[aria-hidden='true']");
    expect(track?.className).toContain("w-14");
  });
});
