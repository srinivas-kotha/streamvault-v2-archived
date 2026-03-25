import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { detectDevice, applyTVModeClass } from "../deviceDetection";
import type { DeviceInfo } from "../deviceDetection";

// Store original values
const originalNavigator = window.navigator;
const originalInnerWidth = window.innerWidth;

function mockUserAgent(ua: string) {
  Object.defineProperty(window, "navigator", {
    value: { ...originalNavigator, userAgent: ua, maxTouchPoints: 0 },
    writable: true,
    configurable: true,
  });
}

function mockMobileDevice(ua: string) {
  Object.defineProperty(window, "navigator", {
    value: { ...originalNavigator, userAgent: ua, maxTouchPoints: 5 },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, "innerWidth", {
    value: 375,
    writable: true,
    configurable: true,
  });
}

afterEach(() => {
  Object.defineProperty(window, "navigator", {
    value: originalNavigator,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, "innerWidth", {
    value: originalInnerWidth,
    writable: true,
    configurable: true,
  });
  document.documentElement.classList.remove("tv-mode");
});

// ---------------------------------------------------------------------------
// detectDevice
// ---------------------------------------------------------------------------
describe("detectDevice", () => {
  it("detects Fire TV from AFT in user agent", () => {
    mockUserAgent(
      "Mozilla/5.0 (Linux; Android 9; AFTT Build/NS6297) AppleWebKit/537.36",
    );
    const result = detectDevice();
    expect(result.deviceType).toBe("firetv");
    expect(result.isTVMode).toBe(true);
    expect(result.isMobile).toBe(false);
  });

  it("detects Fire TV from Amazon in user agent", () => {
    mockUserAgent("Mozilla/5.0 (Linux; Android 11; Amazon KFTRWI)");
    const result = detectDevice();
    expect(result.deviceType).toBe("firetv");
    expect(result.isTVMode).toBe(true);
  });

  it("detects Samsung Tizen", () => {
    mockUserAgent(
      "Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.5) AppleWebKit/537.36",
    );
    const result = detectDevice();
    expect(result.deviceType).toBe("tizen");
    expect(result.isTVMode).toBe(true);
    expect(result.isMobile).toBe(false);
  });

  it("detects LG webOS (Web0S variant)", () => {
    mockUserAgent(
      "Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 Chrome/87.0",
    );
    const result = detectDevice();
    expect(result.deviceType).toBe("webos");
    expect(result.isTVMode).toBe(true);
  });

  it("detects LG webOS (webOS variant)", () => {
    mockUserAgent("Mozilla/5.0 (webOS; SmartTV/8.0)");
    const result = detectDevice();
    expect(result.deviceType).toBe("webos");
    expect(result.isTVMode).toBe(true);
  });

  it("detects mobile when narrow viewport and touch supported", () => {
    mockMobileDevice(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit",
    );
    const result = detectDevice();
    expect(result.deviceType).toBe("mobile");
    expect(result.isMobile).toBe(true);
    expect(result.isTVMode).toBe(false);
  });

  it("defaults to desktop for standard browser", () => {
    mockUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    );
    const result = detectDevice();
    expect(result.deviceType).toBe("desktop");
    expect(result.isTVMode).toBe(false);
    expect(result.isMobile).toBe(false);
  });

  it("prioritizes Fire TV over mobile even with narrow viewport", () => {
    Object.defineProperty(window, "navigator", {
      value: {
        ...originalNavigator,
        userAgent:
          "Mozilla/5.0 (Linux; Android 9; AFTT Build/NS6297) AppleWebKit/537.36",
        maxTouchPoints: 5,
      },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "innerWidth", {
      value: 375,
      writable: true,
      configurable: true,
    });
    const result = detectDevice();
    expect(result.deviceType).toBe("firetv");
  });

  it("returns consistent DeviceInfo shape", () => {
    mockUserAgent("Mozilla/5.0 (generic browser)");
    const result = detectDevice();
    expect(result).toHaveProperty("deviceType");
    expect(result).toHaveProperty("isTVMode");
    expect(result).toHaveProperty("isMobile");
  });

  it("does not detect desktop as TV mode", () => {
    mockUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)");
    const result = detectDevice();
    expect(result.isTVMode).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// applyTVModeClass
// ---------------------------------------------------------------------------
describe("applyTVModeClass", () => {
  it("adds tv-mode class when isTVMode is true", () => {
    applyTVModeClass(true);
    expect(document.documentElement.classList.contains("tv-mode")).toBe(true);
  });

  it("removes tv-mode class when isTVMode is false", () => {
    document.documentElement.classList.add("tv-mode");
    applyTVModeClass(false);
    expect(document.documentElement.classList.contains("tv-mode")).toBe(false);
  });

  it("is idempotent — calling multiple times does not duplicate class", () => {
    applyTVModeClass(true);
    applyTVModeClass(true);
    const classes = Array.from(document.documentElement.classList);
    expect(classes.filter((c) => c === "tv-mode").length).toBe(1);
  });

  it("removes class even if it was never added", () => {
    applyTVModeClass(false);
    expect(document.documentElement.classList.contains("tv-mode")).toBe(false);
  });
});
