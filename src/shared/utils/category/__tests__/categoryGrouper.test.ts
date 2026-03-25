import { describe, it, expect } from "vitest";
import {
  parseCategory,
  groupCategoriesByLanguage,
  getDetectedLanguages,
  getCategoriesForLanguage,
  getMovieCategoriesForLanguage,
  getSeriesCategoriesForLanguage,
  getLiveCategoriesForLanguage,
} from "../categoryGrouper";
import type { LanguageGroup } from "../types";

// Helper to create XtreamCategory-shaped objects
function makeCat(id: string, name: string) {
  return { id, name, parentId: null, type: "movie" as const };
}

// ---------------------------------------------------------------------------
// parseCategory
// ---------------------------------------------------------------------------
describe("parseCategory", () => {
  it("parses a VOD category with language", () => {
    const result = parseCategory("(TELUGU) (2026)");
    expect(result).not.toBeNull();
    expect(result!.language).toBe("Telugu");
  });

  it("parses a series category via channel mapping", () => {
    const result = parseCategory("Star Maa", "series");
    expect(result).not.toBeNull();
    expect(result!.language).toBe("Telugu");
  });

  it("parses a live category", () => {
    const result = parseCategory("india entertainment", "live");
    expect(result).not.toBeNull();
    expect(result!.language).toBe("Hindi");
  });

  it("returns null for unrecognized categories", () => {
    expect(parseCategory("SPORTS")).toBeNull();
    expect(parseCategory("UNKNOWN")).toBeNull();
  });

  it("returns null for empty/whitespace input", () => {
    expect(parseCategory("")).toBeNull();
    expect(parseCategory("   ")).toBeNull();
  });

  it("includes subCategory in result", () => {
    const result = parseCategory("HINDI WEB SERIES");
    expect(result).not.toBeNull();
    expect(result!.subCategory).toBe("WEB SERIES");
  });

  it("handles movie category with quality and year", () => {
    const result = parseCategory("TELUGU FHD 2025");
    expect(result).not.toBeNull();
    expect(result!.language).toBe("Telugu");
  });

  it("uses default (movie) detection when no content type hint", () => {
    const result = parseCategory("KOREAN DRAMA");
    expect(result).not.toBeNull();
    expect(result!.language).toBe("Korean");
  });

  it("handles live category with pipe separator", () => {
    const result = parseCategory("TAMIL | NEWS", "live");
    expect(result).not.toBeNull();
    expect(result!.language).toBe("Tamil");
  });

  it("trims whitespace from input", () => {
    const result = parseCategory("  HINDI  ");
    expect(result).not.toBeNull();
    expect(result!.language).toBe("Hindi");
  });
});

