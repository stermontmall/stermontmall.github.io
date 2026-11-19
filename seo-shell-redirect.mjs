// Product and category URLs launch the full mobile-shell app by default.
// Static HTML retains crawlable metadata and schema; visitors are routed to the app deep link.
// The app restores the canonical /p/ or /c/ URL with history.replaceState after opening the view.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const DIR = process.env.P_DIR || 'p';
export const MARK = '<!--stm-shell-route-->';
const PRODUCT_RE = /<!--stm-shell--><script>[\\s\\S]*?<\\/script>/g;
const CAT_RE = /<!--stm-shell-cat--><script>[\\s\\S]*?<\\/script>/g;
const ROUTE_RE = /<!--stm-shell-route--><script>[\\s\\S]*?<\\/script>/g;

function routeScript(kind, slug) {
  const key = kind === 'product' ? 'product' : 'cat';
  const safeSlug = JSON.stringify(String(slug));
  return MARK + '<script>(function(){var p=' + safeSlug + ';var q=' + JSON.stringify(key) + ';var u="/?"+q+"="+encodeURIComponent(p)+location.hash;if(location.pathname!=="/"||location.search!=="?"+q+"="+encodeURIComponent(p))location.replace(u);})();</script>';
}

function addRoute(html, kind, slug) {
  if (/http-equiv=["']refresh["']/i.test(html)) return html;
  if (!/<\\/head>/i.test(html)) return html;
  const old = html.replace(kind === 'product' ? PRODUCT_RE : CAT_RE, '').replace(ROUTE_RE, '');
  return old.replace(/<\\/head>/i, routeScript(kind, slug) + '</head>');
}

export function inject(html, slug) { return addRoute(html, 'product', slug); }
export function injectCat(html, slug) { return addRoute(html, 'category', slug); }

function run(dir, fn, label) {
  let n = 0, total = 0, files = [];
  try { files = readdirSync(dir).filter(f => f.endsWith('.html')); }
  catch (e) { console.log(`seo-shell-redirect: no ${dir}/ folder, skipped`); return; }
  for (const f of files) {
    total++;
    try {
      const path = `${dir}/${f}`, before = readFileSync(path, 'utf8');
      const slug = f.replace(/\\.html$/i, ''), after = fn(before, slug);
      if (after !== before) { writeFileSync(path, after); n++; }
    } catch (e) { console.log('skipped', f, e.message); }
  }
  console.log(`seo-shell-redirect: routed ${n} of ${total} ${label} pages into the full mobile shell`);
}

if (process.argv[1] && process.argv[1].endsWith('seo-shell-redirect.mjs')) {
  run(DIR, inject, 'product');
  run(process.env.C_DIR || 'c', injectCat, 'category');
  try { (await import('./seo-shell-chrome.mjs')).runAll(); }
  catch (e) { console.log('seo-shell-chrome skipped:', e.message); }
}