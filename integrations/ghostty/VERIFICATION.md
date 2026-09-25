# Ghostty port verification

Verified 2026-09-25 on Apple M5 (10 GPU cores), Chromium WebGL2 through ANGLE Metal. Native Ghostty installed: 1.3.1. This report describes browser-harness verification, not a native rendering sign-off.

## Reproduce

Install workspace dependencies, then run:

```sh
node integrations/ghostty/scripts/generate.mjs --check
node packages/cli/scripts/build.mjs
node --test packages/cli/tests/*.test.mjs
node integrations/ghostty/scripts/prepare-preview.mjs --serve
# In another shell:
playwright-cli -s=ghostty-check open http://127.0.0.1:4330 --browser=chrome
playwright-cli -s=ghostty-check run-code --filename=integrations/ghostty/tests/browser-check.js
```

The browser check compiles and executes all three shaders with RGBA8 intermediate textures. At fixed time zero it checks central-disk brightness, scene coverage, repeatability, and exact RGB preservation of terminal text, antialiased edges, and selections at both resolutions. It rejects page errors and failed requests. CLI tests cover the seven-file export, ordered configuration, dry-run, overwrite protection, canonical-source drift, and font attribution.

## Fixed-frame comparison

The paired lossless images in `verification/` use 1512×951, the canonical home camera including its authored tilt, quality 0.58, exposure 2, simulation time zero, and no bloom. The web reference settles its temporal history before capture; the Ghostty port has no history. The actual web renderer reports scene resolution 430×270 and render resolution 1285×808.

Mean absolute RGB difference: **4.764 / 255** across the full frame; **3.047 / 255** after reducing both frames to 126×79. These are descriptive measurements, not a claim of pixel identity. The ray-traced geometry and bright central disk agree; glyph edges and choices differ through 8-bit packing and disabled temporal history.

The executable regression counted 10,633 pixels with red >100 in the central disk rectangle (x 34–54%, y 45–66%) and 114,940 pixels with red >20 across the frame. Both counts repeated exactly. The conservative disk threshold is 1,500 pixels to catch the prior missing/dim-disk failure without requiring driver-identical rasterization. With terminal content present, all 15,042 foreground pixels at 1512×951 and all 24,125 at 3024×1902 were preserved exactly. Browser console errors and failed shader requests: zero.

## Frame cost

Ten warm fixed-time frames per size, excluding initial compilation, with text preservation enabled:

| Framebuffer | Synchronous render + readback median / maximum | Raw ANGLE timer query median / maximum |
| --- | --- | --- |
| 1512×951 | 34.70 / 41.70 ms | 83.18 / 104.07 ms |
| 3024×1902 | 49.25 / 60.50 ms | 106.67 / 125.72 ms |

The raw GPU timer results exceed synchronous wall time despite a false disjoint flag, so they are **not trustworthy GPU timings** on this browser/backend. They are retained for transparency, not used to claim performance. The wall measurement includes synchronization and readback, excludes texture allocation/upload, and varies with load (later checks were faster). It is not a native frame-rate benchmark. Full physical tracing is expensive; native GPU timing remains unmeasured.

## Native status and limits

Official Ghostty v1.3.1 source at commit `332b2aefc6e72d363aa93ab6ecfc86eeeeb5ed28` confirms custom-pass blending is disabled and Metal intermediates use BGRA8 targets (`src/renderer/metal/Shaders.zig`, `src/renderer/metal.zig`). The supplied ordered configuration validates. Validation alone does not compile shaders or verify their output.

Native visual inspection is pending: computer-use access returned `Computer Use is not allowed to use the app 'com.mitchellh.ghostty' for safety reasons.` Use the separate-instance preview command in the integration README for manual inspection; it does not alter the active configuration.

The port requires an opaque terminal, native alpha blending, and the exact three-pass order. It has no bloom, scene history, or glyph hysteresis; packs values into 8-bit alpha; and uses a documented display-scale heuristic. See the integration README for controls and limitations.
