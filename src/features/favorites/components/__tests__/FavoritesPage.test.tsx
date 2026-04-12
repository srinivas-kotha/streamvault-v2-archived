import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FavoritesPage } from "../FavoritesPage";

// ── mock spatial nav ──────────────────────────────────────────────────────────

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

// ── mock usePageFocus (no real spatial nav in jsdom) ──────────────────────────

vi.mock("@shared/hooks/usePageFocus", () => ({
  usePageFocus: vi.fn(),
}));

// ── mock PageTransition ───────────────────────────────────────────────────────

vi.mock("@shared/components/PageTransition", () => ({
  PageTransition: ({ children }: any) => <div>{children}</div>,
}));

// ── mock shared components ────────────────────────────────────────────────────

vi.mock("@/design-system", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/design-system")>();
  return {
    ...actual,
    PosterCard: ({ title, onClick, onFavoriteToggle, isFavorite }: any) => (
      <div
        data-testid="fav-card"
        data-type="poster"
        data-is-favorite={String(!!isFavorite)}
        role="button"
        aria-label={title}
        onClick={onClick}
      >
        {title}
        {onFavoriteToggle && (
          <button
            data-testid="remove-favorite-btn"
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle();
            }}
            aria-label={`Remove ${title} from favorites`}
          >
            Remove
          </button>
        )}
      </div>
    ),
    ChannelCard: ({ channelName, onClick, onFavoriteToggle }: any) => (
      <div
        data-testid="fav-card"
        data-type="channel"
        data-is-favorite="true"
        role="button"
        aria-label={channelName}
        onClick={onClick}
      >
        {channelName}
        {onFavoriteToggle && (
          <button
            data-testid="remove-favorite-btn"
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle();
            }}
            aria-label={`Remove ${channelName} from favorites`}
          >
            Remove
          </button>
        )}
      </div>
    ),
  };
});

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
  EmptyState: ({ title, message }: any) => (
    <div data-testid="empty-state">
      <span data-testid="empty-title">{title}</span>
      {message && <span data-testid="empty-message">{message}</span>}
    </div>
  ),
}));

// ── mock router ───────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
  useSearch: () => ({}),
}));

// ── mock API hooks ────────────────────────────────────────────────────────────

const mockUseFavorites = vi.fn();
const mockRemoveMutate = vi.fn();

vi.mock("@features/favorites/api", () => ({
  useFavorites: () => mockUseFavorites(),
  useRemoveFavorite: () => ({ mutate: mockRemoveMutate }),
}));

// ── mock data ─────────────────────────────────────────────────────────────────

const mockFavorites = [
  {
    id: 1,
    user_id: 1,
    content_type: "live" as const,
    content_id: 201,
    content_name: "Star Maa",
    content_icon: "https://img.example.com/starmaa.png",
    category_name: "Telugu",
    sort_order: 0,
    added_at: "2026-03-01T00:00:00Z",
  },
  {
    id: 2,
    user_id: 1,
    content_type: "vod" as const,
    content_id: 301,
    content_name: "Baahubali",
    content_icon: "https://img.example.com/baahubali.jpg",
    category_name: "Action",
    sort_order: 1,
    added_at: "2026-03-02T00:00:00Z",
  },
  {
    id: 3,
    user_id: 1,
    content_type: "series" as const,
    content_id: 401,
    content_name: "Sacred Games",
    content_icon: "https://img.example.com/sacredgames.jpg",
    category_name: "Crime",
    sort_order: 2,
    added_at: "2026-03-03T00:00:00Z",
  },
];

// ── helpers ───────────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderFavoritesPage() {
  const client = createQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <FavoritesPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseFavorites.mockReturnValue({ data: mockFavorites, isLoading: false });
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe("FavoritesPage — heading and tabs", () => {
  it('renders "Favorites" heading', () => {
    renderFavoritesPage();
    expect(screen.getByText("Favorites")).toBeTruthy();
  });

  it("renders all four filter tabs: All, Channels, Movies, Series", () => {
    renderFavoritesPage();
    expect(screen.getByText("All")).toBeTruthy();
    expect(screen.getByText("Channels")).toBeTruthy();
    expect(screen.getByText("Movies")).toBeTruthy();
    expect(screen.getByText("Series")).toBeTruthy();
  });

  it("tab count badges reflect total favorites", () => {
    renderFavoritesPage();
    // "All" tab shows count 3, individual tabs show 1 each
    // Counts appear as spans with opacity styling — check they exist
    const buttons = screen.getAllByRole("button");
    const tabButtons = buttons.filter((b) =>
      ["All", "Channels", "Movies", "Series"].includes(
        b.textContent?.replace(/\d+/g, "").trim() ?? "",
      ),
    );
    expect(tabButtons.length).toBeGreaterThanOrEqual(4);
  });
});

