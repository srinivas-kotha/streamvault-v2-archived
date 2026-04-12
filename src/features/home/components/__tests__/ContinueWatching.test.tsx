import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePlayerStore } from "@lib/store";
import { ContinueWatching } from "../ContinueWatching";

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

// ── mock ContentRail ──────────────────────────────────────────────────────────

vi.mock("@shared/components/ContentRail", () => ({
  ContentRail: ({ title, children, isLoading, isEmpty }: any) => (
    <div data-testid="content-rail" data-loading={isLoading ? "true" : "false"}>
      {title && <h2>{title}</h2>}
      {isLoading ? (
        <div className="animate-pulse">Loading...</div>
      ) : isEmpty ? (
        <div>Empty</div>
      ) : (
        children
      )}
    </div>
  ),
}));

// ── mock FocusableCard ────────────────────────────────────────────────────────

vi.mock("@shared/components/FocusableCard", () => ({
  FocusableCard: ({ title, subtitle, onClick, onRemove, progress }: any) => (
    <div data-testid="cw-card" onClick={onClick} data-progress={progress}>
      <span>{title}</span>
      <span data-testid="subtitle">{subtitle}</span>
      {onRemove && (
        <button
          data-testid="remove-btn"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          Remove
        </button>
      )}
    </div>
  ),
}));

vi.mock("@/design-system", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/design-system")>();
  return {
    ...actual,
    FocusableCard: ({ children, onEnterPress }: any) => (
      <div data-testid="cw-card" onClick={onEnterPress}>
        {children}
      </div>
    ),
    LandscapeCard: ({ title, subtitle, onClick, progress }: any) => (
      <div data-testid="landscape-card" onClick={onClick} data-progress={progress}>
        <span>{title}</span>
        <span data-testid="subtitle">{subtitle}</span>
      </div>
    ),
  };
});

// ── mock router ───────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

// ── mock API hooks ────────────────────────────────────────────────────────────

const mockUseWatchHistory = vi.fn();
const mockRemoveHistoryMutate = vi.fn();

vi.mock("../../api", () => ({
  useWatchHistory: () => mockUseWatchHistory(),
}));

vi.mock("@features/history/api", () => ({
  useRemoveHistoryItem: () => ({ mutate: mockRemoveHistoryMutate }),
}));

// ── mock data ─────────────────────────────────────────────────────────────────

const makeHistoryItem = (
  id: number,
  contentId: number,
  contentType: "live" | "vod" | "series",
  name: string,
  progress: number,
  duration: number,
) => ({
  id,
  user_id: 1,
  content_type: contentType,
  content_id: contentId,
  content_name: name,
  content_icon: `https://img.example.com/${id}.jpg`,
  progress_seconds: progress,
  duration_seconds: duration,
  watched_at: "2026-03-24T10:00:00Z",
});

const mockHistory = [
  makeHistoryItem(1, 101, "vod", "Baahubali", 3600, 9000), // 40%
  makeHistoryItem(2, 201, "series", "Sacred Games", 1200, 2700), // ~44%
  makeHistoryItem(3, 301, "live", "Star Maa", 600, 3600), // ~17%
  makeHistoryItem(4, 401, "vod", "Finished Movie", 2850, 3000), // 95% — should be filtered out
  makeHistoryItem(5, 501, "vod", "Not Started", 0, 5400), // 0% — should be filtered out
  makeHistoryItem(6, 601, "vod", "No Duration", 100, 0), // duration 0 — should be filtered out
];

// ── helpers ───────────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderContinueWatching() {
  const client = createQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <ContinueWatching />
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

describe("ContinueWatching — progress filtering", () => {
  it("shows items with progress between 0% and 95%", () => {
    renderContinueWatching();
    expect(screen.getByText("Baahubali")).toBeTruthy();
    expect(screen.getByText("Sacred Games")).toBeTruthy();
    expect(screen.getByText("Star Maa")).toBeTruthy();
  });

  it("filters out items at 95% or above (finished)", () => {
    renderContinueWatching();
    expect(screen.queryByText("Finished Movie")).toBeNull();
  });

  it("filters out items at 0% (not started)", () => {
    renderContinueWatching();
    expect(screen.queryByText("Not Started")).toBeNull();
  });

  it("filters out items with 0 duration", () => {
    renderContinueWatching();
    expect(screen.queryByText("No Duration")).toBeNull();
  });

  it("returns null when no items are in progress", () => {
    mockUseWatchHistory.mockReturnValue({ data: [], isLoading: false });
    const { container } = renderContinueWatching();
    expect(container.innerHTML).toBe("");
  });
});

describe("ContinueWatching — progress percentage", () => {
  it("displays rounded progress percentage in subtitle", () => {
    renderContinueWatching();
    const subtitles = screen.getAllByTestId("subtitle");
    // Baahubali: 3600/9000 = 40%
    expect(subtitles.some((s) => s.textContent === "40% watched")).toBe(true);
    // Sacred Games: 1200/2700 = 44.44% → 44%
    expect(subtitles.some((s) => s.textContent === "44% watched")).toBe(true);
  });
});

describe("ContinueWatching — playback by type", () => {
  it("calls playStream and navigates to /live for live content", () => {
    renderContinueWatching();
    const starMaaCard = screen
      .getByText("Star Maa")
      .closest("[data-testid='cw-card']");
    fireEvent.click(starMaaCard!);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/live",
      search: { play: "301" },
    });
    const playerState = usePlayerStore.getState();
    expect(playerState.currentStreamId).toBe("301");
    expect(playerState.currentStreamType).toBe("live");
  });

  it("calls playStream with resume position for VOD content", () => {
    renderContinueWatching();
    const baahubaliCard = screen
      .getByText("Baahubali")
      .closest("[data-testid='cw-card']");
    fireEvent.click(baahubaliCard!);
    const playerState = usePlayerStore.getState();
    expect(playerState.currentStreamId).toBe("101");
    expect(playerState.currentStreamType).toBe("vod");
    expect(playerState.startTime).toBe(3600);
  });

  it("calls playStream with resume position for series content", () => {
    renderContinueWatching();
    const sacredCard = screen
      .getByText("Sacred Games")
      .closest("[data-testid='cw-card']");
    fireEvent.click(sacredCard!);
    const playerState = usePlayerStore.getState();
    expect(playerState.currentStreamId).toBe("201");
    expect(playerState.currentStreamType).toBe("series");
    expect(playerState.startTime).toBe(1200);
  });
});

describe("ContinueWatching — remove handler", () => {
  it("calls removeHistoryItem.mutate when remove button is clicked", () => {
    renderContinueWatching();
    const removeButtons = screen.getAllByLabelText("Remove from continue watching");
    fireEvent.click(removeButtons[0]!);
    expect(mockRemoveHistoryMutate).toHaveBeenCalledTimes(1);
    expect(mockRemoveHistoryMutate).toHaveBeenCalledWith({
      contentId: 101,
      contentType: "vod",
    });
  });
});

describe("ContinueWatching — heading", () => {
  it('renders "Continue Watching" rail title', () => {
    renderContinueWatching();
    expect(screen.getByText("Continue Watching")).toBeTruthy();
  });
});
