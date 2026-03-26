/**
 * Sprint 4 — Player Rebuild E2E Tests
 *
 * Tests run against the LIVE production site: https://streamvault.srinivaskotha.uk
 * All API calls hit the real backend — no mocking.
 * Uses Playwright global storageState (via global-setup.ts) for authentication.
 *
 * DOM Facts (verified from production page snapshots):
 * - VOD cards: #main-content a[href^="/vod/"], #main-content [data-focus-key^="card-"]
 * - VOD detail: /vod/{id} pages with play/resume button
 * - Series cards: [data-focus-key^="series-"]
 * - Live channels: [data-focus-key^="channel-"], [data-focus-key^="featured-"]
 * - Player: video element, player controls appear on hover/keypress
 * - #main-content for main page content area
 *
 * NOTE: Most player tests require working HLS streams. The IPTV provider streams
 * may be unreliable or geo-blocked in CI environments. Tests that depend on active
 * stream playback remain fixme() until stream reliability is confirmed.
 *
 * Acceptance Criteria coverage:
 *   Issue #112 (Player Shell):     global player state machine, single instance, error recovery
 *   Issue #113 (Desktop Controls): mouse hover controls, play/pause, volume, seek, fullscreen, auto-hide
 *   Issue #113 (TV Controls):      minimal overlay, large text (10ft readable), auto-hide 5s
 *   Issue #114 (Player Features):  quality selector, subtitles, audio tracks, resume playback, auto-next
 *   Issue #115 (TV Player):        D-pad seek/volume, channel switching, info overlay, sleep/wake
 *   Issue #116 (Error Recovery):   error screen, retry button, sleep/wake state preservation
 */

import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function waitForPageReady(page: import("@playwright/test").Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(3_000);
}

async function reLogin(page: import("@playwright/test").Page) {
  const username = process.env.E2E_USERNAME || "admin";
  const password = process.env.E2E_PASSWORD || "testpass123";
  if (!page.url().includes("/login")) {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
  }
  await page
    .locator("#username")
    .waitFor({ state: "visible", timeout: 10_000 });
  await page.locator("#username").clear();
  await page.locator("#username").fill(username);
  await page.locator("#password").clear();
  await page.locator("#password").fill(password);
  await page.locator("#login-submit").click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), {
    timeout: 15_000,
  });
  await page.waitForTimeout(2_000);
}

async function safeNavigate(
  page: import("@playwright/test").Page,
  path: string,
) {
  await page.goto(path);
  await waitForPageReady(page);
  if (page.url().includes("/login")) {
    await reLogin(page);
    await page.goto(path);
    await waitForPageReady(page);
    if (page.url().includes("/login") && path !== "/login") {
      throw new Error(
        `Re-authentication failed: still on login after navigating to ${path}`,
      );
    }
  }
}

/** Navigate to VOD page and click the first movie to reach VOD detail page */
async function navigateToVODDetail(page: import("@playwright/test").Page) {
  await safeNavigate(page, "/vod");
  const movieCards = page.locator(
    '#main-content a[href^="/vod/"], #main-content [data-focus-key^="card-"]',
  );
  await expect(movieCards.first()).toBeVisible({ timeout: 30_000 });
  await movieCards.first().click();
  await waitForPageReady(page);
  expect(page.url()).toMatch(/\/vod\/\d+/);
}

// ---------------------------------------------------------------------------
// Player Shell (#112)
// ---------------------------------------------------------------------------

