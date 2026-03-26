import { describe, it, expect, vi, beforeEach } from "vitest";

// ── mock api ──────────────────────────────────────────────────────────────────

const mockApi = vi.fn();
vi.mock("@lib/api", () => ({
  api: (...args: unknown[]) => mockApi(...args),
  markTokenRefreshed: vi.fn(),
}));

// ── fetch mock for autoLogin (uses raw fetch, not api()) ─────────────────────
// Must be imported AFTER MSW is set up so we can override it per-test.
const mockFetch = vi.fn();

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls POST /auth/login with credentials", async () => {
    mockApi.mockResolvedValue({
      message: "Login successful",
      userId: 1,
      username: "testuser",
    });

    const { login } = await import("../api");
    const result = await login("testuser", "password123");

    expect(mockApi).toHaveBeenCalledWith(
      "/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ username: "testuser", password: "password123" }),
      }),
    );
    expect(result.username).toBe("testuser");
    expect(result.userId).toBe(1);
  });

  it("propagates errors from api()", async () => {
    mockApi.mockRejectedValue(new Error("Invalid credentials"));

    const { login } = await import("../api");
    await expect(login("bad", "creds")).rejects.toThrow("Invalid credentials");
  });
});

// ---------------------------------------------------------------------------
// logout
// ---------------------------------------------------------------------------

describe("logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls POST /auth/logout", async () => {
    mockApi.mockResolvedValue({ message: "Logged out" });

    const { logout } = await import("../api");
    await logout();

    expect(mockApi).toHaveBeenCalledWith(
      "/auth/logout",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

// ---------------------------------------------------------------------------
// checkAuth
// ---------------------------------------------------------------------------

describe("checkAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when /favorites call succeeds", async () => {
    mockApi.mockResolvedValue([]);

    const { checkAuth } = await import("../api");
    const result = await checkAuth();

    expect(result).toBe(true);
    expect(mockApi).toHaveBeenCalledWith("/favorites");
  });

  it("returns false when /favorites call throws (unauthenticated)", async () => {
    mockApi.mockRejectedValue(new Error("401 Unauthorized"));

    const { checkAuth } = await import("../api");
    const result = await checkAuth();

    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// autoLogin
// ---------------------------------------------------------------------------

describe("autoLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Override the global fetch (MSW also uses it — stub AFTER MSW setup)
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns username when auto-login succeeds", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ username: "autouser" }),
    });

    const { autoLogin } = await import("../api");
    const result = await autoLogin();

    expect(result).toEqual({ username: "autouser" });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/auth/auto-login",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("returns null when auto-login returns non-ok response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({}),
    });

    const { autoLogin } = await import("../api");
    const result = await autoLogin();

    expect(result).toBeNull();
  });

  it("returns null when fetch throws (network error)", async () => {
    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

    const { autoLogin } = await import("../api");
    const result = await autoLogin();

    expect(result).toBeNull();
  });
});
