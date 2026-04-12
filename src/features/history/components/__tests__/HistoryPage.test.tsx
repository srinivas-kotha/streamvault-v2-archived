import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePlayerStore } from "@lib/store";
import { HistoryPage } from "../HistoryPage";

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

// ── mock usePageFocus ─────────────────────────────────────────────────────────

vi.mock("@shared/hooks/usePageFocus", () => ({
  usePageFocus: vi.fn(),
}));

// ── mock PageTransition ───────────────────────────────────────────────────────

vi.mock("@shared/components/PageTransition", () => ({
  PageTransition: ({ children }: any) => <div>{children}</div>,
}));

// ── mock shared components ────────────────────────────────────────────────────

vi.mock("@shared/components/EmptyState", () => ({
  EmptyState: ({ title, message }: any) => (
    <div data-testid="empty-state">
      <span data-testid="empty-title">{title}</span>
      {message && <span data-testid="empty-message">{message}</span>}
    </div>
  ),
}));

// ── mock formatDuration / formatTimeAgo ───────────────────────────────────────

vi.mock("@/design-system", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/design-system")>();
  return {
    ...actual,
    LandscapeCard: ({ progress, onClick, focusKey, subtitle }: any) => (
      <div
        data-testid="landscape-card"
        data-focus-key={focusKey}
        onClick={onClick}
      >
        {subtitle && <span data-testid="lc-subtitle">{subtitle}</span>}
        {progress !== undefined && progress > 0 && (
          <div style={{ width: `${progress}%` }} />
        )}
      </div>
    ),
  };
});

vi.mock("@shared/utils/formatDuration", () => ({
  formatDuration: (secs: number) => `${Math.floor(secs / 60)}m`,
  formatTimeAgo: (iso: string) => {
    void iso;
    return "2 hours ago";
  },
}));

// ── mock router ───────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
  useSearch: () => ({}),
}));

// ── mock API hooks ────────────────────────────────────────────────────────────

const mockUseWatchHistory = vi.fn();
const mockClearHistoryMutate = vi.fn();

vi.mock("@features/history/api", () => ({
  useWatchHistory: () => mockUseWatchHistory(),
  useClearHistory: () => ({ mutate: mockClearHistoryMutate, isPending: false }),
  useRemoveHistoryItem: () => ({ mutate: vi.fn() }),
}));

// ── mock data — ordered from newest to oldest ─────────────────────────────────

const makeHistoryItem = (
  id: number,
  contentId: number,
  contentType: "live" | "vod" | "series",
  contentName: string,
  progressSeconds: number,
  durationSeconds: number,
  watchedAt: string,
) => ({
  id,
  user_id: 1,
  content_type: contentType,
  content_id: contentId,
  content_name: contentName,
  content_icon: `https://img.example.com/${contentName.toLowerCase().replace(" ", "")}.jpg`,
  progress_seconds: progressSeconds,
  duration_seconds: durationSeconds,
  watched_at: watchedAt,
});

const mockHistory = [
  // newest first
  makeHistoryItem(
    3,
    401,
    "series",
    "Sacred Games",
    1200,
    2700,
    "2026-03-24T10:00:00Z",
  ),
  makeHistoryItem(
    2,
    301,
    "vod",
    "Baahubali",
    3600,
    9000,
    "2026-03-23T20:00:00Z",
  ),
  makeHistoryItem(1, 201, "live", "Star Maa", 0, 0, "2026-03-22T15:00:00Z"),
];

// ── helpers ───────────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderHistoryPage() {
  const client = createQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <HistoryPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseWatchHistory.mockReturnValue({ data: mockHistory, isLoading: false });

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

describe("HistoryPage — heading and filter tabs", () => {
  it('renders "Watch History" heading', () => {
    renderHistoryPage();
    expect(screen.getByText("Watch History")).toBeTruthy();
  });

  it("renders All, Channels, Movies, Series filter tabs", () => {
    renderHistoryPage();
    expect(screen.getByText("All")).toBeTruthy();
    expect(screen.getByText("Channels")).toBeTruthy();
    expect(screen.getByText("Movies")).toBeTruthy();
    expect(screen.getByText("Series")).toBeTruthy();
  });

  it('renders "Clear History" button when history is non-empty', () => {
    renderHistoryPage();
    expect(screen.getByText("Clear History")).toBeTruthy();
  });

  it('does not render "Clear History" button when history is empty', () => {
    mockUseWatchHistory.mockReturnValue({ data: [], isLoading: false });
    renderHistoryPage();
    expect(screen.queryByText("Clear History")).toBeNull();
  });
});

describe("HistoryPage — history list rendering", () => {
  it("renders one item row for each history entry", () => {
    renderHistoryPage();
    // Each FocusableHistoryItem renders an h3 with the content name
    expect(screen.getByText("Sacred Games")).toBeTruthy();
    expect(screen.getByText("Baahubali")).toBeTruthy();
    expect(screen.getByText("Star Maa")).toBeTruthy();
  });

  it("renders history items sorted newest first", () => {
    renderHistoryPage();
    const headings = screen.getAllByRole("heading", { level: 3 });
    const names = headings.map((h) => h.textContent);
    // Sacred Games (2026-03-24) should appear before Baahubali (2026-03-23)
    const sacredIdx = names.findIndex((n) => n?.includes("Sacred Games"));
    const baahubaliIdx = names.findIndex((n) => n?.includes("Baahubali"));
    expect(sacredIdx).toBeLessThan(baahubaliIdx);
  });

  it('renders "watched at" time for each item', () => {
    renderHistoryPage();
    const timeLabels = screen.getAllByText("2 hours ago");
    expect(timeLabels.length).toBe(mockHistory.length);
  });

  it("renders progress bar for items with duration > 0", () => {
    renderHistoryPage();
    // Baahubali: 3600/9000 = 40% progress
    // Sacred Games: 1200/2700 = ~44% progress
    // Star Maa: duration=0, no progress bar rendered
    const progressBars = document.querySelectorAll('[style*="width"]');
    // At least 2 items have progress bars (Sacred Games + Baahubali)
    expect(progressBars.length).toBeGreaterThanOrEqual(2);
  });

  it("renders progress time text for items with duration > 0", () => {
    renderHistoryPage();
    // formatDuration(3600) = "60m", formatDuration(9000) = "150m"
    expect(screen.getByText("60m / 150m")).toBeTruthy();
  });

  it("renders content type badge for each item", () => {
    renderHistoryPage();
    // series badge, vod badge, live badge
    expect(screen.getByText("series")).toBeTruthy();
    expect(screen.getByText("vod")).toBeTruthy();
    expect(screen.getByText("live")).toBeTruthy(); // channel → "live" label
  });
});

