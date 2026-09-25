import './embed.mjs';
import { build } from 'esbuild';
import { rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../',import.meta.url));
await rm(root+'dist', {recursive:true,force:true});
await build({absWorkingDir:root,entryPoints:['src/index.ts','src/react.tsx','src/components/BlackHoleRuntime.ts'],outdir:'dist',bundle:true,splitting:true,format:'esm',platform:'browser',target:'es2022',external:['react','react/jsx-runtime'],jsx:'automatic',banner:{js:'/* Blackhole 0.1.0 — see bundled notices and shader source attribution. */'}});
execFileSync(process.execPath,[fileURLToPath(import.meta.resolve('typescript/bin/tsc')),'-p',root+'tsconfig.json'],{stdio:'inherit'});

// Keep ambient GPU declarations available to source and declaration consumers.
const { mkdir, copyFile } = await import('node:fs/promises');
await mkdir(root+'dist/types',{recursive:true});
await copyFile(root+'src/types/webgpu.d.ts',root+'dist/types/webgpu.d.ts');
