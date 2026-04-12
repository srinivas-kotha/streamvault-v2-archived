import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VODPage } from "../VODPage";

// ── mock spatial nav (no DOM layout available in jsdom) ───────────────────────

vi.mock("@shared/hooks/useSpatialNav", () => ({
  useSpatialFocusable: () => ({
    ref: { current: null },
    showFocusRing: false,
    focusProps: {},
  }),
  useSpatialContainer: () => ({ ref: { current: null }, focusKey: "test-key" }),
  FocusContext: { Provider: ({ children }: any) => children },
  setFocus: vi.fn(),
}));

// ── mock PageTransition (no animation in tests) ───────────────────────────────

vi.mock("@shared/components/PageTransition", () => ({
  PageTransition: ({ children }: any) => <div>{children}</div>,
}));

// ── mock shared components ────────────────────────────────────────────────────

vi.mock("@shared/components/CategoryGrid", () => ({
  CategoryGrid: ({ categories, onSelect }: any) => (
    <div data-testid="category-grid">
      {categories.map((cat: any) => (
        <button
          key={cat.id}
          data-testid={`category-${cat.id}`}
          onClick={() => onSelect(cat.id)}
        >
          {cat.name}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("@shared/components/Skeleton", () => ({
  SkeletonGrid: ({ count }: any) => (
    <div data-testid="skeleton-grid">
      {Array.from({ length: count }).map((_: any, i: number) => (
        <div key={i} className="animate-pulse" data-testid="card-skeleton" />
      ))}
    </div>
  ),
}));

vi.mock("@shared/components/EmptyState", () => ({
  EmptyState: ({ title }: any) => <div data-testid="empty-state">{title}</div>,
}));

vi.mock("@shared/components/Badge", () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

vi.mock("@/design-system", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/design-system")>();
  return {
    ...actual,
    PosterCard: ({ title, onClick }: any) => (
      <div
        data-testid="content-card"
        role="button"
        aria-label={title}
        onClick={onClick}
      >
        {title}
      </div>
    ),
  };
});

vi.mock("@features/vod/components/SortFilterBar", () => ({
  SortFilterBar: ({ sort, onSortChange }: any) => (
    <div data-testid="sort-filter-bar">
      <button
        data-testid="sort-alphabetical"
        onClick={() =>
          onSortChange({ field: "name", direction: "asc", label: "A-Z" })
        }
      >
        A-Z
      </button>
      <button
        data-testid="sort-rating"
        onClick={() =>
          onSortChange({
            field: "rating_5based",
            direction: "desc",
            label: "Rating",
          })
        }
      >
        Rating
      </button>
    </div>
  ),
}));

// ── mock utilities ────────────────────────────────────────────────────────────

vi.mock("@shared/utils/sortContent", () => ({
  SORT_OPTIONS: [
    { field: "name", direction: "asc", label: "A-Z" },
    { field: "rating_5based", direction: "desc", label: "Rating" },
    { field: "added", direction: "desc", label: "Date Added" },
  ],
  sortContent: (items: any[]) => items,
}));

vi.mock("@shared/utils/filterContent", () => ({
  DEFAULT_FILTERS: { genre: "", year: "", rating: "" },
  filterContent: (items: any[]) => items,
}));

vi.mock("@shared/utils/parseGenres", () => ({
  collectAllGenres: () => [],
  parseGenres: (s: string) =>
    s ? s.split(",").map((g: string) => g.trim()) : [],
}));

vi.mock("@shared/hooks/useDebounce", () => ({
  useDebounce: (v: any) => v,
}));

// ── mock router ───────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
}));

// ── mock API hooks ─────────────────────────────────────────────────────────────

const mockUseVODCategories = vi.fn();
const mockUseVODStreams = vi.fn();

vi.mock("@features/vod/api", () => ({
  useVODCategories: () => mockUseVODCategories(),
  useVODStreams: (catId: string) => mockUseVODStreams(catId),
}));

// ── mock data ─────────────────────────────────────────────────────────────────

const mockCategories = [
  { id: "1", name: "Action", parentId: null, type: "vod" as const },
  { id: "2", name: "Drama", parentId: null, type: "vod" as const },
  { id: "3", name: "Comedy", parentId: null, type: "vod" as const },
];

const mockStreams = [
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

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderVODPage() {
  const client = createQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <VODPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseVODCategories.mockReturnValue({
    data: mockCategories,
    isLoading: false,
  });
  mockUseVODStreams.mockReturnValue({ data: mockStreams, isLoading: false });
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe("VODPage — page heading", () => {
  it('renders a "Movies" page heading', () => {
    renderVODPage();
    expect(screen.getByText("Movies")).toBeTruthy();
  });
});

describe("VODPage — category list", () => {
  it("renders category list from useVODCategories", () => {
    renderVODPage();
    expect(screen.getByText("Action")).toBeTruthy();
    expect(screen.getByText("Drama")).toBeTruthy();
    expect(screen.getByText("Comedy")).toBeTruthy();
  });

  it("renders category loading skeleton while categories are loading", () => {
    mockUseVODCategories.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderVODPage();
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).not.toBeNull();
  });

  it("selecting a category triggers useVODStreams with that categoryId", () => {
    renderVODPage();
    const dramaBtn = screen.getByTestId("category-2");
    fireEvent.click(dramaBtn);
    // After selecting category 2, streams hook should be called with '2'
    expect(mockUseVODStreams).toHaveBeenCalledWith("2");
  });
});

describe("VODPage — streams grid", () => {
  it("renders a content card for each stream", () => {
    renderVODPage();
    const cards = screen.getAllByTestId("content-card");
    expect(cards.length).toBe(mockStreams.length);
  });

  it("renders loading skeleton while streams are loading", () => {
    mockUseVODStreams.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderVODPage();
    const skeletonGrid = screen.getByTestId("skeleton-grid");
    expect(skeletonGrid).toBeTruthy();
  });

  it("shows empty state when no streams in category", () => {
    mockUseVODStreams.mockReturnValue({ data: [], isLoading: false });
    renderVODPage();
    expect(screen.getByTestId("empty-state")).toBeTruthy();
    expect(screen.getByText("No movies found")).toBeTruthy();
  });

  it("clicking a movie card navigates to /vod/$vodId", () => {
    renderVODPage();
    const firstCard = screen.getAllByTestId("content-card")[0]!;
    fireEvent.click(firstCard);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/vod/$vodId",
      params: { vodId: mockStreams[0]!.id },
    });
  });
});

describe("VODPage — sort options", () => {
  it("renders sort/filter bar", () => {
    renderVODPage();
    expect(screen.getByTestId("sort-filter-bar")).toBeTruthy();
  });
});
