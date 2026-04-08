/**
 * Skill E2E Smoke Test — playwright-pro skill validation (SRI-170)
 *
 * Purpose: Validate playwright-pro skill works end-to-end by generating a real
 * interaction test following the skill's golden rules.
 *
 * Golden rules applied:
 * 1. getByRole() over CSS/XPath
 * 2. No page.waitForTimeout() — use web-first assertions
 * 3. expect(locator) auto-retry assertions
 * 4. Isolated tests — no shared state (no storageState dependency)
 * 5. baseURL overridden per-test to target Portfolio (no-auth smoke target)
 * 6. One behavior per test
 *
 * Target: Portfolio site at http://localhost:3000
 * Auth: None required (public site)
 */

import { test, expect } from "@playwright/test";

const PORTFOLIO_URL = "http://localhost:3000";

test.use({ baseURL: PORTFOLIO_URL, storageState: undefined });

// ─── Page load smoke ──────────────────────────────────────────────────────────

test.describe("Portfolio smoke — page load", () => {
  test("home page loads with a title", async ({ page }) => {
    await page.goto(PORTFOLIO_URL);
    await page.waitForLoadState("domcontentloaded");

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    // Page should not be a blank/error page
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("home page is not a 404 or error page", async ({ page }) => {
    const response = await page.goto(PORTFOLIO_URL);
    expect(response?.status()).toBeLessThan(400);
  });
});

// ─── Navigation smoke ─────────────────────────────────────────────────────────

test.describe("Portfolio smoke — navigation", () => {
  test("navigation element is accessible", async ({ page }) => {
    await page.goto(PORTFOLIO_URL);
    await page.waitForLoadState("domcontentloaded");

    // Golden Rule 1: prefer role selectors
    const nav = page.getByRole("navigation");
    await expect(nav.first()).toBeVisible({ timeout: 10_000 });
  });

  test("at least one link is visible in navigation", async ({ page }) => {
    await page.goto(PORTFOLIO_URL);
    await page.waitForLoadState("domcontentloaded");

    // Check nav links exist (role-based)
    const navLinks = page.getByRole("navigation").getByRole("link");
    await expect(navLinks.first()).toBeVisible({ timeout: 10_000 });
  });
});

// ─── Content smoke ────────────────────────────────────────────────────────────

test.describe("Portfolio smoke — content", () => {
  test("page has at least one heading", async ({ page }) => {
    await page.goto(PORTFOLIO_URL);
    await page.waitForLoadState("domcontentloaded");

    // Web-first: auto-retries until visible
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("resume route responds without error", async ({ page }) => {
    const response = await page.goto(`${PORTFOLIO_URL}/resume`);
    // Accept 200 or 404 (SPA may render client-side 404)
    // Key check: no 500 server error
    if (response) {
      expect(response.status()).not.toBe(500);
    }
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("unknown route shows content (no blank page)", async ({ page }) => {
    await page.goto(`${PORTFOLIO_URL}/nonexistent-route-xyz-123`);
    await page.waitForLoadState("domcontentloaded");

    // SPA should render something — not a blank page
    const bodyText = await page.locator("body").textContent();
    expect((bodyText ?? "").trim().length).toBeGreaterThan(0);
  });
});
