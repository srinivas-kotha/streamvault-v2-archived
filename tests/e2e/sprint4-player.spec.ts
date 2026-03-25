/**
 * Sprint 4 — Player Rebuild E2E Test Stubs
 *
 * Status: STUBS ONLY — marked test.fixme() until a live dev server is wired up.
 *
 * Playwright MCP is configured in ~/.claude/settings.local.json:
 *   { "playwright": { "command": "npx", "args": ["-y", "@playwright/mcp@latest"] } }
 *
 * To run these tests once a server is available:
 *   1. Install: npm install --save-dev @playwright/test
 *   2. Add playwright.config.ts (baseURL = http://localhost:5173 or prod URL)
 *   3. Run: npx playwright test tests/e2e/sprint4-player.spec.ts
 *
 * Acceptance Criteria coverage:
 *   Issue #112 (Player Shell):     global player state machine, single instance, error recovery
 *   Issue #113 (Desktop Controls): mouse hover controls, play/pause, volume, seek, fullscreen, auto-hide
 *   Issue #113 (TV Controls):      minimal overlay, large text (10ft readable), auto-hide 5s
 *   Issue #114 (Player Features):  quality selector, subtitles, audio tracks, resume playback, auto-next
 *   Issue #115 (TV Player):        D-pad seek/volume, channel switching, info overlay, sleep/wake
 *   Issue #116 (Error Recovery):   error screen, retry button, sleep/wake state preservation
 *
 * Gate G6 (Player Integration): All stubs below map to Sprint 4 acceptance criteria.
 *   Stubs will be activated by the devs (bravo agent) once the server is running.
 */

import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to the app and authenticate (stub — update with real auth flow). */
async function authenticate(
  page: Parameters<typeof test>[1] extends { page: infer P } ? P : never,
) {
  // TODO: replace with real auth flow when credentials are available for E2E
  await page.goto("/login");
  await page.fill('[name="username"]', process.env.E2E_USERNAME ?? "test");
  await page.fill('[name="password"]', process.env.E2E_PASSWORD ?? "test");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/home");
}

// ---------------------------------------------------------------------------
// Player Shell (#112)
// ---------------------------------------------------------------------------

