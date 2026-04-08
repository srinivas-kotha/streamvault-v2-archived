# StreamVault v3.0 — UX Research Report

**Author:** ux-researcher (Paperclip)  
**Date:** 2026-04-08  
**Status:** Complete — Ready for UI Designer input  
**Output feeds into:** `docs/redesign/02-mood-board.md`

---

## Executive Summary

**Project:** StreamVault v3.0 — Full UX redesign of an IPTV streaming platform  
**Research scope:** 2025-2026 streaming and dark-UI design trends, competitor analysis (5 streaming + 5 modern dark-UI apps), design reference extraction from Dribbble and industry sources, IPTV-specific UX patterns, anti-pattern documentation.

**Methodology:**

- Analysis of existing Dribbble research (20+ tag collections, 4 direct shots, 30+ industry sources) compiled in `docs/design-research/dribbble-research.md`
- Competitor visual and UX audit: Netflix, Disney+, Apple TV+, Plex, Jellyfin
- Non-streaming dark-UI benchmark: Linear, Arc Browser, Vercel Dashboard, Raycast, Notion
- Review of current dark mode UI exemplars (Muzli, Mockplus collections)
- IPTV-specific UX research from industry case studies (Purrweb, Oxagile, Purple Smart TV, Spyro-Soft)

**Key findings:**

- **Warmth wins over sterility.** 2025-era dark mode has moved away from flat cold-black aesthetics toward near-black substrates with grain texture, ambient glow, and warm accent colors. Streaming apps that feel "cold" are rejected by users.
- **The 10-foot rule changes everything for IPTV.** TV viewing distance (2–4 meters) requires oversized typography (24px+ body), D-pad-first navigation, visible focus rings, and content rails rather than pointer-hover patterns.
- **Content is the hero; UI must recede.** The most effective streaming UIs (Apple TV+, Mubi) are nearly invisible during playback — surfaces, colors, and motion serve content, not the other way around.
- **Teal+Indigo is a differentiated accent strategy.** Netflix owns red, Disney owns blue. In 2025 the premium/technical space (Arc, Figma, Vercel) uses teal — making it distinctive in the streaming category while signaling sophistication.
- **"Cinematic Depth" aesthetic is research-validated.** The mood board's chosen direction — near-black background, grain texture, ambient glow, editorial typography — maps directly to the patterns extracted from top-performing streaming and modern-app UIs.

---

## 2025-2026 Web Design Trends (Streaming & Dark UI)

### Trend 1: Near-Black Over Pure Black

**Description:** Pure `#000000` backgrounds are clinically harsh on OLED screens and create aggressive contrast edges. 2025 designs use near-black with a subtle hue undertone — deep navy-black (`#080C14`), near-charcoal (`#0A0A0F`), or warm dark (`#0D0B0E`) — to create a richer, more inviting surface.

**Why it matters for StreamVault:** IPTV users watch in low-light lean-back environments. A slightly warm near-black reduces eye strain, makes color accents pop more naturally, and creates better separation between UI surfaces through layering.

**In practice:** Muzli's 2025-2026 dark mode exemplars consistently use foundation backgrounds between `#080808` and `#1A1A2E`, never pure black.

---

### Trend 2: Grain Texture as Warmth Signal

**Description:** Micro-grain texture overlays (0.02–0.04 opacity SVG noise filters) have become a signature of 2025 premium dark UIs. Used by Linear, Arc Browser, Craft, and Raycast to avoid the "sterile LCD" feel of flat dark mode.

**Why it matters for StreamVault:** Grain communicates craft, warmth, and intentionality. A flat dark background reads as "default"; a grained surface reads as "designed." At 0.025 opacity it is invisible to most users but subconsciously registers.

**Implementation signal:** `feTurbulence` SVG filter on a fixed-position pseudo-element at z-index above content but pointer-events: none.

---

### Trend 3: Ambient Glow (Radial Color Bloom)

**Description:** Radial gradient "glows" positioned off-screen or behind key elements create spatial depth without hard edges. Common in Arc Browser sidebar, Linear onboarding, Vercel dark dashboard. Colors range from teal to indigo to amber.

**Why it matters for StreamVault:** Replaces the generic "card shadow" with something cinematically lit. A focused card with a teal glow (`box-shadow: 0 0 30px rgba(13,148,136,0.3)`) communicates selection state while looking premium. Hero sections benefit from a radial glow behind the featured content thumbnail.

---

### Trend 4: Editorial Typography (Moving from Neutral to Expressive)

**Description:** The 2022 default of Inter/system-ui for everything is being replaced by expressive geometric/humanist pairings. Heading fonts (Satoshi, Switzer, Clash Display) carry personality; body fonts (General Sans, DM Sans) maintain readability. Letter-spacing is tighter on headings (`-0.5px` to `-1px`) for confidence.

