import { describe, it, expect } from "vitest";
import {
  detectLanguageFromName,
  detectLanguageFromSeriesName,
  detectLanguageFromLiveName,
} from "../languageDetector";

// ---------------------------------------------------------------------------
// detectLanguageFromName
// ---------------------------------------------------------------------------
describe("detectLanguageFromName", () => {
  it("detects exact match on full name", () => {
    expect(detectLanguageFromName("telugu")).toBe("Telugu");
    expect(detectLanguageFromName("hindi")).toBe("Hindi");
    expect(detectLanguageFromName("english")).toBe("English");
  });

  it("is case-insensitive", () => {
    expect(detectLanguageFromName("TELUGU")).toBe("Telugu");
    expect(detectLanguageFromName("Telugu")).toBe("Telugu");
    expect(detectLanguageFromName("tElUgU")).toBe("Telugu");
  });

  it("trims whitespace", () => {
    expect(detectLanguageFromName("  telugu  ")).toBe("Telugu");
  });

  it("detects leading paren format: (TELUGU) (2026)", () => {
    expect(detectLanguageFromName("(TELUGU) (2026)")).toBe("Telugu");
    expect(detectLanguageFromName("(HINDI) FHD")).toBe("Hindi");
  });

  it("detects separator format: TAMIL | NEWS", () => {
    expect(detectLanguageFromName("TAMIL | NEWS")).toBe("Tamil");
    expect(detectLanguageFromName("MALAYALAM | MOVIES")).toBe("Malayalam");
  });

  it("detects separator with different delimiters", () => {
    expect(detectLanguageFromName("TAMIL - MOVIES")).toBe("Tamil");
    expect(detectLanguageFromName("HINDI: DRAMA")).toBe("Hindi");
  });

  it("detects composite patterns", () => {
    expect(detectLanguageFromName("SOUTH INDIAN HINDI DUBBED")).toBe("Hindi");
    expect(detectLanguageFromName("ENGLISH HINDI DUBBED")).toBe("Hindi");
    expect(detectLanguageFromName("NETFLIX MOVIES HINDI")).toBe("Hindi");
    expect(detectLanguageFromName("NETFLIX MOVIES ENGLISH")).toBe("English");
    expect(detectLanguageFromName("HINDI OLD MOVIES")).toBe("Hindi");
    expect(detectLanguageFromName("BOLLYWOOD COMEDY")).toBe("Hindi");
  });

  it("detects keyword match at word boundary", () => {
    expect(detectLanguageFromName("TELUGU FHD 2025")).toBe("Telugu");
    expect(detectLanguageFromName("INDIAN FHD (2024)")).toBe("Hindi");
    expect(detectLanguageFromName("KOREAN DRAMA")).toBe("Korean");
  });

  it("returns null for unrecognized names", () => {
    expect(detectLanguageFromName("UNKNOWN CATEGORY")).toBeNull();
    expect(detectLanguageFromName("SPORTS")).toBeNull();
    expect(detectLanguageFromName("")).toBeNull();
  });

  it("returns null for empty/whitespace input", () => {
    expect(detectLanguageFromName("")).toBeNull();
    expect(detectLanguageFromName("   ")).toBeNull();
  });

  it("uses alias codes", () => {
    expect(detectLanguageFromName("te")).toBe("Telugu");
    expect(detectLanguageFromName("hi")).toBe("Hindi");
    expect(detectLanguageFromName("en")).toBe("English");
  });

  it("detects misspellings via aliases", () => {
    expect(detectLanguageFromName("GUJRATI MOVIES")).toBe("Gujarati");
  });

  it("detects bollywood as Hindi", () => {
    expect(detectLanguageFromName("bollywood")).toBe("Hindi");
    expect(detectLanguageFromName("BOLLYWOOD BEUTIES")).toBe("Hindi");
  });

  it("prioritizes longer composite patterns over short keywords", () => {
    // "south indian hindi dubbed" should match Hindi, not just "indian"
    expect(detectLanguageFromName("SOUTH INDIAN HINDI DUBBED MOVIES")).toBe(
      "Hindi",
    );
  });
});

