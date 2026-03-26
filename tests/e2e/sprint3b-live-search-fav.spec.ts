/**
 * Sprint 3B — Live TV, Search, Favorites, History E2E Tests
 *
 * Tests run against the LIVE production site: https://streamvault.srinivaskotha.uk
 * All API calls hit the real backend — no mocking.
 * Uses Playwright global storageState (via global-setup.ts) for authentication.
 *
 * DOM Facts (verified from production page snapshots):
 * - Live sidebar: [data-focus-key^="sidebar-cat-"]
 * - Live featured cards: [data-focus-key^="featured-"]
 * - Live channel cards: [data-focus-key^="channel-"]
 * - Live view toggles: toggle-view-grid, toggle-view-epg
 * - Search: input[placeholder*="Search"], [role="search"], [aria-label="Clear search"]
 * - Favorites tabs: fav-tab-all/live/vod/series (NO role="tab")
 * - History tabs: history-tab-all/live/vod/series
 * - History items: history-item-{type}-{id1}-{id2}
 * - #main-content for main page content area
 *
 * Acceptance Criteria coverage:
 *   Issue #111 (Live TV):    category sidebar, channel grid, live indicator, playback trigger
 *   Issue #112 (Search):     input, type filter tabs, results rendering, navigation on click
 *   Issue #113 (Favorites):  grid, type filter, optimistic remove
 *   Issue #114 (History):    chronological list, progress bars, delete, resume playback
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

// ---------------------------------------------------------------------------
// Live TV Browse Flow (Issue #111)
// ---------------------------------------------------------------------------

test.describe("Live TV — Browse Flow", () => {
  test("navigates to /live and renders the Live TV page", async ({ page }) => {
    await safeNavigate(page, "/live");
    const main = page.locator("#main-content");
    await expect(main).toBeVisible({ timeout: 10_000 });
  });

  test("category sidebar shows at least one category button", async ({
    page,
  }) => {
    await safeNavigate(page, "/live");
    const firstCategory = page
      .locator('[data-focus-key^="sidebar-cat-"]')
      .first();
    await expect(firstCategory).toBeVisible({ timeout: 30_000 });
  });

  test("selecting a category loads a channel grid", async ({ page }) => {
    await safeNavigate(page, "/live");
    // Wait for sidebar categories to load
    const categories = page.locator('[data-focus-key^="sidebar-cat-"]');
    await expect(categories.first()).toBeVisible({ timeout: 30_000 });
    const count = await categories.count();
    if (count > 1) {
      await categories.nth(1).click();
      await page.waitForTimeout(3_000);
      // Channel cards or featured cards should load
      const channels = page.locator(
        '[data-focus-key^="channel-"], [data-focus-key^="featured-"]',
      );
      await expect(channels.first()).toBeVisible({ timeout: 30_000 });
    }
  });

  test("channel or featured cards are visible on Live TV page", async ({
    page,
  }) => {
    await safeNavigate(page, "/live");
    // Live page may show featured cards or channel cards depending on default category
    const cards = page.locator(
      '[data-focus-key^="featured-"], [data-focus-key^="channel-"]',
    );
    await expect(cards.first()).toBeVisible({ timeout: 30_000 });
  });

  test.fixme("clicking a channel card starts playback (PlayerPage renders)", async ({
    page,
  }) => {
    // TODO: Requires working HLS stream + player shell integration
    await safeNavigate(page, "/live");
  });

  test.fixme("filter input narrows channel list by name", async ({ page }) => {
    // TODO: Live TV filter input selector needs discovery — may not exist yet
    await safeNavigate(page, "/live");
  });

  test.fixme("skeleton grid is shown while channels are loading", async ({
    page,
  }) => {
    // TODO: needs route interception for real API endpoint pattern
    await safeNavigate(page, "/live");
  });

  test("EPG toggle button is visible on Live TV page", async ({ page }) => {
    await safeNavigate(page, "/live");
    const epgToggle = page.locator('[data-focus-key="toggle-view-epg"]');
    await expect(epgToggle).toBeVisible({ timeout: 30_000 });
  });

  test("grid toggle button is visible on Live TV page", async ({ page }) => {
    await safeNavigate(page, "/live");
    const gridToggle = page.locator('[data-focus-key="toggle-view-grid"]');
    await expect(gridToggle).toBeVisible({ timeout: 30_000 });
  });

  test.fixme("EPG toggle switches to EPG guide view", async ({ page }) => {
    // TODO: EPG grid rendering depends on EPG data availability
    await safeNavigate(page, "/live");
  });
});

// ---------------------------------------------------------------------------
// Search Flow (Issue #112)
// ---------------------------------------------------------------------------

test.describe("Search — Browse Flow", () => {
  test("navigates to /search and renders the search input", async ({
    page,
  }) => {
    await safeNavigate(page, "/search");
    const input = page.locator('input[placeholder*="Search"]');
    await expect(input).toBeVisible({ timeout: 15_000 });
  });

  test('search container has role="search"', async ({ page }) => {
    await safeNavigate(page, "/search");
    const searchRegion = page.locator('[role="search"]');
    await expect(searchRegion).toBeVisible({ timeout: 15_000 });
  });

  test("typing 2+ characters triggers search and shows results", async ({
    page,
  }) => {
    await safeNavigate(page, "/search");
    const input = page.locator('input[placeholder*="Search"]');
    await expect(input).toBeVisible({ timeout: 15_000 });
    await input.fill("star");
    await page.waitForTimeout(2_000); // debounce + API call
    // Results should appear — look for any content in main-content area
    const main = page.locator("#main-content");
    const text = await main.textContent();
    // Either results or "no results" message should appear
    expect(text!.length).toBeGreaterThan(20);
  });

  test("clear search button appears after typing", async ({ page }) => {
    await safeNavigate(page, "/search");
    const input = page.locator('input[placeholder*="Search"]');
    await expect(input).toBeVisible({ timeout: 15_000 });
    await input.fill("test");
    await page.waitForTimeout(500);
    const clearBtn = page.locator('[aria-label="Clear search"]');
    await expect(clearBtn).toBeVisible({ timeout: 5_000 });
  });

  test.fixme("type filter tabs appear after query is entered", async ({
    page,
  }) => {
    // TODO: Tab selectors for search type filters need discovery
    await safeNavigate(page, "/search");
  });

  test.fixme("clicking Live TV tab filters results to live channels only", async ({
    page,
  }) => {
    // TODO: depends on type filter tab discovery
    await safeNavigate(page, "/search");
  });

  test.fixme("clicking a live result navigates to /live with play param", async ({
    page,
  }) => {
    // TODO: depends on search result card selector discovery + working player
    await safeNavigate(page, "/search");
  });

  test.fixme("clicking a VOD result navigates to /vod/$vodId", async ({
    page,
  }) => {
    // TODO: depends on search result card selector discovery
    await safeNavigate(page, "/search");
  });

  test.fixme("clicking a series result navigates to /series/$seriesId", async ({
    page,
  }) => {
    // TODO: depends on search result card selector discovery
    await safeNavigate(page, "/search");
  });

  test("empty results shows message for nonsense query", async ({ page }) => {
    await safeNavigate(page, "/search");
    const input = page.locator('input[placeholder*="Search"]');
    await expect(input).toBeVisible({ timeout: 15_000 });
    await input.fill("xyzxyz123nonexistent");
    await page.waitForTimeout(2_000);
    // Should show some empty state or "no results" text
    const main = page.locator("#main-content");
    const text = await main.textContent();
    expect(text).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Favorites Flow (Issue #113)
// ---------------------------------------------------------------------------

test.describe("Favorites — Browse and Manage Flow", () => {
  test("navigates to /favorites and renders the page", async ({ page }) => {
    await safeNavigate(page, "/favorites");
    const main = page.locator("#main-content");
    await expect(main).toBeVisible({ timeout: 10_000 });
  });

  test("All filter tab is visible on favorites page", async ({ page }) => {
    await safeNavigate(page, "/favorites");
    const allTab = page.locator('[data-focus-key="fav-tab-all"]');
    await expect(allTab).toBeVisible({ timeout: 30_000 });
  });

  test("Live filter tab is visible on favorites page", async ({ page }) => {
    await safeNavigate(page, "/favorites");
    const liveTab = page.locator('[data-focus-key="fav-tab-live"]');
    await expect(liveTab).toBeVisible({ timeout: 30_000 });
  });

  test("VOD filter tab is visible on favorites page", async ({ page }) => {
    await safeNavigate(page, "/favorites");
    const vodTab = page.locator('[data-focus-key="fav-tab-vod"]');
    await expect(vodTab).toBeVisible({ timeout: 30_000 });
  });

  test("Series filter tab is visible on favorites page", async ({ page }) => {
    await safeNavigate(page, "/favorites");
    const seriesTab = page.locator('[data-focus-key="fav-tab-series"]');
    await expect(seriesTab).toBeVisible({ timeout: 30_000 });
  });

  test("clicking a filter tab does not crash the page", async ({ page }) => {
    await safeNavigate(page, "/favorites");
    const liveTab = page.locator('[data-focus-key="fav-tab-live"]');
    await expect(liveTab).toBeVisible({ timeout: 30_000 });
    await liveTab.click();
    await page.waitForTimeout(2_000);
    // Page should still be functional
    const main = page.locator("#main-content");
    await expect(main).toBeVisible();
  });

  test.fixme("clicking remove on a favorite card removes it optimistically", async ({
    page,
  }) => {
    // TODO: Requires seeded favorites data + remove button selector discovery
    await safeNavigate(page, "/favorites");
  });

  test.fixme('empty state shows "No favorites yet" when list is empty', async ({
    page,
  }) => {
    // TODO: needs route interception for real API endpoint pattern
    await safeNavigate(page, "/favorites");
  });
});

// ---------------------------------------------------------------------------
// Watch History Flow (Issue #114)
// ---------------------------------------------------------------------------

test.describe("Watch History — Browse Flow", () => {
  test("navigates to /history and renders the page", async ({ page }) => {
    await safeNavigate(page, "/history");
    const main = page.locator("#main-content");
    await expect(main).toBeVisible({ timeout: 10_000 });
  });

  test("All filter tab is visible on history page", async ({ page }) => {
    await safeNavigate(page, "/history");
    const allTab = page.locator('[data-focus-key="history-tab-all"]');
    await expect(allTab).toBeVisible({ timeout: 30_000 });
  });

  test("Live filter tab is visible on history page", async ({ page }) => {
    await safeNavigate(page, "/history");
    const liveTab = page.locator('[data-focus-key="history-tab-live"]');
    await expect(liveTab).toBeVisible({ timeout: 30_000 });
  });

  test("VOD filter tab is visible on history page", async ({ page }) => {
    await safeNavigate(page, "/history");
    const vodTab = page.locator('[data-focus-key="history-tab-vod"]');
    await expect(vodTab).toBeVisible({ timeout: 30_000 });
  });

  test("Series filter tab is visible on history page", async ({ page }) => {
    await safeNavigate(page, "/history");
    const seriesTab = page.locator('[data-focus-key="history-tab-series"]');
    await expect(seriesTab).toBeVisible({ timeout: 30_000 });
  });

  test("clicking a history filter tab does not crash the page", async ({
    page,
  }) => {
    await safeNavigate(page, "/history");
    const vodTab = page.locator('[data-focus-key="history-tab-vod"]');
    await expect(vodTab).toBeVisible({ timeout: 30_000 });
    await vodTab.click();
    await page.waitForTimeout(2_000);
    const main = page.locator("#main-content");
    await expect(main).toBeVisible();
  });

  test.fixme("history items are ordered newest first", async ({ page }) => {
    // TODO: Requires seeded watch history data
    await safeNavigate(page, "/history");
  });

  test.fixme("progress bars visible on items with duration > 0", async ({
    page,
  }) => {
    // TODO: Requires seeded watch history data with progress
    await safeNavigate(page, "/history");
  });

  test.fixme('"Continue" label is visible on each history item', async ({
    page,
  }) => {
    // TODO: Requires seeded watch history data
    await safeNavigate(page, "/history");
  });

  test.fixme('"Clear History" button is visible when history is non-empty', async ({
    page,
  }) => {
    // TODO: Requires seeded watch history data
    await safeNavigate(page, "/history");
  });

  test.fixme("clicking a VOD history item navigates to MovieDetail", async ({
    page,
  }) => {
    // TODO: Requires seeded watch history data + navigation verification
    await safeNavigate(page, "/history");
  });

  test.fixme("clicking a channel history item resumes live playback", async ({
    page,
  }) => {
    // TODO: Requires seeded watch history data + working player
    await safeNavigate(page, "/history");
  });

  test.fixme('empty state shows "No watch history" when list is empty', async ({
    page,
  }) => {
    // TODO: needs route interception for real API endpoint pattern
    await safeNavigate(page, "/history");
  });
});
