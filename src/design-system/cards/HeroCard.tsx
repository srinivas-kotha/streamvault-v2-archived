import { useState, memo, useCallback, type ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HeroCardProps {
  title: string;
  description?: string;
  imageUrl: string;
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
      style={{ background: 'var(--gradient-brand)' }}
    >
      {/* Subtle darkening overlay so text content remains readable */}
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
 *   mobile  → min-h-[200px]
 *   desktop → min-h-[300px]
 *   fluid height — grows with content when description + children are long
 *
 * No hover scale (full-width cards feel wrong when scaled).
 * Image fallback: brand teal→indigo gradient.
 */
export const HeroCard = memo(function HeroCard({
  title,
  description,
  imageUrl,
  children,
  className,
}: HeroCardProps) {
  const [imgError, setImgError] = useState(false);

  const handleImgError = useCallback(() => {
    setImgError(true);
  }, []);

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden',
        'rounded-[var(--radius-xl)]',
        // Fluid height — min on mobile, larger on desktop
        'min-h-[200px] md:min-h-[300px]',
        'bg-bg-secondary',
        className,
      )}
    >
      {/* Background image */}
      {!imgError ? (
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          onError={handleImgError}
          className="absolute inset-0 w-full h-full object-cover object-center"
          draggable={false}
        />
      ) : (
        <HeroFallback title={title} />
      )}

      {/* Hero gradient overlay — dark at bottom, fades out upward */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'var(--gradient-hero)' }}
      />

      {/* Subtle top vignette — softens the image top edge */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-bg-primary/30 to-transparent pointer-events-none"
      />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col justify-end h-full min-h-[200px] md:min-h-[300px] px-5 pb-6 pt-12 md:px-8 md:pb-8 md:pt-16">
        {/* Title */}
        <h2
          className={cn(
            'font-bold text-text-primary font-[family-name:var(--font-family-heading)]',
            'text-3xl md:text-4xl',
            // TV: clamp ensures readable at 10ft
            'leading-tight',
            // Max width keeps line length readable on ultra-wide screens
            'max-w-2xl',
          )}
        >
          {title}
        </h2>

        {/* Description */}
        {description && (
          <p
            className={cn(
              'mt-2 text-text-secondary leading-relaxed',
              'text-sm md:text-base',
              'max-w-xl',
              // Clamp to 3 lines — avoids hero taking up entire viewport
              'line-clamp-3',
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
