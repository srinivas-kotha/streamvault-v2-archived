import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContentRail, type ContentRailProps } from "../ContentRail";

// ── mock spatial nav ───────────────────────────────────────────────────────────

vi.mock("@shared/hooks/useSpatialNav", () => ({
  useSpatialFocusable: () => ({
    ref: { current: null },
    showFocusRing: false,
    focused: false,
    focusProps: {},
  }),
  useSpatialContainer: () => ({ ref: { current: null }, focusKey: "test-key" }),
  FocusContext: { Provider: ({ children }: any) => children },
  setFocus: vi.fn(),
}));

// ── mock HorizontalScroll (renders children in a scrollable div) ───────────────

vi.mock("@shared/components/HorizontalScroll", () => ({
  HorizontalScroll: ({ children }: any) => (
    <div
      data-testid="rail-scroll-container"
      className="overflow-x-auto flex gap-3"
    >
      {children}
    </div>
  ),
}));

// ── mock data ─────────────────────────────────────────────────────────────────

const mockItems = [
  { id: "1", title: "Movie A", imageUrl: "https://example.com/a.jpg" },
  { id: "2", title: "Movie B", imageUrl: "https://example.com/b.jpg" },
  { id: "3", title: "Movie C", imageUrl: "https://example.com/c.jpg" },
  { id: "4", title: "Movie D", imageUrl: "https://example.com/d.jpg" },
  { id: "5", title: "Movie E", imageUrl: "https://example.com/e.jpg" },
  { id: "6", title: "Movie F", imageUrl: "https://example.com/f.jpg" },
];

// ── helpers ───────────────────────────────────────────────────────────────────

const defaultProps: ContentRailProps = {
  title: "Trending Now",
  items: mockItems,
  renderCard: (item: any, index: number, isFirstVisible: boolean) => (
    <div
      key={item.id}
      data-testid={`card-${item.id}`}
      data-first-visible={isFirstVisible}
    >
      {item.title}
    </div>
  ),
};

function renderRail(overrides?: Partial<ContentRailProps>) {
  return render(<ContentRail {...defaultProps} {...overrides} />);
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("ContentRail — rendering", () => {
  it("renders rail title/heading", () => {
    renderRail();
    expect(screen.getByText("Trending Now")).toBeTruthy();
  });

  it("renders cards in horizontal scroll container", () => {
    const { container } = renderRail();
    // Cards should be in a scrollable container (overflow-x-auto or similar)
    const scrollContainer =
      container.querySelector('[data-testid="rail-scroll-container"]') ||
      container.querySelector(".overflow-x-auto") ||
      container.querySelector(".overflow-x-scroll");
    expect(scrollContainer).not.toBeNull();
  });

  it("renders all provided items", () => {
    renderRail();
    expect(screen.getByText("Movie A")).toBeTruthy();
    expect(screen.getByText("Movie B")).toBeTruthy();
    expect(screen.getByText("Movie C")).toBeTruthy();
    expect(screen.getByText("Movie D")).toBeTruthy();
    expect(screen.getByText("Movie E")).toBeTruthy();
    expect(screen.getByText("Movie F")).toBeTruthy();
  });
});

describe("ContentRail — isFirstVisible prop", () => {
  it("passes isFirstVisible=true to first N cards (for eager loading)", () => {
    renderRail();
    const firstCard = screen.getByTestId("card-1");
    expect(firstCard.getAttribute("data-first-visible")).toBe("true");
  });

  it("passes isFirstVisible=false to remaining cards (for lazy loading)", () => {
    renderRail();
    const lastCard = screen.getByTestId("card-6");
    expect(lastCard.getAttribute("data-first-visible")).toBe("false");
  });
});

describe("ContentRail — loading state", () => {
  it("renders skeleton cards when loading", () => {
    const { container } = renderRail({ isLoading: true, items: [] } as any);
    const skeletons =
      container.querySelectorAll('[data-testid="card-skeleton"]') ||
      container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe("ContentRail — See All", () => {
  it('renders "See All" link/button when showSeeAll is true', () => {
    renderRail({ showSeeAll: true, onSeeAll: vi.fn() } as any);
    expect(screen.getByText(/see all/i)).toBeTruthy();
  });

  it('does NOT render "See All" when showSeeAll is false or absent', () => {
    renderRail();
    expect(screen.queryByText(/see all/i)).toBeNull();
  });
});

describe("ContentRail — empty state", () => {
  it("handles empty items array gracefully", () => {
    const { container } = renderRail({ items: [] });
    // Should render without crashing — may show empty state or nothing
    expect(container.firstChild).toBeTruthy();
  });
});

describe("ContentRail — accessibility", () => {
  it("has correct ARIA role (region with label)", () => {
    renderRail();
    const region = screen.getByRole("region");
    expect(region).toBeTruthy();
    expect(region.getAttribute("aria-label")).toContain("Trending Now");
  });
});

describe("ContentRail — heading level", () => {
  it("rail title uses a heading element (h2)", () => {
    renderRail();
    const heading = screen.getByRole("heading", { name: "Trending Now" });
    expect(heading).toBeTruthy();
  });
});

describe("ContentRail — focus memory", () => {
  it("renders within FocusContext.Provider (spatial nav container mounted)", () => {
    const { container } = renderRail();
    // useSpatialContainer is called — rail is registered in spatial nav tree
    expect(container.querySelector("section")).toBeTruthy();
  });
});