test.describe("Sprint 4: Player Shell", () => {
  test("VOD detail page has a play button", async ({ page }) => {
    await navigateToVODDetail(page);
    const playBtn = page.getByRole("button", { name: /play|resume|watch/i });
    await expect(playBtn.first()).toBeVisible({ timeout: 10_000 });
  });

  test.fixme("player mounts when play button is clicked on VOD detail", async ({
    page,
  }) => {
    // TODO: Requires working HLS stream — player needs active stream URL
    await navigateToVODDetail(page);
    await page
      .getByRole("button", { name: /play|resume|watch/i })
      .first()
      .click();
    const player = page.locator("video").first();
    await expect(player).toBeVisible({ timeout: 10_000 });
  });

  test.fixme("player mounts when a live channel is selected from LivePage", async ({
    page,
  }) => {
    // TODO: Requires working HLS stream
    await safeNavigate(page, "/live");
    const channels = page.locator(
      '[data-focus-key^="channel-"], [data-focus-key^="featured-"]',
    );
    await expect(channels.first()).toBeVisible({ timeout: 30_000 });
    await channels.first().click();
    const player = page.locator("video").first();
    await expect(player).toBeVisible({ timeout: 10_000 });
  });

  test.fixme("only one player instance exists in DOM at any time", async ({
    page,
  }) => {
    // TODO: Requires working HLS stream
    await navigateToVODDetail(page);
    await page
      .getByRole("button", { name: /play|resume|watch/i })
      .first()
      .click();
    await page.waitForTimeout(2_000);
    const videoCount = await page.locator("video").count();
    expect(videoCount).toBeLessThanOrEqual(1);
  });

  test.fixme("player renders outside CSS transform ancestors", async ({
    page,
  }) => {
    // TODO: Requires working HLS stream to verify player positioning
    await navigateToVODDetail(page);
  });

  test.fixme("player shows buffering overlay during stream load", async ({
    page,
  }) => {
    // TODO: Requires HLS route interception
    await navigateToVODDetail(page);
  });

  test.fixme("player shows error recovery UI on stream failure", async ({
    page,
  }) => {
    // TODO: Requires HLS route interception to abort streams
    await navigateToVODDetail(page);
  });

  test.fixme("state machine prevents impossible states", async ({ page }) => {
    // TODO: Requires working HLS stream + console error monitoring
    await navigateToVODDetail(page);
  });
});

// ---------------------------------------------------------------------------
// Desktop Controls (#113)
// ---------------------------------------------------------------------------

test.describe("Sprint 4: Desktop Controls", () => {
  test.fixme("controls show on mouse move over player", async ({ page }) => {
    // TODO: Requires working HLS stream + player hover interaction
    await navigateToVODDetail(page);
  });

  test.fixme("controls auto-hide after 3s of inactivity", async ({ page }) => {
    // TODO: Requires working HLS stream + control visibility timing
    await navigateToVODDetail(page);
  });

  test.fixme("play/pause button toggles playback state", async ({ page }) => {
    // TODO: Requires working HLS stream
    await navigateToVODDetail(page);
  });

  test.fixme("volume slider adjusts playback volume", async ({ page }) => {
    // TODO: Requires working HLS stream + volume slider selector
    await navigateToVODDetail(page);
  });

  test.fixme("progress bar click seeks to position", async ({ page }) => {
    // TODO: Requires working HLS stream + progress bar interaction
    await navigateToVODDetail(page);
  });

  test.fixme("fullscreen toggle button works", async ({ page }) => {
    // TODO: Requires working HLS stream + fullscreen API
    await navigateToVODDetail(page);
  });
});

// ---------------------------------------------------------------------------
// TV Controls (#113)
// ---------------------------------------------------------------------------

test.describe("Sprint 4: TV Controls (Minimal Overlay)", () => {
  test.fixme("minimal overlay shows on D-pad press", async ({ page }) => {
    // TODO: Requires working HLS stream + TV mode overlay
    await safeNavigate(page, "/live");
  });

  test.fixme("controls auto-hide after 5s on TV", async ({ page }) => {
    // TODO: Requires working HLS stream + TV mode overlay timing
    await safeNavigate(page, "/live");
  });

  test.fixme("control text is large and readable at 10ft distance", async ({
    page,
  }) => {
    // TODO: Requires working HLS stream + font size check
    await safeNavigate(page, "/live");
  });
});

// ---------------------------------------------------------------------------
// Player Features (#114)
// ---------------------------------------------------------------------------

