/**
 * Sprint 6C — Accessibility
 * SkipToContent: visually hidden link that becomes visible on keyboard focus.
 * Must be the FIRST focusable element in the DOM — placed at top of RootLayout.
 * Targets #main-content to allow keyboard users to bypass navigation.
 */

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className={[
        // Visually hidden by default
        "sr-only",
        // Visible when focused (keyboard navigation)
        "focus:not-sr-only",
        // Positioning and appearance when visible
        "focus:fixed focus:top-4 focus:left-4 focus:z-[9999]",
        "focus:px-4 focus:py-2 focus:rounded-lg",
        "focus:bg-teal focus:text-obsidian focus:font-semibold focus:text-sm",
        "focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-obsidian",
        "focus:shadow-lg",
        // Smooth transition when it appears
        "transition-none",
      ].join(" ")}
    >
      Skip to main content
    </a>
  );
}
