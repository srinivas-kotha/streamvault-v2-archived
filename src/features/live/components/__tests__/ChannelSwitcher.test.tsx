/**
 * Sprint 5 — ChannelSwitcher overlay tests
 *
 * These tests WILL FAIL because ChannelSwitcher does not exist yet.
 * Expected path: src/features/live/components/ChannelSwitcher.tsx
 *
 * Contract:
 *   - Overlay shows channel name, number, and current program on channel up/down
 *   - Auto-hides after 3 seconds
 *   - Debounces rapid channel switches (300ms before committing)
 *   - Enter/Select during overlay confirms the switch
 *   - Displays channel icon/logo
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ChannelSwitcher } from "../ChannelSwitcher";

// ── mock spatial nav ──────────────────────────────────────────────────────────

vi.mock("@shared/hooks/useSpatialNav", () => ({
  useSpatialFocusable: () => ({
    ref: { current: null },
    showFocusRing: false,
    focusProps: {},
  }),
  useSpatialContainer: () => ({ ref: { current: null }, focusKey: "switcher" }),
  FocusContext: { Provider: ({ children }: any) => children },
  setFocus: vi.fn(),
}));

// ── mock player store ─────────────────────────────────────────────────────────

const mockPlayStream = vi.fn();
vi.mock("@lib/store", () => ({
  usePlayerStore: (selector: any) => selector({ playStream: mockPlayStream }),
}));

// ── mock data ─────────────────────────────────────────────────────────────────

const NOW_SEC = Math.floor(Date.now() / 1000);

const mockCurrentChannel = {
  num: 1,
  name: "Star Maa",
  stream_id: 201,
  stream_icon: "https://img.example.com/starmaa.png",
  epg_channel_id: "star-maa",
  stream_type: "live",
  added: "1700000000",
  is_adult: "0",
  category_id: "10",
  category_ids: [10],
  custom_sid: "",
  tv_archive: 0,
  direct_source: "",
  tv_archive_duration: 0,
};

const mockNextChannel = {
  num: 2,
  name: "Zee Telugu",
  stream_id: 202,
  stream_icon: "https://img.example.com/zeetelugu.png",
  epg_channel_id: "zee-telugu",
  stream_type: "live",
  added: "1700000001",
  is_adult: "0",
  category_id: "10",
  category_ids: [10],
  custom_sid: "",
  tv_archive: 0,
  direct_source: "",
  tv_archive_duration: 0,
};

const mockCurrentProgram = {
  id: "prog-1",
  epg_id: "star-maa",
  title: "Morning News",
  lang: "en",
  start: "2024-01-01 08:00:00",
  end: "2024-01-01 09:00:00",
  description: "Morning news bulletin",
  channel_id: "star-maa",
  start_timestamp: String(NOW_SEC - 1800),
  stop_timestamp: String(NOW_SEC + 1800),
};

const mockOnConfirm = vi.fn();
const mockOnDismiss = vi.fn();

// ── helpers ───────────────────────────────────────────────────────────────────

function renderChannelSwitcher(
  props?: Partial<React.ComponentProps<typeof ChannelSwitcher>>,
) {
  return render(
    <ChannelSwitcher
      channel={mockCurrentChannel}
      currentProgram={mockCurrentProgram}
      isVisible={true}
      onConfirm={mockOnConfirm}
      onDismiss={mockOnDismiss}
      {...props}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe("ChannelSwitcher — rendering", () => {
  it("renders the channel name", () => {
    renderChannelSwitcher();
    expect(screen.getByText("Star Maa")).toBeTruthy();
  });

  it("renders the channel number", () => {
    renderChannelSwitcher();
    expect(screen.getByText("1")).toBeTruthy();
  });

  it("renders the current program title", () => {
    renderChannelSwitcher();
    expect(screen.getByText("Morning News")).toBeTruthy();
  });

  it("renders the channel icon image", () => {
    renderChannelSwitcher();
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://img.example.com/starmaa.png");
    expect(img).toHaveAttribute("alt", "Star Maa");
  });

  it("does not render when isVisible is false", () => {
    renderChannelSwitcher({ isVisible: false });
    expect(screen.queryByText("Star Maa")).toBeNull();
  });

  it("renders with no current program gracefully", () => {
    renderChannelSwitcher({ currentProgram: undefined });
    expect(screen.getByText("Star Maa")).toBeTruthy();
    // Should not crash when no EPG data available
    expect(screen.queryByText("Morning News")).toBeNull();
  });
});

describe("ChannelSwitcher — auto-hide", () => {
  it("calls onDismiss after 3 seconds", () => {
    renderChannelSwitcher();
    expect(mockOnDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not call onDismiss before 3 seconds", () => {
    renderChannelSwitcher();

    act(() => {
      vi.advanceTimersByTime(2999);
    });

    expect(mockOnDismiss).not.toHaveBeenCalled();
  });

  it("resets the auto-hide timer when channel changes", () => {
    const { rerender } = renderChannelSwitcher();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Switch channel — timer should reset
    rerender(
      <ChannelSwitcher
        channel={mockNextChannel}
        currentProgram={undefined}
        isVisible={true}
        onConfirm={mockOnConfirm}
        onDismiss={mockOnDismiss}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // 4 seconds total but timer reset at 2s mark — should NOT have dismissed yet
    expect(mockOnDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Now 3 seconds since last channel change — should dismiss
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });
});

describe("ChannelSwitcher — confirm interaction", () => {
  it("calls onConfirm when Enter key is pressed during overlay", () => {
    renderChannelSwitcher();
    fireEvent.keyDown(document, { key: "Enter" });
    expect(mockOnConfirm).toHaveBeenCalledWith(mockCurrentChannel);
  });

  it("calls onConfirm when clicking the channel overlay", () => {
    renderChannelSwitcher();
    const overlay = screen.getByRole("dialog");
    fireEvent.click(overlay);
    expect(mockOnConfirm).toHaveBeenCalledWith(mockCurrentChannel);
  });

  it("overlay has role=dialog for accessibility", () => {
    renderChannelSwitcher();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("overlay has aria-label with channel name", () => {
    renderChannelSwitcher();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Star Maa"),
    );
  });
});

describe("ChannelSwitcher — debounce", () => {
  it("does not trigger confirm during debounce window (300ms)", () => {
    // Rapid channel switches should be debounced — the component should
    // accept a pendingChannel prop and only commit after 300ms of no changes.
    // This verifies the component structure supports debounced switching.
    const { rerender } = renderChannelSwitcher();

    // Rapidly switch channels
    rerender(
      <ChannelSwitcher
        channel={mockNextChannel}
        currentProgram={undefined}
        isVisible={true}
        onConfirm={mockOnConfirm}
        onDismiss={mockOnDismiss}
        debounceMs={300}
      />,
    );

    // Within debounce window — confirm should not have fired automatically
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Auto-play should not have been triggered via playStream during debounce
    expect(mockPlayStream).not.toHaveBeenCalled();
  });
});
