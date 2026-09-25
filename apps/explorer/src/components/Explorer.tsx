import { useCallback, useEffect, useRef, useState } from "react";
import { BlackHole, type BlackHoleOptions } from "@austindelic/blackhole/react";
import {
  cameras,
  defaults,
  exportConfiguration,
  readSettings,
  rendererProps,
  settingsQuery,
} from "./settings.mjs";

type Settings = typeof defaults;
export default function Explorer() {
  const [settings, setSettings] = useState<Settings>(() =>
    readSettings(location.search, {
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      mobile: matchMedia("(max-width: 760px)").matches,
    }),
  );
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [generation, setGeneration] = useState(0);
  const [shareLink, setShareLink] = useState("");
  const stage = useRef<HTMLDivElement>(null);
  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(
    (message: string | null) => setError(message),
    [],
  );
  const update = (patch: Partial<Settings>) =>
    setSettings((s) => ({ ...s, ...patch }));
  const reset = useCallback(() => {
    setSettings(
      readSettings("", {
        reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
        mobile: matchMedia("(max-width: 760px)").matches,
      }),
    );
    setGeneration((n) => n + 1);
    setReady(false);
    setError(null);
    setNotice("View reset.");
  }, []);
  useEffect(() => {
    const url = new URL(location.href);
    url.search = settingsQuery(settings);
    history.replaceState(null, "", url);
    setShareLink("");
  }, [settings]);
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        (event.target instanceof HTMLElement &&
          (event.target.closest("input,select,textarea,button,a") ||
            event.target.isContentEditable))
      )
        return;
      if (event.code === "Space") {
        event.preventDefault();
        setSettings((s) => ({ ...s, paused: !s.paused }));
      }
      if (event.key === "Home") {
        event.preventDefault();
        reset();
      }
    };
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => {
      if (reduced.matches) setSettings((s) => ({ ...s, paused: true }));
    };
    window.addEventListener("keydown", keyboard);
    reduced.addEventListener("change", change);
    return () => {
      window.removeEventListener("keydown", keyboard);
      reduced.removeEventListener("change", change);
    };
  }, [reset]);
  useEffect(() => {
    if (ready || error) return;
    const id = window.setTimeout(
      () =>
        setNotice(
          "Still preparing the GPU. If no image appears, try another browser or reset the view.",
        ),
      15000,
    );
    return () => clearTimeout(id);
  }, [ready, error, generation]);
  async function share() {
    const url = location.href;
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Preset link copied. Free camera movement is not included.");
    } catch {
      setShareLink(url);
      setNotice("Copy the link below to share this preset.");
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob(
        [JSON.stringify(exportConfiguration(settings), null, 2) + "\n"],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "blackhole.config.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Configuration exported. Includes the selected camera preset.");
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stage.current?.requestFullscreen();
    } catch {
      setNotice(
        "Fullscreen is unavailable in this browser. The explorer already fills the available window.",
      );
    }
  }
  return (
    <div className="observatory" ref={stage}>
      <div
        className="viewport"
        aria-label="Interactive black hole renderer"
        tabIndex={0}
      >
        <img
          className="scene-fallback"
          src="/images/black-hole-mobile.webp"
          alt="Static amber black hole render"
          hidden={ready && !error}
        />
        {!error && (
          <BlackHole
            key={generation}
            {...(rendererProps(settings) as BlackHoleOptions)}
            initialCameraPosition={
              cameras[settings.camera].position as [number, number, number]
            }
            initialCameraForward={
              cameras[settings.camera].forward as [number, number, number]
            }
            className="scene"
            onReady={onReady}
            onError={onError}
          />
        )}
        <div className="viewport-top">
          <span className="eyebrow">OBSERVATORY / 001</span>
          <button
            className="icon-button"
            onClick={fullscreen}
            aria-label="Toggle fullscreen"
          >
            ⛶ <span>Fullscreen</span>
          </button>
        </div>
        <div className="viewport-bottom">
          <div>
            <h1>
              At the edge
              <br />
              of everything.
            </h1>
            <p>
              {settings.ascii
                ? "LIGHT, TRANSLATED INTO CHARACTERS."
                : "LIGHT, BEFORE THE GLYPHS."}
            </p>
          </div>
          <span className="live-state">
            <i className={settings.paused ? "" : "status-dot"} />
            {error
              ? "STATIC FALLBACK"
              : !ready
                ? "INITIALIZING"
                : settings.paused
                  ? "PAUSED"
                  : "LIVE RENDER"}
          </span>
        </div>
        {!ready && !error && (
          <p className="render-status" role="status">
            Preparing the renderer…
          </p>
        )}
        {error && (
          <div className="render-error" role="alert">
            <strong>Live rendering is unavailable.</strong>
            <p>{error}</p>
            <p>A static preview is shown. Try a browser with WebGL2 support.</p>
            <button onClick={reset}>Retry renderer</button>
          </div>
        )}
      </div>
      <aside className="control-panel" aria-label="Explorer controls">
        <div className="panel-heading">
          <span className="eyebrow">YOUR OBSERVATORY</span>
          <span className="muted">[ 01 ]</span>
        </div>
        <h2>Find your orbit.</h2>
        <p className="panel-description">
          A few controls. A different universe.
        </p>
        <label className="field">
          Camera preset
          <select
            value={settings.camera}
            onChange={(e) =>
              update({ camera: e.target.value as Settings["camera"] })
            }
          >
            {Object.entries(cameras).map(([id, c]) => (
              <option key={id} value={id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="mode-field">
          <legend>Render mode</legend>
          <div className="segmented">
            <button
              aria-pressed={settings.ascii}
              onClick={() => update({ ascii: true })}
            >
              ASCII
            </button>
            <button
              aria-pressed={!settings.ascii}
              onClick={() => update({ ascii: false })}
            >
              Raw light
            </button>
          </div>
        </fieldset>
        <label className="field">
          Quality
          <select
            value={settings.quality}
            onChange={(e) =>
              update({ quality: e.target.value as Settings["quality"] })
            }
          >
            <option value="mobile-safe">Low / mobile</option>
            <option value="ascii-balanced">Balanced</option>
            <option value="cinematic-ascii">Cinematic</option>
          </select>
        </label>
        <label className="range-field">
          <span>
            Exposure <output>{settings.exposure.toFixed(2)}</output>
          </span>
          <input
            aria-label="Exposure"
            type="range"
            min="0.25"
            max="4"
            step="0.05"
            value={settings.exposure}
            onChange={(e) => update({ exposure: Number(e.target.value) })}
          />
        </label>
        <label className="range-field">
          <span>
            Bloom <output>{settings.bloom.toFixed(2)}</output>
          </span>
          <input
            aria-label="Bloom"
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={settings.bloom}
            onChange={(e) => update({ bloom: Number(e.target.value) })}
          />
        </label>
        <div className="transport">
          <button
            className="button primary"
            onClick={() => update({ paused: !settings.paused })}
          >
            {settings.paused ? "▶ Play" : "Ⅱ Pause"}
          </button>
          <button className="button" onClick={reset}>
            ↺ Reset
          </button>
        </div>
        <div className="panel-separator" />
        <div className="save-actions">
          <button onClick={share}>
            Copy preset link <span>↗</span>
          </button>
          <button onClick={download}>
            Export JSON <span>↓</span>
          </button>
        </div>
        {shareLink && (
          <label className="field">
            Share link
            <input
              readOnly
              value={shareLink}
              onFocus={(e) => e.target.select()}
            />
          </label>
        )}
        <p className="feedback" role="status" aria-live="polite">
          {notice}
        </p>
        <details className="help">
          <summary>Navigation & shortcuts</summary>
          <p>
            Focus the canvas to navigate. Drag to look. W/S moves forward/back;
            A/D strafes; R/F moves up/down; Q/E rolls. Up/Down arrows adjust
            movement speed. Space pauses or resumes. Home resets. On touch
            screens, use camera presets for precise positioning.
          </p>
          <p>
            Links and exports save the selected preset and visual settings, not
            free camera movement. Reduced motion starts paused; press Play when
            ready.
          </p>
        </details>
        <a className="panel-docs" href="/docs/">
          Make it your own <span>Read the docs →</span>
        </a>
      </aside>
    </div>
  );
}
