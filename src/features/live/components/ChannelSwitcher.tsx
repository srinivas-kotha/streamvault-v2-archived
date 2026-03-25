/**
 * ChannelSwitcher — overlay that shows current channel info on D-pad channel navigation.
 * Auto-hides after 3 seconds. Timer resets on channel change.
 * Enter/click confirms and plays the channel.
 */

import { useEffect } from "react";
import type { XtreamLiveStream, XtreamEPGItem } from "@shared/types/api";

interface ChannelSwitcherProps {
  channel: XtreamLiveStream;
  currentProgram?: XtreamEPGItem;
  isVisible: boolean;
  onConfirm: (channel: XtreamLiveStream) => void;
  onDismiss: () => void;
  /** Debounce window in ms before auto-committing (default: 300). Not used internally but
   * accepted as prop so the parent can control debounce logic. */
  debounceMs?: number;
}

export function ChannelSwitcher({
  channel,
  currentProgram,
  isVisible,
  onConfirm,
  onDismiss,
}: ChannelSwitcherProps) {
  // Auto-hide after 3 seconds; reset timer whenever channel changes
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);
    return () => clearTimeout(timer);
  }, [isVisible, channel.stream_id, onDismiss]);

  // Enter key confirms during overlay
  useEffect(() => {
    if (!isVisible) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter") {
        onConfirm(channel);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, channel, onConfirm]);

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-label={`Channel switcher: ${channel.name}`}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-4 bg-obsidian border border-white/15 rounded-2xl shadow-2xl min-w-[280px] cursor-pointer"
      onClick={() => onConfirm(channel)}
    >
      {/* Channel icon */}
      <div className="w-14 h-14 rounded-xl bg-surface-raised flex items-center justify-center flex-shrink-0 overflow-hidden">
        {channel.stream_icon ? (
          <img
            src={channel.stream_icon}
            alt={channel.name}
            className="w-full h-full object-contain p-1"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span className="text-xl font-display font-bold text-text-muted/50">
            {channel.name.charAt(0)}
          </span>
        )}
      </div>

      {/* Channel info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-text-muted font-medium tabular-nums">
            {channel.num}
          </span>
          <span className="text-base font-display font-bold text-text-primary truncate">
            {channel.name}
          </span>
        </div>
        {currentProgram && (
          <p className="text-xs text-teal truncate mt-0.5">
            {currentProgram.title}
          </p>
        )}
      </div>
    </div>
  );
}
