/**
 * Sprint 4 — useDeviceContext
 * Unified device context hook returning device class and HLS configuration.
 *
 * deviceClass: 'desktop' | 'tv' | 'mobile' | 'tablet'
 * isTVMode: true for Fire TV / Tizen / webOS
 * hlsBackBuffer: backBufferLength per device (TV=20, desktop=60)
 * hlsMaxBuffer: maxBufferLength per device
 * hlsEnableWorker: false on TV (OOM risk)
 */

import { useMemo } from "react";
import { detectDevice } from "@shared/utils/deviceDetection";

export type DeviceClass = "desktop" | "tv" | "mobile" | "tablet";

export interface DeviceContext {
  deviceClass: DeviceClass;
  isTVMode: boolean;
  hlsBackBuffer: number;
  hlsMaxBuffer: number;
  hlsEnableWorker: boolean;
}

export function useDeviceContext(): DeviceContext {
  return useMemo(() => {
    const { deviceType, isTVMode, isMobile } = detectDevice();

    if (isTVMode) {
      return {
        deviceClass: "tv",
        isTVMode: true,
        hlsBackBuffer: 20,
        hlsMaxBuffer: 30,
        hlsEnableWorker: false,
      };
    }

    if (isMobile) {
      // Distinguish tablet vs phone by screen width
      const isTablet =
        typeof window !== "undefined" && window.innerWidth >= 768;
      return {
        deviceClass: isTablet ? "tablet" : "mobile",
        isTVMode: false,
        hlsBackBuffer: 30,
        hlsMaxBuffer: 60,
        hlsEnableWorker: true,
      };
    }

    // Desktop
    void deviceType;
    return {
      deviceClass: "desktop",
      isTVMode: false,
      hlsBackBuffer: 60,
      hlsMaxBuffer: 60,
      hlsEnableWorker: true,
    };
  }, []);
}
