import { useState, memo, useCallback } from "react";
import { cn } from "@/shared/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EpisodeCardProps {
  title: string;
  thumbnailUrl: string;
  duration?: string;
  /** Watch progress 0-100 */
  progress?: number;
  season?: number;
  episode?: number;
  description?: string;
  onClick?: () => void;
  className?: string;
  focusKey?: string;
}

// ---------------------------------------------------------------------------
// Progress bar sub-component
// ---------------------------------------------------------------------------

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      aria-label={`${Math.round(clamped)}% watched`}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="absolute bottom-0 inset-x-0 h-[3px] bg-white/10"
    >
      <div
        className="h-full rounded-full transition-[width] duration-300 ease-out"
        style={{
          width: `${clamped}%`,
          background: "linear-gradient(90deg, #2DD4A8, #6366F1)",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Image fallback
// ---------------------------------------------------------------------------

function EpisodeFallback({ title }: { title: string }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center p-3"
      style={{
        background: "linear-gradient(135deg, #1a1f35 0%, #0D0F17 100%)",
      }}
    >
      <span className="text-xs font-medium text-text-secondary text-center line-clamp-2 font-[family-name:var(--font-family-heading)] leading-snug">
        {title}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatEpisodeCode(season?: number, episode?: number): string | null {
  if (season === undefined || episode === undefined) return null;
  const s = String(season).padStart(2, "0");
  const e = String(episode).padStart(2, "0");
  return `S${s}E${e}`;
}

// ---------------------------------------------------------------------------
// Component — horizontal layout (thumbnail left, metadata right)
// ---------------------------------------------------------------------------

export const EpisodeCard = memo(function EpisodeCard({
  title,
  thumbnailUrl,
  duration,
  progress,
  season,
  episode,
  description,
  onClick,
  className,
  focusKey,
}: EpisodeCardProps) {
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

  const hasProgress = progress !== undefined && progress > 0;
  const clampedProgress =
    progress !== undefined ? Math.min(100, Math.max(0, progress)) : undefined;
  const episodeCode = formatEpisodeCode(season, episode);

  const ariaLabel = [episodeCode, title, duration].filter(Boolean).join(" — ");

  return (
    <div
      data-focus-key={focusKey}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      className={cn(
        // Horizontal flex layout
        "relative flex flex-row cursor-pointer select-none",
        "rounded-[var(--radius-lg)] overflow-hidden",
        "bg-bg-secondary",
        "border border-white/5",
        "hover-capable:hover:border-accent-teal/35",
        "hover-capable:hover:bg-bg-tertiary",
        "transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out",
        "hover-capable:hover:shadow-[0_4px_20px_rgba(45,212,168,0.12)]",
        "focus-visible:outline-none",
        "focus-visible:border-accent-teal/60",
        "focus-visible:ring-2 focus-visible:ring-accent-teal/70 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-primary",
        "focus-visible:scale-[1.02]",
        "focus-visible:shadow-[0_0_0_3px_rgba(45,212,168,0.8),0_8px_32px_rgba(45,212,168,0.3)]",
        className,
      )}
    >
      {/* ── Thumbnail (left, fixed-width 16:9) ───────────────────── */}
      <div className="relative shrink-0 w-[140px] sm:w-[160px] aspect-video self-stretch">
        {!imgError ? (
          <img
            src={thumbnailUrl}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            onError={handleImgError}
            onLoad={handleImgLoad}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
              imgLoaded ? "opacity-100" : "opacity-0",
            )}
            draggable={false}
          />
        ) : (
          <EpisodeFallback title={title} />
        )}

        {/* Duration badge — bottom-right of thumbnail */}
        {duration && (
          <div className="absolute bottom-1.5 right-1.5 pointer-events-none">
            <span className="text-[9px] font-semibold text-text-primary bg-bg-primary/75 backdrop-blur-sm px-1.5 py-0.5 rounded">
              {duration}
            </span>
          </div>
        )}

        {/* Progress bar — bottom edge of thumbnail */}
        {hasProgress && <ProgressBar value={clampedProgress!} />}

        {/* Right edge fade to blend into metadata area */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 w-6 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, transparent, var(--color-bg-secondary))",
          }}
        />
      </div>

      {/* ── Metadata (right) ───────────────────────────────────────── */}
      <div className="flex flex-col justify-center gap-0.5 px-3 py-2.5 min-w-0 flex-1">
        {/* Episode code */}
        {episodeCode && (
          <span className="text-[10px] font-bold tracking-wider text-accent-teal/90 uppercase shrink-0">
            {episodeCode}
          </span>
        )}

        {/* Title */}
        <p className="font-semibold text-text-primary text-xs line-clamp-2 font-[family-name:var(--font-family-heading)] leading-snug">
          {title}
        </p>

        {/* Description */}
        {description && (
          <p className="text-[10px] text-text-secondary line-clamp-2 leading-snug mt-0.5">
            {description}
          </p>
        )}

        {/* Progress indicator text */}
        {hasProgress && (
          <p className="text-[9px] text-accent-teal/70 mt-1 font-medium shrink-0">
            {Math.round(clampedProgress!)}% watched
          </p>
        )}
      </div>
    </div>
  );
});
