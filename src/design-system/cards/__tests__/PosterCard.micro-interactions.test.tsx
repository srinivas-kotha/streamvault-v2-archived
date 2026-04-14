/**
 * PosterCard micro-interaction unit tests (SRI-40)
 *
 * Covers the behavioral contract of the three key animations:
 *   1. Favorite pop — animate-favorite-pop class lifecycle
 *   2. prefers-reduced-motion — all animations suppressed when active
 *   3. Blur-up — opacity transition on image load
 *
 * These tests complement PosterCard.test.tsx (which covers rendering/a11y/
 * fallback). Mocking useReducedMotion at the module level lets us toggle
 * reduced-motion per test without touching window.matchMedia.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ── module-level mocks (must be before the component import) ──────────────────

const mockReducedMotion = vi.fn<[], boolean>(() => false);

vi.mock("@/shared/hooks/useReducedMotion", () => ({
  useReducedMotion: () => mockReducedMotion(),
}));

vi.mock("@/shared/utils/isTVMode", () => ({
  isTVMode: false,
}));

import { PosterCard, type PosterCardProps } from "../PosterCard";

// ── helpers ───────────────────────────────────────────────────────────────────

const base: PosterCardProps = {
  title: "Test Movie",
  imageUrl: "https://example.com/test.jpg",
};

beforeEach(() => {
  mockReducedMotion.mockReturnValue(false);
});

// ── 1. Favorite animation pop ─────────────────────────────────────────────────

describe("PosterCard — favorite pop animation", () => {
  it("applies animate-favorite-pop to the heart SVG when favorited (false → true)", () => {
    const { rerender, container } = render(
      <PosterCard {...base} isFavorite={false} onFavoriteToggle={vi.fn()} />,
    );
    rerender(
      <PosterCard {...base} isFavorite={true} onFavoriteToggle={vi.fn()} />,
    );

    // SVG className is SVGAnimatedString — use getAttribute('class') for string comparison
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toContain("animate-favorite-pop");
  });

  it("does NOT apply animate-favorite-pop on initial render with isFavorite=true (no toggle event)", () => {
    const { container } = render(
      <PosterCard {...base} isFavorite={true} onFavoriteToggle={vi.fn()} />,
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).not.toContain("animate-favorite-pop");
  });

  it("does NOT apply animate-favorite-pop when unfavoriting (true → false)", () => {
    const { rerender, container } = render(
      <PosterCard {...base} isFavorite={true} onFavoriteToggle={vi.fn()} />,
    );
    rerender(
      <PosterCard {...base} isFavorite={false} onFavoriteToggle={vi.fn()} />,
    );

    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).not.toContain("animate-favorite-pop");
  });

  it("removes animate-favorite-pop class after the animation ends (onAnimationEnd)", () => {
    const { rerender, container } = render(
      <PosterCard {...base} isFavorite={false} onFavoriteToggle={vi.fn()} />,
    );
    rerender(
      <PosterCard {...base} isFavorite={true} onFavoriteToggle={vi.fn()} />,
    );

    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("class")).toContain("animate-favorite-pop");

    // Simulate the CSS animation completing
    fireEvent.animationEnd(svg);

    expect(svg.getAttribute("class")).not.toContain("animate-favorite-pop");
  });

  it("does not render a favorite button when onFavoriteToggle is not provided", () => {
    render(<PosterCard {...base} />);
    expect(screen.queryByRole("button", { name: /favorite/i })).toBeNull();
  });
});

// ── 2. prefers-reduced-motion ─────────────────────────────────────────────────

describe("PosterCard — prefers-reduced-motion", () => {
  it("suppresses animate-favorite-pop when reduced motion is active", () => {
    mockReducedMotion.mockReturnValue(true);

    const { rerender, container } = render(
      <PosterCard {...base} isFavorite={false} onFavoriteToggle={vi.fn()} />,
    );
    rerender(
      <PosterCard {...base} isFavorite={true} onFavoriteToggle={vi.fn()} />,
    );

    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).not.toContain("animate-favorite-pop");
  });

  it("image is immediately visible at opacity-100 when reduced motion is active (no FOIC)", () => {
    mockReducedMotion.mockReturnValue(true);

    const { container } = render(<PosterCard {...base} />);
    const img = container.querySelector("img");

    expect(img?.className).toContain("opacity-100");
    expect(img?.className).not.toContain("opacity-0");
  });

  it("image does not have a transition-opacity class when reduced motion is active", () => {
    mockReducedMotion.mockReturnValue(true);

    const { container } = render(<PosterCard {...base} />);
    const img = container.querySelector("img");

    expect(img?.className).not.toContain("transition-opacity");
  });
});

// ── 3. Blur-up image transition ───────────────────────────────────────────────

describe("PosterCard — blur-up image loading", () => {
  it("image starts at opacity-0 before the load event fires", () => {
    const { container } = render(<PosterCard {...base} />);
    const img = container.querySelector("img");
    expect(img?.className).toContain("opacity-0");
  });

  it("includes transition-opacity class before load (smooth fade)", () => {
    const { container } = render(<PosterCard {...base} />);
    const img = container.querySelector("img");
    expect(img?.className).toContain("transition-opacity");
  });

  it("transitions to opacity-100 after the load event fires", () => {
    const { container } = render(<PosterCard {...base} />);
    const img = container.querySelector("img")!;

    fireEvent.load(img);

    expect(img.className).toContain("opacity-100");
    expect(img.className).not.toContain("opacity-0");
  });
});

// ── 4. Favorite button ARIA labels ───────────────────────────────────────────

describe("PosterCard — favorite button ARIA labels", () => {
  it('labels the button "Add to favorites" when isFavorite=false', () => {
    render(
      <PosterCard {...base} isFavorite={false} onFavoriteToggle={vi.fn()} />,
    );
    expect(
      screen.getByRole("button", { name: /add to favorites/i }),
    ).toBeTruthy();
  });

  it('labels the button "Remove from favorites" when isFavorite=true', () => {
    render(
      <PosterCard {...base} isFavorite={true} onFavoriteToggle={vi.fn()} />,
    );
    expect(
      screen.getByRole("button", { name: /remove from favorites/i }),
    ).toBeTruthy();
  });

  it("stops click propagation on the favorite button (prevents card onClick)", () => {
    const cardClick = vi.fn();
    const favClick = vi.fn();
    render(
      <PosterCard
        {...base}
        onClick={cardClick}
        isFavorite={false}
        onFavoriteToggle={favClick}
      />,
    );
    const btn = screen.getByRole("button", { name: /add to favorites/i });
    fireEvent.click(btn);

    expect(favClick).toHaveBeenCalledTimes(1);
    expect(cardClick).not.toHaveBeenCalled();
  });
});
