import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePlayerStore } from "@lib/store";
import { SearchPage } from "../SearchPage";

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

// ── mock PageTransition ───────────────────────────────────────────────────────

vi.mock("@shared/components/PageTransition", () => ({
  PageTransition: ({ children }: any) => <div>{children}</div>,
}));

// ── mock shared components ────────────────────────────────────────────────────

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
    ChannelCard: ({ channelName, onClick }: any) => (
      <div
        data-testid="content-card"
        role="button"
        aria-label={channelName}
        onClick={onClick}
      >
        {channelName}
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

// ── mock debounce ─────────────────────────────────────────────────────────────

vi.mock("@shared/hooks/useDebounce", () => ({
  useDebounce: (v: any, _delay?: number) => v,
}));

// ── mock category utilities ───────────────────────────────────────────────────

vi.mock("@shared/utils/categoryParser", () => ({
  getDetectedLanguages: () => [],
  getLiveCategoriesForLanguage: () => [],
  getMovieCategoriesForLanguage: () => [],
  getSeriesCategoriesForLanguage: () => [],
}));

// ── mock router ───────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
  useSearch: () => ({}),
}));

// ── mock API hooks ────────────────────────────────────────────────────────────

const mockUseSearch = vi.fn();
const mockUseLiveCategories = vi.fn();
const mockUseVODCategories = vi.fn();
const mockUseSeriesCategories = vi.fn();

vi.mock("@features/search/api", () => ({
  useSearch: (query: string) => mockUseSearch(query),
}));

vi.mock("@features/live/api", () => ({
  useLiveCategories: () => mockUseLiveCategories(),
}));

vi.mock("@features/vod/api", () => ({
  useVODCategories: () => mockUseVODCategories(),
}));

vi.mock("@features/series/api", () => ({
  useSeriesCategories: () => mockUseSeriesCategories(),
}));

// ── mock data ─────────────────────────────────────────────────────────────────

const mockLiveResults = [
  {
    id: "201",
    name: "Star Maa",
    type: "live" as const,
    categoryId: "10",
    icon: "https://img.example.com/starmaa.png",
    added: "1700000000",
    isAdult: false,
  },
];

const mockVODResults = [
  {
    id: "301",
    name: "Baahubali",
    type: "vod" as const,
    categoryId: "20",
    icon: "https://img.example.com/baahubali.jpg",
    rating: "8.5",
    added: "1700000000",
    isAdult: false,
  },
];

const mockSeriesResults = [
  {
    id: "401",
    name: "Sacred Games",
    type: "series" as const,
    categoryId: "30",
    icon: "https://img.example.com/sacredgames.jpg",
    genre: "Crime, Thriller",
    year: "2018",
    rating: "8.7",
    added: "1700000000",
    isAdult: false,
  },
];

const mockSearchResults = {
  live: mockLiveResults,
  vod: mockVODResults,
  series: mockSeriesResults,
};

// ── helpers ───────────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderSearchPage() {
  const client = createQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <SearchPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no query, no results
  mockUseSearch.mockReturnValue({
    data: undefined,
    isLoading: false,
    isFetching: false,
  });
  mockUseLiveCategories.mockReturnValue({ data: [] });
  mockUseVODCategories.mockReturnValue({ data: [] });
  mockUseSeriesCategories.mockReturnValue({ data: [] });

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

describe("SearchPage — search input", () => {
  it("renders search input with correct placeholder", () => {
    renderSearchPage();
    expect(
      screen.getByPlaceholderText("Search live TV, movies, series..."),
    ).toBeTruthy();
  });

  it("shows prompt empty state before any query is entered", () => {
    renderSearchPage();
    const emptyState = screen.getByTestId("empty-state");
    expect(emptyState).toBeTruthy();
    expect(screen.getByText("Search StreamVault")).toBeTruthy();
  });

  it("shows loading skeleton grid while searching", () => {
    mockUseSearch.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
    });
    renderSearchPage();
    const input = screen.getByPlaceholderText(
      "Search live TV, movies, series...",
    );
    fireEvent.change(input, { target: { value: "ba" } }); // 2+ chars triggers search display
    expect(screen.getByTestId("skeleton-grid")).toBeTruthy();
  });

  it("typing fewer than 2 characters does not show results or tabs", () => {
    renderSearchPage();
    const input = screen.getByPlaceholderText(
      "Search live TV, movies, series...",
    );
    fireEvent.change(input, { target: { value: "a" } }); // only 1 char
    // Tabs and results should NOT appear
    expect(screen.queryByText("All")).toBeNull();
    expect(screen.queryByTestId("content-card")).toBeNull();
  });

  it("shows clear button when query is non-empty", () => {
    renderSearchPage();
    const input = screen.getByPlaceholderText(
      "Search live TV, movies, series...",
    );
    fireEvent.change(input, { target: { value: "star" } });
    const clearBtn = screen.getByLabelText("Clear search");
    expect(clearBtn).toBeTruthy();
  });
});

// Helper: find a tab button by its visible label text using role
function getTabButton(label: string) {
  // Tabs render as <button> elements; match by accessible name (includes count span text).
  // Use getAllByRole to handle count span children gracefully.
  const buttons = screen.getAllByRole("button");
  const match = buttons.find((b) => b.textContent?.startsWith(label));
  if (!match) throw new Error(`Tab button "${label}" not found`);
  return match;
}

