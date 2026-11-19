// Product and category pages retain their own canonical URLs and server-rendered SEO content.
// The route loader hydrates the real mobile shell in place; it never redirects shoppers to the homepage.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const DIR = process.env.P_DIR || 'p';
export const MARK = '<!--stm-full-shell-route-->';
// Remove every historical route bootstrap that sent /p/ or /c/ visitors to the homepage app.
const LEGACY_ROUTE_RE = /<!--stm-(?:shell|shell-cat|shell-route|early)--><script[\s\S]*?<\/script>/gi;

function stripRoute(html) {
  if (/http-equiv=["']refresh["']/i.test(html)) return html; // keep intentional extra-pack alias stubs unchanged
  return html.replace(LEGACY_ROUTE_RE, '');
}

const ROUTE_SCRIPT = '<script src="/shell-route-loader.js?v=2" defer></script>';

function addFullShell(html) {
  const clean = stripRoute(html);
  if (/http-equiv=["']refresh["']/i.test(clean) || clean.includes(MARK)) return clean;
  if (!/<\/body>/i.test(clean)) return clean;
  return clean.replace(/<\/body>/i, MARK + ROUTE_SCRIPT + '</body>');
}

export function inject(html, _slug) { return addFullShell(html); }
export function injectCat(html, _slug) { return addFullShell(html); }

function run(dir, fn, label) {
  let n = 0, total = 0, files = [];
  try { files = readdirSync(dir).filter(f => f.endsWith('.html')); }
  catch (e) { console.log('seo-shell-redirect: no ' + dir + '/ folder, skipped'); return; }
  for (const f of files) {
    total++;
    try {
      const path = dir + '/' + f, before = readFileSync(path, 'utf8');
      const slug = f.replace(/\.html$/i, ''), after = fn(before, slug);
      if (after !== before) { writeFileSync(path, after); n++; }
    } catch (e) { console.log('skipped', f, e.message); }
  }
  console.log('seo-shell-redirect: installed in-place full-shell loader on ' + n + ' of ' + total + ' ' + label + ' pages');
}

if (process.argv[1] && process.argv[1].endsWith('seo-shell-redirect.mjs')) {
  run(DIR, inject, 'product');
  run(process.env.C_DIR || 'c', injectCat, 'category');
  try { (await import('./seo-shell-chrome.mjs')).runAll(); }
  catch (e) { console.log('seo-shell-chrome skipped:', e.message); }
}
