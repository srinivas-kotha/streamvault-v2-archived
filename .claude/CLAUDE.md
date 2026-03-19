# StreamVault Frontend

Self-hosted IPTV frontend — Netflix-style UI with Fire Stick TV support.

## Full Context
- Project context: `~/claude-dotfiles/context/streamvault.md`
- Technical gotchas: `~/claude-dotfiles/context/infrastructure.md` (Spatial Navigation, HLS.js, TV Performance sections)
- Project index: `~/claude-dotfiles/projects/streamvault/README.md`

## Tech Stack
- React 19 + TypeScript + Tailwind 4 + Vite 6
- TanStack Router (file-based routing)
- @noriginmedia/norigin-spatial-navigation v2 (pixel-based D-pad navigation)
- HLS.js for video playback
- Zustand for state management
- PWA + TWA (Fire Stick APK via PWABuilder)

## Key Files
- `src/routes/` -- TanStack file-based routes
- `src/components/` -- Shared UI components (ContentCard, ContentRail, PlayerPage)
- `src/hooks/useSpatial*.ts` -- Spatial navigation hooks (useSpatialContainer, useSpatialFocusable)
- `src/hooks/usePlayerKeyboard.ts` -- TV remote key handling for player
- `src/providers/SpatialNavProvider.tsx` -- Global D-pad navigation + Enter handler
- `src/stores/` -- Zustand stores (player, auth, preferences)

## Critical Rules
- **NEVER bulk-change spatial nav settings** — incremental fixes only, one page at a time
- **NEVER use `focusable: true` on containers** unless specifically needed — blocks cross-section nav
- **Container ref MUST be attached to DOM** — every useSpatialContainer needs `<div ref={ref}>`
- **Inline PlayerPage pattern** — use local state, NOT global FullscreenPlayer
- **TV remote back button** — handle keyCode 4 (Fire TV), 10009 (Samsung), 461 (LG)
- Use `transition-[specific-props]` NOT `transition-all` (expensive on TV)
- Use `@media (hover: hover)` for hover-only effects (TV has no hover)

## Working Rules
- Follow `~/claude-dotfiles/claude/rules/` (git workflow, security, deploy-via-cicd)
- Srinibytes "Ambient Depth" brand (Obsidian + Teal + Indigo)
- Safety tags: `v0.9.0-stable`, `v0.10.0-pre-perf` — rollback if needed

## Testing
```bash
npm run build     # TypeScript + Vite build check
npm run preview   # Local preview
```

## Deploy
- CI/CD: GitHub Actions on merge to main
- Docker: `streamvault_frontend` container, port 3002, nginx
- Manual deploy: `cd ~/ai-orchestration && docker compose up -d --build streamvault_frontend`

## Security
- NEVER mention StreamVault publicly
