# Public launch checklist

## Evidence and ownership (2026-09-25)

The implementation snapshot is portfolio commit `0013008`, based on the active `cdfefe4` checkout plus its uncommitted user work. Upstream main is `590531f771958e2775da1f8e0b4f79efe93fdb2f`. `release/snapshot-delta.json` records exact changed blob IDs and paths between those snapshots. Original working files were never modified during this audit.

Before the first public Blackhole push, create a new initial main commit from the complete, verified, sanitized integrated tree. Keep the implementation-history branch local only: its seed history contains the removed code-rain fragment. Do not push seed branches, tags, or other refs that expose that history. The original portfolio history stays preserved separately. The commit IDs in this audit and source-provenance.json are source attribution records, not required public ancestry. Build CI artifacts and tag releases from the new public commit, so exact-commit checks refer to the sanitized history.

Newer main includes portfolio copy/content updates, contracts and site-and-terminal posts, removal of email-copy UI, deterministic TUI fixtures, terminal-background controls, measured size budgets, tested-snapshot release recovery, and the authored JavaScript-to-TypeScript migration (`dc97971`). Canonical GLSL/WGSL shader blobs match the preserved snapshot. The runtime does differ: `heldCameraPath` retains the explored pose on exit and transitions from it on route changes. Preserve this behavior when extracting the renderer.

