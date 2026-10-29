// Stermont Arcade - Kenya search wording + live price guides. Runs right after seo-overrides.mjs (see .github/workflows/product-pages.yml).
// 1) Product pages: "best price / price in Kenya" title and description, a Kenya delivery + pick-up paragraph, extra FAQ (skips titles/descriptions written by hand in seo-overrides.json).
// 2) /best/: one price guide per category ("cheapest and best-value ... in Kenya"), built from the live catalog, cheapest first. Prices update on every build.
// Safe to re-run: pages are rebuilt from scratch each time. If anything fails the build keeps going (see the workflow step).
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';

const SITE = 'https://stermontarcade.co.ke', SB = 'https://oewvtbnmyombbtggamor.supabase.co', KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7';
const WHATSAPP = '254748888230', BRAND = 'Stermont Arcade';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const unesc = s => String(s ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };
const money = n => 'KSh ' + Math.round(Number(n) || 0).toLocaleString('en-KE');
const jsonLd = o => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>';
const today = new Date().toISOString().slice(0, 10);

/* ---------- 1. product pages ---------- */
const overrides = existsSync('seo-overrides.json') ? JSON.parse(readFileSync('seo-overrides.json', 'utf8')) : {};
let pages = 0;
if (existsSync('p')) for (const f of readdirSync('p')) {
  if (!f.endsWith('.html')) continue;
  const id = f.slice(0, -5); let h = readFileSync(`p/${f}`, 'utf8');
  if (h.includes('http-equiv="refresh"') || h.includes('<!--kenya-->')) continue;
  const nm = h.match(/<h1>([\s\S]*?)<\/h1>/), pm = h.match(/product:price:amount" content="(\d+)"/);
  if (!nm || !pm) continue;
  const name = unesc(nm[1]), from = /<div class="pr">(?:(?!<\/div>)[\s\S])*From KSh/.test(h), price = (from ? 'from ' : '') + money(pm[1]);
  if (!overrides[id]) {
    const title = [`Buy ${name} in Kenya - Best Price ${price} | ${BRAND}`, `Buy ${name} in Kenya - Best Price ${price}`].find(t => t.length <= 70);
    const old = unesc((h.match(/<meta name="description" content="([^"]*)">/) || [])[1] || '');
    const plain = (old.match(/^Buy .*? online in Kenya (?:from|at) KSh [\d,]+\.(?: Sizes: .*?\.)? (.*?) ?Pay by M-Pesa, delivery to all 47 counties\./) || [])[1] || '';
    let core = `${name} price in Kenya: ${price}. Affordable, pay by M-Pesa, delivery to all 47 counties in 1 to 3 days or pick up in Nairobi.`;
    if (core.length > 158) core = `${name} price in Kenya: ${price}. Pay by M-Pesa, delivery to all 47 counties.`;
    const room = 158 - core.length - 1;
    const desc = esc(clip(plain && room >= 50 ? `${core} ${clip(plain, room)}` : core, 158));
    if (title) h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`).replace(/(<meta property="og:title" content=")[^"]*(">)/, `$1${esc(title)}$2`).replace(/(<meta name="twitter:title" content=")[^"]*(">)/, `$1${esc(title)}$2`);
    h = h.replace(/(<meta name="description" content=")[^"]*(">)/, `$1${desc}$2`).replace(/(<meta property="og:description" content=")[^"]*(">)/, `$1${desc}$2`).replace(/(<meta name="twitter:description" content=")[^"]*(">)/, `$1${desc}$2`);
  }
  h = h.replace(/<p>Buy [\s\S]*? online in Kenya from Stermont Arcade\. Pay by M-Pesa and get delivery to all 47 counties\.<\/p>/,
    `<!--kenya--><p><b>${nm[1]} price in Kenya: ${esc(price)}.</b> Order online from ${BRAND} and pay by M-Pesa. We deliver to all 47 counties, usually within 1 to 3 days, and you can pick up at The Sarit Centre, Westlands, Nairobi. Faulty items can be returned within 48 hours. Not sure it is the right one? Message us on WhatsApp before you pay.</p>`);
  const faq = [[`Where can I buy ${name} in Nairobi, Mombasa or Kisumu?`, `Order ${name} online at ${BRAND} from anywhere in Kenya, including Nairobi, Mombasa, Kisumu, Nakuru and Eldoret. We deliver to all 47 counties, or you can pick up at The Sarit Centre, Westlands, Nairobi.`],
    [`Can I pay for ${name} by M-Pesa?`, `Yes. Pay by M-Pesa Paybill and enter the M-Pesa code from your SMS at checkout. We confirm stock and delivery before dispatch.`]];
  h = h.replace(/<script type="application\/ld\+json">([^<]*)<\/script>/g, (m, j) => {
    if (!j.includes('"@type":"FAQPage"')) return m;
    try { const d = JSON.parse(j); d.mainEntity.push(...faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))); return jsonLd(d); } catch { return m; }
  });
  if (h.includes('<div class="stk"')) h = h.replace('<div class="stk"', `<div class="box"><h2 style="margin-top:0">Buying in Kenya</h2>${faq.map(([q, a]) => `<p><b>${esc(q)}</b><br>${esc(a)}</p>`).join('')}</div>\n<div class="stk"`);
  writeFileSync(`p/${f}`, h); pages++;
}
console.log(`Kenya wording applied to ${pages} product page(s).`);

/* ---------- 2. price guides ---------- */
const PEST = 'Look for a PCPB registration number on the label, read the whole label before use, keep children, pets and food away, and wear the gloves and mask it recommends.';
const G = [
  { key: 'cheapest-best-smartphones-kenya', slug: 'phones-tablets', noun: 'Smartphones', one: 'smartphone', tips: ['Compare RAM and storage first: 4GB RAM with 64GB storage is a common starting point, and 128GB or more gives room for photos and apps.', 'Check what is in the box. Some offers include a charger, case or smartwatch; others are the phone alone.', 'Look for a warranty and check that the IMEI (dial *#06#) matches the number on the box.', 'Set your budget first, then pick the best specs inside it instead of the other way round.'], blog: [['/blog/how-to-buy-smartphones-online-kenya.html', 'How to buy smartphones online in Kenya'], ['/blog/how-to-tell-original-products-kenya.html', 'How to check that a product is original']] },
  { key: 'cheapest-best-smart-tvs-kenya', slug: 'televisions', noun: 'Smart TVs', one: 'TV', tips: ['Pick the size for your room: about 32 inch for a bedroom, 43 inch for an average living room and 50 inch or more for big rooms.', '4K is worth paying for from 43 inch upwards, especially for sport and streaming.', 'Check the smart system, the HDMI ports you need and whether the TV has a digital tuner or needs a decoder.', 'Some listings include a wall mount or TV guard, which saves money on extras.'], blog: [['/blog/smart-tv-buying-guide-kenya.html', 'Smart TV buying guide for Kenya']] },
  { key: 'cheapest-best-kitchen-appliances-kenya', slug: 'kitchen-dining', noun: 'Kitchen Appliances', one: 'kitchen appliance', tips: ['Match capacity to your household: a 1.8 to 2 litre kettle or a 5 to 6 litre pressure cooker suits most families.', 'Check the wattage if you are on prepaid tokens, since a higher wattage uses more units.', 'Look for the warranty period and what is included in the box.', 'Gas and electric options can both work in Kenya; choose what is cheaper to run where you live.'], blog: [['/blog/air-fryer-buying-guide-kenya.html', 'Air fryer buying guide for Kenya']] },
  { key: 'cheapest-best-fridges-kenya', slug: 'fridges-freezers', noun: 'Fridges and Freezers', one: 'fridge', tips: ['Choose the size by household: about 90 litres for one or two people and 138 litres or more for a family.', 'Direct cool models are cheaper; check the manual for how often to defrost.', 'Measure your space and your doorway before ordering.', 'Use a fridge guard or surge protector if your power supply fluctuates.'], blog: [['/blog/how-to-choose-a-fridge-in-kenya.html', 'How to choose a fridge in Kenya']] },
  { key: 'dawa-ya-kunguni-best-bed-bug-killer-kenya', slug: 'bed-bug-killers', noun: 'Bed Bug Killers', one: 'bed bug killer', sw: 'dawa ya kunguni', tips: [PEST, 'Match the pack size to the number of beds and rooms, and plan a repeat treatment because eggs can survive the first spray.', 'Wash bedding hot and treat seams, frames and cracks as the label directs.', 'For hostels, hotels and rental blocks, use a licensed pest control operator.'], blog: [['/blog/how-to-get-rid-of-bed-bugs-kenya.html', 'How to get rid of bed bugs in Kenya'], ['/blog/where-to-buy-bed-bug-killer-in-kenya.html', 'Where to buy bed bug killer in Kenya'], ['/blog/dawa-ya-kunguni-mende-panya-kenya-guide.html', 'Dawa ya kunguni, mende na panya: pest control words in Kenya']] },
  { key: 'dawa-ya-panya-best-rat-killer-kenya', slug: 'rodent-control', noun: 'Rat and Mouse Control Products', one: 'rodent control product', sw: 'dawa ya panya', tips: [PEST, 'Place baits only where children, pets and livestock cannot reach, ideally in covered stations along walls.', 'Seal gaps around pipes, doors and roofs and keep food and feed in closed containers.', 'Wear gloves when removing dead rodents and dispose of them safely.'], blog: [['/blog/rat-and-mouse-control-kenya.html', 'Rat and mouse control in Kenya'], ['/blog/dawa-ya-kunguni-mende-panya-kenya-guide.html', 'Dawa ya kunguni, mende na panya: pest control words in Kenya']] },
  { key: 'dawa-ya-mende-best-cockroach-killer-kenya', slug: 'cockroach-ant-killers', noun: 'Cockroach and Ant Killers', one: 'cockroach killer', sw: 'dawa ya mende', tips: [PEST, 'Treat cracks, drains, cupboards and the back of fridges and cookers, where the insects hide.', 'Gels and baits suit kitchens; sprays suit cracks and surfaces.', 'Clean away food and grease first so the treatment works better.'], blog: [['/blog/how-to-get-rid-of-cockroaches-kenya.html', 'How to get rid of cockroaches in Kenya'], ['/blog/cockroach-gel-spray-or-powder-kenya.html', 'Cockroach gel, spray or powder']] },
  { key: 'dawa-ya-mbu-mosquito-fly-control-kenya', slug: 'mosquito-fly-control', noun: 'Mosquito and Fly Control Products', one: 'mosquito and fly control product', sw: 'dawa ya mbu na inzi', tips: [PEST, 'Remove standing water, clear drains and clean animal housing, because mosquitoes and flies breed there.', 'Use only products whose label lists the place you are treating, such as a home, compound or animal house.', 'Screens and nets add protection indoors.'], blog: [['/blog/mosquito-control-at-home-kenya.html', 'Mosquito control at home in Kenya']] },
  { key: 'dawa-ya-mchwa-termite-control-kenya', slug: 'termite-control', noun: 'Termite Control Products', one: 'termite control product', sw: 'dawa ya mchwa', tips: [PEST, 'Find the source first: mud tubes, hollow timber and soil mounds.', 'Check whether the product is for soil, timber or buildings.', 'Large or hidden infestations in buildings need a licensed pest control operator.'], blog: [['/blog/termite-control-at-home-kenya.html', 'Termite control at home in Kenya']] },
  { key: 'dawa-ya-magugu-best-herbicides-kenya', slug: 'herbicides', noun: 'Herbicides', one: 'herbicide', sw: 'dawa ya magugu', tips: [PEST, 'Use only on the crops and weeds listed on the label and spray at the stage it states.', 'Pick the pack size that matches your acreage so you do not store leftovers.', 'Use a clean sprayer and do not spray in strong wind or just before rain.'], blog: [['/blog/how-to-buy-agrovet-products-online-kenya.html', 'How to buy agrovet products online in Kenya']] },
  { key: 'dawa-ya-ukungu-best-fungicides-kenya', slug: 'fungicides', noun: 'Fungicides', one: 'fungicide', sw: 'dawa ya ukungu', tips: [PEST, 'Match the product to the disease and crop on the label, such as blight or mildew.', 'Spray before a disease takes hold and repeat at the interval the label gives.', 'Rotate products with different active ingredients to slow resistance.'], blog: [['/blog/how-to-read-an-insecticide-label-kenya.html', 'How to read a pesticide label']] },
  { key: 'dawa-ya-wadudu-best-crop-insecticides-kenya', slug: 'crop-insecticides', noun: 'Crop Insecticides', one: 'crop insecticide', sw: 'dawa ya wadudu', tips: [PEST, 'Identify the pest first, then pick a product whose label lists it and your crop.', 'Observe the pre-harvest interval on the label before you sell or eat the produce.', 'Rotate active ingredients and spray in the cool part of the day.'], blog: [['/blog/how-to-read-an-insecticide-label-kenya.html', 'How to read a pesticide label']] },
  { key: 'mbolea-best-fertilizers-kenya', slug: 'fertilizers', noun: 'Fertilizers', one: 'fertilizer', sw: 'mbolea', tips: ['Choose by what the crop needs at its growth stage, and test the soil if you can.', 'Foliar feeds and soil fertilizers do different jobs, so read the label.', 'Buy the pack size that matches your acreage.'], blog: [['/blog/how-to-buy-agrovet-products-online-kenya.html', 'How to buy agrovet products online in Kenya']] },
  { key: 'cheapest-best-mens-clothes-kenya', slug: 'mens-fashion', noun: "Men's Clothes", one: 'clothing item', tips: ['Check the size and fabric in the description before you order.', 'Blazers and tracksuits are good value when you buy a set.', 'Ask us on WhatsApp for extra photos if you want a closer look.'], blog: [['/blog/how-to-shop-affordable-online-kenya.html', 'How to find the cheapest price without buying rubbish']] }
];
const tidy = n => String(n).replace(/\s*\|.*$/, '').replace(/\s+/g, ' ').trim();
const SIZE_END = /\s+\d+(?:\.\d+)?\s?(?:ml|l|ltr|litres?|liters?|g|kg)\s*$/i;
const inS = x => x.stock == null || Number(x.stock) > 0;
async function getProducts() {
  if (process.env.PRODUCTS_JSON) return JSON.parse(readFileSync(process.env.PRODUCTS_JSON, 'utf8'));
  const r = await fetch(`${SB}/rest/v1/products?active=eq.true&select=id,name,price,stock,variant_group,variant_label,categories(slug)&order=created_at.asc`, { headers: { apikey: KEY } });
  if (!r.ok) throw new Error('Could not read products from Supabase');
  return r.json();
}
const CSS = `*{box-sizing:border-box}body{margin:0;font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1f1b2e;background:#faf9fd}a{color:#6d28d9}header{background:#7c3aed;color:#fff;padding:.8rem 1rem}header a{color:#fff;text-decoration:none;font-weight:800;font-size:1.15rem}main{max-width:860px;margin:0 auto;padding:1rem}nav.bc{font-size:.85rem;color:#6b6b80;margin:.3rem 0 1rem}h1{font-size:1.6rem;line-height:1.25;margin:.2rem 0 .6rem}h2{font-size:1.25rem;margin:1.6rem 0 .4rem}.btn{display:block;text-align:center;background:#16a34a;color:#fff;text-decoration:none;font-weight:800;padding:.85rem;border-radius:12px;margin:1rem 0}.box{background:#fff;border:1px solid #e6e1f5;border-radius:14px;padding:.9rem 1rem;margin:1rem 0}.answer{background:#f1ebff;border-left:4px solid #7c3aed;border-radius:10px;padding:.8rem 1rem;margin:1rem 0}.tw{overflow-x:auto;margin:1rem 0}table{border-collapse:collapse;width:100%;font-size:.95rem}caption{text-align:left;font-weight:700;padding:.3rem 0}th,td{border:1px solid #e6e1f5;padding:.5rem .6rem;text-align:left;vertical-align:top}th{background:#f1ebff}td.p{white-space:nowrap;font-weight:700;color:#5b21b6}.meta{color:#6b6b80;font-size:.85rem}footer{max-width:860px;margin:2rem auto;padding:1rem;color:#6b6b80;font-size:.85rem;border-top:1px solid #e6e1f5}`;
const shell = ({ title, desc, path, body, ld }) => `<!doctype html>
<html lang="en-KE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${path}"><meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="article"><meta property="og:site_name" content="${BRAND}"><meta property="og:locale" content="en_KE"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${SITE}${path}"><meta property="og:image" content="${SITE}/logo.png"><meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#7c3aed"><style>${CSS}</style>${ld}</head><body>
<header><a href="${SITE}/">${BRAND}</a></header><main>${body}</main>
<footer>${BRAND} · Online store serving all of Kenya · Pay by M-Pesa · Delivery to all 47 counties · <a href="https://wa.me/${WHATSAPP}">WhatsApp +254 748 888 230</a> · <a href="/shipping.html">Shipping</a> · <a href="/returns.html">Returns</a> · <a href="/privacy.html">Privacy</a></footer><script src="/analytics.js" defer></script></body></html>`;

let guideUrls = [];
try {
  const rows = (await getProducts()).filter(p => p && p.id && p.name && Number(p.price) > 0).map(p => ({ ...p, name: tidy(p.name) }));
  const gm = {}; rows.forEach(p => { if (p.variant_group && p.variant_label) (gm[p.variant_group] = gm[p.variant_group] || []).push(p); });
  const seen = new Set(), items = [];
  for (const p of rows) {
    const g = p.variant_group && p.variant_label ? gm[p.variant_group] : null;
    if (g && g.length > 1) {
      if (seen.has(p.variant_group)) continue; seen.add(p.variant_group);
      const live = g.filter(inS); if (!live.length) continue;
      const lo = live.reduce((a, b) => Number(a.price) <= Number(b.price) ? a : b);
      items.push({ id: g[0].id, slug: g[0].categories?.slug, name: g[0].name.replace(SIZE_END, '') || g[0].name, price: Number(lo.price), from: true });
    } else if (inS(p)) items.push({ id: p.id, slug: p.categories?.slug, name: p.name, price: Number(p.price), from: false });
  }
  const built = [];
  rmSync('best', { recursive: true, force: true }); mkdirSync('best', { recursive: true });
  for (const g of G) {
    const list = items.filter(i => i.slug === g.slug).sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
    if (list.length < 2) continue;
    const lo = list[0], hi = list[list.length - 1], mid = list[Math.floor((list.length - 1) / 2)], show = list.slice(0, 15), N = g.noun, n = N.toLowerCase();
    const path = `/best/${g.key}.html`, pr = i => (i.from ? 'from ' : '') + money(i.price);
    const title = clip(`${N}: Cheapest & Best-Value in Kenya | From ${money(lo.price)}`, 70);
    const desc = clip(`Cheapest and best-value ${n} in Kenya, listed by price from ${money(lo.price)}${g.sw ? ` (${g.sw})` : ''}. Pay by M-Pesa, delivery to all 47 counties. Prices update live.`, 158);
    const faq = [[`What is the cheapest ${g.one} in Kenya?`, `Right now the cheapest ${g.one} we have in stock is ${lo.name} at ${pr(lo)}. Prices on this page update from our shop, so check the product page for the latest price.`],
      [`How do I choose the best ${g.one}?`, g.tips.slice(0, 2).join(' ')],
      [`Can I pay by M-Pesa and get delivery outside Nairobi?`, `Yes. Pay by M-Pesa and we deliver to all 47 counties, usually within 1 to 3 days. You can also pick up at The Sarit Centre, Westlands, Nairobi.`]];
    const body = `<nav class="bc"><a href="${SITE}/">Home</a> › <a href="/best/">Price guides</a> › ${esc(N)}</nav>
<h1>Cheapest and best-value ${esc(n)} in Kenya${g.sw ? ` (${esc(g.sw)})` : ''}</h1>
<p class="meta">Live prices from ${BRAND}, updated ${today}</p>
<div class="answer"><strong>Quick answer:</strong> The cheapest ${esc(g.one)} in stock is ${esc(lo.name)} at ${esc(pr(lo))}. The top of our range is ${esc(hi.name)} at ${esc(pr(hi))}. All prices below are in Kenya shillings, cheapest first.</div>
<h2>Quick picks by budget</h2>
<ul><li><b>Lowest price:</b> <a href="/p/${encodeURIComponent(lo.id)}.html">${esc(lo.name)}</a> (${esc(pr(lo))})</li><li><b>Middle of the range:</b> <a href="/p/${encodeURIComponent(mid.id)}.html">${esc(mid.name)}</a> (${esc(pr(mid))})</li><li><b>Top of the range:</b> <a href="/p/${encodeURIComponent(hi.id)}.html">${esc(hi.name)}</a> (${esc(pr(hi))})</li></ul>
<div class="tw"><table><caption>${esc(N)} in stock, cheapest first</caption><thead><tr><th>#</th><th>Product</th><th>Price</th></tr></thead><tbody>${show.map((i, k) => `<tr><td>${k + 1}</td><td><a href="/p/${encodeURIComponent(i.id)}.html">${esc(i.name)}</a></td><td class="p">${esc(pr(i))}</td></tr>`).join('')}</tbody></table></div>
${list.length > show.length ? `<p><a href="/c/${encodeURIComponent(g.slug)}.html">See all ${list.length} products in this category</a></p>` : ''}
<h2>How to choose${g.sw ? ` ${esc(g.sw)}` : ''} in Kenya</h2>
<ul>${g.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
<h2>Buying from ${BRAND}</h2>
<p>Pay by M-Pesa and get delivery to all 47 counties, usually within 1 to 3 days, or pick up at The Sarit Centre, Westlands, Nairobi. Faulty items can be returned within 48 hours; see our <a href="/returns.html">returns policy</a>. Not sure what to pick? Message us on WhatsApp and we will help.</p>
<a class="btn" href="https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hello ${BRAND}, I need help choosing ${n}.`)}">Ask us on WhatsApp</a>
<h2>Frequently asked questions</h2>${faq.map(([q, a]) => `<div class="box"><b>${esc(q)}</b><p>${esc(a)}</p></div>`).join('')}
<h2>Related guides</h2><ul>${g.blog.map(([u, t]) => `<li><a href="${u}">${esc(t)}</a></li>`).join('')}<li><a href="/c/${encodeURIComponent(g.slug)}.html">All ${esc(n)} in our shop</a></li></ul>`;
    const ld = jsonLd({ '@context': 'https://schema.org', '@type': 'ItemList', name: `${N} in Kenya, cheapest first`, itemListElement: show.map((i, k) => ({ '@type': 'ListItem', position: k + 1, url: `${SITE}/p/${encodeURIComponent(i.id)}.html`, name: i.name })) })
      + jsonLd({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) })
      + jsonLd({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', SITE + '/'], ['Price guides', SITE + '/best/'], [N, SITE + path]].map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) });
    writeFileSync(`best${path.slice(5)}`, shell({ title, desc, path, body, ld }));
    built.push({ ...g, path, lo });
  }
  if (built.length) {
    const body = `<nav class="bc"><a href="${SITE}/">Home</a> › Price guides</nav><h1>Price guides: cheapest and best-value in Kenya</h1><p>Live prices, cheapest first, with buying tips for Kenya. Pay by M-Pesa, delivery to all 47 counties.</p>
<ul>${built.map(b => `<li><a href="${b.path}">${esc(b.noun)}${b.sw ? ` (${esc(b.sw)})` : ''}</a> from ${esc(money(b.lo.price))}</li>`).join('')}</ul>`;
    writeFileSync('best/index.html', shell({ title: `Price Guides: Cheapest & Best-Value in Kenya | ${BRAND}`, desc: `Live price guides for phones, TVs, appliances, pest control and farm inputs in Kenya, cheapest first. Pay by M-Pesa, delivery to all 47 counties.`, path: '/best/', body, ld: '' }));
    // link each category page to its guide, and the category index to all guides
    for (const b of built) { const f = `c/${b.slug}.html`; if (existsSync(f)) { const h = readFileSync(f, 'utf8'); if (!h.includes(b.path)) writeFileSync(f, h.replace('<p><a href="/c/">Browse all categories</a></p>', `<p><a href="${b.path}">Cheapest and best-value ${esc(b.noun.toLowerCase())} in Kenya: price guide</a></p>\n<p><a href="/c/">Browse all categories</a></p>`)); } }
    if (existsSync('c/index.html')) { const h = readFileSync('c/index.html', 'utf8'); if (!h.includes('href="/best/"')) writeFileSync('c/index.html', h.replace('</main>', '<p><a href="/best/">Price guides: cheapest and best-value in Kenya</a></p></main>')); }
    guideUrls = ['/best/', ...built.map(b => b.path)];
  }
  console.log(`Built ${built.length} price guide(s).`);
} catch (e) { console.log('Price guides skipped:', e.message); }

/* ---------- 3. sitemap entries for the guides (lastmod moves only when the page changes) ---------- */
if (guideUrls.length && existsSync('sitemap-products.xml')) {
  const ST = 'kenya-guides-state.json'; let prev = {}; try { prev = JSON.parse(readFileSync(ST, 'utf8')); } catch { }
  const next = {};
  for (const u of guideUrls) { const file = u.endsWith('/') ? `.${u}index.html` : `.${u}`, hash = createHash('sha1').update(readFileSync(file)).digest('hex'); next[u] = { hash, lastmod: prev[u]?.hash === hash ? prev[u].lastmod : today }; }
  writeFileSync(ST, JSON.stringify(next, null, 1));
  let sm = readFileSync('sitemap-products.xml', 'utf8').replace(/<url><loc>[^<]*\/best\/[^<]*<\/loc>[^]*?<\/url>\n?/g, '');
  sm = sm.replace('</urlset>', guideUrls.map(u => `<url><loc>${SITE}${u}</loc><lastmod>${next[u].lastmod}</lastmod></url>`).join('\n') + '\n</urlset>');
  writeFileSync('sitemap-products.xml', sm);
}
