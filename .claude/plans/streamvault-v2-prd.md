# StreamVault Frontend v2.0 -- Product Requirements Document

> Version: 1.0
> Author: Srinivas Kotha + Claude Code
> Last Updated: 2026-03-24
> Status: Draft -- Pending Evaluation

---

## 1. Overview

### Product

StreamVault is a self-hosted IPTV streaming frontend that provides a Netflix-quality experience for accessing live TV, movies, and series content from Xtream Codes providers. The application runs as a Progressive Web App (PWA) and can be packaged as a TWA (Trusted Web Activity) APK for Fire TV sideloading.

### Version 2.0 Objective

Complete redesign of the StreamVault frontend to deliver:
- A premium visual identity using the Srinibytes "Ambient Depth" design system
- True multi-device support (TV, mobile, tablet, desktop) from a single codebase
- Resolution of all critical architectural issues from v1.x
- WCAG 2.1 AA accessibility compliance
- Comprehensive test coverage (component + E2E)
- Backward compatibility to Chrome 80 (Fire TV Silk baseline)

### Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| SC-01: All critical bugs resolved | 0 critical issues | Audit re-run |
| SC-02: Multi-device support | 6 device classes working | Manual test matrix |
| SC-03: Performance (TV) | FCP <2.5s, TTI <4s | Lighthouse |
| SC-04: Performance (Desktop) | FCP <1.5s, TTI <3s | Lighthouse |
| SC-05: Bundle size | <400KB gzipped total | Build analysis |
| SC-06: Accessibility | WCAG 2.1 AA pass | axe-core audit |
| SC-07: Test coverage | 80%+ hooks/utils, E2E critical paths | Vitest + Playwright |
| SC-08: Component size | No component >300 lines | Static analysis |
| SC-09: Memory (TV) | <200MB during playback | Chrome DevTools |
| SC-10: Frame rate (TV) | 30fps during navigation | Chrome DevTools |

---

## 2. Functional Requirements

### FR-AUTH: Authentication

| ID | Requirement | Priority |
|----|------------|----------|
| FR-AUTH-01 | Auto-login from trusted IP addresses (LAN mode) | P0 |
| FR-AUTH-02 | Manual login with username/password form | P0 |
| FR-AUTH-03 | JWT access token auto-refresh (15min expiry) | P0 |
| FR-AUTH-04 | Logout with token revocation | P1 |
| FR-AUTH-05 | Login page with Srinibytes brand styling (gradient, ambient glow) | P1 |
| FR-AUTH-06 | Remember last server URL | P2 |
| FR-AUTH-07 | Auth status check via dedicated method (not favorites probe) | P1 |

### FR-HOME: Home Page

| ID | Requirement | Priority |
|----|------------|----------|
| FR-HOME-01 | Hero banner featuring top content with gradient overlay and CTA | P0 |
| FR-HOME-02 | Continue Watching rail with landscape cards and progress bars | P0 |
| FR-HOME-03 | Favorites rail showing user's watchlist | P0 |
| FR-HOME-04 | Featured Live TV rail from /live/featured endpoint | P1 |
| FR-HOME-05 | Category rails for VOD, Series, and Live content | P0 |
| FR-HOME-06 | Recently Added rail with NEW badge | P1 |
| FR-HOME-07 | Skeleton screens during initial data load | P0 |
| FR-HOME-08 | Pull-to-refresh on mobile | P2 |
| FR-HOME-09 | Horizontal rail scrolling with snap points (mobile/desktop) | P0 |
| FR-HOME-10 | D-pad navigation through rails (TV) | P0 |

### FR-LIVE: Live TV

| ID | Requirement | Priority |
|----|------------|----------|
| FR-LIVE-01 | Category browser with filterable channel list | P0 |
| FR-LIVE-02 | Channel grid with poster/logo, name, and current program | P0 |
| FR-LIVE-03 | EPG timeline view (horizontal, 2-hour window, now marker) | P1 |
| FR-LIVE-04 | Channel switching via up/down arrows during playback | P0 |
| FR-LIVE-05 | Channel switching overlay showing next/prev channel info | P1 |
| FR-LIVE-06 | Live indicator (pulsing red dot) on live channels | P1 |
| FR-LIVE-07 | Catch-up/archive playback for channels with TV archive | P2 |
| FR-LIVE-08 | Quick channel switch via number keys (TV remote) | P2 |
| FR-LIVE-09 | Featured channels section at top of live page | P1 |

### FR-VOD: Movies (Video on Demand)

| ID | Requirement | Priority |
|----|------------|----------|
| FR-VOD-01 | Category browser with movie grid | P0 |
| FR-VOD-02 | Movie grid with poster cards (2:3 aspect ratio) | P0 |
| FR-VOD-03 | Sorting: alphabetical, rating, date added, year | P1 |
| FR-VOD-04 | Movie detail page: poster, backdrop, metadata, cast, plot, rating | P0 |
| FR-VOD-05 | Play button with resume support (shows "Resume from XX:XX") | P0 |
| FR-VOD-06 | Add/remove favorite button on detail page | P0 |
| FR-VOD-07 | Virtualized grid for categories with 100+ items | P1 |
| FR-VOD-08 | Language filter on browse page | P2 |

### FR-SERIES: Series

