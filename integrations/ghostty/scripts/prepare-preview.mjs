import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { execFileSync } from "node:child_process";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const require = createRequire(
  new URL("../../../packages/blackhole/package.json", import.meta.url),
);
const { build } = require("esbuild");
const out = path.join(root, "work/ghostty-preview");
mkdirSync(out, { recursive: true });
execFileSync(
  process.execPath,
  [path.join(root, "packages/blackhole/scripts/embed.mjs")],
  { stdio: "inherit" },
);
for (const [source, name] of [
  ["src/components/BlackHoleCore.ts", "core.js"],
  ["src/index.ts", "web.js"],
])
  await build({
    entryPoints: [path.join(root, "packages/blackhole", source)],
    bundle: true,
    format: "esm",
    outfile: path.join(out, name),
  });
for (const name of [
  "blackhole-scene.glsl",
  "blackhole-analysis.glsl",
  "blackhole.glsl",
])
  copyFileSync(
    path.join(root, "integrations/ghostty", name),
    path.join(out, name),
  );
copyFileSync(
  path.join(root, "packages/blackhole/fonts/DepartureMono-Regular.woff2"),
  path.join(out, "DepartureMono-Regular.woff2"),
);
copyFileSync(
  path.join(root, "packages/blackhole/routes.json"),
  path.join(out, "routes.json"),
);
copyFileSync(
  path.join(root, "integrations/ghostty/tests/browser-harness.js"),
  path.join(out, "harness.js"),
);
writeFileSync(
  path.join(out, "index.html"),
  '<!doctype html><style>body{margin:0;background:#080807}canvas{display:block;max-width:100%}</style><canvas id="scene"></canvas><script type="module" src="harness.js"></script>',
);
writeFileSync(
  path.join(out, "reference.html"),
  readFileSync(path.join(root, "integrations/ghostty/tests/reference.html")),
);
console.log(`Preview prepared at ${out}`);
if (process.argv.includes("--serve"))
  createServer((req, res) => {
    const rel = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const file = path.join(out, rel === "/" ? "index.html" : rel);
    if (!file.startsWith(out + path.sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    try {
      const data = readFileSync(file);
      res.setHeader(
        "Content-Type",
        file.endsWith(".js")
          ? "text/javascript"
          : file.endsWith(".html")
            ? "text/html"
            : file.endsWith(".json")
              ? "application/json"
              : "application/octet-stream",
      );
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end();
    }
  }).listen(4330, "127.0.0.1", () => console.log("http://127.0.0.1:4330"));
