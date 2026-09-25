// Blackhole — single-pass Ghostty adaptation, GPL-3.0-only.
// Artistic accretion disk; not the multipass web physics renderer.
// mainImage receives Ghostty's rendered terminal in iChannel0.
// Set BLACKHOLE_LENSING to 1 for the optional distorted-terminal preset.
#ifndef BLACKHOLE_INTENSITY
#define BLACKHOLE_INTENSITY 0.22
#endif
#ifndef BLACKHOLE_SPEED
#define BLACKHOLE_SPEED 0.18
#endif
#ifndef BLACKHOLE_LENSING
#define BLACKHOLE_LENSING 0
#endif
#ifndef BLACKHOLE_LENS_STRENGTH
#define BLACKHOLE_LENS_STRENGTH 0.012
#endif

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 p = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float radius = length(p);
    vec2 terminalUV = uv;
#if BLACKHOLE_LENSING
    // Deliberately small; default preset never displaces terminal glyphs.
    float falloff = exp(-18.0 * radius * radius);
    terminalUV += normalize(p + vec2(0.0001)) * BLACKHOLE_LENS_STRENGTH * falloff;
    terminalUV = clamp(terminalUV, vec2(0.001), vec2(0.999));
#endif
    vec4 terminal = texture(iChannel0, terminalUV);
    float t = iTime * BLACKHOLE_SPEED;
    // Squashed disk + a circular photon-ring impression; no ray marching.
    vec2 disk = vec2(p.x, p.y * 4.2);
    float diskRadius = length(disk);
    float angle = atan(disk.y, disk.x);
    float bands = 0.68 + 0.18 * sin(38.0 * diskRadius - t * 3.0 + angle * 3.0)
                       + 0.14 * sin(67.0 * diskRadius + t * 2.0 - angle * 5.0);
    float diskGlow = exp(-pow((diskRadius - 0.28) * 9.0, 2.0)) * bands;
    float ring = exp(-pow((radius - 0.145) * 72.0, 2.0));
    float halo = exp(-radius * 6.5) * 0.11;
    float horizon = smoothstep(0.128, 0.15, radius);
    float asymmetry = 0.75 + 0.25 * smoothstep(-0.3, 0.3, p.x);
    vec3 amber = vec3(1.0, 0.47, 0.14);
    vec3 light = amber * ((diskGlow * asymmetry + ring * 0.55) * horizon + halo);
    // Protect bright terminal foreground. Best on a dark opaque background.
    float foreground = smoothstep(0.10, 0.34, max(terminal.r, max(terminal.g, terminal.b)));
    float backgroundMask = 1.0 - foreground;
    fragColor = vec4(terminal.rgb + light * clamp(BLACKHOLE_INTENSITY, 0.0, 1.0) * backgroundMask, terminal.a);
}
