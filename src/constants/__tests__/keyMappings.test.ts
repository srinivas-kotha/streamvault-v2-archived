import { describe, it, expect } from 'vitest';

// ── import from expected implementation path (will fail until alpha implements) ─
import {
  BACK_KEYS,
  ENTER_KEYS,
  KEY_FIRE_TV_BACK,
  KEY_TIZEN_BACK,
  KEY_WEBOS_BACK,
  KEY_ESCAPE,
  KEY_BACKSPACE,
  KEY_ENTER,
  KEY_DPAD_CENTER,
} from '../keyMappings';

// ── tests ─────────────────────────────────────────────────────────────────────

describe('keyMappings — platform back key constants', () => {
  it('exports Fire TV back keyCode as 4', () => {
    expect(KEY_FIRE_TV_BACK).toBe(4);
  });

  it('exports Samsung Tizen back keyCode as 10009', () => {
    expect(KEY_TIZEN_BACK).toBe(10009);
  });

  it('exports LG webOS back keyCode as 461', () => {
    expect(KEY_WEBOS_BACK).toBe(461);
  });

  it('exports Escape keyCode as 27', () => {
    expect(KEY_ESCAPE).toBe(27);
  });

  it('exports Backspace keyCode as 8', () => {
    expect(KEY_BACKSPACE).toBe(8);
  });
});

describe('keyMappings — enter/confirm key constants', () => {
  it('exports Enter keyCode as 13', () => {
    expect(KEY_ENTER).toBe(13);
  });

  it('exports DPAD Center keyCode as 66', () => {
    expect(KEY_DPAD_CENTER).toBe(66);
  });
});

describe('keyMappings — BACK_KEYS set', () => {
  it('includes Fire TV back keyCode (4)', () => {
    expect(BACK_KEYS).toContain(4);
  });

  it('includes Samsung Tizen back keyCode (10009)', () => {
    expect(BACK_KEYS).toContain(10009);
  });

  it('includes LG webOS back keyCode (461)', () => {
    expect(BACK_KEYS).toContain(461);
  });

  it('includes Escape keyCode (27)', () => {
    expect(BACK_KEYS).toContain(27);
  });

  it('includes Backspace keyCode (8)', () => {
    expect(BACK_KEYS).toContain(8);
  });

  it('does NOT include Enter key', () => {
    expect(BACK_KEYS).not.toContain(13);
  });

  it('does NOT include DPAD Center key', () => {
    expect(BACK_KEYS).not.toContain(66);
  });
});

describe('keyMappings — ENTER_KEYS set', () => {
  it('includes Enter keyCode (13)', () => {
    expect(ENTER_KEYS).toContain(13);
  });

  it('includes DPAD Center keyCode (66)', () => {
    expect(ENTER_KEYS).toContain(66);
  });

  it('does NOT include back keys', () => {
    expect(ENTER_KEYS).not.toContain(4);
    expect(ENTER_KEYS).not.toContain(10009);
    expect(ENTER_KEYS).not.toContain(461);
    expect(ENTER_KEYS).not.toContain(27);
  });
});

describe('keyMappings — type safety', () => {
  it('BACK_KEYS is iterable (array or Set)', () => {
    // Must be iterable so consumers can use .includes(), .has(), or for...of
    expect(typeof BACK_KEYS[Symbol.iterator]).toBe('function');
  });

  it('ENTER_KEYS is iterable (array or Set)', () => {
    expect(typeof ENTER_KEYS[Symbol.iterator]).toBe('function');
  });
});
