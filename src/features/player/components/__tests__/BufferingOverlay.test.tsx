/**
 * Sprint 4 — Issue #116
 * BufferingOverlay component tests: shown during buffering/loading,
 * hidden during playing/paused/idle/error.
 *
 * These tests are written FIRST (TDD) and will FAIL until charlie implements
 * src/features/player/components/BufferingOverlay.tsx
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { usePlayerStore } from "@lib/stores/playerStore";

// ── Setup ─────────────────────────────────────────────────────────────────────

const baseState = {
  currentStreamId: "stream-1",
  streamType: "vod" as const,
  streamName: "Test Movie",
  currentTime: 60,
  duration: 3600,
  bufferedEnd: 80,
  volume: 1,
  isMuted: false,
  qualityLevels: [],
  currentQuality: -1,
  subtitleTracks: [],
  currentSubtitle: -1,
  audioTracks: [],
  currentAudio: 0,
  error: null,
};

beforeEach(() => {
  usePlayerStore.setState({ ...baseState, status: "playing" });
});

import { BufferingOverlay } from "../BufferingOverlay";

// ── Visibility by status ──────────────────────────────────────────────────────

describe("BufferingOverlay — visibility", () => {
  it("renders spinner when status is buffering", () => {
    usePlayerStore.setState({ status: "buffering" });
    render(<BufferingOverlay />);
    expect(screen.getByTestId("buffering-overlay")).toBeInTheDocument();
    // Spinner element present
    expect(
      screen.getByTestId("buffering-spinner") ||
        document.querySelector("[class*='spin']") ||
        document.querySelector("[role='status']"),
    ).toBeTruthy();
  });

  it("renders overlay when status is loading", () => {
    usePlayerStore.setState({ status: "loading" });
    render(<BufferingOverlay />);
    expect(screen.getByTestId("buffering-overlay")).toBeInTheDocument();
  });

  it("does NOT render when status is playing", () => {
    usePlayerStore.setState({ status: "playing" });
    render(<BufferingOverlay />);
    expect(screen.queryByTestId("buffering-overlay")).not.toBeInTheDocument();
  });

  it("does NOT render when status is paused", () => {
    usePlayerStore.setState({ status: "paused" });
    render(<BufferingOverlay />);
    expect(screen.queryByTestId("buffering-overlay")).not.toBeInTheDocument();
  });

  it("does NOT render when status is idle", () => {
    usePlayerStore.setState({ status: "idle", currentStreamId: null });
    render(<BufferingOverlay />);
    expect(screen.queryByTestId("buffering-overlay")).not.toBeInTheDocument();
  });

  it("does NOT render when status is error", () => {
    usePlayerStore.setState({ status: "error", error: "Some error" });
    render(<BufferingOverlay />);
    expect(screen.queryByTestId("buffering-overlay")).not.toBeInTheDocument();
  });
});

// ── Appearance ────────────────────────────────────────────────────────────────

describe("BufferingOverlay — appearance", () => {
  it("overlay covers the full player area (absolute or fixed positioning)", () => {
    usePlayerStore.setState({ status: "buffering" });
    render(<BufferingOverlay />);
    const overlay = screen.getByTestId("buffering-overlay");
    const classes = overlay.className;
    // Must use absolute or fixed + inset-0 (or equivalent full-coverage classes)
    const isFullCoverage =
      /absolute|fixed/.test(classes) && /inset-0|inset-\[0\]/.test(classes);
    expect(isFullCoverage).toBe(true);
  });

  it("has accessible role or aria-label for screen readers", () => {
    usePlayerStore.setState({ status: "buffering" });
    render(<BufferingOverlay />);
    const overlay = screen.getByTestId("buffering-overlay");
    const hasAccessibility =
      overlay.getAttribute("role") === "status" ||
      overlay.getAttribute("aria-label") !== null ||
      overlay.getAttribute("aria-busy") === "true";
    expect(hasAccessibility).toBe(true);
  });
});
