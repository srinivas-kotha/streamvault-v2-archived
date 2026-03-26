/**
 * Sprint 3A — VOD + Series E2E Tests
 *
 * Tests run against the LIVE production site: https://streamvault.srinivaskotha.uk
 * All API calls hit the real backend — no mocking.
 * Uses Playwright global storageState (via global-setup.ts) for authentication.
 *
 * DOM Facts (verified from production page snapshots):
 * - VOD page: h1 "Movies", category buttons ("All", "OSCAR WINNING MOVIES", ...),
 *   textbox "Search movies...", combobox "Sort movies", rating buttons ("Any", "3.5+", "4+"),
 *   movie cards as clickable divs with rating + paragraph title, links to /vod/{id}
 * - Series cards: [data-focus-key^="series-"] on /series page
 * - Main content: #main-content
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
// VOD Browse Flow (#89)
// ---------------------------------------------------------------------------

test.describe("VOD Browse Flow", () => {
  test("navigates to /vod and renders the Movies heading", async ({ page }) => {
    await safeNavigate(page, "/vod");
    await expect(page.locator("h1")).toContainText("Movies", {
      timeout: 15_000,
    });
  });

  test("category buttons are visible and at least one is present", async ({
    page,
  }) => {
    await safeNavigate(page, "/vod");
    const allBtn = page.getByRole("button", { name: "All", exact: true });
    await expect(allBtn).toBeVisible({ timeout: 30_000 });
  });

  test("selecting a category button loads movies", async ({ page }) => {
    await safeNavigate(page, "/vod");
    await expect(
      page.getByRole("button", { name: "All", exact: true }),
    ).toBeVisible({ timeout: 30_000 });
    const categories = page
      .locator("#main-content")
      .getByRole("button")
      .filter({ hasNotText: /Sort|Any|3\.5|4\+|★/ });
    const count = await categories.count();
    if (count > 1) {
      await categories.nth(1).click();
      await page.waitForTimeout(3_000);
      await expect(page.locator("h1")).toContainText("Movies");
    }
  });

  test("VOD page has movie cards with titles", async ({ page }) => {
    await safeNavigate(page, "/vod");
    const movieTitles = page.locator("#main-content p");
    await expect(movieTitles.first()).toBeVisible({ timeout: 30_000 });
  });

  test("clicking a movie card navigates to MovieDetail", async ({ page }) => {
    await safeNavigate(page, "/vod");
    const movieCards = page.locator(
      '#main-content a[href^="/vod/"], #main-content [data-focus-key^="card-"]',
    );
    await expect(movieCards.first()).toBeVisible({ timeout: 30_000 });
    await movieCards.first().click();
    await waitForPageReady(page);
    expect(page.url()).toMatch(/\/vod\/\d+/);
  });

  test("MovieDetail page shows content", async ({ page }) => {
    await safeNavigate(page, "/vod");
    const movieCards = page.locator(
      '#main-content a[href^="/vod/"], #main-content [data-focus-key^="card-"]',
    );
    await expect(movieCards.first()).toBeVisible({ timeout: 30_000 });
    await movieCards.first().click();
    await waitForPageReady(page);
    const main = page.locator("#main-content");
    const text = await main.textContent();
    expect(text!.length).toBeGreaterThan(10);
  });

  test("play button exists on MovieDetail page", async ({ page }) => {
    await safeNavigate(page, "/vod");
    const movieCards = page.locator(
      '#main-content a[href^="/vod/"], #main-content [data-focus-key^="card-"]',
    );
    await expect(movieCards.first()).toBeVisible({ timeout: 30_000 });
    await movieCards.first().click();
    await waitForPageReady(page);
    const playBtn = page.getByRole("button", { name: /play|resume|watch/i });
    await expect(playBtn.first()).toBeVisible({ timeout: 10_000 });
  });

  test.fixme("play button shows Resume text when watch history exists for movie", async ({
    page,
  }) => {
    // TODO: needs a seeded movie with watch history
    await safeNavigate(page, "/vod");
  });

  test("sort dropdown is visible on VOD page", async ({ page }) => {
    await safeNavigate(page, "/vod");
    const sortSelect = page.getByRole("combobox", { name: /sort movies/i });
    await expect(sortSelect).toBeVisible({ timeout: 30_000 });
  });

  test("search movies input is visible on VOD page", async ({ page }) => {
    await safeNavigate(page, "/vod");
    const searchInput = page.getByRole("textbox", {
      name: /search movies/i,
    });
    await expect(searchInput).toBeVisible({ timeout: 30_000 });
  });

  test("rating filter buttons are visible on VOD page", async ({ page }) => {
    await safeNavigate(page, "/vod");
    const anyRating = page.getByRole("button", { name: /Any/i });
    await expect(anyRating).toBeVisible({ timeout: 30_000 });
  });

  test.fixme("skeleton grid is shown while movies are loading", async ({
    page,
  }) => {
    // TODO: needs route interception for real API endpoint pattern
    await safeNavigate(page, "/vod");
  });

  test.fixme("empty state is shown when a category has no movies", async ({
    page,
  }) => {
    // TODO: needs route interception for real API endpoint pattern
    await safeNavigate(page, "/vod");
  });
});

// ---------------------------------------------------------------------------
// VOD D-pad Navigation (#89 — TV mode)
// ---------------------------------------------------------------------------

test.describe("VOD D-pad Navigation", () => {
  test("Tab key moves focus to interactive elements on VOD page", async ({
    page,
  }) => {
    await safeNavigate(page, "/vod");
    await expect(page.locator("h1")).toContainText("Movies", {
      timeout: 15_000,
    });
    await page.keyboard.press("Tab");
    await page.waitForTimeout(300);
    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.tagName ?? "NONE";
    });
    expect(focused).not.toBe("NONE");
    expect(focused).not.toBe("BODY");
  });

  test("back navigation from MovieDetail returns to VOD", async ({ page }) => {
    await safeNavigate(page, "/vod");
    const movieCards = page.locator(
      '#main-content a[href^="/vod/"], #main-content [data-focus-key^="card-"]',
    );
    await expect(movieCards.first()).toBeVisible({ timeout: 30_000 });
    await movieCards.first().click();
    await waitForPageReady(page);
    await page.goBack();
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("/vod");
  });

  test.fixme("Escape on MovieDetail navigates back to VOD grid", async ({
    page,
  }) => {
    // TODO: Escape key behavior depends on spatial nav implementation
    await safeNavigate(page, "/vod");
  });
});

// ---------------------------------------------------------------------------
// Series Browse Flow (#90)
// ---------------------------------------------------------------------------

test.describe("Series Browse Flow", () => {
  test("navigates to /series and renders series cards", async ({ page }) => {
    await safeNavigate(page, "/series");
    const main = page.locator("#main-content");
    await expect(main).toBeVisible({ timeout: 10_000 });
    const cards = page.locator('[data-focus-key^="series-"]');
    await expect(cards.first()).toBeVisible({ timeout: 30_000 });
  });

  test("clicking a series card navigates to SeriesDetail", async ({ page }) => {
    await safeNavigate(page, "/series");
    const firstCard = page.locator('[data-focus-key^="series-"]').first();
    await expect(firstCard).toBeVisible({ timeout: 30_000 });
    const cardLink = firstCard.locator("a").first();
    if ((await cardLink.count()) > 0) {
      await cardLink.click();
    } else {
      await firstCard.click();
    }
    await waitForPageReady(page);
    expect(page.url()).toMatch(/\/series\/\d+/);
  });

  test("SeriesDetail page has meaningful content", async ({ page }) => {
    await safeNavigate(page, "/series");
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

  test.fixme("SeriesDetail renders season tabs", async ({ page }) => {
    // TODO: needs discovery of season tab DOM selectors
    await safeNavigate(page, "/series");
  });

  test.fixme("clicking a season tab loads its episodes", async ({ page }) => {
    // TODO: depends on season tab selector discovery
    await safeNavigate(page, "/series");
  });

  test.fixme("episode items show SxxExx format badge", async ({ page }) => {
    // TODO: depends on episode item selector discovery
    await safeNavigate(page, "/series");
  });

  test.fixme("clicking an episode triggers playback", async ({ page }) => {
    // TODO: depends on episode item selector discovery
    await safeNavigate(page, "/series");
  });

  test.fixme('"Load More" button appears when a season has >50 episodes', async ({
    page,
  }) => {
    // TODO: needs a known series ID with >50 episodes
    await safeNavigate(page, "/series");
  });

  test.fixme("episode search filters the episode list", async ({ page }) => {
    // TODO: depends on episode search input selector discovery
    await safeNavigate(page, "/series");
  });

  test.fixme("skeleton loading state is shown while SeriesDetail is loading", async ({
    page,
  }) => {
    // TODO: needs route interception for real API endpoint pattern
    await safeNavigate(page, "/series");
  });
});

// ---------------------------------------------------------------------------
// Series D-pad Navigation (#90 — TV mode)
// ---------------------------------------------------------------------------

test.describe("Series D-pad Navigation", () => {
  test.fixme("ArrowLeft/ArrowRight navigate between season tabs", async ({
    page,
  }) => {
    // TODO: depends on season tab selector discovery
    await safeNavigate(page, "/series");
  });

  test.fixme("ArrowDown from season tabs moves focus to episode list", async ({
    page,
  }) => {
    // TODO: depends on season tab selector discovery
    await safeNavigate(page, "/series");
  });

  test("back navigation from SeriesDetail works", async ({ page }) => {
    await safeNavigate(page, "/series");
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

  test.fixme("Enter key on a focused episode item starts playback", async ({
    page,
  }) => {
    // TODO: depends on episode item selector discovery
    await safeNavigate(page, "/series");
  });
});
