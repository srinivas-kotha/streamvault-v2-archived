/**
 * Sprint 4 — Issue #114
 * AudioTrackSelector tests: track listing, current track display, selection.
 *
 * These tests are written FIRST (TDD) and will FAIL until charlie implements
 * src/features/player/components/controls/AudioTrackSelector.tsx
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { usePlayerStore } from "@lib/stores/playerStore";

const mockAudioTracks = [
  { id: 0, name: "English", lang: "en" },
  { id: 1, name: "Hindi", lang: "hi" },
  { id: 2, name: "Telugu", lang: "te" },
];

beforeEach(() => {
  usePlayerStore.setState({
    status: "playing",
    currentStreamId: "stream-1",
    streamName: "Test Movie",
    audioTracks: mockAudioTracks,
    currentAudio: 0, // English selected
    subtitleTracks: [],
    currentSubtitle: -1,
    qualityLevels: [],
    currentQuality: -1,
  });
});

import { AudioTrackSelector } from "../AudioTrackSelector";

describe("AudioTrackSelector — dropdown", () => {
  it("renders audio track selector button", () => {
    render(<AudioTrackSelector />);
    expect(screen.getByRole("button", { name: /audio/i })).toBeInTheDocument();
  });

  it("dropdown is not visible initially", () => {
    render(<AudioTrackSelector />);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("clicking button opens dropdown", () => {
    render(<AudioTrackSelector />);
    fireEvent.click(screen.getByRole("button", { name: /audio/i }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("dropdown contains all audio tracks", () => {
    render(<AudioTrackSelector />);
    fireEvent.click(screen.getByRole("button", { name: /audio/i }));
    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Hindi" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Telugu" })).toBeInTheDocument();
  });

  it("current audio track is marked as selected", () => {
    render(<AudioTrackSelector />);
    fireEvent.click(screen.getByRole("button", { name: /audio/i }));
    const englishOption = screen.getByRole("option", { name: "English" });
    expect(englishOption).toHaveAttribute("aria-selected", "true");
  });

  it("non-selected tracks are not marked selected", () => {
    render(<AudioTrackSelector />);
    fireEvent.click(screen.getByRole("button", { name: /audio/i }));
    const hindiOption = screen.getByRole("option", { name: "Hindi" });
    expect(hindiOption).toHaveAttribute("aria-selected", "false");
  });

  it("clicking a track calls setCurrentAudio", () => {
    render(<AudioTrackSelector />);
    fireEvent.click(screen.getByRole("button", { name: /audio/i }));
    fireEvent.click(screen.getByRole("option", { name: "Hindi" }));
    expect(usePlayerStore.getState().currentAudio).toBe(1);
  });

  it("dropdown closes after selection", () => {
    render(<AudioTrackSelector />);
    fireEvent.click(screen.getByRole("button", { name: /audio/i }));
    fireEvent.click(screen.getByRole("option", { name: "Hindi" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not render when only one audio track (or none)", () => {
    usePlayerStore.setState({ audioTracks: [] });
    render(<AudioTrackSelector />);
    // When no tracks, the button should not render or be hidden
    expect(
      screen.queryByRole("button", { name: /audio/i }),
    ).not.toBeInTheDocument();
  });
});
