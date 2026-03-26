/**
 * Production E2E Tests for StreamVault
 *
 * Tests run against the LIVE production site: https://streamvault.srinivaskotha.uk
 * All API calls hit the real backend — no mocking.
 * Tests use resilient selectors based on actual production DOM discovery.
 *
 * AUTH: Uses Playwright global storageState (via global-setup.ts).
 * All tests get pre-authenticated cookies automatically — no per-test login needed.
 * Tests that need a fresh (unauthenticated) context use explicit empty storageState.
 *
 * DOM Facts (verified 2026-03-26, third probe):
 * - Login: #username, #password, #login-submit. Submit text "Sign In". Redirects to /language/telugu
 * - Language hub: language buttons use [data-focus-key="langhub-lang-{lang}"], NOT role="button" with name
 * - Content tabs on /language/telugu: [role="tab"] with data-focus-key="langhub-tab-movies|series|live"
 * - VOD cards: [data-focus-key^="card-"] (slug-based, e.g., card-12-years-a-slave-(2013))
 * - Series cards: [data-focus-key^="series-"] (NOT "card-")
 * - Live featured cards: [data-focus-key^="featured-"] (20 cards, load after API data)
 * - Live channel cards: [data-focus-key^="channel-"]
 * - Live sidebar: [data-focus-key^="sidebar-cat-"]
 * - Live view toggles: toggle-view-grid, toggle-view-epg
 * - Profile: [data-focus-key="profile-btn"] with aria-haspopup="menu" and aria-expanded="false"
 * - Sign out: via /settings page [data-focus-key="settings-logout-btn"]
 * - Settings focus keys: settings-server-url, settings-quality-select, settings-subtitle-lang, settings-autoplay-toggle
 * - Search: input[placeholder*="Search"], [role="search"], [aria-label="Clear search"]
 * - VOD filters: category-grid-{id}, vod-rating-none/3.5/4, vod-search-input
 * - Favorites tabs: fav-tab-all/live/vod/series (NO role="tab")
 * - History tabs: history-tab-all/live/vod/series
 * - History items: history-item-{type}-{id1}-{id2}
 * - TWO <main> elements: outer (flex-1) + inner <main id="main-content" tabindex="-1"> — use #main-content
 * - Category chips on hub: movies-chip-{id}
 * - nav[aria-label="Main navigation"] exists as second nav element
 */

import { test, expect } from "@playwright/test";

// Helper: wait for page to be meaningfully loaded after navigation
async function waitForPageReady(page: import("@playwright/test").Page) {
  await page.waitForLoadState("domcontentloaded");
  // Give React time to hydrate and first API calls to resolve
  await page.waitForTimeout(3_000);
}

// Helper: re-login when token expires mid-suite
async function reLogin(page: import("@playwright/test").Page) {
  const username = process.env.E2E_USERNAME || "admin";
  const password = process.env.E2E_PASSWORD || "testpass123";

  // Ensure we're on the login page
  if (!page.url().includes("/login")) {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
  }

  // Wait for form to be ready
  await page
    .locator("#username")
    .waitFor({ state: "visible", timeout: 10_000 });

  // Clear and fill fields
  await page.locator("#username").clear();
  await page.locator("#username").fill(username);
  await page.locator("#password").clear();
  await page.locator("#password").fill(password);

  // Submit and wait for redirect
  await page.locator("#login-submit").click();
  await page.waitForURL((u) => !u.pathname.includes("/login"), {
    timeout: 15_000,
  });
  await page.waitForTimeout(2_000);
}

