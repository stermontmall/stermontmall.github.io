// Stermont Arcade - gives every product (/p/), category (/c/) and guide (/guides/) page, and products.html, the mobile-shell look: the shell top bar (back, search, cart) and bottom nav.
// Why: these static pages must look like the shell themselves for crawlers and desktop visitors (see seo-shell-redirect.mjs). The bar and nav are added by /shell-chrome.js.
// Runs after every rebuild: product-pages.yml already runs seo-shell-redirect.mjs, which calls runAll() from here at the end (so no workflow edit is needed).
// Idempotent (markers <!--stm-chrome--> and <!--stm-early-->); redirect stubs (meta refresh) are left alone. Only folders the workflow commits (p, c, guides, products.html) are covered.
// To undo: remove the runAll() call at the bottom of seo-shell-redirect.mjs; pages lose the chrome on the next rebuild.
// 2026-11-08 (owner: "it shows the old website first, then the shell"): /p/ and /c/ pages also get a tiny INLINE script as the first thing in <head>.
// shell-chrome.js is loaded with `defer` at the end of <body>, so the static page painted before it could redirect. The inline script redirects phone-width,
// non-crawler visitors immediately (and hides the page while it does), so the static page is never seen. Same rules as the block in shell-chrome.js,
// which stays as a fallback. To undo: set EARLY to '' below (pages lose it on the next rebuild) and delete the <!--stm-early--> scripts.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

export const MARK = '<!--stm-chrome-->';
export const EARLY_MARK = '<!--stm-early-->';
// Reserve the bar height before the script runs (no layout jump), and lift the sticky buy bar above the bottom nav.
export const STYLE = '<style>header{min-height:52px;display:flex;align-items:center}'
  + 'body.stm-chrome .stk{bottom:calc(56px + env(safe-area-inset-bottom,0px));padding-bottom:.6rem}'
  + 'body.stm-chrome main{padding-bottom:9rem}'
  + 'body.stm-chrome footer{margin-bottom:5rem}</style>';
export const SCRIPT = '<script src="/shell-chrome.js?v=2" defer></script>';
// Phone-width real visitors on /p/<slug>.html or /c/<slug>.html go straight to the shell; crawlers, preview bots, desktop and ?classic=1 / ?noshell=1 stay.
export const EARLY = '<script>(function(){try{var l=location,u=navigator.userAgent||"";'
  + 'if(/bot|crawl|spider|slurp|inspectiontool|google-|googleother|mediapartners|facebookexternalhit|facebot|whatsapp|telegram|twitter|linkedin|slack|preview|lighthouse|pagespeed|headless|pingdom|gtmetrix|yandex|baidu|duckduck/i.test(u)'
  + '||/[?&](classic|noshell)=1(&|$)/.test(l.search)||!(innerWidth>0&&innerWidth<=820))return;'
  + 'var t,p=/^\\/p\\/([^\\/]+)\\.html$/.exec(l.pathname),c=/^\\/c\\/([^\\/]+)\\.html$/.exec(l.pathname);'
  + 'if(p){t=l.hash.length>1?l.hash.slice(1):p[1];t=/^[A-Za-z0-9._%~-]+$/.test(t)?"/?product="+t:0}'
  + 'else if(c&&c[1]!=="index"&&/^[A-Za-z0-9._%~-]+$/.test(c[1]))t="/?cat="+c[1];'
  + 'else if(l.pathname==="/c/"||l.pathname==="/c/index.html")t="/?tab=categories";'
  + 'if(t){document.documentElement.style.visibility="hidden";l.replace(t)}}catch(e){}})()</script>';

export function addChrome(html, early = false) {
  if (/http-equiv=["']refresh["']/i.test(html)) return html;     // redirect stub of an extra pack size: untouched
  if (!/<\/head>/i.test(html) || !/<\/body>/i.test(html)) return html;
  let out = html;
  if (early && !out.includes(EARLY_MARK) && EARLY) out = out.replace(/<head(\s[^>]*)?>/i, (m) => m + EARLY_MARK + EARLY);
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
