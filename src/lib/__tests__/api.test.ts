import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api, ApiError } from "../api";
import { server } from "@/test/mocks/server";

// Disable MSW for this file — tests use manual fetch mocks
beforeAll(() => server.close());
afterAll(() => server.listen({ onUnhandledRequest: "warn" }));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Track location changes without actual navigation
const locationHrefSetter = vi.fn();

beforeEach(() => {
  // Re-apply fetch stub (MSW may have replaced it in setup.ts beforeAll)
  vi.stubGlobal("fetch", mockFetch);
  vi.clearAllMocks();
  // Reset document.cookie
  Object.defineProperty(document, "cookie", {
    writable: true,
    value: "",
  });
  // Mock window.location.href setter
  Object.defineProperty(window, "location", {
    writable: true,
    value: { ...window.location, href: "/" },
  });
  Object.defineProperty(window.location, "href", {
    set: locationHrefSetter,
    get: () => "/",
  });
});

function mockResponse(status: number, body?: object, ok?: boolean) {
  return {
    status,
    statusText: status === 200 ? "OK" : "Error",
    ok: ok ?? (status >= 200 && status < 300),
    json: vi.fn().mockResolvedValue(body ?? {}),
  };
}

describe("api()", () => {
  it("sends requests with credentials: include", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, { data: "test" }));

    await api("/test");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({
        credentials: "include",
      }),
    );
  });

  it("adds Content-Type: application/json header", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, { ok: true }));

    await api("/test");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("adds x-csrf-token header for POST requests when cookie exists", async () => {
    document.cookie = "sv_csrf=test-csrf-token; other=val";
    mockFetch.mockResolvedValueOnce(mockResponse(200, { ok: true }));

    await api("/test", { method: "POST", body: JSON.stringify({}) });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-csrf-token": "test-csrf-token",
        }),
      }),
    );
  });

  it("adds x-csrf-token header for PUT requests when cookie exists", async () => {
    document.cookie = "sv_csrf=put-token";
    mockFetch.mockResolvedValueOnce(mockResponse(200, { ok: true }));

    await api("/test", { method: "PUT", body: JSON.stringify({}) });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-csrf-token": "put-token",
        }),
      }),
    );
  });

  it("adds x-csrf-token header for DELETE requests when cookie exists", async () => {
    document.cookie = "sv_csrf=del-token";
    mockFetch.mockResolvedValueOnce(mockResponse(200, { ok: true }));

    await api("/test", { method: "DELETE" });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-csrf-token": "del-token",
        }),
      }),
    );
  });

  it("does NOT add x-csrf-token header for GET requests", async () => {
    document.cookie = "sv_csrf=should-not-appear";
    mockFetch.mockResolvedValueOnce(mockResponse(200, { ok: true }));

    await api("/test");

    const callHeaders = mockFetch.mock.calls[0]![1]!.headers as Record<
      string,
      string
    >;
    expect(callHeaders["x-csrf-token"]).toBeUndefined();
  });

  it("on 401, calls refresh endpoint then retries original request", async () => {
    document.cookie = "sv_csrf=csrf1";

    // First call returns 401
    mockFetch.mockResolvedValueOnce(mockResponse(401, undefined, false));
    // Refresh call succeeds
    mockFetch.mockResolvedValueOnce(mockResponse(200, {}, true));
    // Retry succeeds
    mockFetch.mockResolvedValueOnce(mockResponse(200, { data: "retried" }));

    const result = await api("/protected");

    expect(result).toEqual({ data: "retried" });
    // 3 calls: original, refresh, retry
    expect(mockFetch).toHaveBeenCalledTimes(3);
    // Second call should be to refresh endpoint
    expect(mockFetch.mock.calls[1]![0]).toBe("/api/auth/refresh");
    expect(mockFetch.mock.calls[1]![1]).toEqual(
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("on 401 after refresh also fails, redirects to /login", async () => {
    // First call returns 401
    mockFetch.mockResolvedValueOnce(mockResponse(401, undefined, false));
    // Refresh fails
    mockFetch.mockResolvedValueOnce(mockResponse(401, undefined, false));

    await expect(api("/protected")).rejects.toThrow(ApiError);
    expect(locationHrefSetter).toHaveBeenCalledWith("/login");
  });

  it("on 401 after successful refresh but retry also 401, redirects to /login", async () => {
    // First call returns 401
    mockFetch.mockResolvedValueOnce(mockResponse(401, undefined, false));
    // Refresh succeeds
    mockFetch.mockResolvedValueOnce(mockResponse(200, {}, true));
    // Retry also returns 401
    mockFetch.mockResolvedValueOnce(mockResponse(401, undefined, false));

    await expect(api("/protected")).rejects.toThrow(ApiError);
    expect(locationHrefSetter).toHaveBeenCalledWith("/login");
  });

  it("throws ApiError for non-401 error responses", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(
        403,
        { error: "Forbidden", message: "Access denied" },
        false,
      ),
    );

    await expect(api("/test")).rejects.toThrow(ApiError);
  });

  it("returns undefined for 204 No Content", async () => {
    mockFetch.mockResolvedValueOnce({
      status: 204,
      statusText: "No Content",
      ok: true,
      json: vi.fn(),
    });

    const result = await api("/test", { method: "DELETE" });
    expect(result).toBeUndefined();
  });
});

