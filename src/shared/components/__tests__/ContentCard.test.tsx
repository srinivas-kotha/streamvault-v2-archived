import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ContentCard } from "../ContentCard";

// ── mock spatial nav ──────────────────────────────────────────────────────────

vi.mock("@shared/hooks/useSpatialNav", () => ({
  useSpatialFocusable: (opts: any) => ({
    ref: { current: null },
    showFocusRing: false,
    focused: false,
    focusProps: { "data-focus-key": opts?.focusKey ?? "test" },
  }),
  useSpatialContainer: () => ({ ref: { current: null }, focusKey: "test-key" }),
  FocusContext: { Provider: ({ children }: any) => children },
}));

// ── mock LazyImage ──────────────────────────────────────────────────────────

vi.mock("../LazyImage", () => ({
  LazyImage: ({ src, alt, priority }: any) => (
    <img src={src} alt={alt} data-priority={priority} />
  ),
}));

// ── helpers ───────────────────────────────────────────────────────────────────

const defaultProps = {
  image: "https://example.com/poster.jpg",
  title: "Test Movie",
};

function renderContentCard(
  props?: Partial<React.ComponentProps<typeof ContentCard>>,
) {
  return render(<ContentCard {...defaultProps} {...props} />);
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("ContentCard — basic rendering", () => {
  it("renders the title", () => {
    renderContentCard();
    expect(screen.getByText("Test Movie")).toBeTruthy();
  });

  it("renders the image via LazyImage", () => {
    renderContentCard();
    expect(screen.getByAltText("Test Movie")).toBeTruthy();
  });

  it("renders subtitle when provided", () => {
    renderContentCard({ subtitle: "Action | 2024" });
    expect(screen.getByText("Action | 2024")).toBeTruthy();
  });

  it("does not render subtitle when not provided", () => {
    const { container } = renderContentCard();
    const subtitle = container.querySelector(".text-text-muted.mt-0\\.5");
    expect(subtitle).toBeNull();
  });
});

describe("ContentCard — aspect ratios", () => {
  it("uses poster aspect ratio by default", () => {
    const { container } = renderContentCard();
    expect(container.querySelector(".aspect-\\[2\\/3\\]")).not.toBeNull();
  });

  it("uses landscape aspect ratio", () => {
    const { container } = renderContentCard({ aspectRatio: "landscape" });
    expect(container.querySelector(".aspect-video")).not.toBeNull();
  });

  it("uses square aspect ratio", () => {
    const { container } = renderContentCard({ aspectRatio: "square" });
    expect(container.querySelector(".aspect-square")).not.toBeNull();
  });
});

describe("ContentCard — click handler", () => {
  it("calls onClick when card is clicked", () => {
    const onClick = vi.fn();
    renderContentCard({ onClick });
    fireEvent.click(screen.getByText("Test Movie"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe("ContentCard — badge", () => {
  it("renders badge when provided", () => {
    renderContentCard({ badge: <span data-testid="badge">NEW</span> });
    expect(screen.getByTestId("badge")).toBeTruthy();
  });

  it("does not render badge area when not provided", () => {
    const { container } = renderContentCard();
    expect(container.querySelector('[data-testid="badge"]')).toBeNull();
  });
});

describe("ContentCard — progress bar", () => {
  it("renders progress bar when progress > 0", () => {
    const { container } = renderContentCard({ progress: 50 });
    const progressBar = container.querySelector('[style*="width: 50%"]');
    expect(progressBar).not.toBeNull();
  });

  it("does not render progress bar when progress is 0", () => {
    const { container } = renderContentCard({ progress: 0 });
    const progressBar = container.querySelector(".bg-teal.rounded-full");
    expect(progressBar).toBeNull();
  });

  it("caps progress at 100%", () => {
    const { container } = renderContentCard({ progress: 150 });
    const progressBar = container.querySelector('[style*="width: 100%"]');
    expect(progressBar).not.toBeNull();
  });
});

describe("ContentCard — favorite button", () => {
  it("renders favorite button when onFavoriteToggle is provided", () => {
    renderContentCard({ onFavoriteToggle: vi.fn() });
    expect(screen.getByLabelText("Add to favorites")).toBeTruthy();
  });

  it('shows "Remove from favorites" when isFavorite is true', () => {
    renderContentCard({ onFavoriteToggle: vi.fn(), isFavorite: true });
    expect(screen.getByLabelText("Remove from favorites")).toBeTruthy();
  });

  it("calls onFavoriteToggle when favorite button is clicked", () => {
    const toggle = vi.fn();
    renderContentCard({ onFavoriteToggle: toggle });
    fireEvent.click(screen.getByLabelText("Add to favorites"));
    expect(toggle).toHaveBeenCalledOnce();
  });

  it("does not render favorite button without onFavoriteToggle", () => {
    renderContentCard();
    expect(screen.queryByLabelText("Add to favorites")).toBeNull();
    expect(screen.queryByLabelText("Remove from favorites")).toBeNull();
  });
});

describe("ContentCard — remove button", () => {
  it("renders remove button when onRemove is provided", () => {
    renderContentCard({ onRemove: vi.fn() });
    expect(screen.getByLabelText("Remove")).toBeTruthy();
  });

  it("calls onRemove when remove button is clicked", () => {
    const remove = vi.fn();
    renderContentCard({ onRemove: remove });
    fireEvent.click(screen.getByLabelText("Remove"));
    expect(remove).toHaveBeenCalledOnce();
  });
});

describe("ContentCard — priority image", () => {
  it("passes priority prop to LazyImage", () => {
    renderContentCard({ priority: true });
    const img = screen.getByAltText("Test Movie");
    expect(img.getAttribute("data-priority")).toBe("true");
  });
});
