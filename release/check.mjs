import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { json, platforms } from './common.mjs';
const web = json('packages/blackhole/package.json');
const cli = json('packages/cli/package.json');
assert.equal(web.name, '@austindelic/blackhole');
assert.equal(cli.name, '@austindelic/blackhole-cli');
assert.equal(web.version, cli.version);
assert.match(web.version, /^\d+\.\d+\.\d+$/);
for (const pkg of [web,cli]) {
  assert.notEqual(pkg.private, true);
  assert.equal(pkg.license, 'GPL-3.0-only');
}
assert.deepEqual(cli.optionalDependencies, Object.fromEntries(platforms.map(p => [`@austindelic/blackhole-${p}`,cli.version])));
for (const [folder,name] of [['renderer','austindelic-blackhole'],['ratatui','austindelic-blackhole-ratatui'],['cli','austindelic-blackhole-cli']]) {
  const manifest = readFileSync(`crates/${folder}/Cargo.toml`, 'utf8');
  assert(manifest.includes(`name = "${name}"`));
  assert(manifest.includes(`version = "${cli.version}"`));
  assert(manifest.includes('license = "GPL-3.0-only"'));
}
if (process.env.RELEASE_TAG) assert.equal(process.env.RELEASE_TAG, `v${cli.version}`);
if (process.argv.includes('--publish')) {
  const provenance = json('release/provenance.json');
  assert.equal(provenance.redistributionReady, true, 'Resolve recorded provenance blockers before publishing');
  assert.equal(provenance.blockers.length, 0);
  const shader = readFileSync('packages/blackhole/shaders/buffer-a.glsl','utf8');
  assert(!/\b(?:rain|random_char|rune_line)\s*\(/.test(shader), 'Unverified code rain still present');
}
console.log(`Release metadata consistent: ${cli.version}`);
