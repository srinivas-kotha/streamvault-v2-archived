import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/design-system/primitives/Button';
import { Badge } from '@/design-system/primitives/Badge';
import { Skeleton, SkeletonText } from '@/design-system/primitives/Skeleton';
import { useToast } from '@/design-system/primitives/Toast';
import { PosterCard } from '@/design-system/cards/PosterCard';
import { LandscapeCard } from '@/design-system/cards/LandscapeCard';
import { HeroCard } from '@/design-system/cards/HeroCard';
import { FocusRing } from '@/design-system/focus/FocusRing';
import { cn } from '@/shared/utils/cn';

// ---------------------------------------------------------------------------
// Route definition
// ---------------------------------------------------------------------------

export const Route = createFileRoute('/dev/design-system')({
  component: DesignSystemPage,
});

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1 border-b border-white/8 pb-4">
        <h2 className="text-2xl font-bold text-text-primary font-[family-name:var(--font-family-heading)]">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-text-secondary font-[family-name:var(--font-family-body)]">
            {description}
          </p>
        )}
      </div>
      <div className={className}>{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Token row label helper
// ---------------------------------------------------------------------------

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs text-text-tertiary font-mono mt-1 block">
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Color Swatch
// ---------------------------------------------------------------------------

function ColorSwatch({
  name,
  hex,
  bgClass,
  style,
}: {
  name: string;
  hex: string;
  bgClass?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-[80px]">
      <div
        className={cn(
          'h-14 w-full rounded-[var(--radius-md)] border border-white/8',
          bgClass,
        )}
        style={style}
        aria-hidden="true"
      />
      <div>
        <p className="text-xs font-medium text-text-primary font-mono leading-snug">
          {name}
        </p>
        <p className="text-xs text-text-tertiary font-mono">{hex}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-section wrapper
// ---------------------------------------------------------------------------

function SubSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary">
        {title}
      </h3>
      <div className={className}>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spacing Box
// ---------------------------------------------------------------------------

function SpacingBox({ size, label }: { size: number; label: string }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <div
        className="bg-accent-teal/30 border border-accent-teal/40 rounded-[var(--radius-sm)]"
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
      <Label>{label}</Label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Radius Box
// ---------------------------------------------------------------------------

function RadiusBox({ label, cssVar }: { label: string; cssVar: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="w-16 h-16 bg-bg-tertiary border border-white/10"
        style={{ borderRadius: `var(${cssVar})` }}
        aria-hidden="true"
      />
      <Label>{label}</Label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Focus Ring Demo Item
// ---------------------------------------------------------------------------

function FocusRingDemo({
  variant,
  label,
}: {
  variant: 'card' | 'button' | 'input';
  label: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-2 items-start">
      <FocusRing
        variant={variant}
        isFocused={focused}
        className={cn(
          'rounded-[var(--radius-md)]',
          variant === 'card' && 'rounded-[var(--radius-lg)]',
        )}
      >
        <button
          type="button"
          onMouseEnter={() => setFocused(true)}
          onMouseLeave={() => setFocused(false)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn(
            'bg-bg-tertiary border border-white/10 text-text-secondary text-sm px-4 py-2',
            'rounded-[var(--radius-md)] cursor-pointer',
            variant === 'card' && 'w-24 h-32 rounded-[var(--radius-lg)] flex items-center justify-center text-xs',
          )}
        >
          {variant === 'card' ? 'Card' : label}
        </button>
      </FocusRing>
      <Label>{label} (hover to preview)</Label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

function DesignSystemPage() {
  const { error, warning, info, success } = useToast();

  return (
    <div className="bg-bg-primary min-h-screen">
      <div className="max-w-7xl mx-auto px-[var(--spacing-page-x)] py-12">

        {/* Page header */}
        <div className="mb-12 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-2 h-8 rounded-full"
              style={{ background: 'var(--gradient-brand)' }}
              aria-hidden="true"
            />
            <h1 className="text-4xl font-bold text-text-primary font-[family-name:var(--font-family-heading)] tracking-tight">
              StreamVault v2 Design System
            </h1>
          </div>
          <p className="text-text-secondary font-[family-name:var(--font-family-body)] max-w-2xl leading-relaxed">
            Sprint 0 component showcase. All design tokens, primitives, cards, and
            interaction patterns. Developer reference only — not user-facing.
          </p>
          <div className="flex gap-2 mt-1">
            <Badge variant="new" size="sm">Sprint 0</Badge>
            <Badge variant="default" size="sm">Dev Tool</Badge>
          </div>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-16">

          {/* ----------------------------------------------------------------
              Color Tokens
          ---------------------------------------------------------------- */}
          <Section
            title="Color Tokens"
            description="All Tailwind @theme color variables. These map directly to bg-*, text-*, accent-*, status-* utility classes."
          >
            <div className="flex flex-col gap-8">

              <SubSection title="Background" className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-4">
                <ColorSwatch name="bg-primary" hex="#0a0a0f" style={{ background: '#0a0a0f' }} />
                <ColorSwatch name="bg-secondary" hex="#141418" style={{ background: '#141418' }} />
                <ColorSwatch name="bg-tertiary" hex="#1a1a22" style={{ background: '#1a1a22' }} />
                <ColorSwatch name="bg-hover" hex="#1e1e28" style={{ background: '#1e1e28' }} />
                <ColorSwatch name="bg-overlay" hex="rgba(10,10,15,.85)" style={{ background: 'rgba(10,10,15,0.85)' }} />
              </SubSection>

              <SubSection title="Accent" className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-4">
                <ColorSwatch name="accent-teal" hex="#14b8a6" style={{ background: '#14b8a6' }} />
                <ColorSwatch name="accent-teal-dim" hex="#0d9488" style={{ background: '#0d9488' }} />
                <ColorSwatch name="accent-indigo" hex="#6366f1" style={{ background: '#6366f1' }} />
                <ColorSwatch name="accent-indigo-dim" hex="#4f46e5" style={{ background: '#4f46e5' }} />
              </SubSection>

              <SubSection title="Text" className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-4">
                <ColorSwatch name="text-primary" hex="#f5f5f5" style={{ background: '#f5f5f5' }} />
                <ColorSwatch name="text-secondary" hex="#94a3b8" style={{ background: '#94a3b8' }} />
                <ColorSwatch name="text-tertiary" hex="#64748b" style={{ background: '#64748b' }} />
              </SubSection>

              <SubSection title="Status" className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-4">
                <ColorSwatch name="success" hex="#22c55e" style={{ background: '#22c55e' }} />
                <ColorSwatch name="warning" hex="#eab308" style={{ background: '#eab308' }} />
                <ColorSwatch name="error" hex="#ef4444" style={{ background: '#ef4444' }} />
                <ColorSwatch name="info" hex="#3b82f6" style={{ background: '#3b82f6' }} />
              </SubSection>

              <SubSection title="Gradients" className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                <div className="flex flex-col gap-1.5">
                  <div
                    className="h-14 w-full rounded-[var(--radius-md)] border border-white/8"
                    style={{ background: 'var(--gradient-brand)' }}
                    aria-hidden="true"
                  />
                  <p className="text-xs font-mono text-text-primary">gradient-brand</p>
                  <p className="text-xs font-mono text-text-tertiary">teal → indigo, 135°</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div
                    className="h-14 w-full rounded-[var(--radius-md)] border border-white/8"
                    style={{ background: 'var(--gradient-hero)' }}
                    aria-hidden="true"
                  />
                  <p className="text-xs font-mono text-text-primary">gradient-hero</p>
                  <p className="text-xs font-mono text-text-tertiary">bg-primary → transparent, top</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div
                    className="h-14 w-full rounded-[var(--radius-md)] border border-white/8"
                    style={{ background: 'var(--gradient-card)' }}
                    aria-hidden="true"
                  />
                  <p className="text-xs font-mono text-text-primary">gradient-card</p>
                  <p className="text-xs font-mono text-text-tertiary">bg-primary/90 → transparent, top</p>
                </div>
              </SubSection>
            </div>
          </Section>

          {/* ----------------------------------------------------------------
              Typography
          ---------------------------------------------------------------- */}
          <Section
            title="Typography"
            description="Satoshi (font-heading) for headings and UI labels. General Sans (font-body) for body copy and descriptions."
          >
            <div className="flex flex-col gap-10">

              <SubSection title="Satoshi — Heading Font">
                <div className="flex flex-col gap-4 bg-bg-secondary rounded-[var(--radius-lg)] p-6 border border-white/6">
                  {[
                    { size: 'text-4xl', label: '4xl / 2.5rem', sample: 'Pushpa 2: The Rule' },
                    { size: 'text-3xl', label: '3xl / 2rem', sample: 'RRR — Rise, Roar, Revolt' },
                    { size: 'text-2xl', label: '2xl / 1.5rem', sample: 'Baahubali: The Beginning' },
                    { size: 'text-xl', label: 'xl / 1.25rem', sample: 'KGF Chapter 2' },
                    { size: 'text-lg', label: 'lg / 1.125rem', sample: 'Kantara: A Legend' },
                    { size: 'text-base', label: 'base / 1rem', sample: 'Vikram — A Lokesh Kanagaraj Film' },
                    { size: 'text-sm', label: 'sm / 0.875rem', sample: 'All films, categories, and collections' },
                    { size: 'text-xs', label: 'xs / 0.75rem', sample: 'Badge labels, metadata, timestamps' },
                  ].map(({ size, label, sample }) => (
                    <div key={label} className="flex items-baseline gap-4">
                      <span
                        className={cn(
                          size,
                          'text-text-primary font-[family-name:var(--font-family-heading)] font-semibold leading-tight flex-1',
                        )}
                      >
                        {sample}
                      </span>
                      <span className="text-xs font-mono text-text-tertiary shrink-0 w-28 text-right">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </SubSection>

              <SubSection title="General Sans — Body Font">
                <div className="flex flex-col gap-4 bg-bg-secondary rounded-[var(--radius-lg)] p-6 border border-white/6">
                  {[
                    { size: 'text-lg', label: 'lg / 1.125rem', sample: 'Discover thousands of movies and TV shows.' },
                    { size: 'text-base', label: 'base / 1rem', sample: 'Stream in HD quality. Available on all your devices.' },
                    { size: 'text-sm', label: 'sm / 0.875rem', sample: 'Continue watching where you left off. Resuming from 42:30.' },
                    { size: 'text-xs', label: 'xs / 0.75rem', sample: 'Action • Drama • 2h 19m • 2022 • Telugu' },
                  ].map(({ size, label, sample }) => (
                    <div key={label} className="flex items-baseline gap-4">
                      <span
                        className={cn(
                          size,
                          'text-text-secondary font-[family-name:var(--font-family-body)] leading-relaxed flex-1',
                        )}
                      >
                        {sample}
                      </span>
                      <span className="text-xs font-mono text-text-tertiary shrink-0 w-28 text-right">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </SubSection>

              <SubSection title="JetBrains Mono — Code / Labels">
                <div className="bg-bg-secondary rounded-[var(--radius-lg)] p-6 border border-white/6">
                  <span className="text-sm font-mono text-accent-teal">
                    --font-family-mono: 'JetBrains Mono', monospace
                  </span>
                </div>
              </SubSection>
            </div>
          </Section>

          {/* ----------------------------------------------------------------
              Spacing & Radius
          ---------------------------------------------------------------- */}
          <Section
            title="Spacing & Radius"
            description="Spacing tokens are CSS custom properties for layout. Border-radius tokens define the corner style scale."
          >
            <div className="flex flex-col gap-10">

              <SubSection title="Spacing Scale" className="flex flex-wrap gap-8 items-end">
                <SpacingBox size={4} label="4px" />
                <SpacingBox size={8} label="8px" />
                <SpacingBox size={12} label="12px" />
                <SpacingBox size={16} label="16px" />
                <SpacingBox size={24} label="24px" />
                <SpacingBox size={32} label="32px" />
                <SpacingBox size={48} label="48px" />
                <SpacingBox size={64} label="64px" />
              </SubSection>

              <SubSection title="Layout Tokens" className="flex flex-col gap-2">
                {[
                  { name: '--spacing-page-x', value: 'clamp(1rem, 4vw, 3rem)', desc: 'Horizontal page padding' },
                  { name: '--spacing-rail-gap', value: '0.75rem', desc: 'Gap between cards in a rail' },
                  { name: '--spacing-section-gap', value: '2rem', desc: 'Vertical gap between page sections' },
                ].map(({ name, value, desc }) => (
                  <div
                    key={name}
                    className="flex items-center gap-4 py-2.5 px-3 rounded-[var(--radius-sm)] bg-bg-tertiary border border-white/6"
                  >
                    <code className="text-xs font-mono text-accent-teal shrink-0 w-52">{name}</code>
                    <code className="text-xs font-mono text-text-secondary shrink-0 w-40">{value}</code>
                    <span className="text-xs text-text-tertiary">{desc}</span>
                  </div>
                ))}
              </SubSection>

              <SubSection title="Border Radius Scale" className="flex flex-wrap gap-6 items-end">
                <RadiusBox label="--radius-sm (6px)" cssVar="--radius-sm" />
                <RadiusBox label="--radius-md (8px)" cssVar="--radius-md" />
                <RadiusBox label="--radius-lg (12px)" cssVar="--radius-lg" />
                <RadiusBox label="--radius-xl (16px)" cssVar="--radius-xl" />
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-16 h-16 bg-bg-tertiary border border-white/10 rounded-full"
                    aria-hidden="true"
                  />
                  <Label>--radius-full (9999px)</Label>
                </div>
              </SubSection>
            </div>
          </Section>

          {/* ----------------------------------------------------------------
              Buttons
          ---------------------------------------------------------------- */}
          <Section
            title="Buttons"
            description="Polymorphic Button component with 4 variants × 3 sizes. The icon variant ignores size padding and uses a circular shape."
          >
            <div className="flex flex-col gap-8">
              {(
                [
                  { variant: 'primary', label: 'Primary' },
                  { variant: 'secondary', label: 'Secondary' },
                  { variant: 'ghost', label: 'Ghost' },
                ] as const
              ).map(({ variant, label }) => (
                <SubSection key={variant} title={label}>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-col items-start gap-1">
                      <Button variant={variant} size="sm">{label}</Button>
                      <Label>size=sm</Label>
                    </div>
                    <div className="flex flex-col items-start gap-1">
                      <Button variant={variant} size="md">{label}</Button>
                      <Label>size=md</Label>
                    </div>
                    <div className="flex flex-col items-start gap-1">
                      <Button variant={variant} size="lg">{label}</Button>
                      <Label>size=lg</Label>
                    </div>
                    <div className="flex flex-col items-start gap-1">
                      <Button variant={variant} size="md" disabled>{label}</Button>
                      <Label>disabled</Label>
                    </div>
                  </div>
                </SubSection>
              ))}

              <SubSection title="Icon">
                <div className="flex flex-wrap items-center gap-4">
                  {(['sm', 'md', 'lg'] as const).map((size) => (
                    <div key={size} className="flex flex-col items-center gap-1">
                      <Button variant="icon" size={size} aria-label="Play">
                        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                          <path d="M3 2.75A.75.75 0 0 1 4.224 2.1l10 5.25a.75.75 0 0 1 0 1.3l-10 5.25A.75.75 0 0 1 3 13.25v-10.5Z" />
                        </svg>
                      </Button>
                      <Label>size={size}</Label>
                    </div>
                  ))}
                </div>
              </SubSection>
            </div>
          </Section>

          {/* ----------------------------------------------------------------
              Badges
          ---------------------------------------------------------------- */}
          <Section
            title="Badges"
            description="Inline status indicators. The live variant includes a pulsing red dot. The rating variant includes a star icon."
          >
            <div className="flex flex-col gap-6">
              {(
                [
                  { variant: 'default', label: 'Default', content: 'Drama' },
                  { variant: 'new', label: 'New', content: 'NEW' },
                  { variant: 'live', label: 'Live', content: 'LIVE' },
                  { variant: 'rating', label: 'Rating', content: '8.5' },
                ] as const
              ).map(({ variant, label, content }) => (
                <SubSection key={variant} title={label}>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-col items-start gap-1">
                      <Badge variant={variant} size="sm">{content}</Badge>
                      <Label>size=sm</Label>
                    </div>
                    <div className="flex flex-col items-start gap-1">
                      <Badge variant={variant} size="md">{content}</Badge>
                      <Label>size=md</Label>
                    </div>
                  </div>
                </SubSection>
              ))}
            </div>
          </Section>

          {/* ----------------------------------------------------------------
              Skeletons
          ---------------------------------------------------------------- */}
          <Section
            title="Skeletons"
            description="Loading placeholders. All use opacity-pulse animation (no transform) to keep layout stable during loading."
          >
            <div className="flex flex-col gap-8">

              <SubSection title="Text variant">
                <div className="flex flex-col gap-4 max-w-sm">
                  <div>
                    <Skeleton variant="text" className="w-3/4" />
                    <Label>Single line (w-3/4)</Label>
                  </div>
                  <div>
                    <Skeleton variant="text" className="w-full" />
                    <Label>Single line (w-full)</Label>
                  </div>
                  <div>
                    <SkeletonText lines={3} />
                    <Label>SkeletonText — 3 lines (auto-varying widths)</Label>
                  </div>
                  <div>
                    <SkeletonText lines={5} />
                    <Label>SkeletonText — 5 lines</Label>
                  </div>
                </div>
              </SubSection>

              <SubSection title="Card variant" className="max-w-xs">
                <Skeleton variant="card" />
                <Label>Card (full-width, aspect-video)</Label>
              </SubSection>

              <SubSection title="Avatar variant" className="flex flex-wrap gap-6 items-end">
                <div>
                  <Skeleton variant="avatar" />
                  <Label>Avatar default (w-10 h-10)</Label>
                </div>
                <div>
                  <Skeleton variant="avatar" width={64} height={64} />
                  <Label>Avatar large (64×64)</Label>
                </div>
                <div>
                  <Skeleton variant="avatar" width={96} height={96} />
                  <Label>Avatar xl (96×96)</Label>
                </div>
              </SubSection>

              <SubSection title="Composed — Card loading skeleton" className="max-w-xs">
                <div className="flex flex-col gap-3">
                  <Skeleton variant="card" />
                  <Skeleton variant="text" className="w-3/4" />
                  <Skeleton variant="text" className="w-1/2" />
                </div>
                <Label>Poster card placeholder (card + 2 text lines)</Label>
              </SubSection>
            </div>
          </Section>

          {/* ----------------------------------------------------------------
              Toast
          ---------------------------------------------------------------- */}
          <Section
            title="Toast Notifications"
            description="4 severity levels rendered by ToastContainer (fixed bottom-right). Auto-dismiss after 5s. Max 3 toasts shown simultaneously."
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => error('Failed to load stream. Please try again.')}
                >
                  Trigger Error
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => warning('Your session will expire in 5 minutes.')}
                >
                  Trigger Warning
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => info('New content available in your favorites.')}
                >
                  Trigger Info
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => success('Added to favorites.')}
                >
                  Trigger Success
                </Button>
              </div>

              <div className="rounded-[var(--radius-lg)] bg-bg-secondary border border-white/6 p-5">
                <h4 className="text-sm font-semibold text-text-primary mb-3 font-[family-name:var(--font-family-heading)]">
                  Severity reference
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      { label: 'error', border: 'border-error/50 bg-error/10 text-error', icon: '✕' },
                      { label: 'warning', border: 'border-warning/50 bg-warning/10 text-warning', icon: '⚠' },
                      { label: 'info', border: 'border-info/50 bg-info/10 text-info', icon: 'ℹ' },
                      { label: 'success', border: 'border-success/50 bg-success/10 text-success', icon: '✓' },
                    ] as const
                  ).map(({ label, border, icon }) => (
                    <div
                      key={label}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-md)] border text-sm font-medium',
                        border,
                      )}
                    >
                      <span className="font-bold">{icon}</span>
                      <span>severity="{label}" sample</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* ----------------------------------------------------------------
              Cards
          ---------------------------------------------------------------- */}
          <Section
            title="Cards"
            description="Three card variants for different content layouts. All use memo(), specific CSS transitions, and have image fallback states."
          >
            <div className="flex flex-col gap-10">

              <SubSection
                title="PosterCard — 2:3 aspect, for VOD and series grids"
                className="flex flex-wrap gap-6"
              >
                <div className="flex flex-col gap-2">
                  <div className="w-36">
                    <PosterCard
                      title="Baahubali"
                      imageUrl=""
                      rating={8.5}
                      isNew={true}
                      focusKey="ds-poster-1"
                    />
                  </div>
                  <Label>imageUrl="" → fallback gradient</Label>
                  <Label>rating=8.5, isNew=true</Label>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="w-36">
                    <PosterCard
                      title="KGF Chapter 2: The Rise of Rocking Star Yash"
                      imageUrl=""
                      rating={7.9}
                      focusKey="ds-poster-2"
                    />
                  </div>
                  <Label>Long title truncation</Label>
                  <Label>rating=7.9, isNew=false</Label>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="w-36">
                    <PosterCard
                      title="Vikram"
                      imageUrl=""
                      focusKey="ds-poster-3"
                    />
                  </div>
                  <Label>No badges</Label>
                </div>
              </SubSection>

              <SubSection
                title="LandscapeCard — 16:9 aspect, for episodes and continue-watching"
                className="flex flex-wrap gap-6"
              >
                <div className="flex flex-col gap-2">
                  <div className="w-72">
                    <LandscapeCard
                      title="RRR - Rise Roar Revolt"
                      imageUrl=""
                      subtitle="Action • 2022"
                      progress={65}
                      focusKey="ds-landscape-1"
                    />
                  </div>
                  <Label>progress=65 (continue-watching bar)</Label>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="w-72">
                    <LandscapeCard
                      title="Kantara: A Legend"
                      imageUrl=""
                      subtitle="Drama • Thriller • 2022"
                      focusKey="ds-landscape-2"
                    />
                  </div>
                  <Label>No progress bar</Label>
                </div>
              </SubSection>

              <SubSection
                title="HeroCard — full-width featured slot with brand gradient fallback"
              >
                <HeroCard
                  title="Pushpa 2: The Rule"
                  description="The rule continues. Pushpa Raj expands his sandalwood empire and faces a new, deadlier nemesis. A story of power, loyalty, and defiance."
                  imageUrl=""
                >
                  <Button variant="primary" size="md">Watch Now</Button>
                  <Button variant="secondary" size="md">More Info</Button>
                </HeroCard>
                <Label>imageUrl="" → brand gradient fallback. Children = CTA buttons.</Label>
              </SubSection>
            </div>
          </Section>

          {/* ----------------------------------------------------------------
              Focus System
          ---------------------------------------------------------------- */}
          <Section
            title="Focus System"
            description="FocusRing wraps any element and applies TV- or desktop-appropriate ring styles based on the isFocused prop. Powered by useFocusStyles() which reads the isTVMode constant at boot."
          >
            <div className="flex flex-col gap-8">
              <SubSection
                title="FocusRing variants (hover each element to preview focus state)"
                className="flex flex-wrap gap-8 items-start"
              >
                <FocusRingDemo variant="card" label="card variant" />
                <FocusRingDemo variant="button" label="button variant" />
                <FocusRingDemo variant="input" label="input variant" />
              </SubSection>

              <SubSection title="Token reference">
                <div className="flex flex-col gap-2">
                  {[
                    { name: '--shadow-focus', value: '0 0 0 2px rgba(20,184,166,0.6)', desc: 'Desktop focus ring' },
                    { name: '--shadow-focus-tv', value: '0 0 0 3px rgba(20,184,166,0.8), 0 0 20px rgba(20,184,166,0.15)', desc: 'TV focus ring (thicker + glow)' },
                    { name: '--color-focus', value: '#14b8a6', desc: 'Focus ring base color (= accent-teal)' },
                  ].map(({ name, value, desc }) => (
                    <div
                      key={name}
                      className="flex items-start gap-4 py-2.5 px-3 rounded-[var(--radius-sm)] bg-bg-tertiary border border-white/6"
                    >
                      <code className="text-xs font-mono text-accent-teal shrink-0 w-44">{name}</code>
                      <code className="text-xs font-mono text-text-secondary flex-1 break-all">{value}</code>
                      <span className="text-xs text-text-tertiary shrink-0 w-44 text-right">{desc}</span>
                    </div>
                  ))}
                </div>
              </SubSection>
            </div>
          </Section>

          {/* ----------------------------------------------------------------
              Error Boundaries
          ---------------------------------------------------------------- */}
          <Section
            title="Error Boundaries"
            description="Three-level isolation system ensures no single component failure brings down the entire app."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  name: 'AppErrorBoundary',
                  scope: 'Application root',
                  placement: 'Wraps <Outlet /> in __root.tsx',
                  recovery: '"Reload App" button → window.location.reload()',
                  display: 'Full-page centered card',
                  color: 'border-error/30 bg-error/5',
                },
                {
                  name: 'RouteErrorBoundary',
                  scope: 'Individual route',
                  placement: 'Wraps route component or page tree',
                  recovery: '"Go Back" (history.back) + "Try Again" (resets state)',
                  display: 'Inline card, min-h-[400px]',
                  color: 'border-warning/30 bg-warning/5',
                },
                {
                  name: 'PlayerErrorBoundary',
                  scope: 'Video player',
                  placement: 'Wraps <PlayerPage /> in FullscreenPlayer',
                  recovery: '"Retry" resets state, "Close" calls onClose() prop',
                  display: 'Dark overlay matching player UI',
                  color: 'border-info/30 bg-info/5',
                },
              ].map(({ name, scope, placement, recovery, display, color }) => (
                <div
                  key={name}
                  className={cn(
                    'rounded-[var(--radius-lg)] border p-5 flex flex-col gap-3',
                    color,
                  )}
                >
                  <h4 className="text-sm font-semibold text-text-primary font-[family-name:var(--font-family-heading)]">
                    {name}
                  </h4>
                  <dl className="flex flex-col gap-2">
                    {[
                      { dt: 'Scope', dd: scope },
                      { dt: 'Placement', dd: placement },
                      { dt: 'Recovery', dd: recovery },
                      { dt: 'Display', dd: display },
                    ].map(({ dt, dd }) => (
                      <div key={dt}>
                        <dt className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-0.5">
                          {dt}
                        </dt>
                        <dd className="text-xs text-text-secondary leading-snug">{dd}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-text-tertiary font-[family-name:var(--font-family-body)] leading-relaxed">
              All boundaries only show the raw error message in <code className="font-mono text-accent-teal">import.meta.env.DEV</code> mode.
              Production renders only the recovery UI — no internal details exposed.
            </p>
          </Section>

          {/* ----------------------------------------------------------------
              Transition & Z-Index tokens
          ---------------------------------------------------------------- */}
          <Section
            title="Transitions & Z-Index"
            description="All transition durations and z-index values are CSS custom properties. Never use transition-all — always specify exact properties."
          >
            <div className="flex flex-col gap-8">
              <SubSection title="Transition Tokens" className="flex flex-col gap-2">
                {[
                  { name: '--transition-fast', value: '150ms ease-out', usage: 'Hover states, badge color changes' },
                  { name: '--transition-normal', value: '200ms ease-out', usage: 'Card scale, focus ring, overlays' },
                  { name: '--transition-slow', value: '300ms ease-out', usage: 'Page-level transitions' },
                ].map(({ name, value, usage }) => (
                  <div
                    key={name}
                    className="flex items-center gap-4 py-2.5 px-3 rounded-[var(--radius-sm)] bg-bg-tertiary border border-white/6"
                  >
                    <code className="text-xs font-mono text-accent-teal shrink-0 w-44">{name}</code>
                    <code className="text-xs font-mono text-text-secondary shrink-0 w-36">{value}</code>
                    <span className="text-xs text-text-tertiary">{usage}</span>
                  </div>
                ))}
              </SubSection>

              <SubSection title="Z-Index Scale" className="flex flex-col gap-2">
                {[
                  { name: '--z-base', value: '0', usage: 'Default content' },
                  { name: '--z-dropdown', value: '10', usage: 'Dropdowns, menus' },
                  { name: '--z-sticky', value: '20', usage: 'Sticky nav, TopNav' },
                  { name: '--z-overlay', value: '30', usage: 'Sheet overlays, backdrop' },
                  { name: '--z-modal', value: '40', usage: 'Dialogs, modals' },
                  { name: '--z-toast', value: '50', usage: 'Toast notifications (ToastContainer)' },
                  { name: '--z-player', value: '60', usage: 'Fullscreen video player' },
                ].map(({ name, value, usage }) => (
                  <div
                    key={name}
                    className="flex items-center gap-4 py-2.5 px-3 rounded-[var(--radius-sm)] bg-bg-tertiary border border-white/6"
                  >
                    <code className="text-xs font-mono text-accent-teal shrink-0 w-36">{name}</code>
                    <code className="text-xs font-mono text-text-secondary shrink-0 w-8">{value}</code>
                    <span className="text-xs text-text-tertiary">{usage}</span>
                  </div>
                ))}
              </SubSection>
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-white/6 flex items-center justify-between">
          <p className="text-xs text-text-tertiary font-mono">
            /dev/design-system — StreamVault v2.0 Sprint 0
          </p>
          <Badge variant="default" size="sm">Developer Only</Badge>
        </div>

      </div>
    </div>
  );
}
