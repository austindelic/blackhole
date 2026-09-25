# @austindelic/blackhole

A framework-neutral WebGL2/WebGPU black hole renderer, with ASCII, bloom, camera controls and optional React bindings. Version 0.1.0, GPL-3.0-only. Shader and font notices ship with the package.

```ts
import { mountBlackHole } from '@austindelic/blackhole';
const view = mountBlackHole(document.querySelector('#scene')!, {
  quality: 'cinematic-ascii', exposure: 1, bloomStrength: 1,
});
await view.ready; // true after first frame, false if initialization fails/disposes
view.update({ exposure: 1.5, asciiEnabled: false });
view.setCamera({ position: [0, 1, 8], forward: [0, 0, -1] });
view.pause(); view.resume(); view.resize();
view.dispose();
```

Give the host a nonzero width and height. An existing canvas is also accepted and restored on disposal. Only renderer-owned DOM is removed. GPU failures render a visible message and call `onError`. WebGPU failure falls back to WebGL2. `backend: 'webgl2'` forces WebGL2. Browser APIs are only touched on mount; root imports and React SSR are safe. Root imports do not require React. Shaders and OFL fonts are embedded; no raw loader, global stylesheet, CDN or framework configuration is required.

```tsx
import { BlackHole } from '@austindelic/blackhole/react';
<BlackHole style={{height: 480}} exposure={1.5} asciiEnabled paused={false} />
```

React props update the runtime. Quality/backend changes recreate GPU resources while preserving camera/time. `paused` stops rendering; `timeScale: 0` freezes shader time while allowing camera updates. Named types include `BlackHoleOptions`, `BlackHoleProps` (React entry), `BlackHoleCamera`, and `BlackHoleController`. The low-level `/runtime` entry is available for custom editors.

Options preserve the original renderer controls: quality, backend, rendererMode, resolution/prepass/bloom/scene scales, maximum DPR, cell dimensions, frame interval, bloom pass, ASCII enabled/cell size/mix, initial camera position/forward/universe, timeScale, exposure, bloomStrength, temporalJitter, invertControls, palette and colors, glyph preset/custom glyphs/font/text size, brightness, contrast, animation mode/route/autoplay, interactivity and debugStats. `showControls` enables runtime diagnostics for custom editor integrations. No portfolio editor panel is mounted by the base API.

Routes are per instance: pass `routes: Record<string, BlackHoleRouteAnimation>` and `animationRoute`. Exact and `/*` prefix matches are supported, followed by `fallback` or the default authored home camera. The package never inspects the current page URL to pick a route. `/routes.json` exposes the default and fallback presets for compatibility; `/shaders/*` exports canonical raw shader assets.

Exploration integrations can use `enterExploration`, `exitExploration`, `resetExploration`, `getExploreRenderSettings`, `updateExploreRenderSettings`, `updateControls` (alias of `update`) and `snapshot`. Exiting exploration dispatches `black-hole-explore-end` from the active canvas.

To edit source, use `npx @austindelic/blackhole-cli add`. In this repository run `bun run build` after edits. Canonical GLSL → WGSL regeneration uses `node tooling/webgpu/port-shaders.mjs /path/to/naga` with naga-cli 27.0.0. GLSL/WGSL → embedded TypeScript uses `node scripts/embed.mjs`; the package build runs it automatically. Preserve source notices. The separately sourced code-rain effect was removed for release; both universe backgrounds use the existing stars implementation.
