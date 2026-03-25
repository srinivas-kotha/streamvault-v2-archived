import { describe, it, expect } from "vitest";
import { formatDuration, formatTimeAgo } from "../formatDuration";

describe("formatDuration", () => {
  it("formats seconds into hours and minutes", () => {
    expect(formatDuration(3660)).toBe("1:01:00");
    expect(formatDuration(7200)).toBe("2:00:00");
    expect(formatDuration(5400)).toBe("1:30:00");
  });

  it("formats minutes-only durations", () => {
    expect(formatDuration(60)).toBe("1:00");
    expect(formatDuration(300)).toBe("5:00");
    expect(formatDuration(2700)).toBe("45:00");
  });

  it("returns 0:00 for 0", () => {
    expect(formatDuration(0)).toBe("0:00");
  });

  it("returns 0:00 for negative numbers", () => {
    expect(formatDuration(-10)).toBe("0:00");
    expect(formatDuration(-3600)).toBe("0:00");
  });

  it("returns 0:00 for NaN/undefined-like input", () => {
    expect(formatDuration(NaN)).toBe("0:00");
  });

  it("handles large numbers", () => {
    // 100 hours
    expect(formatDuration(360000)).toBe("100:00:00");
  });

  it("handles sub-minute durations (rounds down to 0m)", () => {
    expect(formatDuration(30)).toBe("0:30");
    expect(formatDuration(59)).toBe("0:59");
  });
});

describe("formatTimeAgo", () => {
  it('returns "Just now" for very recent timestamps', () => {
    const now = new Date().toISOString();
    expect(formatTimeAgo(now)).toBe("Just now");
  });

  it("returns minutes ago for < 1 hour", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
    expect(formatTimeAgo(fiveMinAgo)).toBe("5m ago");
  });

  it("returns hours ago for < 24 hours", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600000).toISOString();
    expect(formatTimeAgo(threeHoursAgo)).toBe("3h ago");
  });

  it("returns days ago for < 7 days", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
    expect(formatTimeAgo(twoDaysAgo)).toBe("2d ago");
  });
});
