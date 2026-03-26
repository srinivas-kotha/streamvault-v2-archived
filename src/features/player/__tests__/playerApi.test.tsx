import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// ── mock api ─────────────────────────────────────────────────────────────────

const mockApi = vi.fn();
vi.mock("@lib/api", () => ({
  api: (...args: unknown[]) => mockApi(...args),
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// useStreamUrl — pure derived data (no network call)
// ---------------------------------------------------------------------------

describe("useStreamUrl", () => {
  it("returns a URL for a live stream", async () => {
    const { useStreamUrl } = await import("../api");
    const { result } = renderHook(() => useStreamUrl("live", "42"), {
      wrapper: createWrapper(),
    });

    expect(result.current.data?.url).toBe("/api/stream/live/42");
    expect(result.current.data?.isLive).toBe(true);
    expect(result.current.data?.format).toBe("ts");
  });

  it("returns a URL for a vod stream", async () => {
    const { useStreamUrl } = await import("../api");
    const { result } = renderHook(() => useStreamUrl("vod", "99"), {
      wrapper: createWrapper(),
    });

    expect(result.current.data?.url).toBe("/api/stream/vod/99");
    expect(result.current.data?.isLive).toBe(false);
    expect(result.current.data?.format).toBe("mp4");
  });

  it("returns a URL for a series episode stream", async () => {
    const { useStreamUrl } = await import("../api");
    const { result } = renderHook(() => useStreamUrl("series", "ep-123"), {
      wrapper: createWrapper(),
    });

    expect(result.current.data?.url).toBe("/api/stream/series/ep-123");
    expect(result.current.data?.isLive).toBe(false);
    expect(result.current.data?.format).toBe("mp4");
  });

  it("returns undefined data when type or id is empty", async () => {
    const { useStreamUrl } = await import("../api");

    const { result: r1 } = renderHook(() => useStreamUrl("", "42"), {
      wrapper: createWrapper(),
    });
    expect(r1.current.data).toBeUndefined();

    const { result: r2 } = renderHook(() => useStreamUrl("live", ""), {
      wrapper: createWrapper(),
    });
    expect(r2.current.data).toBeUndefined();
  });

  it("is never in a loading state (data is computed synchronously)", async () => {
    const { useStreamUrl } = await import("../api");
    const { result } = renderHook(() => useStreamUrl("live", "1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// useUpdateHistory — mutation hook
// ---------------------------------------------------------------------------

describe("useUpdateHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.mockResolvedValue(undefined);
  });

  it("calls PUT /history/<id> with the correct payload", async () => {
    const { useUpdateHistory } = await import("../api");
    const { result } = renderHook(() => useUpdateHistory(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        contentId: "42",
        content_type: "vod",
        progress_seconds: 120,
        duration_seconds: 3600,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi).toHaveBeenCalledWith(
      "/history/42",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          content_type: "vod",
          progress_seconds: 120,
          duration_seconds: 3600,
        }),
      }),
    );
  });

  it("includes optional content_name and content_icon if provided", async () => {
    const { useUpdateHistory } = await import("../api");
    const { result } = renderHook(() => useUpdateHistory(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        contentId: "7",
        content_type: "live",
        content_name: "BBC One",
        content_icon: "https://example.com/bbc.png",
        progress_seconds: 0,
        duration_seconds: 0,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const body = JSON.parse(mockApi.mock.calls[0]![1]!.body);
    expect(body.content_name).toBe("BBC One");
    expect(body.content_icon).toBe("https://example.com/bbc.png");
  });
});
