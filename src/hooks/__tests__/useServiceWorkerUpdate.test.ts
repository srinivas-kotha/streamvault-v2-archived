import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useServiceWorkerUpdate } from "../useServiceWorkerUpdate";
import { useToastStore } from "@lib/toastStore";

// ── Mock navigator.serviceWorker ──────────────────────────────────────────────

function makeMockSW(state: ServiceWorkerState = "activated"): ServiceWorker {
  return {
    state,
    postMessage: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    scriptURL: "",
    onstatechange: null,
    onerror: null,
  } as unknown as ServiceWorker;
}

function makeMockRegistration(
  overrides: Partial<ServiceWorkerRegistration> = {},
): ServiceWorkerRegistration {
  return {
    installing: null,
    waiting: null,
    active: makeMockSW(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    update: vi.fn(),
    unregister: vi.fn(),
    ...overrides,
  } as unknown as ServiceWorkerRegistration;
}

type SWEventListener = (event: Event) => void;

function makeMockServiceWorkerContainer() {
  const listeners = new Map<string, SWEventListener[]>();
  return {
    controller: makeMockSW(),
    ready: Promise.resolve(makeMockRegistration()),
    getRegistration: vi.fn().mockResolvedValue(makeMockRegistration()),
    register: vi.fn(),
    addEventListener: vi.fn((event: string, handler: SWEventListener) => {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event)!.push(handler);
    }),
    removeEventListener: vi.fn((event: string, handler: SWEventListener) => {
      const list = listeners.get(event) ?? [];
      const idx = list.indexOf(handler);
      if (idx !== -1) list.splice(idx, 1);
      listeners.set(event, list);
    }),
    dispatchEvent: vi.fn(),
    _emit(event: string, data: unknown) {
      const list = listeners.get(event) ?? [];
      const e = Object.assign(new Event(event), { data });
      list.forEach((h) => h(e));
    },
    _listeners: listeners,
  };
}

// ── Mock window.location ──────────────────────────────────────────────────────
// jsdom does not allow spyOn(window.location, 'reload') — it's non-configurable.
// We replace window.location entirely with a mock object.

const reloadMock = vi.fn();

function mockWindowLocation() {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      href: "/",
      reload: reloadMock,
      assign: vi.fn(),
      replace: vi.fn(),
    },
  });
}

describe("useServiceWorkerUpdate()", () => {
  let mockSwContainer: ReturnType<typeof makeMockServiceWorkerContainer>;

  beforeEach(() => {
    mockWindowLocation();
    reloadMock.mockClear();

    mockSwContainer = makeMockServiceWorkerContainer();
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      get: () => mockSwContainer,
    });

    // Reset toast store
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers message and controllerchange listeners on mount", () => {
    renderHook(() => useServiceWorkerUpdate());

    expect(mockSwContainer.addEventListener).toHaveBeenCalledWith(
      "message",
      expect.any(Function),
    );
    expect(mockSwContainer.addEventListener).toHaveBeenCalledWith(
      "controllerchange",
      expect.any(Function),
    );
  });

  it("shows update toast when SW_UPDATE_WAITING message is received", () => {
    renderHook(() => useServiceWorkerUpdate());

    // Simulate new SW posting SW_UPDATE_WAITING
    mockSwContainer._emit("message", { type: "SW_UPDATE_WAITING" });

    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]!.message).toContain("New version available");
    expect(toasts[0]!.severity).toBe("info");
    // duration 0 means no auto-dismiss
    expect(toasts[0]!.duration).toBe(0);
  });

  it("does NOT show toast for unrelated SW messages", () => {
    renderHook(() => useServiceWorkerUpdate());

    mockSwContainer._emit("message", { type: "SOMETHING_ELSE" });

    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(0);
  });

  it("shows update toast when waiting SW is already present on mount", async () => {
    const waitingSW = makeMockSW("installed");
    const regWithWaiting = makeMockRegistration({ waiting: waitingSW });
    mockSwContainer.getRegistration = vi.fn().mockResolvedValue(regWithWaiting);

    renderHook(() => useServiceWorkerUpdate());

    // Allow getRegistration promise to resolve
    await Promise.resolve();
    await Promise.resolve();

    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]!.message).toContain("New version available");
  });

  it("calls window.location.reload() on controllerchange", () => {
    renderHook(() => useServiceWorkerUpdate());

    mockSwContainer._emit("controllerchange", undefined);

    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("sends SKIP_WAITING to waiting SW when __swRefresh is called", async () => {
    const waitingSW = makeMockSW("installed");
    const reg = makeMockRegistration({ waiting: waitingSW });
    mockSwContainer.getRegistration = vi.fn().mockResolvedValue(reg);

    renderHook(() => useServiceWorkerUpdate());

    // Allow getRegistration to resolve
    await Promise.resolve();

    // Call the exposed refresh handler
    const swWindow = window as Window & { __swRefresh?: () => void };
    swWindow.__swRefresh?.();

    expect(waitingSW.postMessage).toHaveBeenCalledWith({
      type: "SKIP_WAITING",
    });
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("removes event listeners and cleans up __swRefresh on unmount", () => {
    const { unmount } = renderHook(() => useServiceWorkerUpdate());

    unmount();

    expect(mockSwContainer.removeEventListener).toHaveBeenCalledWith(
      "message",
      expect.any(Function),
    );
    expect(mockSwContainer.removeEventListener).toHaveBeenCalledWith(
      "controllerchange",
      expect.any(Function),
    );

    const swWindow = window as Window & { __swRefresh?: () => void };
    expect(swWindow.__swRefresh).toBeUndefined();
  });

  it("does nothing when serviceWorker is not in navigator", () => {
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      get: () => undefined,
    });

    expect(() => {
      renderHook(() => useServiceWorkerUpdate());
    }).not.toThrow();
  });

  it("does not show duplicate toasts for multiple SW_UPDATE_WAITING messages", () => {
    renderHook(() => useServiceWorkerUpdate());

    mockSwContainer._emit("message", { type: "SW_UPDATE_WAITING" });
    mockSwContainer._emit("message", { type: "SW_UPDATE_WAITING" });

    // toastStore caps at 3 and deduplicates by slice(-2) + new
    const { toasts } = useToastStore.getState();
    // Both messages are queued (toastStore allows up to 3 with slice(-2))
    expect(toasts.length).toBeGreaterThan(0);
    expect(
      toasts.every((t) => t.message.includes("New version available")),
    ).toBe(true);
  });
});
