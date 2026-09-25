#!/usr/bin/env node
import { readFileSync, lstatSync, mkdirSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(import.meta.url);
export function parse(args){
 const options={command:args.shift() ?? 'help',framework:undefined,outDir:undefined,dryRun:false,overwrite:false};
 if(options.command === 'explore') return {...options,args};
 for(let i=0;i<args.length;i++){
  const flag=args[i];
  if(flag === '--dry-run') options.dryRun=true;
  else if(flag === '--overwrite') options.overwrite=true;
  else if(flag === '--framework' || flag === '--out-dir') {
   const value=args[++i]; if(!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
   options[flag === '--framework'?'framework':'outDir']=value;
  } else throw new Error(`Unknown option: ${flag}`);
 }
 return options;
}
function assertSafe(cwd,destination){
 const rel=path.relative(cwd,destination);
 if(rel === '..' || rel.startsWith('..'+path.sep) || path.isAbsolute(rel)) throw new Error('Output must stay within the current project directory');
 let at=cwd;
 for(const part of rel.split(path.sep).filter(Boolean)){
  at=path.join(at,part);
  try {const stat=lstatSync(at);if(stat.isSymbolicLink()) throw new Error(`Symlink destination rejected: ${at}`);} catch(error){if(error.code!=='ENOENT') throw error;}
 }
}
export function install(files,options,cwd=process.cwd()){
 cwd=realpathSync(cwd);
 const out=options.outDir;
 if(!out || out.split(/[\\/]/).includes('..') || out.includes('\0')) throw new Error('Unsafe output path');
 const destination=path.resolve(cwd,out);
 assertSafe(cwd,destination);
 const entries=Object.entries(files).map(([relative,content])=>{
  if(path.isAbsolute(relative) || relative.split(/[\\/]/).includes('..') || relative.includes('\\')) throw new Error('Invalid bundled source path');
  const target=path.join(destination,relative);
  assertSafe(cwd,target);
  if(existsSync(target)) {if(!lstatSync(target).isFile()) throw new Error(`Not a regular file: ${target}`);if(!options.overwrite) throw new Error(`Refusing to overwrite ${target}; use --overwrite explicitly`);}
  return [target,content];
 });
 if(!options.dryRun) for(const [target,content] of entries){
  // Re-check before each write, and use exclusive creation unless overwrite was requested.
  assertSafe(cwd,target);mkdirSync(path.dirname(target),{recursive:true});
  writeFileSync(target,typeof content==='string'?content:Buffer.from(content.base64,'base64'),{flag:options.overwrite?'w':'wx'});
 }
 return entries.map(([target])=>path.relative(cwd,target));
}
function detect(cwd){
 let pkg={};try{pkg=JSON.parse(readFileSync(path.join(cwd,'package.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
 const deps={...pkg.dependencies,...pkg.devDependencies};
 return deps.react && (deps.vite || deps['@astrojs/react']) ? 'react' : 'vanilla';
}
export function main(args=process.argv.slice(2)){
 if(Number(process.versions.node.split('.')[0])<22) throw new Error('Node.js 22 or newer is required');
 const options=parse([...args]);
 if(options.command==='help' || options.command==='--help' || options.command==='-h'){
  console.log('blackhole add [--framework react|vanilla] [--out-dir src/blackhole] [--dry-run] [--overwrite]\nblackhole explore [native options]\nblackhole ghostty [--out-dir ghostty] [--dry-run] [--overwrite]');return;
 }
 if(options.command==='--version'){console.log('0.1.1');return;}
 if(options.command==='explore') return require('./native.cjs').launch({argv:options.args});
 if(!['add','ghostty'].includes(options.command)) throw new Error(`Unknown command: ${options.command}`);
 let files;
 if(options.command==='add'){
  const framework=options.framework ?? detect(process.cwd());
  if(!['react','vanilla'].includes(framework)) throw new Error('Framework must be react or vanilla');
  files=JSON.parse(readFileSync(path.join(root,'templates/source.json'),'utf8'));
  if(framework==='vanilla') delete files['src/react.tsx'];
  options.outDir ??= 'src/blackhole';
  console.log(`Installing editable ${framework} source (0.1.1)`);
 }else{
  if(options.framework) throw new Error('--framework applies only to add');
  options.outDir ??='ghostty';
  files=Object.fromEntries(['blackhole-scene.glsl','blackhole-analysis.glsl','blackhole.glsl','DepartureMono-OFL-1.1.txt','README.md'].map(name=>[name,readFileSync(path.join(root,'integrations/ghostty',name),'utf8')]));
  Object.assign(files,{'LICENSE':readFileSync(path.join(root,'LICENSE'),'utf8'),'NOTICE.md':readFileSync(path.join(root,'NOTICE.md'),'utf8')});
 }
 const written=install(files,options);
 console.log(`${options.dryRun?'Would write':'Wrote'} ${written.length} files to ${options.outDir}`);
 if(options.command==='ghostty') console.log(`Add this to your Ghostty configuration:\nbackground-opacity = 1\nalpha-blending = native\ncustom-shader = ${JSON.stringify(path.resolve(options.outDir,'blackhole-scene.glsl'))}\ncustom-shader = ${JSON.stringify(path.resolve(options.outDir,'blackhole-analysis.glsl'))}\ncustom-shader = ${JSON.stringify(path.resolve(options.outDir,'blackhole.glsl'))}\ncustom-shader-animation = true`);
}
if(process.argv[1] && realpathSync(process.argv[1])===fileURLToPath(import.meta.url))try{main();}catch(error){console.error(`blackhole: ${error.message}`);process.exitCode=1;}
