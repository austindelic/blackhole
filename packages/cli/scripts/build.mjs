import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, readdir, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import '../../blackhole/scripts/embed.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=path.resolve(root,'../blackhole');
execFileSync(process.execPath,[path.resolve(root,'../../integrations/ghostty/scripts/generate.mjs'),'--check'],{stdio:'inherit'});
const files={};
async function collect(dir){for(const entry of await readdir(path.join(source,dir),{withFileTypes:true})){const rel=path.posix.join(dir,entry.name);if(entry.isDirectory()) await collect(rel);else files[rel]=rel.endsWith('.woff2')?{base64:(await readFile(path.join(source,rel))).toString('base64')}:await readFile(path.join(source,rel),'utf8');}}
for(const dir of ['src','shaders','fonts']) await collect(dir);
for(const name of ['fonts/DepartureMono-OFL-1.1.txt','fonts/DSEG-OFL-1.1.txt','routes.json','LICENSE','NOTICE.md']) files[name]=await readFile(path.join(source,name),'utf8');
files['tooling/webgpu/port-shaders.mjs']=await readFile(path.join(source,'tooling/webgpu/port-shaders.mjs'),'utf8');
files['scripts/embed.mjs']=await readFile(path.join(source,'scripts/embed.mjs'),'utf8');
files['SOURCE_VERSION.json']=JSON.stringify({package:'@austindelic/blackhole',version:'0.1.0',license:'GPL-3.0-only'},null,2)+'\n';
files['README.md']='# Editable Blackhole source\n\nGenerated from @austindelic/blackhole 0.1.0. Import mountBlackHole from ./src/index or BlackHole from ./src/react. React is needed only for the React entry. Host must have a nonzero height. All shaders and fonts are embedded in editable TS modules under src/embedded; edit canonical shaders and run `node scripts/embed.mjs` from this copied directory to regenerate embedded source. No raw loader or package runtime dependency is required. Preserve LICENSE and NOTICE.md when redistributing.\n';
files['README.md'] += "\n\nAfter editing canonical GLSL, regenerate WGSL with pinned Naga, then embed both backends (run from this copied directory):\n\n```sh\ncargo install naga-cli --version 27.0.0 --locked --root .blackhole-tools\nnode tooling/webgpu/port-shaders.mjs .blackhole-tools/bin/naga\nnode scripts/embed.mjs\n```\n\nThe generator and shader paths are preserved from the canonical package. On Windows, use `.blackhole-tools/bin/naga.exe`. Font-only changes need only the embedding command. No compiler is shipped to the browser.\n";
await mkdir(path.join(root,'templates'),{recursive:true});
await writeFile(path.join(root,'templates/source.json'),JSON.stringify(files));
// The site task owns the integration; require it for release builds.
await mkdir(path.join(root,'integrations/ghostty'),{recursive:true});
const integration=path.resolve(root,'../../integrations/ghostty');
for(const name of ['blackhole-scene.glsl','blackhole-analysis.glsl','blackhole.glsl','DepartureMono-OFL-1.1.txt','README.md']) await cp(path.join(integration,name),path.join(root,'integrations/ghostty',name));
await cp(path.join(source,'LICENSE'),path.join(root,'LICENSE'));
await cp(path.join(source,'NOTICE.md'),path.join(root,'NOTICE.md'));
