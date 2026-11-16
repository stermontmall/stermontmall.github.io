// Safe, explicitly allowlisted ordinary-consumer category metadata only.
// The pass never touches unlisted category pages or restricted catalog categories.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

export const SAFE_CATEGORY_META = Object.freeze({
  'appliances.html': {
    canonical: 'https://stermontarcade.co.ke/c/appliances.html',
    title: 'Home Appliances in Kenya | Stermont Arcade',
    description: 'Shop home appliances in Kenya at Stermont Arcade. Compare listed appliance details, prices and availability; use M-Pesa checkout and review delivery options.'
  },
  'bluetooth-speakers.html': {
    canonical: 'https://stermontarcade.co.ke/c/bluetooth-speakers.html',
    title: 'Bluetooth Speakers in Kenya | Stermont Arcade',
    description: 'Shop Bluetooth speakers in Kenya at Stermont Arcade. Compare listed connectivity, system details and prices; review availability and delivery options, then checkout with M-Pesa.'
  },
  'computing.html': {
    canonical: 'https://stermontarcade.co.ke/c/computing.html',
    title: 'Computers & Computing in Kenya | Stermont Arcade',
    description: 'Shop computers and computing accessories in Kenya at Stermont Arcade. Compare listed specifications, prices and availability; review delivery options and pay by M-Pesa.'
  },
  'fridges-freezers.html': {
    canonical: 'https://stermontarcade.co.ke/c/fridges-freezers.html',
    title: 'Fridges & Freezers in Kenya | Stermont Arcade',
    description: 'Shop fridges and freezers in Kenya at Stermont Arcade. Compare listed capacity, features and prices; check availability, delivery options and M-Pesa checkout.'
  },
  'fashion.html': {
    canonical: 'https://stermontarcade.co.ke/c/fashion.html',
    title: 'Clothing & Fashion in Kenya | Stermont Arcade',
    description: 'Shop clothing and fashion in Kenya at Stermont Arcade. Browse listed styles, sizes and prices; check availability and delivery options before M-Pesa checkout.'
  },
  'home-kitchen.html': {
    canonical: 'https://stermontarcade.co.ke/c/home-kitchen.html',
    title: 'Home & Kitchen in Kenya | Stermont Arcade',
    description: 'Shop home and kitchen products in Kenya at Stermont Arcade. Compare listed product details and prices; check availability, delivery options and M-Pesa checkout.'
  },
  'kitchen-dining.html': {
    canonical: 'https://stermontarcade.co.ke/c/kitchen-dining.html',
    title: 'Kitchen & Dining in Kenya | Stermont Arcade',
    description: 'Shop kitchen and dining products in Kenya at Stermont Arcade. Review listed details, prices and availability; check delivery options and pay with M-Pesa.'
  }
});

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function applySafeCategoryMeta(html, canonical, title, description) {
  const actual = html.match(/<link\s+rel=['"]canonical['"]\s+href=['"]([^'"]*)['"]/i)?.[1];
  if (!actual || actual !== canonical || !title || title.length > 60 || !description || description.length < 70 || description.length > 155) return html;
  const t = esc(title), d = esc(description);
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${t}</title>`)
    .replace(/(<meta\s+name=['"]description['"]\s+content=['"])[^'"]*(['"])/i, `$1${d}$2`)
    .replace(/(<meta\s+property=['"]og:description['"]\s+content=['"])[^'"]*(['"])/i, `$1${d}$2`)
    .replace(/(<meta\s+name=['"]twitter:description['"]\s+content=['"])[^'"]*(['"])/i, `$1${d}$2`);
}

export function runSafeCategoryMeta({ dir = 'c' } = {}) {
  let changed = 0, skipped = 0;
  for (const [file, item] of Object.entries(SAFE_CATEGORY_META)) {
    const path = `${dir}/${file}`;
    if (!existsSync(path)) { skipped++; continue; }
    const before = readFileSync(path, 'utf8');
    const after = applySafeCategoryMeta(before, item.canonical, item.title, item.description);
    if (after === before) { skipped++; console.log(`safe-category-meta: canonical/title check failed for ${file}; left unchanged.`); continue; }
    writeFileSync(path, after); changed++;
  }
  console.log(`safe-category-meta: updated ${changed} allowlisted ordinary category page(s); skipped ${skipped}.`);
}

if (process.argv[1] && process.argv[1].endsWith('seo-safe-category-meta.mjs')) runSafeCategoryMeta();
