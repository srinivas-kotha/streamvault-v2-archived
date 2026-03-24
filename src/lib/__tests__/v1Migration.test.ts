import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runV1Migration } from '../v1Migration';

// ── helpers ───────────────────────────────────────────────────────────────────

function seedLocalStorage(entries: Record<string, string>) {
  for (const [key, value] of Object.entries(entries)) {
    localStorage.setItem(key, value);
  }
}

// ── tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
});

describe('runV1Migration', () => {
  it('clears all sv_ prefixed localStorage keys', () => {
    seedLocalStorage({
      sv_auth: 'token123',
      sv_user: 'alice',
      sv_preferences: '{"theme":"dark"}',
    });

    runV1Migration();

    expect(localStorage.getItem('sv_auth')).toBeNull();
    expect(localStorage.getItem('sv_user')).toBeNull();
    expect(localStorage.getItem('sv_preferences')).toBeNull();
  });

  it('sets the sv2_migrated flag after running', () => {
    runV1Migration();

    expect(localStorage.getItem('sv2_migrated')).toBe('true');
  });

  it('is a no-op when sv2_migrated is already set', () => {
    localStorage.setItem('sv2_migrated', 'true');
    // Put some sv_ keys back — migration should NOT clear them this time.
    localStorage.setItem('sv_leftover', 'should-remain');

    runV1Migration();

    // The leftover key must still exist (migration skipped).
    expect(localStorage.getItem('sv_leftover')).toBe('should-remain');
  });

  it('only removes sv_ keys and leaves unrelated keys untouched', () => {
    seedLocalStorage({
      sv_auth: 'old',
      other_key: 'keep-me',
      'unrelated-setting': 'also-keep',
    });

    runV1Migration();

    expect(localStorage.getItem('sv_auth')).toBeNull();
    expect(localStorage.getItem('other_key')).toBe('keep-me');
    expect(localStorage.getItem('unrelated-setting')).toBe('also-keep');
  });

  it('survives localStorage.getItem throwing (e.g. private browsing)', () => {
    const original = localStorage.getItem;
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage access denied');
    });

    // Should not throw.
    expect(() => runV1Migration()).not.toThrow();

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(original);
  });
});
