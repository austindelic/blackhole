//! Display completed frames. No GPU operations, worker locks, or waits occur in rendering.
use austindelic_blackhole::CellFrame;
use ratatui::{buffer::Buffer, layout::Rect, style::Color, widgets::Widget};

/// A borrowed, completed frame clipped to the available terminal rectangle.
pub struct Blackhole<'a> {
    frame: &'a CellFrame,
    viewport: Option<Rect>,
    brightness: f32,
    preserve_background: bool,
}
impl<'a> Blackhole<'a> {
    pub fn new(frame: &'a CellFrame) -> Self {
        Self {
            frame,
            viewport: None,
            brightness: 1.,
            preserve_background: false,
        }
    }
    /// Map frame coordinates to this full viewport, even when rendering a smaller region.
    pub fn viewport(mut self, viewport: Rect) -> Self {
        self.viewport = Some(viewport);
        self
    }
    /// Multiply foreground RGB channels by a clamped 0..=1 factor.
    pub fn brightness(mut self, brightness: f32) -> Self {
        self.brightness = brightness.clamp(0., 1.);
        self
    }
    /// Keep existing cell backgrounds when compositing panels over the scene.
    pub fn preserve_background(mut self, preserve: bool) -> Self {
        self.preserve_background = preserve;
        self
    }
}
impl Widget for Blackhole<'_> {
    fn render(self, area: Rect, buf: &mut Buffer) {
        let viewport = self.viewport.unwrap_or(area);
        if viewport.width == 0
            || viewport.height == 0
            || self.frame.width == 0
            || self.frame.height == 0
        {
            return;
        }
        let clipped = area.intersection(buf.area).intersection(viewport);
        for y in clipped.y..clipped.bottom() {
            for x in clipped.x..clipped.right() {
                let sx = u32::from(x - viewport.x) * u32::from(self.frame.width)
                    / u32::from(viewport.width);
                let sy = u32::from(y - viewport.y) * u32::from(self.frame.height)
                    / u32::from(viewport.height);
                let index = (sy * u32::from(self.frame.width) + sx) as usize;
                if let Some(cell) = self.frame.cells.get(index) {
                    let [r, g, b] = cell.rgb.map(|v| (f32::from(v) * self.brightness) as u8);
                    let dest = &mut buf[(x, y)];
                    dest.set_char(cell.glyph).set_fg(Color::Rgb(r, g, b));
                    if !self.preserve_background {
                        dest.set_bg(Color::Black);
                    }
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use austindelic_blackhole::Cell;
    #[test]
    fn region_uses_full_viewport_mapping_and_preserves_panel_background() {
        let frame = CellFrame {
            width: 2,
            height: 1,
            cells: vec![
                Cell {
                    glyph: 'A',
                    rgb: [100, 80, 60],
                },
                Cell {
                    glyph: 'B',
                    rgb: [200, 160, 120],
                },
            ],
            ..Default::default()
        };
        let mut buf = Buffer::empty(Rect::new(0, 0, 8, 2));
        buf[(6, 1)].set_bg(Color::Blue);
        Blackhole::new(&frame)
            .viewport(Rect::new(0, 0, 8, 2))
            .brightness(0.5)
            .preserve_background(true)
            .render(Rect::new(6, 1, 2, 1), &mut buf);
        assert_eq!(buf[(6, 1)].symbol(), "B");
        assert_eq!(buf[(6, 1)].fg, Color::Rgb(100, 80, 60));
        assert_eq!(buf[(6, 1)].bg, Color::Blue);
        assert_eq!(buf[(0, 0)].symbol(), " ");
    }
    #[test]
    fn clips_offset_frames_and_tolerates_incomplete_buffers() {
        let frame = CellFrame {
            width: 3,
            height: 2,
            cells: vec![
                Cell {
                    glyph: 'A',
                    rgb: [1, 2, 3],
                },
                Cell {
                    glyph: 'B',
                    rgb: [4, 5, 6],
                },
                Cell {
                    glyph: 'C',
                    rgb: [7, 8, 9],
                },
                Cell {
                    glyph: 'D',
                    rgb: [10, 11, 12],
                },
            ],
            ..Default::default()
        };
        let mut buf = Buffer::empty(Rect::new(2, 1, 2, 2));
        Blackhole::new(&frame).render(Rect::new(1, 1, 3, 2), &mut buf);
        assert_eq!(buf[(2, 1)].symbol(), "B");
        assert_eq!(buf[(3, 1)].symbol(), "C");
        assert_eq!(buf[(2, 1)].fg, Color::Rgb(4, 5, 6));
        assert_eq!(buf[(2, 2)].symbol(), " ");
    }
}
