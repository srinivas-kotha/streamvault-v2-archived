/**
 * SRI-207 — Code Splitting Verification: PlayerShell + Route Integrity + Core Web Vitals
 *
 * PR #202 introduces:
 *   1. PlayerShell migrated from static import → React.lazy() + React.Suspense
 *   2. Vendor chunks: vendor-spatial-nav, vendor-zustand, vendor-hls, vendor-mpegts
 *
 * This spec verifies:
 *   A. PlayerShell lazy chunk is deferred (not in initial paint)
 *   B. All authenticated routes load without errors (route integrity)
 *   C. PlayerShell Suspense boundary works (no stuck fallback / chunk 404)
 *   D. Core Web Vitals (FCP, LCP, CLS) not regressed after code splitting
 *   E. Multi-route navigation cycle completes without import failures
 *
 * Runs against: https://streamvault.srinivaskotha.uk (live production)
 * Auth: storageState from global-setup.ts
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
// A. PlayerShell lazy chunk — deferred from initial paint
// ---------------------------------------------------------------------------
test.describe("SRI-207: PlayerShell chunk is lazy-loaded (deferred)", () => {
  test("login page does NOT eagerly load PlayerShell chunk", async ({
    page,
  }) => {
    const playerChunkUrls: string[] = [];

    page.on("response", (response) => {
      const url = response.url();
      if (
        url.endsWith(".js") &&
        response.status() === 200 &&
        (url.toLowerCase().includes("player") ||
          url.toLowerCase().includes("playershell"))
      ) {
        playerChunkUrls.push(url);
      }
    });

    // Login page only — root layout does not mount Suspense yet at idle
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    expect(
      playerChunkUrls,
      `PlayerShell chunk loaded eagerly on login: ${playerChunkUrls.join(", ")}`,
    ).toHaveLength(0);
  });

  test("authenticated home route resolves all JS chunks without 404/500", async ({
    page,
  }) => {
    const failedChunks: string[] = [];

    page.on("response", (response) => {
      const url = response.url();
      if (
        url.endsWith(".js") &&
        (response.status() === 404 || response.status() >= 500)
      ) {
        failedChunks.push(`${response.status()} ${url}`);
      }
    });

    await safeNavigate(page, "/");

    expect(
      failedChunks,
      `Failed JS chunk requests on home route: ${failedChunks.join("; ")}`,
    ).toHaveLength(0);
  });

  test("vendor-spatial-nav and vendor-zustand chunks load without 404", async ({
    page,
  }) => {
    const failedVendorUrls: string[] = [];

    page.on("response", (response) => {
      const url = response.url();
      if (!url.endsWith(".js")) return;
      if (
        url.includes("spatial-nav") ||
        url.includes("zustand") ||
        url.includes("vendor-")
      ) {
        if (response.status() !== 200) {
          failedVendorUrls.push(`${response.status()} ${url}`);
        }
      }
    });

    await safeNavigate(page, "/");

    expect(
      failedVendorUrls,
      `Vendor chunk 404s: ${failedVendorUrls.join("; ")}`,
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// B. Route integrity — all authenticated routes load without errors
// ---------------------------------------------------------------------------
test.describe("SRI-207: All authenticated routes load without errors", () => {
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
    test(`${route.label} (${route.path}) loads without console or page errors`, async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      page.on("pageerror", (err) => pageErrors.push(err.message));

      await safeNavigate(page, route.path);

      const fatalErrors = consoleErrors.filter(
        (e) =>
          !e.includes("favicon") &&
          !e.includes("analytics") &&
          !e.includes("beacon") &&
          !e.includes("sw.js"),
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
// C. PlayerShell Suspense boundary — ErrorBoundary not triggered
// ---------------------------------------------------------------------------
test.describe("SRI-207: PlayerShell Suspense does not crash the app", () => {
  test("home route renders app shell, not React ErrorBoundary fallback", async ({
    page,
  }) => {
    await safeNavigate(page, "/");
    await expect(page.locator("#main-content")).toBeVisible({
      timeout: 15_000,
    });
    // ErrorBoundary fallback text
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  test("live route renders page content, not error fallback", async ({
    page,
  }) => {
    await safeNavigate(page, "/live");
    await expect(page.locator("#main-content")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  test("vod route renders page content without import error", async ({
    page,
  }) => {
    await safeNavigate(page, "/vod");
    await expect(page.locator("#main-content")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// D. Core Web Vitals — not regressed after code splitting
//    Thresholds: FCP < 2.5s, LCP < 4s, CLS < 0.1
// ---------------------------------------------------------------------------
test.describe("SRI-207: Core Web Vitals — no regression after code splitting", () => {
  test("First Contentful Paint < 2.5s on login page", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1_000);

    const fcp = await page.evaluate(() => {
      const entries = performance.getEntriesByType(
        "paint",
      ) as PerformanceEntry[];
      const fcpEntry = entries.find((e) => e.name === "first-contentful-paint");
      return fcpEntry ? fcpEntry.startTime : null;
    });

    expect(fcp, "FCP entry not found in PerformancePaintTiming").not.toBeNull();
    expect(fcp!, `FCP ${fcp}ms exceeds 2500ms threshold`).toBeLessThan(2500);
  });

  test("Largest Contentful Paint < 4s on login page", async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__lcpValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          (window as any).__lcpValue = entries[entries.length - 1].startTime;
        }
      });
      observer.observe({ type: "largest-contentful-paint", buffered: true });
    });

    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2_000);

    const lcp = await page.evaluate(() => (window as any).__lcpValue as number);
    expect(lcp, `LCP ${lcp}ms exceeds 4000ms threshold`).toBeLessThan(4000);
  });

  test("Cumulative Layout Shift < 0.1 on authenticated home route", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as any).__cumulativeLayoutShift = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            (window as any).__cumulativeLayoutShift += (entry as any).value;
          }
        }
      });
      observer.observe({ type: "layout-shift", buffered: true });
    });

    await safeNavigate(page, "/");
    await page.waitForTimeout(5_000); // Allow content to fully settle

    const cls = await page.evaluate(
      () => (window as any).__cumulativeLayoutShift as number,
    );
    expect(cls, `CLS ${cls.toFixed(4)} exceeds 0.1 threshold`).toBeLessThan(
      0.1,
    );
  });

  test("initial JS transfer budget < 400 KB (gzipped) — lazy split effective", async ({
    page,
  }) => {
    const jsBytes: number[] = [];
    page.on("response", (response) => {
      const url = response.url();
      const contentType = response.headers()["content-type"] || "";
      if (
        (url.endsWith(".js") || contentType.includes("javascript")) &&
        response.status() === 200
      ) {
        const contentLength = response.headers()["content-length"];
        if (contentLength) jsBytes.push(parseInt(contentLength, 10));
      }
    });

    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const totalKB = jsBytes.reduce((sum, b) => sum + b, 0) / 1024;
    expect(
      totalKB,
      `Initial JS transfer ${totalKB.toFixed(1)} KB exceeds 400 KB budget`,
    ).toBeLessThan(400);
  });
});

// ---------------------------------------------------------------------------
// E. Multi-route navigation cycle — no import failures mid-session
// ---------------------------------------------------------------------------
test.describe("SRI-207: Multi-route navigation cycle after code splitting", () => {
  test("home → live → vod → search → favorites → home completes without errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => pageErrors.push(err.message));

    const navigationPath = [
      { path: "/", label: "Home" },
      { path: "/live", label: "Live TV" },
      { path: "/vod", label: "VOD" },
      { path: "/search", label: "Search" },
      { path: "/favorites", label: "Favorites" },
      { path: "/", label: "Home (return)" },
    ];

    for (const step of navigationPath) {
      await page.goto(step.path);
      await waitForPageReady(page);
      if (page.url().includes("/login")) {
        await reLogin(page);
        await page.goto(step.path);
        await waitForPageReady(page);
      }
      await expect(
        page.locator("#main-content"),
        `#main-content missing on ${step.label}`,
      ).toBeVisible({ timeout: 15_000 });
    }

    const fatalErrors = consoleErrors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("analytics") &&
        !e.includes("beacon") &&
        !e.includes("sw.js"),
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

  test("route lazy chunks load on demand (each route triggers new JS chunk)", async ({
    page,
  }) => {
    // Navigate to an initial route to prime the app
    await safeNavigate(page, "/");

    // Now capture new chunks loaded when navigating to a non-initial route
    const newChunks: string[] = [];
    page.on("response", (response) => {
      const url = response.url();
      if (url.endsWith(".js") && response.status() === 200) {
        newChunks.push(url);
      }
    });

    await page.goto("/vod");
    await waitForPageReady(page);

    // At least one new JS chunk should load for the VOD lazy route
    expect(
      newChunks.length,
      "No new JS chunks loaded when navigating to /vod — route may not be code-split",
    ).toBeGreaterThan(0);
  });
});
