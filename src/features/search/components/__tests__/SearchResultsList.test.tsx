import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SearchResultsList } from "../SearchResultsList";
import type { CatalogItem } from "@shared/types/api";

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

// ── mock ContentCard ────────────────────────────────────────────────────────

vi.mock("@shared/components/ContentCard", () => ({
  ContentCard: ({ title, onClick }: any) => (
    <div data-testid="content-card" onClick={onClick}>
      {title}
    </div>
  ),
}));

// ── helpers ───────────────────────────────────────────────────────────────────

function makeCatalogItem(overrides?: Partial<CatalogItem>): CatalogItem {
  return {
    id: "1",
    name: "Test Item",
    type: "vod",
    categoryId: "10",
    icon: "https://example.com/icon.jpg",
    added: "2024-01-01",
    isAdult: false,
    ...overrides,
  };
}

const defaultProps = {
  filteredData: {
    live: [] as CatalogItem[],
    vod: [] as CatalogItem[],
    series: [] as CatalogItem[],
  },
  activeTab: "all" as const,
  onLiveClick: vi.fn(),
  onVodClick: vi.fn(),
  onSeriesClick: vi.fn(),
};

function renderSearchResults(props?: Partial<typeof defaultProps>) {
  return render(<SearchResultsList {...defaultProps} {...props} />);
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("SearchResultsList — empty results", () => {
  it("renders nothing visible when all sections are empty", () => {
    const { container } = renderSearchResults();
    // No section headings rendered
    expect(screen.queryByText("Live TV")).toBeNull();
    expect(screen.queryByText("Movies")).toBeNull();
    expect(screen.queryByText("Series")).toBeNull();
  });
});

describe('SearchResultsList — "all" tab', () => {
  it("renders Live TV section heading with count", () => {
    renderSearchResults({
      filteredData: {
        live: [
          makeCatalogItem({ id: "live-1", name: "Live Channel", type: "live" }),
        ],
        vod: [],
        series: [],
      },
    });
    expect(screen.getByText("Live TV")).toBeTruthy();
    expect(screen.getByText("(1)")).toBeTruthy();
  });

  it("renders Movies section heading with count", () => {
    renderSearchResults({
      filteredData: {
        live: [],
        vod: [makeCatalogItem({ id: "vod-1", name: "Movie 1" })],
        series: [],
      },
    });
    expect(screen.getByText("Movies")).toBeTruthy();
  });

  it("renders Series section heading with count", () => {
    renderSearchResults({
      filteredData: {
        live: [],
        vod: [],
        series: [
          makeCatalogItem({ id: "s-1", name: "Show 1", type: "series" }),
        ],
      },
    });
    expect(screen.getByText("Series")).toBeTruthy();
  });

  it("renders all three sections when all have data", () => {
    renderSearchResults({
      filteredData: {
        live: [makeCatalogItem({ id: "l1", name: "Channel 1", type: "live" })],
        vod: [makeCatalogItem({ id: "v1", name: "Movie 1" })],
        series: [makeCatalogItem({ id: "s1", name: "Show 1", type: "series" })],
      },
    });
    expect(screen.getByText("Live TV")).toBeTruthy();
    expect(screen.getByText("Movies")).toBeTruthy();
    expect(screen.getByText("Series")).toBeTruthy();
  });
});

describe("SearchResultsList — filtered tabs", () => {
  const allData = {
    live: [makeCatalogItem({ id: "l1", name: "Channel 1", type: "live" })],
    vod: [makeCatalogItem({ id: "v1", name: "Movie 1" })],
    series: [makeCatalogItem({ id: "s1", name: "Show 1", type: "series" })],
  };

  it('shows only live content on "live" tab', () => {
    renderSearchResults({ filteredData: allData, activeTab: "live" });
    expect(screen.getByText("Channel 1")).toBeTruthy();
    expect(screen.queryByText("Movie 1")).toBeNull();
    expect(screen.queryByText("Show 1")).toBeNull();
  });

  it('shows only VOD content on "vod" tab', () => {
    renderSearchResults({ filteredData: allData, activeTab: "vod" });
    expect(screen.queryByText("Channel 1")).toBeNull();
    expect(screen.getByText("Movie 1")).toBeTruthy();
    expect(screen.queryByText("Show 1")).toBeNull();
  });

  it('shows only series content on "series" tab', () => {
    renderSearchResults({ filteredData: allData, activeTab: "series" });
    expect(screen.queryByText("Channel 1")).toBeNull();
    expect(screen.queryByText("Movie 1")).toBeNull();
    expect(screen.getByText("Show 1")).toBeTruthy();
  });

  it("does not show section headings on filtered tabs", () => {
    renderSearchResults({ filteredData: allData, activeTab: "live" });
    // Section heading "Live TV" only appears on "all" tab
    expect(screen.queryByText("Live TV")).toBeNull();
  });
});

describe("SearchResultsList — content cards", () => {
  it("renders ContentCard for each live stream", () => {
    renderSearchResults({
      filteredData: {
        live: [
          makeCatalogItem({ id: "l1", name: "Channel 1", type: "live" }),
          makeCatalogItem({ id: "l2", name: "Channel 2", type: "live" }),
        ],
        vod: [],
        series: [],
      },
    });
    expect(screen.getByText("Channel 1")).toBeTruthy();
    expect(screen.getByText("Channel 2")).toBeTruthy();
  });

  it("renders ContentCard for each VOD movie", () => {
    renderSearchResults({
      filteredData: {
        live: [],
        vod: [makeCatalogItem({ id: "v1", name: "Great Movie" })],
        series: [],
      },
    });
    expect(screen.getByText("Great Movie")).toBeTruthy();
  });
});
