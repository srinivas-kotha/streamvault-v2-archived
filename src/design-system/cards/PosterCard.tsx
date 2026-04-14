import { useState, memo, useCallback } from "react";
import { cn } from "@/shared/utils/cn";
import { Badge } from "@/design-system/primitives/Badge";
import { isTVMode } from "@/shared/utils/isTVMode";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PosterCardProps {
  title: string;
  imageUrl: string;
  rating?: string | number;
  isNew?: boolean;
  year?: number;
  genre?: string;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  onClick?: () => void;
  className?: string;
  /** Used for data-focus-key — must be unique per card in a list */
  focusKey?: string;
}

// ---------------------------------------------------------------------------
// Image fallback (gradient + title text)
// ---------------------------------------------------------------------------

function PosterFallback({ title }: { title: string }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex items-end p-3"
      style={{
        background:
          "linear-gradient(160deg, #1a1f35 0%, #0D0F17 60%, #0d2a26 100%)",
      }}
    >
      <span className="text-xs font-medium text-text-secondary line-clamp-2 font-[family-name:var(--font-family-heading)] leading-snug">
        {title}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const PosterCard = memo(function PosterCard({
  title,
  imageUrl,
  rating,
  isNew,
  year,
  genre,
  isFavorite,
  onFavoriteToggle,
  onClick,
  className,
  focusKey,
}: PosterCardProps) {
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

  const hasBadge = isNew || rating !== undefined;

  const ariaLabelParts = [title];
  if (year) ariaLabelParts.push(String(year));
  if (rating !== undefined) ariaLabelParts.push(String(rating));
  const ariaLabel = ariaLabelParts.join(" — ");

  return (
    <div
      data-focus-key={focusKey}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      className={cn(
        // Sizing: 120px mobile → 180px desktop → 240px TV (set by parent rail/grid)
        "relative cursor-pointer select-none",
        "rounded-[var(--radius-lg)] overflow-hidden",
        // 2:3 aspect
        "aspect-[2/3]",
        // Background skeleton while loading
        "bg-bg-secondary",
        // Border
        "border border-white/5",
        // Hover — mouse only (TV remotes have no hover capability)
        "hover-capable:hover:border-accent-teal/40",
        // Focus — keyboard & TV D-pad: ring + outer glow (visible at 10ft)
        "focus-visible:outline-none",
        "focus-visible:border-accent-teal/60",
        "focus-visible:ring-2 focus-visible:ring-accent-teal/70 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-primary",
        // Scale + ambient glow on hover/focus
        "transition-[transform,box-shadow,border-color,opacity] duration-200 ease-out",
        "hover-capable:hover:scale-[1.04]",
        "hover-capable:hover:shadow-[0_8px_32px_rgba(45,212,168,0.18),0_0_0_1px_rgba(45,212,168,0.15)]",
        "focus-visible:scale-[1.06]",
        "focus-visible:shadow-[0_0_0_3px_rgba(45,212,168,0.8),0_8px_40px_rgba(45,212,168,0.35),0_0_60px_rgba(45,212,168,0.12)]",
        className,
      )}
    >
      {/* Image — fades in once loaded */}
      {!imgError ? (
        <img
          src={imageUrl}
          alt={title}
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
        <PosterFallback title={title} />
      )}

      {/* Subtle ambient colour tint overlay — unique Srinibytes identity */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(99,102,241,0.04) 0%, transparent 30%)",
        }}
      />

      {/* Bottom gradient overlay — always rendered so title is readable */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-3/4 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(13,15,23,0.98) 0%, rgba(13,15,23,0.7) 35%, rgba(13,15,23,0.2) 65%, transparent 100%)",
        }}
      />

      {/* Badges (top-left) */}
      {hasBadge && (
        <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
          {isNew && (
            <Badge variant="new" size="sm">
              NEW
            </Badge>
          )}
          {rating !== undefined && (
            <Badge variant="rating" size="sm">
              {rating}
            </Badge>
          )}
        </div>
      )}

      {/* Favorite toggle (top-right) */}
      {onFavoriteToggle && (
        <button
          type="button"
          role="button"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle();
          }}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-bg-primary/60 backdrop-blur-sm hover-capable:hover:bg-bg-primary/80 transition-[background-color] duration-150"
        >
          <svg
            viewBox="0 0 24 24"
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={2}
            className={cn(
              "w-3.5 h-3.5",
              isFavorite ? "text-error" : "text-text-primary",
            )}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
            />
          </svg>
        </button>
      )}

      {/* Title + year + genre — bottom overlay */}
      <div className="absolute inset-x-0 bottom-0 px-2.5 pb-2.5 pointer-events-none">
        {genre && (
          <p className="text-[9px] font-semibold uppercase tracking-wider text-accent-teal/80 mb-0.5">
            {genre}
          </p>
        )}
        <p
          className={cn(
            "font-semibold text-text-primary truncate font-[family-name:var(--font-family-heading)] leading-snug",
            isTVMode ? "text-sm" : "text-xs",
          )}
        >
          {title}
        </p>
        {year && (
          <p className="text-[10px] text-text-secondary mt-0.5">{year}</p>
        )}
      </div>
    </div>
  );
});
