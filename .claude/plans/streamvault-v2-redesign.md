# StreamVault Frontend v2.0 -- Architecture Plan

## 1. Executive Summary

StreamVault v2.0 is a complete redesign of the self-hosted IPTV streaming frontend. The current v1.x codebase (109 source files, React 19 + TypeScript + Tailwind 4) has accumulated critical architectural debt: a dual-player conflict that crashes TV playback, 845-line monolith components, zero component/E2E tests, missing accessibility, no mobile layout, and inconsistent error handling.

This plan defines a ground-up redesign that:
- Establishes a device-adaptive architecture serving Fire TV, Samsung Tizen, LG webOS, mobile, tablet, and desktop from a single codebase
- Introduces the Srinibytes "Ambient Depth" design system for a premium Netflix-quality visual identity
- Resolves all critical and high-severity bugs from the v1.x audit
- Implements comprehensive accessibility (WCAG 2.1 AA)
- Adds a complete testing layer (component + E2E)
- Targets backward compatibility to Chrome 80 (Fire TV Silk baseline)

### Approach: Feature-Branch Rebuild

Rather than incremental patches on v1.x, this plan uses a `feat/v2-redesign` branch that rebuilds each feature module from scratch while preserving proven patterns (spatial navigation hooks, HLS configuration, TanStack Query patterns). The v1.x `main` branch remains deployable as fallback throughout development.

### Tech Stack (Retained + Added)

| Layer | Technology | Status |
|-------|-----------|--------|
| UI Framework | React 19 + TypeScript 5.7 | Retained |
| Styling | Tailwind CSS 4 | Retained (new design tokens) |
| Routing | TanStack Router v1 (file-based) | Retained |
| Data Fetching | TanStack Query v5 | Retained (enhanced patterns) |
| Virtualization | TanStack Virtual v3 | Retained (expanded usage) |
| State Management | Zustand 5 | Retained (restructured stores) |
| TV Navigation | norigin-spatial-navigation v2 | Retained (consolidated) |
| Video Player | HLS.js + mpegts.js | Retained (unified architecture) |
| Build Tool | Vite 6 | Retained |
| Testing | Vitest + Playwright | Added (E2E) |
| Bundle Analysis | rollup-plugin-visualizer | Added |
| Accessibility | React Aria (select primitives) | Added |

---

## 2. Architecture Overview

### New Folder Structure

```
src/
  app/
    __root.tsx              # Root layout, providers, global player
    routes/                 # TanStack Router file-based routes
      _authenticated.tsx    # Auth guard layout
      _authenticated/
        home.tsx
        live.tsx
        vod/
          index.tsx
          $vodId.tsx
        series/
          index.tsx
          $seriesId.tsx
        search.tsx
        favorites.tsx
        settings.tsx
      login.tsx

  design-system/            # NEW: Centralized design system
    tokens/
      colors.ts             # Brand color tokens
      typography.ts          # Font scale per device
      spacing.ts             # Spacing scale
      shadows.ts             # Elevation system
      animations.ts          # CSS animation definitions
    primitives/
      Button.tsx             # Variants: primary, secondary, ghost, icon
      Badge.tsx              # NEW, rating, live indicator
      Skeleton.tsx           # Loading placeholder
      Avatar.tsx             # Profile/channel icon
      Tooltip.tsx            # Desktop only
      Toast.tsx              # With role="alert"
    cards/
      PosterCard.tsx         # 2:3 aspect, movies/series
      LandscapeCard.tsx      # 16:9 aspect, continue watching
      ChannelCard.tsx        # Live TV channel
      EpisodeCard.tsx        # Series episode
      HeroCard.tsx           # Full-width hero banner
    focus/
      FocusRing.tsx          # Single source of truth for focus styles
      FocusableCard.tsx      # Card + spatial nav integration
      FocusableButton.tsx    # Button + spatial nav integration
      FocusableInput.tsx     # Input + spatial nav integration
      useFocusStyles.ts      # Hook returning device-appropriate focus classes

  layouts/                   # NEW: Device-specific shells
    TVLayout.tsx             # Spatial nav provider, safe zones, no scrollbar
    DesktopLayout.tsx        # Mouse/keyboard, standard scroll, sidebar
    MobileLayout.tsx         # Touch, bottom tabs, pull-to-refresh
    LayoutSelector.tsx       # Picks layout based on device detection

  features/
    auth/
      components/
        LoginPage.tsx
        AutoLoginHandler.tsx
      api.ts
      hooks/
        useAuth.ts
    home/
      components/
        HomePage.tsx
        HeroBanner.tsx
        ContinueWatchingRail.tsx
        FeaturedRail.tsx
        CategoryRail.tsx
      api.ts
    live/
      components/
        LivePage.tsx
        ChannelGrid.tsx
        EPGTimeline.tsx       # NEW: Full EPG guide view
        ChannelSwitcher.tsx   # NEW: Up/down channel switching overlay
      api.ts
    vod/
      components/
        VODPage.tsx
        MovieDetail.tsx
        MovieGrid.tsx
      api.ts
    series/
      components/
        SeriesPage.tsx
        SeriesDetail.tsx      # Decomposed from 845 lines
        SeasonNav.tsx         # NEW: Extracted season tabs
        EpisodeList.tsx       # NEW: Extracted episode list + search
      api.ts
    search/
      components/
        SearchPage.tsx
        SearchFilters.tsx     # NEW: Extracted filters
        SearchResults.tsx     # NEW: Extracted results
      api.ts
    favorites/
      components/
        FavoritesPage.tsx
      api.ts
    player/
      components/
        PlayerShell.tsx       # NEW: Single unified player
        PlayerControls/
          DesktopControls.tsx
          TVControls.tsx
          MobileControls.tsx
        ProgressBar.tsx       # NEW: Extracted with seek preview
        QualitySelector.tsx
        SubtitleSelector.tsx  # NEW
        AudioTrackSelector.tsx # NEW
        BufferingOverlay.tsx  # NEW
        ErrorRecovery.tsx     # NEW: Retry UI
      hooks/
        usePlayerKeyboard.ts  # Retained (proven)
        useProgressTracking.ts # Retained
        useAdaptiveQuality.ts # NEW: Device-aware quality defaults
      api.ts
      store.ts               # Dedicated player store
    settings/
      components/
        SettingsPage.tsx
      store.ts

  shared/
    hooks/
      useDeviceContext.ts     # NEW: Unified device detection
      useBackNavigation.ts    # NEW: Single back button handler
      useNetworkStatus.ts     # NEW: Online/offline + speed detection
      useReducedMotion.ts     # NEW: prefers-reduced-motion
      useContentRailData.ts   # Retained
      useInfiniteScroll.ts    # Retained
    utils/
      cn.ts                   # clsx + tailwind-merge
      formatDuration.ts       # Retained
      isNewContent.ts         # Retained
      deviceDetection.ts      # NEW: Comprehensive device fingerprinting
      keyMappings.ts          # NEW: Unified key constants for all TV platforms
    providers/
      SpatialNavProvider.tsx  # Retained (refactored)
      DeviceProvider.tsx      # NEW: Device context provider
      NetworkProvider.tsx     # NEW: Network status context
    types/
      content.ts
      player.ts
      device.ts               # NEW

  lib/
    api.ts                    # HTTP client (retained, enhanced error handling)
    queryClient.ts
    queryConfig.ts             # Stale times per content type
    stores/                    # NEW: Stores directory
      playerStore.ts
      uiStore.ts
      authStore.ts

  styles/
    tailwind.css               # Design tokens + custom utilities
    fonts/                     # Self-hosted Satoshi + General Sans
```

### Component Architecture Principles

1. **Single Responsibility**: No component exceeds 300 lines. Complex pages decompose into shell + feature components.
2. **Device-Agnostic Core**: Business logic lives in hooks. UI adapts per device via layout shells and conditional rendering.
3. **Composition over Configuration**: Cards, buttons, and inputs compose focus behavior via wrapper components, not prop drilling.
4. **Colocation**: Feature API, hooks, components, and tests live together. Shared code lives in `shared/` or `design-system/`.
5. **No Prop Drilling Beyond 2 Levels**: Use Zustand stores or React context for deep state. Props only for direct parent-child communication.

---

## 3. Design System

### Color Tokens

```css
/* src/styles/tailwind.css */
@theme {
  /* Background Layers */
  --color-bg-primary: #0a0a0f;        /* Page background */
  --color-bg-secondary: #141418;       /* Card/surface background */
  --color-bg-tertiary: #1a1a22;        /* Elevated surfaces, modals */
  --color-bg-overlay: rgba(10,10,15,0.85); /* Player overlay, drawers */
  --color-bg-hover: #1e1e28;           /* Interactive hover state */

  /* Brand Accent */
  --color-accent-teal: #14b8a6;        /* Primary actions, focus rings */
  --color-accent-indigo: #6366f1;      /* Secondary accent, gradients */
  --color-accent-teal-dim: #0d9488;    /* Pressed/active state */
  --color-accent-indigo-dim: #4f46e5;  /* Pressed/active state */

  /* Text Hierarchy */
  --color-text-primary: #f5f5f5;       /* Titles, active labels */
  --color-text-secondary: #94a3b8;     /* Descriptions, metadata */
  --color-text-tertiary: #64748b;      /* Timestamps, hints, disabled */
  --color-text-inverse: #0a0a0f;       /* Text on accent backgrounds */

  /* Semantic */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-live: #ef4444;               /* Live indicator dot */

  /* Focus Ring */
  --color-focus: #14b8a6;
  --shadow-focus: 0 0 0 2px rgba(20,184,166,0.6);
  --shadow-focus-tv: 0 0 0 3px rgba(20,184,166,0.8), 0 0 20px rgba(20,184,166,0.15);

  /* Gradient */
  --gradient-brand: linear-gradient(135deg, #14b8a6, #6366f1);
  --gradient-hero: linear-gradient(to top, #0a0a0f 0%, transparent 60%);
  --gradient-card: linear-gradient(to top, rgba(10,10,15,0.9) 0%, transparent 100%);
}
```

