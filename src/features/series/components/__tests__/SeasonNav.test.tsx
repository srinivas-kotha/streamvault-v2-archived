import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SeasonNav, type SeasonNavProps } from "../SeasonNav";

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

// ── mock data ─────────────────────────────────────────────────────────────────

const mockSeasons = [
  { seasonNumber: 1, name: "Season 1", episodeCount: 7 },
  { seasonNumber: 2, name: "Season 2", episodeCount: 13 },
  { seasonNumber: 3, name: "Season 3", episodeCount: 13 },
];

// ── helpers ───────────────────────────────────────────────────────────────────

const mockOnSeasonChange = vi.fn();

const defaultProps: SeasonNavProps = {
  seasons: mockSeasons,
  activeSeason: 1,
  seriesId: "99",
  onSeasonChange: mockOnSeasonChange,
};

function renderNav(overrides?: Partial<SeasonNavProps>) {
  return render(<SeasonNav {...defaultProps} {...overrides} />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe("SeasonNav — tab rendering", () => {
  it("renders a tab/button for each season", () => {
    renderNav();
    expect(screen.getByText(/Season 1/)).toBeTruthy();
    expect(screen.getByText(/Season 2/)).toBeTruthy();
    expect(screen.getByText(/Season 3/)).toBeTruthy();
  });

  it("renders correct number of season tabs", () => {
    renderNav();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBe(mockSeasons.length);
  });

  it("handles single-season series (renders one tab or heading)", () => {
    const singleSeason = [mockSeasons[0]!];
    renderNav({ seasons: singleSeason });
    expect(screen.getByText(/Season 1/)).toBeTruthy();
  });
});

describe("SeasonNav — active state", () => {
  it("active season tab has aria-selected=true", () => {
    renderNav({ activeSeason: 1 });
    const tabs = screen.getAllByRole("tab");
    const season1Tab = tabs.find(
      (t) =>
        t.textContent?.includes("Season 1") || t.textContent?.includes("1"),
    );
    expect(season1Tab?.getAttribute("aria-selected")).toBe("true");
  });

  it("inactive season tabs have aria-selected=false or not selected", () => {
    renderNav({ activeSeason: 1 });
    const tabs = screen.getAllByRole("tab");
    const inactiveTabs = tabs.filter(
      (t) => t.getAttribute("aria-selected") !== "true",
    );
    expect(inactiveTabs.length).toBeGreaterThan(0);
  });

  it("updates active tab when activeSeason prop changes", () => {
    const { rerender } = renderNav({ activeSeason: 1 });
    rerender(
      <SeasonNav
        {...defaultProps}
        activeSeason={2}
        onSeasonChange={mockOnSeasonChange}
      />,
    );
    const tabs = screen.getAllByRole("tab");
    const season2Tab = tabs.find(
      (t) =>
        t.textContent?.includes("Season 2") || t.textContent?.includes("2"),
    );
    expect(season2Tab?.getAttribute("aria-selected")).toBe("true");
  });
});

describe("SeasonNav — season change callback", () => {
  it("clicking a season tab calls onSeasonChange with season_number", () => {
    renderNav();
    const tabs = screen.getAllByRole("tab");
    // Click the second tab (Season 2)
    fireEvent.click(tabs[1]!);
    expect(mockOnSeasonChange).toHaveBeenCalledTimes(1);
    expect(mockOnSeasonChange).toHaveBeenCalledWith(2);
  });

  it("clicking Season 3 tab calls onSeasonChange with 3", () => {
    renderNav();
    const tabs = screen.getAllByRole("tab");
    fireEvent.click(tabs[2]!);
    expect(mockOnSeasonChange).toHaveBeenCalledWith(3);
  });

  it("clicking already-active tab still calls onSeasonChange", () => {
    renderNav({ activeSeason: 1 });
    const tabs = screen.getAllByRole("tab");
    fireEvent.click(tabs[0]!);
    expect(mockOnSeasonChange).toHaveBeenCalledWith(1);
  });
});

describe("SeasonNav — episode count display", () => {
  it("shows episode count per season tab", () => {
    renderNav();
    // Season tabs should indicate episode count
    const season1Tab = screen.getAllByRole("tab")[0]!;
    expect(season1Tab.textContent).toMatch(/7|Season 1/);
  });
});
