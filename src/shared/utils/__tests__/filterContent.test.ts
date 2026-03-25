import { describe, it, expect } from "vitest";
import { filterContent, DEFAULT_FILTERS } from "../filterContent";
import type { FilterState } from "../filterContent";

// Helper to create content items
function makeItem(overrides: Record<string, unknown> = {}) {
  return {
    name: "Test Movie",
    genre: "Action, Drama",
    is_adult: "0",
    rating_5based: 4.0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// DEFAULT_FILTERS
// ---------------------------------------------------------------------------
describe("DEFAULT_FILTERS", () => {
  it("has genre as null", () => {
    expect(DEFAULT_FILTERS.genre).toBeNull();
  });

  it("has minRating as null", () => {
    expect(DEFAULT_FILTERS.minRating).toBeNull();
  });

  it("has hideAdult as true", () => {
    expect(DEFAULT_FILTERS.hideAdult).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// filterContent
// ---------------------------------------------------------------------------
describe("filterContent", () => {
  const items = [
    makeItem({
      name: "Movie A",
      genre: "Action, Drama",
      is_adult: "0",
      rating_5based: 4.5,
    }),
    makeItem({
      name: "Movie B",
      genre: "Comedy",
      is_adult: "0",
      rating_5based: 3.0,
    }),
    makeItem({
      name: "Adult Movie",
      genre: "Adult",
      is_adult: "1",
      rating_5based: 2.0,
    }),
    makeItem({
      name: "Movie C",
      genre: "Action, Thriller",
      is_adult: "0",
      rating_5based: 5.0,
    }),
    makeItem({
      name: "Movie D",
      genre: "Drama",
      is_adult: "0",
      rating_5based: 1.5,
    }),
  ];

  it("returns all items when no filters active (except hideAdult)", () => {
    const result = filterContent(items, DEFAULT_FILTERS);
    // hideAdult is true by default, so adult item filtered out
    expect(result.length).toBe(4);
    expect(result.find((i) => i.name === "Adult Movie")).toBeUndefined();
  });

  it("filters out adult content when hideAdult is true", () => {
    const filters: FilterState = { ...DEFAULT_FILTERS, hideAdult: true };
    const result = filterContent(items, filters);
    expect(result.every((i) => String(i.is_adult) !== "1")).toBe(true);
  });

  it("includes adult content when hideAdult is false", () => {
    const filters: FilterState = { ...DEFAULT_FILTERS, hideAdult: false };
    const result = filterContent(items, filters);
    expect(result.length).toBe(5);
    expect(result.find((i) => i.name === "Adult Movie")).toBeDefined();
  });

  it("filters by genre", () => {
    const filters: FilterState = {
      genre: "Action",
      minRating: null,
      hideAdult: false,
    };
    const result = filterContent(items, filters);
    expect(result.length).toBe(2);
    expect(result.map((i) => i.name)).toContain("Movie A");
    expect(result.map((i) => i.name)).toContain("Movie C");
  });

  it("filters by minimum rating", () => {
    const filters: FilterState = {
      genre: null,
      minRating: 4.0,
      hideAdult: false,
    };
    const result = filterContent(items, filters);
    expect(result.length).toBe(2);
    expect(result.map((i) => i.name)).toContain("Movie A");
    expect(result.map((i) => i.name)).toContain("Movie C");
  });

  it("combines all filters", () => {
    const filters: FilterState = {
      genre: "Action",
      minRating: 4.0,
      hideAdult: true,
    };
    const result = filterContent(items, filters);
    expect(result.length).toBe(2);
    expect(result.map((i) => i.name)).toEqual(
      expect.arrayContaining(["Movie A", "Movie C"]),
    );
  });

  it("returns empty array when no items match", () => {
    const filters: FilterState = {
      genre: "SciFi",
      minRating: null,
      hideAdult: false,
    };
    const result = filterContent(items, filters);
    expect(result).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(filterContent([], DEFAULT_FILTERS)).toEqual([]);
  });

  it("handles items with undefined genre", () => {
    const itemsWithUndefinedGenre = [makeItem({ genre: undefined })];
    const filters: FilterState = {
      genre: "Action",
      minRating: null,
      hideAdult: false,
    };
    const result = filterContent(itemsWithUndefinedGenre, filters);
    expect(result).toEqual([]);
  });

  it("handles items with missing rating_5based", () => {
    const itemsWithNoRating = [makeItem({ rating_5based: undefined })];
    const filters: FilterState = {
      genre: null,
      minRating: 3.0,
      hideAdult: false,
    };
    const result = filterContent(itemsWithNoRating, filters);
    expect(result).toEqual([]);
  });

  it("treats is_adult string '1' as adult content", () => {
    const adultItems = [
      makeItem({ is_adult: "1" }),
      makeItem({ is_adult: "0" }),
      makeItem({ is_adult: 1 }),
    ];
    const filters: FilterState = { ...DEFAULT_FILTERS, hideAdult: true };
    const result = filterContent(adultItems, filters);
    // String "1" is filtered, numeric 1 becomes "1" via String() so also filtered
    expect(result.length).toBe(1);
  });

  it("does not mutate the original array", () => {
    const original = [...items];
    filterContent(items, { genre: "Action", minRating: null, hideAdult: true });
    expect(items.length).toBe(original.length);
  });
});
