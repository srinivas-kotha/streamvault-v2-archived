/**
 * Detect if the app is running in a TV/set-top-box context:
 * - PWA standalone mode (Samsung TV, TWA with Chrome)
 * - Native WebView wrapper (Fire Stick — no display-mode: standalone, but
 *   user agent includes "FireTV" set by our MainActivity.kt)
 *
 * Used to hide desktop-only controls (mini-player, PiP) and enable D-pad
 * focus management.
 */
export const isTVMode =
  window.matchMedia('(display-mode: standalone)').matches ||
  /FireTV|AFT|Silk\/\d|AFTM|AFTT|AFTS/i.test(navigator.userAgent);