### Typography Scale

```css
@theme {
  --font-family-heading: 'Satoshi', system-ui, sans-serif;
  --font-family-body: 'General Sans', system-ui, sans-serif;
  --font-family-mono: 'JetBrains Mono', monospace;

  /* Mobile-first sizes (rem) */
  --font-size-xs: 0.75rem;      /* 12px - timestamps, badges */
  --font-size-sm: 0.875rem;     /* 14px - card titles, metadata */
  --font-size-base: 1rem;       /* 16px - body text */
  --font-size-lg: 1.125rem;     /* 18px - section headers */
  --font-size-xl: 1.25rem;      /* 20px - page titles */
  --font-size-2xl: 1.5rem;      /* 24px - hero subtitle */
  --font-size-3xl: 2rem;        /* 32px - hero title */
  --font-size-4xl: 2.5rem;      /* 40px - hero title (TV) */
}

/* TV override: 1.5x scale for 10-foot viewing */
@media (display-mode: standalone) {
  :root { font-size: 20px; }
}

/* Large TV (4K) */
@media (display-mode: standalone) and (min-width: 3000px) {
  :root { font-size: 28px; }
}
```

### Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Icon padding, tight gaps |
| `space-2` | 8px | Card internal padding |
| `space-3` | 12px | Card gap (mobile) |
| `space-4` | 16px | Card gap (desktop), section margin |
| `space-6` | 24px | Card gap (TV), section padding |
| `space-8` | 32px | Page horizontal padding (desktop) |
| `space-10` | 40px | Page horizontal padding (TV safe zone) |
| `space-12` | 48px | Section vertical spacing |
| `space-16` | 64px | Hero bottom spacing |

### Card Variants

| Variant | Aspect | Width (Mobile) | Width (Desktop) | Width (TV) | Usage |
|---------|--------|----------------|-----------------|------------|-------|
| Poster | 2:3 | 120px | 180px | 240px | Movies, series browse |
| Landscape | 16:9 | 200px | 300px | 400px | Continue watching, featured |
| Channel | 16:9 | 160px | 200px | 260px | Live TV grid |
| Episode | 16:9 + text | full-width | 340px | 440px | Series detail episodes |
| Hero | fluid | full-width | full-width | full-width | Home hero banner |

### Focus Ring (Single Source of Truth)

```typescript
// src/design-system/focus/useFocusStyles.ts
export function useFocusStyles() {
  const { isTVMode } = useDeviceContext();

  return {
    ring: isTVMode
      ? 'ring-2 ring-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.15)]'
      : 'ring-2 ring-teal-400 ring-offset-2 ring-offset-bg-primary',
    scale: isTVMode ? 'scale-[1.08]' : 'scale-[1.03]',
    transition: 'transition-[transform,ring-color,box-shadow] duration-200 ease-out',
  };
}
```

### Animation Specifications (CSS-Only)

| Animation | Duration | Easing | Properties | TV-Safe |
|-----------|----------|--------|------------|---------|
| Card focus | 200ms | ease-out | transform, ring-color, box-shadow | Yes |
| Page fade-in | 150ms | ease-out | opacity | Yes (no transform) |
| Skeleton pulse | 1.5s loop | ease-in-out | opacity | Yes |
| Toast slide-in | 300ms | ease-out | transform, opacity | Yes |
| Controls fade | 200ms | ease-out | opacity | Yes |
| Rail scroll | instant | - | scrollLeft (JS) | Yes |

**Banned on TV**: `transition-all`, `backdrop-filter`, `filter`, SVG overlays, Framer Motion, `behavior: 'smooth'` on scrollIntoView.

---

## 4. Device Strategy

### Detection Hierarchy

```typescript
// src/shared/utils/deviceDetection.ts
export type DeviceClass = 'tv' | 'mobile' | 'tablet' | 'desktop';

export function detectDevice(): { deviceClass: DeviceClass; isTVMode: boolean } {
  // 1. URL override (testing): ?tv=true
  const urlTV = new URLSearchParams(window.location.search).get('tv') === 'true';

  // 2. localStorage override (sticky testing)
  const storedTV = localStorage.getItem('sv_tv_mode') === 'true';

  // 3. TWA/PWA detection (production Fire TV)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // 4. User-Agent detection
  const ua = navigator.userAgent;
  const isFireTV = /AFT|AFTM|AFTT|AFTS|AFTB/.test(ua);
  const isTizen = /Tizen/.test(ua);
  const isWebOS = /Web0S|webOS/.test(ua);
  const isAndroidTV = /Android/.test(ua) && /TV|BRAVIA|Nexus Player/.test(ua);

  const isTVMode = urlTV || storedTV || isStandalone || isFireTV || isTizen || isWebOS || isAndroidTV;

  // Device class for non-TV
  let deviceClass: DeviceClass;
  if (isTVMode) {
    deviceClass = 'tv';
  } else if ('ontouchstart' in window && window.innerWidth < 768) {
    deviceClass = 'mobile';
  } else if ('ontouchstart' in window && window.innerWidth < 1024) {
    deviceClass = 'tablet';
  } else {
    deviceClass = 'desktop';
  }

  return { deviceClass, isTVMode };
}
```

### Layout Adaptation

| Feature | Mobile | Tablet | Desktop | TV |
|---------|--------|--------|---------|-----|
| Navigation | Bottom tabs | Side drawer | Top nav + sidebar | Minimal top nav (D-pad) |
| Card columns | 2-3 | 3-4 | 5-6 per rail | 4-5 per rail |
| Hero | Single poster | Wide banner | Full-width + metadata | Full-bleed + auto-focus |
| Player controls | Touch overlay | Touch overlay | Mouse hover overlay | D-pad arrow keys |
| Scroll | Touch + momentum | Touch + momentum | Mouse wheel + scrollbar | Spatial nav (no scroll) |
| Focus indicators | Touch highlight | Touch highlight | Hover + focus ring | Focus ring + scale |
| Font scale | 16px base | 16px base | 16px base | 20px base (1.25x) |
| Safe zones | None | None | None | 5% overscan padding |
| Animations | CSS (reduced) | CSS (full) | CSS (full) | CSS (minimal, no blur) |

### Adaptive Behavior per Device

```typescript
// src/shared/hooks/useDeviceContext.ts
export function useDeviceContext() {
  const [device] = useState(() => detectDevice());

  const config = useMemo(() => ({
    // HLS.js settings
    hlsBackBuffer: device.isTVMode ? 20 : device.deviceClass === 'mobile' ? 30 : 60,
    hlsMaxBuffer: device.isTVMode ? 30 : 60,
    hlsEnableWorker: !device.isTVMode,

    // UI behavior
    showHoverEffects: device.deviceClass === 'desktop',
    showScrollbars: !device.isTVMode,
    enablePiP: device.deviceClass === 'desktop' || device.deviceClass === 'mobile',
    enableFullscreenAPI: !device.isTVMode, // TV uses CSS fullscreen
    cardScale: device.isTVMode ? 1.08 : 1.03,

    // Performance
    enableGrainOverlay: false, // disabled everywhere (negligible visual, compositor cost)
    maxRailItems: device.isTVMode ? 20 : device.deviceClass === 'mobile' ? 15 : 30,
    imageQuality: device.deviceClass === 'mobile' ? 'low' : 'high',
    enableVirtualization: true, // all devices

    ...device,
  }), [device]);

  return config;
}
```

---

## 5. Player Architecture

### Core Problem

v1.x has a dual-player conflict: global `FullscreenPlayer` in `__root.tsx` AND inline `PlayerPage` in feature pages. Both mount HLS instances simultaneously on live TV. Back button handling breaks.

### v2.0 Solution: Single Global Player

```
__root.tsx
  ├── LayoutSelector (picks TV/Desktop/Mobile)
  │   └── <Outlet /> (route content -- NO player here)
  └── PlayerShell (OUTSIDE layout, OUTSIDE any CSS transform)
      ├── VideoElement (HLS.js / mpegts.js)
      ├── DeviceControls (picks TV/Desktop/Mobile controls)
      ├── BufferingOverlay
      └── ErrorRecovery
```

**Rules:**
1. ONE player instance, ever. Lives in `__root.tsx`, outside `<Outlet />`.
2. Player renders OUTSIDE any CSS `transform` ancestor (prevents `position: fixed` breakage).
3. All playback goes through `playerStore.playStream()`. No component renders its own player.
4. Player visibility controlled by `playerStore.currentStreamId`. Null = hidden.

### Declarative Player API

Replace the 10-method imperative handle with props-driven state:

