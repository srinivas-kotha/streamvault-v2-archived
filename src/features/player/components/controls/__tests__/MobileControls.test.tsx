/**
 * Sprint 4 — Issue #113
 * MobileControls tests: tap show/hide, seek buttons, progress bar, swipe gestures.
 *
 * These tests are written FIRST (TDD) and will FAIL until charlie implements
 * src/features/player/components/controls/MobileControls.tsx
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { usePlayerStore } from "@lib/stores/playerStore";

beforeEach(() => {
  usePlayerStore.setState({
    status: "playing",
    currentStreamId: "stream-1",
    streamType: "vod",
    streamName: "Test Movie",
    currentTime: 60,
    duration: 3600,
    bufferedEnd: 300,
    volume: 1,
    isMuted: false,
    qualityLevels: [
      { id: 0, name: "360p", width: 640, height: 360, bitrate: 500000 },
      { id: 1, name: "720p", width: 1280, height: 720, bitrate: 2000000 },
    ],
    currentQuality: -1,
    subtitleTracks: [{ id: 0, name: "English", lang: "en" }],
    currentSubtitle: -1,
    audioTracks: [],
    currentAudio: 0,
    error: null,
  });
});

import { MobileControls } from "../MobileControls";

// ── Tap show/hide ─────────────────────────────────────────────────────────────

describe("MobileControls — tap to show/hide", () => {
  it("controls are hidden by default (must tap to show)", () => {
    render(<MobileControls />);
    const overlay = screen.getByTestId("mobile-controls-overlay");
    expect(overlay).toHaveAttribute("data-visible", "false");
  });

  it("tapping the overlay shows controls", () => {
    render(<MobileControls />);
    fireEvent.click(screen.getByTestId("mobile-controls-overlay"));
    const overlay = screen.getByTestId("mobile-controls-overlay");
    expect(overlay).toHaveAttribute("data-visible", "true");
  });

  it("tapping again while visible hides controls", () => {
    render(<MobileControls />);
    fireEvent.click(screen.getByTestId("mobile-controls-overlay"));
    fireEvent.click(screen.getByTestId("mobile-controls-overlay"));
    const overlay = screen.getByTestId("mobile-controls-overlay");
    expect(overlay).toHaveAttribute("data-visible", "false");
  });
});

// ── Controls content ──────────────────────────────────────────────────────────

describe("MobileControls — controls content", () => {
  beforeEach(() => {
    render(<MobileControls />);
    // Reveal controls
    fireEvent.click(screen.getByTestId("mobile-controls-overlay"));
  });

  it("shows play/pause button", () => {
    expect(
      screen.getByRole("button", { name: /pause|play/i }),
    ).toBeInTheDocument();
  });

  it("shows seek back 10s button", () => {
    expect(
      screen.getByRole("button", { name: /seek back|rewind|-10/i }),
    ).toBeInTheDocument();
  });

  it("shows seek forward 10s button", () => {
    expect(
      screen.getByRole("button", { name: /seek forward|fast.forward|\+10/i }),
    ).toBeInTheDocument();
  });

  it("shows progress bar", () => {
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("shows quality selector button", () => {
    expect(
      screen.getByRole("button", { name: /quality/i }),
    ).toBeInTheDocument();
  });

  it("shows subtitle button", () => {
    expect(
      screen.getByRole("button", { name: /subtitle|caption/i }),
    ).toBeInTheDocument();
  });
});

// ── Swipe gesture seek ────────────────────────────────────────────────────────

describe("MobileControls — swipe to seek", () => {
  it("swipe right triggers seek forward", () => {
    render(<MobileControls />);
    const overlay = screen.getByTestId("mobile-controls-overlay");

    // Simulate swipe right (touch start left, touch end right)
    fireEvent.touchStart(overlay, {
      touches: [{ clientX: 100, clientY: 200 }],
    });
    fireEvent.touchEnd(overlay, {
      changedTouches: [{ clientX: 200, clientY: 200 }],
    });

    // Should have seeked forward
    const state = usePlayerStore.getState();
    expect(state.currentTime).toBeGreaterThan(60);
  });

  it("swipe left triggers seek backward", () => {
    render(<MobileControls />);
    const overlay = screen.getByTestId("mobile-controls-overlay");

    // Simulate swipe left (touch start right, touch end left)
    fireEvent.touchStart(overlay, {
      touches: [{ clientX: 200, clientY: 200 }],
    });
    fireEvent.touchEnd(overlay, {
      changedTouches: [{ clientX: 100, clientY: 200 }],
    });

    // Should have seeked backward
    const state = usePlayerStore.getState();
    expect(state.currentTime).toBeLessThan(60);
  });

  it("short horizontal swipe (<50px) does NOT trigger seek", () => {
    render(<MobileControls />);
    const overlay = screen.getByTestId("mobile-controls-overlay");
    const initialTime = usePlayerStore.getState().currentTime;

    fireEvent.touchStart(overlay, {
      touches: [{ clientX: 100, clientY: 200 }],
    });
    fireEvent.touchEnd(overlay, {
      changedTouches: [{ clientX: 130, clientY: 200 }],
    });

    expect(usePlayerStore.getState().currentTime).toBe(initialTime);
  });
});
