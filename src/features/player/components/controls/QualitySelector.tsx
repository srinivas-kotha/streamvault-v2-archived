/**
 * Sprint 4 — Issue #114
 * QualitySelector: dropdown to pick HLS quality level.
 * -1 = Auto. Opens a listbox on click, closes after selection.
 */

import { useState, useCallback } from "react";
import { usePlayerStore } from "@lib/stores/playerStore";

export function QualitySelector() {
  const qualityLevels = usePlayerStore((s) => s.qualityLevels);
  const currentQuality = usePlayerStore((s) => s.currentQuality);
  const setCurrentQuality = usePlayerStore((s) => s.setCurrentQuality);
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (id: number) => {
      setCurrentQuality(id);
      setOpen(false);
    },
    [setCurrentQuality],
  );

  const currentLabel =
    currentQuality === -1
      ? "Auto"
      : (qualityLevels.find((l) => l.id === currentQuality)?.name ?? "Auto");

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Quality: ${currentLabel}`}
        className="p-1.5 text-white/70 hover:text-white transition-colors text-xs"
      >
        <span className="sr-only">Quality</span>
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Quality"
          className="absolute bottom-full right-0 mb-1 bg-surface-overlay border border-border rounded-lg py-1 min-w-[100px] z-10 shadow-lg"
        >
          <li
            role="option"
            aria-selected={currentQuality === -1}
            onClick={() => handleSelect(-1)}
            className="px-3 py-1.5 text-sm cursor-pointer hover:bg-white/10 text-white"
          >
            Auto {currentQuality === -1 && "✓"}
          </li>
          {qualityLevels.map((level) => (
            <li
              key={level.id}
              role="option"
              aria-selected={currentQuality === level.id}
              onClick={() => handleSelect(level.id)}
              className="px-3 py-1.5 text-sm cursor-pointer hover:bg-white/10 text-white"
            >
              {level.name} {currentQuality === level.id && "✓"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
