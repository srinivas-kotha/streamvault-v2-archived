import { describe, it, expect } from "vitest";
import { sortContent, SORT_OPTIONS } from "../sortContent";

// Helper to create content items
function makeItem(overrides: Record<string, unknown> = {}) {
  return {
    name: "Untitled",
    rating_5based: 0,
    added: "0",
    releaseDate: "0",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// SORT_OPTIONS
// ---------------------------------------------------------------------------
describe("SORT_OPTIONS", () => {
  it("has 6 sort options", () => {
    expect(SORT_OPTIONS.length).toBe(6);
  });

  it("includes name, rating, added, and releaseDate fields", () => {
    const fields = SORT_OPTIONS.map((o) => o.field);
    expect(fields).toContain("name");
    expect(fields).toContain("rating");
    expect(fields).toContain("added");
    expect(fields).toContain("releaseDate");
  });

  it("each option has a label", () => {
    for (const opt of SORT_OPTIONS) {
      expect(opt.label).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// sortContent
// ---------------------------------------------------------------------------
describe("sortContent", () => {
  const items = [
    makeItem({
      name: "Charlie",
      rating_5based: 3.0,
      added: "2024-01-03",
      releaseDate: "2023-06-01",
    }),
    makeItem({
      name: "Alpha",
      rating_5based: 5.0,
      added: "2024-01-01",
      releaseDate: "2024-01-01",
    }),
    makeItem({
      name: "Bravo",
      rating_5based: 4.0,
      added: "2024-01-02",
      releaseDate: "2022-01-01",
    }),
  ];

  it("sorts by name ascending", () => {
    const result = sortContent(items, "name", "asc");
    expect(result.map((i) => i.name)).toEqual(["Alpha", "Bravo", "Charlie"]);
  });

  it("sorts by name descending", () => {
    const result = sortContent(items, "name", "desc");
    expect(result.map((i) => i.name)).toEqual(["Charlie", "Bravo", "Alpha"]);
  });

  it("sorts by rating ascending", () => {
    const result = sortContent(items, "rating", "asc");
    expect(result.map((i) => i.rating_5based)).toEqual([3.0, 4.0, 5.0]);
  });

  it("sorts by rating descending", () => {
    const result = sortContent(items, "rating", "desc");
    expect(result.map((i) => i.rating_5based)).toEqual([5.0, 4.0, 3.0]);
  });

  it("sorts by added date ascending", () => {
    const result = sortContent(items, "added", "asc");
    expect(result.map((i) => i.added)).toEqual([
      "2024-01-01",
      "2024-01-02",
      "2024-01-03",
    ]);
  });

  it("sorts by added date descending", () => {
    const result = sortContent(items, "added", "desc");
    expect(result.map((i) => i.added)).toEqual([
      "2024-01-03",
      "2024-01-02",
      "2024-01-01",
    ]);
  });

  it("sorts by releaseDate ascending", () => {
    const result = sortContent(items, "releaseDate", "asc");
    expect(result.map((i) => i.releaseDate)).toEqual([
      "2022-01-01",
      "2023-06-01",
      "2024-01-01",
    ]);
  });

  it("sorts by releaseDate descending", () => {
    const result = sortContent(items, "releaseDate", "desc");
    expect(result.map((i) => i.releaseDate)).toEqual([
      "2024-01-01",
      "2023-06-01",
      "2022-01-01",
    ]);
  });

  it("does not mutate the original array", () => {
    const original = [...items];
    sortContent(items, "name", "asc");
    expect(items.map((i) => i.name)).toEqual(original.map((i) => i.name));
  });

  it("returns empty array for empty input", () => {
    expect(sortContent([], "name", "asc")).toEqual([]);
  });

  it("handles items with missing name (uses empty string)", () => {
    const itemsNoName = [
      makeItem({ name: undefined }),
      makeItem({ name: "Alpha" }),
    ];
    const result = sortContent(itemsNoName, "name", "asc");
    // Empty string sorts before "Alpha"
    expect(result[0]!.name).toBeUndefined();
    expect(result[1]!.name).toBe("Alpha");
  });

  it("handles items with missing rating (uses 0)", () => {
    const itemsNoRating = [
      makeItem({ name: "A", rating_5based: undefined }),
      makeItem({ name: "B", rating_5based: 3.0 }),
    ];
    const result = sortContent(itemsNoRating, "rating", "asc");
    expect(Number(result[0]!.rating_5based || 0)).toBe(0);
    expect(result[1]!.rating_5based).toBe(3.0);
  });

  it("handles items using rating field as fallback", () => {
    const itemsWithRatingField = [
      makeItem({ name: "A", rating_5based: undefined, rating: 2.0 }),
      makeItem({ name: "B", rating_5based: undefined, rating: 4.0 }),
    ];
    const result = sortContent(itemsWithRatingField, "rating", "desc");
    expect(result[0]!.rating).toBe(4.0);
    expect(result[1]!.rating).toBe(2.0);
  });

  it("is case-insensitive for name sorting", () => {
    const caseItems = [
      makeItem({ name: "banana" }),
      makeItem({ name: "Apple" }),
      makeItem({ name: "cherry" }),
    ];
    const result = sortContent(caseItems, "name", "asc");
    expect(result.map((i) => i.name)).toEqual(["Apple", "banana", "cherry"]);
  });

  it("handles single item", () => {
    const single = [makeItem({ name: "Only" })];
    expect(sortContent(single, "name", "asc")).toEqual(single);
  });
});
