/**
 * ProgramInfoPopup — displays program details with Watch and Catch-up actions.
 * Closes on Escape, Fire TV Back (keyCode 4), or backdrop click.
 */

import { useEffect } from "react";
import type { XtreamEPGItem, XtreamLiveStream } from "@shared/types/api";

interface ProgramInfoPopupProps {
  program: XtreamEPGItem;
  channel: XtreamLiveStream;
  isOpen: boolean;
  onWatch: (streamId: string) => void;
  onCatchup: (params: {
    streamId: string;
    startTimestamp: number;
    stopTimestamp: number;
  }) => void;
  onClose: () => void;
}

function formatTime(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function ProgramInfoPopup({
  program,
  channel,
  isOpen,
  onWatch,
  onCatchup,
  onClose,
}: ProgramInfoPopupProps) {
  const now = Date.now() / 1000;
  const startTs = new Date(program.start).getTime() / 1000;
  const stopTs = new Date(program.end).getTime() / 1000;

  const isPast = stopTs < now;
  const isNow = startTs <= now && stopTs >= now;
  const isFuture = startTs > now;
  const canCatchup = isPast && false; // tv_archive removed in Phase 2
  const showWatch = isNow || isFuture;

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" || e.keyCode === 4) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="popup-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={`Program info: ${program.title}`}
        aria-modal="true"
        className="relative bg-surface border border-white/10 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2 className="text-lg font-display font-bold text-text-primary mb-1">
          {program.title}
        </h2>

        {/* Time range */}
        <p className="text-xs text-text-muted mb-3">
          {formatTime(startTs)} &ndash; {formatTime(stopTs)}
        </p>

        {/* Description */}
        {program.description && (
          <p className="text-sm text-text-secondary mb-5 leading-relaxed">
            {program.description}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {showWatch && (
            <button
              onClick={() => onWatch(channel.id)}
              className="flex-1 px-4 py-2 bg-teal text-obsidian rounded-lg text-sm font-semibold transition-[background-color,box-shadow] hover-capable:hover:bg-teal-dim"
            >
              Watch
            </button>
          )}
          {canCatchup && (
            <button
              onClick={() =>
                onCatchup({
                  streamId: channel.id,
                  startTimestamp: startTs,
                  stopTimestamp: stopTs,
                })
              }
              className="flex-1 px-4 py-2 bg-indigo/20 border border-indigo/40 text-indigo rounded-lg text-sm font-semibold transition-[background-color,border-color] hover-capable:hover:bg-indigo/30"
            >
              Catch-up
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-surface-raised text-text-muted hover-capable:hover:text-text-primary transition-[color,background-color]"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
