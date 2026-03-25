/**
 * Sprint 6C — Accessibility Tests
 * SkipToContent: skip link behavior
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkipToContent } from "../SkipToContent";

describe("SkipToContent", () => {
  it("renders a link element", () => {
    render(<SkipToContent />);
    const link = screen.getByRole("link", { name: /skip to main content/i });
    expect(link).toBeInTheDocument();
  });

  it("links to #main-content", () => {
    render(<SkipToContent />);
    const link = screen.getByRole("link", { name: /skip to main content/i });
    expect(link).toHaveAttribute("href", "#main-content");
  });

  it("is visually hidden by default (has sr-only class)", () => {
    render(<SkipToContent />);
    const link = screen.getByRole("link", { name: /skip to main content/i });
    expect(link.className).toContain("sr-only");
  });

  it("shows when focused (has focus:not-sr-only class)", () => {
    render(<SkipToContent />);
    const link = screen.getByRole("link", { name: /skip to main content/i });
    // The focus variant class should be present so the link appears on focus
    expect(link.className).toContain("focus:not-sr-only");
  });

  it("has high z-index when focused", () => {
    render(<SkipToContent />);
    const link = screen.getByRole("link", { name: /skip to main content/i });
    // z-[9999] class present in class string
    expect(link.className).toContain("9999");
  });

  it("has descriptive text content", () => {
    render(<SkipToContent />);
    expect(screen.getByText("Skip to main content")).toBeInTheDocument();
  });
});
