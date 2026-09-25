// Run immediately after capture-atlas.js; changes require recapturing the font
// raster and camera through the canonical browser functions, not hand editing.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
const root = new URL("../../../", import.meta.url);
const files = [
  "packages/blackhole/fonts/DepartureMono-Regular.woff2",
  "packages/blackhole/src/components/BlackHoleCore.ts",
  "packages/blackhole/src/lib/ascii-analysis.ts",
  "packages/blackhole/routes.json",
];
const hashes = Object.fromEntries(
  files.map((p) => [
    p,
    createHash("sha256")
      .update(
        p.endsWith(".woff2")
          ? readFileSync(new URL(p, root))
          : readFileSync(new URL(p, root), "utf8").replace(/\r\n/g, "\n"),
      )
      .digest("hex"),
  ]),
);
writeFileSync(
  new URL("../src/atlas-inputs.json", import.meta.url),
  JSON.stringify(hashes, null, 2) + "\n",
);