Do not overwrite the user's snapshot wholesale with main. Reconcile site content/UI separately from the package extraction and apply tool renames together with matching package scripts. Read source main with `git show 590531f:path` from the original repository. Keep the migration-specific package names and integration changes. The read-only worktrees `9ad0` and `9dc8` were clean at audit; branch `5ada3a5` contains a release-fixture fix superseded by main's release fixes. Open PR [#47](https://github.com/austindelic/austindelic/pull/47), branch `notcodex/transparent-readme-banner` at `b4b06fc`, explicitly has visual cleanup pending; do not silently adopt it. Prunable `/private/tmp` worktrees were absent.

Integration checkpoint: subsequent portfolio main `57895d0` includes the user-merged PR #47. Portfolio integration preserves that merged artwork and current content. The earlier PR status above is historical audit evidence. The complete integrated source and generated payload audit passed; the recorded code-rain redistribution blocker is resolved.

## Name and authentication checks

Authenticated GitHub GET returned 404 for `austindelic/portfolio` and `austindelic/blackhole`. All requested npm package metadata URLs and all three crates.io names below returned 404. This means no package/repository was visible at those names at audit; it does not reserve them or prove first-publication permission.

- npm: `@austindelic/blackhole`, `@austindelic/blackhole-cli`, and platform packages `blackhole-darwin-arm64`, `blackhole-darwin-x64`, `blackhole-linux-arm64`, `blackhole-linux-x64`, `blackhole-win32-x64` under scope `@austindelic`.
- crates.io: `austindelic-blackhole`, `austindelic-blackhole-ratatui`, `austindelic-blackhole-cli`.
- `npm whoami` succeeds as `austindelic`; GitHub authenticated account has admin access to the existing repository. Sandbox network failures were not authentication failures.
- Coordinator found no Cargo credentials file or `CARGO_REGISTRY_TOKEN`. A local `cargo login` or release environment `CARGO_REGISTRY_TOKEN` is still required before publishing crates. Do not put credentials in tracked files.
- Local npm authentication does not configure GitHub Actions. Configure npm trusted publishing for `.github/workflows/release.yml` and the release environment, or provide an authorized `NPM_TOKEN`. The job has `id-token: write` for npm provenance. First publication may need the authenticated local account before trusted-publisher settings exist.
- Create/configure the new GitHub repository and `release` environment before workflow publication. Main and the release tag must contain the same integrated, tested source. The dispatch must select the tag itself, not main.

## Redistribution gate

User selected retention under GPLv3-compatible terms. Root LICENSE is GNU GPL version 3; package metadata uses `GPL-3.0-only`, without inventing an upstream "or later" grant. Source and artifact notices identify baopinshui/NPGS and preserve font OFL terms. Exact primary source URLs and revisions are in NOTICE.md.

The old code-rain fragment had only attribution to Shadertoy 4t3BWl; no per-shader grant was verified (primary site blocked fetches). Release preparation removes the isolated rain/rune/hash helpers and uses the existing stars for the negative-mass/antiverse branch. Normal positive-mass visuals are unchanged. Before changing `release/provenance.json` to ready, verify canonical GLSL, regenerated WGSL, Rust embedded assets, Ghostty shader, scaffold sources, and built tarballs contain no removed implementation. Keep the historical source credit as an explanation of removal, not a license grant.

Both Departure Mono and DSEG fonts are OFL-1.1. Their full licenses are in `release/licenses/`; embed copies beside redistributed font files and font-derived glyph assets. Do not use the Departure Mono website's root MIT license for its font. Exclude portfolio résumé, site-specific favicons and unrelated README artwork from reusable package payloads. Distribute complete corresponding source and build scripts with every binary release.

## Build and publication order

1. Integrate web, CLI, Rust, site and foundation commits; commit both `bun.lock` and `Cargo.lock`. Verify `node release/check.mjs`, shader synchronization, all package builds/tests, actual browser flows, native tests and tarball contents.
2. Trigger **Verify Blackhole** (`ci.yml`, `workflow_dispatch`) to produce five native npm tarballs plus web/CLI archives and corresponding-source archive. No credentials or public mutation are used by this workflow. All five packed-host jobs must pass. Linux release executables compile inside the official `rust:1.96.1-bookworm` Debian 12 container (glibc 2.36 baseline), matching the portfolio release strategy. Both linux/amd64 and linux/arm64 manifests were verified in Docker Hub; the multi-architecture digest is pinned in CI. Container Cargo output uses `target/debian12`, isolated from Ubuntu-host test artifacts. Host tests and packed smoke remain on Ubuntu 24.04; successful Debian 12 execution still needs CI/runtime evidence before advertising compatibility.
3. Review `NOTICE.md`, Cargo dependency notices, font notices and sanitized shaders; clear only the resolved blocker in `release/provenance.json`. Tag the exact integrated commit as `vX.Y.Z` matching every package version. Never attach a new tag to different source after publishing.
4. Dispatch **Release Blackhole** (`release.yml`) with the tag selected as the workflow ref, input `tag=vX.Y.Z`, `publish=false`. Set `verified_run_id` to the successful Verify Blackhole run for the exact tagged commit. It validates run origin, workflow, commit, completion and success, then reuses those artifacts. Dispatch the same tag and run ID with `publish=true` after configuring credentials; the matrix is not repeated.
5. npm publication order is five platform packages, browser package, then launcher. `release/publish-npm.mjs artifacts` publishes exact tested tarballs and skips only already-published byte-identical versions (registry SHA-512 integrity must match). For first publication outside supported CI, run `node release/publish-npm.mjs artifacts --local` with authenticated npm and the same tested archives. This explicit mode publishes without CI provenance; omitting `--local` outside GitHub Actions fails before registry access. GitHub Actions always requests provenance and rejects `--local`. It never rebuilds packages during publication.
6. Cargo publication order: `cargo publish --locked -p austindelic-blackhole`, then `austindelic-blackhole-ratatui`, then `austindelic-blackhole-cli`. Cargo checks each package; dependencies need the preceding registry version. A partial Cargo publish is immutable: inspect registry state and resume only missing packages from the same source. The automated job intentionally fails on an already-published crate rather than silently assuming equality.
7. Attach all exact npm archives, Cargo `.crate` archives, SHA256SUMS and `blackhole-source.tar.gz` to the GitHub release. Check public installs on the requested platforms and verify browser exports, CLI scaffold and `blackhole explore`. Cargo crate tarballs must contain their local LICENSE/NOTICE/font texts and shader assets.

## Deployment

Coordinator confirmed `austindelic.com` is served by Cloudflare Worker `austindelic`, assets-only with no bindings. There are zero Pages projects; the repository's old Pages infrastructure was not applied. Preserve Workers Static Assets deployment and domain routing. Coordinator recorded current deployed version `69f79742-a83f-4e7a-b528-d09229a86bf2` for rollback and confirmed Cloudflare OAuth works. The explorer's final Worker/domain configuration and production browser verification belong to the coordinator/site task. No deployment, repository rename, push or package publication is performed by this foundation task.

## Verification limits

Local foundation checks validate packaging failure cases, notices and workflow syntax. They do not claim five-host CI success, actual registry publication or deployed browser validation. Run the integrated workflow after push to obtain those results. Native GPU rendering requires a host with an adapter or configured software Vulkan; default unit tests deliberately omit the explicit GPU test. CPU version/scaffold smoke tests do not prove terminal visual parity.
