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

const NOW_MS = Date.now();
const toISO = (ms: number) => new Date(ms).toISOString();

const mockCurrentProgram = {
  id: "prog-now",
  channelId: "star-maa",
  title: "Morning News",
  description: "Your daily morning news bulletin covering top stories.",
  start: toISO(NOW_MS - 1800000), // started 30min ago
  end: toISO(NOW_MS + 1800000), // ends in 30min — currently airing
};

const mockFutureProgram = {
  id: "prog-future",
  channelId: "star-maa",
  title: "Sports Hour",
  description: "Live sports coverage.",
  start: toISO(NOW_MS + 3600000), // starts in 1 hour
  end: toISO(NOW_MS + 7200000), // ends in 2 hours
};

const mockPastProgram = {
  id: "prog-past",
  channelId: "star-maa",
  title: "Last Night Show",
  description: "Late night talk show recap.",
  start: toISO(NOW_MS - 7200000), // ended 2 hours ago
  end: toISO(NOW_MS - 3600000), // ended 1 hour ago
};

const mockChannel = {
  id: "201",
  name: "Star Maa",
  type: "live" as const,
  categoryId: "10",
  icon: "https://img.example.com/starmaa.png",
  added: "1700000000",
  isAdult: false,
};

const mockChannelWithArchive = {
  ...mockChannel,
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
    expect(mockOnWatch).toHaveBeenCalledWith(mockChannel.id);
  });
});

describe("ProgramInfoPopup — Catch-up button", () => {
  // Phase 2 note: tv_archive field removed. Catch-up is not supported.
  // All catch-up scenarios should show no catch-up button.

  it("does NOT show Catch-up for past program (tv_archive removed in Phase 2)", () => {
    renderPopup({
      program: mockPastProgram,
      channel: mockChannelWithArchive,
    });
    expect(screen.queryByRole("button", { name: /catch.?up/i })).toBeNull();
  });

  it("does NOT show Catch-up for past program with base channel", () => {
    renderPopup({
      program: mockPastProgram,
      channel: mockChannel,
    });
    expect(screen.queryByRole("button", { name: /catch.?up/i })).toBeNull();
  });

  it("does NOT show Catch-up for currently airing program", () => {
    renderPopup({
      program: mockCurrentProgram,
      channel: mockChannelWithArchive,
    });
    expect(screen.queryByRole("button", { name: /catch.?up/i })).toBeNull();
  });

  it("does NOT show Catch-up for future program", () => {
    renderPopup({
      program: mockFutureProgram,
      channel: mockChannelWithArchive,
    });
    expect(screen.queryByRole("button", { name: /catch.?up/i })).toBeNull();
  });

  it("onCatchup prop is accepted without error (API surface preserved)", () => {
    // Catch-up is not surfaced to user but the prop is still accepted
    renderPopup({
      program: mockPastProgram,
      channel: mockChannelWithArchive,
    });
    // No catch-up button visible, but component renders without crashing
    expect(screen.getByRole("dialog")).toBeTruthy();
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
