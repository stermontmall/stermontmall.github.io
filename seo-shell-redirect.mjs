// Product and category URLs boot into the full mobile-shell app for every visitor.
// The shell then restores the clean /p/<slug>.html or /c/<slug>.html address with history.replaceState.
// Static product/category HTML remains in the response for crawlers and no-JavaScript fallback.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const DIR = process.env.P_DIR || 'p';
export const MARK = '<!--stm-shell-route-->';
const LEGACY_ROUTE_RE = /<!--stm-(?:shell|shell-cat|shell-route|early)--><script[\\s\\S]*?<\\/script>/gi;

function stripRoute(html) {
  if (/http-equiv=["']refresh["']/i.test(html)) return html;
  return html.replace(LEGACY_ROUTE_RE, '').replace(/<!--stm-shell-route--><script[\\s\\S]*?<\\/script>/gi, '');
}

function routeScript(kind, slug) {
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(slug)) return '';
  const key = kind === 'product' ? 'product' : 'cat';
  const target = '/' + '?' + key + '=' + encodeURIComponent(slug);
  return MARK + '<script>(function(){try{'
    + 'var p=location.pathname,expected=' + JSON.stringify('/' + (kind === 'product' ? 'p/' : 'c/') + slug + '.html') + ';'
    + 'if(p!==expected)return;'
    + 'var target=' + JSON.stringify(target) + '+(location.hash||"");'
    + 'location.replace(target);'
    + '}catch(e){}})();</script>';
}

function injectRoute(html, kind, slug) {
  if (/http-equiv=["']refresh["']/i.test(html)) return html;
  if (!/<\\/head>/i.test(html) || !/<\\/body>/i.test(html)) return html;
  const clean = stripRoute(html);
  const script = routeScript(kind, slug);
  return script ? clean.replace(/<\\/head>/i, script + '</head>') : clean;
}

export function inject(html, slug) { return injectRoute(html, 'product', slug); }
export function injectCat(html, slug) { return injectRoute(html, 'category', slug); }

function run(dir, fn, label) {
  let n = 0, total = 0, files = [];
  try { files = readdirSync(dir).filter(f => f.endsWith('.html')); }
  catch (e) { console.log('seo-shell-redirect: no ' + dir + '/ folder, skipped'); return; }
  for (const f of files) {
    total++;
    try {
      const path = dir + '/' + f, before = readFileSync(path, 'utf8');
      const slug = f.replace(/\\.html$/i, ''), after = fn(before, slug);
      if (after !== before) { writeFileSync(path, after); n++; }
    } catch (e) { console.log('skipped', f, e.message); }
  }
  console.log('seo-shell-redirect: added full mobile-shell route to ' + n + ' of ' + total + ' ' + label + ' pages');
}

if (process.argv[1] && process.argv[1].endsWith('seo-shell-redirect.mjs')) {
  run(DIR, inject, 'product');
  run(process.env.C_DIR || 'c', injectCat, 'category');
  try { (await import('./seo-shell-chrome.mjs')).runAll(); }
  catch (e) { console.log('seo-shell-chrome skipped:', e.message); }
}
