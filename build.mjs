// Builds the site into dist/:
//   web/**            copied as-is (HTML pages, CSS)
//   src/boot.ts       -> dist/assets/js/boot-<hash>.js   (classic script, runs in <head> before paint)
//   src/pages/*.ts    -> dist/assets/js/<page>-<hash>.js (ES modules, one per page)
//
// Production file names carry a content hash, so browsers can cache them for a
// year (see vercel.json) and still get new files after every deploy. HTML pages
// keep plain names and are re-checked on each visit.
//
// `node build.mjs --serve` rebuilds on change and serves dist/ at http://localhost:8000 (no hashes)
import * as esbuild from 'esbuild';
import { createHash } from 'node:crypto';
import { cpSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const serve = process.argv.includes('--serve');
const pages = Object.fromEntries(
  readdirSync('src/pages').filter((f) => f.endsWith('.ts')).map((f) => [basename(f, '.ts'), `src/pages/${f}`]),
);

rmSync('dist', { recursive: true, force: true });
cpSync('web', 'dist', { recursive: true });

const common = {
  bundle: true, target: 'es2020', sourcemap: true, minify: !serve, logLevel: serve ? 'info' : 'warning',
  outdir: 'dist/assets/js', entryNames: serve ? '[name]' : '[name]-[hash]', metafile: true,
};
const boot = { ...common, entryPoints: { boot: 'src/boot.ts' }, format: 'iife' };
const app = { ...common, entryPoints: pages, format: 'esm' };

if (serve) {
  const contexts = [await esbuild.context(boot), await esbuild.context(app)];
  await Promise.all(contexts.map((c) => c.watch()));
  const { port } = await contexts[1].serve({ servedir: 'dist', port: 8000 });
  console.log(`Serving dist/ at http://localhost:${port} (HTML/CSS changes in web/ need a restart)`);
} else {
  // Map plain names -> hashed names
  const renames = new Map();
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

  // Point every page at the hashed files
  const htmlFiles = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? (e.name === 'assets' ? [] : htmlFiles(join(dir, e.name))) : e.name.endsWith('.html') ? [join(dir, e.name)] : []);
  for (const file of htmlFiles('dist')) {
    let html = readFileSync(file, 'utf8');
    for (const [plain, hashed] of renames) html = html.replaceAll(plain, hashed);
    const left = html.match(/assets\/(js\/[\w-]+|shared)\.(js|css)"/g)?.filter((m) => !/-[A-Za-z0-9]{8}\./.test(m));
    if (left?.length) throw new Error(`${file} still references unhashed ${left.join(', ')}`);
    writeFileSync(file, html);
  }
  console.log(`Built ${htmlFiles('dist').length} pages, ${renames.size} hashed assets -> dist/`);
}
