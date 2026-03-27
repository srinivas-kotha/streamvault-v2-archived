/**
 * SeekIndicator: shows ◀◀ 10s / 10s ▶▶ centered on screen when seeking.
 * Auto-fades after 800ms.
 */

import { useEffect, useState } from "react";

interface SeekIndicatorProps {
  direction: "forward" | "backward" | null;
  /** Incremented on each seek to re-trigger animation */
  seekCount: number;
}

export function SeekIndicator({ direction, seekCount }: SeekIndicatorProps) {
  const [visible, setVisible] = useState(false);
  const [lastDirection, setLastDirection] = useState<
    "forward" | "backward" | null
  >(null);

  useEffect(() => {
    if (direction && seekCount > 0) {
      setLastDirection(direction);
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 800);
      return () => clearTimeout(timer);
    }
  }, [direction, seekCount]);

  if (!visible || !lastDirection) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-6 py-4 flex items-center gap-3 animate-[fadeInOut_0.8s_ease-in-out]">
        {lastDirection === "backward" ? (
          <>
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
            </svg>
            <span className="text-white text-xl font-semibold">10s</span>
          </>
        ) : (
          <>
            <span className="text-white text-xl font-semibold">10s</span>
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
            </svg>
          </>
        )}
      </div>
    </div>
  );
}
