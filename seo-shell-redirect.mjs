// Product and category pages stay on their own canonical, crawlable URLs.
// The full mobile-shell app remains available through explicit deep links: /?product=<slug> and /?cat=<slug>.
// Keep the shell's shared top bar and bottom navigation on generated pages, but never JavaScript-redirect every visitor or Googlebot.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const DIR = process.env.P_DIR || 'p';
export const MARK = '<!--stm-shell-route-->';
// Remove every historical route bootstrap that sent /p/ or /c/ visitors to the homepage app.
const LEGACY_ROUTE_RE = /<!--stm-(?:shell|shell-cat|shell-route|early)--><script[\s\S]*?<\/script>/gi;

function stripRoute(html) {
  if (/http-equiv=["']refresh["']/i.test(html)) return html; // keep intentional extra-pack alias stubs unchanged
  return html.replace(LEGACY_ROUTE_RE, '');
}

export function inject(html, _slug) { return stripRoute(html); }
export function injectCat(html, _slug) { return stripRoute(html); }

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
  console.log('seo-shell-redirect: removed legacy route redirects from ' + n + ' of ' + total + ' ' + label + ' pages');
}

if (process.argv[1] && process.argv[1].endsWith('seo-shell-redirect.mjs')) {
  run(DIR, inject, 'product');
  run(process.env.C_DIR || 'c', injectCat, 'category');
  try { (await import('./seo-shell-chrome.mjs')).runAll(); }
  catch (e) { console.log('seo-shell-chrome skipped:', e.message); }
}
