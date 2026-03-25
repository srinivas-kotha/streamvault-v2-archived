/**
 * Sprint 4 — Issue #114
 * AudioTrackSelector: dropdown to pick audio track.
 * Hidden when 0 or 1 tracks available. Closes after selection.
 */

import { useState } from "react";
import { usePlayerStore } from "@lib/stores/playerStore";

export function AudioTrackSelector() {
  const audioTracks = usePlayerStore((s) => s.audioTracks);
  const currentAudio = usePlayerStore((s) => s.currentAudio);
  const setCurrentAudio = usePlayerStore((s) => s.setCurrentAudio);
  const [open, setOpen] = useState(false);

  // Don't render when no tracks or only one track
  if (audioTracks.length <= 1) return null;

  const handleSelect = (id: number) => {
    setCurrentAudio(id);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Audio track"
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
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Audio track"
          className="absolute bottom-full right-0 mb-1 bg-surface-overlay border border-border rounded-lg py-1 min-w-[120px] z-10 shadow-lg"
        >
          {audioTracks.map((track) => (
            <li
              key={track.id}
              role="option"
              aria-selected={currentAudio === track.id}
              onClick={() => handleSelect(track.id)}
              className="px-3 py-1.5 text-sm cursor-pointer hover:bg-white/10 text-white flex items-center justify-between"
            >
              <span>{track.name}</span>
              {currentAudio === track.id && <span aria-hidden="true">✓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
