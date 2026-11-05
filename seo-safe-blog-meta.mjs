// Safe, allowlisted ordinary-consumer buying-guide meta descriptions only.
// No pesticide, chemical, veterinary, poison, or uncertain guide is included.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

export const SAFE_BLOG_META = Object.freeze({
  'how-to-buy-a-phone-online-kenya.html': {
    canonical: 'https://stermontarcade.co.ke/blog/how-to-buy-a-phone-online-kenya.html',
    description: 'Buying a smartphone online in Kenya? Check IMEI, warranty and 4G bands, avoid fake or refurbished phones, and pay safely by M-Pesa.'
  },
  'smart-tv-buying-guide-kenya.html': {
    canonical: 'https://stermontarcade.co.ke/blog/smart-tv-buying-guide-kenya.html',
    description: 'Buying a smart TV in Kenya? Choose screen size, check DVB-T2 for local channels, compare Android TV and apps, and protect it from power surges.'
  },
  'air-fryer-buying-guide-kenya.html': {
    canonical: 'https://stermontarcade.co.ke/blog/air-fryer-buying-guide-kenya.html',
    description: 'Buying an air fryer in Kenya? Match basket litres to portions, check watts and KPLC token use, and compare cooking needs for chips, chicken or samosas.'
  },
  'washing-machine-buying-guide-kenya.html': {
    canonical: 'https://stermontarcade.co.ke/blog/washing-machine-buying-guide-kenya.html',
    description: 'Choose a washing machine in Kenya: compare twin tub vs automatic, load size, water use and how it handles rationing or power cuts.'
  }
});

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function applySafeBlogMeta(html, canonical, description) {
  const actual = html.match(/<link\s+rel=['"]canonical['"]\s+href=['"]([^'"]*)['"]/i)?.[1];
  if (!actual || actual !== canonical || !description || description.length < 70 || description.length > 155) return html;
  const d = esc(description);
  return html
    .replace(/(<meta\s+name=['"]description['"]\s+content=['"])[^'"]*(['"])/i, `$1${d}$2`)
    .replace(/(<meta\s+property=['"]og:description['"]\s+content=['"])[^'"]*(['"])/i, `$1${d}$2`);
}

export function runSafeBlogMeta({ dir = 'blog' } = {}) {
  let changed = 0, skipped = 0;
  for (const [file, item] of Object.entries(SAFE_BLOG_META)) {
    const path = `${dir}/${file}`;
    if (!existsSync(path)) { skipped++; continue; }
    const before = readFileSync(path, 'utf8');
    const after = applySafeBlogMeta(before, item.canonical, item.description);
    if (after === before) { skipped++; console.log(`safe-blog-meta: canonical/description check failed for ${file}; left unchanged.`); continue; }
    writeFileSync(path, after); changed++;
  }
  console.log(`safe-blog-meta: updated ${changed} allowlisted ordinary buying guide(s); skipped ${skipped}.`);
}

if (process.argv[1] && process.argv[1].endsWith('seo-safe-blog-meta.mjs')) runSafeBlogMeta();