| ID | Requirement | Priority |
|----|------------|----------|
| FR-SERIES-01 | Category browser with series grid | P0 |
| FR-SERIES-02 | Series grid with poster cards | P0 |
| FR-SERIES-03 | Series detail page: cover, metadata, seasons, episodes | P0 |
| FR-SERIES-04 | Season navigation tabs | P0 |
| FR-SERIES-05 | Episode list with thumbnails, duration, progress, description | P0 |
| FR-SERIES-06 | Episode search within a series | P1 |
| FR-SERIES-07 | Episode sort (ascending/descending) | P1 |
| FR-SERIES-08 | Play episode with resume support | P0 |
| FR-SERIES-09 | Auto-play next episode on completion | P0 |
| FR-SERIES-10 | Episode pagination (50 per page, load more) | P1 |
| FR-SERIES-11 | Add/remove series to favorites | P0 |

### FR-SEARCH: Search

| ID | Requirement | Priority |
|----|------------|----------|
| FR-SEARCH-01 | Universal search across live, VOD, and series | P0 |
| FR-SEARCH-02 | Real-time results as user types (debounced 300ms) | P0 |
| FR-SEARCH-03 | Results grouped by content type (tabs or sections) | P0 |
| FR-SEARCH-04 | Recent search history (local storage) | P1 |
| FR-SEARCH-05 | Language/type filter pills | P2 |
| FR-SEARCH-06 | Keyboard-accessible search input (auto-focus on TV) | P0 |
| FR-SEARCH-07 | Empty state with suggestions | P2 |
| FR-SEARCH-08 | Search via `/` keyboard shortcut (desktop) | P1 |

### FR-PLAYER: Player

| ID | Requirement | Priority |
|----|------------|----------|
| FR-PLAYER-01 | Single unified player instance (no dual-player conflict) | P0 |
| FR-PLAYER-02 | HLS adaptive streaming with quality auto-selection | P0 |
| FR-PLAYER-03 | Manual quality selector (list all HLS levels) | P0 |
| FR-PLAYER-04 | Subtitle track selection | P1 |
| FR-PLAYER-05 | Audio track selection | P1 |
| FR-PLAYER-06 | Progress bar with current time / duration | P0 |
| FR-PLAYER-07 | Seek via progress bar drag (desktop/mobile) | P0 |
| FR-PLAYER-08 | Seek via arrow keys (TV: hold-to-accelerate 10s/30s/60s/120s) | P0 |
| FR-PLAYER-09 | Volume control (slider on desktop, arrows on TV) | P0 |
| FR-PLAYER-10 | Mute/unmute toggle | P0 |
| FR-PLAYER-11 | Fullscreen toggle (desktop/mobile via Fullscreen API) | P1 |
| FR-PLAYER-12 | Picture-in-Picture (desktop and mobile, where supported) | P2 |
| FR-PLAYER-13 | Buffering indicator with spinner | P0 |
| FR-PLAYER-14 | Error recovery UI with retry button and error message | P0 |
| FR-PLAYER-15 | Resume playback from last saved position | P0 |
| FR-PLAYER-16 | Auto-next episode with countdown (5s timer, cancelable) | P1 |
| FR-PLAYER-17 | Channel up/down during live playback | P0 |
| FR-PLAYER-18 | Controls auto-hide after 4 seconds of inactivity | P0 |
| FR-PLAYER-19 | Keyboard shortcuts: Space (play/pause), M (mute), F (fullscreen) | P1 |
| FR-PLAYER-20 | Touch controls: tap to show/hide, double-tap sides for +/-10s | P1 |
| FR-PLAYER-21 | Long-press fast-forward/rewind on TV remote | P0 |
| FR-PLAYER-22 | MPEG-TS fallback for live streams without HLS | P0 |
| FR-PLAYER-23 | Watch progress saved every 10 seconds | P0 |
| FR-PLAYER-24 | "Go to Live" button when behind live edge | P1 |

### FR-FAV: Favorites / Watchlist

| ID | Requirement | Priority |
|----|------------|----------|
| FR-FAV-01 | Add/remove any content to favorites | P0 |
| FR-FAV-02 | Favorites page with grid display | P0 |
| FR-FAV-03 | Filter by content type (all, live, movies, series) | P1 |
| FR-FAV-04 | Sort by date added, name | P1 |
| FR-FAV-05 | Favorite button accessible on cards and detail pages | P0 |
| FR-FAV-06 | Optimistic UI update (instant add/remove, revert on error) | P1 |

### FR-HISTORY: Watch History

| ID | Requirement | Priority |
|----|------------|----------|
| FR-HISTORY-01 | Continue Watching section with progress bars | P0 |
| FR-HISTORY-02 | Watch history page with full list | P1 |
| FR-HISTORY-03 | Remove individual history items | P1 |
| FR-HISTORY-04 | Clear all history | P2 |
| FR-HISTORY-05 | Progress persisted via PUT /history/:contentId every 10s | P0 |

### FR-SETTINGS: Settings

| ID | Requirement | Priority |
|----|------------|----------|
| FR-SETTINGS-01 | Server URL configuration | P0 |
| FR-SETTINGS-02 | Default video quality preference (auto/high/medium/low) | P1 |
| FR-SETTINGS-03 | Default subtitle language | P2 |
| FR-SETTINGS-04 | Auto-play next episode toggle | P1 |
| FR-SETTINGS-05 | App version and build info | P2 |
| FR-SETTINGS-06 | Logout button | P0 |
| FR-SETTINGS-07 | TV mode toggle (for testing on desktop) | P2 |

### FR-NAV: Navigation

