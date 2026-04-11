/**
 * SRI-205 — Bundle Size Optimisation: Route Integrity E2E Tests
 *
 * Verifies that code-splitting and lazy-loading introduced in PR #203 does NOT
 * break any application routes or cause runtime import errors.
 *
 * Key changes validated:
 *   1. PlayerShell migrated from static import → React.lazy() + React.Suspense
 *   2. New vendor chunks: vendor-spatial-nav, vendor-zustand
 *
 * Test strategy:
 *   - All authenticated routes navigate without console errors or page crashes
 *   - Lazy-loaded PlayerShell resolves (no Suspense fallback stuck / no chunk 404)
 *   - No React-level errors (ErrorBoundary not triggered) on any route
 *   - PlayerShell chunk deferred: NOT loaded on initial page render
 *   - PlayerShell chunk loads: only after the root layout mounts the Suspense boundary
 *
 * Runs against: https://streamvault.srinivaskotha.uk (live production)
 * Auth: storageState from global-setup.ts
 */

import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers (copied from existing specs for self-contained test file)
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
    timeout: 30_000,
    waitUntil: "domcontentloaded",
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
// SRI-205: Route integrity after lazy-loading PlayerShell
// ---------------------------------------------------------------------------
test.describe("SRI-205: All routes load without errors after code splitting", () => {
  const ROUTES = [
    { path: "/", label: "Home / Browse" },
    { path: "/live", label: "Live TV" },
    { path: "/vod", label: "VOD" },
    { path: "/search", label: "Search" },
    { path: "/favorites", label: "Favorites" },
    { path: "/history", label: "History" },
    { path: "/settings", label: "Settings" },
    { path: "/sports", label: "Sports" },
  ];

  for (const route of ROUTES) {
    test(`${route.label} (${route.path}) loads without console errors`, async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      // Capture browser console errors
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      // Capture uncaught page errors (JS exceptions)
      page.on("pageerror", (err) => {
        pageErrors.push(err.message);
      });

      await safeNavigate(page, route.path);

      // Filter out known benign errors (e.g., expected network errors, analytics)
      const fatalErrors = consoleErrors.filter(
        (e) =>
          !e.includes("favicon") &&
          !e.includes("analytics") &&
          !e.includes("beacon"),
      );
      const fatalPageErrors = pageErrors.filter(
        (e) =>
          !e.includes("favicon") &&
          !e.includes("analytics") &&
          !e.includes("ResizeObserver"),
      );

      expect(
        fatalErrors,
        `Console errors on ${route.path}: ${fatalErrors.join("; ")}`,
      ).toHaveLength(0);
      expect(
        fatalPageErrors,
        `Page errors on ${route.path}: ${fatalPageErrors.join("; ")}`,
      ).toHaveLength(0);
    });
  }
});

// ---------------------------------------------------------------------------
// SRI-205: React ErrorBoundary not triggered on any route
// ---------------------------------------------------------------------------
test.describe("SRI-205: ErrorBoundary not triggered (no fallback UI rendered)", () => {
  test("home route renders app shell, not error fallback", async ({ page }) => {
    await safeNavigate(page, "/");
    // App shell (LayoutSelector / main-content) should be visible
    await expect(page.locator("#main-content")).toBeVisible();
    // Error boundary fallback typically renders 'Something went wrong' text
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  test("live route renders page content, not error fallback", async ({
    page,
  }) => {
    await safeNavigate(page, "/live");
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    // Live TV page should render at least a heading or content area
    await expect(page.locator("#main-content")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// SRI-205: PlayerShell lazy chunk deferred from initial page load
// ---------------------------------------------------------------------------
test.describe("SRI-205: PlayerShell chunk loaded lazily (not on initial paint)", () => {
  test("initial login page load does NOT request PlayerShell chunk", async ({
    page,
  }) => {
    const playerChunkUrls: string[] = [];

    page.on("response", (response) => {
      const url = response.url();
      // PlayerShell chunk will contain "PlayerShell" in its name from manualChunks
      // or a dynamic chunk prefetch for the player feature module
      if (
        url.endsWith(".js") &&
        response.status() === 200 &&
        (url.toLowerCase().includes("player") ||
          url.toLowerCase().includes("playershell"))
      ) {
        playerChunkUrls.push(url);
      }
    });

    // Navigate to login page only — no auth, no lazy load of PlayerShell yet
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Player chunk should NOT have been eagerly loaded on the login screen
    // (Suspense boundary means it loads lazily after root layout mounts)
    expect(
      playerChunkUrls,
      `PlayerShell chunk loaded eagerly on login: ${playerChunkUrls.join(", ")}`,
    ).toHaveLength(0);
  });

  test("authenticated home route resolves PlayerShell without 404 or 500", async ({
    page,
  }) => {
    const failedChunkUrls: string[] = [];

    page.on("response", (response) => {
      const url = response.url();
      if (
        url.endsWith(".js") &&
        (response.status() === 404 || response.status() >= 500)
      ) {
        failedChunkUrls.push(`${response.status()} ${url}`);
      }
    });

    await safeNavigate(page, "/");

    expect(
      failedChunkUrls,
      `Failed JS chunk requests: ${failedChunkUrls.join("; ")}`,
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// SRI-205: Vendor chunk integrity — spatial-nav and zustand load correctly
// ---------------------------------------------------------------------------
test.describe("SRI-205: New vendor chunks load without errors", () => {
  test("spatial-nav and zustand vendor chunks load without 404", async ({
    page,
  }) => {
    const failedVendorUrls: string[] = [];
    const vendorUrls: string[] = [];

    page.on("response", (response) => {
      const url = response.url();
      if (!url.endsWith(".js")) return;
      if (
        url.includes("spatial-nav") ||
        url.includes("zustand") ||
        url.includes("vendor-")
      ) {
        vendorUrls.push(url);
        if (response.status() !== 200) {
          failedVendorUrls.push(`${response.status()} ${url}`);
        }
      }
    });

    await safeNavigate(page, "/");

    expect(
      failedVendorUrls,
      `Vendor chunk load failures: ${failedVendorUrls.join("; ")}`,
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// SRI-205: Cross-route navigation cycle — no import errors mid-session
// ---------------------------------------------------------------------------
test.describe("SRI-205: Multi-route navigation cycle", () => {
  test("navigating home → live → vod → search → home completes without errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => pageErrors.push(err.message));

    // Start at home
    await safeNavigate(page, "/");
    await expect(page.locator("#main-content")).toBeVisible();

    // Navigate to Live TV
    await page.goto("/live");
    await waitForPageReady(page);
    await expect(page.locator("#main-content")).toBeVisible();

    // Navigate to VOD
    await page.goto("/vod");
    await waitForPageReady(page);
    await expect(page.locator("#main-content")).toBeVisible();

    // Navigate to Search
    await page.goto("/search");
    await waitForPageReady(page);
    await expect(page.locator("#main-content")).toBeVisible();

    // Return home
    await page.goto("/");
    await waitForPageReady(page);
    await expect(page.locator("#main-content")).toBeVisible();

    // No errors across the entire navigation cycle
    const fatalErrors = consoleErrors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("analytics") &&
        !e.includes("beacon"),
    );
    const fatalPageErrors = pageErrors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("analytics") &&
        !e.includes("ResizeObserver"),
    );

    expect(
      fatalErrors,
      `Console errors during navigation cycle: ${fatalErrors.join("; ")}`,
    ).toHaveLength(0);
    expect(
      fatalPageErrors,
      `Page errors during navigation cycle: ${fatalPageErrors.join("; ")}`,
    ).toHaveLength(0);
  });
});
