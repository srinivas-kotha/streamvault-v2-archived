import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "../Input";

// ── helpers ───────────────────────────────────────────────────────────────────

function renderInput(props?: React.ComponentPropsWithRef<typeof Input>) {
  return render(<Input placeholder="Type here" {...props} />);
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("Input — default state", () => {
  it("renders an input element", () => {
    renderInput();
    expect(screen.getByRole("textbox")).toBeTruthy();
  });

  it("uses bg-bg-secondary token by default", () => {
    renderInput();
    expect(screen.getByRole("textbox").className).toContain("bg-bg-secondary");
  });

  it("applies default border-border token", () => {
    renderInput();
    expect(screen.getByRole("textbox").className).toContain("border-border");
  });
});

describe("Input — error state", () => {
  it("applies error border token when state=error", () => {
    renderInput({ state: "error" });
    expect(screen.getByRole("textbox").className).toContain("border-error");
  });

  it("renders error message when state=error and errorMessage provided", () => {
    renderInput({ state: "error", errorMessage: "Field is required" });
    expect(screen.getByRole("alert").textContent).toBe("Field is required");
  });

  it("does NOT render error message when state=default", () => {
    renderInput({ state: "default", errorMessage: "Should not show" });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("Input — disabled state", () => {
  it("has disabled attribute when disabled prop is set", () => {
    renderInput({ disabled: true });
    const el = screen.getByRole("textbox") as HTMLInputElement;
    expect(el.disabled).toBe(true);
  });

  it("applies opacity-50 and cursor-not-allowed when disabled", () => {
    renderInput({ disabled: true });
    expect(screen.getByRole("textbox").className).toContain("opacity-50");
    expect(screen.getByRole("textbox").className).toContain(
      "cursor-not-allowed",
    );
  });
});

describe("Input — label", () => {
  it("renders a label element when label prop is provided", () => {
    renderInput({ label: "Email" });
    expect(screen.getByText("Email")).toBeTruthy();
  });

  it("associates label with input via htmlFor", () => {
    const { container } = renderInput({ label: "Username", id: "username" });
    const label = container.querySelector("label");
    expect(label?.getAttribute("for")).toBe("username");
  });
});

describe("Input — TV focus", () => {
  it("applies TV focus ring class when isTVFocused=true", () => {
    renderInput({ isTVFocused: true });
    // useFocusStyles returns ring-[3px] ring-accent-teal in TV mode (isTVMode=false in test env → ring-2)
    const el = screen.getByRole("textbox");
    expect(el.className).toContain("ring-");
    expect(el.className).toContain("accent-teal");
  });

  it("does NOT apply TV focus ring when isTVFocused=false", () => {
    renderInput({ isTVFocused: false });
    // No isTVFocused ring-[3px] applied outside focus-visible
    expect(screen.getByRole("textbox").className).not.toContain("ring-[3px]");
  });
});

describe("Input — sizes", () => {
  it("sm size uses text-xs", () => {
    renderInput({ size: "sm" });
    expect(screen.getByRole("textbox").className).toContain("text-xs");
  });

  it("lg size uses text-base", () => {
    renderInput({ size: "lg" });
    expect(screen.getByRole("textbox").className).toContain("text-base");
  });
});
