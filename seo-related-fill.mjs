// Stermont Arcade - seo-related-fill
// Runs after generate-products.mjs. generate-products only links a product to other products in its OWN category, so a product in a
// category with 1 to 6 items gets few or no product links (for example NIVEA Sun, the only Health & Beauty product, linked to nothing).
// Pages Google has only seen in a sitemap, with no links from other pages, tend to stay "Discovered - currently not indexed".
// This tops every product page up to 6 related product links, choosing from the same product family first (pest control, agro, electronics,
// home, fashion), and rotates the choice so every product also RECEIVES links from other pages. Pure HTML post-processing, no network.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

const DIR = 'p', TARGET = 6, MARK = '<!--stm-also-->', BRAND = 'Stermont Arcade';
const FAMILIES = [
  ['pest-control-fumigation', 'bed-bug-killers', 'cockroach-ant-killers', 'mosquito-fly-control', 'rodent-control', 'termite-control', 'fumigation-chemicals', 'sprayers-equipment', 'protective-wear-safety'],
  ['agrovet', 'agrochemicals', 'herbicides', 'fungicides', 'crop-insecticides', 'adjuvants-growth-regulators', 'fertilizers', 'seeds-seedlings', 'veterinary-drugs', 'animal-feeds', 'disinfectants-hygiene', 'water-tanks-irrigation', 'garden-outdoors'],
  ['tvs-audio', 'televisions', 'home-theatre', 'bluetooth-speakers', 'tv-mounts-accessories', 'phones-tablets', 'phone-accessories', 'computing', 'printers-office-machines', 'electrical-lighting'],
  ['appliances', 'washing-machines', 'fridges-freezers', 'kitchen-dining', 'electrical-lighting'],
  ['mens-fashion', 'womens-fashion', 'shoes', 'watches-jewellery', 'health-beauty']
];
const money = n => 'KSh ' + Math.round(Number(n) || 0).toLocaleString('en-KE');
const pick = (html, re) => (html.match(re) || [])[1];

if (!existsSync(DIR)) { console.log('related-fill: no p/ folder, nothing to do.'); process.exit(0); }

const pages = [];
for (const f of readdirSync(DIR).sort()) {
  if (!f.endsWith('.html')) continue;
  const html = readFileSync(`${DIR}/${f}`, 'utf8');
  if (!html.includes('<meta name="stm-id"')) continue;            // redirect stubs have no stm-id
  const name = pick(html, /<h1>([\s\S]*?)<\/h1>/);
  if (!name) continue;
  const img = pick(html, /<meta property="og:image" content="([^"]*)"/);
  pages.push({
    file: f, html, name: name.trim(), href: `/p/${f}`,
    cat: pick(html, /<nav class="bc">[\s\S]*?<a href="\/c\/([^"\/]+)\.html"/),
    price: pick(html, /<meta property="product:price:amount" content="([^"]*)"/),
    from: /<div class="pr">(?:<s>[^<]*<\/s> )?From /.test(html),
    inStock: !/product:availability" content="out of stock"/.test(html),
    img: img && !/\/logo\.png$/.test(img) ? img : ''
  });
}

const N = pages.length, idx = new Map(pages.map((p, i) => [p.file, i]));
const familyOf = cat => FAMILIES.find(fam => fam.includes(cat)) || [];
const card = p => `<li><a href="${p.href}">${p.img ? `<img src="${p.img}" alt="${p.name.replace(/"/g, '&quot;')}" width="160" height="150" loading="lazy" decoding="async">` : ''}${p.name}</a><span>${p.from ? 'From ' : ''}${money(p.price)}</span></li>`;

let changed = 0, already = 0;
for (const p of pages) {
  if (p.html.includes(MARK)) { already++; continue; }
  const stk = p.html.indexOf('<div class="stk"');
  if (stk < 0) continue;
  const moreAt = p.html.indexOf('<h2>More in ');
  const existing = moreAt >= 0 && moreAt < stk ? p.html.slice(moreAt, stk) : '';
  const have = new Set((existing.match(/<li><a href="\/p\/[^"]+/g) || []).map(s => s.replace('<li><a href="', '')));
  const need = TARGET - have.size;
  if (need <= 0) continue;
  const self = idx.get(p.file), fam = new Set(familyOf(p.cat));
  const dist = o => (idx.get(o.file) - self + N) % N;                // rotate so links are spread across the whole catalogue
  const pool = pages.filter(o => o.file !== p.file && o.inStock && !have.has(o.href)).sort((a, b) => (fam.has(b.cat) - fam.has(a.cat)) || (dist(a) - dist(b)));
  const add = pool.slice(0, need);
  if (!add.length) continue;
  const block = `${MARK}<h2>${have.size ? 'You may also like' : 'More from ' + BRAND}</h2><ul class="g">${add.map(card).join('')}</ul>\n`;
  writeFileSync(`${DIR}/${p.file}`, p.html.slice(0, stk) + block + p.html.slice(stk));
  changed++;
}
console.log(`related-fill: added related links to ${changed} product page(s); ${already} already had them; ${N} product pages scanned.`);
