// One component per alpha slot; RGB remains the original terminal, byte for byte.
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    ivec2 pixel = ivec2(fragCoord);
    vec4 terminal = texelFetch(iChannel0, pixel, 0);
    ivec2 size = bhSourceSize();
    int index = pixel.y * int(iResolution.x) + pixel.x;
    int sampleIndex = index / 3;
    float channel = 0.0;
    if (sampleIndex < size.x * size.y) {
        vec2 uv = (vec2(sampleIndex % size.x, sampleIndex / size.x) + 0.5) / vec2(size);
        vec4 traced; bhCanonicalTrace(traced, uv * vec2(size));
        vec3 scene = DisplayColor(traced.rgb * uExposure);
        channel = scene[index % 3];
    }
    fragColor = vec4(terminal.rgb, channel);
}
