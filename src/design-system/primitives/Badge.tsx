import { cn } from '@/shared/utils/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BadgeVariant = 'default' | 'new' | 'live' | 'rating';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  children?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Style maps
// ---------------------------------------------------------------------------

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-bg-tertiary text-text-secondary',
  new: 'bg-accent-teal/20 text-accent-teal',
  live: 'bg-error/20 text-error',
  rating: 'bg-warning/20 text-warning',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-0.5',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Pulsing red dot used in the LIVE badge */
function LiveDot() {
  return (
    <span
      aria-hidden="true"
      className="inline-block w-1.5 h-1.5 rounded-full bg-error"
      style={{ animation: 'pulse 2s infinite' }}
    />
  );
}

/** Star icon used in the rating badge */
function StarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      fill="currentColor"
      className="inline-block w-3 h-3 shrink-0"
    >
      <path d="M6 1l1.39 2.82L10.5 4.27l-2.25 2.19.53 3.1L6 8.02 3.22 9.56l.53-3.1L1.5 4.27l3.11-.45L6 1z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Badge({
  variant = 'default',
  size = 'md',
  className,
  children,
}: BadgeProps) {
  return (
    <span
      role="status"
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full',
        'transition-[background-color,color] duration-[var(--transition-fast)]',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {variant === 'live' && <LiveDot />}
      {variant === 'rating' && <StarIcon />}
      {children}
    </span>
  );
}
