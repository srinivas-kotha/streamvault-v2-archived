import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SortFilterBar } from "../SortFilterBar";
import { SORT_OPTIONS } from "@shared/utils/sortContent";
import type { FilterState } from "@shared/utils/filterContent";

// ── mock spatial nav ──────────────────────────────────────────────────────────

vi.mock("@shared/hooks/useSpatialNav", () => ({
  useSpatialFocusable: (opts: any) => ({
    ref: { current: null },
    showFocusRing: false,
    focused: false,
    focusProps: { "data-focus-key": opts?.focusKey ?? "test" },
  }),
}));

// ── helpers ───────────────────────────────────────────────────────────────────

const defaultFilters: FilterState = {
  genre: null,
  minRating: null,
  hideAdult: true,
};

function renderSortFilterBar(
  props?: Partial<React.ComponentProps<typeof SortFilterBar>>,
) {
  return render(
    <SortFilterBar
      sort={SORT_OPTIONS[0]}
      onSortChange={vi.fn()}
      filters={defaultFilters}
      onFiltersChange={vi.fn()}
      genres={[]}
      {...props}
    />,
  );
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("SortFilterBar — sort dropdown", () => {
  it("renders a select element for sorting", () => {
    renderSortFilterBar();
    const select = screen.getByRole("combobox");
    expect(select).toBeTruthy();
  });

  it("renders all sort options", () => {
    renderSortFilterBar();
    const options = screen.getAllByRole("option");
    expect(options.length).toBe(SORT_OPTIONS.length);
  });

  it("displays current sort option label", () => {
    renderSortFilterBar({ sort: SORT_OPTIONS[2] }); // Highest Rated
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe(
      `${SORT_OPTIONS[2].field}-${SORT_OPTIONS[2].direction}`,
    );
  });

  it("calls onSortChange when sort option changes", () => {
    const onSortChange = vi.fn();
    renderSortFilterBar({ onSortChange });
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "rating-desc" } });
    expect(onSortChange).toHaveBeenCalledWith(
      SORT_OPTIONS.find((o) => o.field === "rating" && o.direction === "desc"),
    );
  });
});

describe("SortFilterBar — rating filter chips", () => {
  it("renders rating filter buttons (Any, 3.5+, 4+)", () => {
    renderSortFilterBar();
    expect(screen.getByText(/Any.*★/)).toBeTruthy();
    expect(screen.getByText(/3\.5\+.*★/)).toBeTruthy();
    expect(screen.getByText(/4\+.*★/)).toBeTruthy();
  });

  it("calls onFiltersChange with minRating when rating chip is clicked", () => {
    const onFiltersChange = vi.fn();
    renderSortFilterBar({ onFiltersChange });
    fireEvent.click(screen.getByText(/3\.5\+.*★/));
    expect(onFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      minRating: 3.5,
    });
  });

  it('sets minRating to null when "Any" is clicked', () => {
    const onFiltersChange = vi.fn();
    renderSortFilterBar({
      onFiltersChange,
      filters: { ...defaultFilters, minRating: 3.5 },
    });
    fireEvent.click(screen.getByText(/Any.*★/));
    expect(onFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      minRating: null,
    });
  });
});

describe("SortFilterBar — genre chips", () => {
  it("does not render genre section when genres array is empty", () => {
    renderSortFilterBar({ genres: [] });
    expect(screen.queryByText("All Genres")).toBeNull();
  });

  it("renders genre chips when genres are provided", () => {
    renderSortFilterBar({ genres: ["Action", "Comedy", "Drama"] });
    expect(screen.getByText("All Genres")).toBeTruthy();
    expect(screen.getByText("Action")).toBeTruthy();
    expect(screen.getByText("Comedy")).toBeTruthy();
    expect(screen.getByText("Drama")).toBeTruthy();
  });

  it("limits genres to 15", () => {
    const manyGenres = Array.from({ length: 20 }, (_, i) => `Genre${i}`);
    renderSortFilterBar({ genres: manyGenres });
    // 15 genre chips + 1 "All Genres" = 16 buttons total (excluding sort select and rating chips)
    expect(screen.queryByText("Genre15")).toBeNull();
    expect(screen.getByText("Genre14")).toBeTruthy();
  });

  it("calls onFiltersChange with selected genre", () => {
    const onFiltersChange = vi.fn();
    renderSortFilterBar({ genres: ["Action", "Comedy"], onFiltersChange });
    fireEvent.click(screen.getByText("Action"));
    expect(onFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      genre: "Action",
    });
  });

  it("deselects genre when clicking active genre", () => {
    const onFiltersChange = vi.fn();
    renderSortFilterBar({
      genres: ["Action", "Comedy"],
      onFiltersChange,
      filters: { ...defaultFilters, genre: "Action" },
    });
    fireEvent.click(screen.getByText("Action"));
    expect(onFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      genre: null,
    });
  });

  it('clears genre when "All Genres" is clicked', () => {
    const onFiltersChange = vi.fn();
    renderSortFilterBar({
      genres: ["Action"],
      onFiltersChange,
      filters: { ...defaultFilters, genre: "Action" },
    });
    fireEvent.click(screen.getByText("All Genres"));
    expect(onFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      genre: null,
    });
  });
});
