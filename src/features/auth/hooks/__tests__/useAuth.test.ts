import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the auth API module
const mockLogin = vi.fn();
const mockLogout = vi.fn();
const mockCheckAuth = vi.fn();

vi.mock("../../api", () => ({
  login: (...args: unknown[]) => mockLogin(...args),
  logout: (...args: unknown[]) => mockLogout(...args),
  checkAuth: (...args: unknown[]) => mockCheckAuth(...args),
}));

// Mock TanStack Router
const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock auth store
const mockSetAuth = vi.fn();
const mockClearAuth = vi.fn();

vi.mock("@lib/store", () => ({
  useAuthStore: (selector: (state: Record<string, unknown>) => unknown) => {
    const state = {
      clearAuth: mockClearAuth,
      setAuth: mockSetAuth,
    };
    return selector(state);
  },
}));

import { useAuthCheck, useLogin, useLogout } from "../useAuth";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

describe("useAuthCheck", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("returns a query result with data, isLoading, error", () => {
    mockCheckAuth.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useAuthCheck(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current).toHaveProperty("data");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("error");
  });

  it("calls setAuth when checkAuth returns true", async () => {
    localStorage.setItem("sv_user", "testuser");
    mockCheckAuth.mockResolvedValue(true);

    const { result } = renderHook(() => useAuthCheck(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe(true);
    expect(mockSetAuth).toHaveBeenCalledWith("testuser");
  });

  it('falls back to "user" when no saved username', async () => {
    mockCheckAuth.mockResolvedValue(true);

    const { result } = renderHook(() => useAuthCheck(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockSetAuth).toHaveBeenCalledWith("user");
  });

  it("calls clearAuth when checkAuth returns false", async () => {
    mockCheckAuth.mockResolvedValue(false);

    const { result } = renderHook(() => useAuthCheck(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe(false);
    expect(mockClearAuth).toHaveBeenCalled();
  });

  it("does not retry on failure", async () => {
    mockCheckAuth.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAuthCheck(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    // Should only be called once (no retry)
    expect(mockCheckAuth).toHaveBeenCalledTimes(1);
  });

  it("starts loading then resolves", async () => {
    mockCheckAuth.mockResolvedValue(true);

    const { result } = renderHook(() => useAuthCheck(), {
      wrapper: createWrapper(queryClient),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("uses auth-check as query key", () => {
    mockCheckAuth.mockReturnValue(new Promise(() => {}));
    renderHook(() => useAuthCheck(), {
      wrapper: createWrapper(queryClient),
    });

    const queryState = queryClient.getQueryState(["auth-check"]);
    expect(queryState).toBeDefined();
  });

  it("does not call setAuth when checkAuth returns false", async () => {
    mockCheckAuth.mockResolvedValue(false);

    const { result } = renderHook(() => useAuthCheck(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockSetAuth).not.toHaveBeenCalled();
    expect(mockClearAuth).toHaveBeenCalled();
  });
});

describe("useLogin", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it("returns a mutation with mutate and mutateAsync", () => {
    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("mutateAsync");
    expect(result.current).toHaveProperty("isPending");
  });

  it("calls login API with credentials and setAuth on success", async () => {
    mockLogin.mockResolvedValue({
      message: "ok",
      userId: 1,
      username: "admin",
    });

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({ username: "admin", password: "pass123" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockLogin).toHaveBeenCalledWith("admin", "pass123");
    expect(mockSetAuth).toHaveBeenCalledWith("admin");
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
  });

  it("calls setQueryData for auth-check on success", async () => {
    const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");
    mockLogin.mockResolvedValue({
      message: "ok",
      userId: 1,
      username: "user1",
    });

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({ username: "user1", password: "pass" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(setQueryDataSpy).toHaveBeenCalledWith(["auth-check"], true);
  });

  it("handles login failure", async () => {
    mockLogin.mockRejectedValue(new Error("Invalid credentials"));

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({ username: "bad", password: "wrong" });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("Invalid credentials");
    expect(mockSetAuth).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("starts in idle state", () => {
    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });
});

describe("useLogout", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it("returns a mutation with mutate", () => {
    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current).toHaveProperty("mutate");
    expect(result.current).toHaveProperty("isPending");
  });

  it("calls logout API and clears auth on success", async () => {
    mockLogout.mockResolvedValue(undefined);

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockLogout).toHaveBeenCalled();
    expect(mockClearAuth).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/login" });
  });

  it("clears the entire query cache on success", async () => {
    mockLogout.mockResolvedValue(undefined);

    // Pre-seed some cache data
    queryClient.setQueryData(["auth-check"], true);
    queryClient.setQueryData(["favorites"], []);

    const clearSpy = vi.spyOn(queryClient, "clear");

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(clearSpy).toHaveBeenCalled();
  });

  it("handles logout failure", async () => {
    mockLogout.mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(mockClearAuth).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("starts in idle state", () => {
    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
  });
});
