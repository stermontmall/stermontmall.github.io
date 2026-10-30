// Builds tailwind.css from src.css using only the `tailwindcss` v4 package (no CLI, no PostCSS).
//   npm i -D tailwindcss@4 && node mobile-shell/build-css.mjs
// If tailwindcss is installed elsewhere: TAILWIND_DIR=/path/to/node_modules node build-css.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const roots = [process.env.TAILWIND_DIR, process.cwd(), here].filter(Boolean).map(d => path.join(path.resolve(d), 'noop.js'));
function resolve(id) {
  for (const r of roots) { try { return createRequire(r).resolve(id); } catch {} }
  throw new Error(`Cannot find ${id}. Run: npm i -D tailwindcss@4 (or set TAILWIND_DIR)`);
}

const twMod = await import(pathToFileURL(resolve('tailwindcss')).href);
const compile = twMod.compile ?? twMod.default?.compile;

async function loadStylesheet(id, base) {
  const file = id === 'tailwindcss' ? resolve('tailwindcss/index.css')
    : id.startsWith('.') ? path.resolve(base, id)
    : resolve(id.endsWith('.css') ? id : id + '.css');
  return { path: file, base: path.dirname(file), content: fs.readFileSync(file, 'utf8') };
}
async function loadModule(id, base) {
  const file = id.startsWith('.') ? path.resolve(base, id) : resolve(id);
  const mod = await import(pathToFileURL(file).href);
  return { path: file, base: path.dirname(file), module: mod.default ?? mod };
}

const srcFile = path.join(here, 'src.css');
const compiler = await compile(fs.readFileSync(srcFile, 'utf8'), { base: here, loadStylesheet, loadModule });

// Class candidates = every token in the HTML and JS (unknown ones are ignored).
const candidates = new Set();
for (const f of ['index.html', 'app.js']) {
  if (!fs.existsSync(path.join(here, f))) continue;
  const text = fs.readFileSync(path.join(here, f), 'utf8');
  for (const t of text.split(/[\s"'`<>=;{}]+/)) if (t) candidates.add(t.replace(/[,.:]+$/, ''));
}
let css = compiler.build([...candidates]);

try { // optional minify
  const esbuild = await import(pathToFileURL(resolve('esbuild')).href);
  css = esbuild.transformSync(css, { loader: 'css', minify: true }).code;
} catch { /* leave unminified */ }

fs.writeFileSync(path.join(here, 'tailwind.css'), css);
console.log(`tailwind.css: ${(css.length / 1024).toFixed(1)} KB from ${candidates.size} candidate tokens`);
