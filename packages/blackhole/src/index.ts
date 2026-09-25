import { createRuntimeState, mountBlackHoleRuntime, runtimeOptions } from './components/BlackHoleRuntime';
import { createInitialControls, type Props, type Vec3 } from './components/BlackHoleCore';
export * from './components/BlackHoleCore';
export * from './config/black-hole-animation';
export type BlackHoleOptions = Props & { onError?: (message: string | null) => void; onReady?: () => void };
export type BlackHoleCamera = { position?: Vec3; forward?: Vec3; universeSign?: number };

/** Mount into a sized element, or render into a caller-owned canvas. */
export function mountBlackHole(element: HTMLElement, initial: BlackHoleOptions = {}) {
 if (!element?.ownerDocument) throw new TypeError('mountBlackHole requires a browser DOM element');
 let props = { showControls: false, ...initial, forceActiveRender: initial.forceActiveRender ?? initial.paused === false };
 const doc = element.ownerDocument;
 const callerCanvas = element.tagName === 'CANVAS';
 const originalStyle = element.getAttribute('style');
 const originalLabel = element.getAttribute('aria-label');
 const originalTabIndex = element.getAttribute('tabindex');
 let canvas = callerCanvas ? element as HTMLCanvasElement : doc.createElement('canvas');
 canvas.style.cssText += ';display:block;width:100%;height:100%;background:black';
 canvas.setAttribute('aria-label', 'Interactive black hole shader');
 if (!callerCanvas) element.append(canvas);
 const errorBox = doc.createElement('div');
 errorBox.setAttribute('role','alert');
 errorBox.style.cssText = 'padding:12px;background:#190b0b;color:#ffd5d5;font:12px monospace';
 let disposed = false;
 const onError = (message: string | null) => {
  if (disposed) return;
  errorBox.textContent = message ?? '';
  if (message) { if (callerCanvas) canvas.after(errorBox); else element.append(errorBox); }
  else errorBox.remove();
  props.onError?.(message);
 };
 const state = createRuntimeState(props);
 const runtime = mountBlackHoleRuntime(canvas, state, {
  ...runtimeOptions(props, onError),
  onCanvasReplaced: next => { canvas = next; },
  onReady: () => props.onReady?.(),
 });
 const setPaused = (paused: boolean) => { state.paused = paused; if (!paused) { props.forceActiveRender = true; state.initialProps.forceActiveRender = true; } state.setPaused?.(paused); };
 const controlKeys = new Set(Object.keys(state.controls));
 function update(next: Partial<BlackHoleOptions>) {
  if (disposed) return;
  props = { ...props, ...next };
  state.initialProps = props;
  state.animationMode = props.animationMode ?? 'off';
  state.animationAutoplay = props.animationAutoplay ?? true;
  state.animationRoute = props.animationRoute ?? '/';
  if ('animationAutoplay' in next || 'animationMode' in next) state.animationPlaying = state.animationAutoplay && state.animationMode !== 'off';
  runtime.updateControls(createInitialControls({...props, textSize:props.textSize ?? props.asciiCellSize?.y}));
  if ('paused' in next) setPaused(props.paused ?? false);
  const restart = Object.keys(next).some(key => !controlKeys.has(key) && !['paused','onError','onReady','className','animationRoute','animationAutoplay'].includes(key));
  if (restart) {
   if ('initialCameraPosition' in next || 'initialCameraForward' in next || 'initialUniverseSign' in next) {
    state.resetCameraRequested = true;
   }
   runtime.updateSettings({...runtimeOptions(props,onError), onReady:() => props.onReady?.()});
  } else runtime.updateRoute(state.animationRoute);
 }
 return {
  ready: runtime.ready,
  update,
  updateControls: update,
  setCamera(camera: BlackHoleCamera) {
   if (disposed) return;
   for (const vector of [camera.position,camera.forward]) if (vector && (vector.length !== 3 || !vector.every(Number.isFinite))) throw new TypeError('Camera vectors must contain three finite numbers');
   if (camera.forward && Math.hypot(...camera.forward) === 0) throw new TypeError('Camera forward must be nonzero');
   if (camera.universeSign !== undefined && !Number.isFinite(camera.universeSign)) throw new TypeError('Universe sign must be finite');
   update({ ...(camera.position && {initialCameraPosition:camera.position}), ...(camera.forward && {initialCameraForward:camera.forward}), ...(camera.universeSign !== undefined && {initialUniverseSign:camera.universeSign}) });
  },
  pause() { if (!disposed) setPaused(true); },
  resume() { if (!disposed) setPaused(false); },
  resize() { if (!disposed) state.resize?.(); },
  enterExploration: runtime.enterExploration,
  exitExploration: runtime.exitExploration,
  resetExploration: runtime.resetExploration,
  getExploreRenderSettings: runtime.getExploreRenderSettings,
  updateExploreRenderSettings: runtime.updateExploreRenderSettings,
  snapshot: runtime.snapshot,
  getStats: () => state.stats,
  dispose() {
   if (disposed) return;
   disposed = true;
   runtime.dispose();
   errorBox.remove();
   if (!callerCanvas) canvas.remove();
   else {
    if (canvas !== element) canvas.replaceWith(element);
    if (originalStyle === null) element.removeAttribute('style'); else element.setAttribute('style',originalStyle);
    if (originalTabIndex === null) element.removeAttribute('tabindex'); else element.setAttribute('tabindex',originalTabIndex);
    if (originalLabel === null) element.removeAttribute('aria-label'); else element.setAttribute('aria-label',originalLabel);
   }
  },
 };
}
export type BlackHoleController = ReturnType<typeof mountBlackHole>;
