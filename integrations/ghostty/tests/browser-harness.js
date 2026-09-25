const canvas = document.querySelector("#scene");
const gl = canvas.getContext("webgl2", {
  preserveDrawingBuffer: true,
  antialias: false,
});
const vertex =
  "#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
const header =
  "#version 300 es\nprecision highp float;precision highp int;uniform vec3 iResolution;uniform float iTime;uniform int iFrame;uniform sampler2D iChannel0;uniform vec3 iBackgroundColor;out vec4 color;\n";
function compile(type, source) {
  const s = gl.createShader(type);
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw Error(gl.getShaderInfoLog(s));
  return s;
}
function program(source) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl.VERTEX_SHADER, vertex));
  gl.attachShader(
    p,
    compile(
      gl.FRAGMENT_SHADER,
      header + source + "\nvoid main(){mainImage(color,gl_FragCoord.xy);}",
    ),
  );
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    throw Error(gl.getProgramInfoLog(p));
  return p;
}
const shaders = await Promise.all(
  ["blackhole-scene.glsl", "blackhole-analysis.glsl", "blackhole.glsl"].map(
    (f) => fetch(f).then((r) => r.text()),
  ),
);
const programs = shaders.map(program);
const rawProgram = program(
  shaders[2].replace("void mainImage(", "void unusedMain(") +
    "\nvoid mainImage(out vec4 c,in vec2 p){bhReadAnalysis(p);c=vec4(cellColor.rgb,1.0);}",
);
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
  gl.STATIC_DRAW,
);
let textures = [];
let fbo;
function texture(w, h, data) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    w,
    h,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    data,
  );
  return t;
}
window.renderGhostty = async function (
  w,
  h,
  text = false,
  time = 0,
  raw = false,
) {
  canvas.width = w;
  canvas.height = h;
  gl.viewport(0, 0, w, h);
  textures.forEach((t) => gl.deleteTexture(t));
  if (fbo) gl.deleteFramebuffer(fbo);
  const term = document.createElement("canvas");
  term.width = w;
  term.height = h;
  const ctx = term.getContext("2d");
  ctx.fillStyle = "#080807";
  ctx.fillRect(0, 0, w, h);
  if (text) {
    ctx.fillStyle = "#e8e2d8";
    ctx.font = `${h > 1200 ? 36 : 18}px monospace`;
    ctx.fillText("BLACKHOLE — terminal text remains intact 0123456789", 30, 50);
    ctx.fillStyle = "#39527b";
    ctx.fillRect(30, 80, 400, 30);
    ctx.fillStyle = "#fff";
    ctx.fillText("selection / cursor / antialiasing", 30, 102);
  }
  const input = ctx.getImageData(0, 0, w, h).data;
  const flipped = new Uint8Array(input.length);
  for (let y = 0; y < h; y++)
    flipped.set(
      input.subarray(y * w * 4, (y + 1) * w * 4),
      (h - 1 - y) * w * 4,
    );
  textures = [texture(w, h, flipped), texture(w, h, null), texture(w, h, null)];
  fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    textures[1],
    0,
  );
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
    throw Error("incomplete framebuffer");
  const renderStart = performance.now();
  const times = [];
  const ext = gl.getExtension("EXT_disjoint_timer_query_webgl2");
  const queries = [];
  const totalQuery = gl.createQuery();
  if (ext) gl.beginQuery(ext.TIME_ELAPSED_EXT, totalQuery);
  for (let pass = 0; pass < 3; pass++) {
    const p = raw && pass === 2 ? rawProgram : programs[pass];
    gl.useProgram(p);
    const a = gl.getAttribLocation(p, "p");
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    gl.uniform3f(gl.getUniformLocation(p, "iResolution"), w, h, 1);
    gl.uniform1f(gl.getUniformLocation(p, "iTime"), time);
    gl.uniform1i(gl.getUniformLocation(p, "iFrame"), 0);
    gl.uniform3f(
      gl.getUniformLocation(p, "iBackgroundColor"),
      8 / 255,
      8 / 255,
      7 / 255,
    );
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures[pass]);
    gl.uniform1i(gl.getUniformLocation(p, "iChannel0"), 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, pass < 2 ? fbo : null);
    if (pass < 2)
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        textures[pass + 1],
        0,
      );
    const start = performance.now();
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.finish();
    times.push(performance.now() - start);
    if (gl.getError()) throw Error("draw error");
  }
  if (ext) {
    gl.endQuery(ext.TIME_ELAPSED_EXT);
    queries.push(totalQuery);
  }
  const pixels = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  const renderMs = performance.now() - renderStart;
  let changed = 0,
    foreground = 0,
    badForeground = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    if (
      Math.max(
        Math.abs(flipped[i] - 8),
        Math.abs(flipped[i + 1] - 8),
        Math.abs(flipped[i + 2] - 7),
      ) > 1.5
    ) {
      foreground++;
      if (
        pixels[i] !== flipped[i] ||
        pixels[i + 1] !== flipped[i + 1] ||
        pixels[i + 2] !== flipped[i + 2]
      )
        badForeground++;
    }
    if (pixels[i] > 20) changed++;
  }
  for (const q of queries) {
    while (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE))
      await new Promise((r) => setTimeout(r, 20));
  }
  const gpuMs = queries.map(
    (q) => gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6,
  );
  const disjoint = ext ? gl.getParameter(ext.GPU_DISJOINT_EXT) : null;
  queries.forEach((q) => gl.deleteQuery(q));
  let diskBright = 0;
  for (let y = Math.floor(h * 0.45); y < Math.floor(h * 0.66); y++)
    for (let x = Math.floor(w * 0.34); x < Math.floor(w * 0.54); x++)
      if (pixels[((h - 1 - y) * w + x) * 4] > 100) diskBright++;
  return {
    diskBright,
    size: [w, h],
    renderMs,
    gpuMs,
    disjoint,
    ms: times,
    foreground,
    badForeground,
    brightPixels: changed,
  };
};
window.harnessReady = true;
window.inspectCell = (x, y) => {
  const w = canvas.width,
    h = canvas.height;
  const scale = h > 1200 ? 2 : 1;
  const rw = Math.floor((w * 0.85) / scale),
    rh = Math.floor((h * 0.85) / scale);
  const sw = Math.ceil(rw / 6) * 2,
    sh = Math.ceil(rh / 6) * 2;
  const cw = (6 * w) / rw,
    ch = (9 * h) / rh;
  const cellx = Math.floor(x / cw),
    celly = Math.floor((h - y) / ch),
    cols = Math.ceil(w / cw);
  const start = sw * sh * 3 + (celly * cols + cellx) * 8;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    textures[2],
    0,
  );
  const a = [];
  for (let i = 0; i < 8; i++) {
    const p = new Uint8Array(4);
    gl.readPixels(
      (start + i) % w,
      Math.floor((start + i) / w),
      1,
      1,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      p,
    );
    a.push(p[3]);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { cellx, celly, a };
};
