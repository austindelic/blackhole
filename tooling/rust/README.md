# Rust development and verification

The root Cargo workspace contains the reusable renderer, Ratatui widget and standalone `blackhole` binary. All crates are version 0.1.0. Crate-local shader assets and notices are included in Cargo packages, so builds do not invoke Node or read outside the packages.

```sh
python3 tooling/rust/sync-assets.py --check
cargo fmt --all --check
cargo test --workspace --locked
cargo clippy --workspace --all-targets --locked -- -D warnings
cargo build --release --locked -p austindelic-blackhole-cli
cargo package --workspace --allow-dirty --locked
```

`cargo package` packages and verifies without publishing. Cargo 1.96 can verify unpublished workspace dependencies using a temporary local registry; registry network access is required (offline mode produced an internal missing-hash error). Publish order, when separately authorized, is renderer, widget, CLI. Installation uses `cargo install austindelic-blackhole-cli --locked`.

Regenerate embedded assets with `python3 tooling/rust/sync-assets.py`. Canonical files live in `packages/blackhole/shaders`; do not edit crate-local copies. The check compares exact bytes plus a SHA-256 manifest. `--source-root OTHER_CHECKOUT` is available for coordinated integration; normal CI must use the default repository root. Shader generation belongs to the canonical package. The calibrated glyph table remains embedded and tracked by its hash.

GPU acceptance on a host with a real adapter:

```sh
cargo test -p austindelic-blackhole --locked -- --ignored
cargo run -p austindelic-blackhole --example probe
cargo build --locked -p austindelic-blackhole-cli
python3 tooling/rust/pty-smoke.py target/debug/blackhole
```

The Python PTY harness uses Unix APIs, clears inherited NO_COLOR, sets true-color terminal capabilities, drives native GPU frames/navigation/settings/help/resize and verifies Q, Ctrl-C and SIGTERM exits restore termios, cursor and alternate screen. It holds the slave descriptor outside the child session for post-exit termios inspection; do not send redundant synthetic SIGWINCH on top of PTY resizing. Windows needs a ConPTY acceptance host; this harness does not claim Windows coverage.

Validated on macOS / Apple M5, Rust 1.96.1: 10 unit tests pass, one opt-in GPU test passes across quality changes, strict Clippy clean, all three Cargo tarballs verified, live PTY acceptance passes. Sandboxed Metal access was unavailable; GPU checks ran with host access. Linux Vulkan and Windows DirectX 12 builds/backends preserve upstream configuration but have not been executed on this host. The original 120×40 probe completed 2,971 frames in 12 seconds; this is a local debug observation, not a portable performance guarantee. Canonical shader cleanup was followed by a successful GPU test; the earlier probe timing predates that cleanup.
