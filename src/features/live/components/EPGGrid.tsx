import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useEPG } from "../api";
import { usePlayerStore } from "@lib/store";
import { EPGTimeAxis, useEPGTimeRange } from "./EPGTimeAxis";
import { EPGProgramBlock } from "./EPGProgramBlock";
import type { XtreamLiveStream } from "@shared/types/api";
import { upgradeProtocol } from "@shared/components/LazyImage";
import {
  useSpatialFocusable,
  useSpatialContainer,
  FocusContext,
} from "@shared/hooks/useSpatialNav";

interface EPGGridProps {
  channels: XtreamLiveStream[];
}

const PIXELS_PER_MINUTE = 4;
const CHANNEL_COL_WIDTH = 200;
const ROW_HEIGHT = 44;

/**
 * FocusableProgramBlock — wraps EPGProgramBlock with spatial nav.
 * Must be a separate component so useSpatialFocusable is called unconditionally
 * (React hooks cannot be called inside .map() loops conditionally).
 */
function FocusableProgramBlock({
  focusKey,
  title,
  startTimestamp,
  endTimestamp,
  timelineStart,
  pixelsPerMinute,
  onClick,
}: {
  focusKey: string;
  title: string;
  startTimestamp: number;
  endTimestamp: number;
  timelineStart: Date;
  pixelsPerMinute: number;
  onClick: () => void;
}) {
  const { ref, showFocusRing } = useSpatialFocusable({
    focusKey,
    onEnterPress: onClick,
    onFocus: (layout) => {
      layout.node?.scrollIntoView({ behavior: "instant", block: "nearest" });
    },
  });

  return (
    <div ref={ref}>
      <EPGProgramBlock
        title={title}
        startTimestamp={startTimestamp}
        endTimestamp={endTimestamp}
        timelineStart={timelineStart}
        pixelsPerMinute={pixelsPerMinute}
        onClick={onClick}
        focusKey={focusKey}
        showFocusRing={showFocusRing}
      />
    </div>
  );
}

/**
 * EPGChannelRow — renders program blocks for a single channel row.
 * Uses useSpatialContainer with focusable: false so Up/Down D-pad nav
 * can cross row boundaries without the container rect blocking it.
 * isFocusBoundary with left/right directions keeps Left/Right within the row.
 */
function EPGChannelRow({
  channel,
  startTime,
  endTime,
  pixelsPerMinute,
  onClick,
}: {
  channel: XtreamLiveStream;
  startTime: Date;
  endTime: Date;
  pixelsPerMinute: number;
  onClick: () => void;
}) {
  const { data: epg } = useEPG(channel.id);

  const { ref, focusKey: rowFocusKey } = useSpatialContainer({
    focusKey: `epg-row-${channel.id}`,
    focusable: false,
    isFocusBoundary: true,
    focusBoundaryDirections: ["left", "right"],
  });

  // Filter EPG items that overlap with our time range
  const visiblePrograms = (epg || []).filter((item) => {
    const start = new Date(item.start).getTime();
    const end = new Date(item.end).getTime();
    const rangeStart = startTime.getTime();
    const rangeEnd = endTime.getTime();
    return start < rangeEnd && end > rangeStart;
  });

  return (
    <FocusContext.Provider value={rowFocusKey}>
      <div ref={ref} className="relative" style={{ height: ROW_HEIGHT }}>
        {visiblePrograms.length > 0 ? (
          visiblePrograms.map((program, idx) => {
            const programFocusKey = `epg-program-${channel.id}-${idx}`;
            return (
              <FocusableProgramBlock
                key={program.id}
                focusKey={programFocusKey}
                title={program.title}
                startTimestamp={new Date(program.start).getTime() / 1000}
                endTimestamp={new Date(program.end).getTime() / 1000}
                timelineStart={startTime}
                pixelsPerMinute={pixelsPerMinute}
                onClick={onClick}
              />
            );
          })
        ) : (
          <div
            className="absolute inset-0.5 rounded bg-surface/40 border border-white/5 flex items-center px-2 cursor-pointer hover:border-teal/20 transition-[border-color,background-color]"
            onClick={onClick}
          >
            <span className="text-[11px] text-text-muted/50 truncate">
              No EPG data
            </span>
          </div>
        )}
      </div>
    </FocusContext.Provider>
  );
}

export function EPGGrid({ channels }: EPGGridProps) {
  const navigate = useNavigate();
  const playStream = usePlayerStore((s) => s.playStream);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { startTime, endTime } = useEPGTimeRange(2, 4);
  const [nowOffset, setNowOffset] = useState(0);

  const totalMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
  const totalWidth = totalMinutes * PIXELS_PER_MINUTE;

  // Scroll to "now" on mount
  useEffect(() => {
    const now = new Date();
    const minutesFromStart = (now.getTime() - startTime.getTime()) / 60000;
    const offset = minutesFromStart * PIXELS_PER_MINUTE;
    setNowOffset(offset);

    if (scrollRef.current) {
      // Center the "now" line in view
      scrollRef.current.scrollLeft = Math.max(
        0,
        offset - scrollRef.current.clientWidth / 3,
      );
    }
  }, [startTime]);

  // Update now line every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const minutesFromStart = (now.getTime() - startTime.getTime()) / 60000;
      setNowOffset(minutesFromStart * PIXELS_PER_MINUTE);
    }, 60000);
    return () => clearInterval(interval);
  }, [startTime]);

  function handleChannelClick(channel: XtreamLiveStream) {
    playStream(channel.id, { streamType: "live", streamName: channel.name });
    navigate({ to: "/live", search: { play: channel.id } });
  }

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden bg-surface">
      <div className="flex">
        {/* Channel names column (fixed) */}
        <div
          className="flex-shrink-0 border-r border-white/10 bg-obsidian z-10"
          style={{ width: CHANNEL_COL_WIDTH }}
        >
          {/* Header spacer */}
          <div className="h-8 border-b border-white/10 flex items-center px-3">
            <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
              Channel
            </span>
          </div>

          {/* Channel names */}
          <div className="overflow-y-auto max-h-[calc(100vh-16rem)]">
            {channels.map((channel) => (
              <div
                key={channel.id}
                onClick={() => handleChannelClick(channel)}
                className="flex items-center gap-2 px-3 border-b border-white/5 cursor-pointer hover:bg-surface-raised/50 transition-colors"
                style={{ height: ROW_HEIGHT }}
              >
                {channel.icon ? (
                  <img
                    src={upgradeProtocol(channel.icon)}
                    alt=""
                    className="w-6 h-6 rounded object-contain flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-6 h-6 rounded bg-surface-raised flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] text-text-muted font-medium">
                      {channel.name.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-xs text-text-primary truncate">
                  {channel.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline area (scrollable) */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto overflow-y-auto max-h-[calc(100vh-16rem)]"
        >
          <div style={{ width: totalWidth, minWidth: "100%" }}>
            {/* Time axis */}
            <EPGTimeAxis
              startTime={startTime}
              endTime={endTime}
              pixelsPerMinute={PIXELS_PER_MINUTE}
            />

            {/* Program rows */}
            <div className="relative">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="border-b border-white/5"
                  style={{ height: ROW_HEIGHT }}
                >
                  <EPGChannelRow
                    channel={channel}
                    startTime={startTime}
                    endTime={endTime}
                    pixelsPerMinute={PIXELS_PER_MINUTE}
                    onClick={() => handleChannelClick(channel)}
                  />
                </div>
              ))}

              {/* Now line overlay */}
              {nowOffset > 0 && nowOffset < totalWidth && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-error/70 z-10 pointer-events-none"
                  style={{ left: nowOffset }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
