# Ghostty

`blackhole.glsl` is an original single-pass artistic adaptation for Ghostty's Shadertoy-compatible `mainImage` interface. It samples `iChannel0`, uses `iTime` / `iResolution`, preserves bright terminal foreground, and adds dim amber light on dark backgrounds. It does **not** reproduce the web renderer's physics, ray integration, or multipass bloom.

Copy the shader somewhere persistent, then add to a separate test configuration:

```ini
background = #080807
foreground = #e8e2d8
custom-shader = /absolute/path/to/blackhole.glsl
custom-shader-animation = true
```

Test without reading or modifying your default configuration on macOS:

```sh
open -na Ghostty --args --config-default-files=false --config-file=/absolute/path/to/test-config
```

Linux:

```sh
ghostty --config-default-files=false --config-file=/absolute/path/to/test-config
```

`true` animates only while focused. For a still effect, set `custom-shader-animation = false` and `BLACKHOLE_SPEED` to `0.0`. Remove `custom-shader` to disable the effect.

## Presets

- **Readable background (default):** `BLACKHOLE_INTENSITY 0.22`, `BLACKHOLE_LENSING 0`. Original terminal texture coordinates are preserved.
- **Lensing (optional):** copy the file and set `BLACKHOLE_LENSING 1`. This warps the terminal texture as well as its text; intended as an effect, not for precision reading.
- Adjust `BLACKHOLE_INTENSITY` from `0.0` to `1.0` (default `0.22`), `BLACKHOLE_SPEED` (default `0.18`), and `BLACKHOLE_LENS_STRENGTH` (default `0.012`) at the top of the file.

The web CLI's build copies this canonical shader into its package. `blackhole ghostty --out-dir PATH` exports it without changing the active Ghostty configuration.

Reference: https://ghostty.org/docs/config/reference#custom-shader
License: GPL-3.0-only, see repository license.
