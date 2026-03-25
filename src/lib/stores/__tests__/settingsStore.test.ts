/**
 * Sprint 6A — settingsStore tests
 *
 * Tests for the Zustand settings store with persist middleware.
 * Written TDD-first before implementation.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "../settingsStore";

// ── Reset store state before each test ────────────────────────────────────────

beforeEach(() => {
  useSettingsStore.setState({
    defaultQuality: "auto",
    defaultSubtitleLang: "",
    autoPlayNextEpisode: true,
    serverUrl: "",
  });
});

// ── Initial state ─────────────────────────────────────────────────────────────

describe("settingsStore — initial state", () => {
  it("has defaultQuality set to auto", () => {
    expect(useSettingsStore.getState().defaultQuality).toBe("auto");
  });

  it("has defaultSubtitleLang set to empty string", () => {
    expect(useSettingsStore.getState().defaultSubtitleLang).toBe("");
  });

  it("has autoPlayNextEpisode set to true", () => {
    expect(useSettingsStore.getState().autoPlayNextEpisode).toBe(true);
  });

  it("has serverUrl set to empty string", () => {
    expect(useSettingsStore.getState().serverUrl).toBe("");
  });
});

// ── setDefaultQuality ─────────────────────────────────────────────────────────

describe("settingsStore — setDefaultQuality", () => {
  it("sets quality to high", () => {
    useSettingsStore.getState().setDefaultQuality("high");
    expect(useSettingsStore.getState().defaultQuality).toBe("high");
  });

  it("sets quality to medium", () => {
    useSettingsStore.getState().setDefaultQuality("medium");
    expect(useSettingsStore.getState().defaultQuality).toBe("medium");
  });

  it("sets quality to low", () => {
    useSettingsStore.getState().setDefaultQuality("low");
    expect(useSettingsStore.getState().defaultQuality).toBe("low");
  });

  it("sets quality back to auto", () => {
    useSettingsStore.getState().setDefaultQuality("high");
    useSettingsStore.getState().setDefaultQuality("auto");
    expect(useSettingsStore.getState().defaultQuality).toBe("auto");
  });
});

// ── setDefaultSubtitleLang ────────────────────────────────────────────────────

describe("settingsStore — setDefaultSubtitleLang", () => {
  it("sets subtitle language", () => {
    useSettingsStore.getState().setDefaultSubtitleLang("en");
    expect(useSettingsStore.getState().defaultSubtitleLang).toBe("en");
  });

  it("sets subtitle language to te (Telugu)", () => {
    useSettingsStore.getState().setDefaultSubtitleLang("te");
    expect(useSettingsStore.getState().defaultSubtitleLang).toBe("te");
  });

  it("clears subtitle language by setting empty string", () => {
    useSettingsStore.getState().setDefaultSubtitleLang("en");
    useSettingsStore.getState().setDefaultSubtitleLang("");
    expect(useSettingsStore.getState().defaultSubtitleLang).toBe("");
  });
});

// ── setAutoPlayNextEpisode ────────────────────────────────────────────────────

describe("settingsStore — setAutoPlayNextEpisode", () => {
  it("disables auto-play", () => {
    useSettingsStore.getState().setAutoPlayNextEpisode(false);
    expect(useSettingsStore.getState().autoPlayNextEpisode).toBe(false);
  });

  it("re-enables auto-play", () => {
    useSettingsStore.getState().setAutoPlayNextEpisode(false);
    useSettingsStore.getState().setAutoPlayNextEpisode(true);
    expect(useSettingsStore.getState().autoPlayNextEpisode).toBe(true);
  });
});

// ── setServerUrl ──────────────────────────────────────────────────────────────

describe("settingsStore — setServerUrl", () => {
  it("sets server URL", () => {
    useSettingsStore.getState().setServerUrl("http://192.168.1.100:3001");
    expect(useSettingsStore.getState().serverUrl).toBe(
      "http://192.168.1.100:3001",
    );
  });

  it("clears server URL", () => {
    useSettingsStore.getState().setServerUrl("http://192.168.1.100:3001");
    useSettingsStore.getState().setServerUrl("");
    expect(useSettingsStore.getState().serverUrl).toBe("");
  });

  it("sets HTTPS server URL", () => {
    useSettingsStore.getState().setServerUrl("https://streamvault.example.com");
    expect(useSettingsStore.getState().serverUrl).toBe(
      "https://streamvault.example.com",
    );
  });
});

// ── resetAll ──────────────────────────────────────────────────────────────────

describe("settingsStore — resetAll", () => {
  it("resets all settings to defaults", () => {
    useSettingsStore.getState().setDefaultQuality("high");
    useSettingsStore.getState().setDefaultSubtitleLang("en");
    useSettingsStore.getState().setAutoPlayNextEpisode(false);
    useSettingsStore.getState().setServerUrl("http://192.168.1.100:3001");

    useSettingsStore.getState().resetAll();

    const state = useSettingsStore.getState();
    expect(state.defaultQuality).toBe("auto");
    expect(state.defaultSubtitleLang).toBe("");
    expect(state.autoPlayNextEpisode).toBe(true);
    expect(state.serverUrl).toBe("");
  });

  it("resetAll is idempotent when already at defaults", () => {
    useSettingsStore.getState().resetAll();
    const state = useSettingsStore.getState();
    expect(state.defaultQuality).toBe("auto");
    expect(state.defaultSubtitleLang).toBe("");
    expect(state.autoPlayNextEpisode).toBe(true);
    expect(state.serverUrl).toBe("");
  });
});

// ── independent state fields ──────────────────────────────────────────────────

describe("settingsStore — field independence", () => {
  it("setting quality does not change other fields", () => {
    useSettingsStore.getState().setDefaultSubtitleLang("en");
    useSettingsStore.getState().setAutoPlayNextEpisode(false);
    useSettingsStore.getState().setDefaultQuality("high");

    const state = useSettingsStore.getState();
    expect(state.defaultSubtitleLang).toBe("en");
    expect(state.autoPlayNextEpisode).toBe(false);
  });

  it("setting serverUrl does not change quality", () => {
    useSettingsStore.getState().setDefaultQuality("medium");
    useSettingsStore.getState().setServerUrl("http://192.168.1.1:3001");

    expect(useSettingsStore.getState().defaultQuality).toBe("medium");
  });
});
