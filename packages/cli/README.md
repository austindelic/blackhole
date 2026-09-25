# @austindelic/blackhole-cli

Node.js 22+. Version 0.1.1, GPL-3.0-only.

```sh
npx @austindelic/blackhole-cli add --framework react --out-dir src/blackhole
npx @austindelic/blackhole-cli add --framework vanilla --out-dir src/blackhole --dry-run
npx @austindelic/blackhole-cli explore
npx @austindelic/blackhole-cli ghostty --out-dir ghostty
```

`add` detects Vite React and Astro React via package dependencies; otherwise it selects vanilla. It copies the full editable TypeScript renderer, embedded/canonical shaders, fonts, source version, notices and a shader embedding script. React is needed only for the React template. Import `mountBlackHole` from the copied `src/index` or `BlackHole` from `src/react`. Give the host an explicit height. The supplied WGSL is already generated. After editing canonical GLSL, run the following from the copied directory to update both WebGL and WebGPU source:

```sh
cargo install naga-cli --version 27.0.0 --locked --root .blackhole-tools
node tooling/webgpu/port-shaders.mjs .blackhole-tools/bin/naga
node scripts/embed.mjs
```

The canonical generator is included with its paths intact. On Windows, use `.blackhole-tools/bin/naga.exe`. Font-only edits require only `node scripts/embed.mjs`. Compilation is offline; no shader compiler runs in the browser.

`--dry-run` performs validation without writing. Destinations must be inside the current project. Traversal and symlinks are rejected. Existing files are rejected unless `--overwrite` is explicit; validation happens before any writes. No package manifest or active configuration is modified.

`explore` forwards arguments and terminal signals to the matching optional `@austindelic/blackhole-{platform}-{arch}` package. Supported targets: darwin arm64/x64, linux arm64/x64, win32 x64. Native binaries are not downloaded at runtime. If absent, install with optional dependencies enabled.

`ghostty` copies the bundled shader and license/notices, then prints a `custom-shader` configuration snippet with focused-window animation. It never edits active Ghostty configuration.

Templates are generated from `packages/blackhole` during the CLI build. The Ghostty shader is copied from canonical `integrations/ghostty/blackhole.glsl`; no divergent manual template is maintained.
