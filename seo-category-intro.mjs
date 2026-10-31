// Stermont Arcade - unique intro for category pages (runs from seo-overrides.mjs, after seo-rich-content.mjs).
// Category pages were a one-line boilerplate sentence plus a product grid, which Google treats as thin content ("Crawled - currently not indexed").
// This adds a short intro that is different on every category because it is built only from that page's own product list:
// number of products, price range in KSh, and three real product names (cheapest, a middle one, dearest), plus the store facts in shipping.html / nairobi.html.
// No invented claims. Safe by design: every file is wrapped in try/catch, a page that already has the marker is skipped.
// To switch it off, delete the import line in seo-overrides.mjs.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const MARK = '<!--stm-catintro-->';
const unesc = s => String(s ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ksh = n => 'KSh ' + Number(n).toLocaleString('en-US');
const ITEM = /<li><a href="(\/p\/[^"]+)"><img[^>]*?>([^<]*)<\/a><span>(?:From )?KSh ([\d,]+)<\/span><\/li>/g;
// the generic sentence generate-products.mjs writes under every category heading
const BOILER = /<p>Order online and pay by M-Pesa\.[^<]*<\/p>/;

const list = names => names.length <= 1 ? names[0] || '' : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];

let done = 0;
if (existsSync('c')) for (const f of readdirSync('c').filter(f => f.endsWith('.html') && f !== 'index.html')) {
  try {
    const file = `c/${f}`; let h = readFileSync(file, 'utf8');
    if (h.includes(MARK)) continue;
    const hm = h.match(/<h1>([\s\S]*?)<\/h1>/);
    if (!hm) continue;
    const label = unesc(hm[1].replace(/<[^>]+>/g, '').trim()).replace(/\s+in Kenya$/i, '');
    const items = [...h.matchAll(ITEM)].map(m => ({ name: m[2].trim(), price: Number(m[3].replace(/,/g, '')) })).filter(i => i.name && i.price > 0);
    if (!items.length) continue;
    items.sort((a, b) => a.price - b.price);
    const n = items.length, min = items[0].price, max = items[n - 1].price;
    // up to three distinct names spread across the price range: cheapest, middle, dearest
    const pick = [];
    for (const i of [items[0], items[Math.floor((n - 1) / 2)], items[n - 1]]) if (!pick.some(p => p.name === i.name)) pick.push(i);
    const low = label.toLowerCase();
    const count = n === 1 ? `We list 1 product in ${low}` : `We list ${n} products in ${low}`;
    const range = min === max ? `priced at ${ksh(min)}` : `priced from ${ksh(min)} to ${ksh(max)}`;
    const names = list(pick.map(p => p.name));   // names are already HTML-escaped on the page
    const p1 = `${esc(count)} at Stermont Arcade, ${range}. ${n === 1 ? 'It is' : 'The range includes'} ${names}.`;
    const p2 = `Open a product to see its sizes, price for each size and stock. Pay by M-Pesa, and we deliver to Nairobi and all 47 counties, usually within 1 to 3 days. You can also collect at The Sarit Centre, Karuna Road, Westlands, open daily 8 AM to 8 PM; confirm stock on WhatsApp first.`;
    const intro = `${MARK}<p>${p1}</p><p>${p2}</p>`;
    const before = h;
    h = BOILER.test(h) ? h.replace(BOILER, () => intro) : h.replace(/<\/h1>/, () => '</h1>\n' + intro);
    if (h !== before) { writeFileSync(file, h); done++; }
  } catch (e) { console.log('skip category intro', f, e.message); }
}
console.log(`Category intros added to ${done} category page(s).`);
