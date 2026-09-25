use anyhow::{Result, ensure};
use austindelic_blackhole::{Camera, Request, Vec3, Worker};
use austindelic_blackhole_ratatui::Blackhole;
use crossterm::event::{self, Event, KeyCode, KeyEvent, KeyEventKind, KeyModifiers};
use ratatui::{
    layout::Rect,
    widgets::{Clear, Paragraph},
};
use std::{
    io::IsTerminal,
    sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    },
    time::{Duration, Instant},
};

const HELP: &str = "Blackhole — native GPU exploration\n\nW/S move forward/back · A/D strafe · E/C rise/fall\nArrows look · Z/X roll · Shift moves faster\n1 cinematic · 2 face-on · 3 edge-on\n[ / ] exposure · - / + bloom · , / . quality\nSpace pause/resume · R reset · ? help · Q / Esc / Ctrl-C quit\n\nMetal (macOS), Vulkan (Linux), DirectX 12 (Windows).\nA true-color terminal is recommended.";

#[derive(Default)]
struct Animation {
    time: f32,
    paused: bool,
}
impl Animation {
    fn advance(&mut self, delta: Duration) {
        if !self.paused {
            self.time += delta.as_secs_f32();
        }
    }
}

struct Restore;
impl Drop for Restore {
    fn drop(&mut self) {
        ratatui::restore();
    }
}

fn preset(number: u8) -> Camera {
    let position = match number {
        2 => Vec3::new(0., 24., 8.),
        3 => Vec3::new(24., 0.8, 0.),
        _ => return Camera::default(),
    };
    let forward = -position.normalize();
    let right = forward.cross(Vec3::Y).normalize();
    Camera {
        position,
        forward,
        up: right.cross(forward).normalize(),
    }
}

fn apply_key(request: &mut Request, key: KeyEvent, help: &mut bool) -> bool {
    if key.kind == KeyEventKind::Release {
        return false;
    }
    let step = if key.modifiers.contains(KeyModifiers::SHIFT) {
        2.
    } else {
        0.5
    };
    match key.code {
        KeyCode::Esc | KeyCode::Char('q' | 'Q') => return true,
        KeyCode::Char('c') if key.modifiers.contains(KeyModifiers::CONTROL) => return true,
        KeyCode::Char('?') => {
            *help = !*help;
            return false;
        }
        KeyCode::Char('w' | 'W') => request.camera.translate(step, 0., 0.),
        KeyCode::Char('s' | 'S') => request.camera.translate(-step, 0., 0.),
        KeyCode::Char('a' | 'A') => request.camera.translate(0., -step, 0.),
        KeyCode::Char('d' | 'D') => request.camera.translate(0., step, 0.),
        KeyCode::Char('e' | 'E') => request.camera.translate(0., 0., step),
        KeyCode::Char('c' | 'C') => request.camera.translate(0., 0., -step),
        KeyCode::Left => request.camera.look(0.06, 0.),
        KeyCode::Right => request.camera.look(-0.06, 0.),
        KeyCode::Up => request.camera.look(0., 0.06),
        KeyCode::Down => request.camera.look(0., -0.06),
        KeyCode::Char('z' | 'Z') => request.camera.roll(0.06),
        KeyCode::Char('x' | 'X') => request.camera.roll(-0.06),
        KeyCode::Char(n @ '1'..='3') => request.camera = preset(n as u8 - b'0'),
        KeyCode::Char('[') => request.exposure = (request.exposure - 0.1).max(0.1),
        KeyCode::Char(']') => request.exposure = (request.exposure + 0.1).min(8.),
        KeyCode::Char('-' | '_') => request.bloom = (request.bloom - 0.05).max(0.),
        KeyCode::Char('+' | '=') => request.bloom = (request.bloom + 0.05).min(2.),
        KeyCode::Char(',') => request.render_scale = request.render_scale.decrease(),
        KeyCode::Char('.') => request.render_scale = request.render_scale.increase(),
        KeyCode::Char('r' | 'R') => {
            let (width, height, generation, history) = (
                request.width,
                request.height,
                request.generation,
                request.history,
            );
            *request = Request {
                width,
                height,
                generation,
                history,
                ..Default::default()
            };
        }
        _ => return false,
    }
    request.generation = request.generation.wrapping_add(1);
    request.history = request.history.wrapping_add(1);
    false
}

