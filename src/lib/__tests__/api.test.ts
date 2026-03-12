import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, ApiError } from '../api';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Track location changes without actual navigation
const locationHrefSetter = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  // Reset document.cookie
  Object.defineProperty(document, 'cookie', {
    writable: true,
    value: '',
  });
  // Mock window.location.href setter
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...window.location, href: '/' },
  });
  Object.defineProperty(window.location, 'href', {
    set: locationHrefSetter,
    get: () => '/',
  });
});


function mockResponse(status: number, body?: object, ok?: boolean) {
  return {
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    ok: ok ?? (status >= 200 && status < 300),
    json: vi.fn().mockResolvedValue(body ?? {}),
  };
}

describe('api()', () => {
  it('sends requests with credentials: include', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, { data: 'test' }));

    await api('/test');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        credentials: 'include',
      }),
    );
  });

  it('adds Content-Type: application/json header', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, { ok: true }));

    await api('/test');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('adds x-csrf-token header for POST requests when cookie exists', async () => {
    document.cookie = 'sv_csrf=test-csrf-token; other=val';
    mockFetch.mockResolvedValueOnce(mockResponse(200, { ok: true }));

    await api('/test', { method: 'POST', body: JSON.stringify({}) });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-csrf-token': 'test-csrf-token',
        }),
      }),
    );
  });

  it('adds x-csrf-token header for PUT requests when cookie exists', async () => {
    document.cookie = 'sv_csrf=put-token';
    mockFetch.mockResolvedValueOnce(mockResponse(200, { ok: true }));

    await api('/test', { method: 'PUT', body: JSON.stringify({}) });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-csrf-token': 'put-token',
        }),
      }),
    );
  });

  it('adds x-csrf-token header for DELETE requests when cookie exists', async () => {
    document.cookie = 'sv_csrf=del-token';
    mockFetch.mockResolvedValueOnce(mockResponse(200, { ok: true }));

    await api('/test', { method: 'DELETE' });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-csrf-token': 'del-token',
        }),
      }),
    );
  });

  it('does NOT add x-csrf-token header for GET requests', async () => {
    document.cookie = 'sv_csrf=should-not-appear';
    mockFetch.mockResolvedValueOnce(mockResponse(200, { ok: true }));

    await api('/test');

    const callHeaders = mockFetch.mock.calls[0]![1]!.headers as Record<string, string>;
    expect(callHeaders['x-csrf-token']).toBeUndefined();
  });

  it('on 401, calls refresh endpoint then retries original request', async () => {
    document.cookie = 'sv_csrf=csrf1';

    // First call returns 401
    mockFetch.mockResolvedValueOnce(mockResponse(401, undefined, false));
    // Refresh call succeeds
    mockFetch.mockResolvedValueOnce(mockResponse(200, {}, true));
    // Retry succeeds
    mockFetch.mockResolvedValueOnce(mockResponse(200, { data: 'retried' }));

    const result = await api('/protected');

    expect(result).toEqual({ data: 'retried' });
    // 3 calls: original, refresh, retry
    expect(mockFetch).toHaveBeenCalledTimes(3);
    // Second call should be to refresh endpoint
    expect(mockFetch.mock.calls[1]![0]).toBe('/api/auth/refresh');
    expect(mockFetch.mock.calls[1]![1]).toEqual(
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
  });

  it('on 401 after refresh also fails, redirects to /login', async () => {
    // First call returns 401
    mockFetch.mockResolvedValueOnce(mockResponse(401, undefined, false));
    // Refresh fails
    mockFetch.mockResolvedValueOnce(mockResponse(401, undefined, false));

    await expect(api('/protected')).rejects.toThrow(ApiError);
    expect(locationHrefSetter).toHaveBeenCalledWith('/login');
  });

  it('on 401 after successful refresh but retry also 401, redirects to /login', async () => {
    // First call returns 401
    mockFetch.mockResolvedValueOnce(mockResponse(401, undefined, false));
    // Refresh succeeds
    mockFetch.mockResolvedValueOnce(mockResponse(200, {}, true));
    // Retry also returns 401
    mockFetch.mockResolvedValueOnce(mockResponse(401, undefined, false));

    await expect(api('/protected')).rejects.toThrow(ApiError);
    expect(locationHrefSetter).toHaveBeenCalledWith('/login');
  });

  it('throws ApiError for non-401 error responses', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(403, { error: 'Forbidden', message: 'Access denied' }, false),
    );

    await expect(api('/test')).rejects.toThrow(ApiError);
  });

  it('returns undefined for 204 No Content', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 204,
      statusText: 'No Content',
      ok: true,
      json: vi.fn(),
    });

    const result = await api('/test', { method: 'DELETE' });
    expect(result).toBeUndefined();
  });
});
