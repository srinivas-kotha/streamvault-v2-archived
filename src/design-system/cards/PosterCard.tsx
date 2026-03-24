import { useState, memo, useCallback } from 'react';
import { cn } from '@/shared/utils/cn';
import { Badge } from '@/design-system/primitives/Badge';
import { isTVMode } from '@/shared/utils/isTVMode';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PosterCardProps {
  title: string;
  imageUrl: string;
  rating?: string | number;
  isNew?: boolean;
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
      className="absolute inset-0 bg-gradient-to-b from-bg-secondary to-bg-tertiary flex items-end p-3"
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
  onClick,
  className,
  focusKey,
}: PosterCardProps) {
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

  const hasBadge = isNew || rating !== undefined;

  return (
    <div
      data-focus-key={focusKey}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={title}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      className={cn(
        // Sizing: 120px mobile → 180px desktop → 240px TV (set by parent rail/grid)
        'relative cursor-pointer select-none',
        'rounded-[var(--radius-lg)] overflow-hidden',
        // 2:3 aspect
        'aspect-[2/3]',
        // Background for before image loads
        'bg-bg-secondary',
        // Border
        'border border-transparent',
        // Hover — mouse only (TV remotes have no hover capability)
        'hover-capable:border-accent-teal/30',
        // Focus ring — keyboard & TV D-pad
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
        // Scale + shadow on hover/focus (specific props only, no transition-all)
        'transition-[transform,box-shadow,border-color] duration-200 ease-out',
        'hover-capable:hover:scale-[1.04] hover-capable:hover:shadow-[0_4px_24px_rgba(20,184,166,0.15)]',
        'focus-visible:scale-[1.04] focus-visible:shadow-[var(--shadow-focus-tv)]',
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
        <PosterFallback title={title} />
      )}

      {/* Bottom gradient overlay — always rendered so title is readable */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-bg-primary/95 via-bg-primary/40 to-transparent pointer-events-none"
      />

      {/* Badges (top-left) */}
      {hasBadge && (
        <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
          {isNew && (
            <Badge variant="new" size="sm">NEW</Badge>
          )}
          {rating !== undefined && (
            <Badge variant="rating" size="sm">{rating}</Badge>
          )}
        </div>
      )}

      {/* Title — bottom overlay */}
      <div className="absolute inset-x-0 bottom-0 px-2 pb-2 pointer-events-none">
        <p className={cn(
          'font-medium text-text-primary truncate font-[family-name:var(--font-family-heading)] leading-snug',
          isTVMode ? 'text-sm' : 'text-xs',
        )}>
          {title}
        </p>
      </div>
    </div>
  );
});
