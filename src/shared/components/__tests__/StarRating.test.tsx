import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StarRating } from "../StarRating";

// ── helpers ───────────────────────────────────────────────────────────────────

function renderStarRating(props: React.ComponentProps<typeof StarRating>) {
  return render(<StarRating {...props} />);
}

function getClass(el: Element): string {
  return el.getAttribute("class") ?? "";
}

function countStars(container: HTMLElement, type: "full" | "half" | "empty") {
  const svgs = container.querySelectorAll("svg");
  if (type === "full") {
    // Full stars have fill="currentColor" and text-warning class
    return Array.from(svgs).filter(
      (svg) =>
        svg.getAttribute("fill") === "currentColor" &&
        getClass(svg).includes("text-warning"),
    ).length;
  }
  if (type === "half") {
    // Half star uses fill="url(#half-star)" on the path
    return Array.from(container.querySelectorAll("path")).filter(
      (path) => path.getAttribute("fill") === "url(#half-star)",
    ).length;
  }
  // Empty stars have text-text-muted class
  return Array.from(svgs).filter(
    (svg) =>
      svg.getAttribute("fill") === "currentColor" &&
      getClass(svg).includes("text-text-muted"),
  ).length;
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("StarRating — full stars (max=5)", () => {
  it("renders 5 full stars for rating 5", () => {
    const { container } = renderStarRating({ rating: 5 });
    expect(countStars(container, "full")).toBe(5);
    expect(countStars(container, "empty")).toBe(0);
  });

  it("renders 3 full stars and 2 empty for rating 3", () => {
    const { container } = renderStarRating({ rating: 3 });
    expect(countStars(container, "full")).toBe(3);
    expect(countStars(container, "empty")).toBe(2);
  });

  it("renders 0 full stars for rating 0", () => {
    const { container } = renderStarRating({ rating: 0 });
    expect(countStars(container, "full")).toBe(0);
  });
});

describe("StarRating — half stars", () => {
  it("renders a half star for rating 3.5", () => {
    const { container } = renderStarRating({ rating: 3.5 });
    expect(countStars(container, "full")).toBe(3);
    expect(countStars(container, "half")).toBe(1);
    expect(countStars(container, "empty")).toBe(1);
  });

  it("does NOT render half star for rating 3.2 (below 0.3 threshold)", () => {
    const { container } = renderStarRating({ rating: 3.2 });
    expect(countStars(container, "half")).toBe(0);
    expect(countStars(container, "full")).toBe(3);
    expect(countStars(container, "empty")).toBe(2);
  });

  it("renders half star for rating 3.4 (above 0.3 threshold)", () => {
    const { container } = renderStarRating({ rating: 3.4 });
    expect(countStars(container, "half")).toBe(1);
  });
});

describe("StarRating — max=10 normalization", () => {
  it("normalizes 10-point scale to 5-point (8/10 = 4/5)", () => {
    const { container } = renderStarRating({ rating: 8, max: 10 });
    expect(countStars(container, "full")).toBe(4);
    expect(countStars(container, "empty")).toBe(1);
  });

  it("normalizes 7/10 to 3.5/5 (3 full + 1 half)", () => {
    const { container } = renderStarRating({ rating: 7, max: 10 });
    expect(countStars(container, "full")).toBe(3);
    expect(countStars(container, "half")).toBe(1);
  });
});

describe("StarRating — numeric display", () => {
  it("shows numeric value for non-zero ratings", () => {
    renderStarRating({ rating: 4.5 });
    expect(screen.getByText("4.5")).toBeTruthy();
  });

  it("does NOT show numeric value for zero rating", () => {
    renderStarRating({ rating: 0 });
    expect(screen.queryByText("0.0")).toBeNull();
  });
});

describe("StarRating — sizes", () => {
  it("uses sm size by default (w-3.5 h-3.5)", () => {
    const { container } = renderStarRating({ rating: 3 });
    const svg = container.querySelector("svg");
    expect(getClass(svg!)).toContain("w-3.5");
    expect(getClass(svg!)).toContain("h-3.5");
  });

  it("uses md size when specified (w-5 h-5)", () => {
    const { container } = renderStarRating({ rating: 3, size: "md" });
    const svg = container.querySelector("svg");
    expect(getClass(svg!)).toContain("w-5");
    expect(getClass(svg!)).toContain("h-5");
  });
});

describe("StarRating — edge cases", () => {
  it("handles rating exactly 5 (no empty stars)", () => {
    const { container } = renderStarRating({ rating: 5 });
    expect(countStars(container, "full")).toBe(5);
    expect(countStars(container, "half")).toBe(0);
    expect(countStars(container, "empty")).toBe(0);
  });

  it("always renders exactly 5 star positions", () => {
    const { container } = renderStarRating({ rating: 2.5 });
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(5); // 2 full + 1 half + 2 empty
  });
});