| ID | Requirement | Priority |
|----|------------|----------|
| FR-NAV-01 | Top navigation bar (desktop): Logo, Home, Live, Movies, Series, Search, Profile | P0 |
| FR-NAV-02 | Bottom tab bar (mobile): Home, Live, Search, Favorites, Settings | P0 |
| FR-NAV-03 | Minimal top nav (TV): Logo, content tabs, profile (D-pad navigable) | P0 |
| FR-NAV-04 | Back navigation via browser history (all devices) | P0 |
| FR-NAV-05 | TV remote back button (Fire TV, Samsung, LG) unified handler | P0 |
| FR-NAV-06 | Skip-to-content link for keyboard/screen reader users | P0 |
| FR-NAV-07 | Active route indicator on navigation items | P1 |

---

## 3. Non-Functional Requirements

### NFR-PERF: Performance

| ID | Requirement | Target |
|----|------------|--------|
| NFR-PERF-01 | First Contentful Paint (TV) | <2.5 seconds |
| NFR-PERF-02 | First Contentful Paint (Desktop) | <1.5 seconds |
| NFR-PERF-03 | First Contentful Paint (Mobile) | <2.0 seconds |
| NFR-PERF-04 | Time to Interactive (TV) | <4.0 seconds |
| NFR-PERF-05 | Time to Interactive (Desktop) | <3.0 seconds |
| NFR-PERF-06 | Navigation frame rate (TV) | 30fps minimum |
| NFR-PERF-07 | Navigation frame rate (Desktop/Mobile) | 60fps |
| NFR-PERF-08 | Total JS bundle (gzipped) | <400KB |
| NFR-PERF-09 | Memory usage during playback (TV) | <200MB |
| NFR-PERF-10 | Memory usage during playback (Mobile) | <250MB |
| NFR-PERF-11 | Route lazy loading | All routes code-split |
| NFR-PERF-12 | Image lazy loading | Native loading="lazy" on all images |
| NFR-PERF-13 | List virtualization | Grids with >20 items use TanStack Virtual |

### NFR-A11Y: Accessibility

| ID | Requirement | Standard |
|----|------------|----------|
| NFR-A11Y-01 | All interactive elements have ARIA roles | WCAG 4.1.2 |
| NFR-A11Y-02 | All interactive elements have aria-label or aria-labelledby | WCAG 4.1.2 |
| NFR-A11Y-03 | Skip-to-content link as first focusable element | WCAG 2.4.1 |
| NFR-A11Y-04 | Visible focus indicators on all devices | WCAG 2.4.7 |
| NFR-A11Y-05 | Color contrast ratio >= 4.5:1 (normal text) | WCAG 1.4.3 |
| NFR-A11Y-06 | Screen reader announcements for loading states | WCAG 4.1.3 |
| NFR-A11Y-07 | Screen reader announcements for route changes | WCAG 4.1.3 |
| NFR-A11Y-08 | Reduced motion support (prefers-reduced-motion) | WCAG 2.3.3 |
| NFR-A11Y-09 | Full keyboard navigability (no mouse required) | WCAG 2.1.1 |
| NFR-A11Y-10 | Toast/alert notifications announced to screen readers | WCAG 4.1.3 |
| NFR-A11Y-11 | Player controls with proper ARIA (slider, button roles) | WCAG 4.1.2 |
| NFR-A11Y-12 | Form errors identified and described | WCAG 3.3.1 |

### NFR-COMPAT: Compatibility

| ID | Requirement | Details |
|----|------------|---------|
| NFR-COMPAT-01 | Chrome 80+ | Vite build target, Fire TV Silk baseline |
| NFR-COMPAT-02 | Samsung Tizen TV | WebView, back button keyCode 10009 |
| NFR-COMPAT-03 | LG webOS TV | WebView, back button keyCode 461 |
| NFR-COMPAT-04 | Firefox (latest) | Desktop support |
| NFR-COMPAT-05 | Safari 14+ | macOS/iOS, native HLS support |
| NFR-COMPAT-06 | Android Chrome 80+ | Old phone support, 2GB RAM |
| NFR-COMPAT-07 | Fire TV TWA/APK | PWABuilder-generated, V1 JAR signed |
| NFR-COMPAT-08 | No polyfills required | Chrome 80 covers ES2020, Grid, IntersectionObserver |
| NFR-COMPAT-09 | Progressive enhancement | Core features work without container queries, PiP, etc. |

### NFR-NET: Network Resilience

| ID | Requirement | Details |
|----|------------|---------|
| NFR-NET-01 | Skeleton screens during all data loading | Every page/rail has skeleton |
| NFR-NET-02 | Retry with exponential backoff | 1s, 2s, 4s up to 30s max, 3 retries |
| NFR-NET-03 | Buffering indicator on player | Spinner overlay with "Buffering" text |
| NFR-NET-04 | Offline detection and banner | "You are offline" banner when navigator.onLine false |
| NFR-NET-05 | Adaptive quality on slow networks | Default to lowest HLS level on 2G/slow-2g |
| NFR-NET-06 | CSRF token auto-refresh on 403 | Clear + re-fetch + retry on CSRF failure |
| NFR-NET-07 | Graceful degradation | App remains navigable when individual API calls fail |

### NFR-SEC: Security

| ID | Requirement | Details |
|----|------------|---------|
| NFR-SEC-01 | CSRF protection on all mutations | Double-submit cookie pattern |
| NFR-SEC-02 | JWT in httpOnly cookies only | No localStorage tokens |
| NFR-SEC-03 | No credentials visible in UI | Stream URLs proxied through backend |
| NFR-SEC-04 | CSP headers via nginx | script-src, style-src, img-src restricted |
| NFR-SEC-05 | No hardcoded secrets in source | All credentials via environment variables |

