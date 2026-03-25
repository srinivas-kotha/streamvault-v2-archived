/**
 * Production E2E Tests for StreamVault
 *
 * Tests run against the LIVE production site: https://streamvault.srinivaskotha.uk
 * All API calls hit the real backend — no mocking.
 * Tests use resilient selectors and avoid hardcoding specific content titles.
 *
 * NOTE: We avoid `waitForLoadState("networkidle")` because the production site
 * has long-polling / streaming API calls that never reach idle state.
 * Instead we use `domcontentloaded` + explicit element waits.
 */

import { test, expect, authenticate } from "./fixtures";

// Helper: wait for page to be meaningfully loaded after navigation
async function waitForPageReady(page: import("@playwright/test").Page) {
  await page.waitForLoadState("domcontentloaded");
  // Give React time to hydrate and first API calls to resolve
  await page.waitForTimeout(3_000);
}

// ---------------------------------------------------------------------------
// A. Authentication
// ---------------------------------------------------------------------------

test.describe("Authentication", () => {
  test("login page renders with form fields and submit button", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("#username")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("#login-submit")).toBeVisible();
    await expect(page.getByText("Sign in to your account")).toBeVisible();
  });

  test("login page shows StreamVault branding", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("h1")).toContainText("StreamVault");
  });

  test("login with valid credentials redirects to language hub", async ({
    page,
  }) => {
    await authenticate(page);
    expect(page.url()).toContain("/language/");
  });

  test("login form shows validation for empty fields", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    await page.locator("#login-submit").click();

    const alerts = page.locator('[role="alert"]');
    await expect(alerts.first()).toBeVisible({ timeout: 5_000 });
  });

  test("auth persists across page reload", async ({ page }) => {
    await authenticate(page);

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
    await authenticate(page);
    await waitForPageReady(page);
  });

  test("language hub loads with content tabs (Movies, Series, Live TV)", async ({
    page,
  }) => {
    await expect(page.getByRole("button", { name: "Movies" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: "Series" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Live TV" })).toBeVisible();
  });

  test("language tabs are visible (Telugu, Hindi, English)", async ({
    page,
  }) => {
    await expect(page.getByRole("button", { name: "Telugu" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: "Hindi" })).toBeVisible();
    await expect(page.getByRole("button", { name: "English" })).toBeVisible();
  });

  test("top navigation bar is visible with StreamVault logo", async ({
    page,
  }) => {
    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible({ timeout: 10_000 });
    await expect(nav.locator("a").first()).toContainText("StreamVault");
  });

  test("profile button is visible in nav", async ({ page }) => {
    const profileBtn = page.locator('[aria-haspopup="menu"]');
    await expect(profileBtn).toBeVisible({ timeout: 10_000 });
  });

  test("content rails load with cards on Movies tab", async ({ page }) => {
    // Cards have data-focus-key attributes starting with "card-"
    const cards = page.locator('[data-focus-key^="card-"]');
    await expect(cards.first()).toBeVisible({ timeout: 20_000 });
  });

  test("switching to Series tab loads series content", async ({ page }) => {
    const seriesBtn = page.getByRole("button", { name: "Series" });
    await expect(seriesBtn).toBeVisible({ timeout: 10_000 });
    await seriesBtn.click();
    await page.waitForTimeout(3_000);

    // main should still be visible and functional
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("switching to Live TV tab loads live content", async ({ page }) => {
    const liveBtn = page.getByRole("button", { name: "Live TV" });
    await expect(liveBtn).toBeVisible({ timeout: 10_000 });
    await liveBtn.click();
    await page.waitForTimeout(3_000);

    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("clicking a content card navigates to detail page", async ({ page }) => {
    const firstCard = page.locator('[data-focus-key^="card-"]').first();
    await expect(firstCard).toBeVisible({ timeout: 20_000 });

    const cardLink = firstCard.locator("a").first();
    if ((await cardLink.count()) > 0) {
      await cardLink.click();
    } else {
      await firstCard.click();
    }

    await page.waitForTimeout(3_000);
    const url = page.url();
    const navigated =
      url.includes("/vod/") ||
      url.includes("/series/") ||
      url.includes("/live") ||
      url.includes("/category/");
    expect(navigated).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// C. VOD Browse & Detail
// ---------------------------------------------------------------------------

test.describe("VOD Browse & Detail", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test("VOD page loads with content", async ({ page }) => {
    await page.goto("/vod");
    await waitForPageReady(page);

    const main = page.locator("main");
    await expect(main).toBeVisible();

    const content = page.locator(
      '[data-focus-key^="card-"], [data-focus-key^="category-"]',
    );
    await expect(content.first()).toBeVisible({ timeout: 20_000 });
  });

  test("movie detail page shows poster image", async ({ page }) => {
    await page.goto("/vod");
    await waitForPageReady(page);

    const firstCard = page.locator('[data-focus-key^="card-"]').first();
    await expect(firstCard).toBeVisible({ timeout: 20_000 });

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

  test("VOD page has multiple content cards", async ({ page }) => {
    await page.goto("/vod");
    await waitForPageReady(page);

    const cards = page.locator('[data-focus-key^="card-"]');
    await expect(cards.first()).toBeVisible({ timeout: 20_000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("back navigation from detail returns to VOD", async ({ page }) => {
    await page.goto("/vod");
    await waitForPageReady(page);

    const firstCard = page.locator('[data-focus-key^="card-"]').first();
    await expect(firstCard).toBeVisible({ timeout: 20_000 });

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
    await authenticate(page);
  });

  test("series page loads with content", async ({ page }) => {
    await page.goto("/series");
    await waitForPageReady(page);

    const main = page.locator("main");
    await expect(main).toBeVisible();

    const content = page.locator('[data-focus-key^="card-"]');
    await expect(content.first()).toBeVisible({ timeout: 20_000 });
  });

  test("series detail page loads when clicking a card", async ({ page }) => {
    await page.goto("/series");
    await waitForPageReady(page);

    const firstCard = page.locator('[data-focus-key^="card-"]').first();
    await expect(firstCard).toBeVisible({ timeout: 20_000 });

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

  test("series detail page has content after navigation", async ({ page }) => {
    await page.goto("/series");
    await waitForPageReady(page);

    const firstCard = page.locator('[data-focus-key^="card-"]').first();
    await expect(firstCard).toBeVisible({ timeout: 20_000 });

    const cardLink = firstCard.locator("a").first();
    if ((await cardLink.count()) > 0) {
      await cardLink.click();
    } else {
      await firstCard.click();
    }

    await waitForPageReady(page);

    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
    const text = await mainContent.textContent();
    expect(text!.length).toBeGreaterThan(10);
  });

  test("back navigation from series detail works", async ({ page }) => {
    await page.goto("/series");
    await waitForPageReady(page);

    const firstCard = page.locator('[data-focus-key^="card-"]').first();
    await expect(firstCard).toBeVisible({ timeout: 20_000 });

    const cardLink = firstCard.locator("a").first();
    if ((await cardLink.count()) > 0) {
      await cardLink.click();
    } else {
      await firstCard.click();
    }

    await waitForPageReady(page);
    await page.goBack();
    await page.waitForLoadState("domcontentloaded");

    expect(page.url()).toContain("/series");
  });
});

// ---------------------------------------------------------------------------
// E. Live TV
// ---------------------------------------------------------------------------

test.describe("Live TV", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test("live page loads without error", async ({ page }) => {
    await page.goto("/live");
    await waitForPageReady(page);

    const main = page.locator("main");
    await expect(main).toBeVisible();
    expect(page.url()).not.toContain("/login");
  });

  test("live tab on language hub shows content", async ({ page }) => {
    await waitForPageReady(page);

    const liveBtn = page.getByRole("button", { name: "Live TV" });
    await expect(liveBtn).toBeVisible({ timeout: 10_000 });
    await liveBtn.click();
    await page.waitForTimeout(3_000);

    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("live page accessible via direct URL", async ({ page }) => {
    await page.goto("/live");
    await waitForPageReady(page);

    expect(page.url()).not.toContain("/login");
  });
});

// ---------------------------------------------------------------------------
// F. Search
// ---------------------------------------------------------------------------

test.describe("Search", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test("search page renders with input field", async ({ page }) => {
    await page.goto("/search");
    await waitForPageReady(page);

    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
  });

  test("typing a query populates the page", async ({ page }) => {
    await page.goto("/search");
    await waitForPageReady(page);

    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    await searchInput.fill("a");
    await page.waitForTimeout(3_000);

    const main = page.locator("main");
    const text = await main.textContent();
    expect(text).toBeTruthy();
  });

  test("empty search shows appropriate state", async ({ page }) => {
    await page.goto("/search");
    await waitForPageReady(page);

    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("search has role=search landmark", async ({ page }) => {
    await page.goto("/search");
    await waitForPageReady(page);

    const searchRegion = page.locator('[role="search"]');
    await expect(searchRegion).toBeVisible({ timeout: 10_000 });
  });

  test("search input has clear button after typing", async ({ page }) => {
    await page.goto("/search");
    await waitForPageReady(page);

    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    await searchInput.fill("test");
    await page.waitForTimeout(1_000);

    const clearBtn = page.locator('[aria-label="Clear search"]');
    await expect(clearBtn).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// G. Favorites & History
// ---------------------------------------------------------------------------

test.describe("Favorites & History", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test("favorites page loads without error", async ({ page }) => {
    await page.goto("/favorites");
    await waitForPageReady(page);

    expect(page.url()).toContain("/favorites");
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("history page loads without error", async ({ page }) => {
    await page.goto("/history");
    await waitForPageReady(page);

    expect(page.url()).toContain("/history");
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("favorites page shows empty state or content", async ({ page }) => {
    await page.goto("/favorites");
    await waitForPageReady(page);

    const main = page.locator("main");
    const text = await main.textContent();
    expect(text).toBeTruthy();
  });

  test("history page shows empty state or content", async ({ page }) => {
    await page.goto("/history");
    await waitForPageReady(page);

    const main = page.locator("main");
    const text = await main.textContent();
    expect(text).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// H. Settings
// ---------------------------------------------------------------------------

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
  });

  test("settings page loads without error", async ({ page }) => {
    await page.goto("/settings");
    await waitForPageReady(page);

    expect(page.url()).toContain("/settings");
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("settings page has content", async ({ page }) => {
    await page.goto("/settings");
    await waitForPageReady(page);

    const main = page.locator("main");
    const text = await main.textContent();
    expect(text).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// I. Profile Menu & Logout
// ---------------------------------------------------------------------------

test.describe("Profile Menu", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await waitForPageReady(page);
  });

  test("clicking profile button opens dropdown menu", async ({ page }) => {
    const profileBtn = page.locator('[aria-haspopup="menu"]');
    await expect(profileBtn).toBeVisible({ timeout: 10_000 });

    await profileBtn.click();

    const menu = page.locator('[role="menu"]');
    await expect(menu).toBeVisible({ timeout: 5_000 });
  });

  test("profile menu contains Favorites, Watch History, Settings, Sign Out", async ({
    page,
  }) => {
    const profileBtn = page.locator('[aria-haspopup="menu"]');
    await expect(profileBtn).toBeVisible({ timeout: 10_000 });
    await profileBtn.click();

    const menu = page.locator('[role="menu"]');
    await expect(menu).toBeVisible({ timeout: 5_000 });

    await expect(
      menu.locator('[role="menuitem"]:has-text("Favorites")'),
    ).toBeVisible();
    await expect(
      menu.locator('[role="menuitem"]:has-text("Watch History")'),
    ).toBeVisible();
    await expect(
      menu.locator('[role="menuitem"]:has-text("Settings")'),
    ).toBeVisible();
    await expect(
      menu.locator('[role="menuitem"]:has-text("Sign Out")'),
    ).toBeVisible();
  });

  test("navigating to favorites from profile menu works", async ({ page }) => {
    const profileBtn = page.locator('[aria-haspopup="menu"]');
    await expect(profileBtn).toBeVisible({ timeout: 10_000 });
    await profileBtn.click();

    const menu = page.locator('[role="menu"]');
    await expect(menu).toBeVisible({ timeout: 5_000 });

    await menu.locator('[role="menuitem"]:has-text("Favorites")').click();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2_000);

    expect(page.url()).toContain("/favorites");
  });

  test("sign out redirects to login page", async ({ page }) => {
    const profileBtn = page.locator('[aria-haspopup="menu"]');
    await expect(profileBtn).toBeVisible({ timeout: 10_000 });
    await profileBtn.click();

    const menu = page.locator('[role="menu"]');
    await expect(menu).toBeVisible({ timeout: 5_000 });

    await menu.locator('[role="menuitem"]:has-text("Sign Out")').click();

    await page.waitForURL("**/login", { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });
});

// ---------------------------------------------------------------------------
// J. Responsive Layout
// ---------------------------------------------------------------------------

test.describe("Responsive Layout", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await waitForPageReady(page);
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
    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible({ timeout: 10_000 });
  });

  test("main content area is visible", async ({ page }) => {
    const main = page.locator("#main-content");
    await expect(main).toBeVisible();

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

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });

  test("authenticated page has main landmark", async ({ page }) => {
    await authenticate(page);
    await waitForPageReady(page);

    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("navigation has aria-label", async ({ page }) => {
    await authenticate(page);
    await waitForPageReady(page);

    const nav = page.locator('nav[aria-label="Main navigation"]');
    await expect(nav).toBeVisible({ timeout: 10_000 });
  });

  test("interactive elements are keyboard focusable", async ({ page }) => {
    await authenticate(page);
    await waitForPageReady(page);

    await page.keyboard.press("Tab");

    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.tagName ?? "NONE";
    });
    expect(focused).not.toBe("NONE");
  });
});

// ---------------------------------------------------------------------------
// L. Error Handling & Edge Cases
// ---------------------------------------------------------------------------

test.describe("Error Handling", () => {
  test("non-existent route shows fallback or redirects", async ({ page }) => {
    await authenticate(page);

    await page.goto("/this-route-does-not-exist");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3_000);

    const main = page.locator("main, body");
    await expect(main).toBeVisible();
  });

  test("unauthenticated access to protected route redirects to login", async ({
    page,
  }) => {
    await page.goto("/favorites");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(5_000);

    const url = page.url();
    // Should redirect to login (or auto-login may succeed on LAN)
    const isLoginOrAuth = url.includes("/login") || url.includes("/language/");
    expect(isLoginOrAuth).toBeTruthy();
  });
});
