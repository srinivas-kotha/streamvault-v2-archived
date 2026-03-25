/**
 * Sprint 4 — Issue #113
 * ProgressBar tests: visual progress, buffered range, click-to-seek (desktop),
 * keyboard seek (TV), time formatting.
 *
 * These tests are written FIRST (TDD) and will FAIL until charlie implements
 * src/features/player/components/controls/ProgressBar.tsx
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
    currentTime: 90,
    duration: 3600,
    bufferedEnd: 600,
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

import { ProgressBar } from "../ProgressBar";

// ── Progress rendering ────────────────────────────────────────────────────────

describe("ProgressBar — rendering", () => {
  it("renders a slider role element (interactive seek bar)", () => {
    render(<ProgressBar />);
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("progress bar reflects currentTime/duration ratio", () => {
    // 90/3600 = 2.5%
    render(<ProgressBar />);
    const progressBar = screen.getByTestId("progress-fill");
    // Width should be 2.5%
    expect(progressBar.style.width).toMatch(/2\.5%|2\.50%/);
  });

  it("progress bar is 0% at start", () => {
    usePlayerStore.setState({ currentTime: 0, duration: 3600 });
    render(<ProgressBar />);
    const progressBar = screen.getByTestId("progress-fill");
    expect(progressBar.style.width).toMatch(/^0%?$/);
  });

  it("progress bar is 100% at end", () => {
    usePlayerStore.setState({ currentTime: 3600, duration: 3600 });
    render(<ProgressBar />);
    const progressBar = screen.getByTestId("progress-fill");
    expect(progressBar.style.width).toMatch(/100%/);
  });
});

// ── Buffered range ────────────────────────────────────────────────────────────

describe("ProgressBar — buffered range", () => {
  it("renders buffered range indicator", () => {
    render(<ProgressBar />);
    expect(screen.getByTestId("buffered-fill")).toBeInTheDocument();
  });

  it("buffered fill width reflects bufferedEnd/duration", () => {
    // 600/3600 = 16.67%
    render(<ProgressBar />);
    const bufferedFill = screen.getByTestId("buffered-fill");
    const widthValue = parseFloat(bufferedFill.style.width);
    expect(widthValue).toBeCloseTo(16.67, 0);
  });
});

// ── Time display ──────────────────────────────────────────────────────────────

describe("ProgressBar — time display", () => {
  it("formats mm:ss for times under 1 hour", () => {
    usePlayerStore.setState({ currentTime: 90, duration: 600 }); // 1:30 / 10:00
    render(<ProgressBar />);
    expect(screen.getByText("1:30")).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();
  });

  it("formats hh:mm:ss for times >= 1 hour", () => {
    usePlayerStore.setState({ currentTime: 3661, duration: 7200 }); // 1:01:01 / 2:00:00
    render(<ProgressBar />);
    expect(screen.getByText("1:01:01")).toBeInTheDocument();
    expect(screen.getByText("2:00:00")).toBeInTheDocument();
  });

  it("shows 0:00 when currentTime is 0", () => {
    usePlayerStore.setState({ currentTime: 0, duration: 3600 });
    render(<ProgressBar />);
    expect(screen.getByText("0:00")).toBeInTheDocument();
  });
});

// ── Click to seek (desktop mode) ──────────────────────────────────────────────

describe("ProgressBar — click-to-seek (desktop)", () => {
  it("clicking on the bar seeks to that position", () => {
    render(<ProgressBar isDesktop />);
    const track = screen.getByTestId("progress-track");

    // Mock the getBoundingClientRect to return a predictable size
    Object.defineProperty(track, "getBoundingClientRect", {
      value: () => ({
        left: 0,
        width: 1000,
        top: 0,
        height: 8,
        right: 1000,
        bottom: 8,
      }),
    });

    // Click at 50% (x=500 of width=1000)
    fireEvent.click(track, { clientX: 500 });

    // Should seek to 50% of 3600 = 1800
    expect(usePlayerStore.getState().currentTime).toBe(1800);
  });

  it("clicking at 0 seeks to start", () => {
    render(<ProgressBar isDesktop />);
    const track = screen.getByTestId("progress-track");

    Object.defineProperty(track, "getBoundingClientRect", {
      value: () => ({
        left: 0,
        width: 1000,
        top: 0,
        height: 8,
        right: 1000,
        bottom: 8,
      }),
    });

    fireEvent.click(track, { clientX: 0 });
    expect(usePlayerStore.getState().currentTime).toBe(0);
  });
});

// ── Keyboard seek (TV mode) ───────────────────────────────────────────────────

describe("ProgressBar — keyboard seek (TV)", () => {
  it("ArrowLeft seeks back 10s", () => {
    usePlayerStore.setState({ currentTime: 120, duration: 3600 });
    render(<ProgressBar isFocused />);

    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowLeft" });
    expect(usePlayerStore.getState().currentTime).toBe(110);
  });

  it("ArrowRight seeks forward 10s", () => {
    usePlayerStore.setState({ currentTime: 120, duration: 3600 });
    render(<ProgressBar isFocused />);

    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowRight" });
    expect(usePlayerStore.getState().currentTime).toBe(130);
  });

  it("ArrowLeft does not go below 0", () => {
    usePlayerStore.setState({ currentTime: 5, duration: 3600 });
    render(<ProgressBar isFocused />);

    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowLeft" });
    expect(usePlayerStore.getState().currentTime).toBe(0);
  });

  it("ArrowRight does not exceed duration", () => {
    usePlayerStore.setState({ currentTime: 3595, duration: 3600 });
    render(<ProgressBar isFocused />);

    fireEvent.keyDown(screen.getByRole("slider"), { key: "ArrowRight" });
    expect(usePlayerStore.getState().currentTime).toBe(3600);
  });
});

// ── ARIA attributes ───────────────────────────────────────────────────────────

describe("ProgressBar — accessibility", () => {
  it("has aria-valuenow reflecting current progress percentage", () => {
    usePlayerStore.setState({ currentTime: 900, duration: 3600 }); // 25%
    render(<ProgressBar />);
    const bar = screen.getByRole("slider");
    expect(bar).toHaveAttribute("aria-valuenow", "25");
  });

  it("has aria-valuemin of 0", () => {
    render(<ProgressBar />);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuemin", "0");
  });

  it("has aria-valuemax of 100", () => {
    render(<ProgressBar />);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuemax", "100");
  });
});
