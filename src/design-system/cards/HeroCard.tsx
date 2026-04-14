import { useState, memo, useCallback, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HeroCardProps {
  title: string;
  description?: string;
  imageUrl: string;
  /** Genre / category label shown above the title */
  genre?: string;
  /** Content rating badge — e.g. 'PG-13', 'TV-MA' */
  rating?: string;
  /** Year of release */
  year?: number | string;
  /** Action buttons / CTA content rendered below the description */
  children?: ReactNode;
  className?: string;
}

// ---------------------------------------------------------------------------
// Image fallback — brand gradient background
// ---------------------------------------------------------------------------

function HeroFallback({ title }: { title: string }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex items-end"
      style={{ background: "var(--gradient-brand)" }}
    >
      <div className="absolute inset-0 bg-bg-primary/40" />
      <span className="relative z-10 px-6 pb-8 text-lg font-semibold text-text-primary font-[family-name:var(--font-family-heading)] opacity-50 line-clamp-2">
        {title}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * HeroCard — full-width featured content slot.
 *
 * Sizing:
 *   mobile  → min-h-[220px]
 *   desktop → min-h-[340px]
 *   fluid height — grows with content when description + children are long
 *
 * No hover scale (full-width cards feel wrong when scaled).
 * Image fallback: brand teal→indigo gradient.
 */
export const HeroCard = memo(function HeroCard({
  title,
  description,
  imageUrl,
  genre,
  rating,
  year,
  children,
  className,
}: HeroCardProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleImgError = useCallback(() => {
    setImgError(true);
  }, []);

  const handleImgLoad = useCallback(() => {
    setImgLoaded(true);
  }, []);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        "rounded-[var(--radius-xl)]",
        "min-h-[220px] md:min-h-[340px]",
        "bg-bg-secondary",
        className,
      )}
    >
      {/* Background image — fades in once loaded */}
      {!imgError ? (
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          onError={handleImgError}
          onLoad={handleImgLoad}
          className={cn(
            "absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500",
            imgLoaded ? "opacity-100" : "opacity-0",
          )}
          draggable={false}
        />
      ) : (
        <HeroFallback title={title} />
      )}

      {/* Multi-layer gradient — deep bottom vignette + soft top vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            "linear-gradient(to top, rgba(13,15,23,1) 0%, rgba(13,15,23,0.75) 30%, rgba(13,15,23,0.15) 60%, transparent 100%)",
            "linear-gradient(to bottom, rgba(13,15,23,0.4) 0%, transparent 20%)",
          ].join(", "),
        }}
      />

      {/* Subtle brand colour wash — indigo tint on left edge */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(100deg, rgba(99,102,241,0.08) 0%, transparent 50%)",
        }}
      />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col justify-end h-full min-h-[220px] md:min-h-[340px] px-5 pb-6 pt-14 md:px-8 md:pb-8 md:pt-20">
        {/* Genre label */}
        {genre && (
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent-teal mb-1.5">
            {genre}
          </p>
        )}

        {/* Title */}
        <h2
          className={cn(
            "font-bold text-text-primary font-[family-name:var(--font-family-heading)]",
            "text-3xl md:text-4xl",
            "leading-tight",
            "max-w-2xl",
          )}
          style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}
        >
          {title}
        </h2>

        {/* Meta row: year + rating */}
        {(year !== undefined || rating) && (
          <div className="flex items-center gap-2 mt-1.5">
            {year !== undefined && (
              <span className="text-xs text-text-secondary font-medium">
                {year}
              </span>
            )}
            {year !== undefined && rating && (
              <span
                className="w-0.5 h-0.5 rounded-full bg-text-tertiary"
                aria-hidden="true"
              />
            )}
            {rating && (
              <span className="text-[10px] font-bold text-text-secondary border border-text-tertiary/40 px-1.5 py-0.5 rounded">
                {rating}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <p
            className={cn(
              "mt-2 text-text-secondary leading-relaxed",
              "text-sm md:text-base",
              "max-w-xl",
              "line-clamp-3",
            )}
          >
            {description}
          </p>
        )}

        {/* Action area (CTA buttons, etc.) */}
        {children && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {children}
          </div>
        )}
      </div>
    </div>
  );
});