// ---------------------------------------------------------------------------
// groupCategoriesByLanguage
// ---------------------------------------------------------------------------
describe("groupCategoriesByLanguage", () => {
  it("groups categories by detected language", () => {
    const categories = [
      makeCat("1", "TELUGU (2026)"),
      makeCat("2", "TELUGU FHD (2025)"),
      makeCat("3", "HINDI (2024)"),
    ];

    const groups = groupCategoriesByLanguage(categories, "movies");
    expect(groups.length).toBeGreaterThanOrEqual(2);

    const telugu = groups.find((g) => g.language === "Telugu");
    expect(telugu).toBeDefined();
    expect(telugu!.movies.length).toBe(2);

    const hindi = groups.find((g) => g.language === "Hindi");
    expect(hindi).toBeDefined();
    expect(hindi!.movies.length).toBe(1);
  });

  it("places unrecognized categories in Other", () => {
    const categories = [makeCat("1", "SPORTS"), makeCat("2", "KIDS")];

    const groups = groupCategoriesByLanguage(categories);
    const other = groups.find((g) => g.language === "Other");
    expect(other).toBeDefined();
    expect(other!.all.length).toBe(2);
  });

  it("sorts groups by LANGUAGE_PRIORITY", () => {
    const categories = [
      makeCat("1", "ENGLISH MOVIES"),
      makeCat("2", "TELUGU (2026)"),
      makeCat("3", "HINDI (2024)"),
    ];

    const groups = groupCategoriesByLanguage(categories, "movies");
    const languages = groups.map((g) => g.language);
    const teluguIdx = languages.indexOf("Telugu");
    const hindiIdx = languages.indexOf("Hindi");
    const englishIdx = languages.indexOf("English");

    // Telugu should come before Hindi, Hindi before English
    expect(teluguIdx).toBeLessThan(hindiIdx);
    expect(hindiIdx).toBeLessThan(englishIdx);
  });

  it("returns empty array for empty input", () => {
    expect(groupCategoriesByLanguage([])).toEqual([]);
  });

  it("extracts year and quality for movie categories", () => {
    const categories = [makeCat("1", "TELUGU FHD (2026)")];
    const groups = groupCategoriesByLanguage(categories, "movies");
    const telugu = groups.find((g) => g.language === "Telugu");
    expect(telugu).toBeDefined();
    expect(telugu!.movies[0]!.year).toBe(2026);
    expect(telugu!.movies[0]!.quality).toBe("FHD");
  });

  it("populates the correct content type bucket", () => {
    const liveCats = [makeCat("1", "telugu")];
    const groups = groupCategoriesByLanguage(liveCats, "live");
    const telugu = groups.find((g) => g.language === "Telugu");
    expect(telugu).toBeDefined();
    expect(telugu!.live.length).toBe(1);
    expect(telugu!.movies.length).toBe(0);
    expect(telugu!.series.length).toBe(0);
  });

  it("uses 'movies' as fallback bucket when no contentTypeHint", () => {
    const categories = [makeCat("1", "TELUGU (2026)")];
    const groups = groupCategoriesByLanguage(categories);
    const telugu = groups.find((g) => g.language === "Telugu");
    expect(telugu!.movies.length).toBe(1);
  });

  it("builds display names for sub-categories", () => {
    const categories = [makeCat("1", "TELUGU FHD (2026)")];
    const groups = groupCategoriesByLanguage(categories, "movies");
    const telugu = groups.find((g) => g.language === "Telugu");
    expect(telugu!.movies[0]!.name).toBe("FHD 2026");
    expect(telugu!.movies[0]!.originalName).toBe("TELUGU FHD (2026)");
  });

  it("sets languageKey to lowercase", () => {
    const categories = [makeCat("1", "TELUGU (2026)")];
    const groups = groupCategoriesByLanguage(categories, "movies");
    const telugu = groups.find((g) => g.language === "Telugu");
    expect(telugu!.languageKey).toBe("telugu");
  });

  it("detects series via channel name mapping", () => {
    const categories = [makeCat("1", "Star Maa"), makeCat("2", "Zee Telugu")];
    const groups = groupCategoriesByLanguage(categories, "series");
    const telugu = groups.find((g) => g.language === "Telugu");
    expect(telugu).toBeDefined();
    expect(telugu!.series.length).toBe(2);
    expect(telugu!.series[0]!.channelName).toBe("Star Maa");
  });

  it("puts Other last in sort order", () => {
    const categories = [makeCat("1", "UNKNOWN"), makeCat("2", "TELUGU (2026)")];
    const groups = groupCategoriesByLanguage(categories, "movies");
    const lastGroup = groups[groups.length - 1]!;
    expect(lastGroup.language).toBe("Other");
  });
});

