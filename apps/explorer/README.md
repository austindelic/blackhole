# Blackhole explorer

Static Astro 5 site with one React explorer island. Canonical URL: https://blackhole.austindelic.com.

From the workspace root, install dependencies and build the renderer, then run `bun run --cwd apps/explorer dev` or `bun run --cwd apps/explorer build`. The site imports `@austindelic/blackhole/react` through the workspace, never source paths from another checkout.

Cloudflare Workers Static Assets configuration (`wrangler.jsonc`, Worker name `blackhole`): build command `bun run --cwd packages/blackhole build && bun run --cwd apps/explorer build`, static output `apps/explorer/dist`. Use the existing Cloudflare account; deploy this static Worker only during the coordinator-authorized launch stage. The config binds blackhole.austindelic.com and serves the built 404 page for missing routes. This directory does not create or provision a hosting provider. No server adapter or secrets are required.

`bun run --cwd apps/explorer test` checks URL normalization and exported configuration. Browser checks must cover rendering, controls, share-link round trips, JSON export, reduced motion, mobile, and GPU failure fallback.
