import { useState, memo, useCallback } from "react";
import { cn } from "@/shared/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChannelCardProps {
  channelName: string;
  channelNumber?: number;
  logoUrl: string;
  isLive?: boolean;
  currentProgram?: string;
  nextProgram?: string;
  onClick?: () => void;
  className?: string;
  focusKey?: string;
}

// ---------------------------------------------------------------------------
// Image fallback
// ---------------------------------------------------------------------------

function ChannelFallback({ channelName }: { channelName: string }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-gradient-to-br from-bg-secondary to-bg-tertiary flex items-center justify-center p-3"
    >
      <span className="text-sm font-medium text-text-secondary text-center line-clamp-2 font-[family-name:var(--font-family-heading)] leading-snug">
        {channelName}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ChannelCard = memo(function ChannelCard({
  channelName,
  channelNumber,
  logoUrl,
  isLive,
  currentProgram,
  nextProgram,
  onClick,
  className,
  focusKey,
}: ChannelCardProps) {
  const [imgError, setImgError] = useState(false);

  const handleImgError = useCallback(() => {
    setImgError(true);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && onClick) onClick();
    },
    [onClick],
  );

  const ariaLabel = currentProgram
    ? `${channelName} — ${currentProgram}`
    : channelName;

  return (
    <div
      data-focus-key={focusKey}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      className={cn(
        "relative cursor-pointer select-none",
        "rounded-[var(--radius-lg)] overflow-hidden",
        "aspect-video",
        "min-h-[44px] min-w-[44px]",
        "bg-bg-secondary",
        "border border-transparent",
        "hover-capable:border-accent-teal/30",
        "transition-[transform,box-shadow,border-color] duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary",
        "focus-visible:scale-[1.04] focus-visible:shadow-[var(--shadow-focus-tv)]",
        className,
      )}
    >
      {/* Channel logo */}
      {!imgError ? (
        <img
          src={logoUrl}
          alt={channelName}
          loading="lazy"
          decoding="async"
          onError={handleImgError}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <ChannelFallback channelName={channelName} />
      )}

      {/* Bottom gradient overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-bg-primary/95 via-bg-primary/50 to-transparent pointer-events-none"
      />

      {/* Live indicator */}
      {isLive && (
        <div
          data-testid="live-indicator"
          className="absolute top-2 right-2 flex items-center gap-1"
        >
          <span
            aria-hidden="true"
            className="w-2 h-2 rounded-full bg-error animate-pulse"
          />
          <span className="text-[10px] font-semibold text-error uppercase">
            Live
          </span>
        </div>
      )}

      {/* Channel number — only rendered when provided */}
      {channelNumber !== undefined && (
        <div className="absolute top-2 left-2 pointer-events-none">
          <span className="text-xs font-bold text-text-primary bg-bg-primary/60 px-1.5 py-0.5 rounded">
            {channelNumber}
          </span>
        </div>
      )}

      {/* Channel info overlay — bottom */}
      <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2 pointer-events-none">
        <p className="font-medium text-text-primary truncate text-xs font-[family-name:var(--font-family-heading)] leading-snug">
          {channelName}
        </p>
        {currentProgram && (
          <p className="text-[10px] text-text-secondary truncate mt-0.5">
            {currentProgram}
          </p>
        )}
        {nextProgram && (
          <p className="text-[10px] text-text-tertiary truncate mt-0.5">
            {nextProgram}
          </p>
        )}
      </div>
    </div>
  );
});
