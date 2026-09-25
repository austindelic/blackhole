# austindelic-blackhole

Native offscreen black-hole rendering with wgpu. The crate embeds the shader pipeline and calibrated ASCII glyph table, and needs no Node installation or source monorepo at build/runtime. Metal, Vulkan and DirectX 12 backends are selected on macOS, Linux and Windows respectively.

```rust,no_run
use austindelic_blackhole::{Request, Worker};
let worker = Worker::start(30);
worker.request(Request::default());
// On subsequent application ticks; neither call waits for the GPU:
if let Some(frame) = worker.take_frame() {
    println!("{} × {}", frame.width, frame.height);
}
if let Some(status) = worker.status() {
    println!("{status}");
}
```

`Camera` exposes position, forward and up vectors using the reexported `Vec3`, with `translate`, `look` and `roll` controls. `Request` controls terminal width/height, generation, temporal-history epoch, animation time, cell aspect ratio (default 0.5), camera, exposure, bloom and `RenderScale` (Half/One/Two/Four). Requests are bounded to 240 columns × 80 rows. Increase `generation` when invalidating old frames; increase `history` when camera/settings changes should reset temporal accumulation. Consumers should reject obsolete frame generations. `CellFrame` and `Cell` are available at the crate root and under `frame`.

The worker initializes the GPU on its own thread and keeps only the newest pending request and completed frame. `request` takes a short mutex; `take_frame` and `status` use `try_lock`. GPU errors appear as `Renderer unavailable: …` in status. Dropping the worker signals shutdown without waiting for an in-flight GPU call. No terminal is needed for the renderer itself. `Renderer::new`, `submit` and `poll` expose direct ownership for callers managing their own GPU thread; these methods may perform GPU work and must not be called in a widget render method. A `false` result from `submit` means its readback slots are busy: retry later.

`route::Routes::from_json(json)` parses application-owned camera presets with a required `fallback` entry; call its `camera` and `intro_camera` methods. `route::{camera,intro_camera}` uses only the bundled `/` and `fallback` presets; `route::blend` remains available for transitions. Portfolio or application route names belong in the caller’s JSON. Standalone exploration can use `Camera` directly. Positive finite aspect and time, finite camera/settings values and a nondegenerate camera basis are expected. `BLACKHOLE_SOFTWARE_GPU=1` requests a fallback adapter if supported by the platform.

Run `cargo run -p austindelic-blackhole --example probe` for a 12-second GPU/ASCII probe. `BLACKHOLE_COLUMNS=80` selects its grid width. Passing a filename saves the completed frame as JSON.

GPL-3.0-only. See LICENSE and NOTICE.md for source attribution and bundled asset notices.
