/**
 * Detect if the app is running in a TV/set-top-box context:
 * - PWA standalone mode (Samsung TV, TWA with Chrome)
 * - Native WebView wrapper (Fire Stick — no display-mode: standalone, but
 *   user agent includes "FireTV" set by our MainActivity.kt)
 * - Dev override: ?tv=1 in URL or localStorage.setItem('sv_tv_mode', '1')
 *
 * Used to hide desktop-only controls (PiP, fullscreen) and enable D-pad
 * focus management.
 */
const tvOverride =
  new URLSearchParams(window.location.search).get('tv') === '1' ||
  localStorage.getItem('sv_tv_mode') === '1';

// Persist URL param to localStorage so it survives page navigations
if (new URLSearchParams(window.location.search).get('tv') === '1') {
  localStorage.setItem('sv_tv_mode', '1');
}

export const isTVMode =
  tvOverride ||
  window.matchMedia('(display-mode: standalone)').matches ||
  /FireTV|AFT|Silk\/\d|AFTM|AFTT|AFTS/i.test(navigator.userAgent);
