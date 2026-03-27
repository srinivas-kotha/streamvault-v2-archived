/**
 * SpeedSelector: dropdown to pick playback speed.
 * Default 1x. Options: 0.5, 0.75, 1, 1.25, 1.5, 2.
 */

import { useState, useCallback } from "react";
import { usePlayerStore } from "@lib/stores/playerStore";

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function SpeedSelector() {
  const playbackRate = usePlayerStore((s) => s.playbackRate);
  const setPlaybackRate = usePlayerStore((s) => s.setPlaybackRate);
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (rate: number) => {
      setPlaybackRate(rate);
      setOpen(false);
    },
    [setPlaybackRate],
  );

  const label = playbackRate === 1 ? "1x" : `${playbackRate}x`;

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Playback speed: ${label}`}
        className="p-1.5 text-white/70 hover:text-white transition-colors text-xs font-medium"
      >
        {label}
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Playback speed"
          className="absolute bottom-full right-0 mb-1 bg-black/90 border border-white/20 rounded-lg py-1 min-w-[80px] z-10 shadow-lg"
        >
          {SPEED_OPTIONS.map((rate) => (
            <li
              key={rate}
              role="option"
              aria-selected={playbackRate === rate}
              onClick={() => handleSelect(rate)}
              className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-white/10 text-white ${
                playbackRate === rate ? "font-semibold" : ""
              }`}
            >
              {rate === 1 ? "Normal" : `${rate}x`}{" "}
              {playbackRate === rate && "\u2713"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
