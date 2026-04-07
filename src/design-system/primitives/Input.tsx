import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { useFocusStyles } from "../focus/useFocusStyles";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InputState = "default" | "error";
export type InputSize = "sm" | "md" | "lg";

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  /** Visual state — drives border/ring color */
  state?: InputState;
  size?: InputSize;
  /** Error message shown below the field when state="error" */
  errorMessage?: string;
  /** Label rendered above the input */
  label?: string;
  /** Icon or adornment placed at the start (left) of the input */
  startAdornment?: ReactNode;
  /** TV / D-pad spatial nav focus — applies TV-optimised focus ring visible at 10ft */
  isTVFocused?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Style maps (new design-system tokens only — zero old CSS)
// ---------------------------------------------------------------------------

const sizeClasses: Record<InputSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-[var(--radius-sm)]",
  md: "px-3.5 py-2 text-sm rounded-[var(--radius-md)]",
  lg: "px-4 py-2.5 text-base rounded-[var(--radius-lg)]",
};

const stateClasses: Record<InputState, string> = {
  default: "border-border focus:border-accent-teal focus:ring-accent-teal",
  error: "border-error focus:border-error focus:ring-error",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    state = "default",
    size = "md",
    errorMessage,
    label,
    startAdornment,
    isTVFocused = false,
    id,
    className,
    disabled,
    ...props
  },
  ref,
) {
  const focusStyles = useFocusStyles();
  const inputId =
    id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-text-secondary uppercase tracking-wide"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {startAdornment && (
          <span className="absolute left-3 flex items-center text-text-tertiary pointer-events-none">
            {startAdornment}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          {...props}
          className={cn(
            // Base
            "w-full bg-bg-secondary text-text-primary placeholder:text-text-muted",
            "border outline-none",
            "transition-[border-color,box-shadow] duration-[var(--transition-fast)]",
            // Focus (keyboard / pointer)
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            // Size
            sizeClasses[size],
            // State-driven border/ring
            stateClasses[state],
            // Start adornment indent
            startAdornment && "pl-9",
            // Disabled
            disabled &&
              "opacity-50 cursor-not-allowed bg-bg-tertiary text-text-tertiary",
            // TV D-pad focus overlay
            isTVFocused && focusStyles.inputFocus,
            className,
          )}
        />
      </div>

      {state === "error" && errorMessage && (
        <p role="alert" className="text-xs text-error mt-0.5">
          {errorMessage}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";
