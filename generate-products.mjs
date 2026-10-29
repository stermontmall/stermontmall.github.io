// Rebuild trigger 2026-10-26: new products added.
// Stermont Arcade - builds a real web page for every product + category, and a sitemap for Google.
// Runs automatically on GitHub (see .github/workflows/product-pages.yml). No installs needed (Node 18+).
import { writeFileSync, mkdirSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pdpTitle, pdpDescription, catTitle, catDescription, trustName, hasLeadWord, pdpH1, pdpTagline, pdpHeadings, isPcpb, isPest } from './seo-meta.mjs';   // Kenya SEO wording lives in seo-meta.mjs

const SITE = 'https://stermontarcade.co.ke';
const SB = 'https://oewvtbnmyombbtggamor.supabase.co';
const KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7';
const WHATSAPP = '254748888230';
const BRAND = 'Stermont Arcade';
// Real product brand for Google. Add more brands here any time; if none matches, the store name is used.
const BRANDS = ['Alagzi', 'Kungu Nil', 'Greenlife', 'Zagro', 'Alonze', 'Pentagon', 'Absolute', 'Abasi', 'Hisense', 'Samsung', 'LG', 'Tecno', 'Infinix', 'Itel', 'Oppo', 'Xiaomi', 'Redmi', 'Apple', 'Nokia', 'Sony', 'JBL', 'TCL', 'Syinix', 'Vitron', 'Ramtons', 'Von', 'Mika', 'Nunix', 'Sayona', 'HP', 'Dell', 'Lenovo', 'Asus', 'Acer', 'Philips', 'Bruhm', 'Rockstar', 'Snake'];
const brandOf = name => { const n = ` ${String(name).toLowerCase()} `; const hit = BRANDS.filter(b => n.includes(` ${b.toLowerCase()} `)).sort((a, b) => b.length - a.length)[0]; return hit || BRAND; };
const RETURNS = { '@type': 'MerchantReturnPolicy', applicableCountry: 'KE', returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow', merchantReturnDays: 2, url: 'https://stermontarcade.co.ke/returns.html' };
// Delivery facts from shipping.html: all of Kenya, usually 1 to 3 days. The fee depends on location and is confirmed before payment, so no fixed rate is claimed here.
const SHIPPING = { '@type': 'OfferShippingDetails', shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'KE' }, deliveryTime: { '@type': 'ShippingDeliveryTime', transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' } } };

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => 'KSh ' + Math.round(Number(n) || 0).toLocaleString('en-KE');
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };
const jsonLd = o => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>';

// Product photos saved in the catalog before the custom domain still point at the old github.io address.
// The files are the same, so serve them from the main domain: one site for Google to index, nothing breaks if github.io is ever turned off.
const OLD_HOST = /^https?:\/\/stermontmall\.github\.io\//i;
const fixImg = u => (typeof u === 'string' ? u.replace(OLD_HOST, SITE + '/') : u);
const fixProducts = list => list.map(p => (Array.isArray(p.images) ? { ...p, images: p.images.map(fixImg) } : p));

async function getProducts() {
  if (process.env.PRODUCTS_JSON) return fixProducts(JSON.parse(readFileSync(process.env.PRODUCTS_JSON, 'utf8')));   // for local testing only
  const cols = ['id,slug,name,price,old_price,unit,variant_group,variant_label,stock,images,description,categories(name,slug)',
                'id,name,price,old_price,unit,variant_group,variant_label,stock,images,description,categories(name,slug)',
                'id,name,price,old_price,unit,stock,images,description,categories(name,slug)',
                'id,name,price,stock,images,description,categories(name,slug)'];
  for (const c of cols) {
    const r = await fetch(`${SB}/rest/v1/products?active=eq.true&select=${c}&order=created_at.asc`, { headers: { apikey: KEY } });
    if (r.ok) return fixProducts(await r.json());
  }
  throw new Error('Could not read products from Supabase');
}

const CSS = `*{box-sizing:border-box}body{margin:0;font:16px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1f1b2e;background:#faf9fd}
a{color:#6d28d9}header{background:#7c3aed;color:#fff;padding:.8rem 1rem}header a{color:#fff;text-decoration:none;font-weight:800;font-size:1.15rem}
main{max-width:920px;margin:0 auto;padding:1rem}nav.bc{font-size:.85rem;color:#6b6b80;margin:.3rem 0 1rem}
.pg{display:grid;gap:1.2rem}@media(min-width:720px){.pg{grid-template-columns:1fr 1fr}}
.pg img{width:100%;height:auto;max-height:480px;object-fit:contain;background:#fff;border:1px solid #e6e1f5;border-radius:14px}
h1{font-size:1.5rem;line-height:1.25;margin:.2rem 0 .6rem}.pr{font-size:1.7rem;font-weight:800;color:#5b21b6}.pr s{font-size:1rem;font-weight:500;color:#6b6b80}
.ok{color:#15803d;font-weight:700}.no{color:#b91c1c;font-weight:700}.btn{display:block;text-align:center;background:#16a34a;color:#fff;text-decoration:none;font-weight:800;padding:.85rem;border-radius:12px;margin:.8rem 0 .4rem}
.btn.alt{background:#fff;color:#6d28d9;border:2px solid #7c3aed}.btn.ask{margin:.2rem 0 .8rem;font-size:1.02rem;box-shadow:0 2px 8px rgba(22,163,74,.3)}.box{background:#fff;border:1px solid #e6e1f5;border-radius:14px;padding:.9rem 1rem;margin:1rem 0}
.desc{white-space:pre-line}ul.g{list-style:none;padding:0;display:grid;gap:.5rem;grid-template-columns:repeat(auto-fill,minmax(210px,1fr))}
ul.g img{display:block;width:100%;height:150px;object-fit:contain;background:#fff;border-radius:8px;margin-bottom:.5rem}ul.g li{background:#fff;border:1px solid #e6e1f5;border-radius:12px;padding:.7rem}ul.g a{text-decoration:none;font-weight:600;color:#1f1b2e}ul.g span{display:block;color:#5b21b6;font-weight:800}
footer{max-width:920px;margin:2rem auto;padding:1rem;color:#6b6b80;font-size:.85rem;border-top:1px solid #e6e1f5}
.stk{display:none}
@media(max-width:700px){main{padding-bottom:5.5rem}.stk{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:50;align-items:center;gap:.6rem;padding:.6rem .8rem calc(.6rem + env(safe-area-inset-bottom));background:#fff;border-top:1px solid #e6e1f5;box-shadow:0 -2px 10px rgba(31,27,46,.12)}
.stk b{flex:1;min-width:0;font-size:.95rem;line-height:1.2;color:#5b21b6}.stk b small{display:block;color:#1f1b2e;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.stk a{flex:none;text-decoration:none;font-weight:800;border-radius:10px;padding:.7rem .9rem;background:#16a34a;color:#fff}.stk a.call{background:#fff;color:#6d28d9;border:2px solid #7c3aed;padding:.6rem .8rem}}`;

const shell = ({ title, desc, path, og, body, ld, ogType = 'website', extra = '' }) => `<!doctype html>
<html lang="en-KE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${path}"><meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="${ogType}"><meta property="og:site_name" content="${BRAND}"><meta property="og:locale" content="en_KE">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${SITE}${path}">
<meta property="og:image" content="${esc(og || SITE + '/logo.png')}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(og || SITE + '/logo.png')}">${extra}
<meta name="theme-color" content="#7c3aed"><style>${CSS}</style>${ld || ''}</head><body>
<header><a href="${SITE}/">${BRAND}</a></header><main>${body}</main>
<footer>${BRAND} · Online store serving all of Kenya · Pay by M-Pesa · Delivery to all 47 counties · <a href="https://wa.me/${WHATSAPP}">WhatsApp +254 748 888 230</a>
· <a href="${SITE}/c/">All categories</a> · <a href="${SITE}/shipping.html">Shipping</a> · <a href="${SITE}/returns.html">Returns</a> · <a href="${SITE}/privacy.html">Privacy</a></footer><script src="/img-protect.js" defer></script><script src="/analytics.js" defer></script></body></html>`;

// Tidy names: drop any "| Stermont Arcade Kenya" / "| Buy in Kenya" tail (the page title adds its own wording).
const tidy = n => String(n).replace(/\s*\|.*$/, '').replace(/\s+/g, ' ').trim();
// When a product has several pack sizes, the shared name must not end in one size (e.g. "... 1L" on the 50 ml page).
const SIZE_END = /\s+\d+(?:\.\d+)?\s?(?:ml|l|ltr|litres?|liters?|g|kg)\s*$/i;
const rows = (await getProducts()).filter(p => p && p.id && p.name).map(p => ({ ...p, name: tidy(p.name) }));
// Approved customer reviews (public read). Failure or a missing table just means no review markup.
async function getReviews() {
  try {
    if (process.env.REVIEWS_JSON) return JSON.parse(readFileSync(process.env.REVIEWS_JSON, 'utf8'));
    const r = await fetch(`${SB}/rest/v1/reviews?status=eq.approved&select=product_name,rating,body,reviewer,created_at&order=created_at.desc&limit=1000`, { headers: { apikey: KEY } });
    return r.ok ? await r.json() : [];
  } catch { return []; }
}
const normName = n => tidy(n).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const reviewMap = {};
(await getReviews()).forEach(r => { if (r && r.product_name && Number(r.rating) >= 1 && Number(r.rating) <= 5) (reviewMap[normName(r.product_name)] = reviewMap[normName(r.product_name)] || []).push(r); });
const reviewsFor = p => [...new Set([p.name, ...(p.variants || []).map(v => v.name)].map(normName))].flatMap(k => reviewMap[k] || []);
const reviewLd = list => list.length ? {
  aggregateRating: { '@type': 'AggregateRating', ratingValue: (list.reduce((a, r) => a + Number(r.rating), 0) / list.length).toFixed(1), reviewCount: String(list.length), bestRating: '5', worstRating: '1' },
  review: list.slice(0, 10).map(r => ({ '@type': 'Review', reviewRating: { '@type': 'Rating', ratingValue: String(r.rating), bestRating: '5', worstRating: '1' }, author: { '@type': 'Person', name: r.reviewer || 'Customer' },
    datePublished: String(r.created_at || '').slice(0, 10) || undefined, reviewBody: r.body ? clip(r.body, 500) : undefined }))
} : {};

// Pack sizes of one product share a variant_group. They become ONE page (the earliest-created size is the stable page address);
// the other sizes get a small redirect page so old links keep working. This removes the "duplicate pages" Google reported.
const gmap = {};
rows.forEach(p => { if (p.variant_group && p.variant_label) (gmap[p.variant_group] = gmap[p.variant_group] || []).push(p); });
const products = [], aliases = [], seenG = new Set();
const inS = x => x.stock == null || Number(x.stock) > 0;
// true when the name already ends with the variant label, or every word/number of the label is already in the name
const labelInName = (name, label) => { const n = String(name).toLowerCase(), l = String(label).toLowerCase(), w = s => s.match(/[a-z0-9]+/g) || []; if (n.endsWith(l)) return true; const nw = new Set(w(n)), lw = w(l); return lw.length > 0 && lw.every(x => nw.has(x)); };
for (const p of rows) {
  const g = p.variant_group && p.variant_label ? gmap[p.variant_group] : null;
  if (g && g.length > 1) {
    if (seenG.has(p.variant_group)) continue;
    seenG.add(p.variant_group);
    const vs = [...g].sort((a, b) => Number(a.price) - Number(b.price)), live = vs.filter(inS), top = g[0];
    /* the one page of a product takes the name of the size the owner gave a ranking prefix ("#1 Top ...", "Best ...") if there is one, else the earliest size */
    const named = g.find(x => hasLeadWord(x.name)) || top;
    products.push({ ...top, name: named.name.replace(SIZE_END, '') || named.name, variants: vs, price: Number((live[0] || vs[0]).price), old_price: null, unit: null,
      stock: g.reduce((n, x) => n + (Number(x.stock) || 0), 0),
      images: [...new Set(g.flatMap(x => x.images || []).filter(Boolean))], description: g.map(x => x.description).find(Boolean) || '' });
    g.slice(1).forEach(x => aliases.push({ id: x.id, to: top.id }));
  } else products.push(g && !labelInName(p.name, p.variant_label) ? { ...p, name: `${p.name} \u2013 ${p.variant_label}` } : p);   // skip a label the name already carries (e.g. "... Set \u2013 Set", "... 3GB RAM + 64GB \u2013 3GB + 64GB")
}
// Retired duplicate listings: their old URLs forward to the product we kept (so links and Google results keep working).
const DUPES = {
  'jembe-star-500-sl-herbicide-1-litre': 'jembe-star-500sl-herbicide-1-litre',
  'kingcode-elite-50-ec-insecticide-1-litre': 'kingcode-elite-50ec-insecticide-1-litre',
  'zagro-ultraxide-disinfectant-for-poultry-livestock-farms-1-litre-2': 'zagro-ultraxide-disinfectant-for-poultry-livestock-farms-1-litre'
};
Object.entries(DUPES).forEach(([id, to]) => { if (products.some(p => p.id === to) && !products.some(p => p.id === id)) aliases.push({ id, to }); });
// Clean page addresses: /p/<slug>.html from the products.slug column. The product id stays the real key (cart, orders, stock) and is kept on each page in <meta name="stm-id">.
// A slug is only used when it is URL-safe and not the id or slug of another product; otherwise the page keeps its id address.
const slugOf = {};
{
  const allIds = new Set(rows.map(r => r.id)), usedSlugs = new Set();
  for (const r of rows) {
    const s = typeof r.slug === 'string' ? r.slug.trim() : '';
    if (s && s !== r.id && /^[a-z0-9][a-z0-9-]*$/.test(s) && !allIds.has(s) && !usedSlugs.has(s)) { slugOf[r.id] = s; usedSlugs.add(s); }
  }
}
const sl = id => slugOf[id] || id;
// The old id address of a renamed product becomes a redirect to its clean page.
products.forEach(p => { if (sl(p.id) !== p.id) aliases.push({ id: p.id, to: p.id }); });
// Permanent links: every slug a product ever had (table product_slug_redirects, filled by a database trigger) keeps forwarding to its current page.
{
  let hist = [];
  try {
    if (process.env.SLUG_REDIRECTS_JSON) hist = JSON.parse(readFileSync(process.env.SLUG_REDIRECTS_JSON, 'utf8'));
    else { const r = await fetch(`${SB}/rest/v1/product_slug_redirects?select=old_slug,product_id`, { headers: { apikey: KEY } }); if (r.ok) hist = await r.json(); }
  } catch { hist = []; }
  const topOf = {}; aliases.forEach(x => { topOf[x.id] = x.to; });
  const taken = new Set(); products.forEach(p => { taken.add(p.id); taken.add(sl(p.id)); }); aliases.forEach(x => taken.add(x.id));
  (Array.isArray(hist) ? hist : []).forEach(h => {
    if (!h || !h.old_slug || !h.product_id || taken.has(h.old_slug) || !/^[a-z0-9][a-z0-9-]*$/.test(h.old_slug)) return;
    const to = topOf[h.product_id] || h.product_id;
    if (!products.some(p => p.id === to)) return;
    taken.add(h.old_slug); aliases.push({ id: h.old_slug, to });
  });
}
const fileOf = path => `.${path}`.replace(/%[0-9A-F]{2}/gi, m => decodeURIComponent(m));
const byCat = {};
products.forEach(p => { const s = p.categories?.slug; if (s) (byCat[s] = byCat[s] || { name: p.categories.name, items: [] }).items.push(p); });

// "Hub" categories gather the products of their child categories, so one strong page (e.g. Pest Control & Fumigation) ranks for the broad search.
// Order matters: a hub that lists another hub as a kid (agrovet -> agrochemicals) must come after it.
const HUBS = {
  'pest-control-fumigation': { name: 'Pest Control & Fumigation', label: 'Pest control by type', kids: ['bed-bug-killers', 'cockroach-ant-killers', 'mosquito-fly-control', 'rodent-control', 'termite-control', 'fumigation-chemicals', 'sprayers-equipment'] },
  'agrochemicals': { name: 'Agrochemicals', label: 'Agrochemicals by type', kids: ['herbicides', 'fungicides', 'crop-insecticides', 'adjuvants-growth-regulators'] },
  'agrovet': { name: 'Agrovet', label: 'Agrovet by type', kids: ['agrochemicals', 'fertilizers', 'veterinary-drugs', 'animal-feeds', 'disinfectants-hygiene'] },
  'tvs-audio': { name: 'TVs & Audio', label: 'TVs and audio by type', kids: ['televisions', 'home-theatre', 'bluetooth-speakers', 'tv-mounts-accessories'] },
  'appliances': { name: 'Appliances', label: 'Appliances by type', kids: ['washing-machines', 'fridges-freezers', 'kitchen-dining'] }
};
for (const [slug, h] of Object.entries(HUBS)) {
  const items = [...(byCat[slug]?.items || [])];
  h.kids.forEach(k => (byCat[k]?.items || []).forEach(x => { if (!items.includes(x)) items.push(x); }));
  if (items.length) byCat[slug] = { name: h.name, items };
}
// Extra search-friendly text for category pages. Categories not listed here still get a normal page.
const INFO = {
  'pest-control-fumigation': { h1: 'Pest Control & Fumigation Products in Kenya', title: 'Pest Control & Fumigation Products in Kenya | Stermont Arcade',
    desc: 'Buy bed bug killers, insecticides and fumigation products online in Kenya. Pay by M-Pesa, delivery to all 47 counties. Order online at Stermont Arcade.',
    intro: 'Stermont Arcade stocks insecticides and pest control supplies for homes, hotels, hostels, offices, farms and public places. Look for a PCPB registration number on the label, read the label before use and keep chemicals away from children and pets. For large premises or fumigation of stores and grain, use a licensed pest control operator.' },
  'bed-bug-killers': { h1: 'Bed Bug Killers in Kenya', title: 'Bed Bug Killer in Kenya | Buy Online | Stermont Arcade',
    desc: 'Buy bed bug killer in Kenya. Registered insecticides for bed bug control in homes and public places. Pay by M-Pesa, delivery to all 47 counties.',
    intro: 'Insecticides for control of bed bugs in homes, hostels, hotels and other public places. Check the PCPB registration on the label and follow the label directions.',
    guide: `<h2>How to choose a bed bug killer in Kenya</h2>
<p>Bed bugs hide in mattress seams, bed frames, headboards, skirting boards and cracks in walls, so the product has to reach those hiding places. Most bed bug killers sold in Kenya are liquid insecticide concentrates that you dilute and spray on those spots. Pick a product that is registered for bed bugs, buy the pack size that matches the number of rooms or beds, and compare the active ingredient on the label.</p>
<ul>
<li><b>Check the PCPB registration.</b> Legal products carry a Pest Control Products Board registration number on the label.</li>
<li><b>Read the label for bed bugs.</b> Use only products whose label lists bed bugs and the surfaces you plan to treat.</li>
<li><b>Match the pack size to the job.</b> A single bed needs far less than a hostel, hotel or rental block. Ask us on WhatsApp if you are unsure.</li>
<li><b>Plan a second treatment.</b> Eggs can survive the first spray, so most infestations need a repeat after the interval given on the label.</li>
<li><b>Add safety gear.</b> Gloves, a mask and a sprayer make application safer and more even. See <a href="/c/sprayers-equipment.html">sprayers and protective wear</a>.</li>
</ul>
<h2>Bed bug treatment tips</h2>
<p>Wash bedding and clothes hot and dry them in strong sun or on high heat. Vacuum seams and floor edges and throw the dust away outside. Treat cracks, frame joints and furniture edges as the label directs, keep children, pets and food away during treatment, and never mix products. For a large or repeated infestation, a hotel or hostel, use a licensed pest control operator. Our full guide is here: <a href="/blog/how-to-get-rid-of-bed-bugs-kenya.html">how to get rid of bed bugs in Kenya, step by step</a>.</p>`,
    faq: [
      ['What is the best bed bug killer in Kenya?', 'There is no single best product. Choose an insecticide with a PCPB registration number whose label lists bed bugs, then match the pack size to your rooms. Compare the products above and message us on WhatsApp if you want help choosing.'],
      ['Can I order a bed bug killer online and pay by M-Pesa?', 'Yes. Add the product to your cart on stermontarcade.co.ke, pay by M-Pesa Paybill and enter the M-Pesa code from your SMS. We confirm stock and delivery before dispatch.'],
      ['Do you deliver bed bug killers outside Nairobi?', 'Yes. We deliver to all 47 counties, usually within 1 to 3 days. The delivery fee, if any, is confirmed before you pay.'],
      ['How many times should I treat for bed bugs?', 'Eggs can hatch after the first treatment, so a repeat is usually needed. Follow the interval printed on the product label and keep checking for several weeks.'],
      ['Is it safe to use bed bug spray at home?', 'Only if you follow the label. Wear gloves and a mask as advised, keep children, pets and food away during treatment, do not soak mattresses unless the label allows it and never mix products.']
    ] },
  'cockroach-ant-killers': { h1: 'Cockroach & Ant Killers in Kenya', title: 'Cockroach & Ant Killer in Kenya | Stermont Arcade',
    desc: 'Buy cockroach and ant killers online in Kenya. Pay by M-Pesa, delivery to all 47 counties.', intro: 'Sprays, gels and baits for cockroaches and ants in kitchens, restaurants, stores and homes.',
    guide: `<h2>How to choose a cockroach and ant killer in Kenya</h2>
<p>Cockroaches and ants live in cracks, behind appliances, under sinks and in drains, so the product must reach those places. Sprays treat surfaces and hiding spots, while gels and baits are placed where the insects feed. Choose a product whose label lists cockroaches or ants and the surfaces you plan to treat, and check for a PCPB registration number.</p>
<ul><li><b>Treat hiding places.</b> Focus on cracks, edges, drains, cupboards and behind fridges and cookers.</li><li><b>Clean first.</b> Remove food, grease and waste so the insects have less to eat.</li><li><b>Repeat if the label says so.</b> New insects hatch from eggs after treatment.</li><li><b>Food areas need extra care.</b> Follow the label on what to cover and when you can use the area again.</li></ul>
<p>For restaurants, hotels or large premises, use a licensed pest control operator. See also our <a href="/c/bed-bug-killers.html">bed bug killers</a> and <a href="/c/sprayers-equipment.html">sprayers and protective wear</a>.</p>`,
    faq: [
      ['Which cockroach killer should I buy in Kenya?', 'Choose a PCPB-registered product whose label lists cockroaches. Sprays suit surfaces and cracks, and gels or baits suit places where roaches feed. Message us on WhatsApp if you need help matching a product to your premises.'],
      ['Can I pay for cockroach and ant killers by M-Pesa?', 'Yes. Add the product to your cart, pay by M-Pesa Paybill and enter the M-Pesa code from your SMS. We confirm stock and delivery before dispatch.'],
      ['Do you deliver cockroach killers countrywide?', 'Yes. We deliver to all 47 counties, usually within 1 to 3 days. The delivery fee, if any, is confirmed before you pay.'],
      ['Is cockroach spray safe in a kitchen?', 'Only if you follow the label. Keep food, utensils, children and pets away during treatment and clean surfaces as the label directs before using the area again.']
    ] },
  'mosquito-fly-control': { h1: 'Mosquito & Fly Control in Kenya', title: 'Mosquito & Fly Control Products in Kenya | Stermont Arcade',
    desc: 'Buy mosquito and fly control products online in Kenya. Pay by M-Pesa, delivery to all 47 counties.', intro: 'Sprays and treatments for mosquitoes and flies in homes, compounds, farms and animal housing.',
    guide: `<h2>How to choose mosquito and fly control products in Kenya</h2>
<p>Mosquitoes and flies breed in standing water, waste and animal manure, so control works best when you treat the insects and remove the places they breed. Pick a product whose label lists mosquitoes or flies and the setting you are treating, such as a home, compound or animal house, and check for a PCPB registration number.</p>
<ul><li><b>Remove breeding sites.</b> Empty containers holding water, clear drains and clean animal housing regularly.</li><li><b>Match the product to the place.</b> Indoor sprays, compound treatments and farm products are not interchangeable.</li><li><b>Protect yourself.</b> Use the gloves and mask the label recommends and see <a href="/c/sprayers-equipment.html">sprayers and protective wear</a>.</li></ul>
<p>Related guide: <a href="/blog/mosquito-control-at-home-kenya.html">mosquito control at home in Kenya</a>.</p>`,
    faq: [
      ['What is the best way to control mosquitoes at home?', 'Remove standing water, keep drains and gutters clear and treat resting places with a PCPB-registered product that lists mosquitoes on its label. Screens and nets add protection.'],
      ['Can I order fly control products online in Kenya?', 'Yes. Order on stermontarcade.co.ke, pay by M-Pesa and we deliver to all 47 counties.'],
      ['Are fly sprays safe around animals?', 'Only products labelled for animal housing should be used there, and only as directed. Read the label and keep animals, feed and water covered or away during application.']
    ] },
  'rodent-control': { h1: 'Rat & Mouse Control in Kenya', title: 'Rat & Mouse Control Products in Kenya | Stermont Arcade',
    desc: 'Buy rat and mouse control products online in Kenya. Pay by M-Pesa, delivery to all 47 counties.', intro: 'Rodent control products for homes, shops, stores and farms. Keep baits out of reach of children, pets and livestock.',
    guide: `<h2>How to choose a rat and mouse killer in Kenya</h2>
<p>Rats and mice follow food and shelter, so the best results come from blocking entry points, removing food and using a registered rodent control product where they travel, such as along walls and near burrows. Choose a PCPB-registered product and place baits where children, pets and livestock cannot reach them.</p>
<ul><li><b>Seal gaps.</b> Close holes around pipes, doors and roofs.</li><li><b>Store food and feed in sealed containers.</b></li><li><b>Place baits safely.</b> Use covered bait stations or hidden spots as the label directs.</li><li><b>Remove dead rodents carefully</b> with gloves and dispose of them safely.</li></ul>
<p>Related guide: <a href="/blog/rat-and-mouse-control-kenya.html">rat and mouse control in Kenya</a>.</p>`,
    faq: [
      ['What is the best rat killer in Kenya?', 'Choose a PCPB-registered rodent product suited to where you will use it. Safe placement matters as much as the product, so follow the label and keep baits away from children, pets and livestock.'],
      ['Can I buy rat poison online and pay by M-Pesa?', 'Yes. Add it to your cart on stermontarcade.co.ke and pay by M-Pesa. We confirm stock and delivery before dispatch.'],
      ['How do I use rodent bait safely?', 'Place it only where children, pets and livestock cannot reach, usually in covered stations along walls and runways, wear gloves and follow the label.']
    ] },
  'termite-control': { h1: 'Termite Control in Kenya', title: 'Termite Control Products in Kenya | Stermont Arcade',
    desc: 'Buy termite control products online in Kenya. Pay by M-Pesa, delivery to all 47 counties.', intro: 'Termiticides and treatments for buildings, fences and timber.',
    guide: `<h2>How to choose a termite control product in Kenya</h2>
<p>Termites damage timber, fences and buildings from the soil or from inside the structure. Treatment depends on where they are, so read the label to see whether a product is meant for soil, timber or existing buildings, and check for a PCPB registration number. Large or hidden infestations in buildings are best handled by a licensed pest control operator.</p>
<ul><li><b>Find the source.</b> Look for mud tubes, hollow timber and soil mounds.</li><li><b>Reduce moisture and wood-to-soil contact.</b></li><li><b>Apply as the label directs</b>, using protective wear.</li></ul>
<p>Protective gear: <a href="/c/sprayers-equipment.html">sprayers, masks and gloves</a>.</p>`,
    faq: [
      ['How do I get rid of termites in Kenya?', 'Locate the source, reduce moisture and apply a PCPB-registered termite product exactly as its label directs. For large infestations in buildings, call a licensed pest control operator.'],
      ['Do you deliver termite products to all counties?', 'Yes. We deliver to all 47 counties, usually within 1 to 3 days, and confirm the delivery fee before you pay.']
    ] },
  'fumigation-chemicals': { h1: 'Fumigation Chemicals in Kenya', title: 'Fumigation Chemicals in Kenya | Stermont Arcade',
    desc: 'Buy fumigation chemicals online in Kenya. Pay by M-Pesa, delivery to all 47 counties.', intro: 'Chemicals for fumigation of stores, grain and premises. Use only as directed on the label, and use a licensed operator for large jobs.',
    guide: `<h2>Buying fumigation chemicals in Kenya</h2>
<p>Fumigation chemicals are hazardous and should be used only as the label directs. Check for a PCPB registration number, confirm the product is meant for your use, such as stores, grain or premises, and use a licensed operator for large jobs or enclosed spaces. Never enter a treated area until it is declared safe.</p>
<ul><li><b>Use trained operators for large jobs.</b></li><li><b>Wear the protective gear the label requires</b> (see <a href="/c/sprayers-equipment.html">protective wear</a>).</li><li><b>Keep people, pets and food out</b> until the label says it is safe.</li></ul>`,
    faq: [
      ['Where can I buy fumigation chemicals in Kenya?', 'Order online at Stermont Arcade, pay by M-Pesa and we deliver to all 47 counties. Check the PCPB registration on each product.'],
      ['Can I fumigate by myself?', 'Small jobs may be possible if the label allows it, but fumigation is hazardous. For large jobs, stores or enclosed spaces, use a licensed pest control operator.']
    ] },
  'sprayers-equipment': { h1: 'Pest Control Sprayers & Equipment in Kenya', title: 'Pest Control Sprayers & Equipment in Kenya | Stermont Arcade',
    desc: 'Buy pest control sprayers, masks and gloves online in Kenya. Pay by M-Pesa, delivery to all 47 counties.', intro: 'Sprayers, masks, gloves and protective wear for safe application of pest control products.',
    guide: `<h2>Choosing a sprayer and protective wear</h2>
<p>A sprayer that suits the job spreads the product evenly, and protective wear keeps it off your skin and out of your lungs. Hand sprayers suit rooms and small areas, while knapsack sprayers suit compounds and farms. Always wear the gloves, mask and clothing the product label recommends.</p>`,
    faq: [
      ['Which sprayer do I need for pest control?', 'Hand sprayers suit rooms and small jobs, and knapsack sprayers suit compounds and farms. Check the product label for any other requirements.'],
      ['Do I need a mask and gloves?', 'Yes, if the label says so, which is the case for most insecticides. Protective wear is sold here with the sprayers.']
    ] },
  'tvs-audio': { h1: 'TVs, Home Theatre & Audio in Kenya', title: 'TVs, Home Theatre & Speakers in Kenya | Stermont Arcade',
    desc: 'Buy smart TVs, home theatre systems, Bluetooth speakers and TV wall mounts online in Kenya. Pay by M-Pesa, delivery to all 47 counties.',
    intro: 'Smart TVs, home theatre systems, Bluetooth speakers and TV wall mounts from brands such as Hisense, TCL, Samsung, LG and Harman Kardon.' },
  'televisions': { h1: 'Smart TVs in Kenya', title: 'Buy Smart TVs in Kenya | 4K, QLED & Mini LED | Stermont Arcade',
    desc: 'Buy Hisense, TCL, Samsung and Vitron smart TVs online in Kenya. 4K UHD, QLED and Mini LED screens. Pay by M-Pesa, delivery to all 47 counties.',
    intro: 'Smart TVs from 43 inch to 75 inch, including 4K UHD, QLED and QD-Mini LED models. Some come as a bundle with a TV guard and a wall mount.' },
  'home-theatre': { h1: 'Home Theatre Systems in Kenya', title: 'Home Theatre Systems in Kenya | Stermont Arcade',
    desc: 'Buy home theatre and surround sound systems online in Kenya. Pay by M-Pesa, delivery to all 47 counties.',
    intro: 'Home theatre and surround sound systems for movies, music and sport in your living room.' },
  'bluetooth-speakers': { h1: 'Bluetooth Speakers in Kenya', title: 'Bluetooth Speakers in Kenya | Stermont Arcade',
    desc: 'Buy portable Bluetooth speakers online in Kenya. Pay by M-Pesa, delivery to all 47 counties.',
    intro: 'Portable Bluetooth speakers for the home, parties and travel.' },
  'tv-mounts-accessories': { h1: 'TV Wall Mounts & Accessories in Kenya', title: 'TV Wall Mounts & Accessories in Kenya | Stermont Arcade',
    desc: 'Buy TV wall mounts and brackets online in Kenya. Fixed and tilting mounts for 32 to 60 inch TVs. Pay by M-Pesa, delivery to all 47 counties.',
    intro: 'Wall mount brackets and accessories for flat screen TVs. Check that the mount supports your TV size and weight before you order.' },
  'appliances': { h1: 'Home Appliances in Kenya', title: 'Home Appliances in Kenya | Fridges, Washers & More | Stermont Arcade',
    desc: 'Buy fridges, washing machines and kitchen appliances online in Kenya. Pay by M-Pesa, delivery to all 47 counties.',
    intro: 'Fridges, washing machines and kitchen appliances for homes and small businesses.' },
  'washing-machines': { h1: 'Washing Machines in Kenya', title: 'Washing Machines in Kenya | Stermont Arcade',
    desc: 'Buy washing machines online in Kenya, including twin tub models. Pay by M-Pesa, delivery to all 47 counties.',
    intro: 'Washing machines for family laundry, including semi-automatic twin tub models.' },
  'fridges-freezers': { h1: 'Fridges & Freezers in Kenya', title: 'Fridges & Freezers in Kenya | Stermont Arcade',
    desc: 'Buy fridges and freezers online in Kenya, including double door models with water dispensers. Pay by M-Pesa, delivery to all 47 counties.',
    intro: 'Double door fridges and freezers for homes, shops and small businesses.' },
  'kitchen-dining': { h1: 'Kitchen Appliances in Kenya', title: 'Kitchen Appliances in Kenya | Stermont Arcade',
    desc: 'Buy pressure cookers, air fryers and other kitchen appliances online in Kenya. Pay by M-Pesa, delivery to all 47 counties.',
    intro: 'Pressure cookers, air fryers and other kitchen appliances for everyday cooking.' },
  'agrovet': { h1: 'Agrovet Supplies in Kenya', title: 'Agrovet Supplies in Kenya | Farm Inputs Online | Stermont Arcade',
    desc: 'Buy agrovet supplies online in Kenya: agrochemicals, fertilizers, veterinary drugs, animal feeds and farm disinfectants. Pay by M-Pesa, delivery to all 47 counties.',
    intro: 'Farm inputs for crops and livestock: agrochemicals, fertilizers, veterinary drugs, animal feeds and disinfectants. Look for a PCPB registration number on chemical labels and read the label before use.' },
  'agrochemicals': { h1: 'Agrochemicals in Kenya', title: 'Agrochemicals in Kenya | Herbicides & Fungicides | Stermont Arcade',
    desc: 'Buy herbicides, fungicides and crop insecticides online in Kenya. Pay by M-Pesa, delivery to all 47 counties.',
    intro: 'Herbicides, fungicides, crop insecticides and spray additives for farms of every size. Check the PCPB registration on the label, read the label before use and wear the protective gear it recommends.' },
  'herbicides': { h1: 'Herbicides in Kenya', title: 'Herbicides in Kenya | Weed Killers | Stermont Arcade',
    desc: 'Buy herbicides and weed killers online in Kenya. Pay by M-Pesa, delivery to all 47 counties.',
    intro: 'Herbicides for weed control in crops and fields. Use only on the crops listed on the label and follow the label directions.' },
  'fungicides': { h1: 'Fungicides in Kenya', title: 'Fungicides in Kenya | Crop Disease Control | Stermont Arcade',
    desc: 'Buy fungicides for crop disease control online in Kenya. Pay by M-Pesa, delivery to all 47 counties.',
    intro: 'Fungicides for control of fungal diseases such as blight and mildew in vegetables, fruits and field crops. Follow the label on crops, rates and spray intervals.' },
  'crop-insecticides': { h1: 'Crop Insecticides in Kenya', title: 'Crop Insecticides in Kenya | Farm Pest Control | Stermont Arcade',
    desc: 'Buy insecticides for crops and farms online in Kenya. Pay by M-Pesa, delivery to all 47 counties.',
    intro: 'Insecticides for crop pests such as caterpillars, aphids and mites. For pests in homes and buildings, see our pest control categories.' },
  'adjuvants-growth-regulators': { h1: 'Adjuvants & Growth Regulators in Kenya', title: 'Spray Adjuvants & Growth Regulators in Kenya | Stermont Arcade',
    desc: 'Buy spreader stickers, wetters and rooting hormones online in Kenya. Pay by M-Pesa, delivery to all 47 counties.',
    intro: 'Spray additives that help products spread and stick, and rooting hormones for cuttings and seedlings.' },
  'disinfectants-hygiene': { h1: 'Disinfectants & Farm Hygiene Products in Kenya', title: 'Disinfectants for Farms & Homes in Kenya | Stermont Arcade',
    desc: 'Buy disinfectants for poultry and livestock farms and general hygiene online in Kenya. Pay by M-Pesa, delivery to all 47 counties.',
    intro: 'Disinfectants for poultry houses, livestock pens and general cleaning. Dilute as the label directs and keep animals and feed away during treatment.' }
};
const crumbLd = items => jsonLd({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url })) });

