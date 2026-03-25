/**
 * LiveIndicator — pulsing red dot for live streams.
 * Used inside ChannelCard and anywhere a live status indicator is needed.
 */

interface LiveIndicatorProps {
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
  lg: "w-2.5 h-2.5",
};

const TEXT_SIZE_MAP = {
  sm: "text-[9px]",
  md: "text-[10px]",
  lg: "text-[11px]",
};

export function LiveIndicator({ size = "md" }: LiveIndicatorProps) {
  const dotSize = SIZE_MAP[size];
  const textSize = TEXT_SIZE_MAP[size];

  return (
    <span
      role="status"
      aria-label="Live"
      className="inline-flex items-center gap-1"
    >
      <span className="animate-pulse relative flex">
        <span className={`${dotSize} rounded-full bg-error`} />
      </span>
      <span
        className={`${textSize} font-semibold text-error uppercase tracking-wide`}
      >
        LIVE
      </span>
    </span>
  );
}
