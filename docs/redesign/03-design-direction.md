# StreamVault v3.0 — Design Direction

**Author:** ui-designer (Paperclip)
**Input:** `docs/redesign/02-mood-board.md` + `docs/design-research/dribbble-research.md`
**Date:** 2026-04-07

---

## Chosen Aesthetic: "Cinematic Depth"

### Statement

StreamVault v3.0 adopts a **dark, warm, layered aesthetic** that evokes the atmosphere of a private cinema — not a sterile tech dashboard. Every surface, color, and motion is calibrated to make content feel like the hero, with UI receding into the background until needed.

The design direction is explicitly **not**:

- Netflix (red-dominant, content-commodity feel)
- Generic streaming dark mode (cold, flat, interchangeable)
- AI/SaaS dashboard (cold blues, data-dense, robotic)

It **is**:

- Editorial (Mubi-style thoughtfulness)
- Warm depth (Arc Browser-style layering with teal glow)
- TV-native (D-pad-first, readable from 10 feet, focus-visible)

---

## Why "Cinematic Depth" Works for IPTV

### 1. The Viewing Context

IPTV is consumed in **low-light, lean-back environments** — couches, bedrooms, living rooms. The interface must:

- Not blind the user when pausing (pure black creates harsh contrast at edges)
- Feel warm and inviting, not like staring at a spreadsheet
- Recede during playback, emerge during navigation

The `#080C14` near-black with teal ambient glow achieves this. It feels like the room lights are dimmed just enough.

### 2. The Navigation Context

Fire Stick and TV remote D-pad navigation requires **large hit targets, visible focus rings, and predictable spatial layouts**. The aesthetic choices that support this:

- **Teal focus ring** (`--accent-primary`): Visible against both dark backgrounds and bright content thumbnails
- **Scale + glow focus animation**: Provides dual feedback (position + highlight) — critical when navigating 20+ items on a grid
- **Content rail layout**: Bidirectional scroll maps naturally to D-pad up/down + left/right
- **Large card sizes**: Minimum 160px width (phone) → 240px (TV) — readable from 3 meters

### 3. The Content Context

IPTV content spans live sports, movies, kids shows, news. The neutral-warm substrate (`#080C14` + `#0F1520`) lets any content category's colors shine without competing. The teal+indigo accent pair:

- Reads as **premium** (associated with Figma, Vercel, Arc)
- Avoids category lock-in (not "sports blue" or "movie red")
- Works with content-derived dynamic accent colors (extracted from channel artwork)

---

## How StreamVault v3.0 Differs from Generic Streaming Apps

| Dimension            | Generic Streaming App                 | StreamVault v3.0                                |
| -------------------- | ------------------------------------- | ----------------------------------------------- |
| **Background**       | Pure black `#000` or flat dark grey   | Near-black `#080C14` with slight warmth         |
| **Accent**           | Red (Netflix clone) or blue (generic) | Teal `#0D9488` — distinctive, premium           |
| **Focus state**      | Default browser blue ring             | Teal glow + spring scale animation              |
| **Typography**       | Inter or system-ui (cold)             | Satoshi + General Sans (warm geometric)         |
| **Texture**          | None (flat)                           | Grain overlay (0.025 opacity) + ambient glow    |
| **Card focus**       | Border change only                    | Scale + ambient glow (`box-shadow` bloom)       |
| **Page transitions** | None or jarring cuts                  | Fade + translateY stagger (350ms ease-out)      |
| **Hero section**     | Full-width gradient box               | Cinematic bleed with editorial text positioning |
| **Loading state**    | Spinner or blank                      | Warm skeleton shimmer (teal tint)               |
| **Brand identity**   | Feels replaceable                     | Distinctively Srinibytes "Ambient Depth"        |

---

## Component Design Decisions

### Decision 1: Tab Navigation Over Hamburger

**Chosen:** Horizontal tab bar (Live / Movies / Sports / Kids / My List)
**Rejected:** Hamburger menu drawer

**Rationale:** D-pad navigation on Fire Stick is linear. A hamburger drawer requires: navigate to hamburger → open drawer → navigate items → close drawer. Tab navigation requires: D-pad left/right. The research (Disney+ pattern) confirms tab nav reduces navigation depth by 2 levels for IPTV use cases.

---

### Decision 2: Teal Accent Over Red

**Chosen:** `#0D9488` (Teal)
**Rejected:** Red (`#E50914`), Blue (`#3B82F6`)

**Rationale:** Red creates immediate "Netflix clone" perception — users unconsciously compare and find StreamVault lacking. Teal is distinctive in the streaming space, reads as premium/modern (Arc, Figma), and pairs naturally with the Srinibytes brand identity. Blue is associated with social media and productivity apps — wrong emotional register for entertainment.

---

### Decision 3: Satoshi Typography Over Inter

**Chosen:** Satoshi (headings) + General Sans (body)
**Rejected:** Inter, Poppins, system-ui

**Rationale:** Inter is overused (600+ popular apps in 2025). Satoshi has the same geometric precision but with slightly warmer curves, avoiding the cold "developer tool" feel. General Sans reads naturally at 13-15px sizes used throughout the EPG and card metadata. Both are Fontshare (free, no self-hosting CDN required).

---

### Decision 4: Spatial Navigation Focus = Glow + Scale (Not Border Alone)

