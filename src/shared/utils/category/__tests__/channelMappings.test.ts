import { describe, it, expect } from "vitest";
import {
  LANGUAGE_ALIASES,
  CHANNEL_TO_LANGUAGE,
  LIVE_CATEGORY_MAP,
  LANGUAGE_PRIORITY,
} from "../channelMappings";

// ---------------------------------------------------------------------------
// LANGUAGE_ALIASES data integrity
// ---------------------------------------------------------------------------
describe("LANGUAGE_ALIASES", () => {
  it("is a non-empty object", () => {
    expect(Object.keys(LANGUAGE_ALIASES).length).toBeGreaterThan(0);
  });

  it("has all keys in lowercase", () => {
    for (const key of Object.keys(LANGUAGE_ALIASES)) {
      expect(key).toBe(key.toLowerCase());
    }
  });

  it("has all values as title-cased canonical names", () => {
    for (const value of Object.values(LANGUAGE_ALIASES)) {
      expect(value[0]).toBe(value[0]!.toUpperCase());
    }
  });

  it("maps Telugu aliases correctly", () => {
    expect(LANGUAGE_ALIASES["telugu"]).toBe("Telugu");
    expect(LANGUAGE_ALIASES["tel"]).toBe("Telugu");
    expect(LANGUAGE_ALIASES["te"]).toBe("Telugu");
  });

  it("maps Hindi aliases correctly", () => {
    expect(LANGUAGE_ALIASES["hindi"]).toBe("Hindi");
    expect(LANGUAGE_ALIASES["hin"]).toBe("Hindi");
    expect(LANGUAGE_ALIASES["hi"]).toBe("Hindi");
    expect(LANGUAGE_ALIASES["indian"]).toBe("Hindi");
    expect(LANGUAGE_ALIASES["bollywood"]).toBe("Hindi");
  });

  it("maps English aliases correctly", () => {
    expect(LANGUAGE_ALIASES["english"]).toBe("English");
    expect(LANGUAGE_ALIASES["eng"]).toBe("English");
    expect(LANGUAGE_ALIASES["en"]).toBe("English");
  });

  it("maps common misspellings", () => {
    expect(LANGUAGE_ALIASES["gujrati"]).toBe("Gujarati");
    expect(LANGUAGE_ALIASES["bangla"]).toBe("Bengali");
  });

  it("maps south indian hindi dubbed to Hindi", () => {
    expect(LANGUAGE_ALIASES["south indian hindi dubbed"]).toBe("Hindi");
  });

  it("maps Pakistani separately from Urdu", () => {
    expect(LANGUAGE_ALIASES["pakistani"]).toBe("Pakistani");
    expect(LANGUAGE_ALIASES["urdu"]).toBe("Urdu");
  });

  it("has no undefined values", () => {
    for (const [key, value] of Object.entries(LANGUAGE_ALIASES)) {
      expect(
        value,
        `LANGUAGE_ALIASES["${key}"] should not be undefined`,
      ).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// CHANNEL_TO_LANGUAGE data integrity
// ---------------------------------------------------------------------------
describe("CHANNEL_TO_LANGUAGE", () => {
  it("is a non-empty object", () => {
    expect(Object.keys(CHANNEL_TO_LANGUAGE).length).toBeGreaterThan(0);
  });

  it("has all keys in lowercase", () => {
    for (const key of Object.keys(CHANNEL_TO_LANGUAGE)) {
      expect(key, `Key "${key}" should be lowercase`).toBe(key.toLowerCase());
    }
  });

  it("maps Telugu TV channels correctly", () => {
    expect(CHANNEL_TO_LANGUAGE["star maa"]).toBe("Telugu");
    expect(CHANNEL_TO_LANGUAGE["zee telugu"]).toBe("Telugu");
    expect(CHANNEL_TO_LANGUAGE["gemini"]).toBe("Telugu");
    expect(CHANNEL_TO_LANGUAGE["etv"]).toBe("Telugu");
    expect(CHANNEL_TO_LANGUAGE["aha"]).toBe("Telugu");
  });

  it("maps Hindi TV channels correctly", () => {
    expect(CHANNEL_TO_LANGUAGE["colors"]).toBe("Hindi");
    expect(CHANNEL_TO_LANGUAGE["star plus"]).toBe("Hindi");
    expect(CHANNEL_TO_LANGUAGE["zee tv"]).toBe("Hindi");
  });

  it("maps OTT platforms correctly", () => {
    expect(CHANNEL_TO_LANGUAGE["netflix"]).toBe("English");
    expect(CHANNEL_TO_LANGUAGE["amazon prime"]).toBe("English");
    expect(CHANNEL_TO_LANGUAGE["disney+hotstar"]).toBe("Hindi");
    expect(CHANNEL_TO_LANGUAGE["crunchyroll"]).toBe("Japanese");
  });

  it("maps Pakistani channels to Pakistani", () => {
    expect(CHANNEL_TO_LANGUAGE["hum tv"]).toBe("Pakistani");
    expect(CHANNEL_TO_LANGUAGE["geo tv"]).toBe("Pakistani");
    expect(CHANNEL_TO_LANGUAGE["ary digital"]).toBe("Pakistani");
  });

  it("maps English/international channels", () => {
    expect(CHANNEL_TO_LANGUAGE["bbc"]).toBe("English");
    expect(CHANNEL_TO_LANGUAGE["hbo"]).toBe("English");
    expect(CHANNEL_TO_LANGUAGE["espn"]).toBe("English");
  });

  it("has no undefined values", () => {
    for (const [key, value] of Object.entries(CHANNEL_TO_LANGUAGE)) {
      expect(value, `CHANNEL_TO_LANGUAGE["${key}"]`).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// LIVE_CATEGORY_MAP data integrity
// ---------------------------------------------------------------------------
describe("LIVE_CATEGORY_MAP", () => {
  it("is a non-empty object", () => {
    expect(Object.keys(LIVE_CATEGORY_MAP).length).toBeGreaterThan(0);
  });

  it("has all keys in lowercase", () => {
    for (const key of Object.keys(LIVE_CATEGORY_MAP)) {
      expect(key, `Key "${key}" should be lowercase`).toBe(key.toLowerCase());
    }
  });

  it("maps Telugu live categories", () => {
    expect(LIVE_CATEGORY_MAP["telugu"]).toBe("Telugu");
    expect(LIVE_CATEGORY_MAP["telugu movies 24/7"]).toBe("Telugu");
  });

  it("maps Hindi/Indian live categories", () => {
    expect(LIVE_CATEGORY_MAP["india entertainment"]).toBe("Hindi");
    expect(LIVE_CATEGORY_MAP["bollywood movies 24/7"]).toBe("Hindi");
  });

  it("maps English live categories", () => {
    expect(LIVE_CATEGORY_MAP["english news"]).toBe("English");
    expect(LIVE_CATEGORY_MAP["uk| entertainment"]).toBe("English");
  });

  it("maps india english movies to English, not Hindi", () => {
    expect(LIVE_CATEGORY_MAP["india english movies"]).toBe("English");
  });
});

// ---------------------------------------------------------------------------
// LANGUAGE_PRIORITY ordering
// ---------------------------------------------------------------------------
describe("LANGUAGE_PRIORITY", () => {
  it("is a non-empty array", () => {
    expect(LANGUAGE_PRIORITY.length).toBeGreaterThan(0);
  });

  it("starts with Telugu (user primary language)", () => {
    expect(LANGUAGE_PRIORITY[0]).toBe("Telugu");
  });

  it("has Hindi second and English third", () => {
    expect(LANGUAGE_PRIORITY[1]).toBe("Hindi");
    expect(LANGUAGE_PRIORITY[2]).toBe("English");
  });

  it("has no duplicates", () => {
    const unique = new Set(LANGUAGE_PRIORITY);
    expect(unique.size).toBe(LANGUAGE_PRIORITY.length);
  });

  it("includes all major Indian languages", () => {
    const indian = [
      "Telugu",
      "Hindi",
      "Tamil",
      "Kannada",
      "Malayalam",
      "Bengali",
      "Marathi",
      "Punjabi",
      "Gujarati",
    ];
    for (const lang of indian) {
      expect(LANGUAGE_PRIORITY, `Missing ${lang}`).toContain(lang);
    }
  });

  it("includes international languages", () => {
    const intl = [
      "Korean",
      "Japanese",
      "Arabic",
      "Spanish",
      "French",
      "German",
    ];
    for (const lang of intl) {
      expect(LANGUAGE_PRIORITY, `Missing ${lang}`).toContain(lang);
    }
  });

  it("all entries are title-cased", () => {
    for (const lang of LANGUAGE_PRIORITY) {
      expect(lang[0]).toBe(lang[0]!.toUpperCase());
    }
  });
});