**Why it matters for StreamVault:** Typography is the primary identity signal when content thumbnails dominate the screen. Satoshi headings feel cinematic and warm; Inter headings feel like a productivity dashboard.

---

### Trend 5: Motion with Purpose (Spring Easing Replaces Linear)

**Description:** UI transitions in 2025 use spring-physics easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`) for micro-interactions — cards scale slightly past their target before settling. Page transitions use fade + vertical translate (not slide) to feel spatial without being disorienting. Duration is tightening: 150–250ms for interactions, 300–400ms for navigation.

**Why it matters for StreamVault:** Card focus animations on D-pad navigation are the primary feedback loop for TV users. A spring-eased scale (`scale(1.06)` + teal glow) confirms selection without requiring a cursor.

---

### Trend 6: Skeleton Loading Over Spinners

**Description:** Skeleton screens (gray placeholder blocks matching the expected content shape) have fully replaced spinners in premium streaming and SaaS UIs. Netflix, Disney+, and Hulu all use skeleton loaders. The 2025 evolution adds shimmer gradients (`linear-gradient` animated across the block) and subtle teal tinting to match brand.

**Why it matters for StreamVault:** IPTV data (channel lists, EPG) loads asynchronously from external APIs. Skeleton loaders prevent layout shift, reduce perceived latency, and maintain visual rhythm during loading.

---

### Trend 7: Bidirectional Scroll as Primary Navigation Metaphor

**Description:** The Netflix-introduced pattern of vertical category scrolling + horizontal content browsing within each row has become the universal streaming navigation language. In 2025-2026, the pattern is being refined: category headers are stickier, partial cards on rail edges are more deliberate (the "peek" hint), and scroll snap is applied for tactile precision.

**Why it matters for StreamVault:** This pattern maps perfectly to D-pad navigation — up/down selects category, left/right browses within. It also scales from mobile (swipe gestures) to TV (D-pad) to desktop (mouse scroll + arrow buttons) without platform-specific redesign.

---

### Trend 8: Reduced Chrome, Content-Forward Layouts

**Description:** Navigation headers are shrinking. 2025 streaming UIs minimize persistent nav to logo + 3–4 tabs + profile icon. On TV and Fire Stick, overlays disappear entirely during playback. The Apple TV+ approach (nearly invisible UI) is being adopted by premium-tier competitors.

**Why it matters for StreamVault:** Every pixel of UI chrome competes with content thumbnails. The research shows users engage more deeply when UI recedes during passive browsing and emerges only on interaction.

---

### Trend 9: Dynamic Color Extraction from Content

**Description:** Apps like Plex, Spotify, and Apple Music extract dominant colors from album/poster art and use them as accent colors for the current item's context (border, underline, glow). In 2025 this is increasingly used in streaming: the focused card's glow shifts to match the show's palette.

**Why it matters for StreamVault:** Makes each channel/show feel unique rather than using a static brand accent everywhere. Libraries like `vibrant.js` or CSS `backdrop-filter: blur` + color extraction enable this with minimal overhead.

---

### Trend 10: Depth Through Surface Layering (Not Just Shadows)

**Description:** Premium dark UIs create hierarchy through surface elevation — each layer is slightly lighter than the one below (`#080C14` base → `#0F1520` cards → `#1A2235` modals). This replaces flat design's color-only hierarchy and avoids the overuse of box-shadows that reads as "2018 Material Design."

**Why it matters for StreamVault:** Three-layer elevation (base/surface/elevated) with subtle 1px borders (`rgba(255,255,255,0.06)`) creates a readable hierarchy without clutter. The Vercel dashboard is the canonical reference.

---

### Trend 11: Glassmorphism — Dying But Contextually Valid

**Description:** Full glassmorphism (backdrop-filter: blur on every card) peaked in 2022-2023 and is now considered overused. However, contextual glass (transparent overlay on video player controls, or frosted tab bar in a media context) remains valid in 2025-2026 when applied with restraint.

**Why it matters for StreamVault:** The player control bar overlay is the one place where a subtle glass effect (`backdrop-filter: blur(12px) saturate(1.5)`) enhances the experience — it separates controls from video without a harsh solid background. Avoid elsewhere.

---

### Trend 12: OLED-Optimized Dark (True Black for Battery Savings)

**Description:** With OLED screens dominant in premium phones and TVs, true black pixels consume no power. 2025 streaming apps increasingly offer an "OLED mode" or pure-black variant for their primary dark theme. Netflix uses `#000000` for this reason.

**Why it matters for StreamVault:** While StreamVault's primary theme uses near-black for warmth, an optional OLED mode (`#000000` base) is a valid future addition — especially for Fire Stick's OLED-connected TVs. Document as a v3.1 consideration.

---

## Design References (20+ Named References)

References are drawn from the Dribbble research (`docs/design-research/dribbble-research.md`), industry examples, and competitor analysis. Each entry documents the pattern and its StreamVault application.

### Streaming-Specific References

