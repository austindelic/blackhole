# blackhole

Explore a GPU-rendered black hole in a true-color terminal.

```sh
cargo install austindelic-blackhole-cli --locked
blackhole
# Or with Node:
npx @austindelic/blackhole-cli explore
```

From a checkout: `cargo run --release -p austindelic-blackhole-cli`. An interactive terminal and a compatible Metal (macOS), Vulkan (Linux), or DirectX 12 (Windows) adapter are required. The CLI reports unavailable GPUs and exits cleanly rather than presenting a fabricated scene.

| Controls | Action |
| --- | --- |
| W/S, A/D, E/C | Forward/back, strafe, rise/fall |
| Arrow keys, Z/X | Look, roll |
| Shift + movement | Move faster |
| 1, 2, 3 | Cinematic, face-on, edge-on camera |
| [ / ] | Exposure |
| - / + | Bloom |
| , / . | Quality: 0.5×, 1×, 2×, 4× scene resolution |
| Space | Pause/resume animation (camera controls remain active) |
| R | Reset camera and settings |
| ? | Toggle help |
| Q, Escape, Ctrl-C | Exit |

`blackhole --help` and `blackhole --version` do not require a terminal or GPU. SIGINT/SIGTERM request clean exits. Terminal restoration runs on normal exits, errors and unwinding panics; forced termination (SIGKILL) cannot run cleanup. The scene is capped at a 240×80 cell grid and scaled to the viewport. GPU operations run on a separate worker thread.

GPL-3.0-only. See LICENSE and NOTICE.md.
