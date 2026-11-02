// Bundles each tests/*.test.ts with esbuild (so extensionless imports resolve
// the same way as in the site build), then runs them with node:test.
import * as esbuild from 'esbuild';
import { readdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const files = readdirSync('tests').filter((f) => f.endsWith('.test.ts')).map((f) => `tests/${f}`);
rmSync('.test-build', { recursive: true, force: true });
await esbuild.build({ entryPoints: files, bundle: true, platform: 'node', format: 'esm', outdir: '.test-build', outExtension: { '.js': '.mjs' }, logLevel: 'warning' });
const built = files.map((f) => f.replace(/^tests\/(.*)\.ts$/, '.test-build/$1.mjs'));
const { status } = spawnSync(process.execPath, ['--test', ...built], { stdio: 'inherit' });
rmSync('.test-build', { recursive: true, force: true });
process.exit(status ?? 1);
