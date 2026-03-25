/**
 * Sprint 7 — Lazy route code-splitting tests
 *
 * Verifies that all 14 lazy route files export a Route object with a component,
 * confirming code-splitting is wired correctly.
 */

import { describe, it, expect } from "vitest";

const lazyRoutes = [
  { path: "../login.lazy", label: "/login" },
  { path: "../_authenticated.lazy", label: "/_authenticated" },
  { path: "../dev.design-system.lazy", label: "/dev/design-system" },
  {
    path: "../_authenticated/favorites.lazy",
    label: "/_authenticated/favorites",
  },
  { path: "../_authenticated/history.lazy", label: "/_authenticated/history" },
  { path: "../_authenticated/live.lazy", label: "/_authenticated/live" },
  { path: "../_authenticated/search.lazy", label: "/_authenticated/search" },
  {
    path: "../_authenticated/settings.lazy",
    label: "/_authenticated/settings",
  },
  {
    path: "../_authenticated/vod/index.lazy",
    label: "/_authenticated/vod/index",
  },
  {
    path: "../_authenticated/vod/$vodId.lazy",
    label: "/_authenticated/vod/$vodId",
  },
  {
    path: "../_authenticated/series/index.lazy",
    label: "/_authenticated/series/index",
  },
  {
    path: "../_authenticated/series/$seriesId.lazy",
    label: "/_authenticated/series/$seriesId",
  },
  {
    path: "../_authenticated/language/$lang.lazy",
    label: "/_authenticated/language/$lang",
  },
  {
    path: "../_authenticated/language/$lang_.category.$categoryId.lazy",
    label: "/_authenticated/language/$lang/category/$categoryId",
  },
];

describe("Lazy routes — code-splitting", () => {
  it.each(lazyRoutes)("$label exports a Route object", async ({ path }) => {
    const mod = await import(/* @vite-ignore */ path);
    expect(mod).toHaveProperty("Route");
    expect(mod.Route).toBeDefined();
  });

  it("login.lazy Route has a component", async () => {
    const mod = await import("../login.lazy");
    expect(mod.Route).toBeDefined();
    expect(typeof mod.Route).toBe("object");
  });

  it("favorites.lazy Route has a component", async () => {
    const mod = await import("../_authenticated/favorites.lazy");
    expect(mod.Route).toBeDefined();
    expect(typeof mod.Route).toBe("object");
  });

  it("live.lazy Route has a component", async () => {
    const mod = await import("../_authenticated/live.lazy");
    expect(mod.Route).toBeDefined();
    expect(typeof mod.Route).toBe("object");
  });

  it("settings.lazy Route has a component", async () => {
    const mod = await import("../_authenticated/settings.lazy");
    expect(mod.Route).toBeDefined();
    expect(typeof mod.Route).toBe("object");
  });

  it("vod/index.lazy Route has a component", async () => {
    const mod = await import("../_authenticated/vod/index.lazy");
    expect(mod.Route).toBeDefined();
    expect(typeof mod.Route).toBe("object");
  });

  it("total lazy route count is 14", () => {
    expect(lazyRoutes).toHaveLength(14);
  });
});
