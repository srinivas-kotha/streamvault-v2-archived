import { useMemo } from 'react';
import {
  detectDevice,
  applyTVModeClass,
  type DeviceType,
  type DeviceInfo,
} from '@shared/utils/deviceDetection';

export type { DeviceType };

/**
 * Hook that detects the current device type and returns device context.
 * Applies .tv-mode class to documentElement when TV is detected.
 *
 * Returns:
 * - deviceType: 'firetv' | 'tizen' | 'webos' | 'mobile' | 'desktop'
 * - isTVMode: true for all TV device types
 * - isMobile: true only for mobile
 */
export function useDeviceContext(): DeviceInfo {
  const device = useMemo(() => {
    const info = detectDevice();
    applyTVModeClass(info.isTVMode);
    return info;
  }, []);

  return device;
}