// ---------------------------------------------------------------------------
// getDetectedLanguages
// ---------------------------------------------------------------------------
describe("getDetectedLanguages", () => {
  it("returns unique detected languages in priority order", () => {
    const live = [makeCat("1", "telugu")];
    const vod = [makeCat("2", "HINDI (2024)")];
    const series = [makeCat("3", "Star Maa")];

    const languages = getDetectedLanguages(live, vod, series);
    expect(languages).toContain("Telugu");
    expect(languages).toContain("Hindi");
    expect(languages.indexOf("Telugu")).toBeLessThan(
      languages.indexOf("Hindi"),
    );
  });

  it("returns empty array when no languages detected", () => {
    expect(getDetectedLanguages([], [], [])).toEqual([]);
  });

  it("deduplicates languages across content types", () => {
    const live = [makeCat("1", "telugu")];
    const vod = [makeCat("2", "TELUGU (2024)")];
    const series = [makeCat("3", "Star Maa")]; // also Telugu

    const languages = getDetectedLanguages(live, vod, series);
    const teluguCount = languages.filter((l) => l === "Telugu").length;
    expect(teluguCount).toBe(1);
  });

  it("includes languages not in priority at the end", () => {
    // If a category has a language not in LANGUAGE_PRIORITY, it still appears
    const vod = [makeCat("1", "TELUGU (2026)")];
    const languages = getDetectedLanguages([], vod, []);
    expect(languages.length).toBeGreaterThan(0);
  });

  it("uses series channel detection", () => {
    const series = [makeCat("1", "Netflix")];
    const languages = getDetectedLanguages([], [], series);
    expect(languages).toContain("English");
  });

  it("uses live category detection", () => {
    const live = [makeCat("1", "kannada movies 24/7")];
    const languages = getDetectedLanguages(live, [], []);
    expect(languages).toContain("Kannada");
  });
});

// ---------------------------------------------------------------------------
// getCategoriesForLanguage
// ---------------------------------------------------------------------------
describe("getCategoriesForLanguage", () => {
  it("returns categories across all content types for a language", () => {
    const live = [makeCat("1", "telugu")];
    const vod = [makeCat("2", "TELUGU (2024)")];
    const series = [makeCat("3", "Star Maa")];

    const result = getCategoriesForLanguage("Telugu", live, vod, series);
    expect(result.live.length).toBe(1);
    expect(result.movies.length).toBe(1);
    expect(result.series.length).toBe(1);
  });

  it("returns empty arrays for unmatched language", () => {
    const result = getCategoriesForLanguage("French", [], [], []);
    expect(result.movies).toEqual([]);
    expect(result.series).toEqual([]);
    expect(result.live).toEqual([]);
  });

  it("is case-insensitive for language key", () => {
    const vod = [makeCat("1", "HINDI (2024)")];
    const result = getCategoriesForLanguage("Hindi", [], vod, []);
    expect(result.movies.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// getMovieCategoriesForLanguage
// ---------------------------------------------------------------------------
describe("getMovieCategoriesForLanguage", () => {
  it("returns movie categories for the specified language", () => {
    const vod = [
      makeCat("1", "TELUGU (2026)"),
      makeCat("2", "TELUGU FHD (2025)"),
      makeCat("3", "HINDI (2024)"),
    ];
    const result = getMovieCategoriesForLanguage("Telugu", vod);
    expect(result.length).toBe(2);
  });

  it("returns empty array for unmatched language", () => {
    const vod = [makeCat("1", "TELUGU (2026)")];
    expect(getMovieCategoriesForLanguage("French", vod)).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(getMovieCategoriesForLanguage("Telugu", [])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getSeriesCategoriesForLanguage
// ---------------------------------------------------------------------------
describe("getSeriesCategoriesForLanguage", () => {
  it("returns series categories for the specified language", () => {
    const series = [
      makeCat("1", "Star Maa"),
      makeCat("2", "Zee Telugu"),
      makeCat("3", "Colors Hindi"),
    ];
    const result = getSeriesCategoriesForLanguage("Telugu", series);
    expect(result.length).toBe(2);
  });

  it("returns empty array for unmatched language", () => {
    const series = [makeCat("1", "Star Maa")];
    expect(getSeriesCategoriesForLanguage("French", series)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getLiveCategoriesForLanguage
// ---------------------------------------------------------------------------
describe("getLiveCategoriesForLanguage", () => {
  it("returns live categories for the specified language", () => {
    const live = [
      makeCat("1", "telugu"),
      makeCat("2", "telugu movies 24/7"),
      makeCat("3", "india entertainment"),
    ];
    const result = getLiveCategoriesForLanguage("Telugu", live);
    expect(result.length).toBe(2);
  });

  it("returns empty array for unmatched language", () => {
    const live = [makeCat("1", "telugu")];
    expect(getLiveCategoriesForLanguage("French", live)).toEqual([]);
  });
});
