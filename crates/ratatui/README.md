# austindelic-blackhole-ratatui

A Ratatui 0.30 widget that draws completed Blackhole cell frames. Rendering only maps cells into the buffer; it never initializes a GPU, submits work, polls a device or locks a worker.

```rust,no_run
use austindelic_blackhole::CellFrame;
use austindelic_blackhole_ratatui::Blackhole;
use ratatui::{buffer::Buffer, layout::Rect, widgets::Widget};
let completed = CellFrame::default(); // Obtain from Worker::take_frame outside drawing.
let area = Rect::new(0, 0, 80, 24);
let mut buffer = Buffer::empty(area);
Blackhole::new(&completed).render(area, &mut buffer);
```

`Blackhole::new(&frame)` scales the frame into the render area and clips safely to the buffer. To paint a dimmed panel using the same scene coordinates, use `.viewport(full_scene_rect).brightness(0.15).preserve_background(true)` and render into the panel rectangle. Brightness is a 0–1 foreground multiplier; by default the widget paints black backgrounds.

Keep the latest completed `CellFrame` in application state, call `Worker::request` on application updates, and drain `Worker::take_frame` before drawing. Reject stale `generation` values after viewport/settings changes. The `austindelic-blackhole-cli` package is a complete example.

GPL-3.0-only. See LICENSE and NOTICE.md.
