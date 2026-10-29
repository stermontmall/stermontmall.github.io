// Stermont Arcade - "Complete your order" cross-sell box on product pages.
// Runs from seo-overrides.mjs (inside try/catch) AFTER seo-product-extras.mjs, on the already built p/*.html pages.
// No invented data: it reads the finished product pages (name, price, image, stock, category) and picks 2 to 4 IN-STOCK products from related categories
// using the fixed rules below. The pick is stable (same product, same suggestions on every build) but varies between products.
// Pages are skipped, never broken: every file is wrapped in try/catch and the marker below makes the pass safe to re-run.
// To switch it off: delete the seo-crosssell line near the top of seo-overrides.mjs.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const MARK = '<!--stm-xsell-->';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const unesc = s => String(s ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const txt = s => unesc(String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
const hash = s => { let h = 5381; for (const c of String(s)) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return h >>> 0; };

// Real protective gear only (masks, gloves, overalls...). The catalogue has no such items yet, so no PPE card is shown until some are added (a safety helmet is not spray protection).
const PPE = /mask|respirator|glove|overall|goggle|gumboot|wellington|apron|coverall/i;
const STICKER = /wetter|spreader|sticker|adjuvant/i;
const POULTRY = /poultry|layer|broiler|chick/i;

// Rule format: [category slug, how many to show, optional name filter]
const PEST = [['sprayers-equipment', 2], ['protective-wear-safety', 1, PPE]];
const CROP = [['sprayers-equipment', 2], ['adjuvants-growth-regulators', 1, STICKER], ['protective-wear-safety', 1, PPE]];
const BY_CAT = {
  'termite-control': PEST, 'rodent-control': PEST, 'cockroach-ant-killers': PEST, 'bed-bug-killers': PEST, 'mosquito-fly-control': PEST, 'fumigation-chemicals': PEST, 'pest-control-fumigation': PEST,
  'crop-insecticides': [...CROP, ['fungicides', 1]],
  'fungicides': [...CROP, ['crop-insecticides', 1]],
  'herbicides': CROP,
  'adjuvants-growth-regulators': [['crop-insecticides', 1], ['fungicides', 1], ['sprayers-equipment', 1]],
  'fertilizers': [['adjuvants-growth-regulators', 1], ['sprayers-equipment', 1], ['seeds-seedlings', 1]],
  'seeds-seedlings': [['fertilizers', 2], ['crop-insecticides', 1]],
  'sprayers-equipment': [['crop-insecticides', 1], ['fungicides', 1], ['herbicides', 1], ['adjuvants-growth-regulators', 1, STICKER]],
  'animal-feeds': [['animal-feeds', 2], ['veterinary-drugs', 1, POULTRY], ['disinfectants-hygiene', 1]],
  'veterinary-drugs': [['animal-feeds', 2], ['disinfectants-hygiene', 1], ['veterinary-drugs', 1, POULTRY]],
  'disinfectants-hygiene': [['veterinary-drugs', 1, POULTRY], ['animal-feeds', 1], ['sprayers-equipment', 1]],
  'agrovet': [['animal-feeds', 2], ['veterinary-drugs', 1]],
  'televisions': [['tv-mounts-accessories', 1], ['home-theatre', 1], ['bluetooth-speakers', 1]],
  'home-theatre': [['televisions', 1], ['tv-mounts-accessories', 1]],
  'phones-tablets': [['phone-accessories', 3]]
};
// Rules by product name win over the category rules (feed phosphates -> premix and amino acids).
const BY_NAME = [
  [/kynofos|phosphate/i, [['animal-feeds', 2, /premix|lysine|amino/i], ['animal-feeds', 1, /coccidiostat|supplement/i], ['veterinary-drugs', 1, POULTRY]]]
];

// ---------- index of the finished product pages ----------
const idx = [];
if (existsSync('p')) for (const f of readdirSync('p').filter(f => f.endsWith('.html'))) {
  try {
    const h = readFileSync(`p/${f}`, 'utf8');
    const nm = h.match(/<h1>([\s\S]*?)<\/h1>/), pm = h.match(/product:price:amount" content="(\d+)"/);
    if (!nm || !pm || !/product:availability" content="in stock"/.test(h)) continue;   // redirect stub, hidden or sold out
    const cats = [...((h.match(/<nav class="bc">[\s\S]*?<\/nav>/) || [''])[0]).matchAll(/href="\/c\/([^".]+)\.html"/g)].map(m => decodeURIComponent(m[1]));
    const img = (h.match(/<div class="pg"><div><img src="([^"]+)"/) || [])[1];
    const price = txt((h.match(/<div class="pr">([\s\S]*?)<\/div>/) || [])[1] || '');
    if (!cats.length || !img || !price) continue;
    idx.push({ id: f.replace(/\.html$/, ''), name: txt(nm[1]), cat: cats[cats.length - 1], img, price });
  } catch (e) { console.log('crosssell index skip', f, e.message); }
}

const pick = (self, rules) => {
  const out = [], ids = new Set([self.id]), names = new Set([self.name.toLowerCase()]);
  for (const [cat, n, re] of rules) {
    const c = idx.filter(p => p.cat === cat && !ids.has(p.id) && !names.has(p.name.toLowerCase()) && (!re || re.test(p.name)))
      .sort((a, b) => hash(self.id + a.id) - hash(self.id + b.id));
    let took = 0;
    for (const p of c) {
      if (took >= n || names.has(p.name.toLowerCase())) continue;   // a pack-size twin of something already picked
      ids.add(p.id); names.add(p.name.toLowerCase()); out.push(p); took++;
    }
  }
  return out.slice(0, 4);
};

let done = 0, none = 0;
for (const self of idx) {
  try {
    const file = `p/${self.id}.html`; let h = readFileSync(file, 'utf8');
    if (h.includes(MARK)) continue;
    const rules = (BY_NAME.find(([re]) => re.test(self.name)) || [])[1] || BY_CAT[self.cat];
    if (!rules) { none++; continue; }
    const items = pick(self, rules);
    if (items.length < 2) { none++; continue; }
    const card = p => `<li><a href="/p/${esc(p.id)}.html"><img src="${esc(p.img)}" alt="${esc(p.name)}" width="160" height="150" loading="lazy" decoding="async">${esc(p.name)}</a><span>${esc(p.price)}</span></li>`;
    const box = `${MARK}<div class="box xsell"><h2 style="margin-top:0">Complete your order</h2><ul class="g">${items.map(card).join('')}</ul></div>\n`;
    const sizes = /(<div class="box"><h2 style="margin-top:0">Available sizes<\/h2>[\s\S]*?<\/ul><\/div>\n?)/;
    const before = h;
    h = sizes.test(h) ? h.replace(sizes, m => m + box) : h.replace('<div class="stk"', () => box + '<div class="stk"');
    if (h !== before) { writeFileSync(file, h); done++; }
  } catch (e) { console.log('skip crosssell page', self.id, e.message); }
}
console.log(`seo-crosssell: ${done} product page(s) got a "Complete your order" box, ${none} had no usable suggestions (of ${idx.length} in-stock pages).`);
