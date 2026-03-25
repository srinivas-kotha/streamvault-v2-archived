/**
 * Detect if the app is running in a TV/set-top-box context.
 *
 * Detection priority:
 * 1. Dev override: ?tv=1 in URL or localStorage.setItem('sv_tv_mode', '1')
 * 2. Fire TV: UA contains 'AFT' or 'Amazon'
 * 3. Samsung Tizen: UA contains 'Tizen'
 * 4. LG webOS: UA contains 'Web0S' or 'webOS'
 *
 * MUST NOT use @media (display-mode: standalone) for TV detection — it causes
 * false positives on desktop PWA installs. See deviceDetection.ts (AC-10).
 *
 * Used to hide desktop-only controls (PiP, fullscreen) and enable D-pad
 * focus management.
 */
const tvOverride =
  new URLSearchParams(window.location.search).get("tv") === "1" ||
  localStorage.getItem("sv_tv_mode") === "1";

// Persist URL param to localStorage so it survives page navigations
if (new URLSearchParams(window.location.search).get("tv") === "1") {
  localStorage.setItem("sv_tv_mode", "1");
}

// UA-based TV detection — matches deviceDetection.ts logic exactly
const uaIsTV = /AFT|Amazon|Tizen|Web0S|webOS/i.test(navigator.userAgent);

export const isTVMode = tvOverride || uaIsTV;
