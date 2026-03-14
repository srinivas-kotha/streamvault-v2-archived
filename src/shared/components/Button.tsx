import { type ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
}

const variants: Record<Variant, string> = {
  primary: 'bg-gradient-to-r from-teal-dim to-teal text-obsidian hover:opacity-90 focus:ring-teal/50',
  secondary: 'bg-surface-raised border border-border text-text-primary hover:bg-surface-hover focus:ring-indigo/50',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-raised focus:ring-teal/50',
  danger: 'bg-error/10 text-error border border-error/30 hover:bg-error/20 focus:ring-error/50',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`inline-flex items-center justify-center font-medium rounded-lg transition-[background-color,box-shadow,opacity,transform,filter] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-obsidian disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
