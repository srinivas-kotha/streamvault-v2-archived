import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Button, type ButtonVariant } from '../Button';

// ── helpers ───────────────────────────────────────────────────────────────────

function renderButton(props?: Parameters<typeof Button>[0]) {
  return render(<Button {...props}>Click me</Button>);
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('Button — variants', () => {
  const variants: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'icon'];

  it.each(variants)('renders the %s variant without crashing', (variant) => {
    renderButton({ variant });
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('primary variant includes accent-teal class', () => {
    renderButton({ variant: 'primary' });
    expect(screen.getByRole('button').className).toContain('bg-accent-teal');
  });

  it('secondary variant includes bg-bg-tertiary class', () => {
    renderButton({ variant: 'secondary' });
    expect(screen.getByRole('button').className).toContain('bg-bg-tertiary');
  });

  it('ghost variant is transparent', () => {
    renderButton({ variant: 'ghost' });
    expect(screen.getByRole('button').className).toContain('bg-transparent');
  });

  it('icon variant has rounded-full and p-2 padding', () => {
    renderButton({ variant: 'icon' });
    const el = screen.getByRole('button');
    expect(el.className).toContain('rounded-full');
    expect(el.className).toContain('p-2');
  });
});

describe('Button — as prop (polymorphic)', () => {
  it('renders as an <a> element when as="a" is passed', () => {
    const { container } = render(<Button as="a" href="/test">Link</Button>);
    const el = container.querySelector('a')!;
    expect(el).toBeTruthy();
    expect(el.tagName).toBe('A');
    expect(el.getAttribute('href')).toContain('/test');
  });

  it('renders as a <span> element when as="span" is passed', () => {
    const { container } = render(<Button as="span">Span</Button>);
    expect(container.querySelector('span')).toBeTruthy();
  });
});

describe('Button — disabled', () => {
  it('has disabled attribute when disabled prop is passed', () => {
    renderButton({ disabled: true });
    const el = screen.getByRole('button') as HTMLButtonElement;
    expect(el.disabled).toBe(true);
  });

  it('applies disabled CSS utility classes when disabled', () => {
    renderButton({ disabled: true });
    const el = screen.getByRole('button');
    expect(el.className).toContain('disabled:opacity-50');
    expect(el.className).toContain('disabled:cursor-not-allowed');
  });
});

describe('Button — default type', () => {
  it('adds type="button" for button elements to prevent accidental form submission', () => {
    renderButton();
    const el = screen.getByRole('button') as HTMLButtonElement;
    expect(el.type).toBe('button');
  });

  it('does NOT add type="button" when rendered as a non-button element', () => {
    const { container } = render(<Button as="a">Link</Button>);
    const el = container.querySelector('a')!;
    expect(el.getAttribute('type')).toBeNull();
  });
});

describe('Button — ref forwarding', () => {
  it('forwards ref to the underlying DOM element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref test</Button>);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('BUTTON');
  });
});
