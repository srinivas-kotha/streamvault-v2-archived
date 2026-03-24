/**
 * StreamVault v2 — localStorage migration utility
 *
 * v1 used raw `sv_` prefixed localStorage keys (sv_auth, sv_user, etc.) managed
 * directly in Zustand stores and route loaders in src/lib/store.ts.
 *
 * v2 will use Zustand `persist` middleware with namespaced keys under a dedicated
 * store name (e.g. `sv2-auth`, `sv2-ui`). When those stores are implemented in
 * Sprint 1 / Sprint 4, add `version: 1` to each `persist` config so Zustand
 * treats any pre-existing persisted state as stale and discards it automatically.
 *
 * This utility handles the one-time cutover on first v2 load:
 *   1. Detects any lingering v1 `sv_` keys in localStorage.
 *   2. Clears them all.
 *   3. Sets a migration flag so the sweep never runs again.
 *
 * Call `runV1Migration()` as early as possible — BEFORE React renders — to
 * ensure stores initialise from a clean slate on the first v2 page load.
 *
 * Recommended placement in src/main.tsx:
 *
 *   import { runV1Migration } from '@lib/v1Migration';
 *
 *   // Run synchronously before React hydrates so no store reads stale v1 data.
 *   runV1Migration();
 *
 *   createRoot(document.getElementById('root')!).render(
 *     <StrictMode>
 *       <SpatialNavProvider>
 *         <App />
 *       </SpatialNavProvider>
 *     </StrictMode>,
 *   );
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Flag written to localStorage once the v1 sweep has run. */
const MIGRATION_FLAG_KEY = 'sv2_migrated';

/**
 * Prefix used by all v1 localStorage keys.
 * v1 wrote: sv_auth, sv_user — and potentially any other keys added during v1 dev.
 */
const V1_KEY_PREFIX = 'sv_';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns all keys in localStorage that start with the v1 prefix.
 * Iterates once and collects them to avoid mutating the collection mid-iteration.
 */
function collectV1Keys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key !== null && key.startsWith(V1_KEY_PREFIX)) {
      keys.push(key);
    }
  }
  return keys;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Runs the v1 → v2 localStorage migration exactly once.
 *
 * Safe to call multiple times — subsequent calls are no-ops if the migration
 * flag is already set. Also safe if localStorage is unavailable (SSR / private
 * browsing with storage disabled) — errors are swallowed gracefully.
 */
export function runV1Migration(): void {
  try {
    // Skip if migration has already run on this browser.
    if (localStorage.getItem(MIGRATION_FLAG_KEY) === 'true') {
      return;
    }

    const v1Keys = collectV1Keys();

    if (v1Keys.length > 0) {
      for (const key of v1Keys) {
        localStorage.removeItem(key);
      }
      console.info(
        `StreamVault v2: cleared ${v1Keys.length} v1 localStorage key(s): ${v1Keys.join(', ')}`,
      );
    }

    // Set migration flag regardless of whether any keys were found, so we
    // never scan localStorage again on subsequent loads.
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    console.info('StreamVault v2: cleared v1 localStorage data');
  } catch {
    // localStorage may throw in private browsing modes or when storage is full.
    // Migration failure is non-fatal — the app still works without the cleanup.
    if (import.meta.env.DEV) {
      console.warn('StreamVault v2: v1 migration could not access localStorage');
    }
  }
}

// ---------------------------------------------------------------------------
// Note on Zustand persist versioning
// ---------------------------------------------------------------------------
//
// The v2 stores in src/lib/stores/ are currently TODO stubs. When they are
// implemented with Zustand `persist` middleware, add `version: 1` (or higher)
// to each store's persist config:
//
//   import { persist } from 'zustand/middleware';
//
//   export const useAuthStore = create(
//     persist<AuthState>(
//       (set) => ({ ... }),
//       {
//         name: 'sv2-auth',
//         version: 1,          // <-- bump this when the schema changes
//       },
//     ),
//   );
//
// Zustand will automatically discard any persisted state whose version is
// lower than the configured version, preventing stale v1 data from being
// rehydrated even if `runV1Migration()` missed a key.