```typescript
// src/features/player/store.ts
interface PlayerState {
  // Playback
  currentStreamId: string | null;
  streamType: 'live' | 'vod' | 'series' | null;
  streamName: string;
  startTime: number; // resume position

  // Series context
  seriesContext: {
    seriesId: string;
    seasonNum: number;
    episodeNum: number;
    episodes: Episode[];
  } | null;

  // Player state (written by VideoElement, read by controls)
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  bufferedEnd: number;
  isBuffering: boolean;
  error: PlayerError | null;

  // User preferences
  quality: number;        // HLS level (-1 = auto)
  volume: number;
  isMuted: boolean;
  subtitleTrack: number;  // -1 = off
  audioTrack: number;

  // Actions
  play: (params: PlayParams) => void;
  stop: () => void;
  seek: (time: number) => void;
  seekRelative: (delta: number) => void;
  setQuality: (level: number) => void;
  nextEpisode: () => void;
  prevEpisode: () => void;
  channelUp: () => void;   // live TV
  channelDown: () => void;  // live TV
  retry: () => void;        // error recovery
}
```

### Device-Specific Controls

```typescript
// PlayerShell.tsx
function PlayerShell() {
  const { deviceClass } = useDeviceContext();
  const streamId = usePlayerStore(s => s.currentStreamId);

  if (!streamId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <VideoElement />
      <BufferingOverlay />
      <ErrorRecovery />
      {deviceClass === 'tv' && <TVControls />}
      {deviceClass === 'desktop' && <DesktopControls />}
      {(deviceClass === 'mobile' || deviceClass === 'tablet') && <MobileControls />}
    </div>
  );
}
```

**TV Controls**: Arrow keys for seek/volume, Enter for play/pause, long-press for fast seek (10s->30s->60s->120s acceleration), Back to close. No mouse interactions. Large text. Minimal UI.

**Desktop Controls**: Mouse hover to show, progress bar with scrub preview, quality/subtitle/audio dropdowns, volume slider, PiP button, fullscreen button, keyboard shortcuts.

**Mobile Controls**: Touch tap to show/hide, swipe left/right to seek, swipe up/down for volume/brightness, pinch for aspect ratio, tap sides for +/-10s.

---

## 6. Navigation Architecture

### Unified Back Button Handler

v1.x splits back handling across 3 files. v2.0 consolidates to ONE handler:

```typescript
// src/shared/hooks/useBackNavigation.ts
export function useBackNavigation() {
  useEffect(() => {
    function handleBack(e: KeyboardEvent) {
      // Normalize key across platforms
      const isBack =
        e.key === 'Backspace' ||
        e.key === 'Escape' ||
        e.key === 'GoBack' ||
        e.keyCode === 4 ||      // Fire TV
        e.keyCode === 10009 ||   // Samsung Tizen
        e.keyCode === 461;       // LG webOS

      if (!isBack) return;
      e.preventDefault();

      // Priority 1: Close player if active
      if (usePlayerStore.getState().currentStreamId) {
        usePlayerStore.getState().stop();
        return;
      }

      // Priority 2: Close any open modal/drawer
      if (useUIStore.getState().activeModal) {
        useUIStore.getState().closeModal();
        return;
      }

      // Priority 3: Blur focused input
      if (document.activeElement?.tagName === 'INPUT') {
        (document.activeElement as HTMLElement).blur();
        return;
      }

      // Priority 4: Navigate back
      if (window.history.length > 1) {
        window.history.back();
      }
    }

    window.addEventListener('keydown', handleBack);
    return () => window.removeEventListener('keydown', handleBack);
  }, []);
}
```

### Spatial Navigation (TV)

Retain norigin-spatial-navigation v2 with fixes:

1. **Fix Enter handler conflict**: Remove global `.click()` + `stopPropagation()`. Use norigin's native `onEnterPress` exclusively.
2. **Consolidate focus ring**: All focusable components use `useFocusStyles()` hook, not hand-coded strings.
3. **Container focusable: false**: All containers default to `focusable: false` to prevent stealing focus.
4. **scrollIntoView: 'instant'**: Never 'smooth' during spatial navigation.

### Mobile Navigation

- Bottom tab bar: Home, Live, Search, Favorites, Settings
- Pull-to-refresh on content pages
- Swipe-back gesture (via browser native)
- Touch ripple on interactive elements

### Desktop Navigation

- Top nav bar: Logo, Home, Live, Movies, Series, Search, Profile
- Keyboard shortcuts: `/` for search, `Esc` to close, arrow keys in player
- Mouse hover for card expansion (jawbone pattern)

---

## 7. Data Layer

### TanStack Query Patterns

```typescript
// src/lib/queryConfig.ts
export const queryConfig = {
  // Content catalogs (change slowly)
  categories: { staleTime: 6 * 60 * 60 * 1000 },  // 6 hours
  streams: { staleTime: 30 * 60 * 1000 },           // 30 minutes
  vodInfo: { staleTime: 60 * 60 * 1000 },           // 1 hour
  seriesInfo: { staleTime: 60 * 60 * 1000 },        // 1 hour

  // Dynamic content
  epg: { staleTime: 5 * 60 * 1000 },                // 5 minutes
  featured: { staleTime: 15 * 60 * 1000 },          // 15 minutes
  search: { staleTime: 60 * 1000 },                  // 1 minute

  // User data (changes frequently)
  favorites: { staleTime: 30 * 1000 },               // 30 seconds
  history: { staleTime: 30 * 1000 },                  // 30 seconds
};
```

### Prefetching Strategy

- **TV**: Prefetch detail data on card FOCUS (1s debounce)
- **Desktop**: Prefetch on card HOVER
- **Mobile**: No prefetch (conserve bandwidth)

### Error Handling

```typescript
// Centralized error handler
function handleQueryError(error: Error, query: Query) {
  if (error instanceof AuthError) {
    // Silent refresh, retry query
    return;
  }
  if (error instanceof NetworkError) {
    // Show toast: "Connection lost. Retrying..."
    toastStore.add({ type: 'warning', message: 'Connection lost. Retrying...' });
    return;
  }
  // Unknown error: show toast with retry
  toastStore.add({ type: 'error', message: 'Something went wrong', action: { label: 'Retry', fn: () => query.refetch() }});
}
```

### CSRF Token Refresh

Fix v1.x bug: CSRF token cached forever. v2.0 refreshes on 403:

```typescript
// In api.ts, on 403 response:
if (response.status === 403) {
  csrfToken = null; // Clear cached token
  csrfToken = await fetchCSRF(); // Fetch fresh
  return api(url, { ...options }); // Retry once
}
```

---

## 8. Performance Budget

### Bundle Size Targets

| Chunk | Target (gzipped) | Contents |
|-------|-------------------|----------|
| vendor-react | <50KB | React, ReactDOM |
| vendor-tanstack | <40KB | Router, Query, Virtual |
| vendor-spatial | <15KB | norigin-spatial-navigation |
| app-core | <80KB | Layouts, design system, routing, stores |
| feature-home | <30KB | Home page components |
| feature-player | <100KB | HLS.js (lazy), controls, player shell |
| feature-live | <25KB | Live page, EPG |
| feature-vod | <20KB | VOD pages |
| feature-series | <25KB | Series pages |
| feature-search | <15KB | Search page |
| **Total** | **<400KB** | All routes loaded |

### Runtime Targets

| Metric | TV (Fire Stick) | Desktop | Mobile (low-end) |
|--------|----------------|---------|-------------------|
| First Paint | <2.5s | <1.5s | <2s |
| TTI | <4s | <3s | <3.5s |
| Navigation FPS | 30fps min | 60fps | 60fps |
| Memory ceiling | 200MB | 1GB | 250MB |
| HLS back buffer | 20s | 60s | 30s |
| Max concurrent queries | 3 | 6 | 4 |

### Performance Techniques

1. **Route-level code splitting**: Every route is `lazy()` loaded
2. **HLS.js dynamic import**: Only loaded when player opens
3. **Image lazy loading**: Native `loading="lazy"` + `decoding="async"`
4. **Virtualized grids**: TanStack Virtual for any list >20 items
5. **React.memo on cards**: Prevent re-render cascade on rail navigation (proven in v1.x: 40->4 re-renders)
6. **Zustand selectors**: Granular subscriptions, no full-store re-renders
7. **CSS-only animations**: Zero JS animation libraries
8. **Container queries**: Card sizing relative to rail, not viewport
9. **Shared IntersectionObserver**: Singleton observer for all lazy images
10. **Prefetch on idle**: `requestIdleCallback` for adjacent route prefetch

---

## 9. Accessibility Plan

### WCAG 2.1 AA Compliance Checklist

