// Stermont Arcade - applies hand-written Google titles, meta descriptions and FAQ answers (seo-overrides.json) to built product pages.
// Runs right after generate-products.mjs (see .github/workflows/product-pages.yml). Pages that do not exist yet (hidden or sold-out products) are skipped.
// To optimise another product: add its id (the file name in /p/) to seo-overrides.json. {price} is filled in from the live page.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
// First run the structure + internal links pass (seo-product-extras.mjs). Wired in here because this script is already a workflow step.
// If that pass fails for any reason the overrides below still run. To switch it off, delete these 2 lines.
try { await import('./seo-product-extras.mjs'); } catch (e) { console.log('seo-product-extras skipped:', e.message); }
// Then the small clean-ups (seo-fixes.mjs): no repeated "Buy <product>" in meta descriptions, clean JSON-LD description. To switch it off, delete this line.
try { await import('./seo-fixes.mjs'); } catch (e) { console.log('seo-fixes skipped:', e.message); }
// Then the cross-sell box (seo-crosssell.mjs): "Complete your order" product suggestions. To switch it off, delete this line.
try { await import('./seo-crosssell.mjs'); } catch (e) { console.log('seo-crosssell skipped:', e.message); }
const O = JSON.parse(readFileSync('seo-overrides.json', 'utf8'));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clip = (s, n) => s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;
let done = 0;
for (const [id, o] of Object.entries(O)) {
  const file = `p/${id}.html`;
  if (!existsSync(file)) { console.log('skip (no page yet):', id); continue; }
  let h = readFileSync(file, 'utf8');
  const pm = h.match(/product:price:amount" content="(\d+)"/);
  const price = pm ? 'KSh ' + Number(pm[1]).toLocaleString('en-KE') : '';
  const fill = s => s.replace(/\{price\}/g, price);
  const title = esc(fill(o.title)), desc = esc(clip(fill(o.desc), 158));
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${desc}">`)
    .replace(/(<meta property="og:title" content=")[^"]*(">)/, `$1${title}$2`).replace(/(<meta property="og:description" content=")[^"]*(">)/, `$1${desc}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(">)/, `$1${title}$2`).replace(/(<meta name="twitter:description" content=")[^"]*(">)/, `$1${desc}$2`);
  if (o.faq && o.faq.length) {
    const faq = o.faq.map(([q, a]) => [fill(q), fill(a)]);
    h = h.replace(/<script type="application\/ld\+json">([^<]*)<\/script>/g, (m, j) => {
      if (!j.includes('"@type":"FAQPage"')) return m;
      try {
        const d = JSON.parse(j);
        d.mainEntity = [...faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })), ...d.mainEntity];
        return '<script type="application/ld+json">' + JSON.stringify(d).replace(/</g, '\\u003c') + '</script>';
      } catch { return m; }
    });
    const box = `<div class="box"><h2 style="margin-top:0">Frequently asked questions</h2>${faq.map(([q, a]) => `<p><b>${esc(q)}</b><br>${esc(a)}</p>`).join('')}</div>\n`;
    h = h.includes('<div class="stk"') ? h.replace('<div class="stk"', box + '<div class="stk"') : h;
  }
  writeFileSync(file, h); done++;
}
console.log(`SEO overrides applied to ${done} SEO override(s) product page(s).`);