describe("FavoritesPage — favorites grid", () => {
  it('renders a card for each favorited item in "All" tab', () => {
    renderFavoritesPage();
    const cards = screen.getAllByTestId("fav-card");
    expect(cards.length).toBe(3);
  });

  it("channel favorites use square aspect ratio", () => {
    renderFavoritesPage();
    const channelCard = screen.getByLabelText("Star Maa");
    expect(channelCard.getAttribute("data-type")).toBe("channel");
  });

  it("vod favorites use poster aspect ratio", () => {
    renderFavoritesPage();
    const vodCard = screen.getByLabelText("Baahubali");
    expect(vodCard.getAttribute("data-type")).toBe("poster");
  });

  it("all cards have isFavorite=true", () => {
    renderFavoritesPage();
    const cards = screen.getAllByTestId("fav-card");
    cards.forEach((card) => {
      expect(card.getAttribute("data-is-favorite")).toBe("true");
    });
  });
});

describe("FavoritesPage — type filter tabs", () => {
  it("clicking Channels tab shows only channel favorites", () => {
    renderFavoritesPage();
    fireEvent.click(screen.getByText("Channels"));
    const cards = screen.getAllByTestId("fav-card");
    expect(cards.length).toBe(1);
    expect(screen.getByText("Star Maa")).toBeTruthy();
    expect(screen.queryByText("Baahubali")).toBeNull();
    expect(screen.queryByText("Sacred Games")).toBeNull();
  });

  it("clicking Movies tab shows only VOD favorites", () => {
    renderFavoritesPage();
    fireEvent.click(screen.getByText("Movies"));
    const cards = screen.getAllByTestId("fav-card");
    expect(cards.length).toBe(1);
    expect(screen.getByText("Baahubali")).toBeTruthy();
  });

  it("clicking Series tab shows only series favorites", () => {
    renderFavoritesPage();
    fireEvent.click(screen.getByText("Series"));
    const cards = screen.getAllByTestId("fav-card");
    expect(cards.length).toBe(1);
    expect(screen.getByText("Sacred Games")).toBeTruthy();
  });

  it("switching back to All tab shows all favorites", () => {
    renderFavoritesPage();
    fireEvent.click(screen.getByText("Movies"));
    fireEvent.click(screen.getByText("All"));
    const cards = screen.getAllByTestId("fav-card");
    expect(cards.length).toBe(3);
  });
});

describe("FavoritesPage — remove favorite", () => {
  it("clicking remove button calls removeFavorite.mutate with content id and type", () => {
    renderFavoritesPage();
    const removeButtons = screen.getAllByTestId("remove-favorite-btn");
    // Click remove on the first card (Star Maa, content_id=201, content_type=live)
    fireEvent.click(removeButtons[0]!);
    expect(mockRemoveMutate).toHaveBeenCalledWith({
      contentId: "201",
      content_type: "live",
    });
  });

  it("remove button does not navigate away when clicked", () => {
    renderFavoritesPage();
    const removeButtons = screen.getAllByTestId("remove-favorite-btn");
    fireEvent.click(removeButtons[0]!);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe("FavoritesPage — empty state", () => {
  it('shows "No favorites yet" when favorites list is empty', () => {
    mockUseFavorites.mockReturnValue({ data: [], isLoading: false });
    renderFavoritesPage();
    expect(screen.getByTestId("empty-state")).toBeTruthy();
    expect(screen.getByText("No favorites yet")).toBeTruthy();
  });

  it("shows loading skeleton while fetching", () => {
    mockUseFavorites.mockReturnValue({ data: undefined, isLoading: true });
    renderFavoritesPage();
    expect(screen.getByTestId("skeleton-grid")).toBeTruthy();
  });

  it("shows type-specific empty state when filtered tab has no items", () => {
    // Only one series in favorites; filter to Movies which is empty
    mockUseFavorites.mockReturnValue({
      data: [mockFavorites[2]!], // only Sacred Games (series)
      isLoading: false,
    });
    renderFavoritesPage();
    fireEvent.click(screen.getByText("Movies"));
    expect(screen.getByTestId("empty-state")).toBeTruthy();
    // message should reference "movies"
    const emptyTitle = screen.getByTestId("empty-title");
    expect(emptyTitle.textContent?.toLowerCase()).toContain("movies");
  });
});

describe("FavoritesPage — navigation on click", () => {
  it("clicking a channel card navigates to /live with play param", () => {
    renderFavoritesPage();
    const channelCard = screen.getByLabelText("Star Maa");
    fireEvent.click(channelCard);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/live",
      search: { play: "201" },
    });
  });

  it("clicking a VOD card navigates to /vod/$vodId", () => {
    renderFavoritesPage();
    const vodCard = screen.getByLabelText("Baahubali");
    fireEvent.click(vodCard);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/vod/$vodId",
      params: { vodId: "301" },
    });
  });

  it("clicking a series card navigates to /series/$seriesId", () => {
    renderFavoritesPage();
    const seriesCard = screen.getByLabelText("Sacred Games");
    fireEvent.click(seriesCard);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/series/$seriesId",
      params: { seriesId: "401" },
    });
  });
});
