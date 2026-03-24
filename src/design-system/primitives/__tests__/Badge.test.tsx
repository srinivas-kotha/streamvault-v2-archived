import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, type BadgeVariant, type BadgeSize } from '../Badge';

// ── helpers ───────────────────────────────────────────────────────────────────

function renderBadge(props?: React.ComponentPropsWithRef<typeof Badge>, children = 'Label') {
  return render(<Badge {...props}>{children}</Badge>);
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('Badge — variants', () => {
  const variants: BadgeVariant[] = ['default', 'new', 'live', 'rating'];

  it.each(variants)('renders the %s variant without crashing', (variant) => {
    const { container } = renderBadge({ variant });
    expect(container.querySelector('span')).toBeTruthy();
  });

  it('default variant uses secondary text/background classes', () => {
    const { container } = renderBadge({ variant: 'default' });
    const el = container.querySelector('span')!;
    expect(el.className).toContain('bg-bg-tertiary');
    expect(el.className).toContain('text-text-secondary');
  });

  it('new variant uses accent-teal classes', () => {
    const { container } = renderBadge({ variant: 'new' });
    const el = container.querySelector('span')!;
    expect(el.className).toContain('bg-accent-teal');
    expect(el.className).toContain('text-accent-teal');
  });

  it('live variant uses error classes', () => {
    const { container } = renderBadge({ variant: 'live' });
    const el = container.querySelector('span')!;
    expect(el.className).toContain('bg-error');
    expect(el.className).toContain('text-error');
  });

  it('rating variant uses warning classes', () => {
    const { container } = renderBadge({ variant: 'rating' });
    const el = container.querySelector('span')!;
    expect(el.className).toContain('bg-warning');
    expect(el.className).toContain('text-warning');
  });
});

describe('Badge — live variant pulsing dot', () => {
  it('renders a pulsing dot for the live variant', () => {
    const { container } = renderBadge({ variant: 'live' });
    // The LiveDot is an aria-hidden span with rounded-full + bg-error
    const dot = container.querySelector('span[aria-hidden="true"]');
    expect(dot).not.toBeNull();
    expect(dot!.className).toContain('rounded-full');
    expect(dot!.className).toContain('bg-error');
  });

  it('does NOT render a pulsing dot for non-live variants', () => {
    const { container } = renderBadge({ variant: 'new' });
    const dot = container.querySelector('span[aria-hidden="true"]');
    expect(dot).toBeNull();
  });
});

describe('Badge — rating variant star icon', () => {
  it('renders an SVG star icon for the rating variant', () => {
    const { container } = renderBadge({ variant: 'rating' }, '8.5');
    const svg = container.querySelector('svg[aria-hidden="true"]');
    expect(svg).not.toBeNull();
  });

  it('does NOT render an SVG star icon for non-rating variants', () => {
    const { container } = renderBadge({ variant: 'new' });
    const svg = container.querySelector('svg[aria-hidden="true"]');
    expect(svg).toBeNull();
  });
});

describe('Badge — sizes', () => {
  const sizes: BadgeSize[] = ['sm', 'md'];

  it.each(sizes)('renders the %s size without crashing', (size) => {
    const { container } = renderBadge({ size });
    expect(container.querySelector('span')).toBeTruthy();
  });

  it('sm size uses text-xs', () => {
    const { container } = renderBadge({ size: 'sm' });
    const el = container.querySelector('span')!;
    expect(el.className).toContain('text-xs');
  });

  it('md size uses text-sm', () => {
    const { container } = renderBadge({ size: 'md' });
    const el = container.querySelector('span')!;
    expect(el.className).toContain('text-sm');
  });
});

describe('Badge — children', () => {
  it('renders its children', () => {
    renderBadge({}, 'NEW');
    expect(screen.getByText('NEW')).toBeTruthy();
  });
});
