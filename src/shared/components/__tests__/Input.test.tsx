import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createRef } from "react";
import { Input } from "../Input";

// ── tests ─────────────────────────────────────────────────────────────────────

describe("Input — basic rendering", () => {
  it("renders an input element", () => {
    render(<Input />);
    expect(screen.getByRole("textbox")).toBeTruthy();
  });

  it("renders with placeholder text", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeTruthy();
  });
});

describe("Input — label association", () => {
  it("renders a label when label prop is provided", () => {
    render(<Input label="Email" id="email" />);
    expect(screen.getByText("Email")).toBeTruthy();
  });

  it("associates label with input via htmlFor/id", () => {
    render(<Input label="Email" id="email" />);
    const input = screen.getByLabelText("Email");
    expect(input).toBeTruthy();
    expect(input.tagName).toBe("INPUT");
  });

  it("does not render a label when label prop is omitted", () => {
    const { container } = render(<Input id="no-label" />);
    expect(container.querySelector("label")).toBeNull();
  });
});

describe("Input — error state", () => {
  it("renders error message when error prop is provided", () => {
    render(<Input error="Required field" />);
    expect(screen.getByText("Required field")).toBeTruthy();
  });

  it("applies error border class when error prop is provided", () => {
    render(<Input error="Bad value" />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("border-error");
  });

  it("applies normal border when no error", () => {
    render(<Input />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("border-border");
    expect(input.className).not.toContain("border-error");
  });

  it("does not render error paragraph when error prop is omitted", () => {
    const { container } = render(<Input />);
    const errorP = container.querySelector("p.text-error");
    expect(errorP).toBeNull();
  });
});

describe("Input — ref forwarding", () => {
  it("forwards ref to the underlying input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe("INPUT");
  });
});

describe("Input — onChange handler", () => {
  it("calls onChange when input value changes", () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "hello" },
    });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});

describe("Input — className merge", () => {
  it("applies additional className to the input element", () => {
    render(<Input className="my-custom" />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("my-custom");
  });

  it("preserves base classes when custom className is added", () => {
    render(<Input className="my-custom" />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("w-full");
    expect(input.className).toContain("my-custom");
  });
});
