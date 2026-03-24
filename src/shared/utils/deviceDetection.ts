/**
 * Device detection via User-Agent string.
 *
 * Priority order:
 * 1. Fire TV: UA contains 'AFT' or 'Amazon'
 * 2. Samsung Tizen: UA contains 'Tizen'
 * 3. LG webOS: UA contains 'Web0S' or 'webOS'
 * 4. Mobile: screen width < 768 AND has touch support
 * 5. Desktop: default fallback
 *
 * MUST NOT use @media (display-mode: standalone) for TV detection (AC-10).
 */

export type DeviceType = 'firetv' | 'tizen' | 'webos' | 'mobile' | 'desktop';

export interface DeviceInfo {
  deviceType: DeviceType;
  isTVMode: boolean;
  isMobile: boolean;
}

const TV_DEVICE_TYPES: ReadonlySet<DeviceType> = new Set(['firetv', 'tizen', 'webos']);

export function detectDevice(): DeviceInfo {
  const ua = navigator.userAgent;

  let deviceType: DeviceType = 'desktop';

  // Fire TV detection: AFT prefix covers AFTT, AFTKA, AFTM, AFTS, etc.
  if (/AFT|Amazon/i.test(ua)) {
    deviceType = 'firetv';
  }
  // Samsung Tizen
  else if (/Tizen/i.test(ua)) {
    deviceType = 'tizen';
  }
  // LG webOS (both Web0S and webOS variants)
  else if (/Web0S|webOS/i.test(ua)) {
    deviceType = 'webos';
  }
  // Mobile: narrow viewport + touch support
  else if (window.innerWidth < 768 && navigator.maxTouchPoints > 0) {
    deviceType = 'mobile';
  }

  const isTVMode = TV_DEVICE_TYPES.has(deviceType);
  const isMobile = deviceType === 'mobile';

  return { deviceType, isTVMode, isMobile };
}

/**
 * Apply .tv-mode class to document.documentElement when TV detected.
 * Called once at app boot and by useDeviceContext hook.
 */
export function applyTVModeClass(isTVMode: boolean): void {
  if (isTVMode) {
    document.documentElement.classList.add('tv-mode');
  } else {
    document.documentElement.classList.remove('tv-mode');
  }
}
