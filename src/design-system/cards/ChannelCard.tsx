import { useState, memo, useCallback } from "react";
import { cn } from "@/shared/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChannelContentType =
  | "Live TV"
  | "Sports"
  | "News"
  | "Entertainment"
  | "Kids"
  | "Movies"
  | "Music"
  | "Documentary"
  | string;

export interface ChannelCardProps {
  channelName: string;
  channelNumber?: number;
  logoUrl: string;
  isLive?: boolean;
  currentProgram?: string;
  nextProgram?: string;
  /** Content type badge — e.g. 'Sports', 'News', 'Kids' */
  contentType?: ChannelContentType;
  onClick?: () => void;
  className?: string;
  focusKey?: string;
}

// ---------------------------------------------------------------------------
// Content type badge colours
// ---------------------------------------------------------------------------

const CONTENT_TYPE_STYLES: Record<string, string> = {
  Sports: "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/25",
  News: "bg-[#3b82f6]/15 text-[#93c5fd] border-[#3b82f6]/25",
  Kids: "bg-[#ec4899]/15 text-[#f9a8d4] border-[#ec4899]/25",
  Movies: "bg-[#8b5cf6]/15 text-[#c4b5fd] border-[#8b5cf6]/25",
  Music: "bg-[#14b8a6]/15 text-[#5eead4] border-[#14b8a6]/25",
  Documentary: "bg-[#6b7280]/15 text-[#d1d5db] border-[#6b7280]/25",
  Entertainment: "bg-[#6366f1]/15 text-[#a5b4fc] border-[#6366f1]/25",
  "Live TV": "bg-[#ef4444]/15 text-[#fca5a5] border-[#ef4444]/25",
};

function contentTypeBadgeStyle(type: string): string {
  return (
    CONTENT_TYPE_STYLES[type] ??
    "bg-white/10 text-text-secondary border-white/15"
  );
}

// ---------------------------------------------------------------------------
// Image fallback — initials on brand gradient
// ---------------------------------------------------------------------------

function ChannelFallback({ channelName }: { channelName: string }) {
  const initials = channelName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #1a1f35 0%, #0D0F17 100%)",
      }}
    >
      <span
        className="text-xl font-bold text-text-secondary font-[family-name:var(--font-family-heading)] select-none"
        style={{ textShadow: "0 1px 8px rgba(45,212,168,0.2)" }}
      >
        {initials || channelName.slice(0, 2).toUpperCase()}
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
  contentType,
  onClick,
  className,
  focusKey,
}: ChannelCardProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleImgError = useCallback(() => {
    setImgError(true);
  }, []);

  const handleImgLoad = useCallback(() => {
    setImgLoaded(true);
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
        "border border-white/5",
        "hover-capable:hover:border-accent-teal/35",
        "transition-[transform,box-shadow,border-color] duration-200 ease-out",
        "hover-capable:hover:scale-[1.04]",
        "hover-capable:hover:shadow-[0_8px_28px_rgba(45,212,168,0.15)]",
        "focus-visible:outline-none",
        "focus-visible:border-accent-teal/60",
        "focus-visible:ring-2 focus-visible:ring-accent-teal/70 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-primary",
        "focus-visible:scale-[1.06]",
        "focus-visible:shadow-[0_0_0_3px_rgba(45,212,168,0.8),0_8px_40px_rgba(45,212,168,0.35),0_0_60px_rgba(45,212,168,0.12)]",
        className,
      )}
    >
      {/* Dark background — logo is shown contained, not cropped */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #111420 0%, #0D0F17 100%)",
        }}
      />

      {/* Channel logo — object-contain so logos aren't cropped */}
      {!imgError ? (
        <img
          src={logoUrl}
          alt={channelName}
          loading="lazy"
          decoding="async"
          onError={handleImgError}
          onLoad={handleImgLoad}
          className={cn(
            "absolute inset-0 w-full h-full object-contain p-4 transition-opacity duration-300",
            imgLoaded ? "opacity-100" : "opacity-0",
          )}
          draggable={false}
        />
      ) : (
        <ChannelFallback channelName={channelName} />
      )}

      {/* Subtle bottom vignette for text legibility */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(13,15,23,0.96) 0%, transparent 100%)",
        }}
      />

      {/* ── Top row: channel number (left) + live indicator (right) ── */}
      <div className="absolute top-2 inset-x-2 flex items-start justify-between pointer-events-none">
        {channelNumber !== undefined ? (
          <span className="text-[10px] font-bold text-text-primary bg-bg-primary/70 backdrop-blur-sm px-1.5 py-0.5 rounded">
            {channelNumber}
          </span>
        ) : (
          <span />
        )}

        {isLive && (
          <div
            data-testid="live-indicator"
            className="flex items-center gap-1 bg-error/20 backdrop-blur-sm border border-error/30 px-1.5 py-0.5 rounded-full"
          >
            <span
              aria-hidden="true"
              className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"
            />
            <span className="text-[9px] font-bold text-error uppercase tracking-wide">
              Live
            </span>
          </div>
        )}
      </div>

      {/* ── Bottom row: channel info + content type badge ──────────── */}
      <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2 pointer-events-none">
        <div className="flex items-end justify-between gap-1">
          <div className="min-w-0">
            <p className="font-semibold text-text-primary truncate text-xs font-[family-name:var(--font-family-heading)] leading-snug">
              {channelName}
            </p>
            {currentProgram && (
              <p className="text-[10px] text-text-secondary truncate mt-0.5">
                {currentProgram}
              </p>
            )}
            {nextProgram && (
              <p className="text-[9px] text-text-tertiary truncate mt-0.5">
                Up next: {nextProgram}
              </p>
            )}
          </div>

          {/* Content type badge */}
          {contentType && (
            <span
              className={cn(
                "shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                contentTypeBadgeStyle(contentType),
              )}
            >
              {contentType}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
