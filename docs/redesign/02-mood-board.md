# StreamVault v3.0 — Mood Board

**Author:** ui-designer (Paperclip)
**Input:** `docs/design-research/dribbble-research.md` (UX Research SRI-157) + Srinibytes Brand System
**Date:** 2026-04-07

---

## Design Concept: "Cinematic Depth"

StreamVault v3.0 visual identity merges the warmth of a private cinema with the sophistication of premium streaming apps (Apple TV+, Mubi). The aesthetic is **dark, layered, and human** — never cold or sterile.

---

## 1. Color Palettes

### 1.1 Primary Palette — "Obsidian Cinema"

| Token           | Value                | Usage                                                        |
| --------------- | -------------------- | ------------------------------------------------------------ |
| `--bg-base`     | `#080C14`            | Page background — rich near-black with slight blue undertone |
| `--bg-surface`  | `#0F1520`            | Cards, sidebars, secondary surfaces                          |
| `--bg-elevated` | `#1A2235`            | Modals, tooltips, focused card backgrounds                   |
| `--bg-overlay`  | `rgba(8,12,20,0.85)` | Content overlays, controls backdrop                          |

**Why this palette:** The slight blue-black (`#080C14`) reads warmer than pure black in low-light environments (the primary IPTV viewing context). It creates natural separation from content without harsh contrast.

---

### 1.2 Accent Palette — "Teal + Indigo Glow"

| Token                | Value     | Usage                                                       |
| -------------------- | --------- | ----------------------------------------------------------- |
| `--accent-primary`   | `#0D9488` | Active states, play buttons, progress bar fill, focus rings |
| `--accent-secondary` | `#6366F1` | Genre badges, secondary CTAs, hover glows                   |
| `--accent-warm`      | `#F59E0B` | "Live Now" badge, premium tier indicator, star ratings      |
| `--accent-danger`    | `#EF4444` | Error states, recording indicator                           |

**Gradient pair (hero sections):**

```css
background: linear-gradient(135deg, #0d9488 0%, #6366f1 100%);
```

**Ambient glow (focused cards):**

```css
box-shadow:
  0 0 30px rgba(13, 148, 136, 0.3),
  0 0 60px rgba(99, 102, 241, 0.15);
```

---

### 1.3 Text Palette — Hierarchy Through Opacity

| Token              | Value                    | Usage                   |
| ------------------ | ------------------------ | ----------------------- |
| `--text-primary`   | `#F8FAFC`                | Titles, primary content |
| `--text-secondary` | `rgba(248,250,252,0.7)`  | Subtitles, descriptions |
| `--text-muted`     | `rgba(248,250,252,0.45)` | Metadata, timestamps    |
| `--text-disabled`  | `rgba(248,250,252,0.25)` | Inactive nav items      |

---

### 1.4 Semantic Palette — Status & Feedback

| State         | Color                   | Token                  |
| ------------- | ----------------------- | ---------------------- |
| Live / Active | `#10B981`               | `--status-live`        |
| Recording     | `#EF4444`               | `--status-recording`   |
| Scheduled     | `#F59E0B`               | `--status-scheduled`   |
| Unavailable   | `rgba(255,255,255,0.2)` | `--status-unavailable` |

---

## 2. Typography Pairs

### 2.1 Primary Pair — "Satoshi + General Sans"

**Heading font: Satoshi**

```css
@import url("https://api.fontshare.com/v2/css?f[]=satoshi@700,600,500&display=swap");

font-family:
  "Satoshi",
  -apple-system,
  BlinkMacSystemFont,
  sans-serif;
```

- Used for: Channel names, show titles, section headers, hero copy
- Character: Geometric, confident, slightly playful — avoids cold "AI app" feel
- Weights used: 500 (medium), 600 (semibold), 700 (bold)

**Body font: General Sans**

```css
@import url("https://api.fontshare.com/v2/css?f[]=general-sans@400,500&display=swap");

font-family: "General Sans", system-ui, sans-serif;
```

- Used for: Descriptions, metadata, UI labels, EPG program text
- Character: Humanist, readable at small sizes, less "techie" than Inter
- Weights used: 400 (regular), 500 (medium)

---

### 2.2 Type Scale

| Scale Step    | Size | Weight | Line-height | Letter-spacing | Usage                |
| ------------- | ---- | ------ | ----------- | -------------- | -------------------- |
| `--text-xs`   | 11px | 400    | 1.4         | +0.3px         | Timestamps, metadata |
| `--text-sm`   | 13px | 400    | 1.5         | 0              | EPG detail, captions |
| `--text-base` | 15px | 400    | 1.6         | 0              | Body, descriptions   |
| `--text-md`   | 18px | 500    | 1.4         | -0.1px         | Card titles, labels  |
| `--text-lg`   | 22px | 600    | 1.3         | -0.2px         | Section headings     |
| `--text-xl`   | 28px | 700    | 1.2         | -0.4px         | Page titles          |
| `--text-hero` | 42px | 700    | 1.1         | -0.8px         | Hero title           |

