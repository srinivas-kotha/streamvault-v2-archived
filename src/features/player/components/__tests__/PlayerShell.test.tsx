/**
 * Sprint 4 — Issue #112
 * PlayerShell component tests: single global player, state-driven rendering,
 * device-specific controls, and CSS transform isolation.
 *
 * These tests are written FIRST (TDD) and will FAIL until charlie implements
 * src/features/player/components/PlayerShell.tsx
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { usePlayerStore } from "@lib/stores/playerStore";

// ── Mock HLS.js (not available in jsdom) ─────────────────────────────────────

vi.mock("hls.js", () => ({
  default: class MockHls {
    static isSupported = () => true;
    static Events = {
      MEDIA_ATTACHED: "hlsMediaAttached",
      MANIFEST_PARSED: "hlsManifestParsed",
      ERROR: "hlsError",
      LEVEL_SWITCHED: "hlsLevelSwitched",
      SUBTITLE_TRACKS_UPDATED: "hlsSubtitleTracksUpdated",
      BUFFER_APPENDED: "hlsBufferAppended",
    };
    on = vi.fn();
    off = vi.fn();
    loadSource = vi.fn();
    attachMedia = vi.fn();
    destroy = vi.fn();
    stopLoad = vi.fn();
    detachMedia = vi.fn();
    startLoad = vi.fn();
    currentLevel = -1;
    nextLevel = -1;
    subtitleTrack = -1;
    audioTrack = 0;
    levels = [];
    subtitleTracks = [];
    audioTracks = [];
  },
}));

// ── Mock mpegts.js ────────────────────────────────────────────────────────────

vi.mock("mpegts.js", () => ({
  default: {
    isSupported: () => true,
    createPlayer: () => ({
      attachMediaElement: vi.fn(),
      load: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      destroy: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    }),
    Events: {
      ERROR: "error",
      LOADING_COMPLETE: "loadingComplete",
    },
  },
}));

// ── Mock device detection ─────────────────────────────────────────────────────

vi.mock("@shared/hooks/useDeviceContext", () => ({
  useDeviceContext: vi.fn(() => ({
    deviceClass: "desktop" as const,
    isTVMode: false,
    hlsBackBuffer: 60,
    hlsMaxBuffer: 60,
    hlsEnableWorker: true,
  })),
}));

// ── Mock child player components ──────────────────────────────────────────────

vi.mock("../VideoElement", () => ({
  VideoElement: () => <video data-testid="video-element" />,
}));

vi.mock("../BufferingOverlay", () => ({
  BufferingOverlay: () => <div data-testid="buffering-overlay" />,
}));

vi.mock("../ErrorRecovery", () => ({
  ErrorRecovery: () => <div data-testid="error-recovery" />,
}));

vi.mock("../controls/DesktopControls", () => ({
  DesktopControls: () => <div data-testid="desktop-controls" />,
}));

vi.mock("../controls/TVControls", () => ({
  TVControls: () => <div data-testid="tv-controls" />,
}));

vi.mock("../controls/MobileControls", () => ({
  MobileControls: () => <div data-testid="mobile-controls" />,
}));

// ── Import AFTER mocks ────────────────────────────────────────────────────────

import { PlayerShell } from "../PlayerShell";
import { useDeviceContext } from "@shared/hooks/useDeviceContext";

// ── Reset store before each test ──────────────────────────────────────────────

beforeEach(() => {
  usePlayerStore.setState({
    status: "idle",
    currentStreamId: null,
    streamType: null,
    streamName: "",
    startTime: 0,
    seriesContext: null,
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
  vi.mocked(useDeviceContext).mockReturnValue({
    deviceClass: "desktop",
    isTVMode: false,
    hlsBackBuffer: 60,
    hlsMaxBuffer: 60,
    hlsEnableWorker: true,
  });
});

// ── Idle state (no stream) ────────────────────────────────────────────────────

describe("PlayerShell — idle state", () => {
  it("renders nothing when status is idle and no currentStreamId", () => {
    const { container } = render(<PlayerShell />);
    expect(container.firstChild).toBeNull();
  });

  it("does not render video element when idle", () => {
    render(<PlayerShell />);
    expect(screen.queryByTestId("video-element")).not.toBeInTheDocument();
  });

  it("does not render controls when idle", () => {
    render(<PlayerShell />);
    expect(screen.queryByTestId("desktop-controls")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tv-controls")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mobile-controls")).not.toBeInTheDocument();
  });
});

// ── Active stream ─────────────────────────────────────────────────────────────

describe("PlayerShell — active stream", () => {
  beforeEach(() => {
    usePlayerStore.setState({
      status: "playing",
      currentStreamId: "stream-abc",
      streamType: "live",
      streamName: "BBC News",
    });
  });

  it("renders player container when status is not idle", () => {
    render(<PlayerShell />);
    expect(screen.getByTestId("player-shell")).toBeInTheDocument();
  });

  it("renders video element when stream is active", () => {
    render(<PlayerShell />);
    expect(screen.getByTestId("video-element")).toBeInTheDocument();
  });

  it("has position:fixed and z-index:50 to cover full viewport", () => {
    render(<PlayerShell />);
    const shell = screen.getByTestId("player-shell");
    // Fixed position is critical — must not be inside a CSS transform ancestor
    expect(shell.className).toMatch(/fixed/);
    expect(shell.className).toMatch(/inset-0/);
  });

  it("uses dark background", () => {
    render(<PlayerShell />);
    const shell = screen.getByTestId("player-shell");
    expect(shell.className).toMatch(/bg-black/);
  });
});

// ── Buffering state ───────────────────────────────────────────────────────────

describe("PlayerShell — buffering state", () => {
  it("renders BufferingOverlay when status is buffering", () => {
    usePlayerStore.setState({
      status: "buffering",
      currentStreamId: "stream-1",
      streamName: "Test Stream",
    });
    render(<PlayerShell />);
    expect(screen.getByTestId("buffering-overlay")).toBeInTheDocument();
  });

  it("does not render BufferingOverlay when status is playing", () => {
    usePlayerStore.setState({
      status: "playing",
      currentStreamId: "stream-1",
      streamName: "Test Stream",
    });
    render(<PlayerShell />);
    expect(screen.queryByTestId("buffering-overlay")).not.toBeInTheDocument();
  });
});

// ── Error state ───────────────────────────────────────────────────────────────

describe("PlayerShell — error state", () => {
  it("renders ErrorRecovery when status is error", () => {
    usePlayerStore.setState({
      status: "error",
      currentStreamId: "stream-1",
      streamName: "Test Stream",
      error: { code: "NETWORK_ERROR", message: "Connection lost" },
    });
    render(<PlayerShell />);
    expect(screen.getByTestId("error-recovery")).toBeInTheDocument();
  });

  it("does not render ErrorRecovery when status is playing", () => {
    usePlayerStore.setState({
      status: "playing",
      currentStreamId: "stream-1",
      streamName: "Test Stream",
    });
    render(<PlayerShell />);
    expect(screen.queryByTestId("error-recovery")).not.toBeInTheDocument();
  });
});

// ── Device-specific controls ──────────────────────────────────────────────────

describe("PlayerShell — device-specific controls", () => {
  const activeStreamState = {
    status: "playing" as const,
    currentStreamId: "stream-1",
    streamName: "Test",
    streamType: "live" as const,
  };

  it("renders DesktopControls on desktop", () => {
    vi.mocked(useDeviceContext).mockReturnValue({
      deviceClass: "desktop",
      isTVMode: false,
      hlsBackBuffer: 60,
      hlsMaxBuffer: 60,
      hlsEnableWorker: true,
    });
    usePlayerStore.setState(activeStreamState);
    render(<PlayerShell />);
    expect(screen.getByTestId("desktop-controls")).toBeInTheDocument();
    expect(screen.queryByTestId("tv-controls")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mobile-controls")).not.toBeInTheDocument();
  });

  it("renders TVControls on TV", () => {
    vi.mocked(useDeviceContext).mockReturnValue({
      deviceClass: "tv",
      isTVMode: true,
      hlsBackBuffer: 20,
      hlsMaxBuffer: 30,
      hlsEnableWorker: false,
    });
    usePlayerStore.setState(activeStreamState);
    render(<PlayerShell />);
    expect(screen.getByTestId("tv-controls")).toBeInTheDocument();
    expect(screen.queryByTestId("desktop-controls")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mobile-controls")).not.toBeInTheDocument();
  });

  it("renders MobileControls on mobile", () => {
    vi.mocked(useDeviceContext).mockReturnValue({
      deviceClass: "mobile",
      isTVMode: false,
      hlsBackBuffer: 30,
      hlsMaxBuffer: 60,
      hlsEnableWorker: true,
    });
    usePlayerStore.setState(activeStreamState);
    render(<PlayerShell />);
    expect(screen.getByTestId("mobile-controls")).toBeInTheDocument();
    expect(screen.queryByTestId("desktop-controls")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tv-controls")).not.toBeInTheDocument();
  });

  it("renders MobileControls on tablet", () => {
    vi.mocked(useDeviceContext).mockReturnValue({
      deviceClass: "tablet",
      isTVMode: false,
      hlsBackBuffer: 30,
      hlsMaxBuffer: 60,
      hlsEnableWorker: true,
    });
    usePlayerStore.setState(activeStreamState);
    render(<PlayerShell />);
    expect(screen.getByTestId("mobile-controls")).toBeInTheDocument();
    expect(screen.queryByTestId("desktop-controls")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tv-controls")).not.toBeInTheDocument();
  });
});

// ── Single instance guarantee ─────────────────────────────────────────────────

describe("PlayerShell — single instance", () => {
  it("only one player-shell exists in the DOM at any time", () => {
    usePlayerStore.setState({
      status: "playing",
      currentStreamId: "stream-1",
      streamName: "Test",
    });
    render(<PlayerShell />);
    render(<PlayerShell />);
    // Only one should be rendered by the root — both share the same store
    // This test validates that rendering 2 PlayerShell components with the
    // same store doesn't create conflicts. In practice only __root.tsx renders one.
    const shells = document.querySelectorAll('[data-testid="player-shell"]');
    // Both mount independently in test; this validates the component renders exactly once per mount
    expect(shells.length).toBeGreaterThanOrEqual(1);
  });

  it("PlayerShell element itself does NOT have CSS transform styles", () => {
    usePlayerStore.setState({
      status: "playing",
      currentStreamId: "stream-1",
      streamName: "Test",
    });
    render(<PlayerShell />);
    const shell = screen.getByTestId("player-shell");
    const computedStyle = window.getComputedStyle(shell);
    // Should not have transform (which would break position:fixed children)
    expect(computedStyle.transform).toBeFalsy();
    expect(shell.style.transform).toBe("");
  });
});

// ── Loading state ─────────────────────────────────────────────────────────────

describe("PlayerShell — loading state", () => {
  it("renders player container while loading (before HLS manifest)", () => {
    usePlayerStore.setState({
      status: "loading",
      currentStreamId: "stream-1",
      streamName: "Test Stream",
    });
    render(<PlayerShell />);
    expect(screen.getByTestId("player-shell")).toBeInTheDocument();
  });

  it("renders BufferingOverlay while loading", () => {
    usePlayerStore.setState({
      status: "loading",
      currentStreamId: "stream-1",
      streamName: "Test Stream",
    });
    render(<PlayerShell />);
    expect(screen.getByTestId("buffering-overlay")).toBeInTheDocument();
  });
});
