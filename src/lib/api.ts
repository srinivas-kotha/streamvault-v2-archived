const API_BASE = "/api";

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: { error: string; message: string },
  ) {
    super(data?.message || statusText);
    this.name = "ApiError";
  }
}

function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)sv_csrf=([^;]*)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(getCsrfToken() ? { "x-csrf-token": getCsrfToken()! } : {}),
        },
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

// ── Retry helpers ─────────────────────────────────────────────────────────────

const MAX_RETRY_COUNT = 3;
const BASE_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;

function computeBackoff(attempt: number): number {
  return Math.min(BASE_BACKOFF_MS * Math.pow(2, attempt), MAX_BACKOFF_MS);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns true if the path targets an auth endpoint.
 * Auth endpoints have their own refresh/redirect logic and must never be retried.
 */
function isAuthPath(path: string): boolean {
  return path.startsWith("/auth/");
}

// ── Extended options ──────────────────────────────────────────────────────────

export interface ApiOptions extends RequestInit {
  /**
   * Override the default maximum retry count (3).
   * Set to 0 to disable retries for this call.
   */
  retries?: number;
  /**
   * Set to true to completely skip retry logic for this call.
   */
  noRetry?: boolean;
}

// ── Main api() function ───────────────────────────────────────────────────────

export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { retries, noRetry, ...fetchOptions } = options;
  const url = `${API_BASE}${path}`;
  const method = fetchOptions.method?.toUpperCase() || "GET";

  const maxRetries =
    noRetry || isAuthPath(path) ? 0 : (retries ?? MAX_RETRY_COUNT);

  async function doFetch(attempt: number): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(fetchOptions.headers as Record<string, string>),
    };

    // Attach CSRF token for non-GET requests
    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
      const csrf = getCsrfToken();
      if (csrf) headers["x-csrf-token"] = csrf;
    }

    let res: Response;
    try {
      res = await fetch(url, {
        ...fetchOptions,
        method,
        headers,
        credentials: "include",
      });
    } catch (networkError) {
      // Network error (TypeError from fetch) — retry if attempts remain
      if (attempt < maxRetries) {
        await sleep(computeBackoff(attempt));
        return doFetch(attempt + 1);
      }
      throw networkError;
    }

    // Handle 401 — try token refresh then retry ONCE (not counted in retry budget)
    if (res.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        const retryHeaders = { ...headers };
        const newCsrf = getCsrfToken();
        if (newCsrf && method !== "GET") retryHeaders["x-csrf-token"] = newCsrf;

        const retryRes = await fetch(url, {
          ...fetchOptions,
          method,
          headers: retryHeaders,
          credentials: "include",
        });

        if (!retryRes.ok) {
          if (retryRes.status === 401) {
            window.location.href = "/login";
            throw new ApiError(401, "Unauthorized");
          }
          const data = await retryRes.json().catch(() => undefined);
          throw new ApiError(retryRes.status, retryRes.statusText, data);
        }
        return retryRes.json() as Promise<T>;
      }
      window.location.href = "/login";
      throw new ApiError(401, "Unauthorized");
    }

    // 5xx — retry with exponential backoff
    if (res.status >= 500 && res.status < 600 && attempt < maxRetries) {
      await sleep(computeBackoff(attempt));
      return doFetch(attempt + 1);
    }

    if (!res.ok) {
      const data = await res.json().catch(() => undefined);
      throw new ApiError(res.status, res.statusText, data);
    }

    // Handle 204 No Content
    if (res.status === 204) return undefined as T;

    return res.json() as Promise<T>;
  }

  return doFetch(0);
}

export { ApiError };
