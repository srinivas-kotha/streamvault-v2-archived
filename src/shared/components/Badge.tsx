type BadgeVariant = 'default' | 'teal' | 'indigo' | 'warning' | 'error';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-hover text-text-secondary',
  teal: 'bg-teal/15 text-teal',
  indigo: 'bg-indigo/15 text-indigo',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-error/15 text-error',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