rmSync('p', { recursive: true, force: true }); rmSync('c', { recursive: true, force: true });
mkdirSync('p', { recursive: true }); mkdirSync('c', { recursive: true });
const urls = [];

const thumb = p => { const u = (p.images || []).filter(Boolean)[0]; return u ? `<img src="${esc(u)}" alt="${esc(p.name)}" width="160" height="150" loading="lazy" decoding="async">` : ''; };
const card = p => `<li><a href="/p/${encodeURIComponent(sl(p.id))}.html">${thumb(p)}${esc(p.name)}</a><span>${p.variants ? 'From ' : ''}${money(p.price)}</span></li>`;

const NAMES = {};   // product id -> the heading its page shows; the shop list reads this (product-names.json) so list, view and page always carry the same wording
for (const p of products) {
  const path = `/p/${encodeURIComponent(sl(p.id))}.html`, cat = p.categories, img = (p.images || []).filter(Boolean);
  const inStock = p.stock == null || Number(p.stock) > 0, hasOld = Number(p.old_price) > Number(p.price);
  const revs = reviewsFor(p), rLd = reviewLd(revs);
  // Meta title (max 60 chars) and description (max 155 chars) come from seo-meta.mjs: "[Original] <name> \u2013 Price in Kenya | Stermont Arcade".
  // "Original / genuine" is only claimed for known brands and farm inputs; the price stays in the Product schema and on the page.
  const ctx = { brand: brandOf(p.name), catSlug: cat?.slug };
  const title = pdpTitle(p.name, ctx), desc = pdpDescription(p.name, ctx), h1 = pdpH1(p.name, ctx), tagline = pdpTagline(ctx), hd = pdpHeadings(cat?.slug);
  NAMES[p.id] = h1; (p.variants || []).forEach(v => { NAMES[v.id] = h1; });
  // Related products rotate through the category (the 6 that follow this one, wrapping round), so EVERY product, including the newest, gets links from other product pages.
  const related = (() => {
    if (!cat) return [];
    const list = byCat[cat.slug]?.items || [], i = list.findIndex(x => x.id === p.id);
    if (i < 0 || list.length < 2) return list.filter(x => x.id !== p.id).slice(0, 6);
    return Array.from({ length: Math.min(6, list.length - 1) }, (_, k) => list[(i + 1 + k) % list.length]);
  })();
  const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hello ${BRAND}, I want to order: ${p.name} (${money(p.price)}) ${SITE}${path}`)}`;
  const askLines = [`Hello ${BRAND}, I would like to enquire about this item:`, '', `Product: ${p.name}`, `Price: ${p.variants ? 'From ' : ''}${money(p.price)}${p.unit ? ' / ' + p.unit : ''}`,
    ...(p.variants ? [`Sizes: ${p.variants.map(v => v.variant_label).join(', ')}`] : []), `Availability: ${inStock ? 'In stock' : 'Currently sold out'}`, ...(cat ? [`Category: ${cat.name}`] : []), `Ref: ${p.id}`, `Link: ${SITE}${path}`, '', 'Please confirm availability and the delivery fee to my location.'];
  const ask = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(askLines.join('\n'))}`;
  const ldOne = jsonLd({
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, image: img.length ? img : undefined,
    description: clip(p.description, 500) || `Buy ${p.name} online in Kenya at ${BRAND}. Pay by M-Pesa, delivery to all 47 counties.`, sku: String(p.id), category: cat?.name,
    brand: { '@type': 'Brand', name: brandOf(p.name) },
    offers: { '@type': 'Offer', url: SITE + path, priceCurrency: 'KES', price: String(Math.round(Number(p.price) || 0)),
      availability: 'https://schema.org/' + (inStock ? 'InStock' : 'OutOfStock'), itemCondition: 'https://schema.org/NewCondition', hasMerchantReturnPolicy: RETURNS, shippingDetails: SHIPPING,
      seller: { '@type': 'Organization', name: BRAND } },
    ...rLd
  });
  const ldGroup = p.variants ? jsonLd({
    '@context': 'https://schema.org', '@type': 'ProductGroup', name: p.name, productGroupID: String(p.variant_group), variesBy: 'https://schema.org/size',
    description: clip(p.description, 500) || `Buy ${p.name} online in Kenya at ${BRAND}. Pay by M-Pesa, delivery to all 47 counties.`, category: cat?.name, brand: { '@type': 'Brand', name: brandOf(p.name) }, ...rLd,
    hasVariant: p.variants.map(v => ({ '@type': 'Product', name: `${p.name} \u2013 ${v.variant_label}`, sku: String(v.id), size: v.variant_label,
      image: (v.images || []).filter(Boolean).length ? (v.images || []).filter(Boolean) : undefined,
      offers: { '@type': 'Offer', url: SITE + path, priceCurrency: 'KES', price: String(Math.round(Number(v.price) || 0)),
        availability: 'https://schema.org/' + (inS(v) ? 'InStock' : 'OutOfStock'), itemCondition: 'https://schema.org/NewCondition', hasMerchantReturnPolicy: RETURNS, shippingDetails: SHIPPING,
        seller: { '@type': 'Organization', name: BRAND } } }))
  }) : '';
  const productFaqLd = jsonLd({
    '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [
      { '@type': 'Question', name: `How can I buy ${p.name} in Kenya?`, acceptedAnswer: { '@type': 'Answer', text: `You can order ${p.name} online at Stermont Arcade, pay securely by M-Pesa, and get delivery to all 47 counties in Kenya.` } },
      { '@type': 'Question', name: `Do you deliver ${p.name} outside Nairobi?`, acceptedAnswer: { '@type': 'Answer', text: `Yes, we deliver ${p.name} to all 47 counties across Kenya, typically within 1 to 3 days.` } },
      { '@type': 'Question', name: `What is the price of ${p.name}?`, acceptedAnswer: { '@type': 'Answer', text: `The price of ${p.name} is ${money(p.price)}${p.unit ? ' / ' + p.unit : ''}. You can order directly on our website or via WhatsApp.` } }
    ]
  });
  const ld = (p.variants ? ldGroup : ldOne) + productFaqLd + (cat ? crumbLd([['Home', SITE + '/'], [cat.name, `${SITE}/c/${encodeURIComponent(cat.slug)}.html`], [p.name, SITE + path]]) : '');
  const sizeBox = p.variants ? `<div class="box"><h2 style="margin-top:0">Available sizes</h2><ul class="g">${p.variants.map(v => {
    const w = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hello ${BRAND}, I want to order: ${p.name} \u2013 ${v.variant_label} (${money(v.price)}) ${SITE}${path}`)}`;
    return `<li>${esc(v.variant_label)}<span>${money(v.price)}</span><small class="${inS(v) ? 'ok' : 'no'}">${inS(v) ? 'In stock' : 'Sold out'}</small>${inS(v) ? ` <a href="${esc(w)}">Order on WhatsApp</a>` : ''}</li>`; }).join('')}</ul></div>` : '';
  // Local-utility sections (H2s): what it is used for, price and M-Pesa ordering, delivery and Sarit Centre pickup. Facts match shipping.html and nairobi.html.
  const nameE = esc(p.name), priceTxt = `${p.variants ? 'from ' : ''}${money(p.price)}${p.unit ? ' / ' + esc(p.unit) : ''}`;
  const usesTxt = isPcpb(cat?.slug)
    ? `Use ${nameE} only as directed on the label: the ${isPest(cat?.slug) ? 'pests' : 'crops and pests'} it lists, the rate and the interval between treatments. Check the PCPB registration number on the pack, wear the gloves and mask the label recommends and keep children, pets and food away.${isPest(cat?.slug) ? ' Fighting kunguni, mchwa, mende, mbu or panya?' : ''} Not sure it fits your problem? <a href="${esc(ask)}" rel="noopener">Ask us on WhatsApp</a> before you order.`
    : `Follow the use and dosage instructions on the pack and read the label before you buy. <a href="${esc(ask)}" rel="noopener">Ask us on WhatsApp</a> if you are not sure it suits your need.`;
  const seoBoxes = `${hd.uses ? `<div class="box"><h2 style="margin-top:0">${esc(hd.uses)}</h2><p>${usesTxt}</p></div>` : ''}
