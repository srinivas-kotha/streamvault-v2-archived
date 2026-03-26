import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SeriesPage } from "../SeriesPage";

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

// ── mock ContentRail ──────────────────────────────────────────────────────────

vi.mock("@shared/components/ContentRail", () => ({
  ContentRail: ({ title, children, isLoading }: any) => (
    <div data-testid="content-rail" data-loading={isLoading ? "true" : "false"}>
      {title && <h2>{title}</h2>}
      {isLoading ? <div className="animate-pulse">Loading...</div> : children}
    </div>
  ),
}));

// ── mock FocusableCard ────────────────────────────────────────────────────────

vi.mock("@shared/components/FocusableCard", () => ({
  FocusableCard: ({ title, onClick }: any) => (
    <div data-testid="series-card" onClick={onClick}>
      {title}
    </div>
  ),
}));

// ── mock isNewContent ─────────────────────────────────────────────────────────

vi.mock("@shared/utils/isNewContent", () => ({
  isNewContent: () => false,
}));

// ── mock router ───────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

// ── mock API ──────────────────────────────────────────────────────────────────

const mockUseSeriesByLanguage = vi.fn();
vi.mock("../../api", () => ({
  useSeriesByLanguage: (...args: any[]) => mockUseSeriesByLanguage(...args),
}));

// ── mock data ─────────────────────────────────────────────────────────────────

const mockChannels = [
  { id: "453", name: "Star Maa", count: 2 },
  { id: "455", name: "Zee Telugu", count: 1 },
];

const mockSeries = [
  {
    id: "101",
    name: "Karthika Deepam",
    icon: "img1.jpg",
    channelId: "453",
    channelName: "Star Maa",
    added: "2026-03-01",
  },
  {
    id: "102",
    name: "Intinti Gruhalakshmi",
    icon: "img2.jpg",
    channelId: "453",
    channelName: "Star Maa",
    added: "2026-03-02",
  },
  {
    id: "103",
    name: "Prema Entha",
    icon: "img3.jpg",
    channelId: "455",
    channelName: "Zee Telugu",
    added: "2026-03-03",
  },
];

// ── helpers ───────────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderSeriesPage() {
  const client = createQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <SeriesPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseSeriesByLanguage.mockReturnValue({
    allSeries: mockSeries,
    channels: mockChannels,
    isLoading: false,
  });
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe("SeriesPage — loading state", () => {
  it("shows loading skeletons while data is loading", () => {
    mockUseSeriesByLanguage.mockReturnValue({
      allSeries: [],
      channels: [],
      isLoading: true,
    });
    renderSeriesPage();
    const rails = screen.getAllByTestId("content-rail");
    const loadingRails = rails.filter(
      (r) => r.getAttribute("data-loading") === "true",
    );
    expect(loadingRails.length).toBeGreaterThan(0);
  });

  it("renders 4 loading skeleton rails", () => {
    mockUseSeriesByLanguage.mockReturnValue({
      allSeries: [],
      channels: [],
      isLoading: true,
    });
    renderSeriesPage();
    const rails = screen.getAllByTestId("content-rail");
    expect(rails.length).toBe(4);
  });
});

describe("SeriesPage — channel rails", () => {
  it("renders a content rail for each channel with series", () => {
    renderSeriesPage();
    expect(screen.getByText("Star Maa")).toBeTruthy();
    expect(screen.getByText("Zee Telugu")).toBeTruthy();
  });

  it("renders series cards within their channel rails", () => {
    renderSeriesPage();
    const cards = screen.getAllByTestId("series-card");
    expect(cards.length).toBe(3);
    expect(screen.getByText("Karthika Deepam")).toBeTruthy();
    expect(screen.getByText("Intinti Gruhalakshmi")).toBeTruthy();
    expect(screen.getByText("Prema Entha")).toBeTruthy();
  });
});

describe("SeriesPage — empty channels filtered out", () => {
  it("does not render channel rail if channel has no series", () => {
    mockUseSeriesByLanguage.mockReturnValue({
      allSeries: [mockSeries[0]],
      channels: [
        mockChannels[0],
        { id: "999", name: "Empty Channel", count: 0 },
      ],
      isLoading: false,
    });
    renderSeriesPage();
    expect(screen.getByText("Star Maa")).toBeTruthy();
    // Empty channel should not appear (filtered by seriesByChannel memo)
    expect(screen.queryByText("Empty Channel")).toBeNull();
  });
});

describe("SeriesPage — navigation", () => {
  it('renders a "Series" heading', () => {
    renderSeriesPage();
    expect(screen.getByText("Series")).toBeTruthy();
  });

  it("navigates to series detail when a card is clicked", () => {
    renderSeriesPage();
    const cards = screen.getAllByTestId("series-card");
    fireEvent.click(cards[0]!);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/series/$seriesId",
      params: { seriesId: "101" },
    });
  });
});
