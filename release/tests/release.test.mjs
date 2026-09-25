import test from 'node:test';
import { publishArgs } from '../common.mjs';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const targets = ['darwin-arm64','darwin-x64','linux-arm64','linux-x64','win32-x64'];
function fixture() {
  const dir = mkdtempSync(path.join(tmpdir(),'blackhole-release-test-'));
  cpSync(path.join(root,'release'),path.join(dir,'release'),{recursive:true});
  writeFileSync(path.join(dir,'release/provenance.json'),JSON.stringify({redistributionReady:false,blockers:['fixture unresolved rights']}));
  for (const f of ['LICENSE','NOTICE.md']) cpSync(path.join(root,f),path.join(dir,f));
  for (const [folder,name] of [['blackhole','blackhole'],['cli','blackhole-cli']]) {
    mkdirSync(path.join(dir,`packages/${folder}`),{recursive:true});
    writeFileSync(path.join(dir,`packages/${folder}/package.json`),JSON.stringify({name:`@austindelic/${name}`,version:'0.1.0',license:'GPL-3.0-only',...(folder==='cli'?{optionalDependencies:Object.fromEntries(targets.map(t=>[`@austindelic/blackhole-${t}`,'0.1.0']))}:{})}));
  }
  for (const [folder,name] of [['renderer','austindelic-blackhole'],['ratatui','austindelic-blackhole-ratatui'],['cli','austindelic-blackhole-cli']]) {
    mkdirSync(path.join(dir,`crates/${folder}`),{recursive:true});
    writeFileSync(path.join(dir,`crates/${folder}/Cargo.toml`),`[package]\nname = "${name}"\nversion = "0.1.0"\nlicense = "GPL-3.0-only"\n`);
  }
  mkdirSync(path.join(dir,'packages/blackhole/shaders'));
  writeFileSync(path.join(dir,'packages/blackhole/shaders/buffer-a.glsl'),'vec3 stars(vec3 dir) { return dir; }');
  mkdirSync(path.join(dir,'artifacts'));
  writeFileSync(path.join(dir,'artifacts/DEPENDENCY_NOTICES.md'),'fixture notices');
  return dir;
}
const run = (dir,args,env={}) => spawnSync(process.execPath,args,{cwd:dir,encoding:'utf8',env:{...process.env,npm_config_cache:path.join(dir,'.npm-cache'),...env}});
test('release refuses unresolved rights, mismatched tag and residual code rain',()=>{
  const dir=fixture();
  try {
    assert.equal(run(dir,['release/check.mjs']).status,0);
    assert.notEqual(run(dir,['release/check.mjs','--publish']).status,0);
    writeFileSync(path.join(dir,'release/provenance.json'),JSON.stringify({redistributionReady:true,blockers:[]}));
    assert.equal(run(dir,['release/check.mjs','--publish'],{RELEASE_TAG:'v0.1.0'}).status,0);
    assert.notEqual(run(dir,['release/check.mjs','--publish'],{RELEASE_TAG:'v0.2.0'}).status,0);
    writeFileSync(path.join(dir,'packages/blackhole/shaders/buffer-a.glsl'),'vec3 rain(vec3 d) { return d; }');
    assert.notEqual(run(dir,['release/check.mjs','--publish']).status,0);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
test('native pack validates executable and carries GPL, font and dependency notices',()=>{
  const dir=fixture();
  try {
    const invalid=path.join(dir,'bad'); writeFileSync(invalid,'not a binary');
    assert.notEqual(run(dir,['release/pack-platform.mjs','linux-x64',invalid]).status,0);
    const binary=Buffer.alloc(2048); binary.set(Buffer.from('7f454c46','hex'));
    writeFileSync(path.join(dir,'elf'),binary);
    const result=run(dir,['release/pack-platform.mjs','linux-x64','elf']);
    assert.equal(result.status,0,result.stderr);
    const tgz=readdirSync(path.join(dir,'artifacts')).find(f=>f.endsWith('.tgz'));
    const listing=execFileSync('tar',['-tzf',path.join(dir,'artifacts',tgz)],{encoding:'utf8'});
    for(const f of ['LICENSE','NOTICE.md','DEPENDENCY_NOTICES.md','licenses/DepartureMono-OFL-1.1.txt','bin/blackhole']) assert(listing.includes(`package/${f}`));
    const pkg=JSON.parse(execFileSync('tar',['-xOzf',path.join(dir,'artifacts',tgz),'package/package.json'],{encoding:'utf8'}));
    assert.equal(pkg.name,'@austindelic/blackhole-linux-x64');
    assert.deepEqual(pkg.os,['linux']); assert.deepEqual(pkg.cpu,['x64']);
    assert.equal(pkg.license,'GPL-3.0-only');
    assert(!listing.includes('.platform-'));
  } finally {rmSync(dir,{recursive:true,force:true});}
});

test('CI requires provenance and local publication requires explicit opt-in',()=>{
  assert.deepEqual(publishArgs('tested.tgz',{githubActions:'true'}), ['publish','tested.tgz','--provenance','--access','public']);
  assert.deepEqual(publishArgs('tested.tgz',{local:true,githubActions:'false'}), ['publish','tested.tgz','--provenance=false','--access','public']);
  assert.throws(()=>publishArgs('tested.tgz',{githubActions:'false'}), /pass --local explicitly/);
  assert.throws(()=>publishArgs('tested.tgz',{local:true,githubActions:'true'}), /cannot disable provenance/);
});