<div class="box"><h2 style="margin-top:0">${esc(hd.price)}</h2><p>${nameE} costs <b>${priceTxt}</b> at ${BRAND}${inStock ? ' and is in stock' : ', but is currently sold out, so ask us when it is back'}. Add it to your cart, pay by M-Pesa and enter the M-Pesa code from your SMS, or <a href="${esc(inStock ? wa : ask)}" rel="noopener">order on WhatsApp</a>. Buying in bulk? Message us for a quote.</p></div>
<div class="box"><h2 style="margin-top:0">${esc(hd.delivery)}</h2><p>Orders to Nairobi usually arrive the same day or the next day, and the other counties usually within 1 to 3 days. We confirm the delivery fee for your location before you pay. Prefer store pickup? Collect at The Sarit Centre, Karuna Road, Westlands, open daily 8 AM to 8 PM, and confirm stock on WhatsApp first. See <a href="/shipping.html">shipping</a> and <a href="/nairobi.html">Nairobi delivery and pickup</a>.</p></div>`;
  const body = `<a class="btn ask" href="${esc(ask)}" rel="noopener">\u{1F4AC} Ask about this item on WhatsApp</a>\n<nav class="bc"><a href="${SITE}/">Home</a>${cat ? ` › <a href="/c/${encodeURIComponent(cat.slug)}.html">${esc(cat.name)}</a>` : ''} › ${esc(p.name)}</nav>
