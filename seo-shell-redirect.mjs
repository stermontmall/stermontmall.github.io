// Stermont Arcade - REMOVES the visitor redirect from product (/p/) and category (/c/) SEO pages.
// History: until 2026-11-03 this step injected a script that sent every non-crawler browser from /p/<slug>.html to /?product=<slug>
// (and /c/<slug>.html to /?cat=<slug>), i.e. into the JavaScript mobile shell, while crawlers kept the static page.
// Why it was removed: showing crawlers one page and visitors another can look like a "sneaky redirect" to Google, and visitors from
// Google landed on the heavy shell instead of the fast static page. The owner asked for it to stop (2026-11-03).
// Now: the product-pages workflow still runs this file after every rebuild, but it only STRIPS the old scripts (idempotent), so any
// page the generator leaves untouched or rewrites loses the redirect. Visitors stay on /p/ and /c/ pages; the shell is for browsing.
// The shell still shows /p/<slug>.html in its address bar when a product is open (mobile-shell/app.js), so shared links keep working.
// Redirect stubs (pages with a meta refresh, one per extra pack size) are left alone.
// To bring the redirect back: see git history of this file (the commit before this one).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const DIR = process.env.P_DIR || 'p';
export const MARK = '<!--stm-shell-->';
export const CAT_MARK = '<!--stm-shell-cat-->';

// Matches the marker followed by the injected <script>...</script> block (the old SCRIPT / CAT_SCRIPT text, whatever its exact wording).
const PRODUCT_RE = new RegExp(MARK.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '<script>[\\s\\S]*?</script>', 'g');
const CAT_RE = new RegExp(CAT_MARK.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '<script>[\\s\\S]*?</script>', 'g');

export function inject(html) {
  if (/http-equiv=["']refresh["']/i.test(html)) return html;   // redirect stub of an extra pack size: untouched
  return html.replace(PRODUCT_RE, '');
}

export function injectCat(html) {
  if (/http-equiv=["']refresh["']/i.test(html)) return html;
  return html.replace(CAT_RE, '');
}

function run(dir, fn, label) {
  let n = 0, total = 0;
  let files = []; try { files = readdirSync(dir).filter(f => f.endsWith('.html')); } catch (e) { console.log(`seo-shell-redirect: no ${dir}/ folder, skipped`); return; }
  for (const f of files) {
    total++;
    try { const s = readFileSync(`${dir}/${f}`, 'utf8'), o = fn(s); if (o !== s) { writeFileSync(`${dir}/${f}`, o); n++; } }
    catch (e) { console.log('skipped', f, e.message); }
  }
  console.log(`seo-shell-redirect: removed the visitor redirect from ${n} of ${total} ${label} pages`);
}

if (process.argv[1] && process.argv[1].endsWith('seo-shell-redirect.mjs')) {
  run(DIR, inject, 'product');
  run(process.env.C_DIR || 'c', injectCat, 'category');
}
