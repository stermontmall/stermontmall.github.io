// Stermont Arcade - builds a real web page for every product + category, and a sitemap for Google.
// Runs automatically on GitHub (see .github/workflows/product-pages.yml). No installs needed (Node 18+).
import { writeFileSync, mkdirSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const SITE = 'https://stermontarcade.co.ke';
const SB = 'https://oewvtbnmyombbtggamor.supabase.co';
const KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7';
const WHATSAPP = '254748888230';
const BRAND = 'Stermont Arcade';
// Real product brand for Google. Add more brands here any time; if none matches, the store name is used.
const BRANDS = ['Kungu Nil', 'Greenlife', 'Zagro', 'Alonze', 'Pentagon', 'Absolute', 'Abasi', 'Hisense', 'Samsung', 'LG', 'Tecno', 'Infinix', 'Itel', 'Oppo', 'Xiaomi', 'Redmi', 'Apple', 'Nokia', 'Sony', 'JBL', 'TCL', 'Syinix', 'Vitron', 'Ramtons', 'Von', 'Mika', 'Nunix', 'Sayona', 'HP', 'Dell', 'Lenovo', 'Asus', 'Acer', 'Philips', 'Bruhm', 'Rockstar', 'Snake'];
const brandOf = name => { const n = ` ${String(name).toLowerCase()} `; const hit = BRANDS.filter(b => n.includes(` ${b.toLowerCase()} `)).sort((a, b) => b.length - a.length)[0]; return hit || BRAND; };
const RETURNS = { '@type': 'MerchantReturnPolicy', applicableCountry: 'KE', returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow', merchantReturnDays: 2, url: 'https://stermontarcade.co.ke/returns.html' };

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
  const cols = ['id,name,price,old_price,unit,variant_group,variant_label,stock,images,description,categories(name,slug)',
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
.btn.alt{background:#fff;color:#6d28d9;border:2px solid #7c3aed}.box{background:#fff;border:1px solid #e6e1f5;border-radius:14px;padding:.9rem 1rem;margin:1rem 0}
.desc{white-space:pre-line}ul.g{list-style:none;padding:0;display:grid;gap:.5rem;grid-template-columns:repeat(auto-fill,minmax(210px,1fr))}
ul.g li{background:#fff;border:1px solid #e6e1f5;border-radius:12px;padding:.7rem}ul.g a{text-decoration:none;font-weight:600;color:#1f1b2e}ul.g span{display:block;color:#5b21b6;font-weight:800}
footer{max-width:920px;margin:2rem auto;padding:1rem;color:#6b6b80;font-size:.85rem;border-top:1px solid #e6e1f5}`;

const shell = ({ title, desc, path, og, body, ld }) => `<!doctype html>
<html lang="en-KE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${path}"><meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website"><meta property="og:site_name" content="${BRAND}"><meta property="og:locale" content="en_KE">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${SITE}${path}">
<meta property="og:image" content="${esc(og || SITE + '/logo.png')}"><meta name="twitter:card" content="summary_large_image">
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
for (const p of rows) {
  const g = p.variant_group && p.variant_label ? gmap[p.variant_group] : null;
  if (g && g.length > 1) {
    if (seenG.has(p.variant_group)) continue;
    seenG.add(p.variant_group);
    const vs = [...g].sort((a, b) => Number(a.price) - Number(b.price)), live = vs.filter(inS), top = g[0];
    products.push({ ...top, name: top.name.replace(SIZE_END, '') || top.name, variants: vs, price: Number((live[0] || vs[0]).price), old_price: null, unit: null,
      stock: g.reduce((n, x) => n + (Number(x.stock) || 0), 0),
      images: [...new Set(g.flatMap(x => x.images || []).filter(Boolean))], description: g.map(x => x.description).find(Boolean) || '' });
    g.slice(1).forEach(x => aliases.push({ id: x.id, to: top.id }));
  } else products.push(g ? { ...p, name: `${p.name} \u2013 ${p.variant_label}` } : p);
}
const fileOf = path => `.${path}`.replace(/%[0-9A-F]{2}/gi, m => decodeURIComponent(m));
const byCat = {};
products.forEach(p => { const s = p.categories?.slug; if (s) (byCat[s] = byCat[s] || { name: p.categories.name, items: [] }).items.push(p); });

// "Hub" categories gather the products of their child categories, so one strong page (e.g. Pest Control & Fumigation) ranks for the broad search.
const HUBS = { 'pest-control-fumigation': { name: 'Pest Control & Fumigation', kids: ['bed-bug-killers', 'cockroach-ant-killers', 'mosquito-fly-control', 'rodent-control', 'termite-control', 'fumigation-chemicals', 'sprayers-equipment'] } };
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
    desc: 'Buy cockroach and ant killers online in Kenya. Pay by M-Pesa, delivery to all 47 counties.', intro: 'Sprays, gels and baits for cockroaches and ants in kitchens, restaurants, stores and homes.' },
  'mosquito-fly-control': { h1: 'Mosquito & Fly Control in Kenya', title: 'Mosquito & Fly Control Products in Kenya | Stermont Arcade',
    desc: 'Buy mosquito and fly control products online in Kenya. Pay by M-Pesa, delivery to all 47 counties.', intro: 'Sprays and treatments for mosquitoes and flies in homes, compounds, farms and animal housing.' },
  'rodent-control': { h1: 'Rat & Mouse Control in Kenya', title: 'Rat & Mouse Control Products in Kenya | Stermont Arcade',
    desc: 'Buy rat and mouse control products online in Kenya. Pay by M-Pesa, delivery to all 47 counties.', intro: 'Rodent control products for homes, shops, stores and farms. Keep baits out of reach of children, pets and livestock.' },
  'termite-control': { h1: 'Termite Control in Kenya', title: 'Termite Control Products in Kenya | Stermont Arcade',
    desc: 'Buy termite control products online in Kenya. Pay by M-Pesa, delivery to all 47 counties.', intro: 'Termiticides and treatments for buildings, fences and timber.' },
  'fumigation-chemicals': { h1: 'Fumigation Chemicals in Kenya', title: 'Fumigation Chemicals in Kenya | Stermont Arcade',
    desc: 'Buy fumigation chemicals online in Kenya. Pay by M-Pesa, delivery to all 47 counties.', intro: 'Chemicals for fumigation of stores, grain and premises. Use only as directed on the label, and use a licensed operator for large jobs.' },
  'sprayers-equipment': { h1: 'Pest Control Sprayers & Equipment in Kenya', title: 'Pest Control Sprayers & Equipment in Kenya | Stermont Arcade',
    desc: 'Buy pest control sprayers, masks and gloves online in Kenya. Pay by M-Pesa, delivery to all 47 counties.', intro: 'Sprayers, masks, gloves and protective wear for safe application of pest control products.' }
};
const crumbLd = items => jsonLd({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url })) });

rmSync('p', { recursive: true, force: true }); rmSync('c', { recursive: true, force: true });
mkdirSync('p', { recursive: true }); mkdirSync('c', { recursive: true });
const urls = [];

const card = p => `<li><a href="/p/${encodeURIComponent(p.id)}.html">${esc(p.name)}</a><span>${p.variants ? 'From ' : ''}${money(p.price)}</span></li>`;

for (const p of products) {
  const path = `/p/${encodeURIComponent(p.id)}.html`, cat = p.categories, img = (p.images || []).filter(Boolean);
  const inStock = p.stock == null || Number(p.stock) > 0, hasOld = Number(p.old_price) > Number(p.price);
  const revs = reviewsFor(p), rLd = reviewLd(revs);
  const plain = clip(p.description, 150);
  const sizes = p.variants ? ' Sizes: ' + p.variants.map(v => v.variant_label).join(', ') + '.' : '';
  const desc = clip(`Buy ${p.name} ${p.variants ? 'from' : 'at'} ${money(p.price)} in Kenya.${sizes} ${plain ? plain + ' ' : ''}Pay by M-Pesa, delivery to all 47 counties. Order online at ${BRAND}.`, 158);
  const title = [`${p.name} Price in Kenya | ${BRAND}`, `${p.name} | ${BRAND}`].find(t => t.length <= 70) || clip(`${p.name} | ${BRAND}`, 70);   // keep under ~70 characters so Google does not cut it off
  const related = cat ? (byCat[cat.slug]?.items || []).filter(x => x.id !== p.id).slice(0, 6) : [];
  const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hello ${BRAND}, I want to order: ${p.name} (${money(p.price)}) ${SITE}${path}`)}`;
  const ldOne = jsonLd({
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, image: img.length ? img : undefined,
    description: clip(p.description, 500) || `${p.name} available at ${BRAND}, Kenya.`, sku: String(p.id), category: cat?.name,
    brand: { '@type': 'Brand', name: brandOf(p.name) },
    offers: { '@type': 'Offer', url: SITE + path, priceCurrency: 'KES', price: String(Math.round(Number(p.price) || 0)),
      availability: 'https://schema.org/' + (inStock ? 'InStock' : 'OutOfStock'), itemCondition: 'https://schema.org/NewCondition', hasMerchantReturnPolicy: RETURNS,
      seller: { '@type': 'Organization', name: BRAND } },
    ...rLd
  });
  const ldGroup = p.variants ? jsonLd({
    '@context': 'https://schema.org', '@type': 'ProductGroup', name: p.name, productGroupID: String(p.variant_group), variesBy: 'https://schema.org/size',
    description: clip(p.description, 500) || `${p.name} available at ${BRAND}, Kenya.`, category: cat?.name, brand: { '@type': 'Brand', name: brandOf(p.name) }, ...rLd,
    hasVariant: p.variants.map(v => ({ '@type': 'Product', name: `${p.name} \u2013 ${v.variant_label}`, sku: String(v.id), size: v.variant_label,
      image: (v.images || []).filter(Boolean).length ? (v.images || []).filter(Boolean) : undefined,
      offers: { '@type': 'Offer', url: SITE + path, priceCurrency: 'KES', price: String(Math.round(Number(v.price) || 0)),
        availability: 'https://schema.org/' + (inS(v) ? 'InStock' : 'OutOfStock'), itemCondition: 'https://schema.org/NewCondition', hasMerchantReturnPolicy: RETURNS,
        seller: { '@type': 'Organization', name: BRAND } } }))
  }) : '';
  const ld = (p.variants ? ldGroup : ldOne) + (cat ? crumbLd([['Home', SITE + '/'], [cat.name, `${SITE}/c/${encodeURIComponent(cat.slug)}.html`], [p.name, SITE + path]]) : '');
  const sizeBox = p.variants ? `<div class="box"><h2 style="margin-top:0">Available sizes</h2><ul class="g">${p.variants.map(v => {
    const w = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hello ${BRAND}, I want to order: ${p.name} \u2013 ${v.variant_label} (${money(v.price)}) ${SITE}${path}`)}`;
    return `<li>${esc(v.variant_label)}<span>${money(v.price)}</span><small class="${inS(v) ? 'ok' : 'no'}">${inS(v) ? 'In stock' : 'Sold out'}</small>${inS(v) ? ` <a href="${esc(w)}">Order on WhatsApp</a>` : ''}</li>`; }).join('')}</ul></div>` : '';
  const body = `<nav class="bc"><a href="${SITE}/">Home</a>${cat ? ` › <a href="/c/${encodeURIComponent(cat.slug)}.html">${esc(cat.name)}</a>` : ''} › ${esc(p.name)}</nav>
<div class="pg"><div>${img[0] ? `<img src="${esc(img[0])}" alt="${esc(p.name)}" fetchpriority="high">` : `<img src="/placeholder.svg" alt="${esc(p.name)} - photo coming soon" width="720" height="720"><p style="text-align:center;margin-top:.5rem"><a href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hello ${BRAND}, please send me a photo of ${p.name} ${SITE}${path}`)}">Ask for a photo on WhatsApp</a></p>`}</div>
<div><h1>${esc(p.name)}</h1><div class="pr">${hasOld ? `<s>${money(p.old_price)}</s> ` : ''}${p.variants ? 'From ' : ''}${money(p.price)}${p.unit ? ` <small>/ ${esc(p.unit)}</small>` : ''}</div>
<p class="${inStock ? 'ok' : 'no'}">${inStock ? 'In stock' : 'Currently sold out'}</p>
<a class="btn" href="${esc(wa)}">Order on WhatsApp</a><a class="btn alt" href="${SITE}/">Shop all products and add to cart</a>
<div class="box">✔ Pay by M-Pesa &nbsp; ✔ Delivery to all 47 counties &nbsp; ✔ 48-hour returns on faulty items</div></div></div>
${sizeBox}
${p.description ? `<div class="box"><h2 style="margin-top:0">Product details</h2><div class="desc">${esc(p.description)}</div></div>` : ''}
${revs.length ? `<div class="box"><h2 style="margin-top:0">Customer reviews (${(revs.reduce((a, r) => a + Number(r.rating), 0) / revs.length).toFixed(1)} / 5 from ${revs.length})</h2>${revs.slice(0, 10).map(r => `<p><b>${'\u2605'.repeat(r.rating)}${'\u2606'.repeat(5 - r.rating)}</b> ${esc(r.reviewer || 'Customer')}${r.body ? '<br>' + esc(r.body) : ''}</p>`).join('')}</div>` : ''}
${related.length ? `<h2>More in ${esc(cat.name)}</h2><ul class="g">${related.map(card).join('')}</ul>` : ''}`;
  writeFileSync(`.${path}`.replace(/%[0-9A-F]{2}/gi, m => decodeURIComponent(m)), shell({ title, desc, path, og: img[0], body, ld }));
  urls.push(path);
}

for (const a of aliases) {
  const from = `/p/${encodeURIComponent(a.id)}.html`, to = `${SITE}/p/${encodeURIComponent(a.to)}.html`;
  writeFileSync(fileOf(from), `<!doctype html><html lang="en-KE"><head><meta charset="utf-8"><title>Redirecting\u2026</title><link rel="canonical" href="${to}"><meta http-equiv="refresh" content="0;url=${to}"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><p>This product moved. <a href="${to}">Continue to the product page</a>.</p></body></html>`);
}

for (const [slug, c] of Object.entries(byCat)) {
  const path = `/c/${encodeURIComponent(slug)}.html`;
  const info = INFO[slug] || {};
  const title = info.title || clip(`Buy ${c.name} in Kenya | Prices &amp; Delivery | ${BRAND}`.replace(/&amp;/g, '&'), 70);
  const desc = info.desc || clip(`Shop ${c.name} online in Kenya. ${c.items.length} products, pay by M-Pesa, delivery to all 47 counties. Order online at ${BRAND}.`, 158);
  const ld = jsonLd({ '@context': 'https://schema.org', '@type': 'ItemList', name: c.name, itemListElement: c.items.slice(0, 50).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/p/${encodeURIComponent(p.id)}.html`, name: p.name })) });
  const body = `<nav class="bc"><a href="${SITE}/">Home</a> › ${esc(c.name)}</nav><h1>${esc(info.h1 || c.name + ' in Kenya')}</h1>
<p>${esc(info.intro || 'Order online and pay by M-Pesa. We deliver to all 47 counties.')} Order online, pay by M-Pesa, delivery to all 47 counties.</p><ul class="g">${c.items.map(card).join('')}</ul>
${HUBS[slug] ? '<h2>Pest control by type</h2><ul class="g">' + HUBS[slug].kids.filter(k => byCat[k]).map(k => `<li><a href="/c/${k}.html">${esc(byCat[k].name)}</a></li>`).join('') + '</ul>' : ''}
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
  const ld = jsonLd({ '@context': 'https://schema.org', '@type': 'ItemList', name: `All products at ${BRAND}`, itemListElement: products.slice(0, 100).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/p/${encodeURIComponent(p.id)}.html`, name: p.name })) });
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
    const page = `${SITE}/p/${encodeURIComponent(pageOf[p.id] || p.id)}.html`;
    const price = Math.round(Number(p.price)), old = Math.round(Number(p.old_price) || 0);
    feed.push(`<item><g:id>${esc(p.id)}</g:id><title>${esc(title)}</title><description>${esc(clip(p.description, 4000) || `${title} available at ${BRAND}, Kenya. Pay by M-Pesa, delivery to all 47 counties.`)}</description>
<link>${esc(page)}</link><g:image_link>${esc(imgs[0])}</g:image_link>${imgs.slice(1, 10).map(u => `<g:additional_image_link>${esc(u)}</g:additional_image_link>`).join('')}
<g:availability>${inS(p) ? 'in_stock' : 'out_of_stock'}</g:availability>${old > price ? `<g:price>${old} KES</g:price><g:sale_price>${price} KES</g:sale_price>` : `<g:price>${price} KES</g:price>`}
<g:brand>${esc(brandOf(p.name))}</g:brand><g:condition>new</g:condition><g:identifier_exists>no</g:identifier_exists>${p.categories?.name ? `<g:product_type>${esc(p.categories.name)}</g:product_type>` : ''}${grouped ? `<g:item_group_id>${esc(p.variant_group)}</g:item_group_id>` : ''}</item>`);
  }
  writeFileSync('merchant-feed.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>${BRAND}</title><link>${SITE}/</link><description>${BRAND} product feed</description>\n${feed.join('\n')}\n</channel></rss>\n`);
  console.log(`Merchant feed: ${feed.length} items.`);
}

// lastmod only moves when a page's content really changed. Google ignores sitemaps whose dates change on every build.
const today = new Date().toISOString().slice(0, 10);
const STATE = 'sitemap-state.json';
const prev = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : {};
const next = {};
for (const u of urls) {
  const file = u.endsWith('/') ? `.${u}index.html` : fileOf(u);
  const hash = existsSync(file) ? createHash('sha1').update(readFileSync(file)).digest('hex') : '';
  next[u] = { hash, lastmod: prev[u] && prev[u].hash === hash ? prev[u].lastmod : today };
}
writeFileSync(STATE, JSON.stringify(next, null, 1));
writeFileSync('sitemap-products.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `<url><loc>${SITE}${u}</loc><lastmod>${next[u].lastmod}</lastmod></url>`).join('\n') + `\n</urlset>\n`);
console.log(`Built ${products.length} product pages and ${Object.keys(byCat).length} category pages.`);
