import test from "node:test";
import assert from "node:assert/strict";
import {
  defaults,
  readSettings,
  settingsQuery,
  exportConfiguration,
} from "../src/components/settings.mjs";
test("settings survive a shared URL round trip", () => {
  const s = {
    camera: "elevated",
    quality: "mobile-safe",
    ascii: false,
    exposure: 3.25,
    bloom: 1.2,
    paused: true,
  };
  assert.deepEqual(readSettings(settingsQuery(s)), s);
});
test("untrusted URL values are bounded and unknown presets ignored", () => {
  assert.deepEqual(
    readSettings(
      "?camera=__proto__&quality=nope&exposure=Infinity&bloom=-8&ascii=bad",
    ),
    { ...defaults, bloom: 0 },
  );
  assert.equal(readSettings("?exposure=999").exposure, 4);
  assert.equal(readSettings("?exposure=").exposure, 2);
});
test("reduced motion overrides a playing URL", () => {
  assert.equal(readSettings("?paused=0", { reducedMotion: true }).paused, true);
});
test("export is portable package props, with camera disclosure", () => {
  const config = exportConfiguration(defaults);
  assert.equal(config.schemaVersion, 1);
  assert.equal(config.props.exposure, 2);
  assert.equal(config.props.initialCameraPosition.length, 3);
  assert.match(config.note, /not captured/);
  assert.doesNotMatch(JSON.stringify(config), /\/Users\//);
});

test("Desktop is the default and replaces legacy Balanced links", () => {
  assert.equal(readSettings("").quality, "cinematic-ascii");
  assert.equal(
    readSettings("?quality=ascii-balanced").quality,
    "cinematic-ascii",
  );
  assert.equal(
    readSettings("?quality=cinematic-ascii").quality,
    "cinematic-ascii",
  );
  assert.equal(readSettings("?quality=mobile-safe").quality, "mobile-safe");
  assert.equal(exportConfiguration(defaults).props.quality, "cinematic-ascii");
  assert.equal(
    new URLSearchParams(
      settingsQuery(readSettings("?quality=ascii-balanced")),
    ).get("quality"),
    "cinematic-ascii",
  );
});
