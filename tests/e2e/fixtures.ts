import { test as base, expect, type Page } from "@playwright/test";

/**
 * Authenticate against the production StreamVault login page.
 * Reads E2E_USERNAME and E2E_PASSWORD from process.env (loaded via dotenv in playwright.config.ts).
 */
export async function authenticate(page: Page): Promise<void> {
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "E2E_USERNAME and E2E_PASSWORD must be set in .env or environment",
    );
  }

  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");

  // Fill login form — inputs have id="username" and id="password"
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);

  // Submit
  await page.locator("#login-submit").click();

  // Wait for redirect away from login (home redirects to /language/telugu)
  await page.waitForURL("**/language/**", { timeout: 15_000 });
}

/**
 * Extended test fixture that pre-authenticates before each test.
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await authenticate(page);
    await use(page);
  },
});

export { expect };
