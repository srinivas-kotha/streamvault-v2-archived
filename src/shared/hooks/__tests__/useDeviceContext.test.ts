import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock device detection
const mockDetectDevice = vi.fn();

vi.mock("@shared/utils/deviceDetection", () => ({
  detectDevice: () => mockDetectDevice(),
}));

import { useDeviceContext, type DeviceClass } from "../useDeviceContext";

describe("useDeviceContext (shared)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDetectDevice.mockReturnValue({
      deviceType: "desktop",
      isTVMode: false,
      isMobile: false,
    });
  });

  it("returns deviceClass, isTVMode, hlsBackBuffer, hlsMaxBuffer, hlsEnableWorker", () => {
    const { result } = renderHook(() => useDeviceContext());

    expect(result.current).toHaveProperty("deviceClass");
    expect(result.current).toHaveProperty("isTVMode");
    expect(result.current).toHaveProperty("hlsBackBuffer");
    expect(result.current).toHaveProperty("hlsMaxBuffer");
    expect(result.current).toHaveProperty("hlsEnableWorker");
  });

  it("returns desktop config for desktop device", () => {
    mockDetectDevice.mockReturnValue({
      deviceType: "desktop",
      isTVMode: false,
      isMobile: false,
    });

    const { result } = renderHook(() => useDeviceContext());

    expect(result.current.deviceClass).toBe("desktop");
    expect(result.current.isTVMode).toBe(false);
    expect(result.current.hlsBackBuffer).toBe(60);
    expect(result.current.hlsMaxBuffer).toBe(60);
    expect(result.current.hlsEnableWorker).toBe(true);
  });

  it("returns TV config for TV device", () => {
    mockDetectDevice.mockReturnValue({
      deviceType: "firetv",
      isTVMode: true,
      isMobile: false,
    });

    const { result } = renderHook(() => useDeviceContext());

    expect(result.current.deviceClass).toBe("tv");
    expect(result.current.isTVMode).toBe(true);
    expect(result.current.hlsBackBuffer).toBe(20);
    expect(result.current.hlsMaxBuffer).toBe(30);
    expect(result.current.hlsEnableWorker).toBe(false);
  });

  it("returns mobile config with reduced back buffer", () => {
    mockDetectDevice.mockReturnValue({
      deviceType: "mobile",
      isTVMode: false,
      isMobile: true,
    });

    // Mock narrow screen for phone detection
    Object.defineProperty(window, "innerWidth", {
      value: 375,
      configurable: true,
    });

    const { result } = renderHook(() => useDeviceContext());

    expect(result.current.deviceClass).toBe("mobile");
    expect(result.current.isTVMode).toBe(false);
    expect(result.current.hlsBackBuffer).toBe(30);
    expect(result.current.hlsMaxBuffer).toBe(60);
    expect(result.current.hlsEnableWorker).toBe(true);
  });

  it("returns tablet config for mobile with wide screen", () => {
    mockDetectDevice.mockReturnValue({
      deviceType: "mobile",
      isTVMode: false,
      isMobile: true,
    });

    Object.defineProperty(window, "innerWidth", {
      value: 1024,
      configurable: true,
    });

    const { result } = renderHook(() => useDeviceContext());

    expect(result.current.deviceClass).toBe("tablet");
    expect(result.current.isTVMode).toBe(false);
    expect(result.current.hlsBackBuffer).toBe(30);
  });

  it("returns stable value across re-renders (memoized)", () => {
    const { result, rerender } = renderHook(() => useDeviceContext());

    const first = result.current;
    rerender();

    expect(result.current).toBe(first);
  });

  it("TV mode disables HLS worker (OOM risk)", () => {
    mockDetectDevice.mockReturnValue({
      deviceType: "tizen",
      isTVMode: true,
      isMobile: false,
    });

    const { result } = renderHook(() => useDeviceContext());

    expect(result.current.hlsEnableWorker).toBe(false);
  });

  it("TV mode uses lower max buffer than desktop", () => {
    mockDetectDevice.mockReturnValue({
      deviceType: "webos",
      isTVMode: true,
      isMobile: false,
    });

    const { result } = renderHook(() => useDeviceContext());

    expect(result.current.hlsMaxBuffer).toBeLessThan(60);
    expect(result.current.hlsMaxBuffer).toBe(30);
  });

  it("DeviceClass type covers all expected values", () => {
    const validClasses: DeviceClass[] = ["desktop", "tv", "mobile", "tablet"];
    expect(validClasses).toHaveLength(4);
  });
});
