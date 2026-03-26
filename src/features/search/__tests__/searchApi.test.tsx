import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { SearchResults } from "@shared/types/api";

// ── mock api ──────────────────────────────────────────────────────────────────

const mockApi = vi.fn();
vi.mock("@lib/api", () => ({
  api: (...args: unknown[]) => mockApi(...args),
}));

vi.mock("@lib/queryConfig", () => ({
  STALE_TIMES: { search: 60000 },
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const mockResults: SearchResults = {
  live: [],
  vod: [
    {
      id: "v-1",
      name: "Baahubali",
      type: "vod",
      categoryId: "1",
      icon: null,
      added: "1700000000",
      isAdult: false,
    },
  ],
  series: [],
};

// ---------------------------------------------------------------------------
// useSearch
// ---------------------------------------------------------------------------

describe("useSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.mockResolvedValue(mockResults);
  });

  it("fetches results when query has 2+ characters", async () => {
    const { useSearch } = await import("../api");
    const { result } = renderHook(() => useSearch("ba"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi).toHaveBeenCalledWith("/search?q=ba");
    expect(result.current.data?.vod[0]?.name).toBe("Baahubali");
  });

  it("URL-encodes special characters in query", async () => {
    const { useSearch } = await import("../api");
    const { result } = renderHook(() => useSearch("star wars"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledUrl = mockApi.mock.calls[0]?.[0] as string;
    expect(calledUrl).toBe("/search?q=star%20wars");
  });

  it("does not fetch when query is empty", async () => {
    const { useSearch } = await import("../api");
    const { result } = renderHook(() => useSearch(""), {
      wrapper: createWrapper(),
    });

    // enabled: false — no fetch should happen
    await new Promise((r) => setTimeout(r, 50));
    expect(mockApi).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it("does not fetch when query has only 1 character", async () => {
    const { useSearch } = await import("../api");
    const { result } = renderHook(() => useSearch("a"), {
      wrapper: createWrapper(),
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockApi).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it("fetches when query becomes long enough (re-render)", async () => {
    const { useSearch } = await import("../api");
    let query = "a";
    const { result, rerender } = renderHook(() => useSearch(query), {
      wrapper: createWrapper(),
    });

    // Should not fetch with 1 char
    await new Promise((r) => setTimeout(r, 30));
    expect(mockApi).not.toHaveBeenCalled();

    // Extend to 2+ chars
    query = "ab";
    rerender();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledTimes(1);
  });

  it("uses different cache keys for different queries", async () => {
    const { useSearch } = await import("../api");
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    renderHook(() => useSearch("te"), { wrapper });
    await waitFor(() => expect(mockApi).toHaveBeenCalledTimes(1));

    renderHook(() => useSearch("tel"), { wrapper });
    await waitFor(() => expect(mockApi).toHaveBeenCalledTimes(2));
  });

  it("returns isError state on API failure", async () => {
    mockApi.mockRejectedValue(new Error("Server error"));

    const { useSearch } = await import("../api");
    const { result } = renderHook(() => useSearch("test"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