describe("SearchPage — tabs", () => {
  it("renders All, Live TV, Movies, Series tabs when query has 2+ chars", () => {
    mockUseSearch.mockReturnValue({
      data: mockSearchResults,
      isLoading: false,
      isFetching: false,
    });
    renderSearchPage();
    const input = screen.getByPlaceholderText(
      "Search live TV, movies, series...",
    );
    fireEvent.change(input, { target: { value: "ba" } });
    // Each tab renders as a button whose textContent starts with the label
    expect(getTabButton("All")).toBeTruthy();
    expect(getTabButton("Live TV")).toBeTruthy();
    expect(getTabButton("Movies")).toBeTruthy();
    expect(getTabButton("Series")).toBeTruthy();
  });

  it("clicking Live TV tab shows only live results", () => {
    mockUseSearch.mockReturnValue({
      data: mockSearchResults,
      isLoading: false,
      isFetching: false,
    });
    renderSearchPage();
    const input = screen.getByPlaceholderText(
      "Search live TV, movies, series...",
    );
    fireEvent.change(input, { target: { value: "ba" } });

    fireEvent.click(getTabButton("Live TV"));

    // Should show Star Maa (live) but not Baahubali (vod) or Sacred Games (series)
    expect(screen.getByText("Star Maa")).toBeTruthy();
    expect(screen.queryByText("Baahubali")).toBeNull();
    expect(screen.queryByText("Sacred Games")).toBeNull();
  });

  it("clicking Movies tab shows only VOD results", () => {
    mockUseSearch.mockReturnValue({
      data: mockSearchResults,
      isLoading: false,
      isFetching: false,
    });
    renderSearchPage();
    const input = screen.getByPlaceholderText(
      "Search live TV, movies, series...",
    );
    fireEvent.change(input, { target: { value: "ba" } });

    fireEvent.click(getTabButton("Movies"));

    expect(screen.getByText("Baahubali")).toBeTruthy();
    expect(screen.queryByText("Star Maa")).toBeNull();
    expect(screen.queryByText("Sacred Games")).toBeNull();
  });

  it("clicking Series tab shows only series results", () => {
    mockUseSearch.mockReturnValue({
      data: mockSearchResults,
      isLoading: false,
      isFetching: false,
    });
    renderSearchPage();
    const input = screen.getByPlaceholderText(
      "Search live TV, movies, series...",
    );
    fireEvent.change(input, { target: { value: "ba" } });

    fireEvent.click(getTabButton("Series"));

    expect(screen.getByText("Sacred Games")).toBeTruthy();
    expect(screen.queryByText("Star Maa")).toBeNull();
    expect(screen.queryByText("Baahubali")).toBeNull();
  });
});

describe("SearchPage — results", () => {
  it("renders content cards for all result types in All tab", () => {
    mockUseSearch.mockReturnValue({
      data: mockSearchResults,
      isLoading: false,
      isFetching: false,
    });
    renderSearchPage();
    const input = screen.getByPlaceholderText(
      "Search live TV, movies, series...",
    );
    fireEvent.change(input, { target: { value: "ba" } });

    const cards = screen.getAllByTestId("content-card");
    // 1 live + 1 vod + 1 series = 3 cards
    expect(cards.length).toBe(3);
  });

  it('shows "No results found" empty state when results are empty', () => {
    mockUseSearch.mockReturnValue({
      data: { live: [], vod: [], series: [] },
      isLoading: false,
      isFetching: false,
    });
    renderSearchPage();
    const input = screen.getByPlaceholderText(
      "Search live TV, movies, series...",
    );
    fireEvent.change(input, { target: { value: "xyzxyz" } });
    expect(screen.getByText("No results found")).toBeTruthy();
  });

  it("clicking a live result calls playStream and navigates to /live", () => {
    mockUseSearch.mockReturnValue({
      data: mockSearchResults,
      isLoading: false,
      isFetching: false,
    });
    renderSearchPage();
    const input = screen.getByPlaceholderText(
      "Search live TV, movies, series...",
    );
    fireEvent.change(input, { target: { value: "ba" } });

    fireEvent.click(getTabButton("Live TV"));
    const liveCard = screen.getByText("Star Maa");
    fireEvent.click(liveCard);

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "/live",
        search: expect.objectContaining({ play: "201" }),
      }),
    );
  });

  it("clicking a VOD result navigates to /vod/$vodId", () => {
    mockUseSearch.mockReturnValue({
      data: mockSearchResults,
      isLoading: false,
      isFetching: false,
    });
    renderSearchPage();
    const input = screen.getByPlaceholderText(
      "Search live TV, movies, series...",
    );
    fireEvent.change(input, { target: { value: "ba" } });

    fireEvent.click(getTabButton("Movies"));
    fireEvent.click(screen.getByText("Baahubali"));

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/vod/$vodId",
      params: { vodId: "301" },
    });
  });

  it("clicking a series result navigates to /series/$seriesId", () => {
    mockUseSearch.mockReturnValue({
      data: mockSearchResults,
      isLoading: false,
      isFetching: false,
    });
    renderSearchPage();
    const input = screen.getByPlaceholderText(
      "Search live TV, movies, series...",
    );
    fireEvent.change(input, { target: { value: "ba" } });

    fireEvent.click(getTabButton("Series"));
    fireEvent.click(screen.getByText("Sacred Games"));

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/series/$seriesId",
      params: { seriesId: "401" },
    });
  });
});

describe("SearchPage — D-pad accessibility", () => {
  it("search input is accessible via keyboard (has placeholder role)", () => {
    renderSearchPage();
    const input = screen.getByPlaceholderText(
      "Search live TV, movies, series...",
    );
    expect(input.tagName).toBe("INPUT");
    expect((input as HTMLInputElement).type).toBe("text");
  });
});