// ── Retry logic ───────────────────────────────────────────────────────────────
//
// Strategy: Use real timers but mock `setTimeout` in api.ts via vi.spyOn so
// the backoff sleeps resolve immediately without fake timer complexity.
// This avoids the unhandled-rejection problem that occurs when fake timers
// run microtasks ahead of the awaited promise chain.

describe("api() — retry logic", () => {
  beforeEach(() => {
    // Stub setTimeout to resolve immediately so backoff sleeps don't block
    vi.spyOn(globalThis, "setTimeout").mockImplementation(
      (fn: TimerHandler) => {
        if (typeof fn === "function") fn();
        return 0 as unknown as ReturnType<typeof setTimeout>;
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockResponse500() {
    return mockResponse(500, {}, false);
  }

  it("retries on network error (TypeError) up to 3 times and succeeds on last retry", async () => {
    mockFetch
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(mockResponse(200, { ok: true }));

    const result = await api("/test", { retries: 3 });
    expect(result).toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it("retries on 500 server error and succeeds on retry", async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse500())
      .mockResolvedValueOnce(mockResponse(200, { data: "recovered" }));

    const result = await api("/test", { retries: 1 });
    expect(result).toEqual({ data: "recovered" });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("retries on 503 server error", async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(503, {}, false))
      .mockResolvedValueOnce(mockResponse(200, { data: "ok" }));

    const result = await api("/test", { retries: 1 });
    expect(result).toEqual({ data: "ok" });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry on 4xx client errors", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(404, {}, false));

    await expect(api("/test")).rejects.toBeInstanceOf(ApiError);
    // Only 1 call — no retry for 4xx
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("does NOT retry on 400 bad request", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(400, {}, false));

    await expect(
      api("/test", { method: "POST", body: "{}" }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("does NOT retry on 403 forbidden", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(403, {}, false));

    await expect(api("/test")).rejects.toBeInstanceOf(ApiError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("does NOT retry auth endpoints (/auth/*)", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse500());

    await expect(
      api("/auth/login", { method: "POST", body: "{}" }),
    ).rejects.toBeInstanceOf(ApiError);
    // Auth paths must never be retried
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("respects custom retries: 0 — no retry even on 500", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse500());

    await expect(api("/test", { retries: 0 })).rejects.toBeInstanceOf(ApiError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("respects noRetry: true — skips retry on network error", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(api("/test", { noRetry: true })).rejects.toBeInstanceOf(
      TypeError,
    );
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("respects custom retries: 1 — retries exactly once", async () => {
    mockFetch
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(api("/test", { retries: 1 })).rejects.toBeInstanceOf(
      TypeError,
    );
    // Original + 1 retry = 2 total calls
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("throws after exhausting all 3 default retries on persistent network error", async () => {
    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(api("/test")).rejects.toBeInstanceOf(TypeError);
    // Original + 3 retries = 4 total calls
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it("throws ApiError after exhausting retries on persistent 5xx", async () => {
    mockFetch.mockResolvedValue(mockResponse500());

    await expect(api("/test")).rejects.toBeInstanceOf(ApiError);
    // Original + 3 retries = 4 total calls
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });
});
