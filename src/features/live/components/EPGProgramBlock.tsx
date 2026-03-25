import { useMemo, useState } from "react";

interface EPGProgramBlockProps {
  title: string;
  startTimestamp: number; // unix seconds
  endTimestamp: number; // unix seconds
  timelineStart: Date;
  pixelsPerMinute: number;
  onClick?: () => void;
  /** Spatial nav focus key — set by EPGGrid via useSpatialFocusable */
  focusKey?: string;
  /** Whether to display a focus ring (set to true when element has D-pad focus) */
  showFocusRing?: boolean;
}

export function EPGProgramBlock({
  title,
  startTimestamp,
  endTimestamp,
  timelineStart,
  pixelsPerMinute,
  onClick,
  focusKey,
  showFocusRing = false,
}: EPGProgramBlockProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const { left, width, isNow, isPast, startLabel, endLabel } = useMemo(() => {
    const now = Date.now() / 1000;
    const startMs = startTimestamp * 1000;
    const endMs = endTimestamp * 1000;
    const timelineStartMs = timelineStart.getTime();

    const leftMin = (startMs - timelineStartMs) / 60000;
    const durationMin = (endMs - startMs) / 60000;

    const fmt = (ts: number) =>
      new Date(ts * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

    return {
      left: leftMin * pixelsPerMinute,
      width: Math.max(durationMin * pixelsPerMinute, 2),
      isNow: startTimestamp <= now && endTimestamp >= now,
      isPast: endTimestamp < now,
      startLabel: fmt(startTimestamp),
      endLabel: fmt(endTimestamp),
    };
  }, [startTimestamp, endTimestamp, timelineStart, pixelsPerMinute]);

  return (
    <div
      data-focus-key={focusKey}
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      className={`absolute top-0.5 bottom-0.5 rounded px-1.5 flex items-center overflow-hidden cursor-pointer transition-[background-color,border-color,box-shadow] text-xs select-none ${
        showFocusRing
          ? "ring-2 ring-teal/80 ring-offset-1 ring-offset-obsidian z-20"
          : ""
      } ${
        isNow
          ? "bg-teal/15 border border-teal/40 text-text-primary"
          : isPast
            ? "bg-surface/60 border border-white/5 text-text-muted/60"
            : "bg-surface-raised border border-white/10 text-text-secondary hover:border-teal/20 hover:bg-surface-raised/80"
      }`}
      style={{ left, width }}
    >
      <span className="truncate text-[11px] leading-tight">{title}</span>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-30 px-2.5 py-1.5 bg-obsidian border border-white/15 rounded-md shadow-lg whitespace-nowrap pointer-events-none">
          <p className="text-xs font-medium text-text-primary">{title}</p>
          <p className="text-[10px] text-text-muted mt-0.5">
            {startLabel} - {endLabel}
          </p>
        </div>
      )}
    </div>
  );
}
