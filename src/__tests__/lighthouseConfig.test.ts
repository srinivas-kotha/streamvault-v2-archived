/**
 * Sprint 7 — Lighthouse CI configuration validation tests
 *
 * Ensures .lighthouserc.cjs has correct structure and performance thresholds.
 */

import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { resolve } from "path";

// Import the config directly — CJS require via dynamic import
const configPath = resolve(__dirname, "../../.lighthouserc.cjs");

describe("Lighthouse CI config", () => {
  it("config file exists at project root", () => {
    expect(existsSync(configPath)).toBe(true);
  });

  it("has ci.collect section with URLs", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require(configPath);
    expect(config).toHaveProperty("ci");
    expect(config.ci).toHaveProperty("collect");
    expect(config.ci.collect).toHaveProperty("url");
    expect(Array.isArray(config.ci.collect.url)).toBe(true);
    expect(config.ci.collect.url.length).toBeGreaterThan(0);
  });

  it("collects from localhost preview server", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require(configPath);
    const urls: string[] = config.ci.collect.url;
    expect(urls.some((u) => u.includes("localhost"))).toBe(true);
  });

  it("has ci.assert section with assertions", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require(configPath);
    expect(config.ci).toHaveProperty("assert");
    expect(config.ci.assert).toHaveProperty("assertions");
  });

  it("performance threshold is >= 0.9", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require(configPath);
    const perfAssertion = config.ci.assert.assertions["categories:performance"];
    expect(perfAssertion).toBeDefined();
    // Format: ["error", { minScore: 0.9 }]
    expect(perfAssertion[1].minScore).toBeGreaterThanOrEqual(0.9);
  });

  it("accessibility threshold is >= 0.8", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require(configPath);
    const a11yAssertion =
      config.ci.assert.assertions["categories:accessibility"];
    expect(a11yAssertion).toBeDefined();
    expect(a11yAssertion[1].minScore).toBeGreaterThanOrEqual(0.8);
  });

  it("CLS threshold is <= 0.1", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require(configPath);
    const clsAssertion = config.ci.assert.assertions["cumulative-layout-shift"];
    expect(clsAssertion).toBeDefined();
    expect(clsAssertion[1].maxNumericValue).toBeLessThanOrEqual(0.1);
  });

  it("LCP threshold is <= 4000ms", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require(configPath);
    const lcpAssertion =
      config.ci.assert.assertions["largest-contentful-paint"];
    expect(lcpAssertion).toBeDefined();
    expect(lcpAssertion[1].maxNumericValue).toBeLessThanOrEqual(4000);
  });

  it("FCP threshold is <= 2500ms", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require(configPath);
    const fcpAssertion = config.ci.assert.assertions["first-contentful-paint"];
    expect(fcpAssertion).toBeDefined();
    expect(fcpAssertion[1].maxNumericValue).toBeLessThanOrEqual(2500);
  });

  it("TBT threshold is <= 300ms", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require(configPath);
    const tbtAssertion = config.ci.assert.assertions["total-blocking-time"];
    expect(tbtAssertion).toBeDefined();
    expect(tbtAssertion[1].maxNumericValue).toBeLessThanOrEqual(300);
  });

  it("has ci.upload section", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require(configPath);
    expect(config.ci).toHaveProperty("upload");
    expect(config.ci.upload).toHaveProperty("target");
  });

  it("runs 3 times for statistical significance", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = require(configPath);
    expect(config.ci.collect.numberOfRuns).toBeGreaterThanOrEqual(3);
  });
});