---

## 4. User Stories

### US-001: First-Time Login
**As a** TV Viewer, **I want to** see a branded login page when I first open the app **so that** I can enter my server credentials.
**Acceptance Criteria:**
- [ ] Login page displays Srinibytes brand (gradient background, ambient glow)
- [ ] Username and password fields are D-pad navigable
- [ ] Submit button has visible focus ring
- [ ] Error message shown for invalid credentials
- [ ] Successful login redirects to home page
**Device:** All | **Priority:** P0 | **Sprint:** 6

### US-002: Auto-Login on Trusted Network
**As a** TV Viewer, **I want to** automatically log in when on my home network **so that** I don't need to enter credentials every time.
**Acceptance Criteria:**
- [ ] App calls /auth/auto-login on launch
- [ ] If trusted IP matches, user is logged in without interaction
- [ ] Loading spinner shown during auto-login attempt
- [ ] Falls back to login page if auto-login fails
**Device:** All | **Priority:** P0 | **Sprint:** 6

### US-003: Browse Home Page
**As a** TV Viewer, **I want to** see a home page with content rails **so that** I can quickly find something to watch.
**Acceptance Criteria:**
- [ ] Hero banner with featured content auto-rotates
- [ ] Continue Watching rail shows partially watched content with progress bars
- [ ] At least 3 category rails visible on initial load
- [ ] Skeleton screens shown while data loads
- [ ] D-pad Up/Down navigates between rails
- [ ] D-pad Left/Right scrolls within a rail
**Device:** All (D-pad specific to TV) | **Priority:** P0 | **Sprint:** 2

### US-004: Browse Home on Mobile
**As a** Mobile Viewer, **I want to** see the home page optimized for my phone screen **so that** content is readable and touch-friendly.
**Acceptance Criteria:**
- [ ] Bottom tab bar for navigation (Home, Live, Search, Favorites, Settings)
- [ ] Rails show 2-3 cards per row
- [ ] Cards have touch-friendly tap targets (min 44x44px)
- [ ] Horizontal swipe scrolls through rails with snap points
- [ ] Pull-to-refresh reloads content
**Device:** Mobile | **Priority:** P0 | **Sprint:** 2

### US-005: Play a Movie
**As a** TV Viewer, **I want to** play a movie from the detail page **so that** I can watch it.
**Acceptance Criteria:**
- [ ] Play button is prominently displayed and auto-focused on TV
- [ ] Player opens in fullscreen overlay
- [ ] Video starts playing immediately (or shows buffering indicator)
- [ ] Back button closes player and returns to detail page
- [ ] Only ONE player instance exists (no dual-player conflict)
**Device:** All | **Priority:** P0 | **Sprint:** 4

### US-006: Resume a Movie
**As a** Desktop Viewer, **I want to** resume a movie from where I left off **so that** I don't have to find my place again.
**Acceptance Criteria:**
- [ ] Detail page shows "Resume from XX:XX" if watch history exists
- [ ] Player starts from saved position
- [ ] Continue Watching rail on home page shows the movie with progress bar
- [ ] Progress saved automatically every 10 seconds
**Device:** All | **Priority:** P0 | **Sprint:** 4

### US-007: Binge-Watch a Series
**As a** TV Viewer, **I want to** automatically play the next episode **so that** I can binge-watch without touching the remote.
**Acceptance Criteria:**
- [ ] When episode ends, 5-second countdown appears with "Next Episode" info
- [ ] Auto-plays next episode if user doesn't cancel
- [ ] Cancel button on countdown overlay
- [ ] Correctly handles season boundaries (last ep of S1 -> first ep of S2)
- [ ] Progress saved for completed episode before advancing
**Device:** All | **Priority:** P1 | **Sprint:** 4

### US-008: Switch Live TV Channels
**As a** TV Viewer, **I want to** switch channels with up/down arrows during live playback **so that** I can channel surf.
**Acceptance Criteria:**
- [ ] Up arrow loads next channel in category
- [ ] Down arrow loads previous channel in category
- [ ] Channel info overlay appears for 3 seconds showing channel name and current program
- [ ] Transition is smooth (no full page reload)
- [ ] Back button exits player (does not go to previous channel)
**Device:** TV | **Priority:** P0 | **Sprint:** 5

### US-009: Search for Content
**As a** Mobile Viewer, **I want to** search for a movie or show by name **so that** I can find specific content quickly.
**Acceptance Criteria:**
- [ ] Search input auto-focuses on page entry
- [ ] Results appear as user types (300ms debounce)
- [ ] Results grouped by type: Live, Movies, Series
- [ ] Tapping a result navigates to its detail page
- [ ] "No results" message for unmatched queries
- [ ] Recent searches shown when input is empty
**Device:** All | **Priority:** P0 | **Sprint:** 3

### US-010: Manage Favorites
**As a** Desktop Viewer, **I want to** add movies to my watchlist **so that** I can easily find them later.
**Acceptance Criteria:**
- [ ] Heart/bookmark icon on every content card
- [ ] Clicking toggles favorite status with optimistic UI update
- [ ] Favorites page shows all saved items in a grid
- [ ] Can filter favorites by type (all, live, movies, series)
- [ ] Removing from favorites updates immediately
**Device:** All | **Priority:** P0 | **Sprint:** 3

