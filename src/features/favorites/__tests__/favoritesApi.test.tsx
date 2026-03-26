import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { DbFavorite } from "@shared/types/api";

// ── mock api ──────────────────────────────────────────────────────────────────

const mockApi = vi.fn();
vi.mock("@lib/api", () => ({
  api: (...args: unknown[]) => mockApi(...args),
}));

vi.mock("@lib/queryConfig", () => ({
  STALE_TIMES: { favorites: 300000 },
}));

// mock toast to avoid store side-effects
vi.mock("@lib/toastStore", () => ({
  useToastStore: {
    getState: () => ({ addToast: vi.fn() }),
  },
}));

function createWrapper(client?: QueryClient) {
  const qc =
    client ??
    new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

const makeFavorite = (contentId: number): DbFavorite => ({
  id: contentId * 10,
  user_id: 1,
  content_type: "vod",
  content_id: contentId,
  content_name: `Movie ${contentId}`,
  content_icon: null,
  category_name: null,
  sort_order: 0,
  added_at: new Date().toISOString(),
});

// ---------------------------------------------------------------------------
// useFavorites
// ---------------------------------------------------------------------------

describe("useFavorites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.mockResolvedValue([makeFavorite(1), makeFavorite(2)]);
  });

  it("fetches favorites from /favorites", async () => {
    const { useFavorites } = await import("../api");
    const { result } = renderHook(() => useFavorites(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi).toHaveBeenCalledWith("/favorites");
    expect(result.current.data).toHaveLength(2);
  });

  it("returns isError on fetch failure", async () => {
    mockApi.mockRejectedValue(new Error("Unauthorized"));
    const { useFavorites } = await import("../api");
    const { result } = renderHook(() => useFavorites(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ---------------------------------------------------------------------------
// useIsFavorite — pure derived state from useFavorites
// ---------------------------------------------------------------------------

describe("useIsFavorite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.mockResolvedValue([makeFavorite(42), makeFavorite(99)]);
  });

  it("returns true for a content ID that is in favorites", async () => {
    const { useIsFavorite } = await import("../api");
    const { result } = renderHook(() => useIsFavorite("42"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current).toBe(true));
  });

  it("returns false for a content ID not in favorites", async () => {
    const { useIsFavorite } = await import("../api");
    const { result } = renderHook(() => useIsFavorite("1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current).toBe(false));
  });

  it("returns false when contentId is empty", async () => {
    const { useIsFavorite } = await import("../api");
    // Empty string short-circuits before data
    const { result } = renderHook(() => useIsFavorite(""), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBe(false);
  });

  it("returns false while favorites are still loading", async () => {
    // Never resolves during this test
    mockApi.mockReturnValue(new Promise(() => {}));
    const { useIsFavorite } = await import("../api");

    const { result } = renderHook(() => useIsFavorite("42"), {
      wrapper: createWrapper(),
    });

    // favorites still loading — should default to false
    expect(result.current).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// useAddFavorite — optimistic update
// ---------------------------------------------------------------------------

describe("useAddFavorite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls POST /favorites/<contentId>", async () => {
    mockApi.mockResolvedValue(makeFavorite(10));
    const { useAddFavorite } = await import("../api");
    const { result } = renderHook(() => useAddFavorite(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        contentId: "10",
        content_type: "vod",
        content_name: "Movie 10",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi).toHaveBeenCalledWith(
      "/favorites/10",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

// ---------------------------------------------------------------------------
// useRemoveFavorite
// ---------------------------------------------------------------------------

describe("useRemoveFavorite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.mockResolvedValue(undefined);
  });

  it("calls DELETE /favorites/<contentId>", async () => {
    const { useRemoveFavorite } = await import("../api");
    const { result } = renderHook(() => useRemoveFavorite(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate("99");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi).toHaveBeenCalledWith(
      "/favorites/99",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
