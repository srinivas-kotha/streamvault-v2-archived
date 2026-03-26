import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { XtreamCategory, XtreamVODStream, XtreamVODInfo } from "@shared/types/api";

// ── mock api ──────────────────────────────────────────────────────────────────

const mockApi = vi.fn();
vi.mock("@lib/api", () => ({
  api: (...args: unknown[]) => mockApi(...args),
}));

vi.mock("@lib/queryConfig", () => ({
  STALE_TIMES: {
    categories: 21600000,
    streams: 7200000,
  },
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const mockCategories: XtreamCategory[] = [
  { id: "1", name: "TELUGU (2026)", parentId: null, type: "vod" },
  { id: "2", name: "HINDI (2024)", parentId: null, type: "vod" },
];

const mockStreams: XtreamVODStream[] = [
  {
    id: "v-1",
    name: "Baahubali",
    type: "vod",
    categoryId: "1",
    icon: null,
    added: "1700000000",
    isAdult: false,
  },
];

const mockVODInfo: XtreamVODInfo = {
  id: "v-1",
  name: "Baahubali",
  type: "vod",
  categoryId: "1",
  icon: null,
  added: "1700000000",
  isAdult: false,
  plot: "Epic war movie",
  duration: "3h 0m",
  durationSecs: 10800,
};

// ---------------------------------------------------------------------------
// useVODCategories
// ---------------------------------------------------------------------------

describe("useVODCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.mockResolvedValue(mockCategories);
  });

  it("fetches VOD categories from /vod/categories", async () => {
    const { useVODCategories } = await import("../api");
    const { result } = renderHook(() => useVODCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi).toHaveBeenCalledWith("/vod/categories");
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0]!.name).toBe("TELUGU (2026)");
  });

  it("uses ['vod', 'categories'] as query key", async () => {
    const { useVODCategories } = await import("../api");
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    renderHook(() => useVODCategories(), { wrapper });
    await waitFor(() => expect(mockApi).toHaveBeenCalledTimes(1));

    // Second call should hit cache (same query key)
    renderHook(() => useVODCategories(), { wrapper });
    await waitFor(() => expect(mockApi).toHaveBeenCalledTimes(1));
  });

  it("returns isError on fetch failure", async () => {
    mockApi.mockRejectedValue(new Error("Network error"));
    const { useVODCategories } = await import("../api");
    const { result } = renderHook(() => useVODCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ---------------------------------------------------------------------------
// useVODStreams
// ---------------------------------------------------------------------------

describe("useVODStreams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.mockResolvedValue(mockStreams);
  });

  it("fetches streams for a given category ID", async () => {
    const { useVODStreams } = await import("../api");
    const { result } = renderHook(() => useVODStreams("42"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi).toHaveBeenCalledWith("/vod/streams/42");
    expect(result.current.data![0]!.name).toBe("Baahubali");
  });

  it("does not fetch when categoryId is empty", async () => {
    const { useVODStreams } = await import("../api");
    renderHook(() => useVODStreams(""), { wrapper: createWrapper() });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("uses categoryId in the query key for cache isolation", async () => {
    const { useVODStreams } = await import("../api");
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    renderHook(() => useVODStreams("cat-1"), { wrapper });
    await waitFor(() => expect(mockApi).toHaveBeenCalledWith("/vod/streams/cat-1"));

    renderHook(() => useVODStreams("cat-2"), { wrapper });
    await waitFor(() => expect(mockApi).toHaveBeenCalledWith("/vod/streams/cat-2"));

    expect(mockApi).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// useVODInfo
// ---------------------------------------------------------------------------

describe("useVODInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.mockResolvedValue(mockVODInfo);
  });

  it("fetches VOD info for a given ID", async () => {
    const { useVODInfo } = await import("../api");
    const { result } = renderHook(() => useVODInfo("v-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi).toHaveBeenCalledWith("/vod/info/v-1");
    expect(result.current.data?.plot).toBe("Epic war movie");
    expect(result.current.data?.durationSecs).toBe(10800);
  });

  it("does not fetch when vodId is empty", async () => {
    const { useVODInfo } = await import("../api");
    renderHook(() => useVODInfo(""), { wrapper: createWrapper() });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("returns isError on fetch failure", async () => {
    mockApi.mockRejectedValue(new Error("Not found"));
    const { useVODInfo } = await import("../api");
    const { result } = renderHook(() => useVODInfo("bad-id"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
