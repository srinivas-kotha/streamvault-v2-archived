// ── Platform-specific back key codes ──────────────────────────────────────────
export const KEY_FIRE_TV_BACK = 4;
export const KEY_TIZEN_BACK = 10009;
export const KEY_WEBOS_BACK = 461;
export const KEY_ESCAPE = 27;
export const KEY_BACKSPACE = 8;

// ── Confirm/enter key codes ──────────────────────────────────────────────────
export const KEY_ENTER = 13;
export const KEY_DPAD_CENTER = 66;

// ── Key collections ─────────────────────────────────────────────────────────
export const BACK_KEYS: readonly number[] = [
  KEY_FIRE_TV_BACK,
  KEY_TIZEN_BACK,
  KEY_WEBOS_BACK,
  KEY_ESCAPE,
  KEY_BACKSPACE,
] as const;

export const ENTER_KEYS: readonly number[] = [
  KEY_ENTER,
  KEY_DPAD_CENTER,
] as const;
