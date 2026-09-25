import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, realpathSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { npm } from './common.mjs';
const target = `${process.platform}-${process.arch}`;
const dir = path.resolve(process.argv[2] || 'artifacts');
const files = readdirSync(dir).filter(f => f.endsWith('.tgz'));
const cli = files.find(f => /^austindelic-blackhole-cli-\d/.test(f));
const native = files.find(f => f.startsWith(`austindelic-blackhole-${target}-`));
assert(cli && native, 'Missing host platform or CLI tarball');
const stage = realpathSync(mkdtempSync(path.join(tmpdir(), 'blackhole-packed-')));
try {
  writeFileSync(path.join(stage,'package.json'), '{"private":true}');
  npm(['install','--ignore-scripts','--omit=optional','--offline','--no-audit','--no-fund',path.join(dir,cli),path.join(dir,native)],{cwd:stage});
  const manifest = JSON.parse(await (await import('node:fs/promises')).readFile(path.join(stage,'node_modules/@austindelic/blackhole-cli/package.json'),'utf8'));
  const entry = path.join(stage,'node_modules/@austindelic/blackhole-cli', typeof manifest.bin === 'string' ? manifest.bin : manifest.bin.blackhole);
  const result = execFileSync(process.execPath,[entry,'explore','--version'],{encoding:'utf8',cwd:stage});
  assert(result.includes(manifest.version), result);
  const dry = execFileSync(process.execPath,[entry,'add','--framework','vanilla','--out-dir','example','--dry-run'],{encoding:'utf8',cwd:stage});
  assert(dry.length > 0);
  console.log(`Packed ${target} launcher/native version and scaffold dry-run passed`);
} finally { rmSync(stage,{recursive:true,force:true}); }
