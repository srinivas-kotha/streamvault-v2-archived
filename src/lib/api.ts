const API_BASE = '/api';

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: { error: string; message: string },
  ) {
    super(data?.message || statusText);
    this.name = 'ApiError';
  }
}

function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)sv_csrf=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(getCsrfToken() ? { 'x-csrf-token': getCsrfToken()! } : {}),
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

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const method = options.method?.toUpperCase() || 'GET';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Attach CSRF token for non-GET requests
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    const csrf = getCsrfToken();
    if (csrf) headers['x-csrf-token'] = csrf;
  }

  const res = await fetch(url, {
    ...options,
    method,
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      // Retry with fresh CSRF token
      const retryHeaders = { ...headers };
      const newCsrf = getCsrfToken();
      if (newCsrf && method !== 'GET') retryHeaders['x-csrf-token'] = newCsrf;

      const retryRes = await fetch(url, {
        ...options,
        method,
        headers: retryHeaders,
        credentials: 'include',
      });

      if (!retryRes.ok) {
        if (retryRes.status === 401) {
          window.location.href = '/login';
          throw new ApiError(401, 'Unauthorized');
        }
        const data = await retryRes.json().catch(() => undefined);
        throw new ApiError(retryRes.status, retryRes.statusText, data);
      }
      return retryRes.json() as Promise<T>;
    }
    window.location.href = '/login';
    throw new ApiError(401, 'Unauthorized');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => undefined);
    throw new ApiError(res.status, res.statusText, data);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export { ApiError };
