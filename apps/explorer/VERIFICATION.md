# Explorer verification

Verified 2026-09-25 against the linked, built `@austindelic/blackhole` package. The link was local test setup only; source retains the portable workspace dependency.

- Astro production build: all six routes generated.
- TypeScript: `tsc --noEmit` passed.
- Configuration tests: 4 passed (URL round trip, malformed input bounds, reduced-motion/mobile defaults, portable JSON).
- Playwright CLI / Chrome, actual production preview at 1440×1000 and 390×844: rendered canvas, camera presets, ASCII/raw, quality, exposure, bloom, pause/play, reset, Home and Space shortcuts, fullscreen, copied-link action, reload restoration, and downloaded JSON.
- Actual screenshot checks: paused frames remain identical; Play changes frames; changing exposure while paused redraws; initial reduced motion reaches PAUSED with a rendered scene.
- Focused canvas W movement and pointer drag visibly change the view. R/F retain vertical movement; Home resets.
- Mobile landing, explorer, and docs have no horizontal page overflow. Code samples scroll within their containers.
- GPU failure injected by disabling WebGPU and WebGL contexts: static image, visible error, retry and export controls remain available.
- Desktop/mobile captures visually reviewed; production previews in `public/previews/` have no Astro development toolbar.
- Relevant browser network requests returned successfully; no application console errors in the normal path. An unused preload warning was removed by dropping the redundant font preload.

## Ghostty

- Installed Ghostty 1.3.1 inspected.
- Separate test config validated with `+validate-config --config-default-files=false --config-file=...` (exit 0). Its unrelated Sentry initialization warning was also present for version/help commands.
- Separate app process launched with the isolated config; the user's default config was never edited.
- Both default and optional lensing GLSL variants compiled in a WebGL2 fragment-shader harness.
- Native visual inspection could not be completed: the Computer Use tool explicitly blocked Ghostty app access. This is not a claim of native visual verification or full renderer parity.

## Launch handoff

No deployment, package publication, push, or remote changes performed. Use `apps/explorer/wrangler.jsonc` for the existing Cloudflare Workers Static Assets platform. Root workspace install/build scripts and lockfile integration belong to the coordinator/web task.
