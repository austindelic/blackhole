void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // The packed scene used alpha; this chain requires background-opacity = 1.
    vec3 terminal = texelFetch(iChannel0, ivec2(fragCoord), 0).rgb;
    // Ghostty 1.3 supplies the configured background color. Preserve EVERY
    // non-background pixel, including antialiased text, selection and cursor.
    float difference = max(max(abs(terminal.r-iBackgroundColor.r), abs(terminal.g-iBackgroundColor.g)), abs(terminal.b-iBackgroundColor.b));
    if (difference > 1.5/255.0) { fragColor = vec4(terminal, 1.0); return; }
    bhAnalyze(fragCoord);
    bhAscii(fragColor, fragCoord);
    fragColor = vec4(mix(terminal, fragColor.rgb, BLACKHOLE_OPACITY), 1.0);
}
