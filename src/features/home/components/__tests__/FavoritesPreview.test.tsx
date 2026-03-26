import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePlayerStore } from "@lib/store";
import { FavoritesPreview } from "../FavoritesPreview";

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

// ── mock ContentCard ──────────────────────────────────────────────────────────

vi.mock("@shared/components/ContentCard", () => ({
  ContentCard: ({ title, onClick }: any) => (
    <div data-testid="favorite-card" onClick={onClick}>
      {title}
    </div>
  ),
}));

// ── mock router ───────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

// ── mock API hook ─────────────────────────────────────────────────────────────

const mockUseFavorites = vi.fn();
vi.mock("../../api", () => ({
  useFavorites: () => mockUseFavorites(),
}));

// ── mock data ─────────────────────────────────────────────────────────────────

const makeFavorite = (
  id: number,
  contentType: "live" | "vod" | "series",
  name: string,
) => ({
  id,
  user_id: 1,
  content_type: contentType,
  content_id: id * 100,
  content_name: name,
  content_icon: `https://img.example.com/${id}.jpg`,
  category_name: "Test Category",
  sort_order: id,
  added_at: "2026-03-20T00:00:00Z",
});

const mockFavorites = [
  makeFavorite(1, "vod", "Movie One"),
  makeFavorite(2, "series", "Series Two"),
  makeFavorite(3, "live", "Channel Three"),
  makeFavorite(4, "vod", "Movie Four"),
  makeFavorite(5, "series", "Series Five"),
  makeFavorite(6, "vod", "Movie Six"),
  makeFavorite(7, "vod", "Movie Seven"),
  makeFavorite(8, "live", "Channel Eight"),
];

// ── helpers ───────────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderFavoritesPreview() {
  const client = createQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <FavoritesPreview />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseFavorites.mockReturnValue({ data: mockFavorites, isLoading: false });

  usePlayerStore.setState({
    currentStreamId: null,
    currentStreamType: null,
    currentStreamName: null,
    startTime: 0,
    volume: 1,
    isMuted: false,
    seriesId: null,
    seasonNumber: null,
    episodeIndex: null,
    episodeList: [],
  });
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe("FavoritesPreview — rendering", () => {
  it('renders "Favorites" heading', () => {
    renderFavoritesPreview();
    expect(screen.getByText("Favorites")).toBeTruthy();
  });

  it('renders "View All" button', () => {
    renderFavoritesPreview();
    expect(screen.getByText("View All")).toBeTruthy();
  });

  it("renders favorite cards", () => {
    renderFavoritesPreview();
    const cards = screen.getAllByTestId("favorite-card");
    expect(cards.length).toBeGreaterThan(0);
  });
});

describe("FavoritesPreview — 6-item limit", () => {
  it("shows at most 6 favorite items", () => {
    renderFavoritesPreview();
    const cards = screen.getAllByTestId("favorite-card");
    expect(cards.length).toBe(6);
  });

  it("does not render the 7th or 8th favorites", () => {
    renderFavoritesPreview();
    expect(screen.queryByText("Movie Seven")).toBeNull();
    expect(screen.queryByText("Channel Eight")).toBeNull();
  });
});

describe("FavoritesPreview — null on empty/loading", () => {
  it("returns null when loading", () => {
    mockUseFavorites.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderFavoritesPreview();
    expect(container.innerHTML).toBe("");
  });

  it("returns null when favorites list is empty", () => {
    mockUseFavorites.mockReturnValue({ data: [], isLoading: false });
    const { container } = renderFavoritesPreview();
    expect(container.innerHTML).toBe("");
  });
});

describe("FavoritesPreview — navigation by content type", () => {
  it("navigates to /vod/$vodId for VOD favorites", () => {
    renderFavoritesPreview();
    const movieCard = screen.getByText("Movie One");
    fireEvent.click(movieCard);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/vod/$vodId",
      params: { vodId: "100" },
    });
  });

  it("navigates to /series/$seriesId for series favorites", () => {
    renderFavoritesPreview();
    const seriesCard = screen.getByText("Series Two");
    fireEvent.click(seriesCard);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/series/$seriesId",
      params: { seriesId: "200" },
    });
  });

  it("plays stream and navigates to /player for live favorites", () => {
    renderFavoritesPreview();
    const liveCard = screen.getByText("Channel Three");
    fireEvent.click(liveCard);
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/player" as string });
    const playerState = usePlayerStore.getState();
    expect(playerState.currentStreamId).toBe("300");
    expect(playerState.currentStreamType).toBe("live");
  });
});
