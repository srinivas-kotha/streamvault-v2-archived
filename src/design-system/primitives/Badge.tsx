import { cn } from "@/shared/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Badge variants using new design-system tokens only.
 * - primary   : teal accent — highlights / new content
 * - secondary : surface-raised — neutral label
 * - status    : maps to semantic sub-variants via `statusColor` prop
 * - new       : alias kept for back-compat with content-rail badges
 * - live      : live-stream indicator with pulsing dot
 * - rating    : star + score
 */
export type BadgeVariant =
  | "primary"
  | "secondary"
  | "status"
  | "new"
  | "live"
  | "rating";
export type BadgeSize = "sm" | "md" | "lg";
export type BadgeStatusColor = "success" | "warning" | "error" | "info";

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Only applies when variant="status" — maps to semantic color token */
  statusColor?: BadgeStatusColor;
  className?: string;
  children?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Style maps (new design-system tokens only — zero old CSS)
// ---------------------------------------------------------------------------

const variantClasses: Record<BadgeVariant, string> = {
  primary: "bg-accent-teal/20 text-accent-teal",
  secondary: "bg-bg-tertiary text-text-secondary border border-border",
  status: "bg-bg-tertiary text-text-secondary", // overridden per statusColor
  new: "bg-accent-teal/20 text-accent-teal",
  live: "bg-error/20 text-error",
  rating: "bg-warning/20 text-warning",
};

const statusColorClasses: Record<BadgeStatusColor, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  error: "bg-error/15 text-error",
  info: "bg-info/15 text-info",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "text-xs px-1.5 py-0.5",
  md: "text-sm px-2 py-0.5",
  lg: "text-base px-3 py-1",
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
      style={{ animation: "pulse 2s infinite" }}
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
  variant = "secondary",
  size = "md",
  statusColor = "info",
  className,
  children,
}: BadgeProps) {
  const colorClass =
    variant === "status"
      ? statusColorClasses[statusColor]
      : variantClasses[variant];

  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-1 font-medium rounded-full",
        "transition-[background-color,color] duration-[var(--transition-fast)]",
        colorClass,
        sizeClasses[size],
        className,
      )}
    >
      {variant === "live" && <LiveDot />}
      {variant === "rating" && <StarIcon />}
      {children}
    </span>
  );
}
