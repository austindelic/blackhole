async page => {
 const assert=(x,m)=>{if(!x)throw Error(m)};
 await page.goto('http://127.0.0.1:5198/?failure-check');
 await page.waitForFunction(()=>window.mount);
 const error=await page.evaluate(async()=>{
  window.view.dispose();window.copied.dispose();window.reactRoot.unmount();
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl2'?null:original.call(this,kind,...args)};
  let failed;try{failed=window.mount(document.querySelector('#fallback'),{backend:'webgl2'});const ready=await failed.ready;return {ready,message:document.querySelector('[role=alert]')?.textContent};}finally{HTMLCanvasElement.prototype.getContext=original;failed?.dispose();}
 });
 assert(error.ready===false && error.message,'visible unsupported-GPU failure');
 const fallback=await page.evaluate(async()=>{
  const old=navigator.gpu.requestAdapter;
  navigator.gpu.requestAdapter=async()=>{throw Error('simulated adapter failure')};
  let scene;try{scene=window.mount(document.querySelector('#fallback'),{backend:'webgpu',quality:'performance',debugStats:true,paused:true});const ready=await scene.ready;return {ready,stats:scene.getStats()};}finally{navigator.gpu.requestAdapter=old;scene?.dispose();}
 });
 assert(fallback.ready && fallback.stats.backend==='webgl2','WebGPU -> WebGL fallback');
 const preserved=await page.evaluate(async()=>{
  const canvas=document.createElement('canvas');canvas.style.cssText='width:120px;height:80px';document.querySelector('#fallback').append(canvas);
  const scene=window.mount(canvas,{backend:'webgl2',quality:'performance',paused:true,debugStats:true});await scene.ready;scene.setCamera({position:[0,3,10]});await new Promise(r=>setTimeout(r,200));scene.dispose();return canvas.isConnected && document.querySelectorAll('#fallback canvas').length===1;
 });
 assert(preserved,'caller canvas restored');
 console.log('PASS: visible GPU error, WebGPU fallback, caller-owned canvas restoration');
}