### US-011: Player Quality Selection
**As a** TV Viewer, **I want to** change video quality **so that** I can choose between smooth playback and higher resolution.
**Acceptance Criteria:**
- [ ] Quality selector shows all available HLS levels (e.g., 360p, 480p, 720p, 1080p)
- [ ] "Auto" option (default) lets HLS.js adapt to bandwidth
- [ ] Switching quality does not interrupt playback (nextLevel, not currentLevel)
- [ ] Current quality level is highlighted
- [ ] D-pad navigable on TV
**Device:** All | **Priority:** P0 | **Sprint:** 4

### US-012: Player Error Recovery
**As a** TV Viewer, **I want to** see an error message and retry button when a stream fails **so that** I can try again without navigating away.
**Acceptance Criteria:**
- [ ] Error overlay shows human-readable message (not technical error)
- [ ] "Retry" button attempts to reload the stream
- [ ] "Go Back" button closes the player
- [ ] Retry button is auto-focused on TV
- [ ] Error is announced to screen readers
**Device:** All | **Priority:** P0 | **Sprint:** 4

### US-013: D-pad Navigation on TV
**As a** TV Viewer, **I want to** navigate the entire app with my remote's directional buttons **so that** I never need a mouse or keyboard.
**Acceptance Criteria:**
- [ ] Every interactive element is reachable via D-pad
- [ ] Focus ring clearly indicates the focused element (teal ring + scale)
- [ ] Focus is remembered when navigating back to a page (saveLastFocusedChild)
- [ ] No focus traps (can always navigate away from any section)
- [ ] Enter/Select activates the focused element
- [ ] Back button follows priority: close player > close modal > navigate back
**Device:** TV | **Priority:** P0 | **Sprint:** 1

### US-014: Desktop Keyboard Navigation
**As a** Desktop Viewer, **I want to** navigate the app using my keyboard **so that** I don't need a mouse.
**Acceptance Criteria:**
- [ ] Tab key moves through interactive elements in logical order
- [ ] Focus rings visible on focused elements
- [ ] `/` opens search, `Esc` closes modals/player
- [ ] Arrow keys work in player (seek, volume)
- [ ] Enter activates focused elements
- [ ] Skip-to-content link available
**Device:** Desktop | **Priority:** P1 | **Sprint:** 1

### US-015: Mobile Touch Gestures
**As a** Mobile Viewer, **I want to** use touch gestures in the player **so that** I can control playback naturally.
**Acceptance Criteria:**
- [ ] Tap center to show/hide controls
- [ ] Double-tap left side for -10s, double-tap right side for +10s
- [ ] Swipe progress bar to seek
- [ ] Controls auto-hide after 4 seconds
- [ ] Pinch (optional) to change aspect ratio
**Device:** Mobile/Tablet | **Priority:** P1 | **Sprint:** 4

### US-016: View EPG Guide
**As a** TV Viewer, **I want to** see a program guide **so that** I know what's on different channels.
**Acceptance Criteria:**
- [ ] Timeline view showing 2-hour window
- [ ] Current time marker (vertical line)
- [ ] Channel list on left, programs as horizontal blocks
- [ ] Selecting a program shows description popup
- [ ] D-pad navigable (left/right scrolls time, up/down changes channel)
- [ ] "Now" button to jump to current time
**Device:** All | **Priority:** P1 | **Sprint:** 5

### US-017: Slow Network Experience
**As a** Mobile Viewer on a slow connection, **I want to** still be able to browse content **so that** the app doesn't feel broken.
**Acceptance Criteria:**
- [ ] Skeleton screens shown during data loading
- [ ] Images load progressively (placeholder visible before image)
- [ ] Retry button shown if a request fails
- [ ] "Connection lost" banner when offline
- [ ] Player auto-selects lowest quality on slow network
- [ ] App remains navigable even if some API calls fail
**Device:** All | **Priority:** P0 | **Sprint:** 6

### US-018: Screen Reader Browsing
**As a** visually impaired user, **I want to** browse content using a screen reader **so that** I can discover and play shows.
**Acceptance Criteria:**
- [ ] All cards announce: title, year, rating, genre
- [ ] Navigation landmarks: nav, main, section with headings
- [ ] Loading states announced via aria-live region
- [ ] Route changes announced
- [ ] Player controls have descriptive labels
- [ ] Progress bar announces current time on change
**Device:** Desktop (with screen reader) | **Priority:** P1 | **Sprint:** 6

### US-019: Browse Series Detail
**As a** TV Viewer, **I want to** browse seasons and episodes of a series **so that** I can find the episode I want.
**Acceptance Criteria:**
- [ ] Season tabs are D-pad navigable (left/right)
- [ ] Episode list shows thumbnails, titles, duration, and progress
- [ ] Selecting an episode starts playback
- [ ] Can search episodes by name within the series
- [ ] Load more button for series with many episodes (>50)
**Device:** All | **Priority:** P0 | **Sprint:** 3

### US-020: Settings Configuration
**As an** Admin, **I want to** configure server URL and player preferences **so that** the app connects to my IPTV provider.
**Acceptance Criteria:**
- [ ] Server URL input with validation
- [ ] Default quality preference (auto/high/medium/low)
- [ ] Auto-play next episode toggle
- [ ] Logout button
- [ ] App version displayed
- [ ] All settings persist across sessions
**Device:** All | **Priority:** P1 | **Sprint:** 6