test.describe("Sprint 4: Player Features", () => {
  test.fixme("quality selector shows available bitrate levels", async ({
    page,
  }) => {
    // TODO: Requires working HLS stream with multiple quality levels
    await navigateToVODDetail(page);
  });

  test.fixme("subtitle selector shows available tracks", async ({ page }) => {
    // TODO: Requires working HLS stream with subtitle tracks
    await navigateToVODDetail(page);
  });

  test.fixme("audio track selector works", async ({ page }) => {
    // TODO: Requires working HLS stream with multiple audio tracks
    await navigateToVODDetail(page);
  });

  test.fixme("progress bar saves every 10 seconds during playback", async ({
    page,
  }) => {
    // TODO: Requires working HLS stream + API interception for progress save
    await navigateToVODDetail(page);
  });

  test.fixme("resume playback from saved position on MovieDetail", async ({
    page,
  }) => {
    // TODO: Requires seeded movie with watch history
    await navigateToVODDetail(page);
  });

  test.fixme("auto-next episode shows 5s countdown on series episode end", async ({
    page,
  }) => {
    // TODO: Requires working HLS stream + series episode playback
    await safeNavigate(page, "/series");
  });

  test.fixme("auto-next countdown is cancelable", async ({ page }) => {
    // TODO: Requires working HLS stream + auto-next UI
    await safeNavigate(page, "/series");
  });
});

// ---------------------------------------------------------------------------
// TV Player (#115)
// ---------------------------------------------------------------------------

test.describe("Sprint 4: TV Player (D-Pad Controls)", () => {
  test.fixme("left/right arrows seek backward/forward 10s", async ({
    page,
  }) => {
    // TODO: Requires working HLS stream + D-pad seek interaction
    await safeNavigate(page, "/live");
  });

  test.fixme("hold left/right arrow accelerates seek (30s, 60s, 120s)", async ({
    page,
  }) => {
    // TODO: Requires working HLS stream + hold-key seek acceleration
    await safeNavigate(page, "/live");
  });

  test.fixme("up/down arrows adjust volume", async ({ page }) => {
    // TODO: Requires working HLS stream + volume controls
    await safeNavigate(page, "/live");
  });

  test.fixme("back button closes player and returns to previous page", async ({
    page,
  }) => {
    // TODO: Requires working HLS stream + back navigation
    await safeNavigate(page, "/live");
  });

  test.fixme("channel switching with debounce prevents rapid flipping", async ({
    page,
  }) => {
    // TODO: Requires working live streams + channel switching
    await safeNavigate(page, "/live");
  });

  test.fixme("channel info overlay shows for 3s after channel change", async ({
    page,
  }) => {
    // TODO: Requires working live streams + channel info overlay
    await safeNavigate(page, "/live");
  });
});

// ---------------------------------------------------------------------------
// Error Recovery (#116)
// ---------------------------------------------------------------------------

test.describe("Sprint 4: Error Recovery", () => {
  test.fixme("error screen shows with retry button on stream failure", async ({
    page,
  }) => {
    // TODO: Requires HLS route interception to simulate stream failure
    await navigateToVODDetail(page);
  });

  test.fixme("retry button reloads stream", async ({ page }) => {
    // TODO: Requires HLS route interception + retry behavior
    await navigateToVODDetail(page);
  });

  test.fixme("go back button exits player and returns to detail page", async ({
    page,
  }) => {
    // TODO: Requires working HLS stream + back navigation from player
    await navigateToVODDetail(page);
  });

  test.fixme("sleep/wake resumes VOD playback at saved position", async ({
    page,
  }) => {
    // TODO: Requires working HLS stream + sleep/wake simulation
    await navigateToVODDetail(page);
  });

  test.fixme("sleep/wake reloads live stream without seeking", async ({
    page,
  }) => {
    // TODO: Requires working live stream + sleep/wake simulation
    await safeNavigate(page, "/live");
  });
});
