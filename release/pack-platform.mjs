// Adapted from portfolio apps/tui/scripts/pack.cjs; no publication occurs here.
import assert from 'node:assert/strict';
import { chmodSync, copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { json, npm, platforms, sha256 } from './common.mjs';
const [target, binary, destination = 'artifacts'] = process.argv.slice(2);
assert(platforms.includes(target), 'Unknown platform');
const output = path.resolve(destination);
mkdirSync(output, { recursive: true });
const folder = mkdtempSync(path.join(output, '.platform-'));
try {
  const cli = json('packages/cli/package.json');
  const name = `@austindelic/blackhole-${target}`;
  assert.equal(cli.optionalDependencies[name], cli.version, 'Platform version must match CLI');
  const [os, cpu] = target.split('-');
  const bytes = readFileSync(binary);
  const magic = bytes.subarray(0, 4).toString('hex');
  assert(bytes.length > 1024 && (os === 'linux' ? magic === '7f454c46' : os === 'win32' ? magic.startsWith('4d5a') : ['cffaedfe','feedfacf','cafebabe'].includes(magic)), 'Invalid native executable');
  mkdirSync(path.join(folder, 'bin'));
  const bin = `bin/blackhole${os === 'win32' ? '.exe' : ''}`;
  copyFileSync(binary, path.join(folder, bin));
  chmodSync(path.join(folder, bin), 0o755);
  for (const file of ['LICENSE', 'NOTICE.md']) copyFileSync(file, path.join(folder, file));
  mkdirSync(path.join(folder, 'licenses'));
  for (const file of ['NPGS-GPL-3.0.txt','DepartureMono-OFL-1.1.txt','DSEG-OFL-1.1.txt']) copyFileSync(path.join('release/licenses',file),path.join(folder,'licenses',file));
  copyFileSync('artifacts/DEPENDENCY_NOTICES.md', path.join(folder, 'DEPENDENCY_NOTICES.md'));
  writeFileSync(path.join(folder, 'README.md'), `# ${name}\n\nNative executable for @austindelic/blackhole-cli. Corresponding source and build instructions: https://github.com/austindelic/blackhole/tree/v${cli.version}\n`);
  writeFileSync(path.join(folder, 'package.json'), JSON.stringify({ name, version: cli.version, description: 'Blackhole terminal renderer', license: 'GPL-3.0-only', repository: { type: 'git', url: 'git+https://github.com/austindelic/blackhole.git' }, os: [os], cpu: [cpu], files: ['bin/', 'LICENSE', 'NOTICE.md', 'licenses/', 'DEPENDENCY_NOTICES.md', 'README.md'], publishConfig: { access: 'public' } }, null, 2));
  const result = JSON.parse(npm(['pack', folder, '--ignore-scripts', '--json', '--pack-destination', output]))[0];
  assert(result.files.every(f => /^(package.json|README.md|LICENSE|NOTICE.md|DEPENDENCY_NOTICES.md|licenses\/[^/]+|bin\/blackhole(?:\.exe)?)$/.test(f.path)), 'Unexpected packed file');
  writeFileSync(path.join(output, `${target}.json`), JSON.stringify({ name, version: cli.version, filename: result.filename, sha256: sha256(path.join(output, result.filename)), size: result.size }, null, 2));
} finally { rmSync(folder, { recursive: true, force: true }); }