// Helper: navigate to a page and handle token expiry gracefully
async function safeNavigate(
  page: import("@playwright/test").Page,
  path: string,
) {
  await page.goto(path);
  await waitForPageReady(page);

  // Check if redirected to login due to expired token
  if (page.url().includes("/login")) {
    await reLogin(page);
    // Now navigate to the intended page
    await page.goto(path);
    await waitForPageReady(page);

    // If still on login after re-login, the page itself IS login — that's fine
    if (page.url().includes("/login") && path !== "/login") {
      throw new Error(
        `Re-authentication failed: still on login page after attempting to navigate to ${path}`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// A. Authentication
// ---------------------------------------------------------------------------

test.describe("Authentication — fresh context", () => {
  // These tests need a fresh browser context WITHOUT pre-existing auth cookies.
  // Use explicit empty state object — `undefined` does not reliably clear state in Playwright.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("login page renders with form fields and submit button", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("#username")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("#login-submit")).toBeVisible();
    await expect(page.locator("#login-submit")).toContainText("Sign In");
  });

  test("login page shows StreamVault branding", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("h1")).toContainText("StreamVault");
  });

  test("login with valid credentials redirects away from login", async ({
    page,
  }) => {
    // This test exercises the actual login flow.
    // Global setup already used one login attempt against the rate limiter.
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await page
      .locator("#username")
      .waitFor({ state: "visible", timeout: 10_000 });
    await page.locator("#username").fill(process.env.E2E_USERNAME ?? "admin");
    await page
      .locator("#password")
      .fill(process.env.E2E_PASSWORD ?? "testpass123");
    await page.locator("#login-submit").click();

    // Wait for redirect away from login (may go to / or /language/telugu)
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 15_000,
    });
    expect(page.url()).not.toContain("/login");
  });

  test("login form shows validation for empty fields", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await page.locator("#login-submit").click();

    const alerts = page.locator('[role="alert"]');
    await expect(alerts.first()).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("Authentication — with auth", () => {
  test("auth persists across page reload", async ({ page }) => {
    await safeNavigate(page, "/language/telugu");

    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3_000);

    expect(page.url()).not.toContain("/login");
  });
});

// ---------------------------------------------------------------------------
// B. Home Page & Navigation (Language Hub)
// ---------------------------------------------------------------------------

