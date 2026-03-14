import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full px-4 py-2.5 bg-surface-raised border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal-dim transition-[border-color,box-shadow] ${
            error ? 'border-error' : 'border-border'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-error text-xs mt-1">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
