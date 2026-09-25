export const defaults = Object.freeze({
  camera: "horizon",
  quality: "cinematic-ascii",
  ascii: true,
  exposure: 2,
  bloom: 0.65,
  paused: false,
});
export const cameras = {
  horizon: {
    label: "Horizon",
    position: [8.613, 3.1586, 21.229],
    forward: [-0.2752, -0.0919, -0.957],
  },
  elevated: {
    label: "Above the disk",
    position: [0, 14, 22],
    forward: [0, -0.537, -0.844],
  },
  close: {
    label: "Close approach",
    position: [0, 2, 13],
    forward: [0, -0.152, -0.988],
  },
};
export const qualities = ["mobile-safe", "cinematic-ascii"];
function number(value, fallback, min, max) {
  if (value === null || value.trim() === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}
export function readSettings(search, { reducedMotion = false } = {}) {
  const p = new URLSearchParams(search);
  return {
    camera: Object.hasOwn(cameras, p.get("camera"))
      ? p.get("camera")
      : defaults.camera,
    quality: qualities.includes(p.get("quality"))
      ? p.get("quality")
      : defaults.quality,
    ascii: p.get("ascii") !== "0",
    exposure: number(p.get("exposure"), defaults.exposure, 0.25, 4),
    bloom: number(p.get("bloom"), defaults.bloom, 0, 2),
    paused: reducedMotion || p.get("paused") === "1",
  };
}
export function settingsQuery(s) {
  return new URLSearchParams({
    camera: s.camera,
    quality: s.quality,
    ascii: s.ascii ? "1" : "0",
    exposure: String(s.exposure),
    bloom: String(s.bloom),
    paused: s.paused ? "1" : "0",
  }).toString();
}
export function rendererProps(s) {
  const camera = cameras[s.camera];
  return {
    quality: s.quality,
    asciiEnabled: s.ascii,
    exposure: s.exposure,
    bloomStrength: s.bloom,
    paused: s.paused,
    initialCameraPosition: [...camera.position],
    initialCameraForward: [...camera.forward],
    showControls: false,
    interactive: true,
    animationMode: "off",
  };
}
export function exportConfiguration(s) {
  return {
    schemaVersion: 1,
    package: "@austindelic/blackhole",
    cameraPreset: s.camera,
    note: "Camera preset is exported; pointer navigation is not captured.",
    props: rendererProps(s),
  };
}
