import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
export const platforms = ['darwin-arm64', 'darwin-x64', 'linux-arm64', 'linux-x64', 'win32-x64'];
export const json = p => JSON.parse(readFileSync(p, 'utf8'));
export const sha256 = p => createHash('sha256').update(readFileSync(p)).digest('hex');
export function npm(args, options = {}) {
  // npm.cmd cannot be executed directly without a shell on Windows.
  const cli = process.env.NPM_CLI_JS || process.env.npm_execpath;
  if (cli) return execFileSync(process.execPath, [cli, ...args], { encoding: 'utf8', ...options });
  if (process.platform === 'win32') throw new Error('Set NPM_CLI_JS to npm/bin/npm-cli.js');
  return execFileSync('npm', args, { encoding: 'utf8', ...options });
}

// Local first publication is explicit; CI must never opt out of provenance.
export function publishArgs(file, { local = false, githubActions = process.env.GITHUB_ACTIONS } = {}) {
  if (local && githubActions === 'true') throw new Error('--local cannot disable provenance in GitHub Actions');
  if (!local && githubActions !== 'true') throw new Error('Outside GitHub Actions, pass --local explicitly to publish without CI provenance');
  return ['publish', file, local ? '--provenance=false' : '--provenance', '--access', 'public'];
}
