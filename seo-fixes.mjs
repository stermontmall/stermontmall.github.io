// Stermont Arcade - small clean-ups on built product pages. Runs from seo-overrides.mjs, after seo-kenya.mjs and seo-product-extras.mjs.
// 1) Meta description: if it says "Buy <product> in Kenya for KSh X. Buy <product>..." the second "Buy ..." sentence is dropped (the product name was repeated).
// 2) Product / ProductGroup JSON-LD: the description is rebuilt from the page's own paragraphs, so headings no longer run into the text.
//    If the page has no paragraphs in its description, the JSON-LD is left exactly as it was.
// Safe by design: every page is wrapped in try/catch, a bad page is skipped, the script never exits with an error.
// To switch it off: delete the line that imports this file in seo-overrides.mjs.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const unesc = s => String(s ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const clip = (s, n) => s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '\u2026' : s;
const STOCK = '(In stock\\. Pay by M-Pesa\\. Delivery to all 47 counties\\.|Ask us on WhatsApp when it is back\\. Pay by M-Pesa\\.)';
const DUP = new RegExp('^(Buy .+? in Kenya for KSh [\\d,]+\\.) Buy .*? ' + STOCK + '$');
const META = /(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")([^"]*)(">)/g;

let metaFixed = 0, ldFixed = 0;
if (existsSync('p')) for (const f of readdirSync('p').filter(f => f.endsWith('.html'))) {
  try {
    const file = `p/${f}`; const h0 = readFileSync(file, 'utf8'); let h = h0;
    if (h.includes('Redirecting')) continue;   // small redirect pages

    // 1) repeated "Buy <product>" sentence in the meta descriptions
    h = h.replace(META, (m, a, cur, b) => { const fix = cur.replace(DUP, '$1 $2'); return fix === cur ? m : a + fix + b; });
    if (h !== h0) metaFixed++;

    // 2) JSON-LD description from the page's own paragraphs
    const dm = h.match(/<div class="desc">([\s\S]*?)<\/div>/);
    const paras = dm ? [...dm[1].matchAll(/<p>([\s\S]*?)<\/p>/g)].map(x => unesc(x[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()).filter(Boolean) : [];
    const text = paras.join(' ');
    if (text.length >= 60) {
      const nd = clip(text, 500);
      const before = h;
      h = h.replace(/<script type="application\/ld\+json">([^<]*)<\/script>/g, (m, j) => {
        try {
          const d = JSON.parse(j);
          if ((d['@type'] === 'Product' || d['@type'] === 'ProductGroup') && typeof d.description === 'string' && d.description !== nd) {
            d.description = nd;
            return '<script type="application/ld+json">' + JSON.stringify(d).replace(/</g, '\\u003c') + '</script>';
          }
        } catch { /* leave this block as it is */ }
        return m;
      });
      if (h !== before) ldFixed++;
    }
    if (h !== h0) writeFileSync(file, h);
  } catch (e) { console.log('seo-fixes skipped', f, e.message); }
}
console.log(`seo-fixes: meta descriptions fixed on ${metaFixed} page(s), product JSON-LD description rebuilt on ${ldFixed} page(s).`);
