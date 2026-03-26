import { describe, it, expect } from "vitest";
import { STALE_TIMES, GC_TIMES } from "../queryConfig";

// ---------------------------------------------------------------------------
// STALE_TIMES
// ---------------------------------------------------------------------------

describe("STALE_TIMES", () => {
  it("is an object with all required keys", () => {
    const requiredKeys = [
      "categories",
      "liveCategories",
      "streams",
      "liveStreams",
      "epg",
      "favorites",
      "history",
      "search",
      "auth",
      "default",
    ];
    for (const key of requiredKeys) {
      expect(STALE_TIMES).toHaveProperty(key);
    }
  });

  it("all values are positive numbers (milliseconds)", () => {
    for (const [key, value] of Object.entries(STALE_TIMES)) {
      expect(typeof value, `STALE_TIMES.${key} should be a number`).toBe(
        "number",
      );
      expect(value, `STALE_TIMES.${key} should be positive`).toBeGreaterThan(0);
    }
  });

  it("categories stale time is 6 hours (rarely change)", () => {
    expect(STALE_TIMES.categories).toBe(6 * 60 * 60 * 1000);
  });

  it("liveCategories stale time is 1 hour (matches backend cache)", () => {
    expect(STALE_TIMES.liveCategories).toBe(60 * 60 * 1000);
  });

  it("streams stale time is 2 hours", () => {
    expect(STALE_TIMES.streams).toBe(2 * 60 * 60 * 1000);
  });

  it("liveStreams stale time is 30 minutes", () => {
    expect(STALE_TIMES.liveStreams).toBe(30 * 60 * 1000);
  });

  it("epg stale time is 15 minutes (programme guide changes frequently)", () => {
    expect(STALE_TIMES.epg).toBe(15 * 60 * 1000);
  });

  it("favorites stale time is 5 minutes", () => {
    expect(STALE_TIMES.favorites).toBe(5 * 60 * 1000);
  });

  it("history stale time is 2 minutes (most volatile)", () => {
    expect(STALE_TIMES.history).toBe(2 * 60 * 1000);
  });

  it("search stale time is 1 minute", () => {
    expect(STALE_TIMES.search).toBe(60 * 1000);
  });

  it("auth stale time is 1 minute", () => {
    expect(STALE_TIMES.auth).toBe(60 * 1000);
  });

  it("default stale time is 5 minutes", () => {
    expect(STALE_TIMES.default).toBe(5 * 60 * 1000);
  });

  it("stale times decrease from categories to live to epg (freshness ordering)", () => {
    // VOD categories are least volatile, live streams more volatile, EPG most volatile
    expect(STALE_TIMES.categories).toBeGreaterThan(STALE_TIMES.liveCategories);
    expect(STALE_TIMES.streams).toBeGreaterThan(STALE_TIMES.liveStreams);
    expect(STALE_TIMES.liveStreams).toBeGreaterThan(STALE_TIMES.epg);
  });

  it("history stale time is shorter than favorites (watch state changes more often)", () => {
    expect(STALE_TIMES.history).toBeLessThan(STALE_TIMES.favorites);
  });
});

// ---------------------------------------------------------------------------
// GC_TIMES
// ---------------------------------------------------------------------------

describe("GC_TIMES", () => {
  it("has a default gc time", () => {
    expect(GC_TIMES).toHaveProperty("default");
  });

  it("default gc time is 30 minutes", () => {
    expect(GC_TIMES.default).toBe(30 * 60 * 1000);
  });

  it("gc time is a positive number", () => {
    expect(typeof GC_TIMES.default).toBe("number");
    expect(GC_TIMES.default).toBeGreaterThan(0);
  });

  it("gc time is longer than the default stale time (cache outlives freshness)", () => {
    expect(GC_TIMES.default).toBeGreaterThan(STALE_TIMES.default);
  });

  it("gc time is longer than the auth stale time", () => {
    expect(GC_TIMES.default).toBeGreaterThan(STALE_TIMES.auth);
  });
});
