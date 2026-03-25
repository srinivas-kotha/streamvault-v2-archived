/**
 * Sprint 4 — Issue #116
 * ErrorRecovery component tests: error message display, retry action,
 * and back/close behaviour.
 *
 * These tests are written FIRST (TDD) and will FAIL until charlie implements
 * src/features/player/components/ErrorRecovery.tsx
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { usePlayerStore } from "@lib/stores/playerStore";

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  usePlayerStore.setState({
    status: "error",
    currentStreamId: "stream-1",
    streamType: "vod",
    streamName: "Test Movie",
    currentTime: 120,
    duration: 3600,
    bufferedEnd: 300,
    volume: 1,
    isMuted: false,
    qualityLevels: [],
    currentQuality: -1,
    subtitleTracks: [],
    currentSubtitle: -1,
    audioTracks: [],
    currentAudio: 0,
    error: "Stream failed to load",
  });
});

import { ErrorRecovery } from "../ErrorRecovery";

// ── Rendering ─────────────────────────────────────────────────────────────────

describe("ErrorRecovery — rendering", () => {
  it("renders error container with data-testid", () => {
    render(<ErrorRecovery />);
    expect(screen.getByTestId("error-recovery")).toBeInTheDocument();
  });

  it("displays the error message from the store", () => {
    render(<ErrorRecovery />);
    expect(screen.getByText("Stream failed to load")).toBeInTheDocument();
  });

  it("displays a fallback message when error is null", () => {
    usePlayerStore.setState({ error: null });
    render(<ErrorRecovery />);
    // Should show a generic error message, not crash
    expect(screen.getByTestId("error-recovery")).toBeInTheDocument();
    expect(screen.getByText(/error|failed|problem/i)).toBeInTheDocument();
  });

  it("renders retry button", () => {
    render(<ErrorRecovery />);
    expect(
      screen.getByRole("button", { name: /retry|try again/i }),
    ).toBeInTheDocument();
  });

  it("renders go back / close button", () => {
    render(<ErrorRecovery />);
    expect(
      screen.getByRole("button", { name: /back|close|exit/i }),
    ).toBeInTheDocument();
  });
});

// ── Retry action ──────────────────────────────────────────────────────────────

describe("ErrorRecovery — retry action", () => {
  it("clicking retry transitions status from error to loading", () => {
    render(<ErrorRecovery />);
    fireEvent.click(screen.getByRole("button", { name: /retry|try again/i }));
    expect(usePlayerStore.getState().status).toBe("loading");
  });

  it("clicking retry clears the error in the store", () => {
    render(<ErrorRecovery />);
    fireEvent.click(screen.getByRole("button", { name: /retry|try again/i }));
    expect(usePlayerStore.getState().error).toBeNull();
  });

  it("clicking retry preserves currentStreamId", () => {
    render(<ErrorRecovery />);
    fireEvent.click(screen.getByRole("button", { name: /retry|try again/i }));
    expect(usePlayerStore.getState().currentStreamId).toBe("stream-1");
  });
});

// ── Go Back / Close action ────────────────────────────────────────────────────

describe("ErrorRecovery — go back action", () => {
  it("clicking go back calls stopPlayback (sets status to idle)", () => {
    render(<ErrorRecovery />);
    fireEvent.click(screen.getByRole("button", { name: /back|close|exit/i }));
    expect(usePlayerStore.getState().status).toBe("idle");
  });

  it("clicking go back sets currentStreamId to null", () => {
    render(<ErrorRecovery />);
    fireEvent.click(screen.getByRole("button", { name: /back|close|exit/i }));
    expect(usePlayerStore.getState().currentStreamId).toBeNull();
  });

  it("clicking go back clears the error", () => {
    render(<ErrorRecovery />);
    fireEvent.click(screen.getByRole("button", { name: /back|close|exit/i }));
    expect(usePlayerStore.getState().error).toBeNull();
  });
});

// ── Accessibility ─────────────────────────────────────────────────────────────

describe("ErrorRecovery — accessibility", () => {
  it("has role=alert or aria-live on the error container", () => {
    render(<ErrorRecovery />);
    const container = screen.getByTestId("error-recovery");
    const hasAlert =
      container.getAttribute("role") === "alert" ||
      container.getAttribute("aria-live") !== null;
    expect(hasAlert).toBe(true);
  });

  it("retry button is focusable (not disabled)", () => {
    render(<ErrorRecovery />);
    const retryBtn = screen.getByRole("button", { name: /retry|try again/i });
    expect(retryBtn).not.toBeDisabled();
  });
});
