/**
 * Sprint 4 — Issue #114
 * SubtitleSelector: dropdown to pick subtitle/caption track.
 * -1 = Off. Opens a listbox on click, closes after selection.
 */

import { useState, useCallback } from "react";
import { usePlayerStore } from "@lib/stores/playerStore";

export function SubtitleSelector() {
  const subtitleTracks = usePlayerStore((s) => s.subtitleTracks);
  const currentSubtitle = usePlayerStore((s) => s.currentSubtitle);
  const setCurrentSubtitle = usePlayerStore((s) => s.setCurrentSubtitle);
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (id: number) => {
      setCurrentSubtitle(id);
      setOpen(false);
    },
    [setCurrentSubtitle],
  );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Subtitles"
        className="p-1.5 text-white/70 hover:text-white transition-colors"
      >
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
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Subtitles"
          className="absolute bottom-full right-0 mb-1 bg-surface-overlay border border-border rounded-lg py-1 min-w-[120px] z-10 shadow-lg"
        >
          <li
            role="option"
            aria-selected={currentSubtitle === -1}
            onClick={() => handleSelect(-1)}
            className="px-3 py-1.5 text-sm cursor-pointer hover:bg-white/10 text-white flex items-center justify-between"
          >
            <span>Off</span>
            {currentSubtitle === -1 && <span aria-hidden="true">✓</span>}
          </li>
          {subtitleTracks.map((track) => (
            <li
              key={track.id}
              role="option"
              aria-selected={currentSubtitle === track.id}
              onClick={() => handleSelect(track.id)}
              className="px-3 py-1.5 text-sm cursor-pointer hover:bg-white/10 text-white flex items-center justify-between"
            >
              <span>{track.name}</span>
              {currentSubtitle === track.id && (
                <span aria-hidden="true">✓</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
