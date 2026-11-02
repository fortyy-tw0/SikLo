// SikLo web build.
//
// Every folder under pages/ with a page.html is one page:
//   pages/<path>/page.html -> dist/<path>.html           (pages/index -> dist/index.html)
//   pages/<path>/page.ts   -> dist/assets/js/<name>-<hash>.js   (<name> = last folder name)
//   lib/boot.ts            -> dist/assets/js/boot-<hash>.js     (classic script, runs in <head>)
//   lib/shared.css         -> dist/assets/shared-<hash>.css
// In page.html, refer to the plain names (assets/js/<name>.js, assets/shared.css);
// the build swaps in the hashed names so browsers can cache them for a year.
//
//   node build.mjs           production build into dist/
//   node build.mjs --serve   rebuild on change, serve dist/ at http://localhost:8000 (no hashes)
//   node build.mjs --check   run every *.test.ts with node:test
import * as esbuild from 'esbuild';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';

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

// ---------- Pages ----------
const pages = walk('pages')
  .filter((f) => basename(f) === 'page.html')
  .map((html) => {
    const path = relative('pages', dirname(html)); // e.g. "setup/step-1"
    return { html, ts: join(dirname(html), 'page.ts'), out: join('dist', `${path}.html`), name: basename(path) };
  });

rmSync('dist', { recursive: true, force: true });
for (const p of pages) {
  mkdirSync(dirname(p.out), { recursive: true });
  copyFileSync(p.html, p.out);
}
mkdirSync('dist/assets', { recursive: true });
copyFileSync('lib/shared.css', 'dist/assets/shared.css');

const serve = mode === 'serve';
const common = {
  bundle: true, target: 'es2020', sourcemap: true, minify: !serve, logLevel: serve ? 'info' : 'warning',
  outdir: 'dist/assets/js', entryNames: serve ? '[name]' : '[name]-[hash]', metafile: true,
};
const boot = { ...common, entryPoints: { boot: 'lib/boot.ts' }, format: 'iife' };
const app = { ...common, entryPoints: Object.fromEntries(pages.map((p) => [p.name, p.ts])), format: 'esm' };

if (serve) {
  const contexts = [await esbuild.context(boot), await esbuild.context(app)];
  await Promise.all(contexts.map((c) => c.watch()));
  const { port } = await contexts[1].serve({ servedir: 'dist', port: 8000 });
  console.log(`Serving dist/ at http://localhost:${port} (page.html and CSS changes need a restart)`);
} else {
  const renames = new Map(); // plain name -> hashed name
  for (const result of await Promise.all([esbuild.build(boot), esbuild.build(app)])) {
    for (const [out, info] of Object.entries(result.metafile.outputs)) {
      if (!info.entryPoint) continue;
      const hashed = basename(out);
      renames.set(`assets/js/${hashed.replace(/-[A-Z0-9]+\.js$/, '.js')}`, `assets/js/${hashed}`);
    }
  }
  const css = readFileSync('dist/assets/shared.css');
  const cssName = `assets/shared-${createHash('sha256').update(css).digest('hex').slice(0, 8)}.css`;
  renameSync('dist/assets/shared.css', join('dist', cssName));
  renames.set('assets/shared.css', cssName);

  for (const p of pages) {
    let html = readFileSync(p.out, 'utf8');
    for (const [plain, hashed] of renames) html = html.replaceAll(plain, hashed);
    const left = html.match(/assets\/(js\/[\w-]+|shared)\.(js|css)"/g)?.filter((m) => !/-[A-Za-z0-9]{8}\./.test(m));
    if (left?.length) throw new Error(`${p.html} refers to files that don't exist: ${left.join(', ')}`);
    writeFileSync(p.out, html);
  }
  console.log(`Built ${pages.length} pages -> dist/ (${pages.map((p) => relative('dist', p.out)).join(', ')})`);
}
