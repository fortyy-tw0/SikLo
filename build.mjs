// Builds the site into dist/:
//   web/**            copied as-is (HTML pages, CSS)
//   src/boot.ts       -> dist/assets/js/boot.js   (classic script, runs in <head> before paint)
//   src/pages/*.ts    -> dist/assets/js/<page>.js (ES modules, one per page)
//
// `node build.mjs --serve` rebuilds on change and serves dist/ at http://localhost:8000
import * as esbuild from 'esbuild';
import { cpSync, readdirSync, rmSync } from 'node:fs';

const serve = process.argv.includes('--serve');
const pages = readdirSync('src/pages').filter((f) => f.endsWith('.ts')).map((f) => `src/pages/${f}`);

rmSync('dist', { recursive: true, force: true });
cpSync('web', 'dist', { recursive: true });

const common = { bundle: true, target: 'es2020', sourcemap: true, minify: !serve, logLevel: 'info' };

const boot = { ...common, entryPoints: ['src/boot.ts'], outfile: 'dist/assets/js/boot.js', format: 'iife' };
const app = { ...common, entryPoints: pages, outdir: 'dist/assets/js', format: 'esm' };

if (serve) {
  const contexts = [await esbuild.context(boot), await esbuild.context(app)];
  await Promise.all(contexts.map((c) => c.watch()));
  const { port } = await contexts[1].serve({ servedir: 'dist', port: 8000 });
  console.log(`Serving dist/ at http://localhost:${port} (HTML/CSS changes in web/ need a restart)`);
} else {
  await Promise.all([esbuild.build(boot), esbuild.build(app)]);
}
