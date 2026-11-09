// Stermont Arcade - marketplace-style product description layout (Kilimall-like outlook; layout pattern only, no copy or artwork from any other store).
// Runs AFTER generate-products.mjs (see .github/workflows/product-pages.yml). It rewrites only the "About <product>" box of every /p/*.html page:
//   - a tab bar that jumps to each section (Overview, Key features, Specifications, ...)
//   - section titles as grey header bands
//   - Key features as a tick list
//   - Specifications as a two-column table when the lines look like "Label: value"
// Safe and repeatable: a page that already has the layout (marker class "pd") is skipped, and any failure leaves the page as the generator wrote it.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const MARK = 'stm-pd-layout';
const CSS = `<style id="${MARK}">
.box.product-description.pd{padding:0;overflow:hidden}
.pd .pd-title{margin:0;padding:.9rem 1rem .2rem;font-size:1.2rem}
.pd-tabs{display:flex;overflow-x:auto;-webkit-overflow-scrolling:touch;border-bottom:2px solid #ececf1;background:#fff;position:sticky;top:0;z-index:5;scrollbar-width:none}
.pd-tabs::-webkit-scrollbar{display:none}
.pd-tabs a{flex:none;padding:.7rem 1rem;font-weight:700;font-size:.95rem;color:#444;text-decoration:none;border-bottom:3px solid transparent;margin-bottom:-2px;white-space:nowrap}
.pd-tabs a:hover,.pd-tabs a:focus{color:#6d28d9;border-bottom-color:#7c3aed}
.pd .product-description-section.pd-sec{margin:0;padding:0 1rem 1rem;background:none;border:0;border-radius:0;scroll-margin-top:3.2rem}
.pd .pd-sec h3{margin:1.1rem -1rem .8rem;padding:.6rem 1rem;background:#f5f5f7;color:#222;font-size:1rem;font-weight:800;line-height:1.3}
.pd .pd-sec p{margin:.3rem 0 .7rem;color:#373248;line-height:1.7}
.pd .pd-sec ul{margin:.3rem 0 .6rem;padding-left:1.25rem;list-style:disc}
.pd .pd-sec ul.pd-feat{list-style:none;padding:0}
.pd .pd-sec ul.pd-feat li{position:relative;padding:.35rem 0 .35rem 1.7rem;line-height:1.6}
.pd .pd-sec ul.pd-feat li::before{content:"\\2713";position:absolute;left:0;top:.35rem;color:#15803d;font-weight:800}
.pd-spec{width:100%;border-collapse:collapse;margin:.3rem 0 .7rem;font-size:.95rem}
.pd-spec th,.pd-spec td{padding:.55rem .75rem;border:1px solid #ececf1;text-align:left;vertical-align:top;line-height:1.5}
.pd-spec th{width:38%;background:#f5f5f7;color:#444;font-weight:600}
@media(max-width:520px){.pd-spec th{width:42%}}
</style>`;

const TAB = {
  'product overview': 'Overview', 'key features & benefits': 'Key features', 'specifications & details': 'Specifications',
  'specifications & pack details': 'Specifications', 'uses & applications': 'Uses', 'how to use': 'How to use',
  'safety information': 'Safety', 'storage & handling': 'Storage', 'frequently asked questions': 'FAQs',
  'ordering, payment & delivery': 'Ordering', 'important buying notes': 'Notes', 'buying, availability & delivery': 'Buying',
  'product details': 'Details', 'product details & buying information': 'More details'
};
const decode = s => s.replace(/&amp;/g, '&');
const tabLabel = h => TAB[decode(h).trim().toLowerCase()] || decode(h).trim();
const KV = /^([^:<>]{2,45}):\s*(\S[\s\S]*)$/;

function restyleSection(heading, inner) {
  const h = decode(heading).toLowerCase();
  const merged = inner.replace(/<\/ul>\s*<ul>/g, '');   // the generator writes one <ul> per "- item" line; join them
  if (/^specifications/.test(h)) {
    const m = merged.match(/<ul>([\s\S]*?)<\/ul>/);
    if (m) {
      const items = [...m[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map(x => x[1]);
      const rows = items.map(t => t.match(KV));
      if (rows.filter(Boolean).length >= 2) {
        const table = '<table class="pd-spec"><tbody>' + items.map((t, i) => rows[i]
          ? `<tr><th scope="row">${rows[i][1].trim()}</th><td>${rows[i][2].trim()}</td></tr>`
          : `<tr><td colspan="2">${t}</td></tr>`).join('') + '</tbody></table>';
        return merged.replace(m[0], table);
      }
    }
  }
  if (/^key features/.test(h)) return merged.replace(/<ul>/g, '<ul class="pd-feat">');
  return merged;
}

export function restyleDescription(html) {
  const box = html.match(/<div class="box product-description">(<h2[^>]*>)([\s\S]*?)(<\/h2>)([\s\S]*?)<\/div>/);
  if (!box) return html;
  const secs = [...box[4].matchAll(/<section class="product-description-section"><h3>([\s\S]*?)<\/h3>([\s\S]*?)<\/section>/g)];
  if (!secs.length) return html;
  const body = secs.map((s, i) => `<section class="product-description-section pd-sec" id="pd-${i + 1}"><h3>${s[1]}</h3>${restyleSection(s[1], s[2])}</section>`).join('');
  const tabs = secs.length > 1 ? `<nav class="pd-tabs" aria-label="Product information sections">${secs.slice(0, 7).map((s, i) => `<a href="#pd-${i + 1}">${tabLabel(s[1])}</a>`).join('')}</nav>` : '';
  const block = `<div class="box product-description pd"><h2 class="pd-title">${box[2]}</h2>${tabs}${body}</div>`;
  let out = html.replace(box[0], () => block);
  if (!out.includes(`id="${MARK}"`)) out = out.replace('</head>', () => CSS + '</head>');
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let done = 0, skipped = 0;
  for (const f of readdirSync('p').filter(x => x.endsWith('.html'))) {
    const path = 'p/' + f;
    try {
      const cur = readFileSync(path, 'utf8');
      if (!cur.includes('<div class="box product-description">')) { skipped++; continue; }   // redirect stubs, or already restyled
      const out = restyleDescription(cur);
      if (out !== cur) { writeFileSync(path, out); done++; } else skipped++;
    } catch (e) { console.log('Skipped', f, e.message); skipped++; }
  }
  console.log(`Description layout: ${done} pages restyled, ${skipped} left as they were.`);
}