**TV display scaling (≥1920px viewport):**

```css
@media (min-width: 1920px) {
  :root {
    font-size: 112.5%;
  } /* Scale all rem-based sizes 12.5% up */
}
```

---

### 2.3 Fallback Stack (System Fonts)

```css
--font-heading:
  "Satoshi", "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI",
  sans-serif;
--font-body: "General Sans", "Inter", system-ui, -apple-system, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", "Courier New", monospace;
```

---

## 3. Layout Patterns

### 3.1 Hero Section — "Cinematic Spotlight"

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   [Content thumbnail — full bleed, 60vh min]               │
│                                                             │
│   ░░░░░░░░░░░░░░ gradient overlay bottom 40% ░░░░░░░░░░░░  │
│                                                             │
│   Show Title (42px Satoshi Bold)                           │
│   Genre tags  •  Runtime  •  Year                          │
│   [▶ Play Now]  [+ My List]  [ⓘ More Info]                 │
└─────────────────────────────────────────────────────────────┘
```

- Gradient: `linear-gradient(to top, #080C14 0%, transparent 60%)`
- Thumbnail fills 100% width, object-fit: cover
- Text anchored bottom-left at 48px padding
- Max 3 CTAs — Play is always primary (teal), others ghost

---

### 3.2 Content Rail — "Horizontal Discovery"

```
Section Label (22px semibold)          [See All →]
──────────────────────────────────────────────────────
[Card 1][Card 2][Card 3][Card 4][Card 5][Card 6»]
```

- Cards in `display: flex; gap: 12px; overflow-x: auto`
- Partial 7th card visible (~30px) hints scrollability
- Scroll snap: `scroll-snap-type: x mandatory`
- Section gap: 48px between rails (vertical breathing room)
- Rail header: 18px Satoshi 600, `--text-primary`

---

### 3.3 Content Card

**Portrait Card (9:14 ratio — channels, shows):**

```
┌────────────┐
│            │ ← thumbnail (object-fit: cover)
│  [LIVE]    │ ← status badge (top-right corner)
│            │
│            │
├────────────┤
│ Show Name  │ ← 15px Satoshi 600
│ 8pm • Drama│ ← 12px General Sans, --text-muted
└────────────┘
```

**Landscape Card (16:9 — featured content):**

```
┌──────────────────────┐
│                      │
│   [thumbnail]        │
│                      │
├──────────────────────┤
│ Channel Name         │ ← 15px Satoshi 600
│ Genre • Duration     │ ← 12px, --text-muted
└──────────────────────┘
```

**Focus/Hover state:**

```css
.card:focus,
.card:hover {
  transform: scale(1.04);
  outline: 2px solid var(--accent-primary);
  outline-offset: 3px;
  box-shadow: 0 0 20px rgba(13, 148, 136, 0.4);
  transition:
    transform 180ms ease-out,
    box-shadow 180ms ease-out;
}
```

---

### 3.4 Grid Layout — Channel Browser

```
┌──────────────────────────────────────────────────────────────┐
│  [Search]  [Live]  [Movies]  [Sports]  [Kids]  [My List]     │  ← Tab nav
├──────────────────────────────────────────────────────────────┤
│  [Ch1][Ch2][Ch3][Ch4][Ch5][Ch6]                              │
│  [Ch7][Ch8][Ch9][Ch10][Ch11][Ch12]                           │
│  [Ch13][Ch14][Ch15][Ch16][Ch17][Ch18]                        │
└──────────────────────────────────────────────────────────────┘
```

- Grid: `grid-template-columns: repeat(auto-fill, minmax(160px, 1fr))`
- TV (1920px+): 8 columns
- Desktop (1280px): 6 columns
- Tablet (768px): 4 columns
- Mobile (375px): 2 columns

---

### 3.5 EPG Grid Layout

```
         │ 8:00 PM  │ 8:30 PM  │ 9:00 PM  │ 9:30 PM  │
─────────┼──────────┼──────────┼──────────┼──────────┤
  ESPN   │     SportsCenter     │ Football │  Live    │
─────────┼──────────┼──────────┼──────────┼──────────┤
  CNN    │  Live News           │ Debate   │  Live    │
─────────┼──────────┼──────────┼──────────┼──────────┤
  HBO    │ Game of Thrones               │ Special  │
```

- Current time highlighted with `--accent-primary` vertical line
- Past programs: 40% opacity
- Cell height: 60px (comfortable for D-pad focus)
- Time axis: sticky top, `--bg-elevated` background

---

## 4. Animation Styles

### 4.1 Micro-Interaction Tokens

```css
:root {
  /* Duration */
  --duration-instant: 80ms;
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 400ms;
  --duration-enter: 350ms;
  --duration-exit: 200ms;

  /* Easing */
  --ease-out: cubic-bezier(
    0.16,
    1,
    0.3,
    1
  ); /* Spring-like — feels responsive */
  --ease-in-out: cubic-bezier(
    0.45,
    0,
    0.55,
    1
  ); /* Smooth — for modal overlays */
  --ease-spring: cubic-bezier(
    0.34,
    1.56,
    0.64,
    1
  ); /* Slight overshoot — card focus */
}
```

---

### 4.2 Interaction Animations

| Interaction        | Animation                      | Duration | Easing          |
| ------------------ | ------------------------------ | -------- | --------------- |
| Card focus (D-pad) | `scale(1.06)` + teal glow      | 150ms    | `--ease-spring` |
| Card hover         | `scale(1.04)`                  | 150ms    | `--ease-out`    |
| Page transition    | Fade + translateY(8px)         | 250ms    | `--ease-out`    |
| Modal open         | Fade + scale(0.96→1)           | 300ms    | `--ease-out`    |
| Rail scroll        | `scroll-behavior: smooth`      | —        | browser         |
| Button press       | `scale(0.96)`                  | 80ms     | linear          |
| Badge appear       | `opacity 0→1` + `scale(0.9→1)` | 200ms    | `--ease-out`    |
| Skeleton load      | shimmer gradient               | 1.5s     | linear (loop)   |

---

### 4.3 Page Entry Stagger

Each content section fades in with a stagger offset as the page loads:

```css
.content-rail:nth-child(1) {
  animation-delay: 0ms;
}
.content-rail:nth-child(2) {
  animation-delay: 80ms;
}
.content-rail:nth-child(3) {
  animation-delay: 160ms;
}
/* max stagger 400ms — prevents feeling slow */

@keyframes railEnter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.content-rail {
  animation: railEnter 350ms var(--ease-out) both;
}
```

---

### 4.4 Skeleton Loading State

```css
@keyframes shimmer {
  from {
    background-position: -200% center;
  }
  to {
    background-position: 200% center;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-surface) 25%,
    var(--bg-elevated) 50%,
    var(--bg-surface) 75%
  );
  background-size: 200% auto;
  animation: shimmer 1.5s linear infinite;
  border-radius: 6px;
}
```

---

### 4.5 Reduced Motion Override

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 5. Texture & Depth Tokens

### 5.1 Grain Texture

```css
/* Subtle grain for warmth — avoids flat/sterile look */
.grain-overlay::after {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-size: 200px 200px;
}
```

### 5.2 Glow Layers

```css
/* Section background glow — cinematic depth */
.hero-section {
  position: relative;
  overflow: hidden;
}
.hero-section::before {
  content: "";
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(13, 148, 136, 0.15) 0%,
    transparent 70%
  );
  top: -200px;
  right: -100px;
  pointer-events: none;
}
```

### 5.3 Card Depth

```css
.content-card {
  background: var(--bg-surface);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.content-card:focus,
.content-card.focused {
  border-color: var(--accent-primary);
  box-shadow:
    0 0 0 1px var(--accent-primary),
    0 0 20px rgba(13, 148, 136, 0.35),
    0 8px 32px rgba(0, 0, 0, 0.6);
}
```

---

## 6. Reference Visual Board

### Aesthetic References

| Reference App        | What to Borrow                                                  |
| -------------------- | --------------------------------------------------------------- |
| **Apple TV+**        | Dark substrate, large type, generous whitespace, editorial feel |
| **Arc Browser**      | Depth layers, teal accent, warm gradients, sidebar elegance     |
| **Linear**           | Subtle grain, ambient glow, crisp typography, motion polish     |
| **Raycast**          | Power-user density without coldness, focus ring patterns        |
| **Vercel Dashboard** | Clean hierarchy, muted surface colors, intentional spacing      |
| **Mubi**             | Film-first aesthetic, mood over function, rich card imagery     |

### Anti-References (What to Avoid)

| Anti-Pattern                            | Why It Fails                                  |
| --------------------------------------- | --------------------------------------------- |
| Pure `#000000` backgrounds              | Harsh in low-light; reduces perceived warmth  |
| Generic blue gradient headers           | Screams "2018 SaaS", no identity              |
| Glassy/glassmorphism cards              | Overused, low contrast on complex backgrounds |
| Red play buttons on red backgrounds     | Netflix-clone perception, no own identity     |
| Dense icon-only navigation              | Fails D-pad on Fire Stick                     |
| Colorful confetti / excessive gradients | Distracts from content                        |
| Cold purple + grey AI aesthetics        | Generic, robotic, no warmth                   |

---

_Mood board v1.0 — ready for design direction document (03-design-direction.md)_
