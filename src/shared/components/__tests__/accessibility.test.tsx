/**
 * Sprint 6C — Accessibility Tests
 * Aggregate ARIA role checks across key components.
 * Verifies that components render with correct semantic roles and attributes,
 * and that source files contain required ARIA attributes.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { readFileSync } from "fs";
import { join } from "path";

const WORKTREE = join(import.meta.dirname, "../../..");

/** Read a source file relative to the worktree src/ directory */
function readSrc(relativePath: string): string {
  return readFileSync(join(WORKTREE, relativePath), "utf-8");
}

// ── SkipToContent ─────────────────────────────────────────────────────────────
import { SkipToContent } from "../SkipToContent";

describe("SkipToContent ARIA", () => {
  it("is a link (not a button)", () => {
    render(<SkipToContent />);
    expect(screen.getByRole("link")).toBeInTheDocument();
  });

  it("target href is #main-content", () => {
    render(<SkipToContent />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "#main-content");
  });

  it("has sr-only class to be visually hidden", () => {
    render(<SkipToContent />);
    expect(screen.getByRole("link").className).toContain("sr-only");
  });

  it("has focus:not-sr-only so it appears on focus", () => {
    render(<SkipToContent />);
    expect(screen.getByRole("link").className).toContain("focus:not-sr-only");
  });
});

// ── RouteAnnouncer ARIA ───────────────────────────────────────────────────────
vi.mock("@tanstack/react-router", () => ({
  useRouterState: ({
    select,
  }: {
    select: (s: { location: { pathname: string } }) => unknown;
  }) => select({ location: { pathname: "/home" } }),
}));

const { RouteAnnouncer } = await import("../RouteAnnouncer");

describe("RouteAnnouncer ARIA attributes", () => {
  it('uses aria-live="polite"', () => {
    render(<RouteAnnouncer />);
    expect(screen.getByTestId("route-announcer")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it('uses aria-atomic="true"', () => {
    render(<RouteAnnouncer />);
    expect(screen.getByTestId("route-announcer")).toHaveAttribute(
      "aria-atomic",
      "true",
    );
  });

  it("is visually hidden (sr-only)", () => {
    render(<RouteAnnouncer />);
    expect(screen.getByTestId("route-announcer").className).toContain(
      "sr-only",
    );
  });
});

// ── ProgressBar ARIA (via source check) ──────────────────────────────────────
describe("ProgressBar ARIA source check", () => {
  const src = readSrc("features/player/components/controls/ProgressBar.tsx");

  it('has role="slider" (interactive seek element)', () => {
    expect(src).toContain('role="slider"');
  });

  it('has aria-label="Video progress"', () => {
    expect(src).toContain('aria-label="Video progress"');
  });

  it("has aria-valuemin", () => {
    expect(src).toContain("aria-valuemin");
  });

  it("has aria-valuemax", () => {
    expect(src).toContain("aria-valuemax");
  });

  it("has aria-valuenow", () => {
    expect(src).toContain("aria-valuenow");
  });

  it("has aria-valuetext with human-readable duration", () => {
    expect(src).toContain("aria-valuetext");
  });
});

// ── DesktopControls toolbar ARIA (source check) ───────────────────────────────
describe("DesktopControls toolbar ARIA", () => {
  const src = readSrc(
    "features/player/components/controls/DesktopControls.tsx",
  );

  it('controls bar has role="toolbar"', () => {
    expect(src).toContain('role="toolbar"');
  });

  it('controls bar has aria-label="Player controls"', () => {
    expect(src).toContain('aria-label="Player controls"');
  });

  it("volume slider has aria-valuemin", () => {
    expect(src).toContain("aria-valuemin");
  });

  it("volume slider has aria-valuemax", () => {
    expect(src).toContain("aria-valuemax");
  });
});

// ── TVControls ARIA (source check) ───────────────────────────────────────────
describe("TVControls toolbar ARIA", () => {
  const src = readSrc("features/player/components/controls/TVControls.tsx");

  it('controls row has role="toolbar"', () => {
    expect(src).toContain('role="toolbar"');
  });

  it('controls row has aria-label="Player controls"', () => {
    expect(src).toContain('aria-label="Player controls"');
  });

  it('progress bar has role="progressbar"', () => {
    expect(src).toContain('role="progressbar"');
  });
});

// ── MobileControls ARIA (source check) ───────────────────────────────────────
describe("MobileControls progress bar ARIA", () => {
  const src = readSrc("features/player/components/controls/MobileControls.tsx");

  it('progress bar has role="progressbar"', () => {
    expect(src).toContain('role="progressbar"');
  });

  it('progress bar has aria-label="Video progress"', () => {
    expect(src).toContain('aria-label="Video progress"');
  });
});

// ── LoginPage form ARIA (source check) ───────────────────────────────────────
describe("LoginPage form ARIA", () => {
  const src = readSrc("features/auth/components/LoginPage.tsx");

  it("inputs have aria-invalid attribute", () => {
    expect(src).toContain("aria-invalid");
  });

  it("inputs have aria-describedby pointing to error id", () => {
    expect(src).toContain("aria-describedby");
  });

  it('inline field errors have role="alert"', () => {
    expect(src).toContain('role="alert"');
  });

  it("auth error message has aria-live", () => {
    expect(src).toContain("aria-live");
  });
});

// ── SearchPage landmark ARIA (source check) ───────────────────────────────────
describe("SearchPage search landmark", () => {
  const src = readSrc("features/search/components/SearchPage.tsx");

  it('search input is wrapped in role="search"', () => {
    expect(src).toContain('role="search"');
  });

  it('input does not have redundant role="searchbox" (inside role="search" container)', () => {
    expect(src).not.toContain('role="searchbox"');
  });
});

// ── TopNav ARIA (source check) ────────────────────────────────────────────────
describe("TopNav navigation ARIA", () => {
  const src = readSrc("shared/components/TopNav.tsx");

  it('nav elements have aria-label="Main navigation"', () => {
    expect(src).toContain('aria-label="Main navigation"');
  });

  it("profile button has aria-expanded", () => {
    expect(src).toContain("aria-expanded");
  });

  it("profile button has aria-haspopup", () => {
    expect(src).toContain("aria-haspopup");
  });

  it('profile dropdown has role="menu"', () => {
    expect(src).toContain('role="menu"');
  });

  it('dropdown items have role="menuitem"', () => {
    expect(src).toContain('role="menuitem"');
  });
});