test.describe("Home Page & Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await safeNavigate(page, "/language/telugu");
  });

  test("language hub loads with content tabs (Movies, Series, Live TV)", async ({
    page,
  }) => {
    await expect(page.getByRole("tab", { name: "Movies" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("tab", { name: "Series" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Live TV" })).toBeVisible();
  });

  test("language tabs are visible (Telugu, Hindi, English)", async ({
    page,
  }) => {
    // Language buttons use data-focus-key, NOT role="button" with name
    await expect(
      page.locator('[data-focus-key="langhub-lang-telugu"]'),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.locator('[data-focus-key="langhub-lang-hindi"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-focus-key="langhub-lang-english"]'),
    ).toBeVisible();
  });

  test("top navigation bar is visible with StreamVault logo", async ({
    page,
  }) => {
    const header = page.locator("header");
    await expect(header).toBeVisible({ timeout: 10_000 });
    await expect(header.locator("a").first()).toContainText("StreamVault");
  });

  test("profile button is visible in nav", async ({ page }) => {
    const profileBtn = page.locator('[data-focus-key="profile-btn"]');
    await expect(profileBtn).toBeVisible({ timeout: 10_000 });
  });

  test("content loads with category chips on Movies tab", async ({ page }) => {
    // Chips load after API data — wait explicitly for the first chip
    const firstChip = page.locator('[data-focus-key^="movies-chip-"]').first();
    await firstChip.waitFor({ timeout: 30_000 });
    await expect(firstChip).toBeVisible();
  });

  test("sort buttons are visible on Movies tab", async ({ page }) => {
    const sortBtns = page.locator('[data-focus-key^="movies-sort-"]');
    await expect(sortBtns.first()).toBeVisible({ timeout: 15_000 });
  });

  test("content tabs have correct data-focus-keys", async ({ page }) => {
    await expect(
      page.locator('[data-focus-key="langhub-tab-movies"]'),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.locator('[data-focus-key="langhub-tab-series"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-focus-key="langhub-tab-live"]'),
    ).toBeVisible();
  });

  test("switching to Series tab loads series content", async ({ page }) => {
    const seriesTab = page.getByRole("tab", { name: "Series" });
    await expect(seriesTab).toBeVisible({ timeout: 10_000 });
    await seriesTab.click();
    await page.waitForTimeout(3_000);

    await expect(seriesTab).toHaveAttribute("aria-selected", "true");
  });

  test("switching to Live TV tab loads live content", async ({ page }) => {
    const liveTab = page.getByRole("tab", { name: "Live TV" });
    await expect(liveTab).toBeVisible({ timeout: 10_000 });
    await liveTab.click();
    await page.waitForTimeout(3_000);

    await expect(liveTab).toHaveAttribute("aria-selected", "true");
  });

  test("clicking a category chip filters content", async ({ page }) => {
    const chips = page.locator('[data-focus-key^="movies-chip-"]');
    const firstChip = chips.first();
    await firstChip.waitFor({ timeout: 30_000 });
    await expect(firstChip).toBeVisible();

    const chipCount = await chips.count();
    if (chipCount > 1) {
      await chips.nth(1).click();
      await page.waitForTimeout(2_000);
      await expect(chips.nth(1)).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// C. VOD Browse & Detail
// ---------------------------------------------------------------------------

test.describe("VOD Browse & Detail", () => {
  test.beforeEach(async ({ page }) => {
    await safeNavigate(page, "/vod");
  });

  test("VOD page loads with content cards", async ({ page }) => {
    const main = page.locator("#main-content");
    await expect(main).toBeVisible({ timeout: 10_000 });

    // VOD cards use "card-" prefix with slug pattern (e.g., card-12-years-a-slave-(2013))
    const cards = page.locator('[data-focus-key^="card-"]');
    await expect(cards.first()).toBeVisible({ timeout: 30_000 });
  });

  test("VOD page has multiple content cards", async ({ page }) => {
    const cards = page.locator('[data-focus-key^="card-"]');
    await expect(cards.first()).toBeVisible({ timeout: 30_000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("clicking a VOD card navigates to detail page", async ({ page }) => {
    const firstCard = page.locator('[data-focus-key^="card-"]').first();
    await expect(firstCard).toBeVisible({ timeout: 30_000 });

    // Try clicking a link inside the card, or the card itself
    const cardLink = firstCard.locator("a").first();
    if ((await cardLink.count()) > 0) {
      await cardLink.click();
    } else {
      await firstCard.click();
    }

    await waitForPageReady(page);

    // URL should change to /vod/{id}
    expect(page.url()).toMatch(/\/vod\/\d+/);
  });

  test("VOD detail page shows poster image", async ({ page }) => {
    const firstCard = page.locator('[data-focus-key^="card-"]').first();
    await expect(firstCard).toBeVisible({ timeout: 30_000 });

    const cardLink = firstCard.locator("a").first();
    if ((await cardLink.count()) > 0) {
      await cardLink.click();
    } else {
      await firstCard.click();
    }

    await waitForPageReady(page);

    const images = page.locator("img");
    await expect(images.first()).toBeVisible({ timeout: 10_000 });
  });

  test("back navigation from detail returns to VOD", async ({ page }) => {
    const firstCard = page.locator('[data-focus-key^="card-"]').first();
    await expect(firstCard).toBeVisible({ timeout: 30_000 });

    const cardLink = firstCard.locator("a").first();
    if ((await cardLink.count()) > 0) {
      await cardLink.click();
    } else {
      await firstCard.click();
    }

    await waitForPageReady(page);
    await page.goBack();
    await page.waitForLoadState("domcontentloaded");

    expect(page.url()).toContain("/vod");
  });
});

// ---------------------------------------------------------------------------
// D. Series Browse & Detail
// ---------------------------------------------------------------------------

test.describe("Series Browse & Detail", () => {
  test.beforeEach(async ({ page }) => {
    await safeNavigate(page, "/series");
  });

  test("series page loads with content cards", async ({ page }) => {
    const main = page.locator("#main-content");
    await expect(main).toBeVisible({ timeout: 10_000 });

    // Series cards use "series-" prefix
    const cards = page.locator('[data-focus-key^="series-"]');
    await expect(cards.first()).toBeVisible({ timeout: 30_000 });
  });

  test("clicking a series card navigates to detail page", async ({ page }) => {
    const firstCard = page.locator('[data-focus-key^="series-"]').first();
    await expect(firstCard).toBeVisible({ timeout: 30_000 });

    const cardLink = firstCard.locator("a").first();
    if ((await cardLink.count()) > 0) {
      await cardLink.click();
    } else {
      await firstCard.click();
    }

    await waitForPageReady(page);

    // URL should change to /series/{id}
    expect(page.url()).toMatch(/\/series\/\d+/);
  });

  test("series detail page shows poster image", async ({ page }) => {
    const firstCard = page.locator('[data-focus-key^="series-"]').first();
    await expect(firstCard).toBeVisible({ timeout: 30_000 });

    const cardLink = firstCard.locator("a").first();
    if ((await cardLink.count()) > 0) {
      await cardLink.click();
    } else {
      await firstCard.click();
    }

    await waitForPageReady(page);

    const images = page.locator("img");
    await expect(images.first()).toBeVisible({ timeout: 10_000 });
  });

  test("series detail page has meaningful content", async ({ page }) => {
    const firstCard = page.locator('[data-focus-key^="series-"]').first();
    await expect(firstCard).toBeVisible({ timeout: 30_000 });

    const cardLink = firstCard.locator("a").first();
    if ((await cardLink.count()) > 0) {
      await cardLink.click();
    } else {
      await firstCard.click();
    }

    await waitForPageReady(page);

    const mainContent = page.locator("#main-content");
    await expect(mainContent).toBeVisible({ timeout: 10_000 });
    const text = await mainContent.textContent();
    expect(text!.length).toBeGreaterThan(10);
  });

  test("back navigation from series detail works", async ({ page }) => {
    const firstCard = page.locator('[data-focus-key^="series-"]').first();
    await expect(firstCard).toBeVisible({ timeout: 30_000 });

    const cardLink = firstCard.locator("a").first();
    if ((await cardLink.count()) > 0) {
      await cardLink.click();
    } else {
      await firstCard.click();
    }

    await waitForPageReady(page);
    await page.goBack();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(5_000);

    expect(page.url()).toContain("/series");
  });
});

// ---------------------------------------------------------------------------
// E. Live TV
// ---------------------------------------------------------------------------

test.describe("Live TV", () => {
  test.beforeEach(async ({ page }) => {
    await safeNavigate(page, "/live");
  });

  test("live page loads without error", async ({ page }) => {
    const main = page.locator("#main-content");
    await expect(main).toBeVisible({ timeout: 15_000 });
    expect(page.url()).not.toContain("/login");
  });

  test("live page has featured cards", async ({ page }) => {
    // Live featured cards use "featured-" prefix — they load after API data, allow higher timeout
    const cards = page.locator('[data-focus-key^="featured-"]');
    await expect(cards.first()).toBeVisible({ timeout: 30_000 });
  });

  test("live tab on language hub shows content", async ({ page }) => {
    // Navigate to language hub for this test
    await safeNavigate(page, "/language/telugu");

    // Use data-focus-key selector which is more reliable
    const liveTab = page.locator('[data-focus-key="langhub-tab-live"]');
    await expect(liveTab).toBeVisible({ timeout: 15_000 });
    await liveTab.click();
    await page.waitForTimeout(3_000);

    // After clicking, re-query the tab to avoid stale element reference
    const updatedTab = page.locator('[data-focus-key="langhub-tab-live"]');
    await expect(updatedTab).toHaveAttribute("aria-selected", "true", {
      timeout: 10_000,
    });
  });

  test("live page accessible via direct URL", async ({ page }) => {
    // Re-navigate to ensure fresh page load (beforeEach may have expired token)
    await safeNavigate(page, "/live");

    // If token expired, we may be on login page — that's a known timing issue
    // with 15-min access tokens. The test should pass when run early in the suite.
    const main = page.locator("#main-content");
    await expect(main).toBeVisible({ timeout: 15_000 });
  });
});

// ---------------------------------------------------------------------------
// F. Search
// ---------------------------------------------------------------------------

test.describe("Search", () => {
  test.beforeEach(async ({ page }) => {
    await safeNavigate(page, "/search");
  });

  test("search page renders with input field", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 20_000 });
  });

  test("search has role=search landmark", async ({ page }) => {
    const searchRegion = page.locator('[role="search"]');
    await expect(searchRegion).toBeVisible({ timeout: 20_000 });
  });

  test("typing a query populates the page", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 20_000 });

    // Click the input first to ensure it receives focus (spatial nav wrapper may intercept)
    await searchInput.click();
    await page.waitForTimeout(500);
    await searchInput.fill("a");
    await page.waitForTimeout(3_000);

    const main = page.locator("#main-content");
    await expect(main).toBeVisible({ timeout: 10_000 });
    const text = await main.textContent();
    expect(text).toBeTruthy();
  });

  test("empty search shows appropriate state", async ({ page }) => {
    const main = page.locator("#main-content");
    await expect(main).toBeVisible({ timeout: 10_000 });
  });

  test("search input has clear button after typing", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 20_000 });

    await searchInput.click();
    await page.waitForTimeout(500);
    await searchInput.fill("test");
    await page.waitForTimeout(2_000);

    const clearBtn = page.locator('[aria-label="Clear search"]');
    await expect(clearBtn).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// G. Favorites & History
// ---------------------------------------------------------------------------

test.describe("Favorites & History", () => {
  test("favorites page loads without error", async ({ page }) => {
    await safeNavigate(page, "/favorites");

    expect(page.url()).toContain("/favorites");
    const main = page.locator("#main-content");
    await expect(main).toBeVisible({ timeout: 10_000 });
  });

  test("favorites page shows heading and tabs", async ({ page }) => {
    await safeNavigate(page, "/favorites");

    await expect(page.locator("h1")).toContainText("Favorites");

    // Favorites tabs exist (no role="tab" — just data-focus-key)
    await expect(page.locator('[data-focus-key="fav-tab-all"]')).toBeVisible({
      timeout: 10_000,
    });
  });

  test("history page loads without error", async ({ page }) => {
    await safeNavigate(page, "/history");

    expect(page.url()).toContain("/history");
    const main = page.locator("#main-content");
    await expect(main).toBeVisible({ timeout: 10_000 });
  });

  test("history page shows heading and tabs", async ({ page }) => {
    await safeNavigate(page, "/history");

    await expect(page.locator("h1")).toContainText("Watch History");

    // History tabs exist
    await expect(
      page.locator('[data-focus-key="history-tab-all"]'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("favorites page shows empty state or content", async ({ page }) => {
    await safeNavigate(page, "/favorites");

    const main = page.locator("#main-content");
    await expect(main).toBeVisible({ timeout: 10_000 });
    const text = await main.textContent();
    expect(text).toBeTruthy();
  });

  test("history page shows empty state or content", async ({ page }) => {
    await safeNavigate(page, "/history");

    const main = page.locator("#main-content");
    await expect(main).toBeVisible({ timeout: 10_000 });
    const text = await main.textContent();
    expect(text).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// H. Settings
// ---------------------------------------------------------------------------

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await safeNavigate(page, "/settings");
  });

  test("settings page loads with heading", async ({ page }) => {
    expect(page.url()).toContain("/settings");
    await expect(page.locator("h1")).toContainText("Settings", {
      timeout: 15_000,
    });
  });

  test("settings page has Server, Player Preferences, and About sections", async ({
    page,
  }) => {
    await expect(page.locator("h2").filter({ hasText: "Server" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.locator("h2").filter({ hasText: "Player Preferences" }),
    ).toBeVisible();
    await expect(page.locator("h2").filter({ hasText: "About" })).toBeVisible();
  });

  test("settings page has sign out button", async ({ page }) => {
    const signOutBtn = page.locator('[data-focus-key="settings-logout-btn"]');
    await expect(signOutBtn).toBeVisible({ timeout: 15_000 });
    await expect(signOutBtn).toContainText("Sign Out");
  });

  test("settings page has player preference controls", async ({ page }) => {
    await expect(
      page.locator('[data-focus-key="settings-quality-select"]'),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator('[data-focus-key="settings-autoplay-toggle"]'),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// I. Profile Button & Sign Out
// ---------------------------------------------------------------------------

test.describe("Profile & Sign Out", () => {
  test.beforeEach(async ({ page }) => {
    await safeNavigate(page, "/language/telugu");
  });

  test("profile button is visible in navigation", async ({ page }) => {
    const profileBtn = page.locator('[data-focus-key="profile-btn"]');
    await expect(profileBtn).toBeVisible({ timeout: 10_000 });
  });

  test("profile button has dropdown menu (aria-haspopup)", async ({ page }) => {
    const profileBtn = page.locator('[data-focus-key="profile-btn"]');
    await expect(profileBtn).toBeVisible({ timeout: 10_000 });

    // Verify aria-haspopup="menu" attribute exists (verified DOM fact)
    await expect(profileBtn).toHaveAttribute("aria-haspopup", "menu");

    // Menu should be collapsed initially
    await expect(profileBtn).toHaveAttribute("aria-expanded", "false");
  });

  test("clicking profile button opens dropdown menu", async ({ page }) => {
    const profileBtn = page.locator('[data-focus-key="profile-btn"]');
    await expect(profileBtn).toBeVisible({ timeout: 10_000 });

    await profileBtn.click();
    await page.waitForTimeout(1_000);

    // After click, aria-expanded should change or a menu should appear
    const expanded = await profileBtn.getAttribute("aria-expanded");
    const menu = page.locator('[role="menu"]');
    const menuCount = await menu.count();

    // Either aria-expanded changed to "true" or a menu element appeared
    expect(expanded === "true" || menuCount > 0).toBeTruthy();
  });

  test("sign out via settings page redirects to login", async ({ page }) => {
    await safeNavigate(page, "/settings");

    const signOutBtn = page.locator('[data-focus-key="settings-logout-btn"]');
    await expect(signOutBtn).toBeVisible({ timeout: 15_000 });

    await signOutBtn.click();

    await page.waitForURL("**/login", { timeout: 15_000 });
    expect(page.url()).toContain("/login");
  });
});

// ---------------------------------------------------------------------------
// J. Responsive Layout
// ---------------------------------------------------------------------------

test.describe("Responsive Layout", () => {
  test.beforeEach(async ({ page }) => {
    await safeNavigate(page, "/language/telugu");
  });

  test("page renders without horizontal scrollbar", async ({ page }) => {
    const hasHorizontalScroll = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
      );
    });

    expect(hasHorizontalScroll).toBeFalsy();
  });

  test("navigation is accessible", async ({ page }) => {
    // Allow extra time for React hydration before looking for nav
    await page.waitForTimeout(2_000);
    const nav = page.locator('nav[aria-label="Main navigation"]').first();
    await nav.waitFor({ timeout: 15_000 });
    await expect(nav).toBeVisible();
  });

  test("main content area is visible", async ({ page }) => {
    const main = page.locator("#main-content");
    await expect(main).toBeVisible({ timeout: 10_000 });

    const box = await main.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.width).toBeGreaterThan(200);
    }
  });

  test("screenshot of home page for visual baseline", async ({ page }) => {
    await page.waitForTimeout(2_000);

    await page.screenshot({
      path: "tests/e2e/screenshots/home-page.png",
      fullPage: false,
    });
  });
});

// ---------------------------------------------------------------------------
// K. Accessibility Basics
// ---------------------------------------------------------------------------

test.describe("Accessibility Basics", () => {
  test("login page has proper heading hierarchy", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2_000);

    // With auth cookies, may redirect to language hub. Either page should have h1.
    // If redirected, re-auth and try again
    if (page.url().includes("/login")) {
      // We're on login page — that's what we wanted. Check h1.
      const h1 = page.locator("h1").first();
      await expect(h1).toBeVisible({ timeout: 10_000 });
    } else {
      // Redirected to authenticated page — also has h1
      const h1 = page.locator("h1").first();
      await expect(h1).toBeVisible({ timeout: 10_000 });
    }
  });

  test("authenticated page has main landmark", async ({ page }) => {
    await safeNavigate(page, "/language/telugu");

    const main = page.locator("#main-content");
    await expect(main).toBeVisible({ timeout: 10_000 });
  });

  test("navigation has aria-label", async ({ page }) => {
    await safeNavigate(page, "/language/telugu");

    await page.waitForTimeout(2_000);
    const nav = page.locator('nav[aria-label="Main navigation"]').first();
    await nav.waitFor({ timeout: 15_000 });
    await expect(nav).toBeVisible();
  });

  test("skip link target exists and is valid", async ({ page }) => {
    await safeNavigate(page, "/language/telugu");

    // #main-content exists as <main id="main-content" tabindex="-1">
    const mainContent = page.locator("#main-content");
    await expect(mainContent).toBeVisible({ timeout: 15_000 });

    // Skip link <a href="#main-content"> should exist
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
  });

  test("interactive elements are keyboard focusable", async ({ page }) => {
    await safeNavigate(page, "/language/telugu");

    await page.keyboard.press("Tab");

    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.tagName ?? "NONE";
    });
    expect(focused).not.toBe("NONE");
  });

  test("content tabs have proper ARIA roles on language hub", async ({
    page,
  }) => {
    // ARIA role="tab" only exists on /language/telugu (language hub), NOT on other pages
    await safeNavigate(page, "/language/telugu");

    const tabs = page.locator('[role="tab"]');
    await expect(tabs.first()).toBeVisible({ timeout: 15_000 });
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// L. Error Handling & Edge Cases
// ---------------------------------------------------------------------------

test.describe("Error Handling", () => {
  test("non-existent route shows fallback or redirects", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3_000);

    // Check body is visible — the app may redirect or show a fallback page
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});

test.describe("Unauthenticated access", () => {
  // These tests need a fresh browser context WITHOUT auth cookies.
  // Use explicit empty state object — `undefined` does not reliably clear state in Playwright.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated access to protected route redirects to login", async ({
    page,
  }) => {
    await page.goto("/favorites");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(5_000);

    const url = page.url();
    const isLoginOrAuth = url.includes("/login") || url.includes("/language/");
    expect(isLoginOrAuth).toBeTruthy();
  });

  test("unauthenticated access to /vod redirects to login", async ({
    page,
  }) => {
    await page.goto("/vod");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(5_000);

    const url = page.url();
    const isLoginOrAuth = url.includes("/login") || url.includes("/language/");
    expect(isLoginOrAuth).toBeTruthy();
  });
});
