// Stermont Arcade - gives every product (/p/) and category (/c/) page the mobile-shell look: the shell top bar (back, search, cart) and bottom nav.
// Why: since 2026-11-03 visitors are no longer redirected into the JavaScript shell (see seo-shell-redirect.mjs), so these static pages must look like the shell themselves.
// Everyone (visitors, Googlebot, WhatsApp) gets the SAME page at the SAME URL: nothing is cloaked or redirected. The bar and nav are added by /shell-chrome.js.
// Runs after every rebuild in product-pages.yml. Idempotent (marker <!--stm-chrome-->); redirect stubs (meta refresh) are left alone.
// To undo: remove the step from product-pages.yml; pages lose the chrome on the next rebuild.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

export const MARK = '<!--stm-chrome-->';
// Reserve the bar height before the script runs (no layout jump), and lift the sticky buy bar above the bottom nav.
export const STYLE = '<style>header{min-height:52px;display:flex;align-items:center}'
  + 'body.stm-chrome .stk{bottom:calc(56px + env(safe-area-inset-bottom,0px));padding-bottom:.6rem}'
  + 'body.stm-chrome main{padding-bottom:9rem}'
  + 'body.stm-chrome footer{margin-bottom:5rem}</style>';
export const SCRIPT = '<script src="/shell-chrome.js?v=2" defer></script>';

export function addChrome(html) {
  if (html.includes(MARK)) return html;
  if (/http-equiv=["']refresh["']/i.test(html)) return html;     // redirect stub of an extra pack size: untouched
  if (!/<\/head>/i.test(html) || !/<\/body>/i.test(html)) return html;
  return html.replace(/<\/head>/i, () => MARK + STYLE + '</head>').replace(/<\/body>/i, () => SCRIPT + '</body>');
}

function run(dir, label) {
  let n = 0, total = 0, files = [];
  try { files = readdirSync(dir).filter(f => f.endsWith('.html')); } catch (e) { console.log(`seo-shell-chrome: no ${dir}/ folder, skipped`); return; }
  for (const f of files) {
    total++;
    try { const s = readFileSync(`${dir}/${f}`, 'utf8'), o = addChrome(s); if (o !== s) { writeFileSync(`${dir}/${f}`, o); n++; } }
    catch (e) { console.log('skipped', f, e.message); }
  }
  console.log(`seo-shell-chrome: added the shell top bar and bottom nav to ${n} of ${total} ${label} pages`);
}

if (process.argv[1] && process.argv[1].endsWith('seo-shell-chrome.mjs')) {
  run(process.env.P_DIR || 'p', 'product');
  run(process.env.C_DIR || 'c', 'category');
}
