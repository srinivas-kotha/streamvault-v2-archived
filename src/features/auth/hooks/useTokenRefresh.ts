/**
 * useTokenRefresh — proactive token auto-refresh hook.
 *
 * Access tokens expire after 15 minutes. This hook schedules a silent refresh
 * at 13 minutes (TOKEN_REFRESH_BEFORE_EXPIRY_MS before expiry) so users are
 * never silently logged out after a period of inactivity.
 *
 * Features:
 * - Proactive: fires ~2 minutes before expiry, not after a 401
 * - Visibility-aware: skips refresh when the tab is hidden; catches up on focus
 * - Deduplicated: leverages the existing refreshToken() dedup in api.ts
 * - Clean: clears timers on logout / unmount
 * - Fallback: the 401-retry in api.ts still works if proactive refresh fails
 */

import { useEffect, useCallback, useRef } from "react";
import { refreshToken, getLastRefreshedAt, markTokenRefreshed } from "@lib/api";
import { useAuthStore } from "@lib/store";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Access token lifetime as configured on the backend (15 minutes). */
export const TOKEN_LIFETIME_MS = 15 * 60 * 1000;

/**
 * How early to refresh before the token expires.
 * Refreshes at 13 minutes (2 minutes before the 15-minute expiry).
 */
export const TOKEN_REFRESH_BEFORE_EXPIRY_MS = 2 * 60 * 1000;

/**
 * The target delay from the last refresh until the proactive refresh fires.
 * = TOKEN_LIFETIME_MS - TOKEN_REFRESH_BEFORE_EXPIRY_MS = 13 minutes
 */
const REFRESH_DELAY_MS = TOKEN_LIFETIME_MS - TOKEN_REFRESH_BEFORE_EXPIRY_MS;

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Mounts a proactive token-refresh scheduler.
 *
 * Call this once near the root of the authenticated app tree (e.g., in the
 * `_authenticated` layout route or a top-level provider). It is a no-op when
 * the user is not authenticated.
 *
 * @param onRefreshFailed  Optional callback invoked when the refresh request
 *   fails (e.g., to force a logout). Defaults to navigating to /login.
 */
export function useTokenRefresh(onRefreshFailed?: () => void): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // Stable ref so the timer callback always sees the latest prop without
  // needing to re-register the visibility listener.
  const onRefreshFailedRef = useRef(onRefreshFailed);
  useEffect(() => {
    onRefreshFailedRef.current = onRefreshFailed;
  }, [onRefreshFailed]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleRefreshFailed = useCallback(() => {
    clearAuth();
    if (onRefreshFailedRef.current) {
      onRefreshFailedRef.current();
    } else {
      window.location.href = "/login";
    }
  }, [clearAuth]);

  /**
   * Schedule the next proactive refresh based on when the token was last
   * issued. If the token is already past the refresh threshold (e.g., the tab
   * was hidden for a long time), fires immediately.
   */
  const scheduleRefresh = useCallback(() => {
    clearTimer();

    const lastRefreshed = getLastRefreshedAt();
    const now = Date.now();

    let delay: number;
    if (lastRefreshed === 0) {
      // No recorded refresh time — token age unknown. Refresh after one full
      // REFRESH_DELAY_MS from now as a safe default (avoids hammering the
      // server on mount if we can't determine the token age).
      delay = REFRESH_DELAY_MS;
    } else {
      const elapsed = now - lastRefreshed;
      delay = Math.max(0, REFRESH_DELAY_MS - elapsed);
    }

    timerRef.current = setTimeout(async () => {
      // Only refresh when the tab is visible to avoid unnecessary network
      // traffic in background tabs.
      if (document.visibilityState === "hidden") {
        // Will be rescheduled when the tab becomes visible again.
        return;
      }

      const success = await refreshToken();
      if (success) {
        // refreshToken() already calls markTokenRefreshed() on success.
        // Schedule the next cycle.
        scheduleRefresh();
      } else {
        handleRefreshFailed();
      }
    }, delay);
  }, [clearTimer, handleRefreshFailed]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimer();
      return;
    }

    scheduleRefresh();

    /**
     * When the tab comes back into focus after being hidden, check whether
     * the token is within the refresh window and act immediately if so.
     */
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;

      const lastRefreshed = getLastRefreshedAt();
      if (lastRefreshed === 0) {
        // Token age unknown — reschedule conservatively.
        scheduleRefresh();
        return;
      }

      const elapsed = Date.now() - lastRefreshed;
      if (elapsed >= REFRESH_DELAY_MS) {
        // Token is within the danger zone (past 13 min mark) — refresh now.
        clearTimer();
        refreshToken().then((success) => {
          if (success) {
            scheduleRefresh();
          } else {
            handleRefreshFailed();
          }
        });
      } else {
        // Token is still healthy — reschedule the timer from the current
        // elapsed time (the previous timer was cleared when tab went hidden).
        scheduleRefresh();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated, scheduleRefresh, clearTimer, handleRefreshFailed]);
}

export { markTokenRefreshed };
