import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'src/embedded');
await mkdir(out, {recursive:true});
async function walk(dir) {
 for (const item of await readdir(path.join(root, dir), {withFileTypes:true})) {
  const rel = `${dir}/${item.name}`;
  if (item.isDirectory()) await walk(rel);
  else if (/\.(glsl|wgsl)$/.test(rel)) await writeFile(path.join(out, rel.replaceAll('/', '_')+'.ts'), '// Generated from '+rel+'; edit the canonical shader and run build.\nexport default '+JSON.stringify(await readFile(path.join(root,rel),'utf8'))+';\n');
 }
}
await walk('shaders');
for (const [name, file] of [['routes','routes.json'],['uniform-layout','shaders/webgpu/uniform-layout.json']]) await writeFile(path.join(out,name+'.ts'),'// Generated from '+file+'\nexport default '+await readFile(path.join(root,file),'utf8')+';\n');
const fonts = {};
for (const [family,file] of [['Departure Mono','DepartureMono-Regular.woff2'],['DSEG14Modern','DSEG14Modern-Regular.woff2']]) fonts[family] = 'data:font/woff2;base64,'+(await readFile(path.join(root,'fonts',file))).toString('base64');
await writeFile(path.join(out,'fonts.ts'),'// Generated from bundled OFL-1.1 fonts; see fonts/ notices.\nexport default '+JSON.stringify(fonts)+';\n');