fn main() -> Result<()> {
    if let Some(arg) = std::env::args().nth(1) {
        match arg.as_str() {
            "--help" | "-h" => {
                println!("{HELP}\n\nUsage: blackhole [--help | --version]");
                return Ok(());
            }
            "--version" | "-V" => {
                println!("blackhole {}", env!("CARGO_PKG_VERSION"));
                return Ok(());
            }
            _ => anyhow::bail!("Unknown argument {arg:?}; use --help"),
        }
    }
    ensure!(
        std::io::stdin().is_terminal() && std::io::stdout().is_terminal(),
        "Blackhole needs an interactive terminal; use --help for controls"
    );
    let quit = Arc::new(AtomicBool::new(false));
    let signal = quit.clone();
    ctrlc::set_handler(move || signal.store(true, Ordering::Relaxed))?;
    let mut terminal = ratatui::try_init()?;
    let _restore = Restore;
    let worker = Worker::start(30);
    let mut request = Request::default();
    let mut latest = None;
    let mut help = false;
    let mut last_tick = Instant::now();
    let mut animation = Animation::default();
    let mut status = String::from("Starting live renderer");
    while !quit.load(Ordering::Relaxed) {
        let size = terminal.size()?;
        let dimensions = (
            size.width.clamp(1, 240),
            size.height.saturating_sub(1).clamp(1, 80),
        );
        if (request.width, request.height) != dimensions {
            (request.width, request.height) = dimensions;
            request.generation = request.generation.wrapping_add(1);
            request.history = request.history.wrapping_add(1);
            latest = None;
        }
        let now = Instant::now();
        animation.advance(now.duration_since(last_tick));
        last_tick = now;
        request.time = animation.time;
        worker.request(request.clone());
        if let Some(frame) = worker.take_frame()
            && frame.generation == request.generation
        {
            latest = Some(frame);
        }
        if let Some(value) = worker.status() {
            status = value;
        }
        ensure!(!status.starts_with("Renderer unavailable:"), "{status}");
        terminal.draw(|frame| {
            let area = frame.area();
            if let Some(completed) = &latest {
                frame.render_widget(
                    Blackhole::new(completed),
                    Rect::new(area.x, area.y, area.width, area.height.saturating_sub(1)),
                );
            }
            let bar = format!(
                "Blackhole | {status} | {} | exp {:.1} bloom {:.2} quality {}x | ? help · q quit",
                if animation.paused {
                    "paused"
                } else {
                    "playing"
                },
                request.exposure,
                request.bloom,
                request.render_scale.multiplier()
            );
            frame.render_widget(
                Paragraph::new(bar),
                Rect::new(area.x, area.bottom().saturating_sub(1), area.width, 1),
            );
            if help {
                let panel = Rect::new(
                    area.x,
                    area.y,
                    area.width.min(76),
                    area.height.saturating_sub(1).min(12),
                );
                frame.render_widget(Clear, panel);
                frame.render_widget(Paragraph::new(HELP), panel);
            }
        })?;
        if event::poll(Duration::from_millis(16))?
            && let Event::Key(key) = event::read()?
        {
            if key.code == KeyCode::Char(' ') && key.kind != KeyEventKind::Release {
                animation.paused = !animation.paused;
            }
            if apply_key(&mut request, key, &mut help) {
                break;
            }
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn playback_pause_excludes_elapsed_time_and_allows_camera_changes() {
        let mut animation = Animation::default();
        animation.advance(Duration::from_secs(2));
        animation.paused = true;
        animation.advance(Duration::from_secs(10));
        assert_eq!(animation.time, 2.);
        let mut request = Request::default();
        let original = request.camera.position;
        apply_key(
            &mut request,
            KeyEvent::new(KeyCode::Char('w'), KeyModifiers::NONE),
            &mut false,
        );
        assert_ne!(request.camera.position, original);
        animation.paused = false;
        animation.advance(Duration::from_secs(1));
        assert_eq!(animation.time, 3.);
    }
    #[test]
    fn controls_change_camera_settings_and_reset_without_reusing_generation() {
        let mut r = Request::default();
        let mut help = false;
        let original = r.camera.position;
        for c in ['w', ']', '+', '.', '2'] {
            assert!(!apply_key(
                &mut r,
                KeyEvent::new(KeyCode::Char(c), KeyModifiers::NONE),
                &mut help
            ));
        }
        assert_ne!(r.camera.position, original);
        assert!(r.exposure > 2.);
        assert!(r.bloom > 0.65);
        assert_eq!(r.render_scale.multiplier(), 2.);
        let generation = r.generation;
        apply_key(
            &mut r,
            KeyEvent::new(KeyCode::Char('r'), KeyModifiers::NONE),
            &mut help,
        );
        assert_eq!(r.camera.position, original);
        assert_eq!(r.exposure, 2.);
        assert!(r.generation > generation);
        assert!(apply_key(
            &mut r,
            KeyEvent::new(KeyCode::Char('c'), KeyModifiers::CONTROL),
            &mut help
        ));
    }
}
