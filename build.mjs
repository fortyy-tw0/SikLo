// SikLo web app build. Everything is served from one page: siklo-ph.vercel.app/
//
// Each folder under pages/ with a page.html + page.ts is one screen:
//   page.html  -> its markup becomes <template id="screen-<name>"> in dist/index.html;
//                 its <style> is limited to that screen (:where([data-screen="<name>"]) ...)
//                 and collected into dist/assets/screens-<hash>.css
//   page.ts    -> exports mount(); lib/app.ts registers it with the router
// <name> is the folder's own name (pages/setup/step-1 -> "step-1").
//
//   lib/shell.html  the one HTML page
//   lib/boot.ts     -> assets/js/boot-<hash>.js (classic script in <head>)
//   lib/app.ts      -> assets/js/app-<hash>.js  (all screens + router)
//   lib/shared.css  -> assets/shared-<hash>.css
// Hashed names let browsers cache files for a year (vercel.json).
//
//   node build.mjs           production build into dist/
//   node build.mjs --serve   rebuild on change, serve dist/ at http://localhost:8000
//   node build.mjs --check   run every *.test.ts with node:test
import * as esbuild from 'esbuild';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

const mode = process.argv.includes('--serve') ? 'serve' : process.argv.includes('--check') ? 'check' : 'build';
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? (e.name === 'node_modules' ? [] : walk(join(dir, e.name))) : [join(dir, e.name)]);

// ---------- Checks ----------
if (mode === 'check') {
  const files = [...walk('lib'), ...walk('pages')].filter((f) => f.endsWith('.test.ts'));
  rmSync('.check-build', { recursive: true, force: true });
  await esbuild.build({
    entryPoints: files, bundle: true, platform: 'node', format: 'esm', outbase: '.',
    outdir: '.check-build', outExtension: { '.js': '.mjs' }, logLevel: 'warning',
  });
  const built = files.map((f) => join('.check-build', f.replace(/\.ts$/, '.mjs')));
  const { status } = spawnSync(process.execPath, ['--test', ...built], { stdio: 'inherit' });
  rmSync('.check-build', { recursive: true, force: true });
  process.exit(status ?? 1);
}

const serve = mode === 'serve';
const BROWSERS = ['chrome100', 'safari15', 'firefox100', 'edge100'];
const hash = (data) => createHash('sha256').update(data).digest('hex').slice(0, 8);

// ---------- Screens ----------
const screens = walk('pages').filter((f) => basename(f) === 'page.html').sort().map((file) => {
  const src = readFileSync(file, 'utf8');
  const name = basename(dirname(file));
  const css = [...src.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
  const markup = src.replace(/<!--[\s\S]*?-->/g, '').replace(/<style>[\s\S]*?<\/style>/g, '').trim();
  return { name, css, markup };
});

// Scope each screen's styles to it, then flatten the nesting for older browsers.
// :where() adds no weight, so each rule keeps the same priority it had as a standalone page.
const scoped = screens.map((s) => `:where([data-screen="${s.name}"]){\n${s.css}\n}`).join('\n');
const screensCss = (await esbuild.transform(scoped, { loader: 'css', target: BROWSERS, minify: !serve })).code;

const templates = screens
  .map((s) => `<template id="screen-${s.name}">\n${s.markup}\n</template>`)
  .join('\n');

// ---------- Scripts ----------
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist/assets/js', { recursive: true });
const common = {
  bundle: true, target: BROWSERS, sourcemap: true, minify: !serve, logLevel: serve ? 'info' : 'warning',
  outdir: 'dist/assets/js', entryNames: serve ? '[name]' : '[name]-[hash]', metafile: true,
};
const boot = { ...common, entryPoints: { boot: 'lib/boot.ts' }, format: 'iife' };
const app = { ...common, entryPoints: { app: 'lib/app.ts' }, format: 'esm' };

function writeAssets(names) {
  const sharedCss = readFileSync('lib/shared.css');
  const files = {
    'shared.css': serve ? 'shared.css' : `shared-${hash(sharedCss)}.css`,
    'screens.css': serve ? 'screens.css' : `screens-${hash(screensCss)}.css`,
  };
  writeFileSync(`dist/assets/${files['shared.css']}`, sharedCss);
  writeFileSync(`dist/assets/${files['screens.css']}`, screensCss);
  let html = readFileSync('lib/shell.html', 'utf8')
    .replace('<!-- screens -->', templates)
    .replace('/assets/shared.css', `/assets/${files['shared.css']}`)
    .replace('/assets/screens.css', `/assets/${files['screens.css']}`)
    .replace('/assets/js/boot.js', `/assets/js/${names.boot}`)
    .replace('/assets/js/app.js', `/assets/js/${names.app}`);
  writeFileSync('dist/index.html', html);
}

if (serve) {
  writeAssets({ boot: 'boot.js', app: 'app.js' });
  const contexts = [await esbuild.context(boot), await esbuild.context(app)];
  await Promise.all(contexts.map((c) => c.watch()));
  const { port } = await contexts[1].serve({ servedir: 'dist', port: 8000 });
  console.log(`Serving the app at http://localhost:${port} (changes to page.html or CSS need a restart)`);
} else {
  const names = {};
  for (const result of await Promise.all([esbuild.build(boot), esbuild.build(app)])) {
    for (const [out, info] of Object.entries(result.metafile.outputs)) {
      if (info.entryPoint) names[basename(out).replace(/-[A-Z0-9]+\.js$/, '')] = basename(out);
    }
  }
  writeAssets(names);
  console.log(`Built 1 page with ${screens.length} screens (${screens.map((s) => s.name).join(', ')}) -> dist/`);
}
