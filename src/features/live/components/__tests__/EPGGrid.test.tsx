/**
 * Sprint 5 — EPG Spatial Navigation Tests
 *
 * ENHANCEMENT to existing EPGGrid tests. These tests WILL FAIL until bravo adds:
 *   - useSpatialFocusable on EPGProgramBlock (focus ring, onEnterPress)
 *   - useSpatialContainer on EPGChannelRow (focusable: false)
 *   - D-pad Up/Down moves between channel rows
 *   - D-pad Left/Right moves between program blocks within a row
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EPGGrid } from "../EPGGrid";

// ── mock spatial nav ──────────────────────────────────────────────────────────

const mockSetFocus = vi.fn();
const mockOnEnterPress = vi.fn();

vi.mock("@shared/hooks/useSpatialNav", () => ({
  useSpatialFocusable: vi.fn(({ focusKey, onEnterPress }: any) => ({
    ref: { current: null },
    showFocusRing: focusKey === "epg-program-focused",
    focusProps: {
      "data-focus-key": focusKey,
      onKeyDown: (e: KeyboardEvent) => {
        if ((e.key === "Enter" || e.key === "Return") && onEnterPress) {
          onEnterPress();
        }
      },
    },
  })),
  useSpatialContainer: vi.fn(() => ({
    ref: { current: null },
    focusKey: "container-key",
    focusable: false,
  })),
  FocusContext: { Provider: ({ children }: any) => children },
  setFocus: vi.fn(),
}));

// ── mock router ───────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

// ── mock player store ─────────────────────────────────────────────────────────

const mockPlayStream = vi.fn();
vi.mock("@lib/store", () => ({
  usePlayerStore: (selector: any) => selector({ playStream: mockPlayStream }),
}));

// ── mock LazyImage ────────────────────────────────────────────────────────────

vi.mock("@shared/components/LazyImage", () => ({
  upgradeProtocol: (url: string) => url,
}));

// ── mock EPGTimeAxis ──────────────────────────────────────────────────────────

vi.mock("../EPGTimeAxis", () => ({
  EPGTimeAxis: () => <div data-testid="epg-time-axis" />,
  useEPGTimeRange: () => ({
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    endTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
  }),
}));

// ── mock EPGProgramBlock ──────────────────────────────────────────────────────

vi.mock("../EPGProgramBlock", () => ({
  EPGProgramBlock: ({ title, onClick, focusKey, showFocusRing }: any) => (
    <div
      data-testid="epg-program-block"
      data-title={title}
      data-focus-key={focusKey}
      data-focused={showFocusRing ? "true" : "false"}
      role="button"
      aria-label={title}
      onClick={onClick}
      tabIndex={0}
    >
      {title}
      {showFocusRing && <div data-testid="focus-ring" />}
    </div>
  ),
}));

// ── mock api ──────────────────────────────────────────────────────────────────

const NOW_SEC = Math.floor(Date.now() / 1000);
const mockEPGData = [
  {
    id: "prog-1",
    epg_id: "ch1",
    title: "Morning News",
    lang: "en",
    start: "2024-01-01 08:00:00",
    end: "2024-01-01 09:00:00",
    description: "Morning news bulletin",
    channel_id: "ch1",
    start_timestamp: String(NOW_SEC - 1800),
    stop_timestamp: String(NOW_SEC + 1800),
  },
  {
    id: "prog-2",
    epg_id: "ch1",
    title: "Sports Hour",
    lang: "en",
    start: "2024-01-01 09:00:00",
    end: "2024-01-01 10:00:00",
    description: "Sports coverage",
    channel_id: "ch1",
    start_timestamp: String(NOW_SEC + 1800),
    stop_timestamp: String(NOW_SEC + 5400),
  },
];

vi.mock("@features/live/api", () => ({
  useEPG: () => ({ data: mockEPGData, isLoading: false }),
}));

// ── mock data ─────────────────────────────────────────────────────────────────

const mockChannels = [
  {
    num: 1,
    name: "Star Maa",
    stream_type: "live",
    stream_id: 201,
    stream_icon: "",
    epg_channel_id: "star-maa",
    added: "1700000000",
    is_adult: "0",
    category_id: "10",
    category_ids: [10],
    custom_sid: "",
    tv_archive: 0,
    direct_source: "",
    tv_archive_duration: 0,
  },
  {
    num: 2,
    name: "Zee Telugu",
    stream_type: "live",
    stream_id: 202,
    stream_icon: "",
    epg_channel_id: "zee-telugu",
    added: "1700000001",
    is_adult: "0",
    category_id: "10",
    category_ids: [10],
    custom_sid: "",
    tv_archive: 0,
    direct_source: "",
    tv_archive_duration: 0,
  },
];

// ── helpers ───────────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderEPGGrid(channels = mockChannels) {
  const client = createQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <EPGGrid channels={channels} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe("EPGGrid — spatial navigation: D-pad movement", () => {
  it("renders a focusable container per channel row (focusable: false for nav transparency)", async () => {
    renderEPGGrid();
    // Each row container should use useSpatialContainer with focusable: false
    // so cross-row Up/Down nav is not blocked by the container's bounding rect.
    // This test verifies useSpatialContainer is called for each channel row.
    const { useSpatialContainer } = vi.mocked(
      await import("@shared/hooks/useSpatialNav"),
    );
    expect(useSpatialContainer).toHaveBeenCalled();
  });

  it("each program block is registered as a focusable element", () => {
    renderEPGGrid();
    const blocks = screen.getAllByTestId("epg-program-block");
    expect(blocks.length).toBeGreaterThan(0);
    // Each block must have a data-focus-key (set by useSpatialFocusable)
    blocks.forEach((block) => {
      expect(block).toHaveAttribute("data-focus-key");
    });
  });

  it("pressing Enter on a focused program block triggers channel play", () => {
    renderEPGGrid();
    const blocks = screen.getAllByTestId("epg-program-block");
    // Click to select channel (simulates Enter press reaching onClick)
    fireEvent.click(blocks[0]);
    expect(mockPlayStream).toHaveBeenCalledWith("201", "live", "Star Maa");
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/live",
      search: { play: "201" },
    });
  });

  it("focused program block shows a focus ring via showFocusRing prop", async () => {
    // When useSpatialFocusable returns showFocusRing: true for a specific focusKey,
    // EPGProgramBlock should render a visible focus ring element.
    // This test will fail until EPGProgramBlock accepts and applies showFocusRing.
    const { useSpatialFocusable } = vi.mocked(
      await import("@shared/hooks/useSpatialNav"),
    );
    (useSpatialFocusable as ReturnType<typeof vi.fn>).mockImplementation(
      ({ focusKey }: any) => ({
        ref: { current: null },
        showFocusRing: true, // simulate focused state
        focusProps: { "data-focus-key": focusKey },
      }),
    );

    renderEPGGrid();
    expect(screen.getAllByTestId("focus-ring").length).toBeGreaterThan(0);
  });

  it("channel row container uses focusable: false to allow D-pad Up/Down to cross rows", async () => {
    renderEPGGrid();
    const { useSpatialContainer } = vi.mocked(
      await import("@shared/hooks/useSpatialNav"),
    );
    // Verify container was configured as non-focusable
    const calls = (useSpatialContainer as ReturnType<typeof vi.fn>).mock.calls;
    const rowContainerCalls = calls.filter(
      ([opts]: any) => opts?.focusable === false,
    );
    expect(rowContainerCalls.length).toBeGreaterThanOrEqual(
      mockChannels.length,
    );
  });
});

describe("EPGGrid — spatial navigation: program block focus keys", () => {
  it("each program block has a unique focus key scoped to its channel row", () => {
    renderEPGGrid();
    const blocks = screen.getAllByTestId("epg-program-block");
    const focusKeys = blocks.map((b) => b.getAttribute("data-focus-key"));
    const unique = new Set(focusKeys);
    expect(unique.size).toBe(focusKeys.length);
  });

  it("focus key format includes stream_id and program index", () => {
    renderEPGGrid();
    const blocks = screen.getAllByTestId("epg-program-block");
    // Expected format: "epg-program-{streamId}-{programIndex}"
    blocks.forEach((block) => {
      const key = block.getAttribute("data-focus-key");
      expect(key).toMatch(/^epg-program-\d+-\d+$/);
    });
  });
});

describe("EPGGrid — channel name column click", () => {
  it("clicking channel name column also plays the stream", () => {
    renderEPGGrid();
    // The channel name column has an onClick handler
    const channelNames = screen.getAllByText("Star Maa");
    fireEvent.click(channelNames[0]);
    expect(mockPlayStream).toHaveBeenCalledWith("201", "live", "Star Maa");
  });
});
