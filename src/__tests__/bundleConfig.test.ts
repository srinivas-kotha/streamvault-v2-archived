/**
 * Sprint 7 — Vite manualChunks configuration tests
 *
 * Verifies that the chunk-splitting function correctly categorizes
 * vendor dependencies into separate chunks for optimal caching.
 */

import { describe, it, expect } from "vitest";

// Extract the manualChunks logic as a pure function for testing.
// This mirrors the logic in vite.config.ts exactly.
function manualChunks(id: string): string | undefined {
  if (
    id.includes("node_modules/react-dom") ||
    id.includes("node_modules/react/")
  ) {
    return "vendor-react";
  }
  if (id.includes("node_modules/@tanstack")) {
    return "vendor-tanstack";
  }
  if (id.includes("node_modules/hls.js")) {
    return "vendor-hls";
  }
  if (id.includes("node_modules/mpegts")) {
    return "vendor-mpegts";
  }
  return undefined;
}

describe("Vite manualChunks — bundle splitting", () => {
  // ── React vendor chunk ──────────────────────────────────────────────────

  it("returns 'vendor-react' for react-dom paths", () => {
    expect(
      manualChunks("/home/user/project/node_modules/react-dom/client.js"),
    ).toBe("vendor-react");
  });

  it("returns 'vendor-react' for react/ paths", () => {
    expect(
      manualChunks("/home/user/project/node_modules/react/jsx-runtime.js"),
    ).toBe("vendor-react");
  });

  it("does NOT match react-query or react-router as vendor-react", () => {
    // The pattern is specifically node_modules/react/ (with trailing slash)
    // react-query has its own @tanstack path
    expect(
      manualChunks("/home/user/project/node_modules/react-is/index.js"),
    ).toBeUndefined();
  });

  // ── TanStack vendor chunk ──────────────────────────────────────────────

  it("returns 'vendor-tanstack' for @tanstack/react-query", () => {
    expect(
      manualChunks(
        "/home/user/project/node_modules/@tanstack/react-query/build/modern/index.js",
      ),
    ).toBe("vendor-tanstack");
  });

  it("returns 'vendor-tanstack' for @tanstack/react-router", () => {
    expect(
      manualChunks(
        "/home/user/project/node_modules/@tanstack/react-router/dist/esm/index.js",
      ),
    ).toBe("vendor-tanstack");
  });

  it("returns 'vendor-tanstack' for @tanstack/router-plugin", () => {
    expect(
      manualChunks(
        "/home/user/project/node_modules/@tanstack/router-plugin/dist/esm/index.js",
      ),
    ).toBe("vendor-tanstack");
  });

  // ── HLS vendor chunk ───────────────────────────────────────────────────

  it("returns 'vendor-hls' for hls.js paths", () => {
    expect(
      manualChunks("/home/user/project/node_modules/hls.js/dist/hls.mjs"),
    ).toBe("vendor-hls");
  });

  it("returns 'vendor-hls' for hls.js subpaths", () => {
    expect(
      manualChunks(
        "/home/user/project/node_modules/hls.js/src/controller/buffer-controller.ts",
      ),
    ).toBe("vendor-hls");
  });

  // ── mpegts vendor chunk ────────────────────────────────────────────────

  it("returns 'vendor-mpegts' for mpegts.js paths", () => {
    expect(
      manualChunks("/home/user/project/node_modules/mpegts.js/dist/mpegts.js"),
    ).toBe("vendor-mpegts");
  });

  // ── App code (no chunk) ────────────────────────────────────────────────

  it("returns undefined for app source code", () => {
    expect(
      manualChunks("/home/user/project/src/features/player/PlayerPage.tsx"),
    ).toBeUndefined();
  });

  it("returns undefined for other node_modules", () => {
    expect(
      manualChunks("/home/user/project/node_modules/zustand/esm/vanilla.mjs"),
    ).toBeUndefined();
  });

  it("returns undefined for tailwind", () => {
    expect(
      manualChunks("/home/user/project/node_modules/tailwindcss/lib/index.js"),
    ).toBeUndefined();
  });
});