<div class="pg"><div>${img[0] ? `<img src="${esc(img[0])}" alt="${esc(p.name)} - buy online in Kenya" fetchpriority="high">` : `<img src="/placeholder.svg" alt="${esc(p.name)} - photo coming soon" width="720" height="720"><p style="text-align:center;margin-top:.5rem"><a href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hello ${BRAND}, please send me a photo of ${p.name} ${SITE}${path}`)}">Ask for a photo on WhatsApp</a></p>`}</div>
<div><h1>${esc(h1)}</h1><p class="tagline" style="margin:.1rem 0 .6rem;color:#5b21b6;font-weight:600">${esc(tagline)}</p><div class="pr">${hasOld ? `<s>${money(p.old_price)}</s> ` : ''}${p.variants ? 'From ' : ''}${money(p.price)}${p.unit ? ` <small>/ ${esc(p.unit)}</small>` : ''}</div>
<p class="${inStock ? 'ok' : 'no'}">${inStock ? 'In stock' : 'Currently sold out'}</p>
<p>Buy ${esc(p.name)} online in Kenya from ${BRAND}. Pay by M-Pesa and get delivery to all 47 counties.</p>
<a class="btn" href="${esc(wa)}">Order on WhatsApp</a><a class="btn alt" href="${SITE}/">Shop all products and add to cart</a>
<div class="box">✔ Pay by M-Pesa &nbsp; ✔ Delivery to all 47 counties &nbsp; ✔ 48-hour returns on faulty items</div></div></div>
${sizeBox}
${p.description ? `<div class="box"><h2 style="margin-top:0">About ${esc(p.name)}</h2><div class="desc">${esc(p.description)}</div></div>` : ''}
${seoBoxes}
${revs.length ? `<div class="box"><h2 style="margin-top:0">Customer reviews (${(revs.reduce((a, r) => a + Number(r.rating), 0) / revs.length).toFixed(1)} / 5 from ${revs.length})</h2>${revs.slice(0, 10).map(r => `<p><b>${'\u2605'.repeat(r.rating)}${'\u2606'.repeat(5 - r.rating)}</b> ${esc(r.reviewer || 'Customer')}${r.body ? '<br>' + esc(r.body) : ''}</p>`).join('')}</div>` : ''}
${related.length ? `<h2>More in ${esc(cat.name)}</h2><ul class="g">${related.map(card).join('')}</ul>` : ''}
<div class="stk" role="complementary" aria-label="Order this product"><b>${p.variants ? 'From ' : ''}${money(p.price)}<small>${esc(p.name)}</small></b><a class="call" href="tel:+${WHATSAPP}" aria-label="Call ${BRAND}">Call</a><a href="${esc(inStock ? wa : ask)}">${inStock ? 'Order on WhatsApp' : 'Ask on WhatsApp'}</a></div>`;
  writeFileSync(`.${path}`.replace(/%[0-9A-F]{2}/gi, m => decodeURIComponent(m)), shell({ title, desc, path, og: img[0], body, ld, ogType: 'product', extra: `<meta name="stm-id" content="${esc(p.id)}"><meta name="stm-seo" content="v2"><meta property="product:price:amount" content="${Math.round(Number(p.price) || 0)}"><meta property="product:price:currency" content="KES"><meta property="product:availability" content="${inStock ? 'in stock' : 'out of stock'}">` }));
  urls.push(path);
}

for (const a of aliases) {
  const from = `/p/${encodeURIComponent(a.id)}.html`, to = `${SITE}/p/${encodeURIComponent(sl(a.to))}.html`;
  writeFileSync(fileOf(from), `<!doctype html><html lang="en-KE"><head><meta charset="utf-8"><title>Redirecting\u2026</title><link rel="canonical" href="${to}"><meta http-equiv="refresh" content="0;url=${to}"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><p>This product moved. <a href="${to}">Continue to the product page</a>.</p></body></html>`);
}

for (const [slug, c] of Object.entries(byCat)) {
  const path = `/c/${encodeURIComponent(slug)}.html`;
  const info = INFO[slug] || {};
  const title = info.title || catTitle(c.name);   // seo-meta.mjs pattern, <= 60 chars (small categories are skipped by seo-kenya.mjs, so they must be right here)
  const desc = info.desc || catDescription(c.name, slug);
  const ld = jsonLd({ '@context': 'https://schema.org', '@type': 'ItemList', name: c.name, itemListElement: c.items.slice(0, 50).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/p/${encodeURIComponent(sl(p.id))}.html`, name: p.name })) });
  const body = `<nav class="bc"><a href="${SITE}/">Home</a> › ${esc(c.name)}</nav><h1>${esc(info.h1 || c.name + ' in Kenya')}</h1>
<p>${esc(info.intro || 'Order online and pay by M-Pesa. We deliver to all 47 counties.')} Order online, pay by M-Pesa, delivery to all 47 counties.</p><ul class="g">${c.items.map(card).join('')}</ul>
${HUBS[slug] ? '<h2>' + esc(HUBS[slug].label || 'Browse by type') + '</h2><ul class="g">' + HUBS[slug].kids.filter(k => byCat[k]).map(k => `<li><a href="/c/${k}.html">${esc(byCat[k].name)}</a></li>`).join('') + '</ul>' : ''}
${info.guide || ''}
${info.faq ? '<h2>Frequently asked questions</h2>' + info.faq.map(([q, a]) => `<div class="box"><b>${esc(q)}</b><p>${esc(a)}</p></div>`).join('') : ''}
<p><a href="/c/">Browse all categories</a></p>`;
  const faqLd = info.faq ? jsonLd({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: info.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }) : '';
  writeFileSync(`.${path}`.replace(/%[0-9A-F]{2}/gi, m => decodeURIComponent(m)), shell({ title, desc, path, body, ld: ld + faqLd + crumbLd([['Home', SITE + '/'], ['All categories', SITE + '/c/'], [c.name, SITE + path]]) }));
  urls.push(path);
}

