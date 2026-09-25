// Edit these values identically in ALL THREE generated files, then reload Ghostty.
#ifndef BLACKHOLE_PIXEL_SCALE
// Ghostty has no pixel-ratio uniform. Override with 1.0 / 2.0 for your display.
#define BLACKHOLE_PIXEL_SCALE (iResolution.y > 1200.0 ? 2.0 : 1.0)
#endif
#ifndef BLACKHOLE_EXPOSURE
#define BLACKHOLE_EXPOSURE 2.0
#endif
#ifndef BLACKHOLE_TIME_SCALE
#define BLACKHOLE_TIME_SCALE 2.0
#endif
#ifndef BLACKHOLE_OPACITY
#define BLACKHOLE_OPACITY 1.0
#endif
#define uQuality (0.58 * min(iResolution.x,1.0))
#define uTemporalJitter 0.0
#define uUniverseSign 1.0
#define uCanvasResolution (iResolution.xy)
#define uAsciiCellSize (vec2(6.0, 9.0) * iResolution.xy / bhRenderSize())
#define uGlyphCount 15
#define uAsciiBrightness 0.0
#define uAsciiContrast 1.0
#define uPaletteMode 0
#define uShadowColor vec3(0.0)
#define uMidColor vec3(0.0)
#define uHighlightColor vec3(1.0)
#define uAsciiMix 1.0
#define uExposure BLACKHOLE_EXPOSURE
#define uBloomStrength 0.0
vec2 bhRenderSize() { return max(vec2(1.0), floor(iResolution.xy * 0.85 / BLACKHOLE_PIXEL_SCALE)); }
ivec2 bhSourceSize() { return max(ivec2(1), ivec2(ceil(bhRenderSize() / 6.0)) * 2); }
