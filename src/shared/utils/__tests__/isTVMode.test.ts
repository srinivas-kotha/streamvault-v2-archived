/**
 * Sprint 7 — isTVMode detection tests
 *
 * Verifies TV mode is detected from user agent strings, URL params, and
 * localStorage overrides. Confirms display-mode: standalone does NOT
 * trigger TV mode (the bug that was fixed).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// We must reset modules between tests because isTVMode is computed at
// module evaluation time (top-level const).

let originalUA: PropertyDescriptor | undefined;

beforeEach(() => {
  vi.resetModules();
  originalUA = Object.getOwnPropertyDescriptor(navigator, "userAgent");
  // Reset localStorage
  localStorage.clear();
});

afterEach(() => {
  if (originalUA) {
    Object.defineProperty(navigator, "userAgent", originalUA);
  } else {
    // Restore default userAgent by deleting the override
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (navigator as any).__userAgentOverride;
  }
  vi.restoreAllMocks();
});

function setUserAgent(ua: string) {
  Object.defineProperty(navigator, "userAgent", {
    value: ua,
    configurable: true,
    writable: true,
  });
}

function setSearchParams(params: string) {
  Object.defineProperty(window, "location", {
    value: {
      ...window.location,
      search: params,
    },
    writable: true,
    configurable: true,
  });
}

async function getIsTVMode(): Promise<boolean> {
  const mod = await import("../isTVMode");
  return mod.isTVMode;
}

describe("isTVMode", () => {
  it("returns false for standard desktop Chrome UA", async () => {
    setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    setSearchParams("");
    const result = await getIsTVMode();
    expect(result).toBe(false);
  });

  it("returns true for Fire TV UA containing AFT", async () => {
    setUserAgent(
      "Mozilla/5.0 (Linux; Android 9; AFTSSS Build/PS7233) AppleWebKit/537.36 (KHTML, like Gecko) Silk/120.4.1 like Chrome/120.0.6099.230 Mobile Safari/537.36",
    );
    setSearchParams("");
    const result = await getIsTVMode();
    expect(result).toBe(true);
  });

  it("returns true for Amazon Silk browser UA", async () => {
    setUserAgent(
      "Mozilla/5.0 (Linux; Android 9; AFTMM Build/PS7255) AppleWebKit/537.36 (KHTML, like Gecko) Silk/120.3.2 like Chrome/120.0.6099.230 Safari/537.36 Amazon",
    );
    setSearchParams("");
    const result = await getIsTVMode();
    expect(result).toBe(true);
  });

  it("returns true for Samsung Tizen UA", async () => {
    setUserAgent(
      "Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.93 TV Safari/537.36",
    );
    setSearchParams("");
    const result = await getIsTVMode();
    expect(result).toBe(true);
  });

  it("returns true for LG webOS UA", async () => {
    setUserAgent(
      "Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36 webOS",
    );
    setSearchParams("");
    const result = await getIsTVMode();
    expect(result).toBe(true);
  });

  it("does NOT return true for display-mode: standalone on desktop (bug fix)", async () => {
    // The module should NOT check matchMedia('(display-mode: standalone)')
    // for TV detection — that was the bug causing false positives on desktop PWA
    setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    setSearchParams("");

    // Mock matchMedia to return standalone = true
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn() }),
    );

    const result = await getIsTVMode();
    expect(result).toBe(false);
  });

  it("respects ?tv=1 URL param override", async () => {
    setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    setSearchParams("?tv=1");
    const result = await getIsTVMode();
    expect(result).toBe(true);
  });

  it("respects sv_tv_mode localStorage override", async () => {
    setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    setSearchParams("");
    localStorage.setItem("sv_tv_mode", "1");
    const result = await getIsTVMode();
    expect(result).toBe(true);
  });

  it("persists ?tv=1 URL param to localStorage", async () => {
    setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    setSearchParams("?tv=1");
    await getIsTVMode();
    expect(localStorage.getItem("sv_tv_mode")).toBe("1");
  });

  it("returns false when ?tv=0 and no TV UA", async () => {
    setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    setSearchParams("?tv=0");
    const result = await getIsTVMode();
    expect(result).toBe(false);
  });
});
