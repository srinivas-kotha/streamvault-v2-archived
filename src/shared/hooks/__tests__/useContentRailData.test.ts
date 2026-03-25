import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useContentRailData,
  type UseContentRailDataOptions,
} from "../useContentRailData";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
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

interface TestItem {
  id: number;
  name: string;
  added: string;
  rating_5based: string;
}

function makeItems(count: number, prefix = "Item"): TestItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `${prefix} ${i + 1}`,
    added: String(1700000000 + i * 100),
    rating_5based: String((4.5 - i * 0.1).toFixed(1)),
  }));
}

describe("useContentRailData", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  function renderRailHook(
    overrides: Partial<UseContentRailDataOptions<TestItem>> = {},
  ) {
    const defaults: UseContentRailDataOptions<TestItem> = {
      categoryIds: [1],
      fetchFn: vi.fn().mockResolvedValue(makeItems(5)),
      queryKeyPrefix: ["test"],
      dedupeKey: "id",
      ...overrides,
    };

    return renderHook(() => useContentRailData(defaults), {
      wrapper: createWrapper(queryClient),
    });
  }

  it("returns items, isLoading, and error", () => {
    const { result } = renderRailHook();

    expect(result.current).toHaveProperty("items");
    expect(result.current).toHaveProperty("isLoading");
    expect(result.current).toHaveProperty("error");
  });

  it("starts in loading state", () => {
    const { result } = renderRailHook({
      fetchFn: () => new Promise(() => {}), // never resolves
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.items).toEqual([]);
  });

  it("returns fetched items after loading", async () => {
    const items = makeItems(3);
    const { result } = renderRailHook({
      fetchFn: vi.fn().mockResolvedValue(items),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items).toHaveLength(3);
    expect(result.current.error).toBeNull();
  });

  it("deduplicates items by dedupeKey", async () => {
    const dupeItems: TestItem[] = [
      { id: 1, name: "A", added: "1700000001", rating_5based: "5.0" },
      { id: 1, name: "A Dupe", added: "1700000002", rating_5based: "5.0" },
      { id: 2, name: "B", added: "1700000003", rating_5based: "4.0" },
    ];

    const { result } = renderRailHook({
      categoryIds: [1],
      fetchFn: vi.fn().mockResolvedValue(dupeItems),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items).toHaveLength(2);
    const ids = result.current.items.map((i) => i.id);
    expect(ids).toContain(1);
    expect(ids).toContain(2);
  });

  it("deduplicates across multiple categories", async () => {
    const cat1Items: TestItem[] = [
      { id: 1, name: "Shared", added: "1700000001", rating_5based: "5.0" },
      { id: 2, name: "Cat1 Only", added: "1700000002", rating_5based: "4.0" },
    ];
    const cat2Items: TestItem[] = [
      { id: 1, name: "Shared Dupe", added: "1700000003", rating_5based: "5.0" },
      { id: 3, name: "Cat2 Only", added: "1700000004", rating_5based: "3.0" },
    ];

    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(cat1Items)
      .mockResolvedValueOnce(cat2Items);

    const { result } = renderRailHook({
      categoryIds: [1, 2],
      fetchFn,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items).toHaveLength(3);
  });

  it("sorts by added (descending) by default", async () => {
    const items: TestItem[] = [
      { id: 1, name: "Old", added: "1700000001", rating_5based: "3.0" },
      { id: 2, name: "New", added: "1700000099", rating_5based: "2.0" },
      { id: 3, name: "Mid", added: "1700000050", rating_5based: "4.0" },
    ];

    const { result } = renderRailHook({
      fetchFn: vi.fn().mockResolvedValue(items),
      sortBy: "added",
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items[0].name).toBe("New");
    expect(result.current.items[1].name).toBe("Mid");
    expect(result.current.items[2].name).toBe("Old");
  });

  it("sorts by rating (descending)", async () => {
    const items: TestItem[] = [
      { id: 1, name: "Low", added: "1700000001", rating_5based: "2.0" },
      { id: 2, name: "High", added: "1700000002", rating_5based: "5.0" },
      { id: 3, name: "Mid", added: "1700000003", rating_5based: "3.5" },
    ];

    const { result } = renderRailHook({
      fetchFn: vi.fn().mockResolvedValue(items),
      sortBy: "rating",
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items[0].name).toBe("High");
    expect(result.current.items[1].name).toBe("Mid");
    expect(result.current.items[2].name).toBe("Low");
  });

  it("sorts by name (ascending)", async () => {
    const items: TestItem[] = [
      { id: 1, name: "Zebra", added: "1700000001", rating_5based: "3.0" },
      { id: 2, name: "Apple", added: "1700000002", rating_5based: "4.0" },
      { id: 3, name: "Mango", added: "1700000003", rating_5based: "2.0" },
    ];

    const { result } = renderRailHook({
      fetchFn: vi.fn().mockResolvedValue(items),
      sortBy: "name",
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items[0].name).toBe("Apple");
    expect(result.current.items[1].name).toBe("Mango");
    expect(result.current.items[2].name).toBe("Zebra");
  });

  it("limits results to the specified limit", async () => {
    const items = makeItems(10);
    const { result } = renderRailHook({
      fetchFn: vi.fn().mockResolvedValue(items),
      limit: 3,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items).toHaveLength(3);
  });

  it("uses default limit of 20", async () => {
    const items = makeItems(25);
    const { result } = renderRailHook({
      fetchFn: vi.fn().mockResolvedValue(items),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items).toHaveLength(20);
  });

  it("returns error when fetch fails", async () => {
    const { result } = renderRailHook({
      fetchFn: vi.fn().mockRejectedValue(new Error("Network error")),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Network error");
  });

  it("does not fetch when enabled is false", async () => {
    const fetchFn = vi.fn().mockResolvedValue([]);

    renderRailHook({
      fetchFn,
      enabled: false,
    });

    // Give it a moment — should not be called
    await new Promise((r) => setTimeout(r, 50));
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("does not fetch when categoryIds is empty", async () => {
    const fetchFn = vi.fn().mockResolvedValue([]);

    renderRailHook({
      categoryIds: [],
      fetchFn,
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("returns empty items when all queries return empty arrays", async () => {
    const { result } = renderRailHook({
      categoryIds: [1, 2],
      fetchFn: vi.fn().mockResolvedValue([]),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items).toEqual([]);
  });

  it("handles added field as ISO date string", async () => {
    const items: TestItem[] = [
      {
        id: 1,
        name: "Old",
        added: "2024-01-01T00:00:00Z",
        rating_5based: "3.0",
      },
      {
        id: 2,
        name: "New",
        added: "2025-06-15T00:00:00Z",
        rating_5based: "3.0",
      },
    ];

    const { result } = renderRailHook({
      fetchFn: vi.fn().mockResolvedValue(items),
      sortBy: "added",
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Newer date should come first (descending)
    expect(result.current.items[0].name).toBe("New");
    expect(result.current.items[1].name).toBe("Old");
  });

  it("fetches each category with its own query", async () => {
    const fetchFn = vi.fn().mockResolvedValue(makeItems(2));

    const { result } = renderRailHook({
      categoryIds: [10, 20, 30],
      fetchFn,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchFn).toHaveBeenCalledWith(10);
    expect(fetchFn).toHaveBeenCalledWith(20);
    expect(fetchFn).toHaveBeenCalledWith(30);
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });
});
