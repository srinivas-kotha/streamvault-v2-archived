import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MovieGrid, type MovieGridProps } from "../MovieGrid";

// ── mock isTVMode ──────────────────────────────────────────────────────────────

vi.mock("@/shared/utils/isTVMode", () => ({
  isTVMode: false,
}));

// ── mock VirtualGrid (useVirtualizer requires DOM layout unavailable in jsdom) ─

vi.mock("@shared/components/VirtualGrid", () => ({
  VirtualGrid: ({ items, renderItem }: any) => (
    <div data-testid="virtual-grid">
      {items.map((item: any, index: number) => (
        <div key={item.id ?? index}>{renderItem(item, index)}</div>
      ))}
    </div>
  ),
}));

// ── mock PosterCard ────────────────────────────────────────────────────────────

vi.mock("@/design-system/cards/PosterCard", () => ({
  PosterCard: ({ title, imageUrl, rating, year, onClick }: any) => (
    <div
      data-testid="poster-card"
      data-title={title}
      data-image-url={imageUrl}
      data-rating={rating}
      data-year={year}
      role="button"
      aria-label={title}
      onClick={onClick}
    >
      {title}
    </div>
  ),
}));

// ── mock EmptyState ───────────────────────────────────────────────────────────

vi.mock("@shared/components/EmptyState", () => ({
  EmptyState: ({ title }: any) => <div data-testid="empty-state">{title}</div>,
}));

// ── mock router ───────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

// ── mock data ─────────────────────────────────────────────────────────────────

const mockMovies = [
  {
    id: "101",
    name: "Inception",
    type: "vod" as const,
    categoryId: "1",
    icon: "https://img.example.com/inception.jpg",
    rating: "8.8",
    added: "1700000000",
    isAdult: false,
  },
  {
    id: "102",
    name: "The Dark Knight",
    type: "vod" as const,
    categoryId: "1",
    icon: "https://img.example.com/tdk.jpg",
    rating: "9.0",
    added: "1700000001",
    isAdult: false,
  },
  {
    id: "103",
    name: "Interstellar",
    type: "vod" as const,
    categoryId: "1",
    icon: "https://img.example.com/int.jpg",
    rating: "8.6",
    added: "1700000002",
    isAdult: false,
  },
];

// ── helpers ───────────────────────────────────────────────────────────────────

const defaultProps: MovieGridProps = {
  movies: mockMovies,
};

function renderGrid(overrides?: Partial<MovieGridProps>) {
  return render(<MovieGrid {...defaultProps} {...overrides} />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe("MovieGrid — rendering", () => {
  it("renders a PosterCard for each movie", () => {
    renderGrid();
    const cards = screen.getAllByTestId("poster-card");
    expect(cards.length).toBe(mockMovies.length);
  });

  it("passes title to PosterCard", () => {
    renderGrid();
    expect(screen.getByText("Inception")).toBeTruthy();
    expect(screen.getByText("The Dark Knight")).toBeTruthy();
    expect(screen.getByText("Interstellar")).toBeTruthy();
  });

  it("passes imageUrl to PosterCard", () => {
    renderGrid();
    const cards = screen.getAllByTestId("poster-card");
    expect(cards[0]!.getAttribute("data-image-url")).toBe(mockMovies[0]!.icon);
  });

  it("passes rating to PosterCard", () => {
    renderGrid();
    const cards = screen.getAllByTestId("poster-card");
    expect(cards[0]!.getAttribute("data-rating")).toBeTruthy();
  });
});

describe("MovieGrid — navigation", () => {
  it("clicking a card navigates to /vod/$vodId", () => {
    renderGrid();
    const firstCard = screen.getAllByTestId("poster-card")[0]!;
    fireEvent.click(firstCard);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/vod/$vodId",
      params: { vodId: mockMovies[0]!.id },
    });
  });

  it("clicking second card navigates with correct vodId", () => {
    renderGrid();
    const secondCard = screen.getAllByTestId("poster-card")[1]!;
    fireEvent.click(secondCard);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/vod/$vodId",
      params: { vodId: mockMovies[1]!.id },
    });
  });
});

describe("MovieGrid — empty state", () => {
  it("renders empty state when no movies provided", () => {
    renderGrid({ movies: [] });
    expect(screen.getByTestId("empty-state")).toBeTruthy();
  });
});

describe("MovieGrid — React.memo", () => {
  it("is exported as a named component", () => {
    expect(MovieGrid).toBeTruthy();
  });
});
