/**
 * Card CSS integrity tests (SRI-40)
 *
 * Verifies that no card component uses `transition-all` — a banned pattern for
 * TV/10-ft UI. On TV, `transition-all` causes jank because it picks up every
 * CSS property including layout-triggering ones. Cards must only transition
 * explicit properties (e.g. transition-[transform,opacity]).
 *
 * These are static analysis tests: they grep the source files rather than
 * rendering the components. This catches the issue at code-level, where no
 * runtime test would catch it (jsdom doesn't execute CSS).
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

// Card source directory (relative to project root, resolved at test time)
const CARDS_DIR = join(process.cwd(), "src/design-system/cards");

/**
 * Read all .tsx files in the cards directory (non-recursive — skips __tests__).
 * Returns { file, content } pairs.
 */
function readCardSourceFiles(): Array<{ file: string; content: string }> {
  return readdirSync(CARDS_DIR)
    .filter((f) => f.endsWith(".tsx") && !f.startsWith("__"))
    .map((f) => ({
      file: f,
      content: readFileSync(join(CARDS_DIR, f), "utf-8"),
    }));
}

describe("Card CSS integrity — no transition-all", () => {
  it("no card component uses transition-all (TV performance requirement)", () => {
    const files = readCardSourceFiles();
    expect(files.length).toBeGreaterThan(0); // guard: ensure files were found

    const violations: string[] = [];
    for (const { file, content } of files) {
      // Match the Tailwind class `transition-all` used as a class string.
      // Allow "transition-all" inside comments (lines starting with //).
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        const trimmed = line.trimStart();
        if (!trimmed.startsWith("//") && /\btransition-all\b/.test(line)) {
          violations.push(`${file}:${idx + 1} — ${line.trim()}`);
        }
      });
    }

    if (violations.length > 0) {
      // Provide a clear message listing every violation
      expect.fail(
        `transition-all found in card source files (banned for TV performance):\n` +
          violations.map((v) => `  • ${v}`).join("\n") +
          `\n\nFix: replace with explicit property transitions, e.g. transition-[transform,opacity].`,
      );
    }
    expect(violations).toHaveLength(0);
  });
});
