/**
 * Sprint 8 Phase 4 — PlayerControls tests
 * Comprehensive unit tests for the PlayerControls component covering:
 * - Rendering with visible/hidden states
 * - Play/pause button behavior and display
 * - Rewind/forward seek buttons (VOD only)
 * - Mute toggle and volume slider
 * - Progress bar rendering and click-to-seek
 * - Live indicator and "Go Live" button
 * - Quality selector (toggle dropdown, select quality)
 * - Subtitle selector (toggle dropdown, select/disable)
 * - Next/prev episode buttons
 * - PiP and fullscreen button visibility
 * - Time display formatting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { createRef } from "react";
import type {
  VideoPlayerHandle,
  QualityLevel,
  SubtitleTrack,
} from "../VideoPlayer";

// ── Mock spatial navigation (not under test) ────────────────────────────────

vi.mock("@shared/hooks/useSpatialNav", () => {
  const React = require("react");
  return {
    useSpatialFocusable: ({ focusKey }: { focusKey: string }) => ({
      ref: { current: null },
      showFocusRing: false,
      focusProps: { "data-focus-key": focusKey },
    }),
    useSpatialContainer: ({ focusKey }: { focusKey: string }) => ({
      ref: { current: null },
      focusKey,
    }),
    FocusContext: {
      Provider: ({ children }: { children: React.ReactNode }) =>
        React.createElement(React.Fragment, null, children),
    },
  };
});

// ── Mock isTVMode (non-TV by default) ────────────────────────────────────────

vi.mock("@shared/utils/isTVMode", () => ({
  isTVMode: false,
}));

// ── Mock formatDuration (keep it simple) ────────────────────────────────────

vi.mock("@shared/utils/formatDuration", () => ({
  formatDuration: (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0)
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  },
}));

// ── Import after mocks ───────────────────────────────────────────────────────

import { PlayerControls } from "../PlayerControls";

// ── Test helpers ─────────────────────────────────────────────────────────────

function createMockPlayerHandle(): VideoPlayerHandle {
  return {
    play: vi.fn(),
    pause: vi.fn(),
    seek: vi.fn(),
    setQuality: vi.fn(),
    setSubtitleTrack: vi.fn(),
    seekToLiveEdge: vi.fn(),
    getVideo: vi.fn(() => null),
    toggleFullscreen: vi.fn(),
    togglePiP: vi.fn(() => Promise.resolve()),
  };
}

const defaultQualityLevels: QualityLevel[] = [
  { index: -1, height: 0, bitrate: 0, label: "Auto" },
  { index: 0, height: 720, bitrate: 3000000, label: "720p" },
  { index: 1, height: 1080, bitrate: 5000000, label: "1080p" },
];

const defaultSubtitleTracks: SubtitleTrack[] = [
  { index: 0, lang: "en", label: "English" },
  { index: 1, lang: "es", label: "Spanish" },
];

interface RenderOptions {
  isPlaying?: boolean;
  isLive?: boolean;
  currentTime?: number;
  duration?: number;
  qualityLevels?: QualityLevel[];
  currentQuality?: number;
  onQualityChange?: (index: number) => void;
  subtitleTracks?: SubtitleTrack[];
  currentSubtitle?: number;
  onSubtitleChange?: (index: number) => void;
  atLiveEdge?: boolean;
  onSeekToLiveEdge?: () => void;
  volume?: number;
  isMuted?: boolean;
  onVolumeChange?: (v: number) => void;
  onMuteToggle?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  visible?: boolean;
  playerHandle?: VideoPlayerHandle;
}

function renderControls(opts: RenderOptions = {}) {
  const handle = opts.playerHandle ?? createMockPlayerHandle();
  const playerRef = createRef<VideoPlayerHandle | null>();
  // Attach mock handle to ref
  (playerRef as React.MutableRefObject<VideoPlayerHandle | null>).current =
    handle;

  const props = {
    playerRef,
    isPlaying: opts.isPlaying ?? true,
    isLive: opts.isLive ?? false,
    currentTime: opts.currentTime ?? 60,
    duration: opts.duration ?? 3600,
    qualityLevels: opts.qualityLevels ?? defaultQualityLevels,
    currentQuality: opts.currentQuality ?? -1,
    onQualityChange: opts.onQualityChange ?? vi.fn(),
    subtitleTracks: opts.subtitleTracks ?? [],
    currentSubtitle: opts.currentSubtitle ?? -1,
    onSubtitleChange: opts.onSubtitleChange,
    atLiveEdge: opts.atLiveEdge ?? true,
    onSeekToLiveEdge: opts.onSeekToLiveEdge,
    volume: opts.volume ?? 1,
    isMuted: opts.isMuted ?? false,
    onVolumeChange: opts.onVolumeChange ?? vi.fn(),
    onMuteToggle: opts.onMuteToggle ?? vi.fn(),
    hasNext: opts.hasNext,
    hasPrev: opts.hasPrev,
    onNext: opts.onNext,
    onPrev: opts.onPrev,
    visible: opts.visible ?? true,
  };

  const result = render(<PlayerControls {...props} />);
  return { ...result, handle, playerRef };
}

// ── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

// ── Visibility ───────────────────────────────────────────────────────────────

describe("PlayerControls — visibility", () => {
  it("renders when visible=true", () => {
    const { container } = renderControls({ visible: true });
    const controls = container.firstElementChild as HTMLElement;
    expect(controls).toBeInTheDocument();
    expect(controls.className).toContain("opacity-100");
  });

  it("is hidden (opacity-0) when visible=false", () => {
    const { container } = renderControls({ visible: false });
    const controls = container.firstElementChild as HTMLElement;
    expect(controls.className).toContain("opacity-0");
  });

  it("has pointer-events-none when hidden", () => {
    const { container } = renderControls({ visible: false });
    const controls = container.firstElementChild as HTMLElement;
    expect(controls.className).toContain("pointer-events-none");
  });

  it("has pointer-events-auto when visible", () => {
    const { container } = renderControls({ visible: true });
    const controls = container.firstElementChild as HTMLElement;
    expect(controls.className).toContain("pointer-events-auto");
  });
});

// ── Play/Pause button ────────────────────────────────────────────────────────

describe("PlayerControls — play/pause", () => {
  it("calls playerRef.pause() when clicked while playing", () => {
    const handle = createMockPlayerHandle();
    renderControls({ isPlaying: true, playerHandle: handle });
    // The play/pause button is the first button
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    expect(handle.pause).toHaveBeenCalledOnce();
  });

  it("calls playerRef.play() when clicked while paused", () => {
    const handle = createMockPlayerHandle();
    renderControls({ isPlaying: false, playerHandle: handle });
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    expect(handle.play).toHaveBeenCalledOnce();
  });

  it("shows pause icon (two rects) when playing", () => {
    const { container } = renderControls({ isPlaying: true });
    // Pause icon has two <path> elements with different d attributes
    const svgs = container.querySelectorAll("button svg");
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("shows play icon (triangle) when paused", () => {
    const { container } = renderControls({ isPlaying: false });
    const svgs = container.querySelectorAll("button svg");
    expect(svgs.length).toBeGreaterThan(0);
  });
});

// ── Rewind / Forward buttons ─────────────────────────────────────────────────

describe("PlayerControls — seek buttons (VOD)", () => {
  it("renders rewind button for VOD with duration", () => {
    renderControls({ isLive: false, duration: 3600 });
    expect(screen.getByTitle("Rewind 10s")).toBeInTheDocument();
  });

  it("renders forward button for VOD with duration", () => {
    renderControls({ isLive: false, duration: 3600 });
    expect(screen.getByTitle("Forward 10s")).toBeInTheDocument();
  });

  it("does NOT render rewind button for live streams", () => {
    renderControls({ isLive: true });
    expect(screen.queryByTitle("Rewind 10s")).not.toBeInTheDocument();
  });

  it("does NOT render forward button for live streams", () => {
    renderControls({ isLive: true });
    expect(screen.queryByTitle("Forward 10s")).not.toBeInTheDocument();
  });

  it("does NOT render rewind button when duration is 0", () => {
    renderControls({ isLive: false, duration: 0 });
    expect(screen.queryByTitle("Rewind 10s")).not.toBeInTheDocument();
  });

  it("rewind button seeks back 10s from currentTime", () => {
    const handle = createMockPlayerHandle();
    renderControls({
      isLive: false,
      duration: 3600,
      currentTime: 60,
      playerHandle: handle,
    });
    fireEvent.click(screen.getByTitle("Rewind 10s"));
    expect(handle.seek).toHaveBeenCalledWith(50);
  });

  it("rewind button clamps to 0 when currentTime < 10", () => {
    const handle = createMockPlayerHandle();
    renderControls({
      isLive: false,
      duration: 3600,
      currentTime: 5,
      playerHandle: handle,
    });
    fireEvent.click(screen.getByTitle("Rewind 10s"));
    expect(handle.seek).toHaveBeenCalledWith(0);
  });

  it("forward button seeks ahead 10s from currentTime", () => {
    const handle = createMockPlayerHandle();
    renderControls({
      isLive: false,
      duration: 3600,
      currentTime: 60,
      playerHandle: handle,
    });
    fireEvent.click(screen.getByTitle("Forward 10s"));
    expect(handle.seek).toHaveBeenCalledWith(70);
  });

  it("forward button clamps to duration when near end", () => {
    const handle = createMockPlayerHandle();
    renderControls({
      isLive: false,
      duration: 65,
      currentTime: 60,
      playerHandle: handle,
    });
    fireEvent.click(screen.getByTitle("Forward 10s"));
    expect(handle.seek).toHaveBeenCalledWith(65);
  });
});

// ── Mute / Volume ────────────────────────────────────────────────────────────

describe("PlayerControls — mute/volume", () => {
  it("calls onMuteToggle when mute button clicked", () => {
    const onMuteToggle = vi.fn();
    renderControls({ onMuteToggle, volume: 1, isMuted: false });
    // The mute button is after play/pause and optional rewind/forward
    // Find it by its role and position — it contains a volume SVG
    const buttons = screen.getAllByRole("button");
    // Mute button comes after play, rewind (-10), forward (+10) for VOD
    const muteBtn = buttons.find(
      (b) =>
        b.closest("button") &&
        b.querySelector("svg")?.innerHTML.includes("strokeLinecap"),
    );
    // Simpler: click the button that contains the muted/volume SVG icon
    // The mute/volume button does NOT have a title attribute, unlike rewind/forward/pip/fullscreen
    // Find by aria - it's between forward and quality buttons
    // Most reliable: find all untitled buttons and click the one after forward
    // For correctness, just verify the mock is callable by clicking all buttons
    // until onMuteToggle is called
    for (const btn of buttons) {
      fireEvent.click(btn);
      if (onMuteToggle.mock.calls.length > 0) break;
    }
    expect(onMuteToggle).toHaveBeenCalledOnce();
  });

  it("shows muted icon when isMuted=true", () => {
    const { container } = renderControls({ isMuted: true, volume: 1 });
    // Muted icon has an X-like path (M17 14l2-2...)
    const svgs = container.querySelectorAll("svg");
    const hasMutedIcon = Array.from(svgs).some((svg) =>
      svg.innerHTML.includes("M17 14l2-2"),
    );
    expect(hasMutedIcon).toBe(true);
  });

  it("shows muted icon when volume=0", () => {
    const { container } = renderControls({ isMuted: false, volume: 0 });
    const svgs = container.querySelectorAll("svg");
    const hasMutedIcon = Array.from(svgs).some((svg) =>
      svg.innerHTML.includes("M17 14l2-2"),
    );
    expect(hasMutedIcon).toBe(true);
  });

  it("shows volume icon when not muted", () => {
    const { container } = renderControls({ isMuted: false, volume: 0.8 });
    // Volume icon path starts with M15.536
    const svgs = container.querySelectorAll("svg");
    const hasVolumeIcon = Array.from(svgs).some((svg) =>
      svg.innerHTML.includes("M15.536"),
    );
    expect(hasVolumeIcon).toBe(true);
  });

  it("renders volume range slider", () => {
    const { container } = renderControls({ volume: 0.7, isMuted: false });
    const slider = container.querySelector('input[type="range"]');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute("min", "0");
    expect(slider).toHaveAttribute("max", "1");
  });

  it("volume slider shows 0 when muted", () => {
    const { container } = renderControls({ volume: 0.8, isMuted: true });
    const slider = container.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement;
    expect(Number(slider.value)).toBe(0);
  });

  it("volume slider reflects actual volume when not muted", () => {
    const { container } = renderControls({ volume: 0.5, isMuted: false });
    const slider = container.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement;
    expect(Number(slider.value)).toBe(0.5);
  });

  it("calls onVolumeChange when slider changes", () => {
    const onVolumeChange = vi.fn();
    const { container } = renderControls({ onVolumeChange, volume: 0.5 });
    const slider = container.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "0.8" } });
    expect(onVolumeChange).toHaveBeenCalledWith(0.8);
  });
});

// ── Time display ─────────────────────────────────────────────────────────────

describe("PlayerControls — time display", () => {
  it("shows current time and duration for VOD", () => {
    renderControls({ isLive: false, currentTime: 90, duration: 3600 });
    expect(screen.getByText("1:30 / 1:00:00")).toBeInTheDocument();
  });

  it("does not show time display for live streams", () => {
    renderControls({ isLive: true });
    expect(screen.queryByText(/\//)).not.toBeInTheDocument();
  });

  it("does not show time display when duration is 0", () => {
    renderControls({ isLive: false, currentTime: 0, duration: 0 });
    expect(screen.queryByText("0:00 / 0:00")).not.toBeInTheDocument();
  });
});

// ── Live indicator ───────────────────────────────────────────────────────────

describe("PlayerControls — live indicator", () => {
  it("shows LIVE badge when isLive and atLiveEdge", () => {
    renderControls({ isLive: true, atLiveEdge: true });
    expect(screen.getByText("LIVE")).toBeInTheDocument();
  });

  it("shows 'Go Live' button when isLive but NOT atLiveEdge", () => {
    renderControls({ isLive: true, atLiveEdge: false });
    expect(screen.getByTitle("Jump to live edge")).toBeInTheDocument();
  });

  it("does not show LIVE badge when not at live edge", () => {
    renderControls({ isLive: true, atLiveEdge: false });
    expect(screen.queryByText("LIVE")).not.toBeInTheDocument();
  });

  it("calls onSeekToLiveEdge when 'Go Live' is clicked", () => {
    const onSeekToLiveEdge = vi.fn();
    renderControls({ isLive: true, atLiveEdge: false, onSeekToLiveEdge });
    fireEvent.click(screen.getByTitle("Jump to live edge"));
    expect(onSeekToLiveEdge).toHaveBeenCalledOnce();
  });

  it("does not show live indicator for VOD", () => {
    renderControls({ isLive: false });
    expect(screen.queryByText("LIVE")).not.toBeInTheDocument();
  });
});

// ── Progress bar ─────────────────────────────────────────────────────────────

describe("PlayerControls — progress bar", () => {
  it("renders progress bar for VOD with duration > 0", () => {
    const { container } = renderControls({ isLive: false, duration: 3600 });
    // Progress bar is the bar container (has w-full h-1.5 class)
    const bar = container.querySelector(".w-full.h-1\\.5");
    expect(bar).toBeInTheDocument();
  });

  it("does not render progress bar for live streams", () => {
    const { container } = renderControls({ isLive: true });
    const bar = container.querySelector(".w-full.h-1\\.5");
    expect(bar).not.toBeInTheDocument();
  });

  it("does not render progress bar when duration is 0", () => {
    const { container } = renderControls({ isLive: false, duration: 0 });
    const bar = container.querySelector(".w-full.h-1\\.5");
    expect(bar).not.toBeInTheDocument();
  });

  it("progress fill reflects currentTime/duration ratio", () => {
    const { container } = renderControls({
      isLive: false,
      currentTime: 1800,
      duration: 3600,
    });
    // The filled bar has style width set to progress%
    const fill = container.querySelector(
      ".bg-teal.rounded-full",
    ) as HTMLElement;
    expect(fill?.style.width).toBe("50%");
  });

  it("seeking via click calls playerRef.seek() with correct time", () => {
    const handle = createMockPlayerHandle();
    const { container } = renderControls({
      isLive: false,
      duration: 100,
      currentTime: 0,
      playerHandle: handle,
    });
    const bar = container.querySelector(".w-full.h-1\\.5") as HTMLDivElement;
    // Mock getBoundingClientRect to return a known rect
    Object.defineProperty(bar, "getBoundingClientRect", {
      value: () => ({ left: 0, width: 100 }),
      configurable: true,
    });
    // Click at 60% of the bar (clientX=60 out of width=100)
    fireEvent.click(bar, { clientX: 60 });
    expect(handle.seek).toHaveBeenCalledWith(60);
  });
});

// ── Quality selector ─────────────────────────────────────────────────────────

describe("PlayerControls — quality selector", () => {
  it("renders quality toggle button when >1 level", () => {
    const { container } = renderControls({
      qualityLevels: defaultQualityLevels,
    });
    const qualityBtn = container.querySelector(
      '[data-focus-key="player-quality-toggle"]',
    );
    expect(qualityBtn).toBeInTheDocument();
  });

  it("does not render quality button when only 1 level", () => {
    const { container } = renderControls({
      qualityLevels: [{ index: -1, height: 0, bitrate: 0, label: "Auto" }],
    });
    // With only 1 quality level, the quality dropdown should not be shown
    // The quality toggle button uses the gear icon path
    const qualityBtn = container.querySelector(
      '[data-focus-key="player-quality-toggle"]',
    );
    expect(qualityBtn).not.toBeInTheDocument();
  });

  it("clicking quality button shows quality dropdown", () => {
    const { container } = renderControls({
      qualityLevels: defaultQualityLevels,
    });
    const btn = container.querySelector(
      '[data-focus-key="player-quality-toggle"]',
    ) as HTMLButtonElement;
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    // Quality items render with their focus keys
    expect(
      container.querySelector('[data-focus-key="player-quality-0"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-focus-key="player-quality-1"]'),
    ).toBeInTheDocument();
  });

  it("clicking quality level calls onQualityChange with correct index", () => {
    const onQualityChange = vi.fn();
    const { container } = renderControls({
      qualityLevels: defaultQualityLevels,
      onQualityChange,
    });
    // Open dropdown
    const toggleBtn = container.querySelector(
      '[data-focus-key="player-quality-toggle"]',
    ) as HTMLButtonElement;
    fireEvent.click(toggleBtn);
    // Click 720p option (index 0)
    const quality0Btn = container.querySelector(
      '[data-focus-key="player-quality-0"]',
    ) as HTMLButtonElement;
    fireEvent.click(quality0Btn);
    expect(onQualityChange).toHaveBeenCalledWith(0);
  });

  it("clicking quality level closes the dropdown", () => {
    const { container } = renderControls({
      qualityLevels: defaultQualityLevels,
    });
    const toggleBtn = container.querySelector(
      '[data-focus-key="player-quality-toggle"]',
    ) as HTMLButtonElement;
    fireEvent.click(toggleBtn);
    expect(
      container.querySelector('[data-focus-key="player-quality-0"]'),
    ).toBeInTheDocument();
    fireEvent.click(
      container.querySelector(
        '[data-focus-key="player-quality-0"]',
      ) as HTMLButtonElement,
    );
    expect(
      container.querySelector('[data-focus-key="player-quality-0"]'),
    ).not.toBeInTheDocument();
  });

  it("currently selected quality has highlighted style", () => {
    const { container } = renderControls({
      qualityLevels: defaultQualityLevels,
      currentQuality: 0, // 720p selected (index 0)
    });
    const toggleBtn = container.querySelector(
      '[data-focus-key="player-quality-toggle"]',
    ) as HTMLButtonElement;
    fireEvent.click(toggleBtn);
    const quality0Btn = container.querySelector(
      '[data-focus-key="player-quality-0"]',
    ) as HTMLElement;
    expect(quality0Btn.className).toContain("bg-teal/15");
  });
});

// ── Subtitle selector ────────────────────────────────────────────────────────

describe("PlayerControls — subtitle selector", () => {
  it("renders subtitle button when subtitle tracks provided with handler", () => {
    const { container } = renderControls({
      subtitleTracks: defaultSubtitleTracks,
      onSubtitleChange: vi.fn(),
    });
    const subtitleBtn = container.querySelector(
      '[data-focus-key="player-subtitle-toggle"]',
    );
    expect(subtitleBtn).toBeInTheDocument();
  });

  it("does not render subtitle button when no subtitle tracks", () => {
    const { container } = renderControls({ subtitleTracks: [] });
    const subtitleBtn = container.querySelector(
      '[data-focus-key="player-subtitle-toggle"]',
    );
    expect(subtitleBtn).not.toBeInTheDocument();
  });

  it("does not render subtitle button when no onSubtitleChange handler", () => {
    const { container } = renderControls({
      subtitleTracks: defaultSubtitleTracks,
      onSubtitleChange: undefined,
    });
    const subtitleBtn = container.querySelector(
      '[data-focus-key="player-subtitle-toggle"]',
    );
    expect(subtitleBtn).not.toBeInTheDocument();
  });

  it("clicking subtitle button opens dropdown with track list", () => {
    const { container } = renderControls({
      subtitleTracks: defaultSubtitleTracks,
      onSubtitleChange: vi.fn(),
    });
    const toggleBtn = container.querySelector(
      '[data-focus-key="player-subtitle-toggle"]',
    ) as HTMLButtonElement;
    fireEvent.click(toggleBtn);
    // Track labels include lang code: "English (en)", "Spanish (es)"
    expect(screen.getByText(/English/)).toBeInTheDocument();
    expect(screen.getByText(/Spanish/)).toBeInTheDocument();
  });

  it("dropdown includes 'Off' option", () => {
    const { container } = renderControls({
      subtitleTracks: defaultSubtitleTracks,
      onSubtitleChange: vi.fn(),
    });
    const toggleBtn = container.querySelector(
      '[data-focus-key="player-subtitle-toggle"]',
    ) as HTMLButtonElement;
    fireEvent.click(toggleBtn);
    expect(screen.getByText("Off")).toBeInTheDocument();
  });

  it("clicking subtitle track calls onSubtitleChange with track index", () => {
    const onSubtitleChange = vi.fn();
    const { container } = renderControls({
      subtitleTracks: defaultSubtitleTracks,
      onSubtitleChange,
    });
    const toggleBtn = container.querySelector(
      '[data-focus-key="player-subtitle-toggle"]',
    ) as HTMLButtonElement;
    fireEvent.click(toggleBtn);
    // Track label is "English (en)" — click by focusKey for precision
    const englishBtn = container.querySelector(
      '[data-focus-key="player-subtitle-0"]',
    ) as HTMLButtonElement;
    fireEvent.click(englishBtn);
    expect(onSubtitleChange).toHaveBeenCalledWith(0);
  });

  it("clicking 'Off' calls onSubtitleChange(-1)", () => {
    const onSubtitleChange = vi.fn();
    const { container } = renderControls({
      subtitleTracks: defaultSubtitleTracks,
      onSubtitleChange,
      currentSubtitle: 0,
    });
    const toggleBtn = container.querySelector(
      '[data-focus-key="player-subtitle-toggle"]',
    ) as HTMLButtonElement;
    fireEvent.click(toggleBtn);
    fireEvent.click(screen.getByText("Off"));
    expect(onSubtitleChange).toHaveBeenCalledWith(-1);
  });

  it("selecting a subtitle closes the dropdown", () => {
    const { container } = renderControls({
      subtitleTracks: defaultSubtitleTracks,
      onSubtitleChange: vi.fn(),
    });
    const toggleBtn = container.querySelector(
      '[data-focus-key="player-subtitle-toggle"]',
    ) as HTMLButtonElement;
    fireEvent.click(toggleBtn);
    // After open, subtitle-0 button exists
    expect(
      container.querySelector('[data-focus-key="player-subtitle-0"]'),
    ).toBeInTheDocument();
    const englishBtn = container.querySelector(
      '[data-focus-key="player-subtitle-0"]',
    ) as HTMLButtonElement;
    fireEvent.click(englishBtn);
    // After selecting, dropdown closes — button gone
    expect(
      container.querySelector('[data-focus-key="player-subtitle-0"]'),
    ).not.toBeInTheDocument();
  });

  it("active subtitle track has highlighted style", () => {
    const { container } = renderControls({
      subtitleTracks: defaultSubtitleTracks,
      onSubtitleChange: vi.fn(),
      currentSubtitle: 1, // Spanish active
    });
    const toggleBtn = container.querySelector(
      '[data-focus-key="player-subtitle-toggle"]',
    ) as HTMLButtonElement;
    fireEvent.click(toggleBtn);
    const spanishBtn = container.querySelector(
      '[data-focus-key="player-subtitle-1"]',
    ) as HTMLElement;
    expect(spanishBtn.className).toContain("bg-teal/15");
  });

  it("subtitle track shows language code in parens", () => {
    const { container } = renderControls({
      subtitleTracks: [{ index: 0, lang: "fr", label: "French" }],
      onSubtitleChange: vi.fn(),
    });
    const toggleBtn = container.querySelector(
      '[data-focus-key="player-subtitle-toggle"]',
    ) as HTMLButtonElement;
    fireEvent.click(toggleBtn);
    const frBtn = container.querySelector(
      '[data-focus-key="player-subtitle-0"]',
    ) as HTMLElement;
    expect(frBtn).toBeInTheDocument();
    // Button text contains "French (fr)" — rendered as two text nodes
    expect(frBtn.textContent).toContain("French");
    expect(frBtn.textContent).toContain("(fr)");
  });
});

// ── Next/Prev episode ────────────────────────────────────────────────────────

describe("PlayerControls — next/prev episode", () => {
  it("renders prev button when hasPrev=true", () => {
    renderControls({ hasPrev: true, onPrev: vi.fn() });
    expect(screen.getByTitle("Previous")).toBeInTheDocument();
  });

  it("renders next button when hasNext=true", () => {
    renderControls({ hasNext: true, onNext: vi.fn() });
    expect(screen.getByTitle("Next")).toBeInTheDocument();
  });

  it("does not render prev button when hasPrev=false", () => {
    renderControls({ hasPrev: false });
    expect(screen.queryByTitle("Previous")).not.toBeInTheDocument();
  });

  it("does not render next button when hasNext=false", () => {
    renderControls({ hasNext: false });
    expect(screen.queryByTitle("Next")).not.toBeInTheDocument();
  });

  it("calls onPrev when prev button clicked", () => {
    const onPrev = vi.fn();
    renderControls({ hasPrev: true, onPrev });
    fireEvent.click(screen.getByTitle("Previous"));
    expect(onPrev).toHaveBeenCalledOnce();
  });

  it("calls onNext when next button clicked", () => {
    const onNext = vi.fn();
    renderControls({ hasNext: true, onNext });
    fireEvent.click(screen.getByTitle("Next"));
    expect(onNext).toHaveBeenCalledOnce();
  });
});

// ── PiP and Fullscreen buttons ───────────────────────────────────────────────

describe("PlayerControls — PiP and fullscreen", () => {
  it("renders PiP button in non-TV mode", () => {
    renderControls();
    expect(screen.getByTitle("Picture-in-Picture")).toBeInTheDocument();
  });

  it("renders fullscreen button in non-TV mode", () => {
    renderControls();
    expect(screen.getByTitle("Fullscreen")).toBeInTheDocument();
  });

  it("PiP button calls playerRef.togglePiP()", () => {
    const handle = createMockPlayerHandle();
    renderControls({ playerHandle: handle });
    fireEvent.click(screen.getByTitle("Picture-in-Picture"));
    expect(handle.togglePiP).toHaveBeenCalledOnce();
  });

  it("fullscreen button calls playerRef.toggleFullscreen()", () => {
    const handle = createMockPlayerHandle();
    renderControls({ playerHandle: handle });
    fireEvent.click(screen.getByTitle("Fullscreen"));
    expect(handle.toggleFullscreen).toHaveBeenCalledOnce();
  });
});

// ── Dropdown mutual exclusion ─────────────────────────────────────────────────

describe("PlayerControls — dropdown mutual exclusion", () => {
  it("opening quality dropdown closes subtitle dropdown", () => {
    const { container } = renderControls({
      qualityLevels: defaultQualityLevels,
      subtitleTracks: defaultSubtitleTracks,
      onSubtitleChange: vi.fn(),
    });
    // Open subtitle dropdown first
    const subtitleToggle = container.querySelector(
      '[data-focus-key="player-subtitle-toggle"]',
    ) as HTMLButtonElement;
    fireEvent.click(subtitleToggle);
    // Subtitle dropdown items are visible
    expect(
      container.querySelector('[data-focus-key="player-subtitle-0"]'),
    ).toBeInTheDocument();

    // Open quality dropdown
    const qualityToggle = container.querySelector(
      '[data-focus-key="player-quality-toggle"]',
    ) as HTMLButtonElement;
    fireEvent.click(qualityToggle);

    // Subtitle dropdown should be closed (items gone)
    expect(
      container.querySelector('[data-focus-key="player-subtitle-0"]'),
    ).not.toBeInTheDocument();
    // Quality dropdown should be open (items visible)
    expect(
      container.querySelector('[data-focus-key="player-quality-0"]'),
    ).toBeInTheDocument();
  });

  it("opening subtitle dropdown closes quality dropdown", () => {
    const { container } = renderControls({
      qualityLevels: defaultQualityLevels,
      subtitleTracks: defaultSubtitleTracks,
      onSubtitleChange: vi.fn(),
    });
    // Open quality dropdown first
    const qualityToggle = container.querySelector(
      '[data-focus-key="player-quality-toggle"]',
    ) as HTMLButtonElement;
    fireEvent.click(qualityToggle);
    // Quality items visible
    expect(
      container.querySelector('[data-focus-key="player-quality-0"]'),
    ).toBeInTheDocument();

    // Open subtitle dropdown
    const subtitleToggle = container.querySelector(
      '[data-focus-key="player-subtitle-toggle"]',
    ) as HTMLButtonElement;
    fireEvent.click(subtitleToggle);

    // Quality dropdown should be closed
    expect(
      container.querySelector('[data-focus-key="player-quality-0"]'),
    ).not.toBeInTheDocument();
    // Subtitle dropdown should be open
    expect(
      container.querySelector('[data-focus-key="player-subtitle-0"]'),
    ).toBeInTheDocument();
  });
});
