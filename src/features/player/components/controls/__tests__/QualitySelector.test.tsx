/**
 * Sprint 4 — Issue #114
 * QualitySelector tests: dropdown, auto option, selection, close on pick.
 *
 * These tests are written FIRST (TDD) and will FAIL until charlie implements
 * src/features/player/components/controls/QualitySelector.tsx
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { usePlayerStore } from "@lib/stores/playerStore";

const mockLevels = [
  { id: 0, name: "360p", width: 640, height: 360, bitrate: 500000 },
  { id: 1, name: "720p", width: 1280, height: 720, bitrate: 2000000 },
  { id: 2, name: "1080p", width: 1920, height: 1080, bitrate: 4000000 },
];

beforeEach(() => {
  usePlayerStore.setState({
    status: "playing",
    currentStreamId: "stream-1",
    streamName: "Test",
    qualityLevels: mockLevels,
    currentQuality: -1, // auto
    subtitleTracks: [],
    currentSubtitle: -1,
    audioTracks: [],
    currentAudio: 0,
  });
});

import { QualitySelector } from "../QualitySelector";

describe("QualitySelector — dropdown", () => {
  it("renders quality selector button", () => {
    render(<QualitySelector />);
    expect(
      screen.getByRole("button", { name: /quality/i }),
    ).toBeInTheDocument();
  });

  it("dropdown is not visible initially", () => {
    render(<QualitySelector />);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("clicking button opens dropdown", () => {
    render(<QualitySelector />);
    fireEvent.click(screen.getByRole("button", { name: /quality/i }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("dropdown contains all quality levels", () => {
    render(<QualitySelector />);
    fireEvent.click(screen.getByRole("button", { name: /quality/i }));
    expect(screen.getByRole("option", { name: "360p" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "720p" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "1080p" })).toBeInTheDocument();
  });

  it("dropdown contains Auto option", () => {
    render(<QualitySelector />);
    fireEvent.click(screen.getByRole("button", { name: /quality/i }));
    expect(screen.getByRole("option", { name: /auto/i })).toBeInTheDocument();
  });

  it("current quality is marked as selected (auto by default)", () => {
    render(<QualitySelector />);
    fireEvent.click(screen.getByRole("button", { name: /quality/i }));
    const autoOption = screen.getByRole("option", { name: /auto/i });
    expect(autoOption).toHaveAttribute("aria-selected", "true");
  });

  it("selecting a quality level calls setCurrentQuality", () => {
    render(<QualitySelector />);
    fireEvent.click(screen.getByRole("button", { name: /quality/i }));
    fireEvent.click(screen.getByRole("option", { name: "720p" }));
    expect(usePlayerStore.getState().currentQuality).toBe(1);
  });

  it("dropdown closes after selection", () => {
    render(<QualitySelector />);
    fireEvent.click(screen.getByRole("button", { name: /quality/i }));
    fireEvent.click(screen.getByRole("option", { name: "720p" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("selecting Auto sets quality to -1", () => {
    usePlayerStore.setState({ currentQuality: 2 });
    render(<QualitySelector />);
    fireEvent.click(screen.getByRole("button", { name: /quality/i }));
    fireEvent.click(screen.getByRole("option", { name: /auto/i }));
    expect(usePlayerStore.getState().currentQuality).toBe(-1);
  });

  it("shows empty state when no quality levels available", () => {
    usePlayerStore.setState({ qualityLevels: [] });
    render(<QualitySelector />);
    fireEvent.click(screen.getByRole("button", { name: /quality/i }));
    // Should show Auto only or empty/disabled state
    expect(
      screen.queryByRole("option", { name: "360p" }),
    ).not.toBeInTheDocument();
  });
});
