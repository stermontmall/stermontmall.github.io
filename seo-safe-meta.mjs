// Safe, explicitly allowlisted consumer-product meta descriptions only.
// This pass runs AFTER the general SEO overrides so it cannot accidentally rewrite other catalog pages.
// Never add uncertain, chemical, pesticide, veterinary, or other restricted product IDs here.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

export const SAFE_META = Object.freeze({
  'samsung-galaxy-a06-4gb-ram-64gb.html': {
    id: 'samsung-galaxy-a06-4gb-ram-plus-64gb-4gb-plus-64gb',
    description: 'Samsung Galaxy A06 with 4GB RAM and 64GB storage. Check the Kenya listing, price and delivery options; M-Pesa checkout.'
  },
  'hisense-55a6qken-4k-uhd-smart-tv-with-tv-guard-and-wall-mount-55-inch.html': {
    id: 'hisense-55a6qken-4k-uhd-smart-tv-with-tv-guard-and-wall-mount-55-inch',
    description: 'Hisense 55A6QKEN 55-inch 4K UHD Smart TV bundle with TV Guard and wall mount. View listing details in Kenya; pay by M-Pesa.'
  },
  'hisense-ref205dr-double-door-fridge-with-water-dispenser-205-litres.html': {
    id: 'hisense-ref205dr-double-door-fridge-with-water-dispenser-205-litres',
    description: 'Hisense REF205DR double-door fridge with water dispenser and 205-litre capacity. Check Kenya listing and delivery options; M-Pesa checkout.'
  },
  'kenwood-air-fryer-hfp30-000bk-3-8-litres.html': {
    id: 'kenwood-air-fryer-hfp30-000bk-3-8-litres',
    description: 'Kenwood HFP30.000BK air fryer, 3.8 litres. Review the listing details and delivery options in Kenya; checkout with M-Pesa.'
  },
  'samsung-galaxy-a16-4gb-128gb-25w-adapter-watch-cover.html': {
    id: 'samsung-galaxy-a16-4gb-128gb-25w-adapter-watch-cover',
    description: 'Samsung Galaxy A16 bundle: 4GB RAM, 128GB storage, 5000mAh and listed adapter, smartwatch and cover. Kenya checkout via M-Pesa.'
  },
  'haier-90l-single-door-direct-cool-fridge-black-90-litres.html': {
    id: 'haier-90l-single-door-direct-cool-fridge-black-90-litres',
    description: 'Haier 90L single-door direct-cool fridge in black. Check listing details, current availability and delivery options in Kenya; M-Pesa checkout.'
  },
  'von-twin-tub-semi-automatic-washing-machine-7-5kg-7-5-kg.html': {
    id: 'von-twin-tub-semi-automatic-washing-machine-7-5kg-7-5-kg',
    description: 'VON 7.5kg twin-tub semi-automatic washing machine. Review model details and delivery options in Kenya; pay through M-Pesa.'
  },
  'waanzilish-mens-black-feather-casual-sneakers.html': {
    id: 'waanzilish-mens-black-feather-casual-sneakers',
    description: 'Waanzilish men’s black feather casual sneakers with white sole. Check listing details and delivery options in Kenya; M-Pesa checkout.'
  },
  'asus-zenbook-14-oled-laptop.html': {
    id: 'asus-zenbook-14-oled-laptop',
    description: 'ASUS Zenbook 14 OLED laptop. Check the Kenya listing for its configuration, current price and delivery options; pay by M-Pesa at Stermont Arcade.'
  },
  'classic-mens-black-formal-blazer.html': {
    id: 'classic-men-s-black-formal-blazer-piece',
    description: "Classic men's black formal blazer (piece). Review the Kenya listing for available details and delivery options; M-Pesa checkout at Stermont Arcade."
  },
  'ecomax-2-1ch-multimedia-speaker-system-bluetooth-usb-sd.html': {
    id: 'ecomax-2-1ch-multimedia-speaker-system-bluetooth-usb-sd',
    description: 'ECOMAX 2.1-channel multimedia speakers with Bluetooth, USB/SD and remote. Review the Kenya listing and checkout using M-Pesa.'
  }
  'itel-smartphone.html': {
    id: 'itel-smartphone',
    description: 'Itel Smartphone listing in Kenya. Review the available model details, current price and delivery options on Stermont Arcade; checkout with M-Pesa.'
  },
  'infinix-smart-20-4gb-64gb.html': {
    id: 'infinix-smart-20-4gb-64gb-20261108',
    description: 'Infinix Smart 20 with 4GB RAM and 64GB storage. Check the Kenya listing for price, available details and delivery options; M-Pesa checkout.'
  },
  'infinix-smart-20-4gb-128gb.html': {
    id: 'infinix-smart-20-4gb-128gb-20261108',
    description: 'Infinix Smart 20 with 4GB RAM and 128GB storage. Check the Kenya listing for price, available details and delivery options; M-Pesa checkout.'
  },
  'apple-iphone-16-128gb-green.html': {
    id: 'apple-iphone-16-128gb-green',
    description: 'Apple iPhone 16 128GB in Green, with A18 chip and 6.1-inch Super Retina XDR display. Review the Kenya listing; M-Pesa checkout.'
  },
  'apple-iphone-16-128gb-white.html': {
    id: 'apple-iphone-16-128gb-white',
    description: 'Apple iPhone 16 128GB in White, with A18 chip and 6.1-inch Super Retina XDR display. Review the Kenya listing; M-Pesa checkout.'
  }
});

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function applySafeMeta(html, expectedId, description) {
  const id = html.match(/<meta name="stm-id" content="([^"]*)">/i)?.[1];
  if (!id || id !== expectedId || !description || description.length < 70 || description.length > 155) return html;
  const d = esc(description);
  return html
    .replace(/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${d}">`)
    .replace(/(<meta property="og:description" content=")[^"]*(">)/i, `$1${d}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(">)/i, `$1${d}$2`);
}

export function runSafeMeta({ dir = 'p' } = {}) {
  let changed = 0, skipped = 0;
  for (const [file, item] of Object.entries(SAFE_META)) {
    const path = `${dir}/${file}`;
    if (!existsSync(path)) { skipped++; continue; }
    const before = readFileSync(path, 'utf8');
    const after = applySafeMeta(before, item.id, item.description);
    if (after === before) { skipped++; console.log(`safe-meta: identity/description check failed for ${file}; left unchanged.`); continue; }
    writeFileSync(path, after);
    changed++;
  }
  console.log(`safe-meta: updated ${changed} allowlisted ordinary-product page(s); skipped ${skipped}.`);
}

if (process.argv[1] && process.argv[1].endsWith('seo-safe-meta.mjs')) runSafeMeta();
