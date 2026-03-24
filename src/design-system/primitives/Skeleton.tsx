import { cn } from '@/shared/utils/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SkeletonRounded = 'sm' | 'md' | 'lg' | 'full';
export type SkeletonVariant = 'text' | 'card' | 'avatar';

export interface SkeletonProps {
  /** Additional Tailwind classes — use for width/height overrides */
  className?: string;
  /** Explicit width (e.g. '80px', '100%', '12rem') */
  width?: string | number;
  /** Explicit height (e.g. '16px', '1rem') */
  height?: string | number;
  /** Border-radius scale */
  rounded?: SkeletonRounded;
  /** Semantic variant — controls default shape */
  variant?: SkeletonVariant;
  /** Accessible label for screen readers */
  'aria-label'?: string;
}

// ---------------------------------------------------------------------------
// Style maps
// ---------------------------------------------------------------------------

const roundedClasses: Record<SkeletonRounded, string> = {
  sm: 'rounded-[var(--radius-sm)]',
  md: 'rounded-[var(--radius-md)]',
  lg: 'rounded-[var(--radius-lg)]',
  full: 'rounded-full',
};

/**
 * Default dimensions per variant. Consumers can override via `className`,
 * `width`, or `height`.
 */
const variantDefaults: Record<SkeletonVariant, { base: string; defaultRounded: SkeletonRounded }> = {
  // Single-line text placeholder
  text: { base: 'h-4 w-full', defaultRounded: 'md' },
  // Rectangle content card placeholder
  card: { base: 'w-full aspect-video', defaultRounded: 'lg' },
  // Circular avatar placeholder
  avatar: { base: 'w-10 h-10', defaultRounded: 'full' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Skeleton({
  className,
  width,
  height,
  rounded,
  variant = 'text',
  'aria-label': ariaLabel = 'Loading…',
}: SkeletonProps) {
  const { base, defaultRounded } = variantDefaults[variant];
  const resolvedRounded = rounded ?? defaultRounded;

  const inlineStyle: React.CSSProperties = {};
  if (width !== undefined) inlineStyle.width = typeof width === 'number' ? `${width}px` : width;
  if (height !== undefined) inlineStyle.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      aria-busy="true"
      style={inlineStyle}
      className={cn(
        'bg-bg-tertiary',
        // Opacity-only pulse — no transform, keeps layout stable on TV
        'animate-pulse',
        roundedClasses[resolvedRounded],
        base,
        className,
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// Composite helpers (convenience wrappers, not exported from barrel index)
// ---------------------------------------------------------------------------

/**
 * Multi-line text block skeleton. Renders `lines` rows of varying widths to
 * mimic natural paragraph flow.
 */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  // Pre-defined width sequence to avoid random re-renders
  const widths = ['w-full', 'w-5/6', 'w-4/5', 'w-3/4', 'w-2/3', 'w-full', 'w-5/6'];

  return (
    <div className={cn('flex flex-col gap-2', className)} aria-label="Loading text" role="status" aria-busy="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={widths[i % widths.length]}
          aria-label={undefined}
        />
      ))}
    </div>
  );
}
