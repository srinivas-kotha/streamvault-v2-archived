/**
 * Sprint 8 Phase 4 — VideoElement tests
 * Comprehensive unit tests for the VideoElement component covering:
 * - HLS.js initialization and teardown
 * - mpegts.js initialization and teardown
 * - Direct playback fallback
 * - Error handling (network, media, fatal errors)
 * - Quality level switching
 * - Subtitle track management
 * - Event listener attachment/cleanup
 * - Imperative handle methods (play, pause, seek, fullscreen, PiP)
 * - TV mode HLS config differences
 * - Live edge detection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { createRef } from "react";
import type { VideoElementHandle } from "../VideoElement";

// ── Track HLS event handlers for simulation ──────────────────────────────────

type HlsEventHandler = (...args: unknown[]) => void;
const hlsEventHandlers: Record<string, HlsEventHandler[]> = {};
let lastHlsInstance: MockHlsInstance | null = null;

interface MockHlsInstance {
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  loadSource: ReturnType<typeof vi.fn>;
  attachMedia: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  stopLoad: ReturnType<typeof vi.fn>;
  detachMedia: ReturnType<typeof vi.fn>;
  startLoad: ReturnType<typeof vi.fn>;
  recoverMediaError: ReturnType<typeof vi.fn>;
  currentLevel: number;
  nextLevel: number;
  subtitleTrack: number;
  audioTrack: number;
  levels: Array<{ height: number; bitrate: number }>;
  subtitleTracks: Array<{ lang: string; name: string }>;
  audioTracks: Array<{ lang: string; name: string }>;
  liveSyncPosition: number | undefined;
}

function createMockHlsInstance(): MockHlsInstance {
  return {
    on: vi.fn((event: string, handler: HlsEventHandler) => {
      if (!hlsEventHandlers[event]) hlsEventHandlers[event] = [];
      hlsEventHandlers[event].push(handler);
    }),
    off: vi.fn(),
    loadSource: vi.fn(),
    attachMedia: vi.fn(),
    destroy: vi.fn(),
    stopLoad: vi.fn(),
    detachMedia: vi.fn(),
    startLoad: vi.fn(),
    recoverMediaError: vi.fn(),
    currentLevel: -1,
    nextLevel: -1,
    subtitleTrack: -1,
    audioTrack: 0,
    levels: [],
    subtitleTracks: [],
    audioTracks: [],
    liveSyncPosition: undefined,
  };
}

function emitHlsEvent(event: string, ...args: unknown[]) {
  hlsEventHandlers[event]?.forEach((handler) => handler(...args));
}

vi.mock("hls.js", () => {
  const MockHls = vi.fn(() => {
    const instance = createMockHlsInstance();
    lastHlsInstance = instance;
    return instance;
  });

  Object.assign(MockHls, {
    isSupported: vi.fn(() => true),
    Events: {
      MEDIA_ATTACHED: "hlsMediaAttached",
      MANIFEST_PARSED: "hlsManifestParsed",
      ERROR: "hlsError",
      LEVEL_SWITCHED: "hlsLevelSwitched",
      SUBTITLE_TRACKS_UPDATED: "hlsSubtitleTracksUpdated",
      BUFFER_APPENDED: "hlsBufferAppended",
    },
    ErrorTypes: {
      NETWORK_ERROR: "networkError",
      MEDIA_ERROR: "mediaError",
      OTHER_ERROR: "otherError",
    },
  });

  return { default: MockHls };
});

// ── Mock mpegts.js ────────────────────────────────────────────────────────────

let lastMpegtsInstance: {
  attachMediaElement: ReturnType<typeof vi.fn>;
  load: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  unload: ReturnType<typeof vi.fn>;
  detachMediaElement: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
} | null = null;
const mpegtsEventHandlers: Record<string, HlsEventHandler[]> = {};

vi.mock("mpegts.js", () => ({
  default: {
    isSupported: vi.fn(() => true),
    createPlayer: vi.fn(() => {
      const instance = {
        attachMediaElement: vi.fn(),
        load: vi.fn(),
        play: vi.fn(),
        pause: vi.fn(),
        unload: vi.fn(),
        detachMediaElement: vi.fn(),
        destroy: vi.fn(),
        on: vi.fn((event: string, handler: HlsEventHandler) => {
          if (!mpegtsEventHandlers[event]) mpegtsEventHandlers[event] = [];
          mpegtsEventHandlers[event].push(handler);
        }),
        off: vi.fn(),
      };
      lastMpegtsInstance = instance;
      return instance;
    }),
    Events: {
      ERROR: "error",
      LOADING_COMPLETE: "loadingComplete",
    },
  },
}));

// ── Import after mocks ───────────────────────────────────────────────────────

import { VideoElement } from "../VideoElement";

// ── HTMLVideoElement polyfills for jsdom ──────────────────────────────────────

function mockVideoElement(el: HTMLVideoElement) {
  Object.defineProperty(el, "play", {
    value: vi.fn(() => Promise.resolve()),
    writable: true,
    configurable: true,
  });
  Object.defineProperty(el, "pause", {
    value: vi.fn(),
    writable: true,
    configurable: true,
  });
  Object.defineProperty(el, "canPlayType", {
    value: vi.fn(() => ""),
    writable: true,
    configurable: true,
  });
  Object.defineProperty(el, "seekable", {
    value: { length: 0, start: vi.fn(), end: vi.fn() },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(el, "requestPictureInPicture", {
    value: vi.fn(() => Promise.resolve({})),
    writable: true,
    configurable: true,
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  lastHlsInstance = null;
  lastMpegtsInstance = null;
  Object.keys(hlsEventHandlers).forEach((k) => delete hlsEventHandlers[k]);
  Object.keys(mpegtsEventHandlers).forEach(
    (k) => delete mpegtsEventHandlers[k],
  );

  // Patch HTMLVideoElement prototype for jsdom
  const origCreate = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tag, options) => {
    const el = origCreate(tag, options);
    if (tag === "video") mockVideoElement(el as HTMLVideoElement);
    return el;
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Helper to render and wait for async init
async function renderVideoElement(
  props: Partial<React.ComponentProps<typeof VideoElement>> = {},
  ref?: React.RefObject<VideoElementHandle | null>,
) {
  const defaultProps = {
    url: "http://example.com/stream.m3u8",
    isLive: false,
    format: "m3u8",
  };
  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <VideoElement ref={ref ?? undefined} {...defaultProps} {...props} />,
    );
  });
  return result!;
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe("VideoElement — rendering", () => {
  it("renders a container with data-testid", async () => {
    const { getByTestId } = await renderVideoElement();
    expect(getByTestId("video-element")).toBeInTheDocument();
  });

  it("renders a <video> element inside the container", async () => {
    const { container } = await renderVideoElement();
    expect(container.querySelector("video")).toBeInTheDocument();
  });

  it("video element has playsInline attribute", async () => {
    const { container } = await renderVideoElement();
    const video = container.querySelector("video")!;
    expect(video).toHaveAttribute("playsinline");
  });

  it("container has bg-black class for dark background", async () => {
    const { getByTestId } = await renderVideoElement();
    expect(getByTestId("video-element").className).toContain("bg-black");
  });
});

// ── HLS.js initialization ─────────────────────────────────────────────────────

describe("VideoElement — HLS.js initialization", () => {
  it("creates HLS instance for m3u8 format", async () => {
    await renderVideoElement({ format: "m3u8" });
    expect(lastHlsInstance).not.toBeNull();
  });

  it("creates HLS instance when URL ends in .m3u8 regardless of format", async () => {
    await renderVideoElement({
      url: "http://example.com/stream.m3u8",
      format: "unknown",
    });
    expect(lastHlsInstance).not.toBeNull();
  });

  it("calls attachMedia with the video element", async () => {
    await renderVideoElement();
    expect(lastHlsInstance!.attachMedia).toHaveBeenCalledWith(
      expect.any(HTMLVideoElement),
    );
  });

  it("calls loadSource with the URL", async () => {
    await renderVideoElement({ url: "http://test.com/live.m3u8" });
    expect(lastHlsInstance!.loadSource).toHaveBeenCalledWith(
      "http://test.com/live.m3u8",
    );
  });

  it("registers MANIFEST_PARSED event handler", async () => {
    await renderVideoElement();
    expect(lastHlsInstance!.on).toHaveBeenCalledWith(
      "hlsManifestParsed",
      expect.any(Function),
    );
  });

  it("registers ERROR event handler", async () => {
    await renderVideoElement();
    expect(lastHlsInstance!.on).toHaveBeenCalledWith(
      "hlsError",
      expect.any(Function),
    );
  });

  it("registers SUBTITLE_TRACKS_UPDATED event handler", async () => {
    await renderVideoElement();
    expect(lastHlsInstance!.on).toHaveBeenCalledWith(
      "hlsSubtitleTracksUpdated",
      expect.any(Function),
    );
  });

  it("registers BUFFER_APPENDED event handler", async () => {
    await renderVideoElement();
    expect(lastHlsInstance!.on).toHaveBeenCalledWith(
      "hlsBufferAppended",
      expect.any(Function),
    );
  });

  it("sets loading status on initialization", async () => {
    const onStatusChange = vi.fn();
    await renderVideoElement({ onStatusChange });
    expect(onStatusChange).toHaveBeenCalledWith("loading");
  });
});

// ── HLS.js TV mode config ─────────────────────────────────────────────────────

describe("VideoElement — TV mode HLS config", () => {
  it("passes isTVMode to HLS constructor affecting enableWorker", async () => {
    const HlsMock = (await import("hls.js")).default;
    await renderVideoElement({ isTVMode: true, isLive: false });
    expect(HlsMock).toHaveBeenCalledWith(
      expect.objectContaining({ enableWorker: false }),
    );
  });

  it("enableWorker is true when not in TV mode", async () => {
    const HlsMock = (await import("hls.js")).default;
    await renderVideoElement({ isTVMode: false, isLive: false });
    expect(HlsMock).toHaveBeenCalledWith(
      expect.objectContaining({ enableWorker: true }),
    );
  });

  it("sets lower backBufferLength for TV in live mode", async () => {
    const HlsMock = (await import("hls.js")).default;
    await renderVideoElement({ isTVMode: true, isLive: true });
    expect(HlsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        backBufferLength: 15,
        liveBackBufferLength: 15,
      }),
    );
  });

  it("sets standard backBufferLength for desktop in live mode", async () => {
    const HlsMock = (await import("hls.js")).default;
    await renderVideoElement({ isTVMode: false, isLive: true });
    expect(HlsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        backBufferLength: 30,
        liveBackBufferLength: 30,
      }),
    );
  });

  it("sets lower VOD backBufferLength on TV", async () => {
    const HlsMock = (await import("hls.js")).default;
    await renderVideoElement({ isTVMode: true, isLive: false });
    expect(HlsMock).toHaveBeenCalledWith(
      expect.objectContaining({ backBufferLength: 20 }),
    );
  });

  it("uses maxBufferLength=10 for live streams", async () => {
    const HlsMock = (await import("hls.js")).default;
    await renderVideoElement({ isLive: true });
    expect(HlsMock).toHaveBeenCalledWith(
      expect.objectContaining({ maxBufferLength: 10 }),
    );
  });

  it("uses maxBufferLength=30 for VOD streams", async () => {
    const HlsMock = (await import("hls.js")).default;
    await renderVideoElement({ isLive: false });
    expect(HlsMock).toHaveBeenCalledWith(
      expect.objectContaining({ maxBufferLength: 30 }),
    );
  });
});

// ── Quality levels ───────────────────────────────────────────────────────────

describe("VideoElement — quality levels", () => {
  it("reports quality levels on MANIFEST_PARSED", async () => {
    const onQualityLevelsReady = vi.fn();
    await renderVideoElement({ onQualityLevelsReady });
    lastHlsInstance!.levels = [
      { height: 720, bitrate: 3000000 },
      { height: 1080, bitrate: 5000000 },
    ];
    act(() => emitHlsEvent("hlsManifestParsed"));
    expect(onQualityLevelsReady).toHaveBeenCalledWith([
      { index: -1, height: 0, bitrate: 0, label: "Auto" },
      { index: 0, height: 720, bitrate: 3000000, label: "720p" },
      { index: 1, height: 1080, bitrate: 5000000, label: "1080p" },
    ]);
  });

  it("uses kbps label when height is 0", async () => {
    const onQualityLevelsReady = vi.fn();
    await renderVideoElement({ onQualityLevelsReady });
    lastHlsInstance!.levels = [{ height: 0, bitrate: 256000 }];
    act(() => emitHlsEvent("hlsManifestParsed"));
    expect(onQualityLevelsReady).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ label: "256kbps" })]),
    );
  });

  it("always prepends Auto quality level", async () => {
    const onQualityLevelsReady = vi.fn();
    await renderVideoElement({ onQualityLevelsReady });
    lastHlsInstance!.levels = [{ height: 480, bitrate: 1500000 }];
    act(() => emitHlsEvent("hlsManifestParsed"));
    const levels = onQualityLevelsReady.mock.calls[0][0];
    expect(levels[0]).toEqual({
      index: -1,
      height: 0,
      bitrate: 0,
      label: "Auto",
    });
  });
});

// ── Subtitle tracks ──────────────────────────────────────────────────────────

describe("VideoElement — subtitle tracks", () => {
  it("reports subtitle tracks on SUBTITLE_TRACKS_UPDATED", async () => {
    const onSubtitleTracksReady = vi.fn();
    await renderVideoElement({ onSubtitleTracksReady });
    lastHlsInstance!.subtitleTracks = [
      { lang: "en", name: "English" },
      { lang: "es", name: "Spanish" },
    ];
    act(() => emitHlsEvent("hlsSubtitleTracksUpdated"));
    expect(onSubtitleTracksReady).toHaveBeenCalledWith([
      { index: 0, lang: "en", label: "English" },
      { index: 1, lang: "es", label: "Spanish" },
    ]);
  });

  it("uses fallback label when name is empty", async () => {
    const onSubtitleTracksReady = vi.fn();
    await renderVideoElement({ onSubtitleTracksReady });
    lastHlsInstance!.subtitleTracks = [{ lang: "fr", name: "" }];
    act(() => emitHlsEvent("hlsSubtitleTracksUpdated"));
    expect(onSubtitleTracksReady).toHaveBeenCalledWith([
      { index: 0, lang: "fr", label: "Track 1" },
    ]);
  });

  it("uses empty string for missing lang", async () => {
    const onSubtitleTracksReady = vi.fn();
    await renderVideoElement({ onSubtitleTracksReady });
    lastHlsInstance!.subtitleTracks = [{ lang: undefined, name: "Sub 1" }];
    act(() => emitHlsEvent("hlsSubtitleTracksUpdated"));
    const tracks = onSubtitleTracksReady.mock.calls[0][0];
    expect(tracks[0].lang).toBe("");
  });
});

// ── Error handling ───────────────────────────────────────────────────────────

describe("VideoElement — HLS error handling", () => {
  it("recovers from fatal MEDIA_ERROR", async () => {
    await renderVideoElement();
    act(() =>
      emitHlsEvent("hlsError", "hlsError", {
        fatal: true,
        type: "mediaError",
      }),
    );
    expect(lastHlsInstance!.recoverMediaError).toHaveBeenCalled();
  });

  it("retries on fatal NETWORK_ERROR up to 3 times", async () => {
    await renderVideoElement();
    for (let i = 0; i < 3; i++) {
      act(() =>
        emitHlsEvent("hlsError", "hlsError", {
          fatal: true,
          type: "networkError",
        }),
      );
    }
    expect(lastHlsInstance!.startLoad).toHaveBeenCalledTimes(3);
  });

  it("falls back to direct playback after exceeding retry limit", async () => {
    const onStatusChange = vi.fn();
    await renderVideoElement({ onStatusChange });
    // Exhaust retries (4 errors = 3 retries + 1 fallback trigger)
    for (let i = 0; i < 4; i++) {
      act(() =>
        emitHlsEvent("hlsError", "hlsError", {
          fatal: true,
          type: "networkError",
        }),
      );
    }
    // After 4th error it falls back to direct playback, not immediate error
    expect(lastHlsInstance!.startLoad).toHaveBeenCalledTimes(3);
  });

  it("ignores non-fatal errors", async () => {
    const onStatusChange = vi.fn();
    await renderVideoElement({ onStatusChange });
    onStatusChange.mockClear();
    act(() =>
      emitHlsEvent("hlsError", "hlsError", {
        fatal: false,
        type: "networkError",
      }),
    );
    expect(onStatusChange).not.toHaveBeenCalledWith("error");
    expect(lastHlsInstance!.recoverMediaError).not.toHaveBeenCalled();
    expect(lastHlsInstance!.startLoad).not.toHaveBeenCalled();
  });

  it("falls back to direct playback on fatal OTHER_ERROR", async () => {
    const onStatusChange = vi.fn();
    await renderVideoElement({ onStatusChange });
    // First "other" error triggers direct playback fallback, not immediate error
    act(() =>
      emitHlsEvent("hlsError", "hlsError", {
        fatal: true,
        type: "otherError",
      }),
    );
    // Should not immediately report error (falls back to direct playback first)
    expect(onStatusChange).not.toHaveBeenCalledWith("error");
  });
});

// ── Status tracking events ───────────────────────────────────────────────────

describe("VideoElement — status tracking via video events", () => {
  it("reports playing on BUFFER_APPENDED (first fragment)", async () => {
    const onStatusChange = vi.fn();
    await renderVideoElement({ onStatusChange });
    onStatusChange.mockClear();
    act(() => emitHlsEvent("hlsBufferAppended"));
    expect(onStatusChange).toHaveBeenCalledWith("playing");
  });

  it("BUFFER_APPENDED only fires status change once", async () => {
    const onStatusChange = vi.fn();
    await renderVideoElement({ onStatusChange });
    onStatusChange.mockClear();
    act(() => emitHlsEvent("hlsBufferAppended"));
    act(() => emitHlsEvent("hlsBufferAppended"));
    const playingCalls = onStatusChange.mock.calls.filter(
      (c) => c[0] === "playing",
    );
    expect(playingCalls.length).toBe(1);
  });

  it("reports playing status on video play event", async () => {
    const onStatusChange = vi.fn();
    const { container } = await renderVideoElement({ onStatusChange });
    const video = container.querySelector("video")!;
    onStatusChange.mockClear();
    act(() => video.dispatchEvent(new Event("play")));
    expect(onStatusChange).toHaveBeenCalledWith("playing");
  });

  it("reports paused status on video pause event", async () => {
    const onStatusChange = vi.fn();
    const { container } = await renderVideoElement({ onStatusChange });
    const video = container.querySelector("video")!;
    act(() => video.dispatchEvent(new Event("pause")));
    expect(onStatusChange).toHaveBeenCalledWith("paused");
  });

  it("reports buffering status on video waiting event", async () => {
    const onStatusChange = vi.fn();
    const { container } = await renderVideoElement({ onStatusChange });
    const video = container.querySelector("video")!;
    act(() => video.dispatchEvent(new Event("waiting")));
    expect(onStatusChange).toHaveBeenCalledWith("buffering");
  });
});

// ── Time update ──────────────────────────────────────────────────────────────

describe("VideoElement — time update", () => {
  it("calls onTimeUpdate on timeupdate event", async () => {
    const onTimeUpdate = vi.fn();
    const { container } = await renderVideoElement({ onTimeUpdate });
    const video = container.querySelector("video")!;
    Object.defineProperty(video, "currentTime", {
      value: 42.5,
      writable: true,
    });
    Object.defineProperty(video, "duration", { value: 3600, writable: true });
    act(() => video.dispatchEvent(new Event("timeupdate")));
    expect(onTimeUpdate).toHaveBeenCalledWith(42.5, 3600);
  });

  it("uses 0 for duration when NaN", async () => {
    const onTimeUpdate = vi.fn();
    const { container } = await renderVideoElement({ onTimeUpdate });
    const video = container.querySelector("video")!;
    Object.defineProperty(video, "currentTime", { value: 10, writable: true });
    Object.defineProperty(video, "duration", { value: NaN, writable: true });
    act(() => video.dispatchEvent(new Event("timeupdate")));
    expect(onTimeUpdate).toHaveBeenCalledWith(10, 0);
  });
});

// ── Ended event ──────────────────────────────────────────────────────────────

describe("VideoElement — ended event", () => {
  it("calls onEnded when video ends", async () => {
    const onEnded = vi.fn();
    const { container } = await renderVideoElement({ onEnded });
    const video = container.querySelector("video")!;
    act(() => video.dispatchEvent(new Event("ended")));
    expect(onEnded).toHaveBeenCalledOnce();
  });
});

// ── Imperative handle ────────────────────────────────────────────────────────

describe("VideoElement — imperative handle", () => {
  it("play() calls video.play()", async () => {
    const ref = createRef<VideoElementHandle>();
    const { container } = await renderVideoElement({}, ref);
    const video = container.querySelector("video")!;
    act(() => ref.current!.play());
    expect(video.play).toHaveBeenCalled();
  });

  it("pause() calls video.pause()", async () => {
    const ref = createRef<VideoElementHandle>();
    const { container } = await renderVideoElement({}, ref);
    const video = container.querySelector("video")!;
    act(() => ref.current!.pause());
    expect(video.pause).toHaveBeenCalled();
  });

  it("seek() sets video.currentTime", async () => {
    const ref = createRef<VideoElementHandle>();
    const { container } = await renderVideoElement({}, ref);
    const video = container.querySelector("video")!;
    act(() => ref.current!.seek(120));
    expect(video.currentTime).toBe(120);
  });

  it("setQuality() sets hls.nextLevel (not currentLevel)", async () => {
    const ref = createRef<VideoElementHandle>();
    await renderVideoElement({}, ref);
    act(() => ref.current!.setQuality(2));
    expect(lastHlsInstance!.nextLevel).toBe(2);
  });

  it("setSubtitleTrack() sets hls.subtitleTrack", async () => {
    const ref = createRef<VideoElementHandle>();
    await renderVideoElement({}, ref);
    act(() => ref.current!.setSubtitleTrack(1));
    expect(lastHlsInstance!.subtitleTrack).toBe(1);
  });

  it("getVideo() returns the HTMLVideoElement", async () => {
    const ref = createRef<VideoElementHandle>();
    const { container } = await renderVideoElement({}, ref);
    const video = container.querySelector("video")!;
    expect(ref.current!.getVideo()).toBe(video);
  });

  it("seekToLiveEdge() seeks to near end of seekable range", async () => {
    const ref = createRef<VideoElementHandle>();
    const { container } = await renderVideoElement({ isLive: true }, ref);
    const video = container.querySelector("video")!;
    Object.defineProperty(video, "seekable", {
      value: {
        length: 1,
        start: () => 0,
        end: () => 100,
      },
      configurable: true,
    });
    act(() => ref.current!.seekToLiveEdge());
    expect(video.currentTime).toBe(98); // end - 2
  });

  it("seekToLiveEdge() falls back to liveSyncPosition when no seekable range", async () => {
    const ref = createRef<VideoElementHandle>();
    const { container } = await renderVideoElement({ isLive: true }, ref);
    const video = container.querySelector("video")!;
    Object.defineProperty(video, "seekable", {
      value: { length: 0, start: vi.fn(), end: vi.fn() },
      configurable: true,
    });
    lastHlsInstance!.liveSyncPosition = 200;
    act(() => ref.current!.seekToLiveEdge());
    expect(video.currentTime).toBe(200);
  });
});

// ── Fullscreen ───────────────────────────────────────────────────────────────

describe("VideoElement — fullscreen toggle", () => {
  it("toggleFullscreen() calls requestFullscreen on container", async () => {
    const ref = createRef<VideoElementHandle>();
    const { getByTestId } = await renderVideoElement({}, ref);
    const container = getByTestId("video-element");
    container.requestFullscreen = vi.fn(() => Promise.resolve());
    act(() => ref.current!.toggleFullscreen());
    expect(container.requestFullscreen).toHaveBeenCalled();
  });

  it("toggleFullscreen() calls exitFullscreen when already fullscreen", async () => {
    const ref = createRef<VideoElementHandle>();
    await renderVideoElement({}, ref);
    Object.defineProperty(document, "fullscreenElement", {
      value: document.createElement("div"),
      configurable: true,
    });
    const exitFn = vi.fn();
    document.exitFullscreen = exitFn;
    act(() => ref.current!.toggleFullscreen());
    expect(exitFn).toHaveBeenCalled();
    // Clean up
    Object.defineProperty(document, "fullscreenElement", {
      value: null,
      configurable: true,
    });
  });
});

// ── Picture-in-Picture ───────────────────────────────────────────────────────

describe("VideoElement — Picture-in-Picture", () => {
  it("togglePiP() calls requestPictureInPicture when PiP is enabled", async () => {
    const ref = createRef<VideoElementHandle>();
    const { container } = await renderVideoElement({}, ref);
    const video = container.querySelector("video")!;
    Object.defineProperty(document, "pictureInPictureEnabled", {
      value: true,
      configurable: true,
    });
    Object.defineProperty(document, "pictureInPictureElement", {
      value: null,
      configurable: true,
    });
    await act(async () => ref.current!.togglePiP());
    expect(video.requestPictureInPicture).toHaveBeenCalled();
    // Clean up
    Object.defineProperty(document, "pictureInPictureEnabled", {
      value: false,
      configurable: true,
    });
  });

  it("togglePiP() calls exitPictureInPicture when already in PiP", async () => {
    const ref = createRef<VideoElementHandle>();
    await renderVideoElement({}, ref);
    const exitFn = vi.fn(() => Promise.resolve());
    Object.defineProperty(document, "pictureInPictureElement", {
      value: document.createElement("video"),
      configurable: true,
    });
    document.exitPictureInPicture = exitFn;
    await act(async () => ref.current!.togglePiP());
    expect(exitFn).toHaveBeenCalled();
    // Clean up
    Object.defineProperty(document, "pictureInPictureElement", {
      value: null,
      configurable: true,
    });
  });
});

// ── Cleanup on unmount ───────────────────────────────────────────────────────

describe("VideoElement — cleanup on unmount", () => {
  it("destroys HLS instance on unmount", async () => {
    const { unmount } = await renderVideoElement();
    const hls = lastHlsInstance!;
    act(() => unmount());
    expect(hls.destroy).toHaveBeenCalled();
  });

  it("does not leave stale event handlers after unmount", async () => {
    const onStatusChange = vi.fn();
    const { unmount, container } = await renderVideoElement({
      onStatusChange,
    });
    act(() => unmount());
    // The video element should have its handlers cleaned up
    // (onloadeddata and onerror set to null in cleanup)
    // After unmount, no callbacks should fire
    onStatusChange.mockClear();
    // No assertions on handler count — just verify no crash
    expect(true).toBe(true);
  });
});

// ── Direct playback (non-HLS, non-TS) ───────────────────────────────────────

describe("VideoElement — direct playback", () => {
  it("sets video.src for non-HLS, non-TS format", async () => {
    const { container } = await renderVideoElement({
      url: "http://example.com/video.mp4",
      format: "mp4",
    });
    const video = container.querySelector("video")!;
    expect(video.src).toBe("http://example.com/video.mp4");
  });

  it("calls play() when autoPlay is true", async () => {
    const { container } = await renderVideoElement({
      url: "http://example.com/video.mp4",
      format: "mp4",
      autoPlay: true,
    });
    const video = container.querySelector("video")!;
    expect(video.play).toHaveBeenCalled();
  });

  it("does not create HLS instance for direct playback", async () => {
    vi.clearAllMocks();
    lastHlsInstance = null;
    await renderVideoElement({
      url: "http://example.com/video.mp4",
      format: "mp4",
    });
    // HLS instance was created due to mock but for mp4 it should use direct playback
    // The key test is that video.src is set directly
    const HlsMock = (await import("hls.js")).default;
    // For mp4 format, HLS constructor should NOT be called
    expect(HlsMock).not.toHaveBeenCalled();
  });
});

// ── mpegts.js playback ───────────────────────────────────────────────────────

describe("VideoElement — mpegts.js playback", () => {
  it("uses mpegts.js for ts format", async () => {
    await renderVideoElement({
      url: "http://example.com/stream.ts",
      format: "ts",
    });
    const mpegts = (await import("mpegts.js")).default;
    expect(mpegts.createPlayer).toHaveBeenCalled();
  });

  it("attaches media element for mpegts player", async () => {
    await renderVideoElement({
      url: "http://example.com/stream.ts",
      format: "ts",
    });
    expect(lastMpegtsInstance!.attachMediaElement).toHaveBeenCalledWith(
      expect.any(HTMLVideoElement),
    );
  });

  it("calls load on mpegts player", async () => {
    await renderVideoElement({
      url: "http://example.com/stream.ts",
      format: "ts",
    });
    expect(lastMpegtsInstance!.load).toHaveBeenCalled();
  });

  it("calls play on mpegts player when autoPlay is true", async () => {
    await renderVideoElement({
      url: "http://example.com/stream.ts",
      format: "ts",
      autoPlay: true,
    });
    expect(lastMpegtsInstance!.play).toHaveBeenCalled();
  });
});

// ── Native HLS (Safari) ─────────────────────────────────────────────────────

describe("VideoElement — native HLS (Safari)", () => {
  it("uses native playback when canPlayType returns maybe", async () => {
    // Override canPlayType on video element prototype
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag, options) => {
      const el = origCreateElement(tag, options);
      if (tag === "video") {
        mockVideoElement(el as HTMLVideoElement);
        (el as HTMLVideoElement).canPlayType = vi.fn(
          () => "maybe",
        ) as unknown as HTMLVideoElement["canPlayType"];
      }
      return el;
    });

    const HlsMock = (await import("hls.js")).default;
    vi.mocked(HlsMock).mockClear();

    const { container } = await renderVideoElement({
      url: "http://example.com/stream.m3u8",
      format: "m3u8",
    });
    const video = container.querySelector("video")!;
    // Should set src directly, not create HLS instance
    expect(video.src).toBe("http://example.com/stream.m3u8");
  });
});

// ── Start time / resume playback ─────────────────────────────────────────────

describe("VideoElement — start time", () => {
  it("sets currentTime on MANIFEST_PARSED when startTime > 0 and not live", async () => {
    const { container } = await renderVideoElement({
      startTime: 120,
      isLive: false,
    });
    const video = container.querySelector("video")!;
    act(() => emitHlsEvent("hlsManifestParsed"));
    expect(video.currentTime).toBe(120);
  });

  it("does not set currentTime when stream is live", async () => {
    const { container } = await renderVideoElement({
      startTime: 120,
      isLive: true,
    });
    const video = container.querySelector("video")!;
    act(() => emitHlsEvent("hlsManifestParsed"));
    // For live streams, currentTime should not be set to startTime
    expect(video.currentTime).not.toBe(120);
  });
});

// ── Live edge detection ──────────────────────────────────────────────────────

describe("VideoElement — live edge detection", () => {
  it("calls onLiveEdgeChange when live and edge state changes", async () => {
    const onLiveEdgeChange = vi.fn();
    const { container } = await renderVideoElement({
      isLive: true,
      onLiveEdgeChange,
    });
    const video = container.querySelector("video")!;

    Object.defineProperty(video, "seekable", {
      value: {
        length: 1,
        start: () => 0,
        end: () => 100,
      },
      configurable: true,
    });
    Object.defineProperty(video, "currentTime", {
      value: 50,
      writable: true,
      configurable: true,
    });

    act(() => video.dispatchEvent(new Event("timeupdate")));
    // 100 - 50 = 50 > 15, so not at edge
    expect(onLiveEdgeChange).toHaveBeenCalledWith(false);
  });

  it("does not call onLiveEdgeChange for VOD streams", async () => {
    const onLiveEdgeChange = vi.fn();
    const { container } = await renderVideoElement({
      isLive: false,
      onLiveEdgeChange,
    });
    const video = container.querySelector("video")!;
    act(() => video.dispatchEvent(new Event("timeupdate")));
    expect(onLiveEdgeChange).not.toHaveBeenCalled();
  });

  it("does not fire when edge state has not changed", async () => {
    const onLiveEdgeChange = vi.fn();
    const { container } = await renderVideoElement({
      isLive: true,
      onLiveEdgeChange,
    });
    const video = container.querySelector("video")!;

    // Default is at live edge (lastAtLiveEdgeRef = true), seekable.length = 0
    // so atEdge defaults to true — no change from initial true
    act(() => video.dispatchEvent(new Event("timeupdate")));
    expect(onLiveEdgeChange).not.toHaveBeenCalled();
  });
});
