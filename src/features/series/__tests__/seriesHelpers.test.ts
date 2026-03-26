import { describe, it, expect } from "vitest";
import {
  getChannelIdsForLanguage,
  getSupportedLanguages,
  getChannelName,
  getChannelLanguage,
} from "../api";

// ---------------------------------------------------------------------------
// getChannelIdsForLanguage
// ---------------------------------------------------------------------------

describe("getChannelIdsForLanguage", () => {
  it("returns Telugu channel IDs", () => {
    const ids = getChannelIdsForLanguage("Telugu");
    // Known Telugu channels in the map
    expect(ids).toContain("453"); // STAR MAA
    expect(ids).toContain("455"); // ZEE TELUGU
    expect(ids).toContain("469"); // AHA
  });

  it("includes Multi/OTT channel IDs when fetching Telugu", () => {
    const ids = getChannelIdsForLanguage("Telugu");
    // OTT platforms like Netflix, Hotstar are Multi and included
    expect(ids).toContain("106"); // NETFLIX
    expect(ids).toContain("102"); // DISNEY+ HOTSTAR
  });

  it("returns Hindi channel IDs", () => {
    const ids = getChannelIdsForLanguage("Hindi");
    expect(ids).toContain("442"); // COLORS HINDI
    expect(ids).toContain("444"); // STAR PLUS
    expect(ids).toContain("445"); // ZEE TV
  });

  it("includes Multi/OTT channels for Hindi too", () => {
    const ids = getChannelIdsForLanguage("Hindi");
    expect(ids).toContain("106"); // NETFLIX (Multi)
    expect(ids).toContain("102"); // DISNEY+ HOTSTAR (Multi)
  });

  it("is case-insensitive", () => {
    const lower = getChannelIdsForLanguage("telugu");
    const upper = getChannelIdsForLanguage("TELUGU");
    const title = getChannelIdsForLanguage("Telugu");
    expect(lower.sort()).toEqual(title.sort());
    expect(upper.sort()).toEqual(title.sort());
  });

  it("returns only Multi/OTT channel IDs for an unknown language (Multi always included)", () => {
    // The implementation always includes Multi channels regardless of language.
    // For an unknown language like "Klingon" there are no language-specific channels,
    // so only the shared Multi/OTT channels (Netflix, Hotstar, etc.) are returned.
    const ids = getChannelIdsForLanguage("Klingon");
    // All returned IDs should be Multi channels
    const multiIds = ["102", "104", "105", "106", "310"];
    for (const id of ids) {
      expect(multiIds).toContain(id);
    }
    // No Telugu/Hindi-only channels should be included
    expect(ids).not.toContain("453"); // Star Maa (Telugu)
    expect(ids).not.toContain("442"); // Colors Hindi (Hindi)
  });

  it("returns an array (never null or undefined)", () => {
    const result = getChannelIdsForLanguage("Telugu");
    expect(Array.isArray(result)).toBe(true);
    expect(result).not.toBeNull();
  });

  it("does not return duplicate IDs", () => {
    const ids = getChannelIdsForLanguage("Telugu");
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("Telugu-specific channel IDs are not in Hindi results and vice versa", () => {
    const teluguIds = getChannelIdsForLanguage("Telugu");
    const hindiIds = getChannelIdsForLanguage("Hindi");

    // Telugu-only channels should not appear in Hindi results
    const teluguOnlyIds = ["453", "455", "469", "493", "494", "552"];
    for (const id of teluguOnlyIds) {
      expect(
        hindiIds,
        `Hindi IDs should not contain Telugu channel ${id}`,
      ).not.toContain(id);
    }

    // Hindi-only channels should not appear in Telugu results
    const hindiOnlyIds = ["442", "443", "444", "445", "446", "447"];
    for (const id of hindiOnlyIds) {
      expect(
        teluguIds,
        `Telugu IDs should not contain Hindi channel ${id}`,
      ).not.toContain(id);
    }
  });
});

// ---------------------------------------------------------------------------
// getSupportedLanguages
// ---------------------------------------------------------------------------

describe("getSupportedLanguages", () => {
  it("returns an array of supported languages", () => {
    const langs = getSupportedLanguages();
    expect(Array.isArray(langs)).toBe(true);
    expect(langs.length).toBeGreaterThan(0);
  });

  it("includes Telugu and Hindi as the primary supported languages", () => {
    const langs = getSupportedLanguages();
    expect(langs).toContain("Telugu");
    expect(langs).toContain("Hindi");
  });

  it("returns Telugu before Hindi (user priority order)", () => {
    const langs = getSupportedLanguages();
    const teluguIdx = langs.indexOf("Telugu");
    const hindiIdx = langs.indexOf("Hindi");
    expect(teluguIdx).toBeLessThan(hindiIdx);
  });

  it("does not include Multi (internal marker, not a display language)", () => {
    const langs = getSupportedLanguages();
    expect(langs).not.toContain("Multi");
  });

  it("contains only unique values", () => {
    const langs = getSupportedLanguages();
    const unique = new Set(langs);
    expect(unique.size).toBe(langs.length);
  });
});

// ---------------------------------------------------------------------------
// getChannelName
// ---------------------------------------------------------------------------

describe("getChannelName", () => {
  it("returns channel name for Star Maa", () => {
    expect(getChannelName("453")).toBe("Star Maa");
  });

  it("returns channel name for Zee Telugu", () => {
    expect(getChannelName("455")).toBe("Zee Telugu");
  });

  it("returns channel name for Aha", () => {
    expect(getChannelName("469")).toBe("Aha");
  });

  it("returns channel name for Colors Hindi", () => {
    expect(getChannelName("442")).toBe("Colors Hindi");
  });

  it("returns channel name for Netflix", () => {
    expect(getChannelName("106")).toBe("Netflix");
  });

  it("returns channel name for Disney+ Hotstar", () => {
    expect(getChannelName("102")).toBe("Disney+ Hotstar");
  });

  it("returns fallback 'Channel <id>' for unknown IDs", () => {
    expect(getChannelName("99999")).toBe("Channel 99999");
  });

  it("returns fallback for empty string ID", () => {
    expect(getChannelName("")).toBe("Channel ");
  });

  it("never returns undefined or null", () => {
    const result = getChannelName("unknown-id");
    expect(result).not.toBeNull();
    expect(result).not.toBeUndefined();
    expect(typeof result).toBe("string");
  });
});

// ---------------------------------------------------------------------------
// getChannelLanguage
// ---------------------------------------------------------------------------

describe("getChannelLanguage", () => {
  it("returns Telugu for Star Maa (453)", () => {
    expect(getChannelLanguage("453")).toBe("Telugu");
  });

  it("returns Telugu for Zee Telugu (455)", () => {
    expect(getChannelLanguage("455")).toBe("Telugu");
  });

  it("returns Hindi for Colors Hindi (442)", () => {
    expect(getChannelLanguage("442")).toBe("Hindi");
  });

  it("returns Hindi for Star Plus (444)", () => {
    expect(getChannelLanguage("444")).toBe("Hindi");
  });

  it("returns Multi for Netflix (shared OTT)", () => {
    expect(getChannelLanguage("106")).toBe("Multi");
  });

  it("returns Multi for Disney+ Hotstar (102)", () => {
    expect(getChannelLanguage("102")).toBe("Multi");
  });

  it("returns null for unknown category IDs", () => {
    expect(getChannelLanguage("99999")).toBeNull();
  });

  it("returns null for empty string ID", () => {
    expect(getChannelLanguage("")).toBeNull();
  });

  it("returns a string for every known channel ID", () => {
    const knownIds = [
      "453",
      "455",
      "469",
      "493",
      "494",
      "552",
      "442",
      "444",
      "445",
    ];
    for (const id of knownIds) {
      const result = getChannelLanguage(id);
      expect(
        typeof result,
        `getChannelLanguage("${id}") should be a string`,
      ).toBe("string");
    }
  });
});