### US-021: Player Subtitles
**As a** Desktop Viewer, **I want to** enable subtitles **so that** I can follow content in different languages.
**Acceptance Criteria:**
- [ ] Subtitle selector shows all available tracks
- [ ] "Off" option to disable subtitles
- [ ] Selected track renders on video overlay
- [ ] Selection persists during session
**Device:** All | **Priority:** P1 | **Sprint:** 4

### US-022: Fire TV Back Button
**As a** TV Viewer, **I want** the back button on my remote to behave predictably **so that** I can navigate without confusion.
**Acceptance Criteria:**
- [ ] During playback: closes player
- [ ] On detail page: goes back to browse
- [ ] On home page: prompts to exit or does nothing (no accidental app exit)
- [ ] Never exits the TWA app unexpectedly
- [ ] Works on Fire TV (keyCode 4), Samsung (10009), LG (461)
**Device:** TV | **Priority:** P0 | **Sprint:** 1

### US-023: Buffering During Playback
**As a** TV Viewer, **I want to** see a buffering indicator when video is loading **so that** I know the app hasn't frozen.
**Acceptance Criteria:**
- [ ] Spinner overlay appears when HLS.js reports buffering
- [ ] Spinner disappears when playback resumes
- [ ] "Buffering" text announced for screen readers
- [ ] No UI freezing during buffering (controls still responsive)
**Device:** All | **Priority:** P0 | **Sprint:** 4

### US-024: Card Hover Expansion (Desktop)
**As a** Desktop Viewer, **I want to** see more details when I hover over a card **so that** I can decide whether to watch.
**Acceptance Criteria:**
- [ ] Card scales up on hover (1.03x)
- [ ] Shows title, year, rating below card
- [ ] Hover effect only on devices with pointer (not TV/touch)
- [ ] Smooth CSS transition (200ms ease-out)
- [ ] No hover effects on TV (checked via @media (hover: hover))
**Device:** Desktop | **Priority:** P1 | **Sprint:** 2

### US-025: Live TV on Mobile
**As a** Mobile Viewer, **I want to** watch live TV on my phone **so that** I can watch content on the go.
**Acceptance Criteria:**
- [ ] Channel list is touch-friendly with adequate tap targets
- [ ] Tapping a channel opens player
- [ ] Player uses mobile touch controls
- [ ] Landscape orientation enters fullscreen automatically
- [ ] Back gesture (swipe or button) closes player
**Device:** Mobile | **Priority:** P0 | **Sprint:** 5

### US-026: Reduced Motion
**As a** user with motion sensitivity, **I want** animations to be minimal **so that** the app doesn't trigger discomfort.
**Acceptance Criteria:**
- [ ] App detects prefers-reduced-motion media query
- [ ] All transitions set to 0ms duration
- [ ] No auto-playing hero banner animations
- [ ] Skeleton pulse animation disabled
- [ ] Player still functions normally (seek, controls)
**Device:** All | **Priority:** P1 | **Sprint:** 6

### US-027: Favorites Quick Toggle
**As a** TV Viewer, **I want to** quickly add/remove favorites without leaving the current page **so that** managing my watchlist is effortless.
**Acceptance Criteria:**
- [ ] Favorite button on content cards (heart/star icon)
- [ ] Toggle is instant (optimistic update)
- [ ] Reverts if server request fails (with toast notification)
- [ ] Favorite state visible on card (filled vs outline icon)
- [ ] Works with D-pad (focus + Enter)
**Device:** All | **Priority:** P1 | **Sprint:** 3

### US-028: Old Android Phone Support
**As a** Mobile Viewer on an old phone (2GB RAM, Chrome 80), **I want** the app to load and work smoothly **so that** I can watch content on my budget device.
**Acceptance Criteria:**
- [ ] App loads within 3.5 seconds on Chrome 80
- [ ] Memory stays under 250MB during playback
- [ ] No crashes or freezes during 30 minutes of browsing
- [ ] HLS back buffer limited to 30 seconds
- [ ] Images load lazily (no bandwidth waste)
- [ ] No JavaScript features newer than ES2020 used without transpilation
**Device:** Mobile (low-end) | **Priority:** P0 | **Sprint:** 9

### US-029: Samsung TV Navigation
**As a** TV Viewer using Samsung TV, **I want** the app to work with my Samsung remote **so that** I can navigate and watch content.
**Acceptance Criteria:**
- [ ] D-pad arrows navigate through content
- [ ] Enter/Select activates focused element
- [ ] Back button (keyCode 10009) follows standard back behavior
- [ ] Play/Pause remote button controls player
- [ ] No WebView-specific rendering issues
**Device:** Samsung TV | **Priority:** P1 | **Sprint:** 9

### US-030: Watch History Management
**As a** Desktop Viewer, **I want to** view and manage my watch history **so that** I can track what I've watched.
**Acceptance Criteria:**
- [ ] History page shows all watched content with timestamps
- [ ] Each item shows progress percentage
- [ ] Can remove individual items (with confirmation)
- [ ] Clicking an item resumes from saved position
- [ ] Sorted by most recently watched
**Device:** All | **Priority:** P1 | **Sprint:** 3

---

## 5. Design Specifications

### Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| bg-primary | #0a0a0f | Page background |
| bg-secondary | #141418 | Card/surface background |
| bg-tertiary | #1a1a22 | Elevated surfaces, modals |
| bg-overlay | rgba(10,10,15,0.85) | Player overlay, drawers |
| bg-hover | #1e1e28 | Interactive hover state |
| accent-teal | #14b8a6 | Primary actions, focus rings, CTAs |
| accent-indigo | #6366f1 | Secondary accent, gradients |
| accent-teal-dim | #0d9488 | Pressed/active state |
| accent-indigo-dim | #4f46e5 | Pressed/active state |
| text-primary | #f5f5f5 | Titles, active labels |
| text-secondary | #94a3b8 | Descriptions, metadata |
| text-tertiary | #64748b | Timestamps, hints, disabled |
| text-inverse | #0a0a0f | Text on accent backgrounds |
| success | #22c55e | Success indicators |
| warning | #f59e0b | Warning states |
| error | #ef4444 | Error states, destructive actions |
| live | #ef4444 | Live indicator dot |
| gradient-brand | linear-gradient(135deg, #14b8a6, #6366f1) | Brand gradient |
| gradient-hero | linear-gradient(to top, #0a0a0f 0%, transparent 60%) | Hero overlay |

### Typography Scale

| Token | Size | Weight | Font | Usage |
|-------|------|--------|------|-------|
| heading-xl | 2.5rem / 40px | 700 | Satoshi | Hero title (TV) |
| heading-lg | 2rem / 32px | 700 | Satoshi | Hero title (desktop) |
| heading-md | 1.5rem / 24px | 600 | Satoshi | Page titles |
| heading-sm | 1.25rem / 20px | 600 | Satoshi | Section headers |
| body-lg | 1.125rem / 18px | 400 | General Sans | Large body text |
| body-md | 1rem / 16px | 400 | General Sans | Default body |
| body-sm | 0.875rem / 14px | 400 | General Sans | Card titles, metadata |
| caption | 0.75rem / 12px | 400 | General Sans | Timestamps, badges |

TV multiplier: All sizes * 1.25 via root font-size: 20px.

### Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| space-1 | 4px | Icon padding, tight gaps |
| space-2 | 8px | Card internal padding |
| space-3 | 12px | Card gap (mobile) |
| space-4 | 16px | Card gap (desktop), section margin |
| space-6 | 24px | Card gap (TV), section padding |
| space-8 | 32px | Page horizontal padding (desktop) |
| space-10 | 40px | TV safe zone padding |
| space-12 | 48px | Section vertical spacing |
| space-16 | 64px | Hero bottom spacing |

### Card Variants

| Variant | Aspect | Border Radius | Background | Focus Effect |
|---------|--------|---------------|------------|--------------|
| Poster | 2:3 | 8px | bg-secondary | scale(1.08) + teal ring (TV), scale(1.03) + teal ring (desktop) |
| Landscape | 16:9 | 8px | bg-secondary | Same as poster |
| Channel | 16:9 | 8px | bg-secondary | Same + live indicator pulse |
| Episode | 16:9 + text | 8px | bg-secondary | Border highlight only (no scale) |
| Hero | fluid | 0px (bleeds) | Gradient overlay on image | CTA button focus |

### Component Specifications

**Button Variants:**
| Variant | Background | Text | Border | Hover | Focus |
|---------|-----------|------|--------|-------|-------|
| Primary | accent-teal | text-inverse | none | accent-teal-dim | teal ring |
| Secondary | transparent | accent-teal | 1px accent-teal | bg-hover | teal ring |
| Ghost | transparent | text-primary | none | bg-hover | teal ring |
| Icon | transparent | text-secondary | none | bg-hover | teal ring |
| Danger | error | text-primary | none | error/80 | error ring |

Minimum touch target: 44x44px on mobile/TV.

**Badge Variants:**
| Variant | Background | Text | Usage |
|---------|-----------|------|-------|
| NEW | accent-teal | text-inverse | Recently added content |
| LIVE | error | text-primary | Live channel indicator |
| HD/4K | bg-tertiary | text-secondary | Quality indicator |
| Rating | bg-tertiary | text-primary | Star + number |

**Skeleton:**
- Background: bg-tertiary
- Animation: pulse (1.5s ease-in-out infinite)
- Border radius: matches target component (8px for cards, 4px for text)
- Reduced motion: no animation (static gray)

### Focus Ring Specification (Single Source of Truth)

```
TV:
  ring: 2px solid accent-teal
  shadow: 0 0 20px rgba(20,184,166,0.15)
  scale: 1.08
  transition: transform 200ms ease-out, ring-color 200ms, box-shadow 200ms

Desktop (keyboard mode):
  ring: 2px solid accent-teal
  offset: 2px (ring-offset-2)
  scale: 1.03
  transition: same as TV

Mobile:
  No persistent focus ring (touch interaction)
  Active state: bg-hover background + slight scale(0.98) on press
```

### Animation Specifications

| Animation | Trigger | Duration | Easing | Properties | TV |
|-----------|---------|----------|--------|------------|-----|
| Card focus | Focus event | 200ms | ease-out | transform, ring-color, box-shadow | Yes |
| Card press | Active/click | 100ms | ease-in | transform (scale 0.95) | Yes |
| Page enter | Route change | 150ms | ease-out | opacity only (NO transform) | Yes |
| Skeleton pulse | Continuous | 1.5s | ease-in-out | opacity | Disable if reduced-motion |
| Toast enter | Show | 300ms | ease-out | transform(translateY), opacity | Yes |
| Toast exit | Dismiss | 200ms | ease-in | opacity | Yes |
| Controls fade | Show/hide | 200ms | ease-out | opacity | Yes |
| Spinner | Buffering | 1s linear | infinite | rotate(360deg) | Yes |
| Live dot pulse | Continuous | 2s | ease-in-out | opacity | Yes |
| Hero fade | Page load | 500ms | ease-out | opacity | Disable if reduced-motion |

**Banned on TV:** transition-all, backdrop-filter, SVG filter overlays, Framer Motion, CSS transform on layout ancestors of fixed-position elements.

---

## 6. Out of Scope (v2.0)

The following features are explicitly deferred to v2.1+ or later:

| Feature | Reason | Revisit |
|---------|--------|---------|
| Multi-user profiles | Backend changes needed, single-user sufficient | v2.1 |
| Content recommendations (ML) | Requires usage data collection + model | v3.0 |
| Download for offline viewing | Service Worker + IndexedDB complexity | v2.1 |
| Chromecast / AirPlay | Requires SDK integration, device testing | v2.1 |
| Light theme | Dark is standard for streaming apps | If requested |
| Custom server management UI | Admin panel is a separate concern | v3.0 |
| Voice search | Smart TV API integration per platform | v2.1 |
| Parental controls | Requires PIN + content rating system | v2.1 |
| Multiple provider support | Backend already has provider abstraction, frontend needs selector UI | v2.1 |
| Social features (sharing) | Not relevant for self-hosted | Never |
| Payment/subscription | Self-hosted, no billing | Never |

---

## 7. Dependencies and Constraints

### Backend API (Frozen for v2.0)

The backend API at `/api/*` (18 endpoints) is fixed. No backend changes are planned for v2.0. The frontend must work within the existing API contract:

- **Content**: Categories, streams, VOD info, series info, EPG, search (all GET)
- **User data**: Favorites (GET/POST/DELETE), history (GET/PUT/DELETE)
- **Auth**: Auto-login, login, refresh, logout
- **Streaming**: HLS proxy with M3U8 URL rewriting and audio transcoding

### Provider Model

Xtream Codes providers embed credentials in stream URLs. The backend proxies all streams (no direct provider access from frontend), but the proxy URL pattern is fixed: `/api/stream/:type/:id`.

### Fire TV APK Pipeline

The app is packaged as a TWA APK via PWABuilder for Fire TV sideloading. This constrains:
- Must be a valid PWA (manifest.json, service worker, HTTPS)
- TWA wraps the web app in an Android WebView (no native APIs)
- APK must be signed (at least V1 JAR signing)
- `display-mode: standalone` is the primary TV detection mechanism

### Development Constraints

- **Single developer**: Srinivas + Claude Code as engineering partner
- **No budget for paid services**: All tools must be free/open-source
- **CI/CD disabled until April 1**: Manual deploy via `--admin` merge
- **VPS resources**: 2 CPU cores, 7.8GB RAM, 96GB disk (Docker shared with other services)

### Architectural Constraints (Lessons from v1.x)

These constraints are non-negotiable based on proven v1.x failures:

| Constraint | Reason |
|-----------|--------|
| AC-01: Single player instance | Dual player caused back button failure on TV |
| AC-02: Player OUTSIDE CSS transform ancestors | CSS transform creates new containing block, breaks position:fixed |
| AC-03: No focusable:true on containers | Steals focus from child elements due to large bounding rect |
| AC-04: scrollIntoView behavior: 'instant' | 'smooth' causes layout shifts that confuse pixel-distance spatial nav |
| AC-05: No transition-all on TV | Forces browser to diff 300 CSS properties per frame |
| AC-06: No backdrop-filter on TV | Not transitionable in Chromium, expensive on WebViews |
| AC-07: backBufferLength: 20 on TV | Fire Stick has 2GB RAM, 60s buffer causes OOM |
| AC-08: Back button handled BEFORE video guards | Otherwise dead back button during loading, app exits TWA |
| AC-09: No Framer Motion | 60KB bundle, poor performance on Fire Stick |
| AC-10: Use nextLevel not currentLevel for quality switch | currentLevel causes mid-segment freeze |
| AC-11: Container ref MUST be attached to DOM | Without ref, norigin can't calculate getBoundingClientRect |
| AC-12: Incremental spatial nav fixes, not bulk | Bulk changes (PR #50 experience) broke entire app |

---

## Appendix: Requirement Traceability Matrix

| Sprint | Requirements Covered |
|--------|---------------------|
| Sprint 0 | Design system foundation (no direct FR) |
| Sprint 1 | FR-NAV-01 to 07, US-013, US-014, US-022 |
| Sprint 2 | FR-HOME-01 to 10, US-003, US-004, US-024 |
| Sprint 3 | FR-VOD-01 to 08, FR-SERIES-01 to 11, FR-SEARCH-01 to 08, FR-FAV-01 to 06, US-009, US-010, US-019, US-027, US-030 |
| Sprint 4 | FR-PLAYER-01 to 24, FR-HISTORY-01 to 05, US-005 to 007, US-011 to 012, US-015, US-021, US-023 |
| Sprint 5 | FR-LIVE-01 to 09, US-008, US-016, US-025 |
| Sprint 6 | FR-AUTH-01 to 07, FR-SETTINGS-01 to 07, NFR-A11Y, NFR-NET, US-001, US-002, US-017, US-018, US-020, US-026 |
| Sprint 7 | NFR-PERF-01 to 13 |
| Sprint 8 | SC-07 (test coverage) |
| Sprint 9 | NFR-COMPAT-01 to 09, US-028, US-029 |
| Sprint 10 | SC-01 to 10 (final validation) |
