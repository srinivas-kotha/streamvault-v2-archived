/**
 * Sprint 4 — Issue #114
 * SubtitleSelector tests: Off option, track selection, current track shown.
 *
 * These tests are written FIRST (TDD) and will FAIL until charlie implements
 * src/features/player/components/controls/SubtitleSelector.tsx
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { usePlayerStore } from "@lib/stores/playerStore";

const mockTracks = [
  { id: 0, name: "English", lang: "en" },
  { id: 1, name: "Spanish", lang: "es" },
  { id: 2, name: "Hindi", lang: "hi" },
];

beforeEach(() => {
  usePlayerStore.setState({
    status: "playing",
    currentStreamId: "stream-1",
    streamName: "Test Movie",
    subtitleTracks: mockTracks,
    currentSubtitle: -1, // off by default
    qualityLevels: [],
    currentQuality: -1,
    audioTracks: [],
    currentAudio: 0,
  });
});

import { SubtitleSelector } from "../SubtitleSelector";

describe("SubtitleSelector — dropdown", () => {
  it("renders subtitle selector button", () => {
    render(<SubtitleSelector />);
    expect(
      screen.getByRole("button", { name: /subtitle|caption/i }),
    ).toBeInTheDocument();
  });

  it("dropdown is not visible initially", () => {
    render(<SubtitleSelector />);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("clicking button opens dropdown", () => {
    render(<SubtitleSelector />);
    fireEvent.click(screen.getByRole("button", { name: /subtitle|caption/i }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("dropdown contains Off option", () => {
    render(<SubtitleSelector />);
    fireEvent.click(screen.getByRole("button", { name: /subtitle|caption/i }));
    expect(screen.getByRole("option", { name: /off/i })).toBeInTheDocument();
  });

  it("dropdown contains all subtitle tracks", () => {
    render(<SubtitleSelector />);
    fireEvent.click(screen.getByRole("button", { name: /subtitle|caption/i }));
    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Spanish" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Hindi" })).toBeInTheDocument();
  });

  it("Off is marked as selected when currentSubtitle is -1", () => {
    render(<SubtitleSelector />);
    fireEvent.click(screen.getByRole("button", { name: /subtitle|caption/i }));
    const offOption = screen.getByRole("option", { name: /off/i });
    expect(offOption).toHaveAttribute("aria-selected", "true");
  });

  it("selecting English sets currentSubtitle to 0", () => {
    render(<SubtitleSelector />);
    fireEvent.click(screen.getByRole("button", { name: /subtitle|caption/i }));
    fireEvent.click(screen.getByRole("option", { name: "English" }));
    expect(usePlayerStore.getState().currentSubtitle).toBe(0);
  });

  it("selected track is marked as selected", () => {
    usePlayerStore.setState({ currentSubtitle: 1 });
    render(<SubtitleSelector />);
    fireEvent.click(screen.getByRole("button", { name: /subtitle|caption/i }));
    const spanishOption = screen.getByRole("option", { name: "Spanish" });
    expect(spanishOption).toHaveAttribute("aria-selected", "true");
  });

  it("dropdown closes after selection", () => {
    render(<SubtitleSelector />);
    fireEvent.click(screen.getByRole("button", { name: /subtitle|caption/i }));
    fireEvent.click(screen.getByRole("option", { name: "English" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("selecting Off sets currentSubtitle to -1", () => {
    usePlayerStore.setState({ currentSubtitle: 0 });
    render(<SubtitleSelector />);
    fireEvent.click(screen.getByRole("button", { name: /subtitle|caption/i }));
    fireEvent.click(screen.getByRole("option", { name: /off/i }));
    expect(usePlayerStore.getState().currentSubtitle).toBe(-1);
  });
});
