import { describe, it, expect } from "vitest";
import {
  extractYear,
  extractQuality,
  isCamRelease,
  buildDisplayName,
  stripLanguagePrefix,
  escapeRegex,
  toTitleCase,
} from "../helpers";

// ---------------------------------------------------------------------------
// extractYear
// ---------------------------------------------------------------------------
describe("extractYear", () => {
  it("extracts year from parenthesized format", () => {
    expect(extractYear("(TELUGU) (2026)")).toBe(2026);
    expect(extractYear("HINDI (2024)")).toBe(2024);
  });

  it("extracts standalone 4-digit years", () => {
    expect(extractYear("TELUGU 2025 FHD")).toBe(2025);
  });

  it("returns undefined when no year is present", () => {
    expect(extractYear("TELUGU FHD")).toBeUndefined();
    expect(extractYear("")).toBeUndefined();
  });

  it("matches years in the 19xx and 20xx range", () => {
    expect(extractYear("CLASSICS 1999")).toBe(1999);
    expect(extractYear("OLD MOVIES 1980")).toBe(1980);
  });

  it("does not match non-year 4-digit numbers outside 19xx/20xx", () => {
    expect(extractYear("CHANNEL 1234")).toBeUndefined();
    expect(extractYear("CODE 3000")).toBeUndefined();
  });

  it("returns the first year if multiple exist", () => {
    expect(extractYear("2024 - 2026 MOVIES")).toBe(2024);
  });

  it("handles year at end of string", () => {
    expect(extractYear("Tamil 2023")).toBe(2023);
  });

  it("handles year at start of string", () => {
    expect(extractYear("2025 Telugu Movies")).toBe(2025);
  });

  it("returns undefined for partial year-like patterns", () => {
    expect(extractYear("HD 720p")).toBeUndefined();
  });

  it("handles whitespace-only input", () => {
    expect(extractYear("   ")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// extractQuality
// ---------------------------------------------------------------------------
describe("extractQuality", () => {
  it("extracts 4K quality", () => {
    expect(extractQuality("TELUGU 4K (2026)")).toBe("4K");
  });

  it("extracts FHD quality", () => {
    expect(extractQuality("INDIAN FHD (2024)")).toBe("FHD");
  });

  it("extracts HD quality", () => {
    expect(extractQuality("HINDI HD Movies")).toBe("HD");
  });

  it("extracts UHD quality", () => {
    expect(extractQuality("UHD Content")).toBe("UHD");
  });

  it("extracts BluRay quality (case-insensitive)", () => {
    expect(extractQuality("Telugu BluRay 2024")).toBe("BLURAY");
    expect(extractQuality("Hindi Blu-Ray")).toBe("BLU-RAY");
  });

  it("extracts WEB-DL quality", () => {
    expect(extractQuality("WEB-DL 2025")).toBe("WEB-DL");
    expect(extractQuality("WEBDL Rip")).toBe("WEBDL");
  });

  it("returns undefined when no quality tag", () => {
    expect(extractQuality("TELUGU (2026)")).toBeUndefined();
    expect(extractQuality("")).toBeUndefined();
  });

  it("returns the first quality tag if multiple exist", () => {
    expect(extractQuality("4K FHD Movies")).toBe("4K");
  });

  it("is case-insensitive", () => {
    expect(extractQuality("telugu fhd")).toBe("FHD");
    expect(extractQuality("hd movies")).toBe("HD");
  });

  it("does not match partial words", () => {
    expect(extractQuality("SHADE")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// isCamRelease
// ---------------------------------------------------------------------------
describe("isCamRelease", () => {
  it("returns true for (CAM) indicator", () => {
    expect(isCamRelease("TELUGU (2025) (CAM)")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isCamRelease("Telugu (cam) 2024")).toBe(true);
    expect(isCamRelease("Hindi (Cam)")).toBe(true);
  });

  it("returns false when no CAM indicator", () => {
    expect(isCamRelease("TELUGU FHD 2025")).toBe(false);
    expect(isCamRelease("")).toBe(false);
  });

  it("does not match CAM without parens", () => {
    expect(isCamRelease("CAM RELEASE")).toBe(false);
    expect(isCamRelease("CAMERA WORK")).toBe(false);
  });

  it("matches (CAM) anywhere in the string", () => {
    expect(isCamRelease("(CAM) TELUGU 2024")).toBe(true);
    expect(isCamRelease("MOVIES (CAM) HD")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// escapeRegex
// ---------------------------------------------------------------------------
describe("escapeRegex", () => {
  it("escapes special regex characters", () => {
    expect(escapeRegex("a+b")).toBe("a\\+b");
    expect(escapeRegex("hello.world")).toBe("hello\\.world");
    expect(escapeRegex("(test)")).toBe("\\(test\\)");
    expect(escapeRegex("[abc]")).toBe("\\[abc\\]");
  });

  it("escapes all special chars: . * + ? ^ $ { } ( ) | [ ] \\", () => {
    expect(escapeRegex(".*+?^${}()|[]\\")).toBe(
      "\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\",
    );
  });

  it("returns plain strings unchanged", () => {
    expect(escapeRegex("hello")).toBe("hello");
    expect(escapeRegex("")).toBe("");
  });

  it("handles mixed content", () => {
    expect(escapeRegex("a&e")).toBe("a&e");
    expect(escapeRegex("apple tv+")).toBe("apple tv\\+");
  });
});

// ---------------------------------------------------------------------------
// toTitleCase
// ---------------------------------------------------------------------------
describe("toTitleCase", () => {
  it("capitalizes first letter of each word", () => {
    expect(toTitleCase("star maa")).toBe("Star Maa");
    expect(toTitleCase("zee telugu")).toBe("Zee Telugu");
  });

  it("keeps short all-caps acronyms when already uppercase", () => {
    // The function only preserves acronyms that are ALREADY uppercase
    expect(toTitleCase("ETV")).toBe("ETV");
    expect(toTitleCase("HBO")).toBe("HBO");
    expect(toTitleCase("BBC")).toBe("BBC");
  });

  it("does not auto-uppercase lowercase short words", () => {
    // "etv" is lowercase, so it gets title-cased, not treated as acronym
    expect(toTitleCase("etv")).toBe("Etv");
    expect(toTitleCase("hbo")).toBe("Hbo");
  });

  it("lowercases longer words even if uppercase", () => {
    expect(toTitleCase("STAR")).toBe("Star");
    expect(toTitleCase("HELLO WORLD")).toBe("Hello World");
  });

  it("preserves short uppercase words in mixed input", () => {
    expect(toTitleCase("STAR MAA")).toBe("Star MAA");
  });

  it("handles single words", () => {
    expect(toTitleCase("netflix")).toBe("Netflix");
    expect(toTitleCase("ABC")).toBe("ABC");
  });

  it("handles empty string", () => {
    expect(toTitleCase("")).toBe("");
  });

  it("handles mixed case input", () => {
    expect(toTitleCase("star PLUS")).toBe("Star Plus");
  });

  it("handles extra whitespace", () => {
    expect(toTitleCase("star  maa")).toBe("Star Maa");
  });
});

// ---------------------------------------------------------------------------
// stripLanguagePrefix
// ---------------------------------------------------------------------------
describe("stripLanguagePrefix", () => {
  it("strips language keyword from name", () => {
    const result = stripLanguagePrefix("TELUGU FHD 2025", "Telugu");
    // After stripping language, year, quality => remaining or "General"
    expect(result).toBe("General");
  });

  it("strips parenthesized language", () => {
    const result = stripLanguagePrefix("(TELUGU) Movies", "Telugu");
    expect(result).toBe("Movies");
  });

  it('returns "General" when nothing left after stripping', () => {
    expect(stripLanguagePrefix("TELUGU", "Telugu")).toBe("General");
    expect(stripLanguagePrefix("(HINDI)", "Hindi")).toBe("General");
  });

  it("strips all aliases for a language", () => {
    // "bollywood" is an alias for Hindi
    const result = stripLanguagePrefix("BOLLYWOOD COMEDY", "Hindi");
    expect(result).toBe("COMEDY");
  });

  it("strips years and quality tags", () => {
    const result = stripLanguagePrefix("TELUGU 4K 2026", "Telugu");
    expect(result).toBe("General");
  });

  it("strips CAM tag", () => {
    const result = stripLanguagePrefix("TELUGU (CAM) 2025", "Telugu");
    expect(result).toBe("General");
  });

  it("preserves descriptive words", () => {
    const result = stripLanguagePrefix("HINDI WEB SERIES", "Hindi");
    expect(result).toBe("WEB SERIES");
  });

  it("handles empty string", () => {
    expect(stripLanguagePrefix("", "Telugu")).toBe("General");
  });
});

// ---------------------------------------------------------------------------
// buildDisplayName
// ---------------------------------------------------------------------------
describe("buildDisplayName", () => {
  it("returns channel name when provided", () => {
    expect(
      buildDisplayName(
        "Star Maa HD",
        "Telugu",
        undefined,
        undefined,
        undefined,
        "Star Maa",
      ),
    ).toBe("Star Maa");
  });

  it("combines quality and year", () => {
    expect(buildDisplayName("TELUGU FHD (2026)", "Telugu", 2026, "FHD")).toBe(
      "FHD 2026",
    );
  });

  it("returns year only when no quality", () => {
    expect(buildDisplayName("TELUGU (2025)", "Telugu", 2025)).toBe("2025");
  });

  it("returns quality only when no year", () => {
    expect(buildDisplayName("TELUGU FHD", "Telugu", undefined, "FHD")).toBe(
      "FHD",
    );
  });

  it("includes CAM tag", () => {
    expect(
      buildDisplayName("TELUGU (2025) (CAM)", "Telugu", 2025, undefined, true),
    ).toBe("2025 CAM");
  });

  it('returns "All" when no metadata parts', () => {
    expect(buildDisplayName("TELUGU", "Telugu")).toBe("All");
  });

  it("returns stripped descriptor when no quality/year/cam", () => {
    expect(buildDisplayName("HINDI WEB SERIES", "Hindi")).toBe("WEB SERIES");
  });

  it("combines all three: quality + year + CAM", () => {
    expect(
      buildDisplayName("TELUGU 4K 2026 (CAM)", "Telugu", 2026, "4K", true),
    ).toBe("4K 2026 CAM");
  });
});
