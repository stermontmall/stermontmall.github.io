// Stermont Arcade - gives every product (/p/), category (/c/) and guide (/guides/) page, and products.html, the mobile-shell look: the shell top bar (back, search, cart) and bottom nav.
// Why: these static pages must look like the shell themselves for crawlers and desktop visitors (see seo-shell-redirect.mjs). The bar and nav are added by /shell-chrome.js.
// Runs after every rebuild: product-pages.yml already runs seo-shell-redirect.mjs, which calls runAll() from here at the end (so no workflow edit is needed).
// Idempotent (marker <!--stm-chrome-->); historical early redirect scripts are stripped. Redirect stubs (meta refresh) are left alone.
// To undo: remove the runAll() call at the bottom of seo-shell-redirect.mjs; pages lose the chrome on the next rebuild.
// 2026-11-19: NO visitor redirect. A script that sends /p/ and /c/ visitors (and Googlebot) to /?product= or /?cat= is a JavaScript redirect,
// which was removed on 2026-11-03 over a suspected ranking drop (see PUBLISHING.md). These pages keep their own address and content for everyone;
// the shell look comes from shell-chrome.js. Links to /?product=<slug> still open the full shell. Any earlier stm-early script is stripped.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

export const MARK = '<!--stm-chrome-->';
export const EARLY_MARK = '<!--stm-early-->';
// Reserve the bar height before the script runs (no layout jump), and lift the sticky buy bar above the bottom nav.
export const STYLE = '<style>header{min-height:52px;display:flex;align-items:center}'
  + 'body.stm-chrome{padding-bottom:calc(64px + env(safe-area-inset-bottom,0px))}'
  + 'body.stm-chrome .stk{bottom:calc(56px + env(safe-area-inset-bottom,0px));padding-bottom:.6rem}'
  + 'body.stm-chrome main{padding-bottom:9rem}'
  + 'body.stm-chrome footer{margin-bottom:5rem}</style>';
export const SCRIPT = '<script src="/shell-chrome.js?v=3" defer></script>';
const EARLY_RE = /<!--stm-early--><script>[\s\S]*?<\/script>/;

export function addChrome(html, early = false) {
  if (/http-equiv=["']refresh["']/i.test(html)) return html;     // redirect stub of an extra pack size: untouched
  if (!/<\/head>/i.test(html) || !/<\/body>/i.test(html)) return html;
  let out = html;
  // Strip any earlier redirect script so previously generated pages lose it on the next rebuild.
  out = out.replace(new RegExp(EARLY_RE.source, 'g'), '');
  if (!out.includes(MARK)) out = out.replace(/<\/head>/i, () => MARK + STYLE + '</head>').replace(/<\/body>/i, () => SCRIPT + '</body>');
  return out;
}

function fix(path, early) {
  const s = readFileSync(path, 'utf8'), o = addChrome(s, early);
  if (o !== s) { writeFileSync(path, o); return true; }
  return false;
}

function run(dir, label, early) {
  let n = 0, total = 0, files = [];
  try { files = readdirSync(dir).filter(f => f.endsWith('.html')); } catch (e) { console.log(`seo-shell-chrome: no ${dir}/ folder, skipped`); return; }
  for (const f of files) {
    total++;
    try { if (fix(`${dir}/${f}`, early)) n++; }
    catch (e) { console.log('skipped', f, e.message); }
  }
  console.log(`seo-shell-chrome: updated ${n} of ${total} ${label} pages`);
}

export function runAll() {
  run(process.env.P_DIR || 'p', 'product', true);
  run(process.env.C_DIR || 'c', 'category', true);
  run(process.env.G_DIR || 'guides', 'guide', false);
  try { console.log(`seo-shell-chrome: products.html ${fix('products.html', false) ? 'updated' : 'unchanged'}`); }
  catch (e) { console.log('seo-shell-chrome: products.html skipped', e.message); }
}

if (process.argv[1] && process.argv[1].endsWith('seo-shell-chrome.mjs')) runAll();