describe("HistoryPage — filter tabs", () => {
  it("clicking Movies tab shows only VOD history", () => {
    renderHistoryPage();
    fireEvent.click(screen.getByText("Movies"));
    expect(screen.getByText("Baahubali")).toBeTruthy();
    expect(screen.queryByText("Sacred Games")).toBeNull();
    expect(screen.queryByText("Star Maa")).toBeNull();
  });

  it("clicking Series tab shows only series history", () => {
    renderHistoryPage();
    fireEvent.click(screen.getByText("Series"));
    expect(screen.getByText("Sacred Games")).toBeTruthy();
    expect(screen.queryByText("Baahubali")).toBeNull();
    expect(screen.queryByText("Star Maa")).toBeNull();
  });

  it("clicking Channels tab shows only channel history", () => {
    renderHistoryPage();
    fireEvent.click(screen.getByText("Channels"));
    expect(screen.getByText("Star Maa")).toBeTruthy();
    expect(screen.queryByText("Baahubali")).toBeNull();
    expect(screen.queryByText("Sacred Games")).toBeNull();
  });

  it("filtered tab shows type-specific empty state when no items match", () => {
    mockUseWatchHistory.mockReturnValue({
      data: [mockHistory[0]!], // only Sacred Games (series)
      isLoading: false,
    });
    renderHistoryPage();
    fireEvent.click(screen.getByText("Movies"));
    expect(screen.getByTestId("empty-state")).toBeTruthy();
    // HistoryPage sets message = `No ${label.toLowerCase()} in history`
    // label for vod key = "Movies", so message contains "movies"
    const emptyMsg = screen.getByTestId("empty-message");
    expect(emptyMsg.textContent?.toLowerCase()).toContain("movies");
  });
});

describe("HistoryPage — clear history", () => {
  it("clicking Clear History calls clearHistory.mutate", () => {
    renderHistoryPage();
    const clearBtn = screen.getByText("Clear History");
    fireEvent.click(clearBtn);
    expect(mockClearHistoryMutate).toHaveBeenCalledTimes(1);
  });
});

describe("HistoryPage — empty state", () => {
  it('shows "No watch history" when history is empty', () => {
    mockUseWatchHistory.mockReturnValue({ data: [], isLoading: false });
    renderHistoryPage();
    expect(screen.getByTestId("empty-state")).toBeTruthy();
    expect(screen.getByText("No watch history")).toBeTruthy();
  });

  it("shows loading skeleton while fetching", () => {
    mockUseWatchHistory.mockReturnValue({ data: undefined, isLoading: true });
    renderHistoryPage();
    const { container } = renderHistoryPage();
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe("HistoryPage — item click / resume playback", () => {
  it("clicking a VOD history item navigates to /vod/$vodId", () => {
    renderHistoryPage();
    const baahubaliWrapper = screen
      .getByText("Baahubali")
      .closest('[data-testid="history-item"]');
    expect(baahubaliWrapper).toBeTruthy();
    const baahubaliCard = baahubaliWrapper!.querySelector('[data-testid="landscape-card"]');
    expect(baahubaliCard).toBeTruthy();
    fireEvent.click(baahubaliCard!);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/vod/$vodId",
      params: { vodId: "301" },
    });
  });

  it("clicking a series history item navigates to /series/$seriesId", () => {
    renderHistoryPage();
    const sacredGamesWrapper = screen
      .getByText("Sacred Games")
      .closest('[data-testid="history-item"]');
    expect(sacredGamesWrapper).toBeTruthy();
    const sacredGamesCard = sacredGamesWrapper!.querySelector('[data-testid="landscape-card"]');
    expect(sacredGamesCard).toBeTruthy();
    fireEvent.click(sacredGamesCard!);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/series/$seriesId",
      params: { seriesId: "401" },
    });
  });

  it("clicking a channel history item calls playStream and navigates to /live", () => {
    renderHistoryPage();
    const starMaaWrapper = screen
      .getByText("Star Maa")
      .closest('[data-testid="history-item"]');
    expect(starMaaWrapper).toBeTruthy();
    const starMaaCard = starMaaWrapper!.querySelector('[data-testid="landscape-card"]');
    expect(starMaaCard).toBeTruthy();
    fireEvent.click(starMaaCard!);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/live",
      search: { play: "201" },
    });
    // Player store should have the stream set
    const playerState = usePlayerStore.getState();
    expect(playerState.currentStreamId).toBe("201");
    expect(playerState.currentStreamType).toBe("live");
  });

  it('renders "Continue" label on each history item', () => {
    renderHistoryPage();
    const continueLabels = screen.getAllByText("Continue");
    expect(continueLabels.length).toBe(mockHistory.length);
  });
});
