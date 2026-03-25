/**
 * Sprint 4 — Issue #113
 * TVControls tests: D-pad UI, minimal overlay, seek indicator, auto-hide after 5s.
 *
 * These tests are written FIRST (TDD) and will FAIL until charlie implements
 * src/features/player/components/controls/TVControls.tsx
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { usePlayerStore } from "@lib/stores/playerStore";

beforeEach(() => {
  vi.useFakeTimers();
  usePlayerStore.setState({
    status: "playing",
    currentStreamId: "ch-1",
    streamType: "live",
    streamName: "BBC News",
    currentTime: 0,
    duration: 0,
    bufferedEnd: 0,
    volume: 1,
    isMuted: false,
    qualityLevels: [],
    currentQuality: -1,
    subtitleTracks: [],
    currentSubtitle: -1,
    audioTracks: [],
    currentAudio: 0,
    error: null,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

import { TVControls } from "../TVControls";

// ── Minimal overlay content ───────────────────────────────────────────────────

describe("TVControls — overlay content", () => {
  it("renders TV controls overlay", () => {
    render(<TVControls />);
    expect(screen.getByTestId("tv-controls-overlay")).toBeInTheDocument();
  });

  it("shows channel/stream name", () => {
    render(<TVControls />);
    expect(screen.getByText("BBC News")).toBeInTheDocument();
  });

  it("shows current time for live TV", () => {
    usePlayerStore.setState({ streamType: "live" });
    render(<TVControls />);
    // Live TV shows current time (wall clock), not VOD position
    expect(screen.getByTestId("live-indicator")).toBeInTheDocument();
  });

  it("shows VOD current time for non-live streams", () => {
    usePlayerStore.setState({
      streamType: "vod",
      currentTime: 125,
      duration: 7200,
      streamName: "Test Movie",
    });
    render(<TVControls />);
    expect(screen.getByText("2:05")).toBeInTheDocument();
  });
});

// ── No mouse-interactive elements ────────────────────────────────────────────

describe("TVControls — no mouse-interactive elements", () => {
  it("does NOT render any range/slider inputs", () => {
    render(<TVControls />);
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });

  it("does NOT render hover-style dropdown menus", () => {
    render(<TVControls />);
    // Quality selector should not render as clickable dropdown on TV
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});

// ── Seek indicator ────────────────────────────────────────────────────────────

describe("TVControls — seek indicator", () => {
  it("shows seek indicator when left arrow pressed (VOD)", () => {
    usePlayerStore.setState({
      streamType: "vod",
      currentTime: 120,
      duration: 7200,
      streamName: "Test Movie",
    });
    render(<TVControls />);
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByTestId("seek-indicator")).toBeInTheDocument();
    expect(screen.getByText(/-10s/i)).toBeInTheDocument();
  });

  it("shows seek indicator when right arrow pressed (VOD)", () => {
    usePlayerStore.setState({
      streamType: "vod",
      currentTime: 120,
      duration: 7200,
      streamName: "Test Movie",
    });
    render(<TVControls />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByTestId("seek-indicator")).toBeInTheDocument();
    expect(screen.getByText(/\+10s/i)).toBeInTheDocument();
  });

  it("does not show seek indicator on live TV (no seeking)", () => {
    usePlayerStore.setState({ streamType: "live" });
    render(<TVControls />);
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.queryByTestId("seek-indicator")).not.toBeInTheDocument();
  });
});

// ── Auto-hide ─────────────────────────────────────────────────────────────────

describe("TVControls — auto-hide after 5s", () => {
  it("TV controls auto-hide after 5 seconds", () => {
    render(<TVControls />);
    act(() => {
      vi.advanceTimersByTime(5100);
    });
    const overlay = screen.getByTestId("tv-controls-overlay");
    expect(overlay).toHaveAttribute("data-visible", "false");
  });

  it("TV controls remain visible before 5 second threshold", () => {
    render(<TVControls />);
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    const overlay = screen.getByTestId("tv-controls-overlay");
    expect(overlay).toHaveAttribute("data-visible", "true");
  });

  it("auto-hide resets on any key press", () => {
    render(<TVControls />);
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    fireEvent.keyDown(window, { key: "Enter" });
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    const overlay = screen.getByTestId("tv-controls-overlay");
    // Should still be visible (timer was reset on Enter)
    expect(overlay).toHaveAttribute("data-visible", "true");
  });
});

// ── Large text for 10ft viewing ───────────────────────────────────────────────

describe("TVControls — 10ft UI", () => {
  it("channel name uses large text class", () => {
    render(<TVControls />);
    const channelName = screen.getByTestId("channel-name");
    // TV controls should use large text (text-2xl or larger in Tailwind)
    expect(channelName.className).toMatch(/text-2xl|text-3xl|text-4xl/);
  });
});