| Criterion | Implementation |
|-----------|---------------|
| 1.1.1 Non-text Content | All images have alt text (decorative = `alt=""` + `role="presentation"`) |
| 1.3.1 Info and Relationships | Semantic HTML: `<nav>`, `<main>`, `<article>`, `<section>` with headings |
| 1.4.3 Contrast (Minimum) | Text primary (#f5f5f5) on bg-primary (#0a0a0f) = 18.3:1. Secondary (#94a3b8) on bg-primary = 6.3:1. Both pass AA. |
| 2.1.1 Keyboard | All interactive elements reachable via Tab (desktop) or D-pad (TV) |
| 2.4.1 Bypass Blocks | Skip-to-content link as first focusable element |
| 2.4.3 Focus Order | Logical tab order matching visual layout |
| 2.4.7 Focus Visible | Focus ring visible on all devices (teal ring + scale) |
| 3.3.1 Error Identification | Form errors announced via `aria-describedby` |
| 4.1.2 Name, Role, Value | All interactive divs have `role="button"` + `aria-label` |

### Implementation

```typescript
// Skip link (first element in body)
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-accent-teal focus:text-bg-primary"
>
  Skip to content
</a>

// Main content landmark
<main id="main-content" role="main">
  <Outlet />
</main>

// Interactive card with proper ARIA
<article
  ref={ref}
  role="button"
  tabIndex={focused ? 0 : -1}
  aria-label={`${title}, ${year}, rated ${rating} out of 10. ${genre}. Press Enter to view details.`}
  aria-selected={focused}
>
  <img src={poster} alt="" role="presentation" />
</article>

// Loading announcer
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {isLoading ? `Loading ${section} content` : ''}
</div>

// Toast with alert role
<div role="alert" aria-live="assertive">
  {toast.message}
</div>
```

### Reduced Motion

```typescript
export function useReducedMotion() {
  return useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );
}

// Usage: disable animations
const duration = useReducedMotion() ? '0ms' : '200ms';
```

---

## 10. Backward Compatibility

### Browser Support Matrix

| Browser | Minimum Version | Key Constraint |
|---------|----------------|----------------|
| Chrome | 80 | Vite target, baseline for all features |
| Firefox | Latest | No version constraint |
| Safari | 14+ | HLS native (no HLS.js needed) |
| Samsung Internet | 14+ (Chromium 87) | Tizen TV |
| Fire TV Silk | ~Chrome 90 | Primary TV target |
| LG webOS | Chromium 79+ | Older TVs may be 68 |
| Android WebView | Chrome 80+ | TWA/PWA |

### Polyfill Strategy

Chrome 80 already supports: ES2020, Optional Chaining, Nullish Coalescing, Promise.allSettled, CSS Grid, CSS Custom Properties, IntersectionObserver, ResizeObserver.

**No polyfills needed for Chrome 80 target.** Features to avoid:
- CSS `container` queries: Chrome 105+ (use media queries as fallback)
- CSS `:has()` selector: Chrome 105+ (avoid)
- `structuredClone()`: Chrome 98+ (use JSON parse/stringify)
- `Array.at()`: Chrome 92+ (use bracket notation)
- `Object.hasOwn()`: Chrome 93+ (use `Object.prototype.hasOwnProperty`)

### Progressive Enhancement

```typescript
// Feature detection for optional enhancements
const supportsContainerQueries = CSS.supports('container-type', 'inline-size');
const supportsPiP = 'pictureInPictureEnabled' in document;
const supportsViewTransitions = 'startViewTransition' in document;

// Use feature, fallback to alternative
if (supportsContainerQueries) {
  // Use @container queries for responsive cards
} else {
  // Fall back to media queries
}
```

---

## 11. Network Resilience

### Loading States (Skeleton Screens)

Every page has a corresponding skeleton:

```typescript
function RailSkeleton({ count = 6 }) {
  return (
    <div className="px-4 md:px-8 lg:px-12">
      <div className="h-5 w-36 bg-bg-tertiary rounded animate-pulse mb-3" />
      <div className="flex gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex-none w-[180px]">
            <div className="aspect-[2/3] bg-bg-tertiary rounded-lg animate-pulse" />
            <div className="h-3.5 w-3/4 bg-bg-tertiary rounded mt-2 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Retry Strategy

```typescript
// TanStack Query retry config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof AuthError) return false; // Don't retry auth failures
        if (error instanceof NotFoundError) return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

### Network Status Detection

```typescript
// src/shared/hooks/useNetworkStatus.ts
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [effectiveType, setEffectiveType] = useState<string>(
    (navigator as any).connection?.effectiveType || '4g'
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    const onConnectionChange = () => {
      setEffectiveType((navigator as any).connection?.effectiveType || '4g');
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    (navigator as any).connection?.addEventListener('change', onConnectionChange);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      (navigator as any).connection?.removeEventListener('change', onConnectionChange);
    };
  }, []);

  return {
    isOnline,
    effectiveType, // 'slow-2g' | '2g' | '3g' | '4g'
    isSlowNetwork: effectiveType === 'slow-2g' || effectiveType === '2g',
  };
}
```

### Adaptive Quality

On slow networks: default to lowest HLS quality, disable image preloading, reduce prefetch.

### Player Buffering UI

```typescript
function BufferingOverlay() {
  const isBuffering = usePlayerStore(s => s.isBuffering);
  if (!isBuffering) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
      <div className="w-12 h-12 border-4 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
      <span className="sr-only">Buffering video</span>
    </div>
  );
}
```

---

## 12. Testing Strategy

### Test Pyramid

| Level | Tool | Coverage Target | Focus |
|-------|------|----------------|-------|
| Unit | Vitest | 80%+ utilities/hooks | Pure functions, store logic, formatters |
| Component | Vitest + Testing Library | Key components | Rendering, user interaction, ARIA |
| Integration | Vitest + MSW | API layer | Query hooks, error handling, auth flow |
| E2E | Playwright | Critical paths | Login, browse, play, search, favorites |
| Visual | Playwright screenshots | Key pages | Regression on redesign |

### Component Test Examples

```typescript
// ContentCard.test.tsx
describe('ContentCard', () => {
  it('renders with correct ARIA label', () => {
    render(<ContentCard item={mockMovie} />);
    expect(screen.getByRole('button'))
      .toHaveAttribute('aria-label', expect.stringContaining('Arjun Reddy'));
  });

  it('shows progress bar for partially watched content', () => {
    render(<ContentCard item={mockMovie} progress={0.5} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  });

  it('calls onSelect when Enter pressed', async () => {
    const onSelect = vi.fn();
    render(<ContentCard item={mockMovie} onSelect={onSelect} />);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(mockMovie.stream_id);
  });
});
```

### E2E Test Scenarios (Playwright)

```typescript
// tests/e2e/browse.spec.ts
test.describe('Content Browsing', () => {
  test('home page loads with rails', async ({ page }) => {
    await page.goto('/home');
    await expect(page.getByRole('heading', { name: /continue watching/i })).toBeVisible();
    await expect(page.locator('[data-testid="content-rail"]')).toHaveCount.greaterThanOrEqual(3);
  });

  test('keyboard navigation through rails', async ({ page }) => {
    await page.goto('/home');
    await page.keyboard.press('Tab'); // Focus first card
    await expect(page.locator('[data-focused="true"]')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    // Verify focus moved to next card
  });

  test('play movie and verify player opens', async ({ page }) => {
    await page.goto('/vod/12345');
    await page.getByRole('button', { name: /play/i }).click();
    await expect(page.locator('[data-testid="player-shell"]')).toBeVisible();
  });
});
```

### MSW (Mock Service Worker) for API Mocking

```typescript
// tests/mocks/handlers.ts
export const handlers = [
  http.get('/api/live/categories', () => {
    return HttpResponse.json(mockCategories);
  }),
  http.get('/api/live/featured', () => {
    return HttpResponse.json(mockFeaturedChannels);
  }),
  // ... all 18 endpoints
];
```

---

## 13. Migration Strategy

### Approach: Feature-Branch Rebuild

**Why not incremental?** The redesign touches every file: new design tokens, new folder structure, new component decomposition, new player architecture, new layouts. Incremental patches would create a long-lived mixed state where v1 and v2 patterns coexist, increasing confusion and bugs.

**Why not separate repo?** The backend API, Docker setup, CI/CD, and deployment are tightly coupled to the existing repo. A branch preserves all of this.

### Migration Steps

1. **Create branch**: `git checkout -b feat/v2-redesign` from current `main`
2. **Preserve v1 as tag**: `git tag v1.0.0-stable` for rollback
3. **Scaffold new structure**: Create new folder layout, move reusable code
4. **Build sprint-by-sprint**: Each sprint delivers a working state (design system -> layouts -> pages -> player -> tests)
5. **Parallel deployment**: v1 on `main`, v2 on branch. Switch when ready.
6. **Merge via PR**: Final `feat/v2-redesign` -> `main` PR with full review.

### What to Carry Over (proven patterns)

- `useSpatialFocusable` / `useSpatialContainer` hooks (refactored, not rewritten)
- HLS.js configuration (TV buffer sizes, worker toggle)
- `usePlayerKeyboard` hold-to-seek acceleration
- `useProgressTracking` (10s interval, 5s threshold)
- TanStack Query stale times
- API client with 401 refresh
- Zustand store patterns

### What to Rewrite

- All components (new design system, decomposition)
- Layout system (device-specific shells)
- Player architecture (single global, declarative)
- Back button handling (unified)
- Focus ring system (centralized)
- Error handling (consistent)
- Accessibility (ARIA throughout)

---

## 14. Sprint Plan

> Updated after evaluation review. Sprint 3 split into 3A/3B, buffer sprint added.
> Total: 12 sprints, ~45-62 working days, ~12-16 weeks at 50% allocation.

### Sprint 0: Foundation (3-5 days)
**Goal**: Scaffolded project with design system, build pipeline, error boundaries, and localStorage migration.

**Tasks**:
- Create `feat/v2-redesign` branch, tag v1.0.0-stable
- New folder structure (empty files for all planned components)
- Design system tokens (colors, typography, spacing, shadows)
- `tailwind.css` with all custom theme tokens
- Self-host Satoshi + General Sans fonts with `font-display: swap` and preload for Satoshi-Bold + GeneralSans-Regular (see H8)
- Primitive components: Button, Badge, Skeleton, Toast (with severity levels, see H10)
- Card components: PosterCard, LandscapeCard, HeroCard (static, no data) with image fallback gradients (see H7)
- Focus system: FocusRing, useFocusStyles, FocusableCard, FocusableButton
- Bundle analyzer setup (rollup-plugin-visualizer)
- Remove dead code: Sidebar.tsx, Navbar.tsx, `sharp` from devDependencies
- React Error Boundaries at three levels: `AppErrorBoundary` (root), route-level (per `_authenticated/*`), and `PlayerErrorBoundary` (see C4)
- localStorage v1 migration: clear all `sv_` prefixed keys on v2 first load, bump Zustand persist versions (see C6)
- Lower Vite build target to `es2019` / `chrome69` for Tizen 5.0+ and LG webOS 5.0+ support (see C2, C10)

**Deliverable**: Design system storybook-like page at `/dev/design-system` showing all tokens and components. Error boundaries catch crashes at every level.

---

### Sprint 1: Layouts and Navigation (3-5 days)
**Goal**: Device-adaptive layouts with routing.

**Tasks**:
- `useDeviceContext` hook with full detection (Fire TV, Tizen, webOS, mobile, desktop)
- `DeviceProvider` wrapping app
- `TVLayout` with spatial nav provider, safe zones
- `DesktopLayout` with top nav, sidebar
- `MobileLayout` with bottom tabs
- `LayoutSelector` that picks based on device
- `SpatialNavProvider` refactor: remove global `.click()` Enter handler
- Unified `useBackNavigation` hook (single handler, all platforms)
- `keyMappings.ts` with constants for Fire TV, Tizen, webOS
- Skip-to-content link
- Route structure (all routes as empty shells with skeletons)
- `__root.tsx` with layout selector + player mount point
- `inputMode` hybrid handling: pointer movement sets `inputMode: 'pointer'` (show hover, hide focus rings, pause spatial nav), arrow key press sets `inputMode: 'keyboard'` (show focus rings, hide cursor, resume spatial nav) -- carry over from v1.x and enhance for LG Magic Remote (see H4)
- TV font-size detection via JS-set CSS class (`document.documentElement.classList.add('tv-mode')`) instead of `@media (display-mode: standalone)` to prevent mobile PWA from getting TV-sized text (see C3)

**Deliverable**: App launches, detects device, renders appropriate layout with navigation working. All routes show skeleton placeholders.

---

### Sprint 2: Home Page and Content Rails (3-5 days)
**Goal**: Complete home page with real data.

**Tasks**:
- `HomePage` with hero banner + content rails
- `HeroBanner` component (featured content, gradient overlay, CTA) -- hero image uses `loading="eager"` + `fetchpriority="high"` (see H9)
- `ContentRail` component (horizontal scroll, virtualized, device-adaptive) -- first 4-6 visible cards per rail use `loading="eager"`, rest use `loading="lazy"` via `isFirstVisible` prop (see H9)
- `ContinueWatchingRail` (landscape cards with progress bars)
- `FeaturedRail` (live TV featured channels)
- `CategoryRail` (generic rail for any content type)
- `useContentRailData` hook (retained logic, new integration)
- Skeleton screens for all rails
- Image lazy loading with shared IntersectionObserver
- Prefetch on focus (TV) / hover (desktop)
- `HorizontalScroll` fix: remove Zustand inputMode subscription
- Component tests for ContentRail, PosterCard, LandscapeCard

**Deliverable**: Home page loads with real data, rails scroll, cards show, skeletons display during loading.

---

### Sprint 3A: VOD + Series Pages (3-5 days)
**Goal**: VOD browsing and series detail pages.

**Tasks**:
- `VODPage` with category browser and movie grid
- `MovieDetail` page (poster, metadata, cast, play button, favorite button)
- `MovieGrid` with virtualized grid (TanStack Virtual)
- `SeriesPage` with category browser and series grid
- `SeriesDetail` decomposed: shell + `SeasonNav` + `EpisodeList` + `EpisodeCard`
- Category tabs/filters
- Sort options (alphabetical, rating, date added)
- Component tests for MovieDetail, SeriesDetail, EpisodeCard

**Deliverable**: VOD and Series pages working with real data, proper decomposition, virtualized grids.

---

### Sprint 3B: Live + Search + Favorites (3-5 days)
**Goal**: Live TV browsing, search, and favorites pages.

**Tasks**:
- `LivePage` with category grid and channel cards
- `ChannelCard` component (live indicator, EPG now/next)
- `FavoritesPage`
- `SearchPage` decomposed: `SearchFilters` + `SearchResults`
- Virtualized grid for large catalogs (TanStack Virtual)
- Component tests for ChannelCard, SearchPage, FavoritesPage

**Deliverable**: Live, Search, and Favorites pages working with real data, proper decomposition.

---

### Sprint 4: Player Rebuild (5-7 days)
**Goal**: Single unified player with device-specific controls, state machine, and recovery.

**Tasks**:
- `PlayerShell` (single global player in __root.tsx)
- `VideoElement` (HLS.js + mpegts.js, dynamic import)
- Declarative `playerStore` with explicit status enum replacing boolean flags (see C5)
- `DesktopControls` (hover overlay, progress bar, quality, subtitles, volume, PiP, fullscreen)
- `TVControls` (D-pad seek, volume, minimal UI, large text)
- `MobileControls` (touch tap show/hide, swipe seek, swipe volume)
- `ProgressBar` with scrub preview (desktop), keyboard seek (TV)
- `QualitySelector` dropdown
- `SubtitleSelector` dropdown
- `AudioTrackSelector` dropdown
- `BufferingOverlay` with spinner
- `ErrorRecovery` with retry button and error message
- `usePlayerKeyboard` (retained hold-to-seek, unified key handling)
- `useProgressTracking` (retained 10s save)
- `useAdaptiveQuality` (device-aware defaults)
- Live TV channel switching flow with 300ms debounce, `hls.stopLoad()` before new source, channel info overlay for 3s (see C8, H1)
- `useVisibilityState` hook for sleep/wake recovery and mobile backgrounding: stop HLS on hidden, reload live / resume VOD on visible, auto-retry first attempt (see H2, H3)
- HLS event cleanup in VideoElement useEffect: remove all listeners, call `hls.destroy()`, null the ref (see H6)
- Auto-next episode for series
- Remove all inline player instances from feature pages

**Deliverable**: Player works on all devices. Single instance. No dual-player conflict. State machine prevents impossible states. Error recovery. Buffering indicator. Sleep/wake works.

---

### Sprint 5: EPG and Live TV Enhancements (3-5 days)
**Goal**: Full EPG guide and channel switching.

**Tasks**:
- `EPGTimeline` component (horizontal timeline, 2hr window, now marker)
- EPG data fetching with auto-refresh (5min interval)
- Channel switching overlay (up/down arrows, channel name + number)
- Live indicator animation (pulsing red dot)
- Program info popup on channel focus
- Catch-up/archive playback (if provider supports)
- Quick channel switch (number keys on TV remote -- optional)

**Deliverable**: Live TV has a full guide, channel switching works on all remotes.

---

### Sprint 6: Settings, Auth, Service Worker, and Polish (3-5 days)
**Goal**: Complete settings page, auth polish, service worker, visual refinements.

**Tasks**:
- `SettingsPage` (server config, player preferences, about)
- Player preferences: default quality, subtitle language, auto-play next
- Login page visual redesign (brand gradient, ambient glow)
- Auto-login flow polish
- CSRF token refresh on 403
- Consistent error handling across all features
- Toast system with severity-based ARIA roles (see H10)
- Network status banner (offline/slow)
- Loading state announcements for screen readers
- Reduced motion support throughout
- Service Worker: app shell caching, stale-while-revalidate for catalog API, network-first for user data, EXCLUDE `/api/stream/*` from cache, update notification ("New version available"), network-first for navigation requests to support rollback (see C1)

**Deliverable**: Settings work, auth flow is polished, error handling is consistent, accessibility announcements work. SW enables offline shell and satisfies TWA installability.

---

### BUFFER: Bug Fixes and Overflow (3-5 days)
**Goal**: Address issues found during previous sprints, polish edge cases.

**Tasks**:
- Fix any bugs discovered during Sprints 0-6
- Overflow tasks that didn't fit in their sprint time-box
- Cross-device smoke testing on Fire TV, desktop, and mobile
- TanStack Query `gcTime` tuning per device class (see H5)
- Card image `object-fit: cover` + `object-position: center top` + `onError` fallback gradient (see H7)

**Deliverable**: All known bugs from development sprints resolved. Clean baseline for performance and testing sprints.

---

### Sprint 7: Performance Optimization (3-5 days)
**Goal**: Hit all performance budget targets.

**Tasks**:
- Bundle analysis: identify and eliminate oversized chunks
- Verify lazy loading on all routes
- Shared IntersectionObserver for images
- React.memo audit: ensure all card components are memoized
- Zustand subscription audit: no unnecessary re-renders
- CSS audit: remove unused utilities, verify no `transition-all`
- Memory profiling on Fire Stick (target <200MB)
- FPS profiling during rail navigation (target 30fps on TV)
- HLS buffer tuning verification per device
- Lighthouse CI baseline (target 90+ performance)

**Deliverable**: All performance targets met. Bundle <400KB gzipped. Memory <200MB on TV.

---

### Sprint 8: Testing (5-7 days)
**Goal**: Comprehensive test coverage.

**Tasks**:
- Component tests for: ContentCard, PlayerShell, DesktopControls, TVControls, ContentRail, SearchPage, LoginPage, SettingsPage
- Integration tests with MSW: all 18 API endpoints mocked
- Store tests: playerStore (play, stop, seek, nextEpisode, state machine transitions), authStore, uiStore
- Hook tests: useBackNavigation, useDeviceContext, useNetworkStatus, useVisibilityState
- E2E with Playwright: login, browse home, play movie, search, manage favorites, series binge
- Visual regression: Playwright screenshots of key pages (home, player, detail, search)
- Accessibility audit: axe-core integration in component tests

**Deliverable**: 80%+ utility/hook coverage, all critical E2E paths passing, visual baselines established.

---

### Sprint 9: Cross-Device Testing and Polish (3-5 days)
**Goal**: Verify on all target devices, fix edge cases.

**Tasks**:
- Fire TV APK build and test (PWABuilder TWA)
- Samsung Tizen TV test (if available, or emulator) -- minimum Tizen 5.0 (2019+)
- LG webOS test (if available, or emulator) -- minimum webOS 5.0 (2020+)
- Old Android phone test (Chrome 80)
- Desktop Chrome, Firefox, Safari test
- Tablet responsive test
- Fix all device-specific bugs found
- Performance re-verification on each device
- Accessibility re-verification
- Final visual polish (spacing, alignment, color consistency)

**Deliverable**: App works smoothly on all 6 target device classes. Ready for merge.

---

### Sprint 10: Merge and Deploy (1-2 days)
**Goal**: Merge v2 to main, deploy, verify production.

**Tasks**:
- Final code review (quality-reviewer agent)
- Security audit (security-auditor agent)
- PR: `feat/v2-redesign` -> `main` with full summary
- CI/CD verification
- Production deploy with versioned Docker image tag (`streamvault-frontend:v2.0.0`)
- Smoke test on production
- Tag `v2.0.0`
- Update documentation (README, context files)
- Archive v1 branch/tag
- Verify rollback procedure works (switch Docker tag to v1.0.0, confirm SW serves fresh content) (see C9)

**Deliverable**: v2.0 live in production. Rollback tested and documented.


---

## 15. Risk Register

| ID | Risk | Probability | Impact | Mitigation |
|----|------|------------|--------|------------|
| R1 | Samsung/LG TV WebView incompatibilities | Medium | High | Test early (Sprint 1), maintain Chrome 80 baseline, feature detection |
| R2 | Norigin spatial nav bugs on new layout | Medium | High | Keep v1 spatial hooks as reference, incremental refactor not rewrite |
| R3 | Fire TV APK (TWA) breaks with new PWA changes | Low | Critical | Test APK build every sprint, keep PWABuilder config stable |
| R4 | HLS.js memory leak on old devices | Medium | High | Profile on Fire Stick every sprint, enforce buffer limits |
| R5 | Tailwind 4 CSS features not supported on older browsers | Low | Medium | Test on Chrome 80 baseline, avoid container queries without fallback |
| R6 | Large redesign branch diverges from v1 fixes | Medium | Medium | Cherry-pick critical v1 fixes into v2 branch |
| R7 | Performance regression from new components | Medium | High | Lighthouse CI on every PR, bundle size check |
| R8 | Scope creep adding features beyond redesign | High | Medium | Strict out-of-scope list, defer new features to v2.1+ |
| R9 | Single developer bottleneck | High | High | Sprint-based delivery, each sprint is independently shippable |
| R10 | Backend API changes needed for new features | Low | Medium | Backend API is frozen for v2.0, new endpoints deferred |

---

## Appendix A: Files to Delete

- `src/shared/components/Sidebar.tsx` (dead code, 65 lines)
- `src/shared/components/Navbar.tsx` (dead code, 41 lines)
- Remove `sharp` from `package.json` devDependencies

## Appendix B: Files to Decompose

| Current File | Lines | Decompose Into |
|-------------|-------|----------------|
| SeriesDetail.tsx | 845 | SeriesDetailPage (200), SeasonNav (150), EpisodeList (250), EpisodeCard (100) |
| PlayerControls.tsx | 479 | DesktopControls (200), TVControls (150), MobileControls (150), ProgressBar (150) |
| SearchPage.tsx | 414 | SearchPage (150), SearchFilters (100), SearchResults (150) |
| VideoPlayer.tsx | 404 | VideoElement (200), useHlsSetup (100), useMpegtsSetup (80) |
| LivePage.tsx | 319 | LivePage (150), ChannelGrid (100), ChannelSwitcher (80) |

## Appendix C: Key Metrics to Track

| Metric | Tool | Frequency |
|--------|------|-----------|
| Bundle size | rollup-plugin-visualizer | Every PR |
| Lighthouse score | Lighthouse CI | Every PR |
| Test coverage | Vitest coverage | Every PR |
| Component count | Custom script | Every sprint |
| WCAG compliance | axe-core | Every sprint |
| Memory usage (TV) | Chrome DevTools | Every sprint |
| FPS during navigation | Chrome DevTools | Every sprint |

---

## Addendum: Evaluation Fixes

> Added after plan review. Addresses 10 critical issues (C1-C10) and 10 high-priority gaps (H1-H10).

### Critical Issues

#### C1: Service Worker Strategy

The plan lacked a Service Worker strategy. Added to Sprint 6.

**Registration**: SW registered in `index.html` via `<script>` tag with scope `/`.

**App Shell Caching (Precache)**:
- HTML shell, CSS, JS bundles, self-hosted fonts (Satoshi, General Sans)
- Precached at install time via Workbox `precacheAndRoute()`

**Runtime Caching**:
- Catalog API (`/api/live/categories`, `/api/vod/categories`, etc.): `StaleWhileRevalidate` -- show cached, refresh in background
- User data (`/api/favorites`, `/api/history`, `/api/auth/*`): `NetworkFirst` -- always fresh, fall back to cache offline
- Static assets (images, icons): `CacheFirst` with 30-day expiration

**Exclusions**:
- `/api/stream/*` routes MUST NOT be cached. HLS segments are time-sensitive and large. Add a `registerRoute` with `NetworkOnly` strategy for `/api/stream/` prefix.

**Update Notification**:
- Listen for `controllerchange` event. Show toast: "New version available" with "Reload" button that calls `window.location.reload()`.

**TWA Installability**:
- SW satisfies Chrome's installability requirements for TWA. The SW + manifest.json + HTTPS are the three prerequisites.

**Rollback Safety**:
- Navigation requests (`mode: 'navigate'`) use `NetworkFirst` strategy. On Docker rollback to v1, the SW fetches fresh v1 HTML from server instead of serving cached v2.

---

#### C2: Tizen WebView Version Mismatch

**Decision**: Lower Vite build target from `chrome80` to `es2019` / `chrome69`.

**Impact**: ~2-5% bundle size increase from transpiling Optional Chaining (`?.`) and Nullish Coalescing (`??`) which are ES2020 features not available in Chrome 69.

**Supported**: Samsung Tizen 5.0+ (2019, Chromium 69+), LG webOS 5.0+ (2020, Chromium 79+), Fire TV Silk (~Chrome 90+).

**Unsupported**: Samsung Tizen 3.0-4.0 (Chromium 47-56) is explicitly unsupported. These TVs are 2015-2017 vintage and lack too many modern APIs.

Updated in Sprint 0 and Section 10 compatibility matrix.

---

#### C3: TV Font-Size Detection

**Problem**: `@media (display-mode: standalone)` applies to ALL PWA installs, including mobile. A user adding StreamVault to their phone home screen would get 20px base font (TV-sized text).

**Fix**: Replace the CSS media query with a JS-set CSS class.

```typescript
// In deviceDetection.ts, after detection:
if (isTVMode) {
  document.documentElement.classList.add('tv-mode');
}
```

```css
/* Replace @media (display-mode: standalone) { :root { font-size: 20px; } } */
.tv-mode { font-size: 20px; }
.tv-mode @media (min-width: 3000px) { font-size: 28px; }
```

Updated in Sprint 1 (device detection sets the class).

---

#### C4: React Error Boundaries

**Three levels of error boundaries**:

1. **Root -- `AppErrorBoundary`**: Wraps the entire app in `__root.tsx`. Catches unrecoverable errors. Renders "Something went wrong" with a reload button.

2. **Route-level**: Each `_authenticated/*` route wrapped individually. A crash in `/series` does not crash `/home`. Shows "This page encountered an error" with back + retry buttons.

3. **Player -- `PlayerErrorBoundary`**: Wraps `PlayerShell`. Render errors in player controls show retry UI instead of a white screen. Player errors are isolated from the rest of the app.

Added to Sprint 0 as foundational infrastructure.

---

#### C5: Player State Machine

**Problem**: Boolean flags (`isPlaying`, `isBuffering`, `error`) allow impossible states (e.g., `isPlaying: true` AND `error: { ... }` simultaneously).

**Fix**: Replace with explicit status enum:

```typescript
type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'buffering' | 'error' | 'seeking';

interface PlayerState {
  status: PlayerStatus;
  // Derived helpers (computed, not stored):
  // isPlaying = status === 'playing'
  // isBuffering = status === 'buffering'
  // hasError = status === 'error'
}
```

**State transition rules**:
- `idle` -> `loading` (on `play()`)
- `loading` -> `playing` | `error`
- `playing` -> `paused` | `buffering` | `seeking` | `error` | `idle`
- `paused` -> `playing` | `seeking` | `idle`
- `buffering` -> `playing` | `error`
- `seeking` -> `playing` | `buffering` | `error`
- `error` -> `loading` (on `retry()`) | `idle` (on `stop()`)

Invalid transitions are no-ops (logged in development). Added to Sprint 4.

---

#### C6: localStorage Schema Migration

**Problem**: v1 Zustand persist state has a different shape than v2 stores. On v2 first load, stale v1 state could cause runtime errors.

**Fix**: Clear-and-reset approach (simplest, since v1 state is just auth credentials and preferences -- easily re-entered):

```typescript
// In app initialization, before any store hydration:
const V2_MIGRATION_KEY = 'sv_v2_migrated';
if (!localStorage.getItem(V2_MIGRATION_KEY)) {
  // Clear all v1 Zustand state
  Object.keys(localStorage)
    .filter(key => key.startsWith('sv_'))
    .forEach(key => localStorage.removeItem(key));
  localStorage.setItem(V2_MIGRATION_KEY, 'true');
}
```

User re-enters server credentials on first v2 load. Added to Sprint 0.

---

#### C7: Sprint 3 Split

**Rationale**: Original Sprint 3 combined VOD, Series, Live, Search, and Favorites -- too many pages for a 3-5 day sprint.

**Split**:
- **Sprint 3A** (3-5 days): VOD pages (VODPage, MovieDetail, MovieGrid) + Series pages (SeriesPage, SeriesDetail decomposed into SeasonNav + EpisodeList + EpisodeCard)
- **Sprint 3B** (3-5 days): Live page (LivePage, ChannelGrid, ChannelCard) + Search (SearchPage decomposed into SearchFilters + SearchResults) + Favorites (FavoritesPage)

Updated sprint numbering throughout Section 14. Buffer sprint added between Sprint 6 and Sprint 7.

---

#### C8: Live TV Channel Switching Flow

**Concrete flow**:

1. User presses Channel Up/Down during live playback.
2. `playerStore.channelUp()` called (debounced 300ms -- rapid presses queue only the final channel).
3. Store looks up next channel in current category list (wraps around at boundaries).
4. Execution sequence:
   - `hls.stopLoad()` -- cancel in-flight segment downloads
   - `hls.detachMedia()` -- disconnect from video element
   - Update `currentStreamId` in store
   - `hls.loadSource(newUrl)` -- load new manifest
   - `hls.attachMedia(videoEl)` -- reconnect to video element
5. Channel info overlay shows for 3 seconds: channel name, current program title, channel number.
6. NO inline player -- same global `PlayerShell`, just swaps the stream URL.

Added to Sprint 4.

---

#### C9: Rollback Plan

**Procedure**:

1. **Docker image versioning**: Build produces tagged images (`streamvault-frontend:v1.0.0`, `streamvault-frontend:v2.0.0`).
2. **Rollback execution**: Update `docker-compose.yml` image tag to `v1.0.0`, run `docker compose up -d`.
3. **Service Worker**: Navigation requests use `NetworkFirst` strategy. On rollback, SW fetches fresh v1 HTML from server on next visit. No stale v2 HTML served from cache.
4. **Fire TV TWA**: TWA loads from server URL. After Docker switch, the next app launch loads v1. Cached SW updates automatically.
5. **Target**: <5 minutes from decision to rolled-back production.

Added to Sprint 10.

---

#### C10: LG webOS Resolution

**Decision**: Minimum LG webOS 5.0 (2020+, Chromium 79). LG webOS 4.x (2018, Chromium 53) is below even `es2019` and is explicitly unsupported.

This is handled by C2 (lowering build target to `chrome69` / `es2019`). Chromium 79 (webOS 5.0) is well above the `chrome69` target, so all ES2019 features are natively supported without polyfills.

Updated in compatibility matrix (Section 10) and Sprint 9 testing tasks.

---

### High-Priority Gaps

#### H1: Rapid Channel Switching

Add 300ms debounce to `channelUp()` / `channelDown()` in playerStore. Implementation:
- Always call `hls.stopLoad()` before loading new source to cancel in-flight segment downloads.
- Debounce via `setTimeout`: if another switch arrives within 300ms, cancel the previous and only execute the final one.
- Test with rapid D-pad button presses (10 presses in 1 second should result in 1 channel change).

Added to Sprint 4.

---

#### H2: Sleep/Wake Recovery

Add `useVisibilityState` hook:

- On `visibilitychange` → hidden:
  - `hls.stopLoad()`, pause playback, save current position.
- On `visibilitychange` → visible:
  - **Live**: `hls.loadSource()` reload (manifest is stale after sleep).
  - **VOD**: `hls.startLoad()`, seek to last known position.
- **Platform events**: Tizen uses `visibilitychange`. LG webOS uses `webOSRelaunch` event.
- **Recovery behavior**: Auto-retry first attempt without user interaction. Show `ErrorRecovery` component on second failure.

Added to Sprint 4.

---

#### H3: Mobile Backgrounding

Same `useVisibilityState` hook handles this. On mobile hidden: stop HLS loading, pause video element. On visible: resume playback. Prevents battery drain and bandwidth waste from streaming video in the background.

Added to Sprint 4 (shared implementation with H2).

---

#### H4: LG Magic Remote Hybrid Input

The v1.x `inputMode` state (mouse vs keyboard in Zustand) already exists. Enhance for LG Magic Remote:

- Pointer movement -> `inputMode: 'pointer'` -> show hover effects, hide focus rings, `pause()` spatial nav.
- Arrow key press -> `inputMode: 'keyboard'` -> show focus rings, hide cursor, `resume()` spatial nav.

This is documented in `infrastructure.md` (Spatial Navigation section). Carry over the existing implementation and wire it into the new `LayoutSelector` / `SpatialNavProvider`.

Added to Sprint 1.

---

#### H5: TanStack Query gcTime

Add explicit `gcTime` per device class in `queryConfig.ts`:

| Query Type | TV | Desktop | Mobile |
|-----------|-----|---------|--------|
| Catalog (categories, streams) | 60s | 5min (default) | 2min |
| Search results | 30s | 5min | 2min |
| User data (favorites, history) | 5min | 5min | 5min |

TV has shorter gcTime to limit memory pressure on constrained devices. User data keeps 5min on all devices since it is small.

Added to Buffer sprint.

---

#### H6: HLS Event Cleanup

In `VideoElement` component, the `useEffect` cleanup must:

1. Remove all HLS event listeners (`hls.off()` or remove individually).
2. Call `hls.destroy()` -- this detaches media, stops loading, and cleans up Web Workers.
3. Set HLS instance ref to `null`.

This prevents memory leaks from orphaned event handlers on TV WebViews where garbage collection is less aggressive.

Added to Sprint 4.

---

#### H7: Card Image Aspect Ratio

All card images use:
- `object-fit: cover` with `object-position: center top` (faces tend to be at top of movie posters).
- Fallback: gradient `bg-secondary` -> `bg-tertiary` when image fails to load.
- `onError` handler on `<img>` sets a state flag that swaps to the fallback gradient + content title text.

Added to Sprint 0 (card components) and Buffer sprint (polish).

---

#### H8: Font Loading

Add to `@font-face` declarations: `font-display: swap` (shows system font immediately, swaps when custom font loads -- prevents invisible text during load).

Preload 2 critical font weights in `index.html`:
```html
<link rel="preload" href="/fonts/Satoshi-Bold.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/GeneralSans-Regular.woff2" as="font" type="font/woff2" crossorigin>
```

Subset fonts to Latin if feasible (Devanagari not needed for this app).

Added to Sprint 0.

---

#### H9: Loading Priority

- Hero banner image: `loading="eager"` + `fetchpriority="high"`.
- First 4-6 visible cards per rail: `loading="eager"`.
- All other cards: `loading="lazy"`.

Implementation: `ContentRail` passes an `isFirstVisible` prop to the first N `FocusableCard` children. Cards use this to set `loading` and `fetchpriority` attributes on their `<img>` elements.

Added to Sprint 2.

---

#### H10: Toast Severity

Differentiate toast ARIA roles by severity:

- **Errors**: `role="alert"` + `aria-live="assertive"` (interrupts screen reader immediately).
- **Info/Success**: `role="status"` + `aria-live="polite"` (announced at next pause).

Update `toastStore` to include a `severity` field (`'error' | 'warning' | 'info' | 'success'`). The `Toast` component reads severity and sets the appropriate ARIA attributes.

Added to Sprint 0 (Toast primitive).

---

### Updated Compatibility Matrix

| Platform | Minimum Version | Chromium Base | Supported |
|----------|----------------|---------------|-----------|
| Fire TV Silk | Latest | ~Chrome 90+ | Yes |
| Samsung Tizen | 5.0 (2019+) | Chromium 69+ | Yes |
| Samsung Tizen | 3.0-4.0 (2015-2017) | Chromium 47-56 | No |
| LG webOS | 5.0 (2020+) | Chromium 79+ | Yes |
| LG webOS | 4.x (2018) | Chromium 53 | No |
| Chrome | 80+ | -- | Yes |
| Firefox | Latest | -- | Yes |
| Safari | 14+ | -- | Yes |
| Android WebView | Chrome 80+ | -- | Yes |

**Vite build target**: `es2019` / `chrome69`. Bundle size impact: ~2-5% increase.

---

### Sprint Summary (Post-Evaluation)

| Sprint | Name | Duration | Key Additions from Evaluation |
|--------|------|----------|------------------------------|
| 0 | Foundation | 3-5 days | Error boundaries (C4), localStorage migration (C6), Vite target lowered (C2/C10), font loading (H8), toast severity (H10), card fallbacks (H7) |
| 1 | Layouts + Navigation | 3-5 days | inputMode hybrid (H4), TV font class (C3) |
| 2 | Home + Rails | 3-5 days | Loading priority (H9), component tests |
| 3A | VOD + Series | 3-5 days | Component tests |
| 3B | Live + Search + Favorites | 3-5 days | Component tests |
| 4 | Player Rebuild | 5-7 days | State machine (C5), channel switching (C8/H1), sleep/wake (H2/H3), HLS cleanup (H6) |
| 5 | EPG + Live TV | 3-5 days | -- |
| 6 | Settings + Auth + Polish | 3-5 days | Service Worker (C1) |
| BUFFER | Bug Fixes + Overflow | 3-5 days | gcTime tuning (H5), card polish (H7) |
| 7 | Performance | 3-5 days | -- |
| 8 | Testing | 5-7 days | -- |
| 9 | Cross-Device Testing | 3-5 days | Tizen 5.0+/webOS 5.0+ minimum (C2/C10) |
| 10 | Merge + Deploy | 1-2 days | Rollback plan (C9) |
| **Total** | | **~45-62 days** | **~12-16 weeks at 50% allocation** |


---

## Appendix D: Agent Team and Worktree Enforcement (LOCKED)

This section is LOCKED. No deviation permitted. Every sprint MUST follow this workflow exactly.

### Agent Team Roster

| Agent | Role | Model | Isolation | Responsibility |
|-------|------|-------|-----------|----------------|
| architect | Lead Architect and Project Lead | Opus | Read-only | Reviews ALL agent output, enforces AC-01 to AC-12, validates patterns, sprint sign-off, resolves conflicts, ensures zero deviation from plan |
| alpha | Design System and Foundation Lead | Sonnet | worktree | Tokens, theme, layouts, routing, spatial nav bootstrap (Sprints 0-1) |
| bravo | Pages and Content Developer | Sonnet | worktree | Home, VOD, Series, Live, Search, Favorites, Auth, Settings, EPG (Sprints 2, 3A, 3B, 5, 6) |
| charlie | Player Architect | Sonnet | worktree | Single global player, state machine, HLS/mpegts, all controls, recovery (Sprint 4) |
| delta | Performance and Compatibility Engineer | Sonnet | worktree | Bundle optimization, memory profiling, cross-device testing (Sprints 7, 9) |
| echo | QA and Test Engineer | Sonnet | worktree | TDD test-first, component tests, E2E, accessibility, visual regression (Sprint 8, continuous) |
| foxtrot | Quality Reviewer | Sonnet | Read-only | Code review, security scan, go/no-go gate execution |

### Worktree Branch Mapping (Strict)

Every issue gets its own worktree branch. PRs created per issue. No direct commits to main.

| Issue | Branch | Agent |
|-------|--------|-------|
| 84 | feat/sv2-design-system | alpha |
| 85 | feat/sv2-app-shell | alpha |
| 86 | feat/sv2-back-nav | alpha |
| 87 | feat/sv2-home-page | bravo |
| 88 | feat/sv2-content-cards | bravo |
| 89 | feat/sv2-vod-pages | bravo |
| 90 | feat/sv2-series-pages | bravo |
| 91 | feat/sv2-live-page | bravo |
| 109 | feat/sv2-search-page | bravo |
| 110 | feat/sv2-favorites-page | bravo |
| 111 | feat/sv2-watch-history | bravo |
| 112-116 | feat/sv2-player | charlie |
| 117 | feat/sv2-epg | bravo |
| 118 | feat/sv2-auth | bravo |
| 119 | feat/sv2-settings-sw | bravo |
| 120 | feat/sv2-perf | delta |
| 121 | feat/sv2-tests | echo |
| 122 | feat/sv2-device-testing | delta+echo |
| 123 | N/A (merge to main) | architect+foxtrot |

### Sprint Execution Workflow (MANDATORY)

BEFORE SPRINT:
1. architect reviews sprint scope against THIS plan
2. architect writes architectural brief (key constraints, banned patterns)
3. echo writes FAILING tests first (TDD contract from issue)
4. Dev creates worktree: git worktree add path -b branch

DURING SPRINT:
5. Dev implements in worktree (isolation: worktree)
6. echo writes E2E tests in parallel on separate worktree
7. architect spot-checks mid-sprint (no drift from plan)
8. Dev runs npm run build (must be clean before proceeding)

AFTER SPRINT:
9. Dev pushes branch: git push origin branch
10. Dev creates PR: gh pr create
11. echo runs full test suite on PR branch
12. foxtrot runs code review + security scan
13. architect reviews ALL diffs for AC-01 to AC-12 compliance
14. GO/NO-GO GATE (see below)
15. On PASS: gh pr merge --squash --delete-branch
16. On FAIL: fix findings, re-run gate
17. Clean up worktree: git worktree remove path

### Go/No-Go Gate (Dual Sign-off Required)

| Gate | Owner | Blocker |
|------|-------|---------|
| G1: Architectural review AC-01 through AC-12 | architect | YES |
| G2: No deviation from plan | architect | YES |
| G3: TDD failing tests written BEFORE implementation | echo | YES |
| G4: All unit/component tests pass 100% green | echo | YES |
| G5: E2E critical paths pass | echo | YES |
| G6: axe-core 0 accessibility violations | echo | YES |
| G7: Code review no security issues | foxtrot | YES |
| G8: npm run build clean 0 errors | foxtrot | YES |
| G9: No transition-all no backdrop-filter no Framer Motion | foxtrot | YES |
| G10: No component exceeds 300 lines | foxtrot | YES |
| G11: PR references issue number and acceptance criteria | foxtrot | YES |

ALL 11 gates must PASS. A single FAIL blocks the merge. No exceptions.

### Architect Continuous Responsibilities

1. Plan adherence: every line of code traces to this plan or PRD
2. Constraint enforcement: AC-01 through AC-12 verified on every PR
3. Cross-agent coordination: interface contracts defined before implementation
4. Quality escalation: substandard work sent back with specific fixes
5. Scope guard: features not in PRD rejected, deferred to v2.1+
6. Sprint retrospective: document what went well/wrong after each merge

### Parallelization Map

Sprint 0-1: alpha (design+shell) and echo (test infra)
Sprint 2: bravo (home+cards) and echo (component test templates)
Sprint 3A: bravo (VOD+Series) and echo (home E2E)
Sprint 3B: bravo (Live+Search+Fav) and echo (VOD/Series E2E)
Sprint 4: charlie (player isolated) and echo (browse E2E)
Sprint 5: bravo (EPG+live) and echo (player E2E)
Sprint 6: bravo (auth+settings+SW) and echo (live TV E2E)
Sprint 7: delta (performance) and echo (auth/settings E2E)
Sprint 8: echo (full test suite) and delta (perf automation)
Sprint 9: delta+echo (cross-device HITL)
Sprint 10: architect+foxtrot (final gate HITL)

### Issues Reference

| Issue | Title | Sprint |
|-------|-------|--------|
| 84 | Design system tokens + Tailwind theme + base components | 0 |
| 85 | App shell: device detection, layouts, TanStack Router, spatial nav | 1 |
| 86 | Back navigation: unified handler Fire TV/Samsung/LG | 1 |
| 87 | Home page: hero banner + content rails + skeletons | 2 |
| 88 | ContentCard components: Poster, Landscape, Channel, Episode | 2 |
| 89 | VOD pages: category browser + movie grid + MovieDetail | 3A |
| 90 | Series pages: SeriesDetail decomposition + season nav | 3A |
| 91 | Live TV page: category grid + channel cards | 3B |
| 109 | Search page: universal search + filters | 3B |
| 110 | Favorites page: grid + type filter + optimistic toggle | 3B |
| 111 | Watch history: continue watching + history management | 3B |
| 112 | Player shell: single global instance + state machine | 4 |
| 113 | Player controls: desktop + TV + mobile variants | 4 |
| 114 | Player features: resume, auto-next, selectors | 4 |
| 115 | Player TV: hold-to-seek, long-press, channel switching | 4 |
| 116 | Player recovery: error UI, sleep/wake, resilience | 4 |
| 117 | EPG timeline + live TV enhancements | 5 |
| 118 | Auth pages: login redesign + auto-login + CSRF | 6 |
| 119 | Settings + service worker + toast + a11y polish | 6 |
| 120 | Performance optimization: bundle, memory, FPS | 7 |
| 121 | Test suite: component + integration + E2E | 8 |
| 122 | Cross-device testing: all platforms | 9 |
| 123 | Final review + merge + deploy | 10 |
