import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── import from expected implementation path (will fail until alpha implements) ─
import { useDeviceContext, type DeviceType } from '../useDeviceContext';

// ── helpers ───────────────────────────────────────────────────────────────────

const originalUserAgent = navigator.userAgent;
const originalInnerWidth = window.innerWidth;

function mockUserAgent(ua: string) {
  Object.defineProperty(navigator, 'userAgent', {
    value: ua,
    writable: true,
    configurable: true,
  });
}

function mockInnerWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    writable: true,
    configurable: true,
  });
}

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn(),
  }));
}

function mockTouchSupport(hasTouch: boolean) {
  Object.defineProperty(navigator, 'maxTouchPoints', {
    value: hasTouch ? 2 : 0,
    writable: true,
    configurable: true,
  });
}

// ── setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  document.documentElement.classList.remove('tv-mode');
  mockMatchMedia(false);
  mockTouchSupport(false);
  mockInnerWidth(1920);
});

afterEach(() => {
  Object.defineProperty(navigator, 'userAgent', {
    value: originalUserAgent,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, 'innerWidth', {
    value: originalInnerWidth,
    writable: true,
    configurable: true,
  });
  document.documentElement.classList.remove('tv-mode');
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe('useDeviceContext — Fire TV detection', () => {
  it('detects Fire TV via user agent containing "AFTT"', () => {
    mockUserAgent('Mozilla/5.0 (Linux; Android 9; AFTT Build/PS7633) AppleWebKit/537.36');
    const { result } = renderHook(() => useDeviceContext());

    expect(result.current.deviceType).toBe('firetv');
    expect(result.current.isTVMode).toBe(true);
    expect(result.current.isMobile).toBe(false);
  });

  it('detects Fire TV via user agent containing "AFT" prefix', () => {
    mockUserAgent('Mozilla/5.0 (Linux; Android 11; AFTKA Build/NS6323) Silk/98.3.1');
    const { result } = renderHook(() => useDeviceContext());

    expect(result.current.deviceType).toBe('firetv');
    expect(result.current.isTVMode).toBe(true);
  });

  it('detects Fire TV via user agent containing "Amazon"', () => {
    mockUserAgent('Mozilla/5.0 (Linux; Android 11; Amazon Fire TV Stick) AppleWebKit/537.36');
    const { result } = renderHook(() => useDeviceContext());

    expect(result.current.deviceType).toBe('firetv');
  });
});

describe('useDeviceContext — Samsung Tizen detection', () => {
  it('detects Tizen via user agent containing "Tizen"', () => {
    mockUserAgent('Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.5) AppleWebKit/537.36');
    const { result } = renderHook(() => useDeviceContext());

    expect(result.current.deviceType).toBe('tizen');
    expect(result.current.isTVMode).toBe(true);
    expect(result.current.isMobile).toBe(false);
  });
});

describe('useDeviceContext — LG webOS detection', () => {
  it('detects webOS via user agent containing "Web0S"', () => {
    mockUserAgent('Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 Chrome/79');
    const { result } = renderHook(() => useDeviceContext());

    expect(result.current.deviceType).toBe('webos');
    expect(result.current.isTVMode).toBe(true);
    expect(result.current.isMobile).toBe(false);
  });

  it('detects webOS via user agent containing lowercase "webOS"', () => {
    mockUserAgent('Mozilla/5.0 (Linux; NetCast.TV-2023) webOS.TV-2023 AppleWebKit/537.36');
    const { result } = renderHook(() => useDeviceContext());

    expect(result.current.deviceType).toBe('webos');
    expect(result.current.isTVMode).toBe(true);
  });
});

describe('useDeviceContext — mobile detection', () => {
  it('detects mobile when screen width < 768', () => {
    mockUserAgent('Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36');
    mockInnerWidth(390);
    mockTouchSupport(true);
    const { result } = renderHook(() => useDeviceContext());

    expect(result.current.deviceType).toBe('mobile');
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTVMode).toBe(false);
  });

  it('detects mobile when device has touch support and narrow viewport', () => {
    mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
    mockInnerWidth(430);
    mockTouchSupport(true);
    const { result } = renderHook(() => useDeviceContext());

    expect(result.current.deviceType).toBe('mobile');
    expect(result.current.isMobile).toBe(true);
  });
});

describe('useDeviceContext — desktop fallback', () => {
  it('defaults to "desktop" when no TV or mobile conditions match', () => {
    mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0');
    mockInnerWidth(1920);
    mockTouchSupport(false);
    const { result } = renderHook(() => useDeviceContext());

    expect(result.current.deviceType).toBe('desktop');
    expect(result.current.isTVMode).toBe(false);
    expect(result.current.isMobile).toBe(false);
  });
});

describe('useDeviceContext — return shape', () => {
  it('returns deviceType, isTVMode, and isMobile properties', () => {
    const { result } = renderHook(() => useDeviceContext());

    expect(result.current).toHaveProperty('deviceType');
    expect(result.current).toHaveProperty('isTVMode');
    expect(result.current).toHaveProperty('isMobile');
  });

  it('isTVMode is true for all TV device types', () => {
    const tvUserAgents: Array<{ ua: string; expected: DeviceType }> = [
      { ua: 'AFTT Fire TV', expected: 'firetv' },
      { ua: 'Tizen SmartTV', expected: 'tizen' },
      { ua: 'Web0S LG TV', expected: 'webos' },
    ];

    for (const { ua, expected } of tvUserAgents) {
      mockUserAgent(ua);
      const { result } = renderHook(() => useDeviceContext());
      expect(result.current.isTVMode).toBe(true);
      expect(result.current.deviceType).toBe(expected);
    }
  });
});

describe('useDeviceContext — .tv-mode class on documentElement', () => {
  it('applies .tv-mode class to documentElement when TV is detected', () => {
    mockUserAgent('Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.5)');
    renderHook(() => useDeviceContext());

    expect(document.documentElement.classList.contains('tv-mode')).toBe(true);
  });

  it('does NOT apply .tv-mode class on desktop', () => {
    mockUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    mockInnerWidth(1920);
    renderHook(() => useDeviceContext());

    expect(document.documentElement.classList.contains('tv-mode')).toBe(false);
  });

  it('does NOT apply .tv-mode class on mobile', () => {
    mockUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)');
    mockInnerWidth(390);
    mockTouchSupport(true);
    renderHook(() => useDeviceContext());

    expect(document.documentElement.classList.contains('tv-mode')).toBe(false);
  });
});
