import { type InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/shared/utils/cn";
import { useFocusStyles } from "../focus/useFocusStyles";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToggleSize = "sm" | "md" | "lg";

export interface ToggleProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "type"
> {
  /** Controlled checked state */
  checked?: boolean;
  /** Accessible label — rendered visually next to the toggle */
  label?: string;
  /** Hide the label visually (still accessible via aria-label) */
  hideLabel?: boolean;
  size?: ToggleSize;
  /** TV / D-pad spatial nav focus — applies TV-optimised focus ring visible at 10ft */
  isTVFocused?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Size tokens
// ---------------------------------------------------------------------------

const trackSize: Record<
  ToggleSize,
  { track: string; thumb: string; thumbOn: string }
> = {
  sm: {
    track: "w-8 h-4",
    thumb: "w-3 h-3 top-0.5 left-0.5",
    thumbOn: "translate-x-4",
  },
  md: {
    track: "w-11 h-6",
    thumb: "w-5 h-5 top-0.5 left-0.5",
    thumbOn: "translate-x-5",
  },
  lg: {
    track: "w-14 h-7",
    thumb: "w-6 h-6 top-0.5 left-0.5",
    thumbOn: "translate-x-7",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Toggle
 *
 * Accessible on/off switch backed by a visually-hidden <input type="checkbox">.
 * Supports keyboard (Space/Enter), pointer, and TV D-pad (isTVFocused prop).
 *
 * Animation: thumb slides with `transition-transform duration-200 ease-out`
 * TV focus: thick teal ring via useFocusStyles().buttonFocus, readable at 10ft.
 */
export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(function Toggle(
  {
    checked,
    label,
    hideLabel = false,
    size = "md",
    isTVFocused = false,
    disabled,
    id,
    className,
    onChange,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const focusStyles = useFocusStyles();
  const { track, thumb, thumbOn } = trackSize[size];

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "inline-flex items-center gap-2.5 select-none",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
    >
      {/* Visually hidden native checkbox — drives accessibility */}
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="sr-only"
        {...props}
      />

      {/* Track */}
      <span
        aria-hidden="true"
        className={cn(
          "relative inline-block rounded-full shrink-0",
          "transition-[background-color,box-shadow] duration-[var(--transition-normal)]",
          track,
          // Off state: subtle surface
          "bg-bg-tertiary border border-border",
          // On state: teal fill
          checked && "bg-accent-teal border-accent-teal",
          // TV focus ring
          isTVFocused && focusStyles.buttonFocus,
        )}
      >
        {/* Thumb */}
        <span
          className={cn(
            "absolute rounded-full bg-text-primary shadow-sm",
            "transition-transform duration-200 ease-out",
            thumb,
            checked && thumbOn,
          )}
        />
      </span>

      {/* Label */}
      {label && (
        <span
          className={cn(
            "text-text-primary font-medium",
            size === "sm" && "text-xs",
            size === "md" && "text-sm",
            size === "lg" && "text-base",
            hideLabel && "sr-only",
          )}
        >
          {label}
        </span>
      )}
    </label>
  );
});

Toggle.displayName = "Toggle";
