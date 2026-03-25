import { describe, it, expect } from "vitest";
import { parseGenres, collectAllGenres } from "../parseGenres";

// ---------------------------------------------------------------------------
// parseGenres
// ---------------------------------------------------------------------------
describe("parseGenres", () => {
  it("parses comma-separated genres", () => {
    expect(parseGenres("Action, Drama, Comedy")).toEqual([
      "Action",
      "Drama",
      "Comedy",
    ]);
  });

  it("trims whitespace from each genre", () => {
    expect(parseGenres("  Action ,  Drama  , Comedy  ")).toEqual([
      "Action",
      "Drama",
      "Comedy",
    ]);
  });

  it("filters out empty strings", () => {
    expect(parseGenres("Action,,Drama,")).toEqual(["Action", "Drama"]);
    expect(parseGenres(",,,")).toEqual([]);
  });

  it("deduplicates genres", () => {
    expect(parseGenres("Action, Drama, Action")).toEqual(["Action", "Drama"]);
  });

  it("returns empty array for undefined input", () => {
    expect(parseGenres(undefined)).toEqual([]);
  });

  it("returns empty array for null input", () => {
    expect(parseGenres(null)).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(parseGenres("")).toEqual([]);
  });

  it("handles single genre", () => {
    expect(parseGenres("Action")).toEqual(["Action"]);
  });

  it("preserves case", () => {
    expect(parseGenres("action, DRAMA, Comedy")).toEqual([
      "action",
      "DRAMA",
      "Comedy",
    ]);
  });

  it("handles genres with special characters", () => {
    expect(parseGenres("Sci-Fi, Romance")).toEqual(["Sci-Fi", "Romance"]);
  });

  it("handles whitespace-only entries", () => {
    expect(parseGenres("Action,   , Drama")).toEqual(["Action", "Drama"]);
  });
});

// ---------------------------------------------------------------------------
// collectAllGenres
// ---------------------------------------------------------------------------
describe("collectAllGenres", () => {
  it("collects unique genres from all items", () => {
    const items = [
      { genre: "Action, Drama" },
      { genre: "Comedy, Drama" },
      { genre: "Action, Thriller" },
    ];
    const result = collectAllGenres(items);
    expect(result).toEqual(["Action", "Comedy", "Drama", "Thriller"]);
  });

  it("returns sorted genres", () => {
    const items = [{ genre: "Thriller, Action, Comedy" }];
    const result = collectAllGenres(items);
    expect(result).toEqual(["Action", "Comedy", "Thriller"]);
  });

  it("returns empty array for empty items", () => {
    expect(collectAllGenres([])).toEqual([]);
  });

  it("handles items with undefined genre", () => {
    const items = [{ genre: undefined }, { genre: "Action" }];
    const result = collectAllGenres(items);
    expect(result).toEqual(["Action"]);
  });

  it("handles items with no genre property", () => {
    const items = [{}, { genre: "Drama" }];
    const result = collectAllGenres(items);
    expect(result).toEqual(["Drama"]);
  });

  it("deduplicates across items", () => {
    const items = [
      { genre: "Action" },
      { genre: "Action" },
      { genre: "Action" },
    ];
    const result = collectAllGenres(items);
    expect(result).toEqual(["Action"]);
  });

  it("handles all empty genre strings", () => {
    const items = [{ genre: "" }, { genre: "" }];
    const result = collectAllGenres(items);
    expect(result).toEqual([]);
  });
});
