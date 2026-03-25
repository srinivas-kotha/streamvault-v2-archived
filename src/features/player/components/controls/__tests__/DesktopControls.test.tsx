/**
 * Sprint 4 — Issue #113
 * DesktopControls tests: hover overlay, progress bar, quality/subtitle/volume,
 * auto-hide after 3s, keyboard interaction.
 *
 * These tests are written FIRST (TDD) and will FAIL until charlie implements
 * src/features/player/components/controls/DesktopControls.tsx
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { usePlayerStore } from "@lib/stores/playerStore";

// ── Mock store (set state directly) ──────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
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
      { id: 2, name: "1080p", width: 1920, height: 1080, bitrate: 4000000 },
    ],
    currentQuality: -1,
    subtitleTracks: [
      { id: 0, name: "English", lang: "en" },
      { id: 1, name: "Spanish", lang: "es" },
    ],
    currentSubtitle: -1,
    audioTracks: [],
    currentAudio: 0,
    error: null,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

import { DesktopControls } from "../DesktopControls";

// ── Play/pause ────────────────────────────────────────────────────────────────

describe("DesktopControls — play/pause", () => {
  it("shows pause button when status is playing", () => {
    render(<DesktopControls />);
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
  });

  it("shows play button when status is paused", () => {
    usePlayerStore.setState({ status: "paused" });
    render(<DesktopControls />);
    expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument();
  });

  it("clicking pause transitions to paused", () => {
    render(<DesktopControls />);
    fireEvent.click(screen.getByRole("button", { name: /pause/i }));
    expect(usePlayerStore.getState().status).toBe("paused");
  });

  it("clicking play transitions to playing", () => {
    usePlayerStore.setState({ status: "paused" });
    render(<DesktopControls />);
    fireEvent.click(screen.getByRole("button", { name: /play/i }));
    expect(usePlayerStore.getState().status).toBe("playing");
  });
});

// ── Progress bar ──────────────────────────────────────────────────────────────

describe("DesktopControls — progress bar", () => {
  it("renders progress bar", () => {
    render(<DesktopControls />);
    expect(
      screen.getByRole("slider", { name: /video progress/i }),
    ).toBeInTheDocument();
  });

  it("displays current time formatted", () => {
    usePlayerStore.setState({ currentTime: 90, duration: 3600 }); // 1:30
    render(<DesktopControls />);
    expect(screen.getByText("1:30")).toBeInTheDocument();
  });

  it("displays duration formatted", () => {
    usePlayerStore.setState({ currentTime: 0, duration: 3661 }); // 1:01:01
    render(<DesktopControls />);
    expect(screen.getByText("1:01:01")).toBeInTheDocument();
  });
});

// ── Volume slider ─────────────────────────────────────────────────────────────

describe("DesktopControls — volume", () => {
  it("renders volume slider", () => {
    render(<DesktopControls />);
    expect(screen.getByRole("slider", { name: /volume/i })).toBeInTheDocument();
  });

  it("volume slider reflects current volume", () => {
    usePlayerStore.setState({ volume: 0.5 });
    render(<DesktopControls />);
    const slider = screen.getByRole("slider", { name: /volume/i });
    expect(slider).toHaveAttribute("aria-valuenow", "50");
  });

  it("renders mute button", () => {
    render(<DesktopControls />);
    expect(screen.getByRole("button", { name: /mute/i })).toBeInTheDocument();
  });

  it("clicking mute toggles muted state", () => {
    render(<DesktopControls />);
    fireEvent.click(screen.getByRole("button", { name: /mute/i }));
    expect(usePlayerStore.getState().isMuted).toBe(true);
  });
});

// ── Quality selector ──────────────────────────────────────────────────────────

describe("DesktopControls — quality selector", () => {
  it("renders quality selector button", () => {
    render(<DesktopControls />);
    expect(
      screen.getByRole("button", { name: /quality/i }),
    ).toBeInTheDocument();
  });

  it("clicking quality button opens dropdown with quality options", () => {
    render(<DesktopControls />);
    fireEvent.click(screen.getByRole("button", { name: /quality/i }));
    expect(screen.getByText("360p")).toBeInTheDocument();
    expect(screen.getByText("720p")).toBeInTheDocument();
    expect(screen.getByText("1080p")).toBeInTheDocument();
  });

  it("shows Auto option in quality dropdown", () => {
    render(<DesktopControls />);
    fireEvent.click(screen.getByRole("button", { name: /quality/i }));
    expect(screen.getByText(/auto/i)).toBeInTheDocument();
  });
});

// ── Subtitle selector ─────────────────────────────────────────────────────────

describe("DesktopControls — subtitle selector", () => {
  it("renders subtitle selector button", () => {
    render(<DesktopControls />);
    expect(
      screen.getByRole("button", { name: /subtitle|caption/i }),
    ).toBeInTheDocument();
  });
});

// ── Fullscreen toggle ─────────────────────────────────────────────────────────

describe("DesktopControls — fullscreen", () => {
  it("renders fullscreen toggle button", () => {
    render(<DesktopControls />);
    expect(
      screen.getByRole("button", { name: /fullscreen/i }),
    ).toBeInTheDocument();
  });
});

// ── Auto-hide behavior ────────────────────────────────────────────────────────

describe("DesktopControls — auto-hide", () => {
  it("controls are visible initially", () => {
    render(<DesktopControls />);
    expect(screen.getByTestId("desktop-controls-overlay")).toBeVisible();
  });

  it("controls auto-hide after 3 seconds of no mouse movement", () => {
    render(<DesktopControls />);
    act(() => {
      vi.advanceTimersByTime(3100);
    });
    const overlay = screen.getByTestId("desktop-controls-overlay");
    // Controls should be hidden (opacity-0 or aria-hidden)
    expect(overlay).toHaveAttribute("data-visible", "false");
  });

  it("controls show on mouse move over the player area", () => {
    render(<DesktopControls />);
    act(() => {
      vi.advanceTimersByTime(3100);
    });
    // Move mouse to reveal controls
    fireEvent.mouseMove(screen.getByTestId("desktop-controls-overlay"));
    const overlay = screen.getByTestId("desktop-controls-overlay");
    expect(overlay).toHaveAttribute("data-visible", "true");
  });

  it("auto-hide timer resets on mouse move", () => {
    render(<DesktopControls />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.mouseMove(screen.getByTestId("desktop-controls-overlay"));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    // Not hidden yet — timer was reset
    const overlay = screen.getByTestId("desktop-controls-overlay");
    expect(overlay).toHaveAttribute("data-visible", "true");
  });
});