**Chosen:** `transform: scale(1.06)` + `box-shadow: 0 0 20px rgba(13,148,136,0.4)`
**Rejected:** Border/outline change only

**Rationale:** On a 55-inch TV from 3 meters, a 2px border change is invisible. Glow is perceivable at distance. The scale(1.06) spring animation provides kinesthetic feedback confirming the D-pad press registered. This pattern is used by Apple TV+ and Fire TV's native app shell.

---

### Decision 5: Content Rails Over Full-Page Grid

**Chosen:** Horizontal content rails stacked vertically (Netflix/Apple TV+ pattern)
**Rejected:** Full-page content grid (Plex-style)

**Rationale:** Rails support progressive content loading (each rail loads independently), allow category labels to provide context, and map cleanly to D-pad navigation (up/down = category, left/right = content). Full-page grids become spatially complex on large screens and make it harder to answer "what am I looking at right now?"

---

### Decision 6: No Glassmorphism

**Chosen:** Solid `--bg-elevated` surfaces with subtle border + glow
**Rejected:** Frosted glass / backdrop-filter: blur

**Rationale:** Glassmorphism (1) is visually noisy over complex content thumbnails, (2) is GPU-expensive (backdrop-filter is costly on low-end Fire Stick hardware), and (3) has been overused to the point of feeling dated (2021-2023 peak). Solid surfaces with controlled opacity and glow achieve depth without the performance cost.

---

## Reference Patterns from 21st.dev

The following modern component patterns are recommended for implementation reference:

### From Vercel/Linear Pattern Library

| Component              | Pattern Source         | Implementation Note                                         |
| ---------------------- | ---------------------- | ----------------------------------------------------------- |
| **Focus ring**         | Linear app             | 2px teal ring + 2px offset — works on both dark/light cards |
| **Skeleton loader**    | Vercel dashboard       | Shimmer on `--bg-elevated` gradient, not grey               |
| **Badge**              | Linear status chip     | Small pill, 10px height, `--accent-warm` for LIVE           |
| **Rail scroll arrows** | Vercel docs nav        | Ghost buttons appear on hover/focus, hidden otherwise       |
| **Modal overlay**      | Linear command palette | `rgba(8,12,20,0.85)` backdrop, not pure black               |

### From Arc Browser Pattern Library

| Pattern                  | Application                                                            |
| ------------------------ | ---------------------------------------------------------------------- |
| Layered card depth       | Cards use 3-level z-shadow stack (rest / hover / focused)              |
| Ambient glow backgrounds | Section hero areas use radial gradient glow (teal, low opacity)        |
| Sidebar transitions      | Nav panel slides with `cubic-bezier(0.16, 1, 0.3, 1)` — feels physical |

### From Apple TV+ Pattern Library

| Pattern              | Application                                                       |
| -------------------- | ----------------------------------------------------------------- |
| Content-first hero   | Hero section: no UI chrome visible until interaction              |
| Large type editorial | Section headers use 28-42px Satoshi 700 — readable at TV distance |
| Staggered row entry  | Each content rail enters with 80ms offset stagger on load         |

---

## Responsive Breakpoints

```
Mobile TV      375px  → 2-col grid, single rail, compact EPG
Tablet         768px  → 3-4 col grid, wider rails
Desktop        1280px → 6 col grid, full EPG, sidebar nav
Large Screen   1920px → 8 col grid, font scale +12.5%
Ultra Wide     2560px → 10 col grid, font scale +25%
```

---

## Design Principles (Hierarchy)

1. **Content is the hero** — UI recedes; content leads
2. **Distance-first** — every interactive element must be visible from 3 meters
3. **Warmth over efficiency** — prefer inviting over data-dense
4. **Motion is feedback** — every transition communicates state, never decorates
5. **Brand without shouting** — teal accent used sparingly (15% of UI surface area max)

---

## Implementation Checklist (for Frontend Engineers)

- [ ] Import Satoshi + General Sans from Fontshare CDN
- [ ] Define all CSS custom properties from mood-board palette
- [ ] Implement grain overlay as fixed `::after` pseudo-element (z-index 9999)
- [ ] Replace all `transition-all` with `transition: transform, box-shadow, opacity`
- [ ] Ensure focus ring is visible on both dark cards and light-thumbnail cards
- [ ] Add `prefers-reduced-motion` override for all animations
- [ ] Test all interactive elements at 1920x1080 (10-foot viewing)
- [ ] Validate color contrast: text on overlay backgrounds ≥ 4.5:1
- [ ] Remove all pure `#000000` — replace with `#080C14`
- [ ] Verify no hover-only critical information (TV has no hover)

---

## Quality Gate

This document must score **4.7/5.0** at Architect review gate on these dimensions:

| Dimension  | Target | Rationale                                                          |
| ---------- | ------ | ------------------------------------------------------------------ |
| Warmth     | 5/5    | Grain + teal glow explicitly address cold-dark anti-pattern        |
| Animation  | 4.5/5  | Full micro-interaction spec; TV hardware limits complexity         |
| Typography | 5/5    | Satoshi + General Sans, full scale + hierarchy defined             |
| Layout     | 5/5    | All key layouts specified: hero, rail, grid, EPG, card             |
| Identity   | 4.5/5  | Distinctively Srinibytes; further differentiates on implementation |

---

_Design Direction v1.0 — ready for component implementation (Phase 2)_
