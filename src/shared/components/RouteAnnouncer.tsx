/**
 * Sprint 6C — Accessibility
 * RouteAnnouncer: announces route changes to screen readers via aria-live.
 * Listens to TanStack Router location changes and announces the new page.
 * Uses a polite live region so it doesn't interrupt ongoing announcements.
 */
import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

/** Map route pathnames to human-readable page names for announcements */
function getPageName(pathname: string): string {
  // Strip leading slash and split
  const parts = pathname.replace(/^\//, "").split("/");
  const first = parts[0];

  const names: Record<string, string> = {
    "": "Home",
    home: "Home",
    live: "Live TV",
    vod: "Movies",
    series: "Series",
    search: "Search",
    favorites: "Favorites",
    history: "Watch History",
    settings: "Settings",
    login: "Sign In",
  };

  return (first !== undefined ? names[first] : undefined) ?? "Page loaded";
}

export function RouteAnnouncer() {
  const location = useRouterState({ select: (s) => s.location });
  const [message, setMessage] = useState("");
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    const { pathname } = location;

    // Skip the very first render (page load) to avoid an announcement on mount
    if (prevPathnameRef.current === null) {
      prevPathnameRef.current = pathname;
      return;
    }

    // Only announce if the pathname actually changed
    if (prevPathnameRef.current === pathname) return;
    prevPathnameRef.current = pathname;

    const pageName = getPageName(pathname);
    // Clear then set to ensure re-announcement on the same page (e.g., search query change)
    setMessage("");
    // Small tick to allow the DOM to clear before announcing
    const id = requestAnimationFrame(() => {
      setMessage(`Navigated to ${pageName}`);
    });

    return () => cancelAnimationFrame(id);
  }, [location]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      // Visually hidden — screen reader only
      className="sr-only"
      data-testid="route-announcer"
    >
      {message}
    </div>
  );
}
