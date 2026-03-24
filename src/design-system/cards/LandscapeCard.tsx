import { useState, memo, useCallback } from 'react';
import { cn } from '@/shared/utils/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LandscapeCardProps {
  title: string;
  imageUrl: string;
  subtitle?: string;
  /** Progress 0-100 — renders continue-watching bar when provided */
  progress?: number;
  onClick?: () => void;
  className?: string;
  /** Used for data-focus-key — must be unique per card in a list */
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
      className="absolute bottom-0 inset-x-0 h-[3px] bg-bg-overlay"
    >
      <div
        className="h-full bg-accent-teal rounded-full transition-[width] duration-300 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Image fallback (gradient + title text)
// ---------------------------------------------------------------------------

function LandscapeFallback({ title }: { title: string }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-gradient-to-br from-bg-secondary to-bg-tertiary flex items-center justify-center p-4"
    >
      <span className="text-sm font-medium text-text-secondary text-center line-clamp-2 font-[family-name:var(--font-family-heading)] leading-snug">
        {title}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const LandscapeCard = memo(function LandscapeCard({
  title,
  imageUrl,
  subtitle,
  progress,
  onClick,
  className,
  focusKey,
}: LandscapeCardProps) {
  const [imgError, setImgError] = useState(false);

  const handleImgError = useCallback(() => {
    setImgError(true);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && onClick) onClick();
    },
    [onClick],
  );

  const hasProgress = progress !== undefined && progress > 0;

  return (
    <div
      data-focus-key={focusKey}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={subtitle ? `${title} — ${subtitle}` : title}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      className={cn(
        // Sizing: 200px mobile → 300px desktop → 400px TV (set by parent rail/grid)
        'relative cursor-pointer select-none',
        'rounded-[var(--radius-lg)] overflow-hidden',
        // 16:9 aspect
        'aspect-video',
        'bg-bg-secondary',
        // Border (transparent base, revealed on hover/focus)
        'border border-transparent',
        // Hover — mouse only (TV has no hover, avoids phantom scale on remote nav)
        'hover-capable:border-accent-teal/30',
        // Specific transition props — NO transition-all
        'transition-[transform,box-shadow,border-color] duration-200 ease-out',
        // Keyboard focus ring
        'focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-accent-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
        'focus-visible:scale-[1.04]',
        'focus-visible:shadow-[var(--shadow-focus-tv)]',
        className,
      )}
    >
      {/* Image */}
      {!imgError ? (
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          decoding="async"
          onError={handleImgError}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <LandscapeFallback title={title} />
      )}

      {/* Bottom gradient overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bg-primary/90 to-transparent pointer-events-none"
      />

      {/* Text overlay — bottom */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 px-2.5 pointer-events-none',
          hasProgress ? 'pb-3.5' : 'pb-2.5',
        )}
      >
        <p className="font-medium text-text-primary truncate font-[family-name:var(--font-family-heading)] text-xs leading-snug">
          {title}
        </p>
        {subtitle && (
          <p className="text-[10px] text-text-secondary truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Progress bar — absolute bottom, always above gradient */}
      {hasProgress && <ProgressBar value={progress!} />}
    </div>
  );
});
