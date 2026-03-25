/**
 * Sprint 5 — ProgramInfoPopup tests
 *
 * These tests WILL FAIL because ProgramInfoPopup does not exist yet.
 * Expected path: src/features/live/components/ProgramInfoPopup.tsx
 *
 * Contract:
 *   - Displays program title, description, start/end times
 *   - Shows on Enter/Select on an EPG program block
 *   - "Watch" button for current and future programs
 *   - "Catch-up" button if tv_archive > 0 and program is in the past
 *   - Closes on Escape/Back (keyCode 4 for Fire TV)
 *   - role="dialog", aria-label for accessibility
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProgramInfoPopup } from "../ProgramInfoPopup";

// ── mock spatial nav ──────────────────────────────────────────────────────────

vi.mock("@shared/hooks/useSpatialNav", () => ({
  useSpatialFocusable: ({ focusKey }: any) => ({
    ref: { current: null },
    showFocusRing: false,
    focusProps: { "data-focus-key": focusKey },
  }),
  useSpatialContainer: () => ({ ref: { current: null }, focusKey: "popup" }),
  FocusContext: { Provider: ({ children }: any) => children },
  setFocus: vi.fn(),
}));

// ── mock data ─────────────────────────────────────────────────────────────────

const NOW_SEC = Math.floor(Date.now() / 1000);

const mockCurrentProgram = {
  id: "prog-now",
  epg_id: "star-maa",
  title: "Morning News",
  lang: "en",
  start: "2024-01-01 08:00:00",
  end: "2024-01-01 09:00:00",
  description: "Your daily morning news bulletin covering top stories.",
  channel_id: "star-maa",
  start_timestamp: String(NOW_SEC - 1800), // started 30min ago
  stop_timestamp: String(NOW_SEC + 1800), // ends in 30min — currently airing
};

const mockFutureProgram = {
  id: "prog-future",
  epg_id: "star-maa",
  title: "Sports Hour",
  lang: "en",
  start: "2024-01-01 09:00:00",
  end: "2024-01-01 10:00:00",
  description: "Live sports coverage.",
  channel_id: "star-maa",
  start_timestamp: String(NOW_SEC + 3600), // starts in 1 hour
  stop_timestamp: String(NOW_SEC + 7200), // ends in 2 hours
};

const mockPastProgram = {
  id: "prog-past",
  epg_id: "star-maa",
  title: "Last Night Show",
  lang: "en",
  start: "2024-01-01 06:00:00",
  end: "2024-01-01 07:00:00",
  description: "Late night talk show recap.",
  channel_id: "star-maa",
  start_timestamp: String(NOW_SEC - 7200), // ended 2 hours ago
  stop_timestamp: String(NOW_SEC - 3600), // ended 1 hour ago
};

const mockChannel = {
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

const mockChannelWithArchive = {
  ...mockChannel,
  tv_archive: 1,
  tv_archive_duration: 7,
};

const mockOnWatch = vi.fn();
const mockOnCatchup = vi.fn();
const mockOnClose = vi.fn();

// ── helpers ───────────────────────────────────────────────────────────────────

function renderPopup(
  props?: Partial<React.ComponentProps<typeof ProgramInfoPopup>>,
) {
  return render(
    <ProgramInfoPopup
      program={mockCurrentProgram}
      channel={mockChannel}
      isOpen={true}
      onWatch={mockOnWatch}
      onCatchup={mockOnCatchup}
      onClose={mockOnClose}
      {...props}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── tests ─────────────────────────────────────────────────────────────────────

describe("ProgramInfoPopup — rendering", () => {
  it("renders the program title", () => {
    renderPopup();
    expect(screen.getByText("Morning News")).toBeTruthy();
  });

  it("renders the program description", () => {
    renderPopup();
    expect(
      screen.getByText(
        "Your daily morning news bulletin covering top stories.",
      ),
    ).toBeTruthy();
  });

  it("renders the start time formatted for display", () => {
    renderPopup();
    // Should show a human-readable start time (not raw unix timestamp)
    const popup = screen.getByRole("dialog");
    expect(popup.textContent).toMatch(/\d{1,2}:\d{2}/);
  });

  it("renders the end time formatted for display", () => {
    renderPopup();
    // Should show both start and end times
    const popup = screen.getByRole("dialog");
    // At minimum 2 time values should appear
    const timeMatches = popup.textContent?.match(/\d{1,2}:\d{2}/g) ?? [];
    expect(timeMatches.length).toBeGreaterThanOrEqual(2);
  });

  it("does not render when isOpen is false", () => {
    renderPopup({ isOpen: false });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("ProgramInfoPopup — accessibility", () => {
  it("has role=dialog", () => {
    renderPopup();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("has aria-label containing program title", () => {
    renderPopup();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Morning News"),
    );
  });

  it("has aria-modal=true", () => {
    renderPopup();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });
});

describe("ProgramInfoPopup — Watch button", () => {
  it("shows Watch button for currently airing program", () => {
    renderPopup({ program: mockCurrentProgram });
    expect(screen.getByRole("button", { name: /watch/i })).toBeTruthy();
  });

  it("shows Watch button for future program", () => {
    renderPopup({ program: mockFutureProgram });
    expect(screen.getByRole("button", { name: /watch/i })).toBeTruthy();
  });

  it("clicking Watch calls onWatch with stream id", () => {
    renderPopup({ program: mockCurrentProgram });
    fireEvent.click(screen.getByRole("button", { name: /watch/i }));
    expect(mockOnWatch).toHaveBeenCalledWith(mockChannel.stream_id);
  });
});

describe("ProgramInfoPopup — Catch-up button", () => {
  it("shows Catch-up button for past program on archive-enabled channel", () => {
    renderPopup({
      program: mockPastProgram,
      channel: mockChannelWithArchive,
    });
    expect(screen.getByRole("button", { name: /catch.?up/i })).toBeTruthy();
  });

  it("does NOT show Catch-up for past program when tv_archive is 0", () => {
    renderPopup({
      program: mockPastProgram,
      channel: mockChannel, // tv_archive: 0
    });
    expect(screen.queryByRole("button", { name: /catch.?up/i })).toBeNull();
  });

  it("does NOT show Catch-up for currently airing program (even with archive)", () => {
    renderPopup({
      program: mockCurrentProgram,
      channel: mockChannelWithArchive,
    });
    expect(screen.queryByRole("button", { name: /catch.?up/i })).toBeNull();
  });

  it("does NOT show Catch-up for future program (even with archive)", () => {
    renderPopup({
      program: mockFutureProgram,
      channel: mockChannelWithArchive,
    });
    expect(screen.queryByRole("button", { name: /catch.?up/i })).toBeNull();
  });

  it("clicking Catch-up calls onCatchup with program timestamps", () => {
    renderPopup({
      program: mockPastProgram,
      channel: mockChannelWithArchive,
    });
    fireEvent.click(screen.getByRole("button", { name: /catch.?up/i }));
    expect(mockOnCatchup).toHaveBeenCalledWith({
      streamId: mockChannel.stream_id,
      startTimestamp: Number(mockPastProgram.start_timestamp),
      stopTimestamp: Number(mockPastProgram.stop_timestamp),
    });
  });
});

describe("ProgramInfoPopup — close behavior", () => {
  it("calls onClose when Escape key is pressed", () => {
    renderPopup();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Fire TV Back key (keyCode 4) is pressed", () => {
    renderPopup();
    fireEvent.keyDown(document, { keyCode: 4 });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    renderPopup();
    const backdrop = screen.getByTestId("popup-backdrop");
    fireEvent.click(backdrop);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onClose when clicking inside the dialog content", () => {
    renderPopup();
    const title = screen.getByText("Morning News");
    fireEvent.click(title);
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
