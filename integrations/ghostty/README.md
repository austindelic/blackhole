# The Blackhole renderer in Ghostty

This chain uses the **canonical web Kerr–Newman ray tracer, home camera (including its authored roll), starfield, amber tone mapping, ASCII analysis, and actual Departure Mono glyph raster**. It replaces the old smooth procedural ring. Generated source retains its GPL-3.0-only attribution; the embedded font raster retains SIL OFL 1.1.

Requires Ghostty **1.3 or newer** and an **opaque terminal**. Copy all three shaders and the notices together. Use this exact order:

```ini
background-opacity = 1
alpha-blending = native
custom-shader = /absolute/path/blackhole-scene.glsl
custom-shader = /absolute/path/blackhole-analysis.glsl
custom-shader = /absolute/path/blackhole.glsl
custom-shader-animation = true
```

Do not configure only the last file. Do not insert another shader between these three passes. To disable the effect, remove **all three** `custom-shader` lines. To replace the old export, export to a fresh directory or explicitly use the CLI's `--overwrite`; the CLI never changes your active config.

## Try a separate window

Create `preview.conf` containing the configuration above plus, for example, `background = #080807` and `foreground = #e8e2d8`. Test without loading or changing your normal configuration:

```sh
# macOS
open -na Ghostty --args --config-default-files=false \
  --config-file=/absolute/path/preview.conf

# Linux
ghostty --config-default-files=false --config-file=/absolute/path/preview.conf
```

Shader errors occur during rendering, not configuration validation. If the chain fails, close the preview window and remove its shader lines before retrying. Never use a failed partial chain as your normal terminal configuration.

## What is shared, and what differs

The scene is traced at the web `ascii-balanced` quality (0.58), exposure 2, simulation time scale 2, and home camera. It is not a painted ring or a different lensing model. The complete canonical `mainImage` trace is retained, replacing only its history read/blend and adapting input/output coordinates.

Ghostty exposes one input texture per pass, not independent scene/history/font textures. The first pass preserves original terminal RGB and stores scene components in alpha slots. The second stores per-cell canonical ASCII analysis in more alpha slots. The third reconstructs the scene and glyphs and restores opaque alpha. Every non-background terminal pixel is retained, including text, selections and cursors. This is why `background-opacity = 1` is required.

Concrete limits:

- There is no previous-frame scene or glyph-history texture. Temporal smoothing and glyph hysteresis are disabled; individual glyph choices can differ or flicker.
- This matches the balanced, bloom-disabled reference. The cinematic web bloom pipeline is not included.
- Scene/display values are quantized into 8-bit alpha slots. The web trace can retain floating-point intermediates. Exact pixel identity is not claimed.
- Ghostty supplies physical pixels but no display-scale uniform. The default assumes 2× when the framebuffer height exceeds 1200px, otherwise 1×. Set `BLACKHOLE_PIXEL_SCALE` to the actual scale **in all three files** if the heuristic does not fit your monitor/window. This affects glyph size and sample density, not the physics.
- Camera controls remain in the web explorer. Ghostty uses the fixed home view. The terminal's glyphs are never warped.
- The full ray tracer costs substantially more than a decorative shader. See `VERIFICATION.md` in the source integration for measured frame cost and native-verification limits. Set `custom-shader-animation = false` for rendering only on terminal updates; set `BLACKHOLE_TIME_SCALE` to `0.0` in all files for a still scene.

`BLACKHOLE_OPACITY` defaults to 1.0, preserving the intended brightness. Lower it only if you prefer a quieter background. Shared settings must match in all three files.

## Regenerate and check

From the repository root:

```sh
node integrations/ghostty/scripts/generate.mjs
node integrations/ghostty/scripts/generate.mjs --check
node --test integrations/ghostty/tests/*.test.mjs
```

The normal CLI build and tests run the drift check. Edit canonical shaders in `packages/blackhole/shaders`, never the generated shader bodies. The generator records source fingerprints and fails if font, glyph logic, camera logic, or routes changed without a new raster capture.

To recapture the actual canonical font/camera through a browser:

```sh
node integrations/ghostty/scripts/prepare-preview.mjs --serve
# In another shell, from the repository root:
playwright-cli -s=ghostty-capture open http://127.0.0.1:4330 --browser=chrome
playwright-cli -s=ghostty-capture run-code --filename=integrations/ghostty/scripts/capture-atlas.js
node integrations/ghostty/scripts/seal-atlas.mjs
node integrations/ghostty/scripts/generate.mjs
```

Run `playwright-cli -s=ghostty-capture run-code --filename=integrations/ghostty/tests/browser-check.js` for the numerical rendering regression.

The preview harness also exposes `renderGhostty(width,height,text,time)` for browser compilation, pixel-preservation tests, and fixed-time comparison. These are browser harness checks, not proof of native Ghostty output.

References: https://ghostty.org/docs/config/reference#custom-shader ; Ghostty v1.3.1 source `src/renderer/metal/Shaders.zig` (custom shader blending disabled) and `metal.zig` (BGRA8 intermediate targets). Alpha remains linear even for sRGB targets.