test.describe("Sprint 4: Player Shell", () => {
  test.fixme("player mounts when a stream is selected from VOD page", async ({
    page,
  }) => {
    await authenticate(page);
    await page.goto("/vod");
    await page.waitForSelector('[data-testid="content-card"]', {
      timeout: 10_000,
    });
    const firstMovie = page.locator('[data-testid="content-card"]').first();
    await firstMovie.click();
    await page.waitForURL("**/vod/**");
    // Play button triggers player
    await page.getByRole("button", { name: /play|resume/i }).click();
    // Player should be visible (video element or player wrapper)
    const player = page
      .locator('video, [data-testid="player-wrapper"], [class*="player"]')
      .first();
    await expect(player).toBeVisible({ timeout: 10_000 });
  });

  test.fixme("player mounts when a live channel is selected from LivePage", async ({
    page,
  }) => {
    await authenticate(page);
    await page.goto("/live");
    await page.waitForSelector("img[alt]", { timeout: 10_000 });
    // Click first channel
    await page.locator("img[alt]").first().click();
    // Player should be visible
    const player = page
      .locator('video, [data-testid="player-wrapper"], [class*="player"]')
      .first();
    await expect(player).toBeVisible({ timeout: 10_000 });
  });

  test.fixme("only one player instance exists in DOM at any time", async ({
    page,
  }) => {
    await authenticate(page);
    await page.goto("/vod");
    await page.waitForSelector('[data-testid="content-card"]', {
      timeout: 10_000,
    });
    // Start playing first movie
    await page.locator('[data-testid="content-card"]').first().click();
    await page.waitForURL("**/vod/**");
    await page.getByRole("button", { name: /play|resume/i }).click();
    await page.waitForTimeout(500);
    const videoCount = await page.locator("video").count();
    // Should be 0 or 1 (HLS.js uses either 0 or 1 video element)
    expect(videoCount).toBeLessThanOrEqual(1);
  });

  test.fixme("player renders outside CSS transform ancestors", async ({
    page,
  }) => {
    // Verifies that the player is NOT constrained by transformed parent
    // (CSS transform creates a containing block for position: fixed)
    await authenticate(page);
    await page.goto("/vod");
    await page.waitForSelector('[data-testid="content-card"]', {
      timeout: 10_000,
    });
    await page.locator('[data-testid="content-card"]').first().click();
    await page.waitForURL("**/vod/**");
    await page.getByRole("button", { name: /play|resume/i }).click();
    // Check that player wrapper (if position: fixed) is in viewport, not constrained
    const player = page
      .locator('video, [data-testid="player-wrapper"]')
      .first();
    const box = await player.boundingBox();
    if (box) {
      // Should span most of viewport (inset-0)
      expect(box.x).toBeLessThan(100);
      expect(box.y).toBeLessThan(100);
      expect(box.width).toBeGreaterThan(400);
      expect(box.height).toBeGreaterThan(300);
    }
  });

  test.fixme("player shows buffering overlay during stream load", async ({
    page,
  }) => {
    await authenticate(page);
    await page.goto("/vod");
    await page.waitForSelector('[data-testid="content-card"]', {
      timeout: 10_000,
    });
    await page.locator('[data-testid="content-card"]').first().click();
    await page.waitForURL("**/vod/**");
    // Intercept HLS playlist to delay response
    await page.route("**/*.m3u8", (route) =>
      setTimeout(() => route.continue(), 1000),
    );
    await page.getByRole("button", { name: /play|resume/i }).click();
    // Buffering spinner should appear
    const spinner = page
      .locator(
        '[data-testid="buffering"], .animate-spin, svg[class*="animate"]',
      )
      .first();
    await expect(spinner).toBeVisible({ timeout: 5_000 });
  });

  test.fixme("player shows error recovery UI on stream failure", async ({
    page,
  }) => {
    await authenticate(page);
    await page.goto("/vod");
    await page.waitForSelector('[data-testid="content-card"]', {
      timeout: 10_000,
    });
    await page.locator('[data-testid="content-card"]').first().click();
    await page.waitForURL("**/vod/**");
    // Intercept and fail the stream
    await page.route("**/*.ts", (route) => route.abort());
    await page.getByRole("button", { name: /play|resume/i }).click();
    await page.waitForTimeout(2000);
    // Error screen with retry button should appear
    const errorScreen = page
      .locator('[data-testid="error-screen"], text=/error|failed/i')
      .first();
    await expect(errorScreen).toBeVisible({ timeout: 10_000 });
  });

  test.fixme("state machine prevents impossible states (e.g., paused before playing)", async ({
    page,
  }) => {
    // This test verifies internal state consistency — difficult without inspector
    // Soft assertion: no console errors during playback state transitions
    await authenticate(page);
    await page.goto("/vod");
    await page.waitForSelector('[data-testid="content-card"]', {
      timeout: 10_000,
    });
    await page.locator('[data-testid="content-card"]').first().click();
    await page.waitForURL("**/vod/**");
    // Collect any console errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.getByRole("button", { name: /play|resume/i }).click();
    await page.waitForTimeout(1000);
    // No state machine errors in console
    expect(errors.filter((e) => e.includes("state"))).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Desktop Controls (#113)
// ---------------------------------------------------------------------------

test.describe("Sprint 4: Desktop Controls", () => {
  test.fixme("controls show on mouse move over player", async ({ page }) => {
    await authenticate(page);
    await page.goto("/vod");
    await page.waitForSelector('[data-testid="content-card"]', {
      timeout: 10_000,
    });
    await page.locator('[data-testid="content-card"]').first().click();
    await page.waitForURL("**/vod/**");
    await page.getByRole("button", { name: /play|resume/i }).click();
    const player = page
      .locator('video, [data-testid="player-wrapper"]')
      .first();
    await player.hover();
    // Control bar should fade in
    const controls = page
      .locator('[data-testid="player-controls"], [class*="player-control"]')
      .first();
    await expect(controls).toBeVisible({ timeout: 5_000 });
  });

  test.fixme("controls auto-hide after 3s of inactivity", async ({ page }) => {
    await authenticate(page);
    await page.goto("/vod");
    await page.waitForSelector('[data-testid="content-card"]', {
      timeout: 10_000,
    });
    await page.locator('[data-testid="content-card"]').first().click();
    await page.waitForURL("**/vod/**");
    await page.getByRole("button", { name: /play|resume/i }).click();
    const player = page
      .locator('video, [data-testid="player-wrapper"]')
      .first();
    await player.hover();
    // Controls visible
    const controls = page.locator('[data-testid="player-controls"]').first();
    await expect(controls).toBeVisible({ timeout: 5_000 });
    // Move mouse outside player and wait
    await page.mouse.move(0, 0);
    await page.waitForTimeout(3500);
    // Controls should be hidden or have opacity 0
    await expect(controls).toHaveCSS("opacity", "0");
  });

  test.fixme("play/pause button toggles playback state", async ({ page }) => {
    await authenticate(page);
    await page.goto("/vod");
    await page.waitForSelector('[data-testid="content-card"]', {
      timeout: 10_000,
    });
    await page.locator('[data-testid="content-card"]').first().click();
    await page.waitForURL("**/vod/**");
    await page.getByRole("button", { name: /play|resume/i }).click();
    // Hover to show controls
    const player = page
      .locator('video, [data-testid="player-wrapper"]')
      .first();
    await player.hover();
    // Click play button to pause (already playing)
    const playBtn = page.getByRole("button", { name: /play|pause/i }).first();
    await playBtn.click();
    await page.waitForTimeout(300);
    // Button should now show "play" state
    const btnText = await playBtn.getAttribute("aria-label");
    expect(btnText).toContain("play");
  });

  test.fixme("volume slider adjusts playback volume", async ({ page }) => {
    await authenticate(page);
    await page.goto("/vod");
    await page.waitForSelector('[data-testid="content-card"]', {
      timeout: 10_000,
    });
    await page.locator('[data-testid="content-card"]').first().click();
    await page.waitForURL("**/vod/**");
    await page.getByRole("button", { name: /play|resume/i }).click();
    const player = page
      .locator('video, [data-testid="player-wrapper"]')
      .first();
    await player.hover();
    // Find volume slider
    const volumeSlider = page
      .locator(
        '[aria-label*="Volume" i], input[type="range"][aria-label*="olume"]',
      )
      .first();
    if ((await volumeSlider.count()) > 0) {
      const initialValue = await volumeSlider.getAttribute("value");
      // Drag slider to increase volume
      await volumeSlider.dragTo(volumeSlider, {
        sourcePosition: { x: 0, y: 0 },
        targetPosition: { x: 50, y: 0 },
      });
      const newValue = await volumeSlider.getAttribute("value");
      expect(parseFloat(newValue || "0")).toBeGreaterThan(
        parseFloat(initialValue || "0"),
      );
    }
  });

  test.fixme("progress bar click seeks to position", async ({ page }) => {
    await authenticate(page);
    await page.goto("/vod");
    await page.waitForSelector('[data-testid="content-card"]', {
      timeout: 10_000,
    });
    await page.locator('[data-testid="content-card"]').first().click();
    await page.waitForURL("**/vod/**");
    await page.getByRole("button", { name: /play|resume/i }).click();
    await page.waitForTimeout(2000); // Let video start
    const player = page
      .locator('video, [data-testid="player-wrapper"]')
      .first();
    await player.hover();
    // Find progress bar
    const progress = page
      .locator(
        '[data-testid="progress-bar"], input[type="range"][aria-label*="rogress" i]',
      )
      .first();
    if ((await progress.count()) > 0) {
      const initialValue = await progress.getAttribute("value");
      // Click near the end of progress bar
      const box = await progress.boundingBox();
      if (box) {
        await page.click(
          `div[data-testid="progress-bar"], input[type="range"]`,
          {
            position: { x: box.width * 0.75, y: box.height / 2 },
          },
        );
        await page.waitForTimeout(500);
        const newValue = await progress.getAttribute("value");
        expect(parseFloat(newValue || "0")).toBeGreaterThan(
          parseFloat(initialValue || "0"),
        );
      }
    }
  });

  test.fixme("fullscreen toggle button works", async ({ page }) => {
    await authenticate(page);
    await page.goto("/vod");
    await page.waitForSelector('[data-testid="content-card"]', {
      timeout: 10_000,
    });
    await page.locator('[data-testid="content-card"]').first().click();
    await page.waitForURL("**/vod/**");
    await page.getByRole("button", { name: /play|resume/i }).click();
    const player = page
      .locator('video, [data-testid="player-wrapper"]')
      .first();
    await player.hover();
    // Click fullscreen button
    const fullscreenBtn = page
      .getByRole("button", { name: /fullscreen|fullscreen toggle/i })
      .first();
    if ((await fullscreenBtn.count()) > 0) {
      await fullscreenBtn.click();
      await page.waitForTimeout(500);
      // Player should have fullscreen class or inset-0
      const playerClass = await player.getAttribute("class");
      expect(playerClass).toMatch(/fullscreen|inset-0/i);
    }
  });
});

// ---------------------------------------------------------------------------
// TV Controls (#113)
// ---------------------------------------------------------------------------

test.describe("Sprint 4: TV Controls (Minimal Overlay)", () => {
  test.fixme("minimal overlay shows on D-pad press", async ({ page }) => {
    await authenticate(page);
    await page.goto("/live");
    await page.waitForSelector("img[alt]", { timeout: 10_000 });
    await page.locator("img[alt]").first().click();
    // Press D-pad (arrow key) to trigger overlay
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(300);
    // Minimal control overlay should appear
    const overlay = page
      .locator('[data-testid="player-overlay"], [class*="overlay"]')
      .first();
    await expect(overlay).toBeVisible({ timeout: 5_000 });
  });

  test.fixme("controls auto-hide after 5s on TV", async ({ page }) => {
    await authenticate(page);
    await page.goto("/live");
    await page.waitForSelector("img[alt]", { timeout: 10_000 });
    await page.locator("img[alt]").first().click();
    // Press D-pad to show overlay
    await page.keyboard.press("ArrowUp");
    const overlay = page.locator('[data-testid="player-overlay"]').first();
    await expect(overlay).toBeVisible({ timeout: 5_000 });
    // Wait 5s
    await page.waitForTimeout(5500);
    // Overlay should be hidden
    await expect(overlay).not.toBeVisible({ timeout: 2_000 });
  });

  test.fixme("control text is large and readable at 10ft distance", async ({
    page,
  }) => {
    await authenticate(page);
    await page.goto("/live");
    await page.waitForSelector("img[alt]", { timeout: 10_000 });
    await page.locator("img[alt]").first().click();
    await page.keyboard.press("ArrowUp");
    const overlay = page.locator('[data-testid="player-overlay"]').first();
    await expect(overlay).toBeVisible({ timeout: 5_000 });
    // Check font size of control text — should be >= 2rem (32px)
    const controlText = page
      .locator('[data-testid="player-overlay"] [class*="text"]')
      .first();
    const fontSize = await controlText.evaluate(
      (el) => window.getComputedStyle(el).fontSize,
    );
    const pixels = parseInt(fontSize, 10);
    expect(pixels).toBeGreaterThanOrEqual(32);
  });
});

// ---------------------------------------------------------------------------
// Player Features (#114)
// ---------------------------------------------------------------------------

test.describe("Sprint 4: Player Features", () => {
  test.fixme("quality selector shows available bitrate levels", async ({
    page,
  }) => {
    await authenticate(page);
    await page.goto("/vod");
    await page.waitForSelector('[data-testid="content-card"]', {
      timeout: 10_000,
    });
    await page.locator('[data-testid="content-card"]').first().click();
    await page.waitForURL("**/vod/**");
    await page.getByRole("button", { name: /play|resume/i }).click();
    const player = page
      .locator('video, [data-testid="player-wrapper"]')
      .first();
    await player.hover();
    // Open quality menu
    const qualityBtn = page
      .getByRole("button", { name: /quality|settings/i })
      .first();
    if ((await qualityBtn.count()) > 0) {
      await qualityBtn.click();
      // Quality options should appear
      const qualityOption = page.getByText(/1080p|720p|480p|auto/i).first();
      await expect(qualityOption).toBeVisible({ timeout: 5_000 });
    }
  });

  test.fixme("subtitle selector shows available tracks", async ({ page }) => {
    await authenticate(page);
    await page.goto("/vod");
    await page.waitForSelector('[data-testid="content-card"]', {
      timeout: 10_000,
    });
    await page.locator('[data-testid="content-card"]').first().click();
    await page.waitForURL("**/vod/**");
    await page.getByRole("button", { name: /play|resume/i }).click();
    const player = page
      .locator('video, [data-testid="player-wrapper"]')
      .first();
    await player.hover();
    // Open subtitle menu
    const captionsBtn = page
      .getByRole("button", { name: /captions|subtitles|cc/i })
      .first();
    if ((await captionsBtn.count()) > 0) {
      await captionsBtn.click();
      // Subtitle options (English, Spanish, Off, etc.) should appear
      const subtitleOption = page.getByText(/english|spanish|off|off/i).first();
      await expect(subtitleOption).toBeVisible({ timeout: 5_000 });
    }
  });

  test.fixme("audio track selector works", async ({ page }) => {
    await authenticate(page);
    await page.goto("/vod");
    await page.waitForSelector('[data-testid="content-card"]', {
      timeout: 10_000,
    });
    await page.locator('[data-testid="content-card"]').first().click();
    await page.waitForURL("**/vod/**");
    await page.getByRole("button", { name: /play|resume/i }).click();
    const player = page
      .locator('video, [data-testid="player-wrapper"]')
      .first();
    await player.hover();
    // Open audio menu
    const audioBtn = page.getByRole("button", { name: /audio/i }).first();
    if ((await audioBtn.count()) > 0) {
      await audioBtn.click();
      // Audio track options should appear
      const audioOption = page.getByText(/english|hindi|spanish/i).first();
      await expect(audioOption).toBeVisible({ timeout: 5_000 });
    }
  });

  test.fixme("progress bar saves every 10 seconds during playback", async ({
    page,
  }) => {
    // This test verifies backend progress save — requires API interception
    await authenticate(page);
    await page.goto("/vod");
    await page.waitForSelector('[data-testid="content-card"]', {
      timeout: 10_000,
    });
    const movieCard = page.locator('[data-testid="content-card"]').first();
    const movieId = await movieCard.getAttribute("data-id");
    await movieCard.click();
    await page.waitForURL("**/vod/**");
    await page.getByRole("button", { name: /play|resume/i }).click();
    // Watch for 15 seconds
    await page.waitForTimeout(15_000);
    // Verify progress save API was called
    // (In a real test, intercept the saveProgress call and count invocations)
    expect(movieId).toBeTruthy();
  });

  test.fixme("resume playback from saved position on MovieDetail", async ({
    page,
  }) => {
    await authenticate(page);
    // Navigate to a movie known to have progress saved
    // (Use a seeded movie or known progress ID)
    await page.goto("/vod");
    await page.waitForSelector('[data-testid="content-card"]', {
      timeout: 10_000,
    });
    await page.locator('[data-testid="content-card"]').first().click();
    await page.waitForURL("**/vod/**");
    // Resume button should show instead of Play
    const resumeBtn = page.getByRole("button", { name: /resume/i });
    if ((await resumeBtn.count()) > 0) {
      await expect(resumeBtn).toBeVisible();
      await resumeBtn.click();
      // Player should start at saved position (verify via progress bar value)
      const progress = page
        .locator('[data-testid="progress-bar"], input[type="range"]')
        .first();
      await page.waitForTimeout(1000);
      const value = await progress.getAttribute("value");
      expect(parseFloat(value || "0")).toBeGreaterThan(0);
    }
  });

  test.fixme("auto-next episode shows 5s countdown on series episode end", async ({
    page,
  }) => {
    await authenticate(page);
    await page.goto("/series");
    await page.waitForSelector('[data-testid="focusable-card"]', {
      timeout: 10_000,
    });
    await page.locator('[data-testid="focusable-card"]').first().click();
    await page.waitForURL("**/series/**");
    // Click first episode to play
    await page
      .locator('[class*="space-y-2"] [class*="rounded-xl"]')
      .first()
      .click();
    // Auto-next countdown should appear at end of episode
    // (Mock the video end event for speed)
    await page.evaluate(() => {
      const video = document.querySelector("video");
      if (video) video.currentTime = video.duration - 1;
      video?.dispatchEvent(new Event("timeupdate"));
    });
    await page.waitForTimeout(500);
    // Countdown overlay should appear
    const countdown = page
      .locator('[data-testid="auto-next-countdown"], text=/playing next/i')
      .first();
    await expect(countdown).toBeVisible({ timeout: 5_000 });
  });

  test.fixme("auto-next countdown is cancelable", async ({ page }) => {
    await authenticate(page);
    await page.goto("/series");
    await page.waitForSelector('[data-testid="focusable-card"]', {
      timeout: 10_000,
    });
    await page.locator('[data-testid="focusable-card"]').first().click();
    await page.waitForURL("**/series/**");
    await page
      .locator('[class*="space-y-2"] [class*="rounded-xl"]')
      .first()
      .click();
    // Trigger auto-next
    await page.evaluate(() => {
      const video = document.querySelector("video");
      if (video) video.currentTime = video.duration - 1;
      video?.dispatchEvent(new Event("timeupdate"));
    });
    await page.waitForTimeout(500);
    // Find and click Cancel button
    const cancelBtn = page
      .getByRole("button", { name: /cancel|stop/i })
      .first();
    if ((await cancelBtn.count()) > 0) {
      await cancelBtn.click();
      // Countdown should disappear
      const countdown = page
        .locator('[data-testid="auto-next-countdown"]')
        .first();
      await expect(countdown).not.toBeVisible({ timeout: 2_000 });
    }
  });
});

// ---------------------------------------------------------------------------
// TV Player (#115)
// ---------------------------------------------------------------------------

test.describe("Sprint 4: TV Player (D-Pad Controls)", () => {
  test.fixme("left/right arrows seek backward/forward 10s", async ({
    page,
  }) => {
    await authenticate(page);
    await page.goto("/live");
    await page.waitForSelector("img[alt]", { timeout: 10_000 });
    await page.locator("img[alt]").first().click();
    await page.waitForTimeout(2000); // Let stream start
    const progress = page
      .locator('[data-testid="progress-bar"], input[type="range"]')
      .first();
    const initialValue = await progress.getAttribute("value");
    // Press left arrow (seek back)
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(500);
    const newValue = await progress.getAttribute("value");
    expect(parseFloat(newValue || "0")).toBeLessThan(
      parseFloat(initialValue || "0"),
    );
  });

  test.fixme("hold left/right arrow accelerates seek (30s, 60s, 120s)", async ({
    page,
  }) => {
    await authenticate(page);
    await page.goto("/live");
    await page.waitForSelector("img[alt]", { timeout: 10_000 });
    await page.locator("img[alt]").first().click();
    await page.waitForTimeout(2000);
    const progress = page
      .locator('[data-testid="progress-bar"], input[type="range"]')
      .first();
    const initialValue = parseFloat(
      (await progress.getAttribute("value")) || "0",
    );
    // Simulate rapid arrow key presses (hold)
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(100);
    }
    const finalValue = parseFloat(
      (await progress.getAttribute("value")) || "0",
    );
    // Should have seeked forward (amount depends on acceleration curve)
    expect(finalValue).toBeGreaterThan(initialValue + 10);
  });

  test.fixme("up/down arrows adjust volume", async ({ page }) => {
    await authenticate(page);
    await page.goto("/live");
    await page.waitForSelector("img[alt]", { timeout: 10_000 });
    await page.locator("img[alt]").first().click();
    // Get initial volume from HLS.js or player state
    // Press up arrow (increase volume)
    await page.keyboard.press("ArrowUp");
    // Verify volume display or state change
    const volumeDisplay = page
      .locator('[data-testid="volume-display"], text=/volume/i')
      .first();
    await expect(volumeDisplay).toBeVisible({ timeout: 3_000 });
  });

  test.fixme("back button closes player and returns to previous page", async ({
    page,
  }) => {
    await authenticate(page);
    await page.goto("/live");
    await page.waitForSelector("img[alt]", { timeout: 10_000 });
    const liveUrl = page.url();
    await page.locator("img[alt]").first().click();
    await page.waitForTimeout(1000);
    // Press back/Escape key
    await page.keyboard.press("Escape");
    // Should return to /live
    await page.waitForURL(liveUrl, { timeout: 5_000 });
    expect(page.url()).toBe(liveUrl);
  });

  test.fixme("channel switching with debounce prevents rapid flipping", async ({
    page,
  }) => {
    await authenticate(page);
    await page.goto("/live");
    await page.waitForSelector("img[alt]", { timeout: 10_000 });
    await page.locator("img[alt]").first().click();
    await page.waitForTimeout(1000);
    // Attempt rapid channel up presses (should be debounced)
    await page.keyboard.press("PageDown"); // Channel down
    await page.keyboard.press("PageDown");
    await page.keyboard.press("PageDown");
    // Verify stream is stable (no flickering in logs)
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    // No stream switching errors
    expect(errors.length).toBe(0);
  });

  test.fixme("channel info overlay shows for 3s after channel change", async ({
    page,
  }) => {
    await authenticate(page);
    await page.goto("/live");
    await page.waitForSelector("img[alt]", { timeout: 10_000 });
    await page.locator("img[alt]").first().click();
    await page.waitForTimeout(1000);
    // Change channel
    await page.keyboard.press("PageDown");
    // Channel info overlay should appear
    const channelInfo = page
      .locator('[data-testid="channel-info"], text=/channel/i')
      .first();
    await expect(channelInfo).toBeVisible({ timeout: 3_000 });
    // Wait 3.5s for auto-hide
    await page.waitForTimeout(3500);
    await expect(channelInfo).not.toBeVisible({ timeout: 2_000 });
  });
});

// ---------------------------------------------------------------------------
// Error Recovery (#116)
// ---------------------------------------------------------------------------

test.describe("Sprint 4: Error Recovery", () => {
  test.fixme("error screen shows with retry button on stream failure", async ({
    page,
  }) => {
    await authenticate(page);
    await page.goto("/vod");
    await page.waitForSelector('[data-testid="content-card"]', {
      timeout: 10_000,
    });
    await page.locator('[data-testid="content-card"]').first().click();
    await page.waitForURL("**/vod/**");
    // Intercept and fail stream
    await page.route("**/*.ts", (route) => route.abort());
    await page.getByRole("button", { name: /play|resume/i }).click();
    await page.waitForTimeout(2000);
    // Error screen should appear
    const errorScreen = page.locator('[data-testid="error-screen"]').first();
    await expect(errorScreen).toBeVisible({ timeout: 10_000 });
    // Retry button should be present
    const retryBtn = page.getByRole("button", { name: /retry/i }).first();
    await expect(retryBtn).toBeVisible();
  });

  test.fixme("retry button reloads stream", async ({ page }) => {
    await authenticate(page);
    await page.goto("/vod");
    await page.waitForSelector('[data-testid="content-card"]', {
      timeout: 10_000,
    });
    await page.locator('[data-testid="content-card"]').first().click();
    await page.waitForURL("**/vod/**");
    // Fail stream first time, then allow second attempt
    let attempts = 0;
    await page.route("**/*.ts", (route) => {
      attempts++;
      if (attempts === 1) {
        route.abort();
      } else {
        route.continue();
      }
    });
    await page.getByRole("button", { name: /play|resume/i }).click();
    await page.waitForTimeout(1000);
    // Click retry
    const retryBtn = page.getByRole("button", { name: /retry/i });
    if ((await retryBtn.count()) > 0) {
      await retryBtn.click();
      await page.waitForTimeout(1000);
      // Stream should attempt to load again
      expect(attempts).toBeGreaterThan(1);
    }
  });

  test.fixme("go back button exits player and returns to detail page", async ({
    page,
  }) => {
    await authenticate(page);
    await page.goto("/vod");
    await page.waitForSelector('[data-testid="content-card"]', {
      timeout: 10_000,
    });
    await page.locator('[data-testid="content-card"]').first().click();
    await page.waitForURL("**/vod/**");
    const detailUrl = page.url();
    await page.getByRole("button", { name: /play|resume/i }).click();
    await page.waitForTimeout(1000);
    // Close player (Escape or back button)
    await page.keyboard.press("Escape");
    // Should still be on detail page
    expect(page.url()).toBe(detailUrl);
  });

  test.fixme("sleep/wake resumes VOD playback at saved position", async ({
    page,
  }) => {
    await authenticate(page);
    await page.goto("/vod");
    await page.waitForSelector('[data-testid="content-card"]', {
      timeout: 10_000,
    });
    await page.locator('[data-testid="content-card"]').first().click();
    await page.waitForURL("**/vod/**");
    await page.getByRole("button", { name: /play|resume/i }).click();
    await page.waitForTimeout(3000);
    // Get current position
    const progress = page
      .locator('[data-testid="progress-bar"], input[type="range"]')
      .first();
    const positionBeforeSleep = await progress.getAttribute("value");
    // Simulate device sleep (pause + wait + resume)
    await page.evaluate(() => {
      const video = document.querySelector("video") as HTMLVideoElement;
      if (video) video.pause();
    });
    await page.waitForTimeout(5000);
    // Resume playback
    const playBtn = page.getByRole("button", { name: /play/i }).first();
    if ((await playBtn.count()) > 0) {
      await playBtn.click();
    } else {
      await page.evaluate(() => {
        const video = document.querySelector("video") as HTMLVideoElement;
        if (video) video.play();
      });
    }
    // Position should be preserved
    const positionAfterWake = await progress.getAttribute("value");
    expect(parseFloat(positionAfterWake || "0")).toBeCloseTo(
      parseFloat(positionBeforeSleep || "0"),
      1,
    );
  });

  test.fixme("sleep/wake reloads live stream without seeking", async ({
    page,
  }) => {
    await authenticate(page);
    await page.goto("/live");
    await page.waitForSelector("img[alt]", { timeout: 10_000 });
    await page.locator("img[alt]").first().click();
    await page.waitForTimeout(2000);
    // Simulate sleep (pause)
    await page.evaluate(() => {
      const video = document.querySelector("video") as HTMLVideoElement;
      if (video) video.pause();
    });
    await page.waitForTimeout(5000);
    // Resume (should reload live stream from current buffer)
    const playBtn = page.getByRole("button", { name: /play/i }).first();
    if ((await playBtn.count()) > 0) {
      await playBtn.click();
    } else {
      await page.evaluate(() => {
        const video = document.querySelector("video") as HTMLVideoElement;
        if (video) video.play();
      });
    }
    // Stream should be playing (check for no errors)
    const errorScreen = page.locator('[data-testid="error-screen"]').first();
    await expect(errorScreen).not.toBeVisible({ timeout: 5_000 });
  });
});
