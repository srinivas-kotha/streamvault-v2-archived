/**
 * Sprint 7 — Shared IntersectionObserver singleton tests
 *
 * Verifies the observer pool reuses instances, callbacks fire correctly,
 * and cleanup unobserves elements.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── IntersectionObserver mock ──────────────────────────────────────────────

type IOCallback = (entries: IntersectionObserverEntry[]) => void;

let ioInstances: Array<{
  callback: IOCallback;
  options: IntersectionObserverInit | undefined;
  observe: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}> = [];

beforeEach(() => {
  ioInstances = [];
  vi.stubGlobal(
    "IntersectionObserver",
    vi.fn((callback: IOCallback, options?: IntersectionObserverInit) => {
      const instance = {
        callback,
        options,
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
        root: null,
        rootMargin: options?.rootMargin ?? "",
        thresholds: Array.isArray(options?.threshold)
          ? options!.threshold
          : [options?.threshold ?? 0],
        takeRecords: () => [],
      };
      ioInstances.push(instance);
      return instance;
    }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  // Clear module cache so the singleton map resets between tests
  vi.resetModules();
});

async function importObserve() {
  const mod = await import("../useSharedIntersectionObserver");
  return mod.observe;
}

describe("useSharedIntersectionObserver", () => {
  it("observe() returns a cleanup function", async () => {
    const observe = await importObserve();
    const el = document.createElement("div");
    const cleanup = observe(el, vi.fn());
    expect(typeof cleanup).toBe("function");
  });

  it("calling cleanup unobserves the element", async () => {
    const observe = await importObserve();
    const el = document.createElement("div");
    const cleanup = observe(el, vi.fn());

    expect(ioInstances).toHaveLength(1);
    expect(ioInstances[0].observe).toHaveBeenCalledWith(el);

    cleanup();
    expect(ioInstances[0].unobserve).toHaveBeenCalledWith(el);
  });

  it("multiple elements with same options share one observer instance", async () => {
    const observe = await importObserve();
    const el1 = document.createElement("div");
    const el2 = document.createElement("div");

    observe(el1, vi.fn());
    observe(el2, vi.fn());

    // Only one IntersectionObserver should have been constructed
    expect(ioInstances).toHaveLength(1);
    expect(ioInstances[0].observe).toHaveBeenCalledTimes(2);
    expect(ioInstances[0].observe).toHaveBeenCalledWith(el1);
    expect(ioInstances[0].observe).toHaveBeenCalledWith(el2);
  });

  it("different options create different observer instances", async () => {
    const observe = await importObserve();
    const el1 = document.createElement("div");
    const el2 = document.createElement("div");

    observe(el1, vi.fn(), { rootMargin: "100px 0px", threshold: 0 });
    observe(el2, vi.fn(), { rootMargin: "50px 0px", threshold: 0.5 });

    expect(ioInstances).toHaveLength(2);
  });

  it("callback fires when intersection changes", async () => {
    const observe = await importObserve();
    const el = document.createElement("div");
    const cb = vi.fn();

    observe(el, cb);

    // Simulate the observer firing
    const mockEntry = {
      target: el,
      isIntersecting: true,
      intersectionRatio: 1,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: Date.now(),
    } as IntersectionObserverEntry;

    ioInstances[0].callback([mockEntry]);

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith(mockEntry);
  });

  it("callback does not fire for unrelated elements", async () => {
    const observe = await importObserve();
    const el1 = document.createElement("div");
    const el2 = document.createElement("div");
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    observe(el1, cb1);
    observe(el2, cb2);

    // Fire only for el1
    const mockEntry = {
      target: el1,
      isIntersecting: true,
      intersectionRatio: 1,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: Date.now(),
    } as IntersectionObserverEntry;

    ioInstances[0].callback([mockEntry]);

    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).not.toHaveBeenCalled();
  });

  it("after cleanup, callback no longer fires for that element", async () => {
    const observe = await importObserve();
    const el = document.createElement("div");
    const cb = vi.fn();

    const cleanup = observe(el, cb);
    cleanup();

    // Simulate observer firing after cleanup
    const mockEntry = {
      target: el,
      isIntersecting: true,
      intersectionRatio: 1,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: Date.now(),
    } as IntersectionObserverEntry;

    ioInstances[0].callback([mockEntry]);

    expect(cb).not.toHaveBeenCalled();
  });
});