| #   | Reference                                     | Source                          | Key Pattern                                                                                               | StreamVault Application                                                                   |
| --- | --------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | **IPTV Live TV Player — Orizon**              | Dribbble (shot #20320006)       | Dark gradient overlay behind controls; bottom 30% darkens to protect text on video                        | Player control bar: `linear-gradient(transparent, rgba(0,0,0,0.8))` overlay               |
| 2   | **ABC-IPTV Player — Orizon**                  | Dribbble (shot #25298061)       | Split-panel: channel list left, player right; warm amber accent on selected channel                       | Desktop EPG view: channel sidebar + video pane split layout                               |
| 3   | **IPTV Player Screenshot — Faizan Gohar**     | Dribbble (shot #23156050)       | Thumbnail scrubbing preview on progress bar hover — premium quality signal                                | HLS player seek bar: thumbnail preview on scrub hover                                     |
| 4   | **Streaming App TV UI — Timo Meyvisch**       | Dribbble (shot #20215818)       | White focus ring (not blue glow) on focused card; feels TV-native                                         | D-pad navigation: 2px teal outline + scale animation on focused card                      |
| 5   | **Disney+ Tab Navigation**                    | Disney+ (platform research)     | Visual tab bar replaces hamburger; category tiles always visible                                          | Top tab bar: Live / Movies / Sports / Kids / My List — always visible                     |
| 6   | **Netflix Hero Section**                      | Netflix (platform research)     | Large 60vh featured image, gradient bottom overlay, 2-3 max CTAs                                          | Hero: full-bleed thumbnail, fade-to-base gradient, Play + Add to List                     |
| 7   | **Netflix Content Rails**                     | Netflix (platform research)     | Bidirectional scroll: vertical categories + horizontal cards; partial right-edge card hints scrollability | Content rails with 30px right-edge "peek" to signal more content                          |
| 8   | **Plex Dynamic Color**                        | Plex (platform research)        | Dominant color extracted from media artwork used as accent glow and active state                          | Focused card glow adapts to show/channel artwork dominant color via vibrant.js            |
| 9   | **Streaming App UI (Dribbble tag)**           | Dribbble/tags/streaming-app-ui  | Overall layout: hero → categories → cards; clean section headers                                          | Page structure: hero section → content rails with section labels                          |
| 10  | **EPG Grid (Dribbble tag)**                   | Dribbble/tags/epg               | Y-axis channels, X-axis time; current time highlighted with vertical accent line; past programs dimmed    | EPG: 60px row height, teal current-time line, past programs at 40% opacity                |
| 11  | **TV App UI Focus Ring (Dribbble tag)**       | Dribbble/tags/tv-app-ui         | Oversized, clean focus rings; no hover effects — D-pad is the only affordance                             | All interactive elements: `outline: 2px solid var(--accent-primary); outline-offset: 3px` |
| 12  | **Live TV Badge (Dribbble tag)**              | Dribbble/tags/live-tv           | Pulsing red/green dot + "LIVE" label in top-right corner of card thumbnail                                | Live status badge: `--status-live` green pulsing dot on thumbnail corner                  |
| 13  | **Media Player Control Bar (Dribbble tag)**   | Dribbble/tags/media-player      | Minimal control bar: play/pause left, progress center, volume + fullscreen right                          | Player: 3-section control bar with 48px touch targets                                     |
| 14  | **Dark Hero Section Gradient (Dribbble tag)** | Dribbble/tags/dark-hero-section | Gradient `transparent → brand-background` on bottom 50% of hero image                                     | Hero gradient: `linear-gradient(to top, #080C14 0%, transparent 60%)`                     |

### Modern App Dark UI References

| #   | Reference                      | Source      | Key Pattern                                                                            | StreamVault Application                                                                |
| --- | ------------------------------ | ----------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 15  | **Linear Sidebar**             | Linear.app  | Grain texture + ambient glow + crisp Satoshi-adjacent typography                       | Background grain overlay at 0.025 opacity; typography: Satoshi headings                |
| 16  | **Arc Browser Depth**          | Arc Browser | Teal accent + surface layering + radial glow behind active sidebar item                | Accent: `#0D9488` teal; hero section: radial teal glow behind featured content         |
| 17  | **Vercel Dashboard Hierarchy** | Vercel      | Near-black base + lighter surface cards + 1px rgba borders; no heavy shadows           | Card structure: `#080C14` base, `#0F1520` cards, `rgba(255,255,255,0.06)` border       |
| 18  | **Raycast Power Density**      | Raycast     | High information density without coldness; focus ring patterns; command-line inspired  | Search overlay: command-palette style with instant results, D-pad-navigable            |
| 19  | **Mubi Editorial Feel**        | Mubi        | Film-first: large high-quality poster art, minimal metadata, mood > function           | Hero section: full-bleed artwork, minimal text overlay, editorial spacing              |
| 20  | **Notion Dark Mode**           | Notion      | Deep surface layering; sidebar at different elevation than content; gentle transitions | Page/sidebar separation: sidebar at `--bg-surface` (`#0F1520`), content at `--bg-base` |
| 21  | **Apple TV+ Minimal Chrome**   | Apple TV+   | Navigation nearly invisible; content thumbnails dominate; generous whitespace          | Nav header: transparent on scroll, shows only on hover/D-pad up                        |
| 22  | **Spotify Dynamic Background** | Spotify     | Background color shifts to extracted album dominant color during playback              | Detail page: content-aware background tint from channel artwork                        |

---

## Competitor Analysis

### Streaming Competitors

---

#### Netflix

**Visual Aesthetic**

- Background: Pure black (`#000000`) — OLED-optimized
- Accent: Netflix Red (`#E50914`) exclusively for CTAs and active states
- Typography: Netflix Sans (custom Dalton Maag) — clean, neutral, confident
- Texture: Flat — no grain, no glow, minimal shadows

**Navigation Pattern**

- Sticky top nav: Logo | Genre tabs | Profile icon
- Genre tabs visible on desktop (Home, TV Shows, Movies, New & Popular, My List)
- On TV: overlay nav appears on D-pad up; auto-hides
- No sidebar — pure horizontal navigation

**Card / Content Display**

- 16:9 landscape cards in horizontal rails
- Hover: expand card with synopsis, genre, rating, CTA (desktop only)
- No focus state until hover; D-pad shows white border
- Portrait cards used for My List only

**Strengths**

- Instantly recognizable global brand
- OLED-optimized pure black saves battery on mobile/TV
- Rail layout is universally understood
- Hover-expand reveals rich metadata without page navigation

**Weaknesses**

- Pure black feels harsh in low-light at edges; no warmth
- Red accent creates immediate clone-perception for competitors
- Hover-required metadata fails on TV/D-pad
- Generic "streaming dark mode" feel — no texture or personality
- Typography (Netflix Sans) is unavailable; imitation uses Inter which reads as cold

**What StreamVault adopts:** Rail layout, hero section structure, skeleton loaders, bidirectional scroll  
**What StreamVault avoids:** Pure black, red accent, cold flat typography, hover-only metadata

---

#### Disney+

**Visual Aesthetic**

- Background: Deep navy (`#1A1D29`) — warmer than Netflix
- Accent: Blue (`#0063E5`) for CTAs; brand-specific franchise colors for category tiles (Marvel red, Star Wars gold, Pixar yellow)
- Typography: Avenir — rounded, approachable, brand-consistent

**Navigation Pattern**

- Visual tab navigation (not hamburger): franchise categories as prominent tiles at top
- Reduces cognitive load vs. text-only tabs
- D-pad navigates tabs horizontally before dropping into content
- On mobile: bottom tab bar with icons + labels

**Card / Content Display**

- Portrait 2:3 cards for most content
- Category tile "franchises" as large branded hero tiles (not just text)
- Featured content hero with autoplay trailer (muted, on hover desktop)
- Status badge (New, Coming Soon) in card corner

**Strengths**

- Visual franchise tiles eliminate decision paralysis (Disney, Marvel, Star Wars, Pixar etc.)
- Portrait card orientation matches movie poster expectations
- Navy background warmer than pure black — more inviting
- Category navigation scales well to D-pad

**Weaknesses**

- Blue accent is extremely generic (reads as "tech")
- Category franchise tiles don't translate to StreamVault's content model (no defined "franchises")
- Autoplay trailers on hover burn bandwidth and can startle users
- Heavy brand franchise identity works for Disney, not for a neutral IPTV platform

**What StreamVault adopts:** Visual tab navigation concept, portrait card aspect ratio, status badges in card corners  
**What StreamVault avoids:** Blue accent, franchise-tile model, autoplay-on-hover trailers

---

#### Apple TV+

**Visual Aesthetic**

- Background: Near-black with extreme restraint — content thumbnails dominate
- Accent: White text on dark — minimalist to the extreme; thin UI chrome
- Typography: SF Pro — Apple's neutral, highly readable system font
- Texture: Depth through generous whitespace, not through surface texture

**Navigation Pattern**

- Sidebar (macOS) or top overlay (tvOS) that disappears during passive browsing
- Content is effectively full-screen at rest
- Navigation triggered by D-pad up or cursor movement — invisible at rest

**Card / Content Display**

- Landscape 16:9 cards with large text overlay at bottom
- Hero section: full-screen single-item spotlight, minimal text, massive thumbnail
- Shows curated as "originals" — very sparse catalogue vs. Netflix

**Strengths**

- Most "cinematic" feel of any streaming platform — UI truly recedes
- Generous whitespace makes content feel premium and unhurried
- Full-screen hero creates immersive, editorial feel
- Excellent D-pad experience on tvOS — spatial navigation is polished

**Weaknesses**

- Minimal chrome feels empty/sparse for IPTV (100s of channels, EPG-heavy)
- No horizontal rails — single-item spotlight doesn't scale to large catalogues
- SF Pro unavailable to third parties; Inter imitation loses distinctiveness

**What StreamVault adopts:** UI recedes during playback, editorial hero section, generous whitespace rhythm, "content is hero" philosophy  
**What StreamVault avoids:** Over-minimalism (IPTV needs visible EPG navigation), Apple-exclusive typography

---

#### Plex

**Visual Aesthetic**

- Background: Dark charcoal (`#1F2326`) — neutral, not warm
- Accent: Plex Yellow/Orange (`#E5A00D`) — distinctive, energetic
- Typography: Open Sans — generic but highly readable
- Texture: Content-derived color accents; artwork dominant color bleeds into background on detail page

**Navigation Pattern**

- Left sidebar: Library | Home | Discover | Live TV | Watchlist
- Collapsible sidebar (Desktop) — icon-only mode available
- Mobile: bottom tab bar
- TV: overlay sidebar triggered by D-pad left

**Card / Content Display**

- Mixed aspect ratios: portrait for movies/shows, landscape for episodes
- Dynamic color extraction: detail page background tints to artwork dominant color
- Progress bars on all in-progress cards (watch history)
- Hover reveals additional metadata (year, rating, genre)

**Strengths**

- Dynamic color per-content creates unique feel for each item
- Left sidebar scales well across desktop and TV
- Progress bars on cards are highly useful for IPTV binge-watchers
- Yellow accent is distinctive and not owned by a major streaming competitor

**Weaknesses**

- Charcoal background (`#1F2326`) is cold and flat — no warmth
- Yellow accent can feel garish or low-quality in the wrong context
- Sidebar is heavy UI chrome — competes with content on smaller screens
- Open Sans typography is generic and unmemorable

**What StreamVault adopts:** Dynamic color extraction from content art, progress bars on in-progress cards, collapsible sidebar pattern, watch history integration  
**What StreamVault avoids:** Cold charcoal background, yellow accent (will read as "cheap" in Srinibytes brand context), heavy sidebar chrome

---

#### Jellyfin

**Visual Aesthetic**

- Background: Dark gray (`#101010` to `#1C1C1E`) — functional, not designed
- Accent: Jellyfin Blue (`#00A4DC`) — generic tech blue
- Typography: Noto Sans — universal, lacks character
- Texture: None — completely flat

**Navigation Pattern**

- Sidebar: fixed left navigation with Home, Movies, TV Shows, Music, etc.
- Dashboard-like: heavy metadata density, very little whitespace
- Admin-facing design clearly bleeds into user-facing UI

**Card / Content Display**

- Portrait 2:3 cards with metadata below
- Focus states: thin border, minimal feedback
- No hover animations on default theme
- Heavy information density: rating, year, genre all visible without interaction

**Strengths**

- Self-hosted: highly customizable for power users
- All metadata visible without hover (good for D-pad navigation)
- Strong community plugin ecosystem

**Weaknesses**

- Design is functional, not experiential — "admin dashboard" aesthetic
- Blue accent screams generic open-source
- No animation, no texture, no warmth
- Typography and spacing feel utilitarian
- Cannot compete aesthetically with paid services

**What StreamVault adopts:** All metadata visible without hover (adapting for D-pad), strong information hierarchy in EPG  
**What StreamVault avoids:** Dashboard aesthetic, generic blue, flat/no-animation design, zero warmth

---

### Modern Dark UI App Benchmarks

---

#### Linear.app

**Why included:** Linear is considered the gold standard of 2025 dark UI craft — teams building premium dark interfaces study it.

**Key patterns for StreamVault:**

- Grain texture overlay at very low opacity — warmth without noise
- Ambient teal/purple glow in background — cinematic spatial depth
- Satoshi-style typography — geometric, confident, not cold
- Motion: spring easing on all interactions — cards, modals, sidebars feel alive
- Keyboard-first (cmd+K palette) — power user interaction model

**StreamVault takeaway:** Grain + glow + spring motion = the three signals of premium dark UI. All three are in the mood board.

---

#### Arc Browser

**Why included:** Arc uses a teal-based accent system in a dark UI — the closest brand-tone match to StreamVault's planned palette.

**Key patterns for StreamVault:**

- Teal accent (`#0D9488` range) as primary interactive color — reads modern, not cold
- Sidebar at different elevation than content — depth through layering
- Radial glow behind active items — spatial depth
- Smooth sidebar transitions with spring easing

**StreamVault takeaway:** Validates the teal accent choice. Teal in a dark UI reads as premium and technical without the "social media blue" or "Netflix red" associations.

---

#### Vercel Dashboard

**Why included:** Best-in-class dark dashboard hierarchy — teaches how to layer information without visual noise.

**Key patterns for StreamVault:**

- `#080808` base → slightly lighter card surfaces → elevated modal backgrounds — three-layer elevation
- 1px `rgba(255,255,255,0.06)` borders on cards — define edges without hard lines
- Muted icon + label sidebar — reduced visual weight vs. active state
- Grid of metric cards — translates to StreamVault's channel grid

**StreamVault takeaway:** The card border technique (`rgba(255,255,255,0.06)`) is the correct way to define card edges in dark mode. Not box-shadow, not thick border — just a whisper of a line.

---

#### Raycast

**Why included:** Raycast packs the highest information density of any dark UI without feeling cold or cluttered.

**Key patterns for StreamVault:**

- Command-palette pattern: instant search with keyboard navigation
- Focus ring as sole selection affordance — no hover required
- Category grouping in search results (mirrored in StreamVault search)
- Spring animations on list items as focus moves

**StreamVault takeaway:** The search overlay pattern. StreamVault's global search (triggered by D-pad up or keyboard shortcut) should be a Raycast-style command palette: full-screen overlay, instant results, keyboard/D-pad navigable, grouped by category (Channels, Shows, Genres).

---

#### Notion (Dark Mode)

**Why included:** Notion dark mode demonstrates how to create readable, warm dark UI across content-heavy pages.

**Key patterns for StreamVault:**

- Sidebar at `--bg-surface` elevation; content area at `--bg-base` — clear two-zone layout
- Body text at `rgba(255,255,255,0.85)` — slightly off-white for warmth, not blinding
- Page transitions: fade only (no slide) — subtle, non-distracting
- Section dividers: 1px `rgba(255,255,255,0.08)` lines — visible without harsh contrast

**StreamVault takeaway:** Off-white body text (`rgba(248,250,252,0.85)`) is warmer and less harsh than pure white. The sidebar/content zone elevation split is directly applicable to StreamVault's desktop layout.

---

## Anti-Patterns — What StreamVault Must Avoid

### Anti-Pattern 1: Pure Black Background (`#000000`)

**Problem:** Harsh contrast at OLED screen edges; reduces perceived warmth; makes colored accents pop too aggressively in low-light IPTV environments.  
**Correct pattern:** Near-black with slight blue undertone (`#080C14`). Warmer in low light. More readable. Still OLED-efficient enough at `#080808` or darker.

---

### Anti-Pattern 2: Red Accent Color

**Problem:** Immediate "Netflix clone" perception. Users unconsciously compare and find StreamVault lacking Netflix's catalogue. Red also reads as "error/warning" in UX semantics — reserve red for `--status-recording` and `--status-error`.  
**Correct pattern:** Teal `#0D9488` primary accent — distinctive in streaming space, premium in tech space (Arc, Vercel, Figma).

---

### Anti-Pattern 3: Generic Blue Accent

**Problem:** Blue (`#3B82F6`, `#0063E5`, `#00A4DC`) is used by Disney+, Jellyfin, and approximately 70% of SaaS dashboards. Using it makes StreamVault look like an admin panel.  
**Correct pattern:** Teal+Indigo pairing — reads as premium, distinct from streaming competitors.

---

### Anti-Pattern 4: Hamburger Menu Navigation

**Problem:** On Fire Stick D-pad, hamburger navigation requires: navigate to icon → click → drawer opens → navigate items → click → drawer closes. That's 6 actions vs. 2 for tab navigation (D-pad left/right). Hamburger also hides navigation from first-time users.  
**Correct pattern:** Horizontal tab bar with 4–5 always-visible categories. Remainder in "More" overflow.

---

### Anti-Pattern 5: Hover-Only Critical Information

**Problem:** TV remote D-pad and mobile touchscreens have no hover state. If essential information (title, play button, show status) is hidden behind hover, TV and mobile users can't access it.  
**Correct pattern:** Title and status badge always visible on cards. Hover/focus reveals extras (synopsis, genre, rating). Play button always visible or accessible via D-pad center-select.

---

### Anti-Pattern 6: Glassmorphism on Cards

**Problem:** `backdrop-filter: blur()` on every card creates visual mud — background content bleeds through cards making both unreadable. Overused 2022-2023, now reads as dated and low-effort.  
**Correct pattern:** Solid surface cards (`--bg-surface`) with 1px rgba borders and subtle box-shadow. Reserve glass blur for the video player control overlay only, where content-bleed is intentional and expected.

---

### Anti-Pattern 7: Auto-Play Video Without User Consent

**Problem:** Sudden audio/video startles users in quiet or shared viewing environments. Burns mobile data. Creates aggressive perception. Netflix's autoplay trailers are widely disliked.  
**Correct pattern:** Show static thumbnail with play button. On hover/focus (desktop), a muted silent preview may begin — but only after a 1s delay and only if `prefers-reduced-motion` is not set. Full audio playback always requires explicit Play action.

---

### Anti-Pattern 8: Information Overload on Cards

**Problem:** Showing title + year + rating + genre + duration + progress bar + status badge on every card creates visual noise. Users scan, not read — overloaded cards are skipped.  
**Correct pattern:** Card shows: thumbnail + title + live status badge. Focus/hover reveals: genre + start time. Detail overlay or page shows everything else.

---

### Anti-Pattern 9: Flat/No-Animation Design

**Problem:** Zero motion makes an interface feel static and low-quality in 2025. Users perceive unanimated interfaces as less responsive and less polished than animated ones, even when latency is identical.  
**Correct pattern:** Spring easing on focus/hover (`150ms`), fade + translateY for page entries (`350ms`), skeleton shimmer for loading. All overrideable via `prefers-reduced-motion`. Motion is communicative, not decorative.

---

### Anti-Pattern 10: Cold Color Temperature Throughout

**Problem:** Pure cool-gray/blue-gray UI with no warm elements reads as "enterprise admin panel." Streaming is entertainment — it must feel inviting and warm, especially in low-light environments.  
**Correct pattern:** Near-black with slight warm undertone + amber "Live" badge + warm grain texture overlay + off-white text. Cool elements (teal, indigo) are balanced by warm context (amber badge, off-white text, grain).

---

### Anti-Pattern 11: Low Contrast Text on Thumbnail Images

**Problem:** Content thumbnails vary dramatically in brightness. White text on a bright thumbnail is invisible. Dark text on a dark thumbnail is invisible. Guaranteed accessibility failure.  
**Correct pattern:** Always place a `rgba(0,0,0,0.5)` semi-transparent overlay between thumbnail and any text. For hero sections: `linear-gradient(to top, #080C14 0%, transparent 60%)` — protects text at bottom without obscuring artwork at top.

---

### Anti-Pattern 12: Default Browser Focus Ring (Blue Outline)

**Problem:** Browser default `outline: 2px solid blue` is ugly, brand-inconsistent, and invisible against some backgrounds. Many devs suppress focus entirely (`outline: none`) — which is an accessibility catastrophe.  
**Correct pattern:** Custom focus ring: `outline: 2px solid var(--accent-primary); outline-offset: 3px`. Combined with scale + glow animation for TV contexts. Never `outline: none` without a custom replacement.

---

### Anti-Pattern 13: Spinner Loading States

**Problem:** Spinners cause layout shift (content appears, layout reflowes) and create "blank staring" — users have no sense of what's loading or how long it will take.  
**Correct pattern:** Skeleton loaders that match the expected content shape. Rails show skeleton cards at correct aspect ratio. EPG shows skeleton row cells. No layout shift when real content arrives.

---

### Anti-Pattern 14: Dense Navigation Without Breathing Room

**Problem:** Cramming 10+ navigation items into a sidebar or top bar, each with identical visual weight, creates decision paralysis. The eye has no anchor point.  
**Correct pattern:** 4–5 primary tabs always visible. Secondary items in overflow "More" menu. Active tab: accent color + slightly heavier font weight. Inactive: muted opacity.

---

## Recommendations for StreamVault v3.0

### 5 Core UX Principles

**Principle 1: Content is Always the Hero**  
Every UI decision — color, motion, spacing — should make content thumbnails and titles more prominent, not compete with them. When in doubt: remove UI chrome, add whitespace, reduce color saturation in backgrounds.

**Principle 2: D-Pad First, Then Mobile, Then Mouse**  
StreamVault is primarily consumed on Fire Stick and smart TV. Design for D-pad navigation first — then verify the same layout works with touch. Mouse/desktop is last. This means: large hit targets (60px+), always-visible focus rings, no hover-only information, bidirectional rail layout.

**Principle 3: Warmth Over Sterility, Always**  
Every design decision has a "warm" and a "cold" version. Choose warm. Near-black over pure black. Grain texture over flat surface. Off-white over pure white. Amber live badge over gray. Teal glow over no glow. Individually subtle; collectively transformative.

**Principle 4: Communicate Through Motion, Don't Decorate**  
Every animation must communicate something: focus state (spring scale), content loading (skeleton shimmer), navigation hierarchy (translateY on page enter), selection confirmation (button press scale). No purely decorative motion. Respect `prefers-reduced-motion` at all times.

**Principle 5: Consistent Elevation Language**  
Three surface levels only: base (`#080C14`), surface (`#0F1520`), elevated (`#1A2235`). Every UI element sits at one of these levels. Never improvise elevations. Borders at each level: `rgba(255,255,255,0.06)` on surface, `rgba(255,255,255,0.08)` on elevated. This creates readable hierarchy without visual noise.

---

### Aesthetic Direction: "Cinematic Depth" — Research Validated

The mood board's chosen aesthetic direction is validated by this research across multiple dimensions:

| Design Choice                            | Research Validation                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Near-black `#080C14` with blue undertone | Supported by Muzli 2025-2026 dark mode exemplars; warmer than `#000000` for IPTV low-light                          |
| Teal `#0D9488` accent                    | Validated by Arc Browser and Figma; distinctive in streaming space; absent from all 5 streaming competitors         |
| Satoshi + General Sans typography        | Aligned with 2025 trend away from Inter/system-ui; matches warm-geometric editorial direction                       |
| Grain texture overlay (0.025 opacity)    | Used by Linear, Arc, Raycast — the three canonical premium dark UIs of 2025                                         |
| Ambient teal glow radial gradient        | Used by Arc sidebar; Linear onboarding; validated as "cinematic depth" signal                                       |
| Spring easing animations                 | Industry standard for premium interactive UIs in 2025; differentiates from flat/no-animation competitors (Jellyfin) |
| Skeleton shimmer loaders                 | Used by Netflix, Disney+, Hulu — streaming industry standard                                                        |
| 3-level surface elevation                | Vercel Dashboard canonical pattern; Notion dark mode secondary validation                                           |

**Verdict:** "Cinematic Depth" is not a mood-board invention — it is the convergent direction of 2025's best dark UI design, applied to the specific context of IPTV streaming. The research confirms it is both differentiated (vs. Netflix, Disney+, Jellyfin) and aligned with premium expectations (comparable to Arc, Linear, Vercel).

---

### Priority Features from Research

These UX features should be prioritized in the v3.0 build sequence based on research impact:

1. **Content rails with bidirectional scroll + scroll snap** — Universal streaming standard; D-pad primary navigation pattern. Highest impact on usability.

2. **Teal focus ring + spring scale animation** — The primary D-pad navigation affordance. Invisible on TV without it. Accessibility requirement, not enhancement.

3. **Skeleton loading screens** — Eliminates layout shift on IPTV data fetch (EPG, channel lists). Perceived performance improvement without backend changes.

4. **Hero section with cinematic gradient overlay** — Differentiates from Jellyfin/Plex's functional layouts. First impression setter.

5. **EPG grid with current-time highlight line** — IPTV-specific "What's on now" is the primary user question. Teal vertical line at current time is the clearest answer.

6. **Global search command palette** — Raycast-inspired instant search, D-pad navigable, grouped by content type. Replaces generic search bar.

7. **Grain texture + ambient glow background** — The "warmth vs. sterility" differentiator. Low implementation cost; high perceptual impact.

8. **Dynamic accent color from content artwork** — Makes each channel/show feel unique. Progressive enhancement — implement after core rail layout is stable.

---

## Research Sources

### Primary (Analyzed in Depth)

- `docs/design-research/dribbble-research.md` — 909-line research doc covering 20+ Dribbble tag collections, 4 direct shots, 30+ industry articles on streaming UX, IPTV patterns, EPG design, player controls, dark mode implementation, responsive design
- Muzli 2025-2026 Dark Mode UI collection — dark mode exemplar visual characteristics
- Competitor platform analysis: Netflix, Disney+, Apple TV+, Plex, Jellyfin — direct feature and visual audit

### Secondary (Referenced)

- [UX Design for Streaming Apps — Forasoft/Medium](https://forasoft.medium.com/user-experience-ux-design-for-streaming-apps-best-practices-for-seamless-viewing-458e995decf5)
- [UX Design Principles for Streaming — NetSolutions](https://www.netsolutions.com/insights/video-streaming-apps-ux-design/)
- [8 UX/UI Best Practices for TV Apps — Spyro-Soft](https://spyro-soft.com/blog/media-and-entertainment/8-ux-ui-best-practices-for-designing-user-friendly-tv-apps)
- [Designing Great Streaming TV Apps — Mercury Blog](https://blog.mercury.io/designing-great-streaming-tv-apps-pt-1-introduction/)
- [EPG IPTV Trends 2025 — Oxagile](https://www.oxagile.com/article/why-epgs-rule-the-screen/)
- [EPG Excellence — Purple Smart TV](https://purplesmarttv.com/epg-excellence-designing-an-intuitive-program-guide-for-iptv-apps/)
- [IPTV App Development Guide — Purrweb](https://www.purrweb.com/blog/how-we-made-an-iptv-app/)
- [IPTV Channel Organization 2026 — Chillio](https://chillio.app/blog/iptv-channel-organization-custom-categories-favorites-2026)
- [Color System for TV — Android Developers](https://developer.android.com/design/ui/tv/guides/styles/color-system)
- [Netflix UI Redesign Figma Community File](https://www.figma.com/community/file/1467936842839005986/netflix-ui-redesign-modern-dark-theme)
- [Bidirectional Scrolling in Streaming TV Apps — UX Planet](https://uxplanet.org/understanding-bidirectional-scrolling-in-streaming-apps-for-tv-fe1b1c2edb6e)
- [60+ Dark Mode UI Inspiration 2026 — Muzli](https://muz.li/inspiration/dark-mode/)

---

_UX Research Report v1.0 — Complete. Ready for UI Designer mood board review and design direction confirmation._
