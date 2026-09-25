import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import '../../../integrations/ghostty/tests/generation.test.mjs';
const cli=fileURLToPath(new URL('../bin/blackhole.mjs',import.meta.url));
test('Ghostty export has ordered canonical chain, OFL, dry-run and overwrite protection',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'blackhole-ghostty-'));const out=path.join(dir,'export');
 try{
 const args=['ghostty','--out-dir','export'];
 const dry=execFileSync(process.execPath,[cli,...args,'--dry-run'],{encoding:'utf8',cwd:dir});assert.match(dry,/Would write 7 files/);assert.deepEqual(readdirSync(dir),[]);
 const message=execFileSync(process.execPath,[cli,...args],{encoding:'utf8',cwd:dir});
 for(const name of ['blackhole-scene.glsl','blackhole-analysis.glsl','blackhole.glsl','DepartureMono-OFL-1.1.txt','README.md','LICENSE','NOTICE.md'])assert.ok(readFileSync(path.join(out,name)).length);
 assert.match(message,/background-opacity = 1/);
 assert.ok(message.indexOf('blackhole-scene.glsl')<message.indexOf('blackhole-analysis.glsl'));
 assert.ok(message.indexOf('blackhole-analysis.glsl')<message.indexOf('blackhole.glsl'));
 assert.notEqual(spawnSync(process.execPath,[cli,...args],{cwd:dir}).status,0);
 assert.equal(spawnSync(process.execPath,[cli,...args,'--overwrite'],{cwd:dir}).status,0);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