// ---------------------------------------------------------------------------
// detectLanguageFromSeriesName
// ---------------------------------------------------------------------------
describe("detectLanguageFromSeriesName", () => {
  it("matches exact channel names", () => {
    const result = detectLanguageFromSeriesName("Star Maa");
    expect(result.language).toBe("Telugu");
    expect(result.channelName).toBe("Star Maa");
  });

  it("is case-insensitive for channel matching", () => {
    const result = detectLanguageFromSeriesName("STAR MAA");
    expect(result.language).toBe("Telugu");
    expect(result.channelName).toBe("Star Maa");
  });

  it("strips trailing category IDs like (453)", () => {
    const result = detectLanguageFromSeriesName("Star Maa (453)");
    expect(result.language).toBe("Telugu");
    expect(result.channelName).toBe("Star Maa");
  });

  it("tries progressively shorter prefixes", () => {
    // "STAR MAA HD" -> tries "star maa hd" (no match), then "star maa" (match)
    const result = detectLanguageFromSeriesName("STAR MAA HD");
    expect(result.language).toBe("Telugu");
    expect(result.channelName).toBe("Star Maa");
  });

  it("falls back to keyword detection for unmatched channels", () => {
    // "Unknown Telugu Show" is not in channel map, falls back to keyword
    const result = detectLanguageFromSeriesName("Unknown Telugu Show");
    expect(result.language).toBe("Telugu");
    expect(result.channelName).toBeNull();
  });

  it("matches channels that look like keyword patterns", () => {
    // "Tamil Tv Series" is actually in the channel map
    const result = detectLanguageFromSeriesName("Tamil Tv Series");
    expect(result.language).toBe("Tamil");
    expect(result.channelName).toBe("Tamil Tv Series");
  });

  it("matches OTT platforms", () => {
    const result = detectLanguageFromSeriesName("Netflix");
    expect(result.language).toBe("English");
    expect(result.channelName).toBe("Netflix");
  });

  it("matches Hindi channels", () => {
    const result = detectLanguageFromSeriesName("Colors Hindi");
    expect(result.language).toBe("Hindi");
    expect(result.channelName).toBe("Colors Hindi");
  });

  it("matches Pakistani channels", () => {
    const result = detectLanguageFromSeriesName("Hum TV");
    expect(result.language).toBe("Pakistani");
    // toTitleCase: "hum" (3 chars, lowercase) -> "Hum", "tv" (2 chars, lowercase) -> "Tv"
    expect(result.channelName).toBe("Hum Tv");
  });

  it("returns null for completely unrecognized names", () => {
    const result = detectLanguageFromSeriesName("Random Unknown Channel");
    expect(result.language).toBeNull();
    expect(result.channelName).toBeNull();
  });

  it("returns null for empty string", () => {
    const result = detectLanguageFromSeriesName("");
    expect(result.language).toBeNull();
    expect(result.channelName).toBeNull();
  });

  it("handles whitespace-padded input", () => {
    const result = detectLanguageFromSeriesName("  Zee Telugu  ");
    expect(result.language).toBe("Telugu");
    expect(result.channelName).toBe("Zee Telugu");
  });
});

// ---------------------------------------------------------------------------
// detectLanguageFromLiveName
// ---------------------------------------------------------------------------
describe("detectLanguageFromLiveName", () => {
  it("matches exact live category names", () => {
    expect(detectLanguageFromLiveName("telugu")).toBe("Telugu");
    expect(detectLanguageFromLiveName("india entertainment")).toBe("Hindi");
    expect(detectLanguageFromLiveName("english news")).toBe("English");
  });

  it("is case-insensitive", () => {
    expect(detectLanguageFromLiveName("TELUGU")).toBe("Telugu");
    expect(detectLanguageFromLiveName("India Entertainment")).toBe("Hindi");
  });

  it("matches 24/7 category patterns", () => {
    expect(detectLanguageFromLiveName("telugu movies 24/7")).toBe("Telugu");
    expect(detectLanguageFromLiveName("bollywood movies 24/7")).toBe("Hindi");
    expect(detectLanguageFromLiveName("english movies 24/7")).toBe("English");
  });

  it("matches Tamil pipe-separated categories", () => {
    expect(detectLanguageFromLiveName("tamil | news")).toBe("Tamil");
    expect(detectLanguageFromLiveName("tamil | entertainment")).toBe("Tamil");
  });

  it("matches Malayalam pipe-separated categories", () => {
    expect(detectLanguageFromLiveName("malayalam | movies")).toBe("Malayalam");
    expect(detectLanguageFromLiveName("malayalam | news")).toBe("Malayalam");
  });

  it("falls back to keyword detection", () => {
    expect(detectLanguageFromLiveName("KOREAN DRAMA LIVE")).toBe("Korean");
    expect(detectLanguageFromLiveName("FRENCH CHANNELS")).toBe("French");
  });

  it("returns null for unrecognized live categories", () => {
    expect(detectLanguageFromLiveName("SPORTS LIVE")).toBeNull();
    expect(detectLanguageFromLiveName("")).toBeNull();
  });

  it("correctly distinguishes india english movies from hindi", () => {
    expect(detectLanguageFromLiveName("india english movies")).toBe("English");
  });

  it("trims whitespace", () => {
    expect(detectLanguageFromLiveName("  telugu  ")).toBe("Telugu");
  });
});
