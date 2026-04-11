import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { fileURLToPath } from "url";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
    ...(process.env.ANALYZE === "true"
      ? [visualizer({ open: true, gzipSize: true, brotliSize: true })]
      : []),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@features": fileURLToPath(new URL("./src/features", import.meta.url)),
      "@shared": fileURLToPath(new URL("./src/shared", import.meta.url)),
      "@lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "tests/e2e/**"],
  },
  build: {
    // hls.js (523 KB raw / 162 KB gzip) always exceeds the 500 KB warning threshold.
    // It is loaded lazily (dynamic import in VideoElement) and excluded from the
    // initial load budget, so the warning is expected — raise the limit to suppress it.
    chunkSizeWarningLimit: 600,
    target: ["es2019", "chrome69"],
    rollupOptions: {
      output: {
        // Performance budget: total compressed ≤ 500 KB (excluding media-player chunks).
        //
        // Chunk breakdown (gzip):
        //   vendor-react       ~61 KB  (eagerly loaded)
        //   vendor-tanstack    ~43 KB  (eagerly loaded)
        //   vendor-spatial-nav  ~6 KB  (eagerly loaded via SpatialNavProvider)
        //   vendor-zustand      ~3 KB  (eagerly loaded via stores)
        //   index (app core)   ~20 KB  (after PlayerShell moved to lazy chunk)
        //   player-shell        ~? KB  (lazy — deferred after first render)
        //   vendor-hls        ~162 KB  (lazy — dynamic import in VideoElement)
        //   vendor-mpegts      ~64 KB  (lazy — dynamic import in VideoElement)
        //   page routes        ~60 KB  (lazy — loaded on navigation)
        //
        // Eagerly-loaded initial budget ≈ 130 KB gzip.
        manualChunks(id) {
          if (
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react/")
          ) {
            return "vendor-react";
          }
          if (id.includes("node_modules/@tanstack")) {
            return "vendor-tanstack";
          }
          if (id.includes("node_modules/@noriginmedia")) {
            return "vendor-spatial-nav";
          }
          if (id.includes("node_modules/zustand")) {
            return "vendor-zustand";
          }
          if (id.includes("node_modules/hls.js")) {
            return "vendor-hls";
          }
          if (id.includes("node_modules/mpegts")) {
            return "vendor-mpegts";
          }
        },
      },
    },
  },
} as UserConfig & { test: unknown });
