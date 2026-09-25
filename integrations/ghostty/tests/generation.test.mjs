import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { generate, root } from "../scripts/generate.mjs";
const read = (p) =>
  readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n");
test("committed Ghostty passes are generated from current canonical sources", () => {
  for (const [name, source] of Object.entries(generate()))
    assert.equal(
      read(`integrations/ghostty/${name}`),
      source,
      `${name} drifted`,
    );
});
test("full canonical physical trace and display are retained, no procedural ring replacement", () => {
  const sources = generate();
  const scene = sources["blackhole-scene.glsl"];
  assert.match(scene, /StepGeodesicRK4_Optimized/);
  assert.match(scene, /void bhCanonicalTrace/);
  assert.match(scene, /float rad = .087\*float\(bhSourceSize\(\).y\)/);
  assert.doesNotMatch(
    scene,
    /diskGlow|BLACKHOLE_LENSING|PrevColor = texelFetch/,
  );
  assert.match(sources["blackhole-analysis.glsl"], /candidateScore/);
  assert.match(sources["blackhole.glsl"], /bhReadAnalysis/);
});
test("packed alpha capacity leaves RGB intact at supported sizes", () => {
  for (const [w, h] of [
    [100, 100],
    [390, 844],
    [1512, 951],
    [3024, 1902],
    [5120, 2880],
  ]) {
    const scale = h > 1200 ? 2 : 1;
    const rw = Math.floor((w * 0.85) / scale),
      rh = Math.floor((h * 0.85) / scale);
    const source = Math.ceil(rw / 6) * 2 * Math.ceil(rh / 6) * 2 * 3;
    const analysis = Math.ceil(rw / 6) * Math.ceil(rh / 9) * 8;
    assert.ok(source + analysis <= w * h, `${w}x${h} packing overflow`);
  }
  const composite = generate()["blackhole.glsl"];
  assert.match(composite, /fragColor = vec4\(terminal, 1.0\); return/);
});
test("embedded raster is canonical Departure Mono with complete alpha/metrics", () => {
  const atlas = JSON.parse(read("integrations/ghostty/src/glyph-atlas.json"));
  assert.equal(atlas.config.fontFamily, "Departure Mono");
  assert.equal(atlas.alpha.length, atlas.width * atlas.height);
  assert.equal(atlas.metrics.length, atlas.config.glyphCount * 4);
  assert.equal(atlas.config.glyphCount, 15);
  assert.deepEqual(atlas.camera.position, [8.613, 3.1586, 21.229]);
  assert.ok(
    atlas.camera.right[1] > 0.4,
    "authored camera tilt must be retained",
  );
  assert.match(
    read("integrations/ghostty/DepartureMono-OFL-1.1.txt"),
    /SIL OPEN FONT LICENSE/,
  );
});
