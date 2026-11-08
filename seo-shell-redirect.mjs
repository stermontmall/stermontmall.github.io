// Stermont Arcade - product links (/p/<slug>.html) open the mobile shell product view on PHONES, except for search visitors and crawlers.
// History: until 2026-11-03 every non-crawler browser was sent from /p/ and /c/ pages into the shell; it was removed because a ranking drop was
// suspected (see HANDOFF-stop-shell-redirect.md). 2026-11-08: owner asked for shared product links to land in the shell view again.
// To keep the SEO risk small this version is narrower than the old one:
//   - crawlers and link-preview bots (Googlebot, WhatsApp, Facebook, ...) never redirect, so previews and indexing see the static page;
//   - visitors who arrive FROM a search engine (Google, Bing, ...) stay on the static page, like before;
//   - desktop screens stay on the static page; ?classic=1 always stays;
//   - everyone else on a phone/tablet (shared WhatsApp links, direct links, ads) goes to /?product=<slug>, which opens the shell product view.
// Pack-size selection stays in the hash: /p/abasi-5-ec.html#abasi-5-ec-50-ml.
// Category pages (/c/) still have no redirect; their old script is stripped. Redirect stubs (meta refresh, one per extra pack size) are left alone.
// The product-pages workflow runs this file after every rebuild (idempotent), so regenerated pages get the script back.
// To turn it off again: make inject() return html with the script removed (see git history, commit 4d808f6), or delete the SCRIPT line below.
// 2026-11-05: at the end this also runs seo-shell-chrome.mjs (shell top bar + bottom nav on the static pages). To turn that off, remove the runAll() call.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const DIR = process.env.P_DIR || 'p';
export const MARK = '<!--stm-shell-->';
export const CAT_MARK = '<!--stm-shell-cat-->';

export const SCRIPT = MARK + String.raw`<script>(function(){try{var ua=navigator.userAgent||'';
if(/bot|crawl|spider|slurp|facebookexternalhit|facebot|whatsapp|telegram|twitter|linkedin|pinterest|slack|discord|embedly|preview|lighthouse|pagespeed|inspectiontool|adsbot|mediapartners/i.test(ua))return;
if(/[?&]classic=1/.test(location.search))return;
if(!/Android|iPhone|iPad|iPod|Mobile/i.test(ua)&&!(window.matchMedia&&matchMedia('(max-width:820px)').matches))return;
if(/^https?:\/\/([a-z0-9-]+\.)*(google|bing|yahoo|duckduckgo|yandex|baidu|ecosia|brave)\.[a-z.]+\//i.test(document.referrer||''))return;
var h=decodeURIComponent((location.hash||'').slice(1)),s=location.pathname.replace(/^\/p\//,'').replace(/\.html$/,'');
if(!/^[a-z0-9-]+$/i.test(s))return;if(!/^[a-z0-9-]+$/i.test(h))h='';
location.replace('/?product='+encodeURIComponent(h||s));}catch(e){}})();</script>`;

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Matches a marker followed by an injected <script>...</script> block, whatever its exact wording.
const PRODUCT_RE = new RegExp(esc(MARK) + '<script>[\\s\\S]*?</script>', 'g');
const CAT_RE = new RegExp(esc(CAT_MARK) + '<script>[\\s\\S]*?</script>', 'g');

export function inject(html) {
  if (/http-equiv=["']refresh["']/i.test(html)) return html;               // redirect stub of an extra pack size: untouched
  html = html.replace(PRODUCT_RE, '');                                      // idempotent: take any old copy out, put the current one back
  const m = /<meta charset=[^>]*>/i.exec(html) || /<head[^>]*>/i.exec(html); if (!m) return html;   // after the charset tag, which must stay in the first 1024 bytes
  return html.slice(0, m.index + m[0].length) + SCRIPT + html.slice(m.index + m[0].length);
}

export function injectCat(html) {
  if (/http-equiv=["']refresh["']/i.test(html)) return html;
  return html.replace(CAT_RE, '');
}

function run(dir, fn, label, verb) {
  let n = 0, total = 0;
  let files = []; try { files = readdirSync(dir).filter(f => f.endsWith('.html')); } catch (e) { console.log(`seo-shell-redirect: no ${dir}/ folder, skipped`); return; }
  for (const f of files) {
    total++;
    try { const s = readFileSync(`${dir}/${f}`, 'utf8'), o = fn(s); if (o !== s) { writeFileSync(`${dir}/${f}`, o); n++; } }
    catch (e) { console.log('skipped', f, e.message); }
  }
  console.log(`seo-shell-redirect: ${verb} ${n} of ${total} ${label} pages`);
}

if (process.argv[1] && process.argv[1].endsWith('seo-shell-redirect.mjs')) {
  run(DIR, inject, 'product', 'phone redirect set on');
  run(process.env.C_DIR || 'c', injectCat, 'category', 'redirect removed from');
  try { (await import('./seo-shell-chrome.mjs')).runAll(); }   // shell top bar + bottom nav on p, c, guides, products.html
  catch (e) { console.log('seo-shell-chrome skipped:', e.message); }
}
