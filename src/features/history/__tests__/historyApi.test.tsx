import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { DbWatchHistory } from "@shared/types/api";

// ── mock api ──────────────────────────────────────────────────────────────────

const mockApi = vi.fn();
vi.mock("@lib/api", () => ({
  api: (...args: unknown[]) => mockApi(...args),
}));

vi.mock("@lib/queryConfig", () => ({
  STALE_TIMES: { history: 120000 },
}));

vi.mock("@lib/toastStore", () => ({
  useToastStore: {
    getState: () => ({ addToast: vi.fn() }),
  },
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const makeHistoryEntry = (contentId: number): DbWatchHistory => ({
  id: contentId * 10,
  user_id: 1,
  content_type: "vod",
  content_id: contentId,
  content_name: `Movie ${contentId}`,
  content_icon: null,
  progress_seconds: 600,
  duration_seconds: 3600,
  watched_at: new Date().toISOString(),
});

// ---------------------------------------------------------------------------
// useWatchHistory
// ---------------------------------------------------------------------------

describe("useWatchHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.mockResolvedValue([makeHistoryEntry(1), makeHistoryEntry(2)]);
  });

  it("fetches watch history from /history", async () => {
    const { useWatchHistory } = await import("../api");
    const { result } = renderHook(() => useWatchHistory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi).toHaveBeenCalledWith("/history");
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0]!.progress_seconds).toBe(600);
  });

  it("returns isError on fetch failure", async () => {
    mockApi.mockRejectedValue(new Error("Network error"));
    const { useWatchHistory } = await import("../api");
    const { result } = renderHook(() => useWatchHistory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ---------------------------------------------------------------------------
// useClearHistory
// ---------------------------------------------------------------------------

describe("useClearHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.mockResolvedValue(undefined);
  });

  it("calls DELETE /history", async () => {
    const { useClearHistory } = await import("../api");
    const { result } = renderHook(() => useClearHistory(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi).toHaveBeenCalledWith(
      "/history",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("enters error state when DELETE fails", async () => {
    mockApi.mockRejectedValue(new Error("Server error"));
    const { useClearHistory } = await import("../api");
    const { result } = renderHook(() => useClearHistory(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ---------------------------------------------------------------------------
// useRemoveHistoryItem
// ---------------------------------------------------------------------------

describe("useRemoveHistoryItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.mockResolvedValue(undefined);
  });

  it("calls DELETE /history/<contentId>?content_type=<type>", async () => {
    const { useRemoveHistoryItem } = await import("../api");
    const { result } = renderHook(() => useRemoveHistoryItem(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ contentId: 42, contentType: "vod" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi).toHaveBeenCalledWith(
      "/history/42?content_type=vod",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("includes the correct content_type query param for live", async () => {
    const { useRemoveHistoryItem } = await import("../api");
    const { result } = renderHook(() => useRemoveHistoryItem(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ contentId: 7, contentType: "live" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledUrl = mockApi.mock.calls[0]?.[0] as string;
    expect(calledUrl).toBe("/history/7?content_type=live");
  });
});
