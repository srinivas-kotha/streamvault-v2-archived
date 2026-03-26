import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type {
  XtreamCategory,
  XtreamLiveStream,
  XtreamEPGItem,
} from "@shared/types/api";

// ── mock api ──────────────────────────────────────────────────────────────────

const mockApi = vi.fn();
vi.mock("@lib/api", () => ({
  api: (...args: unknown[]) => mockApi(...args),
}));

vi.mock("@lib/queryConfig", () => ({
  STALE_TIMES: {
    liveStreams: 1800000,
    liveCategories: 3600000,
    epg: 900000,
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

const mockLiveStream: XtreamLiveStream = {
  id: "ls-1",
  name: "Star News",
  type: "live",
  categoryId: "10",
  icon: null,
  added: null,
  isAdult: false,
};

const mockCategory: XtreamCategory = {
  id: "10",
  name: "News",
  parentId: null,
  type: "live",
};

const mockEPGItem: XtreamEPGItem = {
  id: "epg-1",
  channelId: "ls-1",
  title: "Morning News",
  description: "Daily news roundup",
  start: "2024-01-01T08:00:00Z",
  end: "2024-01-01T09:00:00Z",
};

// ---------------------------------------------------------------------------
// useFeaturedChannels
// ---------------------------------------------------------------------------

describe("useFeaturedChannels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.mockResolvedValue([mockLiveStream]);
  });

  it("fetches from /live/featured", async () => {
    const { useFeaturedChannels } = await import("../api");
    const { result } = renderHook(() => useFeaturedChannels(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi).toHaveBeenCalledWith("/live/featured");
    expect(result.current.data![0]!.name).toBe("Star News");
  });

  it("returns isError on failure", async () => {
    mockApi.mockRejectedValue(new Error("Unavailable"));
    const { useFeaturedChannels } = await import("../api");
    const { result } = renderHook(() => useFeaturedChannels(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ---------------------------------------------------------------------------
// useLiveCategories
// ---------------------------------------------------------------------------

describe("useLiveCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.mockResolvedValue([mockCategory]);
  });

  it("fetches from /live/categories", async () => {
    const { useLiveCategories } = await import("../api");
    const { result } = renderHook(() => useLiveCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi).toHaveBeenCalledWith("/live/categories");
    expect(result.current.data![0]!.name).toBe("News");
  });

  it("deduplicates via query cache (same query key = single fetch)", async () => {
    const { useLiveCategories } = await import("../api");
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    renderHook(() => useLiveCategories(), { wrapper });
    renderHook(() => useLiveCategories(), { wrapper });

    await waitFor(() => expect(mockApi).toHaveBeenCalledTimes(1));
  });
});

// ---------------------------------------------------------------------------
// useLiveStreams
// ---------------------------------------------------------------------------

describe("useLiveStreams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.mockResolvedValue([mockLiveStream]);
  });

  it("fetches streams for a given categoryId", async () => {
    const { useLiveStreams } = await import("../api");
    const { result } = renderHook(() => useLiveStreams("10"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi).toHaveBeenCalledWith("/live/streams/10");
  });

  it("does not fetch when categoryId is empty", async () => {
    const { useLiveStreams } = await import("../api");
    renderHook(() => useLiveStreams(""), { wrapper: createWrapper() });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockApi).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// useEPG
// ---------------------------------------------------------------------------

describe("useEPG", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.mockResolvedValue([mockEPGItem]);
  });

  it("fetches EPG data for a given streamId", async () => {
    const { useEPG } = await import("../api");
    const { result } = renderHook(() => useEPG("ls-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi).toHaveBeenCalledWith("/live/epg/ls-1");
    expect(result.current.data![0]!.title).toBe("Morning News");
  });

  it("does not fetch when streamId is empty", async () => {
    const { useEPG } = await import("../api");
    renderHook(() => useEPG(""), { wrapper: createWrapper() });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockApi).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// useBulkEPG
// ---------------------------------------------------------------------------

describe("useBulkEPG", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.mockResolvedValue({ "ls-1": [mockEPGItem], "ls-2": [] });
  });

  it("POSTs to /live/epg/bulk with stream IDs", async () => {
    const { useBulkEPG } = await import("../api");
    const { result } = renderHook(() => useBulkEPG(["ls-1", "ls-2"]), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi).toHaveBeenCalledWith(
      "/live/epg/bulk",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ stream_ids: ["ls-1", "ls-2"] }),
      }),
    );
  });

  it("does not fetch when streamIds array is empty", async () => {
    const { useBulkEPG } = await import("../api");
    renderHook(() => useBulkEPG([]), { wrapper: createWrapper() });

    await new Promise((r) => setTimeout(r, 50));
    expect(mockApi).not.toHaveBeenCalled();
  });
});
