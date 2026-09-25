// Publish tested archives in protected CI, or explicitly locally for first publication.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { json, npm, platforms, publishArgs } from './common.mjs';
const args = process.argv.slice(2);
const local = args.includes('--local');
assert(args.every(arg => !arg.startsWith('--') || arg === '--local'), 'Unknown publish option');
const positional = args.filter(arg => arg !== '--local');
assert(positional.length <= 1, 'Expected one artifact directory');
// Validate mode before any registry request or partial publication.
publishArgs('', { local });
const dir = path.resolve(positional[0] || 'artifacts');
const version = json('packages/cli/package.json').version;
const names = [...platforms.map(p => `blackhole-${p}`), 'blackhole', 'blackhole-cli'];
const files = readdirSync(dir).filter(f => f.endsWith('.tgz'));
assert.equal(files.length, names.length, 'Unexpected or missing tarballs');
for (const name of names) {
  const file = path.join(dir, `austindelic-${name}-${version}.tgz`);
  const integrity = 'sha512-' + createHash('sha512').update(readFileSync(file)).digest('base64');
  const response = await fetch(`https://registry.npmjs.org/@austindelic%2f${name}/${version}`);
  if (response.ok) {
    assert.equal((await response.json()).dist.integrity, integrity, `Published ${name} differs; never overwrite/relabel artifacts`);
    console.log(`Already published identical @austindelic/${name}@${version}`);
  } else {
    assert.equal(response.status, 404, `Registry lookup failed for ${name}`);
    npm(publishArgs(file, { local }), { stdio: 'inherit' });
  }
}
