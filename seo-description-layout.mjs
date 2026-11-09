// Stermont Arcade - marketplace-style product description layout (Kilimall-like outlook; layout pattern only, no copy or artwork from any other store).
// Runs AFTER generate-products.mjs (see .github/workflows/product-pages.yml). It rewrites only the "About <product>" box of every /p/*.html page:
//   - a tab bar that jumps to each section (Overview, Key features, Specifications, ...)
//   - premium lavender section headers, rounded cards and polished specification tables
//   - Key features as a tick list
//   - Specifications as a two-column table when the lines look like "Label: value"
// Safe and repeatable: a page that already has the layout (marker class "pd") is skipped, and any failure leaves the page as the generator wrote it.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const MARK = 'stm-pd-layout';
const CSS = `<style id="${MARK}">
.box.product-description.pd{padding:0;overflow:hidden;border:1px solid #ded5f2;border-radius:18px;background:#fff;box-shadow:0 10px 28px rgba(42,24,70,.07)}
.pd .pd-title{margin:0;padding:1.05rem 1.1rem .85rem;font-size:1.2rem;line-height:1.35;color:#281744;background:linear-gradient(135deg,#f6f0ff 0%,#fff 72%);border-bottom:1px solid #ece4f8}
.pd-tabs{display:flex;gap:.45rem;overflow-x:auto;-webkit-overflow-scrolling:touch;padding:.65rem .8rem;background:#faf8ff;border-bottom:1px solid #ece4f8;position:sticky;top:0;z-index:5;scrollbar-width:none}
.pd-tabs::-webkit-scrollbar{display:none}
.pd-tabs a{flex:none;padding:.55rem .85rem;font-weight:750;font-size:.9rem;color:#4b3b62;text-decoration:none;border:1px solid #e7def5;border-radius:999px;background:#fff;white-space:nowrap;transition:background .15s ease,color .15s ease,border-color .15s ease}
.pd-tabs a:hover,.pd-tabs a:focus{color:#4c1d95;border-color:#a78bfa;background:#f2ebff;outline:none}
.pd .product-description-section.pd-sec{margin:0;padding:0 1.05rem 1.05rem;background:#fff;border:0;border-radius:0;scroll-margin-top:3.2rem}
.pd .pd-sec h3{margin:1rem -.15rem .75rem;padding:.72rem .9rem;background:#f4efff;border:1px solid #e8defa;border-left:4px solid #7c3aed;border-radius:10px;color:#3b176e;font-size:1rem;font-weight:800;line-height:1.35}
.pd .pd-sec p{margin:.35rem 0 .75rem;color:#373248;line-height:1.75}
.pd .pd-sec ul{margin:.35rem 0 .7rem;padding-left:1.25rem;list-style:disc}
.pd .pd-sec ul.pd-feat{list-style:none;padding:0}
.pd .pd-sec ul.pd-feat li{position:relative;padding:.42rem 0 .42rem 1.8rem;line-height:1.65;border-bottom:1px solid #f1edf7}
.pd .pd-sec ul.pd-feat li:last-child{border-bottom:0}
.pd .pd-sec ul.pd-feat li::before{content:"\\2713";position:absolute;left:.1rem;top:.42rem;color:#15803d;font-weight:900}
.pd-spec{width:100%;border-collapse:separate;border-spacing:0;margin:.35rem 0 .8rem;font-size:.94rem;border:1px solid #e8e1f2;border-radius:12px;overflow:hidden}
.pd-spec th,.pd-spec td{padding:.65rem .8rem;border-bottom:1px solid #eee8f5;text-align:left;vertical-align:top;line-height:1.55}
.pd-spec tr:last-child th,.pd-spec tr:last-child td{border-bottom:0}
.pd-spec th{width:38%;background:#f7f3ff;color:#4b3568;font-weight:700}
.pd-spec td{background:#fff;color:#373248}
@media(max-width:520px){.pd .pd-title{padding:.9rem .9rem .7rem}.pd .product-description-section.pd-sec{padding:0 .85rem .9rem}.pd-spec th{width:42%;padding:.55rem}.pd-spec td{padding:.55rem}}
</style>`;

const TAB = {
  'product overview': 'Overview', 'buying guide': 'Buying guide', 'important notes': 'Notes', 'vehicle enquiry & next steps': 'Enquiry', 'key features & benefits': 'Key features', 'specifications & details': 'Specifications',
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
