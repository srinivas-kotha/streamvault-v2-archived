import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageTransition } from "../PageTransition";

// ── tests ─────────────────────────────────────────────────────────────────────

describe("PageTransition", () => {
  it("renders children", () => {
    render(<PageTransition>Hello world</PageTransition>);
    expect(screen.getByText("Hello world")).toBeTruthy();
  });

  it("applies animate-page-in class", () => {
    const { container } = render(<PageTransition>Content</PageTransition>);
    expect(container.firstElementChild?.className).toContain("animate-page-in");
  });

  it("merges additional className", () => {
    const { container } = render(
      <PageTransition className="mt-4">Content</PageTransition>,
    );
    const el = container.firstElementChild!;
    expect(el.className).toContain("animate-page-in");
    expect(el.className).toContain("mt-4");
  });

  it('does not leak "undefined" into className when no className is passed', () => {
    const { container } = render(<PageTransition>Content</PageTransition>);
    expect(container.firstElementChild?.className).not.toContain("undefined");
  });
});