// /c/ lists every category that has products, so Google and visitors can reach each category page from one place.
{
  const order = Object.entries(byCat).sort((a, b) => (b[0] === 'pest-control-fumigation') - (a[0] === 'pest-control-fumigation') || a[1].name.localeCompare(b[1].name));
  const body = `<nav class="bc"><a href="${SITE}/">Home</a> › All categories</nav><h1>Shop by category in Kenya</h1>
<p>Pest control and fumigation, agrovet, electronics, home goods and more. Pay by M-Pesa, delivery to all 47 counties.</p>
<ul class="g">${order.map(([slug, c]) => `<li><a href="/c/${encodeURIComponent(slug)}.html">${esc(c.name)}</a><span>${c.items.length} product${c.items.length === 1 ? '' : 's'}</span></li>`).join('')}</ul>`;
  writeFileSync('c/index.html', shell({ title: `Shop by Category in Kenya | ${BRAND}`, desc: `Browse all categories at ${BRAND}: pest control and fumigation, agrovet, electronics, home goods and more. Pay by M-Pesa, delivery to all 47 counties.`, path: '/c/', body,
    ld: crumbLd([['Home', SITE + '/'], ['All categories', SITE + '/c/']]) }));
  urls.push('/c/');
}

// /products.html: one crawlable page that lists every product, grouped by category, so Google and visitors can reach all of them from one place.
{
  const groups = {};
  products.forEach(p => { const k = p.categories?.slug || '_'; (groups[k] = groups[k] || { name: p.categories?.name || 'Other products', slug: p.categories?.slug, items: [] }).items.push(p); });
  const list = Object.values(groups).sort((a, b) => (a.slug ? 0 : 1) - (b.slug ? 0 : 1) || a.name.localeCompare(b.name));
  const body = `<nav class="bc"><a href="${SITE}/">Home</a> › All products</nav><h1>All products at ${BRAND}</h1>
<p>${products.length} product${products.length === 1 ? '' : 's'} to order online in Kenya. Pay by M-Pesa, delivery to all 47 counties. Cannot see what you need? <a href="https://wa.me/${WHATSAPP}">Ask us on WhatsApp</a> and we will source it.</p>
${list.map(g => `<h2>${g.slug ? `<a href="/c/${encodeURIComponent(g.slug)}.html">${esc(g.name)}</a>` : esc(g.name)}</h2><ul class="g">${g.items.map(card).join('')}</ul>`).join('\n')}
<p><a href="/c/">Browse all categories</a></p>`;
  const ld = jsonLd({ '@context': 'https://schema.org', '@type': 'ItemList', name: `All products at ${BRAND}`, itemListElement: products.slice(0, 100).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/p/${encodeURIComponent(sl(p.id))}.html`, name: p.name })) });
  writeFileSync('products.html', shell({ title: `All Products | Buy Online in Kenya | ${BRAND}`, desc: `Browse every product at ${BRAND}: pest control, agrovet, appliances and more. Pay by M-Pesa, delivery to all 47 counties.`, path: '/products.html', body,
    ld: ld + crumbLd([['Home', SITE + '/'], ['All products', SITE + '/products.html']]) }));
  urls.push('/products.html');
}

// Google Merchant Center product feed (free listings). One item per size/variant; submit https://stermontarcade.co.ke/merchant-feed.xml in Merchant Center.
{
  const pageOf = {}; aliases.forEach(a => { pageOf[a.id] = a.to; });
  const feed = [];
  for (const p of rows) {
    const imgs = (p.images || []).filter(Boolean); if (!imgs.length || !(Number(p.price) > 0)) continue;
    const grouped = p.variant_group && p.variant_label && gmap[p.variant_group]?.length > 1;
    const title = clip(grouped ? `${p.name.replace(SIZE_END, '') || p.name} ${p.variant_label}` : p.name, 150);
    const page = `${SITE}/p/${encodeURIComponent(sl(pageOf[p.id] || p.id))}.html`;
    const price = Math.round(Number(p.price)), old = Math.round(Number(p.old_price) || 0);
    feed.push(`<item><g:id>${esc(p.id)}</g:id><title>${esc(title)}</title><description>${esc(clip(p.description, 4000) || `${title} available at ${BRAND}, Kenya. Pay by M-Pesa, delivery to all 47 counties.`)}</description>
<link>${esc(page)}</link><g:image_link>${esc(imgs[0])}</g:image_link>${imgs.slice(1, 10).map(u => `<g:additional_image_link>${esc(u)}</g:additional_image_link>`).join('')}
<g:availability>${inS(p) ? 'in_stock' : 'out_of_stock'}</g:availability>${old > price ? `<g:price>${old} KES</g:price><g:sale_price>${price} KES</g:sale_price>` : `<g:price>${price} KES</g:price>`}
<g:brand>${esc(brandOf(p.name))}</g:brand><g:condition>new</g:condition><g:identifier_exists>no</g:identifier_exists>${p.categories?.name ? `<g:product_type>${esc(p.categories.name)}</g:product_type>` : ''}${grouped ? `<g:item_group_id>${esc(p.variant_group)}</g:item_group_id>` : ''}</item>`);
  }
  writeFileSync('merchant-feed.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>${BRAND}</title><link>${SITE}/</link><description>${BRAND} product feed</description>\n${feed.join('\n')}\n</channel></rss>\n`);
  console.log(`Merchant feed: ${feed.length} items.`);
}

// Homepage: the storefront loads its products with JavaScript, so give crawlers plain links to every category and a spread of products.
// Only the part between the two markers in index.html is rewritten on each build.
{
  const HOME = 'index.html', A = '<!-- seo-links:start -->', B = '<!-- seo-links:end -->';
  if (existsSync(HOME) && readFileSync(HOME, 'utf8').includes(A) && readFileSync(HOME, 'utf8').includes(B)) {
    const catsAll = Object.entries(byCat).sort((a, b) => (b[0] === 'pest-control-fumigation') - (a[0] === 'pest-control-fumigation') || a[1].name.localeCompare(b[1].name));
    const seen = new Set(), picks = [];
    for (const p of products) {
      const k = p.categories?.slug, ok = p.stock == null || Number(p.stock) > 0;
      if (!k || seen.has(k) || !ok || !(p.images || []).filter(Boolean).length) continue;
      seen.add(k); picks.push(p);
    }
    picks.sort((a, b) => (b.categories.slug === 'pest-control-fumigation') - (a.categories.slug === 'pest-control-fumigation'));
    const html = `${A}
<section class="seo-links" aria-labelledby="seo-cats"><div class="wrap">
<style>.seo-links{padding:1.5rem 0 .5rem}.seo-links h2{font-size:1.25rem;margin:0 0 .6rem}.seo-links ul{list-style:none;display:flex;flex-wrap:wrap;gap:.5rem;margin:0 0 1.2rem;padding:0}.seo-links li a{display:inline-block;background:var(--panel);border:1px solid var(--line);border-radius:999px;padding:.35rem .85rem;font-size:.92rem;color:var(--ink);text-decoration:none}.seo-links li a:hover{border-color:currentColor}</style>
<h2 id="seo-cats">Shop by category</h2>
<ul>${catsAll.map(([slug, c]) => `<li><a href="/c/${encodeURIComponent(slug)}.html">${esc(c.name)}</a></li>`).join('')}</ul>
<h2>Popular products</h2>
<ul>${picks.slice(0, 12).map(p => `<li><a href="/p/${encodeURIComponent(sl(p.id))}.html">${esc(p.name)}</a></li>`).join('')}</ul>
<h2>New arrivals</h2>
<ul>${[...products].reverse().slice(0, 16).map(p => `<li><a href="/p/${encodeURIComponent(sl(p.id))}.html">${esc(p.name)}</a></li>`).join('')}</ul>
<p><a href="/products.html">View all ${products.length} products</a> &middot; <a href="/c/">All categories</a></p>
</div></section>
${B}`;
    const cur = readFileSync(HOME, 'utf8');
    const out = cur.slice(0, cur.indexOf(A)) + html + cur.slice(cur.indexOf(B) + B.length);
    if (out !== cur) writeFileSync(HOME, out);
    console.log(`Homepage links: ${catsAll.length} categories, ${Math.min(picks.length, 12)} products.`);
  } else console.log('Homepage markers not found - skipped homepage links.');
}

// lastmod only moves when a page's content really changed. Google ignores sitemaps whose dates change on every build.
const today = new Date().toISOString().slice(0, 10);
const STATE = 'sitemap-state.json';
let prev = {};
try {
  if (existsSync(STATE)) {
    const rawState = readFileSync(STATE, 'utf8').trim();
    if (rawState) prev = JSON.parse(rawState);
  }
} catch (e) {
  console.log('Warning: could not parse sitemap-state.json, resetting state.', e.message);
  prev = {};
}
const next = {};
for (const u of urls) {
  const file = u.endsWith('/') ? `.${u}index.html` : fileOf(u);
  const hash = existsSync(file) ? createHash('sha1').update(readFileSync(file)).digest('hex') : '';
  next[u] = { hash, lastmod: prev[u] && prev[u].hash === hash ? prev[u].lastmod : today };
}
writeFileSync('product-names.json', JSON.stringify(NAMES));
writeFileSync(STATE, JSON.stringify(next, null, 1));
writeFileSync('sitemap-products.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `<url><loc>${SITE}${u}</loc><lastmod>${next[u].lastmod}</lastmod></url>`).join('\n') + `\n</urlset>\n`);
console.log(`Built ${products.length} product pages and ${Object.keys(byCat).length} category pages.`);
