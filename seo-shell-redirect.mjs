// Stermont Arcade - sends PEOPLE on a phone from a product page (/p/<slug>.html) into the mobile shell (/?product=<slug>), while crawlers keep the page.
// Why: the shell is one page, so a /?product= link can only preview as the home page. The shell now shows /p/<slug>.html in its address bar
// (so a copied or shared link previews as THIS product, from the head of this page) and the page hands phones back to the shell.
// Runs in .github/workflows/product-pages.yml after the page build (idempotent: the marker below is added once, a rebuilt page gets it again).
// What the script skips (the page stays as it is): crawlers and link-preview bots (Googlebot, Facebook, WhatsApp, ...), desktop screens
// (min-width 900px with a mouse, they use the full page), and an address with ?classic=1. A size can ride in the hash: /p/abasi-5-ec.html#abasi-5-ec-50-ml.
// Redirect stubs (pages with a meta refresh, one per extra pack size) are left alone. To undo: delete this step from the workflow and rebuild.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const DIR = process.env.P_DIR || 'p';
export const MARK = '<!--stm-shell-->';
export const SCRIPT = MARK + `<script>(function(){try{var ua=navigator.userAgent||'';` +
  `if(/bot|crawl|spider|slurp|facebookexternalhit|facebot|whatsapp|telegram|twitter|linkedin|pinterest|slack|discord|embedly|preview|lighthouse|pagespeed|inspectiontool|adsbot|mediapartners/i.test(ua))return;` +
  `if(window.matchMedia&&matchMedia('(min-width:900px) and (pointer:fine)').matches)return;` +
  `if(/[?&]classic=1/.test(location.search))return;` +
  `var h=decodeURIComponent((location.hash||'').slice(1)),s=location.pathname.replace(/^\\/p\\//,'').replace(/\\.html$/,'');` +
  `if(!/^[a-z0-9-]+$/i.test(s))return;if(!/^[a-z0-9-]+$/i.test(h))h='';` +
  `location.replace('/?product='+encodeURIComponent(h||s));}catch(e){}})();</script>`;

export function inject(html) {
  if (/http-equiv=["']refresh["']/i.test(html)) return html;               // redirect stub of an extra pack size
  html = html.split(SCRIPT).join('');                                       // idempotent: take our script out, put it back in the same place
  const m = /<meta charset=[^>]*>/i.exec(html) || /<head[^>]*>/i.exec(html); if (!m) return html;   // after the charset tag, which must stay in the first 1024 bytes
  return html.slice(0, m.index + m[0].length) + SCRIPT + html.slice(m.index + m[0].length);
}

if (process.argv[1] && process.argv[1].endsWith('seo-shell-redirect.mjs')) {
  let n = 0, total = 0;
  for (const f of readdirSync(DIR).filter(f => f.endsWith('.html'))) {
    total++;
    try { const s = readFileSync(`${DIR}/${f}`, 'utf8'), o = inject(s); if (o !== s) { writeFileSync(`${DIR}/${f}`, o); n++; } }
    catch (e) { console.log('skipped', f, e.message); }
  }
  console.log(`seo-shell-redirect: ${n} of ${total} product pages got the phone redirect`);
}
