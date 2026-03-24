import {
  type ButtonHTMLAttributes,
  type ElementType,
  type ComponentPropsWithRef,
  forwardRef,
} from 'react';
import { cn } from '@/shared/utils/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

type PolymorphicProps<T extends ElementType> = {
  as?: T;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: React.ReactNode;
} & Omit<ComponentPropsWithRef<T>, 'as' | 'variant' | 'size' | 'className' | 'children'>;

// ---------------------------------------------------------------------------
// Style maps
// ---------------------------------------------------------------------------

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-accent-teal text-bg-primary font-semibold',
    'hover-capable:bg-accent-teal-dim',
    'active:scale-[0.97]',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
  ].join(' '),

  secondary: [
    'bg-bg-tertiary text-text-primary border border-white/10 font-medium',
    'hover-capable:bg-bg-hover',
    'active:scale-[0.97]',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
  ].join(' '),

  ghost: [
    'bg-transparent text-text-secondary font-medium',
    'hover-capable:bg-bg-hover hover-capable:text-text-primary',
    'active:scale-[0.97]',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
  ].join(' '),

  icon: [
    'bg-transparent text-text-secondary',
    'hover-capable:bg-bg-hover hover-capable:text-text-primary',
    'active:scale-[0.95]',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
    'p-2 rounded-full',
  ].join(' '),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-[var(--radius-sm)]',
  md: 'px-4 py-2 text-sm rounded-[var(--radius-md)]',
  lg: 'px-6 py-2.5 text-base rounded-[var(--radius-lg)]',
};

// Icon variant ignores size padding (has its own p-2 in variant classes)
const iconSizeClasses: Record<ButtonSize, string> = {
  sm: 'text-xs rounded-[var(--radius-sm)]',
  md: 'text-sm rounded-full',
  lg: 'text-base rounded-full',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Button = forwardRef(function Button<T extends ElementType = 'button'>(
  {
    as,
    variant = 'primary',
    size = 'md',
    className,
    children,
    ...props
  }: PolymorphicProps<T>,
  ref: React.ForwardedRef<HTMLElement>,
) {
  const Tag = (as ?? 'button') as ElementType;

  const sizeStyle = variant === 'icon' ? iconSizeClasses[size] : sizeClasses[size];

  const defaultButtonProps =
    Tag === 'button'
      ? ({ type: 'button' } as ButtonHTMLAttributes<HTMLButtonElement>)
      : {};

  return (
    <Tag
      ref={ref}
      {...defaultButtonProps}
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'transition-[background-color,border-color,color,transform] duration-[var(--transition-fast)]',
        'cursor-pointer select-none',
        variantClasses[variant],
        sizeStyle,
        className,
      )}
    >
      {children}
    </Tag>
  );
}) as <T extends ElementType = 'button'>(
  props: PolymorphicProps<T> & { ref?: React.ForwardedRef<HTMLElement> },
) => React.ReactElement;

(Button as { displayName?: string }).displayName = 'Button';
