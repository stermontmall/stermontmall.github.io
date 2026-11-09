// Stermont Arcade - Kenya SEO pass. Runs in .github/workflows/product-pages.yml right after generate-products.mjs
// and BEFORE seo-overrides.mjs, so hand-written overrides in seo-overrides.json always win.
// 1) Product pages: pages built by generate-products.mjs with <meta name="stm-seo" content="v2"> already carry the final Kenya title/description
//    (seo-meta.mjs: "[Original] <product> \u2013 Price in Kenya | Stermont Arcade"), so they are left alone here. Older pages without the marker still get the
//    previous "Buy <product> in Kenya | KSh X" wording. The store name is not claimed as the product brand in the Product schema when no real brand is known.
// 2) Category pages: title and description follow the seo-meta.mjs pattern ("Buy <category> Online in Kenya ...", "Order PCPB-approved ..." only for regulated categories)
//    + a link to the cheapest-prices guide.
// 3) /guides/: one "Cheapest <category> in Kenya (bei nafuu)" page per category, built from the prices already on the
//    category pages (no network, no database), plus /guides/ index and the /guides/ entries in sitemap.xml.
// Safe by design: every file is wrapped in try/catch, a bad page is skipped, the script never exits with an error.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { catTitle, catDescription } from './seo-meta.mjs';

const SITE = 'https://stermontarcade.co.ke';
const WA = 'https://wa.me/254748888230';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const unesc = s => String(s ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const clip = (s, n) => s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;
const ksh = n => 'KSh ' + Number(n).toLocaleString('en-US');
const json = o => JSON.stringify(o).replace(/</g, '\\u003c');
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const now = new Date();
const today = now.toISOString().slice(0, 10);
const month = now.toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'Africa/Nairobi' });

// Swahili names Kenyans actually search for, by category file name. Categories not listed just skip the Swahili lines.
const SW = {
  'televisions': 'runinga (TV)', 'tvs-audio': 'runinga na spika', 'fridges-freezers': 'friji', 'washing-machines': 'mashine ya kufua',
  'phones-tablets': 'simu na tablet', 'phone-accessories': 'vifaa vya simu', 'shoes': 'viatu', 'mens-fashion': 'mavazi ya wanaume',
  'womens-fashion': 'mavazi ya wanawake', 'watches-jewellery': 'saa na vito', 'kitchen-dining': 'vyombo vya jikoni', 'appliances': 'vifaa vya nyumbani',
  'computing': 'kompyuta na laptop', 'bluetooth-speakers': 'spika za Bluetooth', 'home-theatre': 'mfumo wa sauti (home theatre)',
  'electrical-lighting': 'taa na vifaa vya umeme', 'cockroach-ant-killers': 'dawa ya mende na sisimizi', 'bed-bug-killers': 'dawa ya kunguni',
  'mosquito-fly-control': 'dawa ya mbu na inzi', 'rodent-control': 'dawa ya panya', 'termite-control': 'dawa ya mchwa',
  'pest-control-fumigation': 'dawa za kuua wadudu', 'fumigation-chemicals': 'dawa za kufukiza', 'fertilizers': 'mbolea', 'seeds-seedlings': 'mbegu na miche',
  'herbicides': 'dawa ya kuua magugu', 'fungicides': 'dawa ya kuvu', 'crop-insecticides': 'dawa za wadudu wa mimea', 'animal-feeds': 'chakula cha mifugo',
  'veterinary-drugs': 'dawa za mifugo', 'garden-outdoors': 'vifaa vya bustani', 'health-beauty': 'bidhaa za urembo na afya',
  'sprayers-equipment': 'pampu za kunyunyizia dawa', 'protective-wear-safety': 'vifaa vya usalama', 'disinfectants-hygiene': 'dawa za usafi',
  'fashion': 'mavazi', 'phones-accessories': 'simu na vifaa vya simu', 'tv-audio-video': 'runinga, sauti na video',
  'computers-accessories': 'kompyuta na vifaa', 'home-kitchen': 'bidhaa za nyumbani na jikoni', 'baby-products': 'bidhaa za watoto',
  'shoes': 'viatu', 'health-beauty': 'afya na urembo'
};

// Unique buyer-help sections for high-intent category pages that were thin on useful guidance.
// Keep these practical and category-specific; never pad pages with repeated generic copy.
const CATEGORY_GUIDES = {
  'disinfectants-hygiene': `<section class="category-guide" data-seo-guide="disinfectants-hygiene">
<h2>Choosing farm and household disinfectants in Kenya</h2>
<p>Choose a disinfectant for the surface and setting you need to clean, not just by pack size or price. Poultry houses, livestock pens, equipment, drains and household surfaces can have different label-approved uses. Check the product name, active ingredients, concentration, intended application sites and current Kenyan registration details before ordering.</p>
<h3>How to use a disinfectant responsibly</h3>
<p>Remove visible dirt and organic matter first because cleaning is an important step before disinfection. Read the container label for the exact dilution, application method and contact time. Do not transfer a dilution rate from one brand to another. Keep animals, children, feed and drinking water away unless the label specifically allows the intended use. Allow the treated area to dry and ventilate as directed before people or animals return.</p>
<h3>What to check before buying</h3>
<ul><li>Confirm the correct formulation and pack size for the job.</li><li>Check the label, expiry date, batch details and storage instructions.</li><li>Use suitable gloves, eye protection and other label-required PPE.</li><li>Ask a qualified professional if the intended use or dilution is unclear.</li></ul>
<p>For broader farm hygiene and pest-control supplies, browse <a href="/c/pest-control-fumigation.html">pest control and fumigation products</a> and <a href="/c/sprayers-equipment.html">sprayers and application equipment</a>.</p>
</section>`,
  'crop-insecticides': `<section class="category-guide" data-seo-guide="crop-insecticides">
<h2>How to choose crop insecticides in Kenya</h2>
<p>Start by identifying the crop and the pest causing damage. Similar symptoms can have different causes, so check the crop, pest stage and affected plant parts before selecting a product. Compare the active ingredient, formulation, pack size and the crops and pests named on the label. A product listed for one crop or pest is not automatically suitable for another.</p>
<h3>Check the label before application</h3>
<p>Use only products whose current Kenyan registration and label directions match the intended crop and pest. Follow the stated rate, mixing order, application interval, pre-harvest interval and re-entry instructions. Wear the specified protective equipment, avoid drift onto people, animals, water and neighbouring crops, and do not spray in unsuitable weather. Never guess a dose or combine products unless the label or a qualified agronomist permits it.</p>
<h3>Plan the complete crop-protection programme</h3>
<p>Consider monitoring, field sanitation and non-chemical controls alongside pesticide use. Rotate modes of action where the label and agronomic advice support it, rather than repeatedly relying on the same active ingredient. Keep records of the product, batch, date, crop and application details.</p>
<p>Compare related <a href="/c/fungicides.html">fungicides</a>, <a href="/c/herbicides.html">herbicides</a> and <a href="/c/sprayers-equipment.html">sprayers and equipment</a> when planning your farm-input purchase.</p>
</section>`,
  'fertilizers': `<section class="category-guide" data-seo-guide="fertilizers">
<h2>Choosing fertilizer for crops in Kenya</h2>
<p>The right fertilizer depends on the crop, soil condition, growth stage and nutrients required. Where possible, use a soil test and local agronomic advice to guide your choice. Compare the nutrient analysis on the bag, such as the stated nitrogen, phosphorus and potassium content, as well as any secondary or micronutrients. Do not choose a product from its name or colour alone.</p>
<h3>Compare formulation, pack size and application timing</h3>
<p>Check whether the product is granular, soluble, foliar or another formulation and confirm that it is suitable for the intended crop and application method. Pack size affects handling and storage, while the label explains the correct rate and timing. Do not assume that products with similar NPK numbers are interchangeable; nutrient sources and additional ingredients can differ.</p>
<h3>Storage and buying checks</h3>
<ul><li>Inspect the seal, batch number, manufacture or expiry details where supplied.</li><li>Keep fertilizer dry and protected from moisture.</li><li>Store it separately from food, animal feed and children.</li><li>Follow the manufacturer's directions and local agronomic advice.</li></ul>
<p>You can also browse <a href="/c/agrovet.html">agrovet supplies</a> and <a href="/c/seeds-seedlings.html">seeds and seedlings</a> when planning a complete planting season order.</p>
</section>`,
  'protective-wear-safety': `<section class="category-guide" data-seo-guide="protective-wear-safety">
<h2>Choosing protective wear and safety equipment</h2>
<p>Select protective equipment according to the hazard and task. Work involving chemicals, dust, heat, sharp objects, machinery or general handling may require different protection. Check the product description and manufacturer's markings for the intended use, material, size and any stated standard or certification. Do not assume that one glove, mask or pair of boots protects against every workplace hazard.</p>
<h3>Check fit and compatibility</h3>
<p>Gloves should fit securely while allowing safe handling. Eye protection should sit comfortably and provide the coverage required for the task. Respirators need the correct facepiece size and compatible filters or cartridges for the specific hazard; fit testing and a suitable respiratory-protection programme may be necessary. Replace damaged, expired or contaminated equipment according to the manufacturer's instructions.</p>
<h3>Before placing an order</h3>
<ul><li>Confirm sizes, quantities and material specifications.</li><li>Match filters, cartridges and accessories to the exact equipment model.</li><li>Check care, cleaning, storage and replacement instructions.</li><li>Use the workplace risk assessment and safety data sheet to guide selection.</li></ul>
<p>For chemical application work, also review the relevant <a href="/c/sprayers-equipment.html">sprayers and equipment</a> and follow the pesticide label and safety data sheet.</p>
</section>`,
  'phones-tablets': `<section class="category-guide" data-seo-guide="phones-tablets">
<h2>How to choose a phone or tablet in Kenya</h2>
<p>Compare devices by the way you plan to use them. For everyday calls, messaging and browsing, check battery capacity, storage, memory and software support. For photography, compare the camera system and available storage. For gaming or demanding apps, look at the processor, memory, screen refresh rate and heat management. The largest specification is not automatically the best value for every buyer.</p>
<h3>Verify the exact model before buying</h3>
<p>Check the full model number, storage configuration, RAM, network compatibility and whether the device supports the bands used by your mobile operator. Confirm whether it is new or refurbished, what accessories are included, the warranty terms and the return conditions. Regional versions of the same phone name can have different specifications, so use the exact listing details rather than relying on a model family name.</p>
<h3>Plan for everyday ownership</h3>
<p>Consider charging requirements, screen protection, cases, repair support and the cost of additional storage or accessories. Keep your purchase receipt and confirm the device condition and included items when it arrives.</p>
<p>Compare the available models on this page and check the individual product listing for current price, stock and specifications before ordering.</p>
</section>`,
  'home-kitchen': `<section class="category-guide" data-seo-guide="home-kitchen">
<h2>Choosing home and kitchen appliances in Kenya</h2>
<p>Start with the space and job the appliance needs to handle. Measure the available width, depth and height, and compare the product's capacity with the needs of your household. For electrical appliances, check the rated power, voltage, plug type and any installation requirements. For cookware and kitchen tools, compare material, dimensions, cleaning instructions and compatibility with your cooker or other equipment.</p>
<h3>Compare useful specifications, not just the headline price</h3>
<p>Look at capacity, controls, included accessories, energy use where stated, warranty coverage and after-sales support. Check whether a product needs a separate stand, regulator, hose, filter or other accessory, and confirm exactly what is included in the listing. Product photographs help with appearance, but the written specification should guide decisions about size and compatibility.</p>
<h3>Before checkout</h3>
<ul><li>Confirm the model number, dimensions and capacity.</li><li>Check delivery access for large or heavy appliances.</li><li>Review the warranty, returns and installation requirements.</li><li>Keep packaging and the receipt until the item has been checked.</li></ul>
<p>Open each product page for its current price, availability and full specifications, then confirm delivery arrangements before payment.</p>
</section>`
};

// ---------- 1) product pages ----------
let pDone = 0;
if (existsSync('p')) for (const f of readdirSync('p').filter(f => f.endsWith('.html'))) {
  try {
    const file = `p/${f}`; let h = readFileSync(file, 'utf8');
    const pm = h.match(/product:price:amount" content="(\d+)"/), nm = h.match(/<h1>([\s\S]*?)<\/h1>/);
    if (!pm || !nm) continue;
    // v2 pages already have the final title/description from seo-meta.mjs. Only the brand clean-up below still applies to them.
    if (h.includes('<meta name="stm-seo" content="v2">')) {
      const nb = h.replace(/,"brand":\{"@type":"Brand","name":"Stermont Arcade"\}/g, '');
      if (nb !== h) { writeFileSync(file, nb); pDone++; }
      continue;
    }
    const name = unesc(nm[1].replace(/<[^>]+>/g, '').trim()), price = ksh(pm[1]);
    const inStock = /product:availability" content="in stock"/.test(h);
    // Title always starts with "Buy": "Buy <product> in Kenya | KSh X" (kept under about 68 characters so Google does not cut it off)
    const tail = ` in Kenya | ${price}`;
    const title = esc('Buy ' + clip(name, 68 - 4 - tail.length) + tail);
    const stockTxt = inStock ? 'In stock. Pay by M-Pesa. Delivery to all 47 counties.' : 'Ask us on WhatsApp when it is back. Pay by M-Pesa.';
    const sfx = ` in Kenya for ${price}. ` + stockTxt;
    // What the product is: the first real sentence of its own description, minus the heading line that repeats the product name.
    let blurb = '';
    const dm0 = h.match(/<div class="desc">([\s\S]*?)<\/div>/);
    if (dm0) {
      const lines = unesc(dm0[1].replace(/<[^>]+>/g, ' ')).split(/\n+/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
      const key = name.toLowerCase().split(' ').slice(0, 3).join(' ');
      while (lines.length && lines[0].length < 110 && lines[0].toLowerCase().includes(key)) lines.shift();
      const first = lines[0] || '';
      if (first.length > 40 && first !== first.toUpperCase()) blurb = (first.match(/^.*?[.!?](?=\s|$)/) || [first])[0];
    }
    const head = `Buy ${name} in Kenya for ${price}. `;
    const free = 158 - head.length - stockTxt.length - 1;
    let desc;
    if (blurb && free >= 35) desc = esc(head + clip(blurb, free) + ' ' + stockTxt);
    else {
      const room = 158 - 4 - sfx.length;
      desc = esc(room >= 20 ? 'Buy ' + clip(name, room) + sfx : clip('Buy ' + name + sfx, 158));
    }
    const before = h;
    h = h.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${title}</title>`)
      .replace(/<meta name="description" content="[^"]*">/, () => `<meta name="description" content="${desc}">`)
      .replace(/(<meta property="og:title" content=")[^"]*(">)/, (m, a, b) => a + title + b)
      .replace(/(<meta property="og:description" content=")[^"]*(">)/, (m, a, b) => a + desc + b)
      .replace(/(<meta name="twitter:title" content=")[^"]*(">)/, (m, a, b) => a + title + b)
      .replace(/(<meta name="twitter:description" content=")[^"]*(">)/, (m, a, b) => a + desc + b)
      // the store is not the manufacturer: drop the placeholder brand so Google is not told the wrong one
      .replace(/,"brand":\{"@type":"Brand","name":"Stermont Arcade"\}/g, '');
    if (h !== before) { writeFileSync(file, h); pDone++; }
  } catch (e) { console.log('skip product page', f, e.message); }
}
console.log(`Kenya titles and descriptions set on ${pDone} product page(s).`);

// ---------- 2) category pages + 3) guides ----------
const ITEM = /<li><a href="(\/p\/[^"]+)"><img[^>]*?>([^<]*)<\/a><span>KSh ([\d,]+)<\/span><\/li>/g;
const cats = [];
let cDone = 0;
if (existsSync('c')) for (const f of readdirSync('c').filter(f => f.endsWith('.html') && f !== 'index.html')) {
  try {
    const slug = f.replace(/\.html$/, ''), file = `c/${f}`; let h = readFileSync(file, 'utf8');
    const h1 = unesc(((h.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, '').trim());
    const items = [...h.matchAll(ITEM)].map(m => ({ url: m[1], name: m[2], price: Number(m[3].replace(/,/g, '')) })).filter(i => i.price > 0);
    const guide = CATEGORY_GUIDES[slug];
    if (guide && !h.includes(`data-seo-guide="${slug}"`)) {
      h = h.replace(/<ul class="g">/, `${guide}\\n<ul class="g">`);
    }
    if (!h1 || items.length < 3) { if (guide) writeFileSync(file, h); continue; }
    items.sort((a, b) => a.price - b.price);
    const label = h1.replace(/\s+in Kenya$/i, '');
    const min = items[0].price, max = items[items.length - 1].price;
    cats.push({ slug, label, h1, items, min, max, sw: SW[slug] || '' });
    // category title + description: seo-meta.mjs pattern, built from the category name shown in the breadcrumb ("Home › <name>")
    const cn = unesc(((h.match(/<nav class="bc"><a [^>]*>Home<\/a> › ([^<]*)<\/nav>/) || [])[1] || '').trim());
    if (cn) {
      const ct = esc(catTitle(cn)), cd = esc(catDescription(cn, slug));
      h = h.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${ct}</title>`)
        .replace(/(<meta name="description" content=")[^"]*(">)/, (m, a, b) => a + cd + b)
        .replace(/(<meta property="og:title" content=")[^"]*(">)/, (m, a, b) => a + ct + b)
        .replace(/(<meta property="og:description" content=")[^"]*(">)/, (m, a, b) => a + cd + b)
        .replace(/(<meta name="twitter:title" content=")[^"]*(">)/, (m, a, b) => a + ct + b)
        .replace(/(<meta name="twitter:description" content=")[^"]*(">)/, (m, a, b) => a + cd + b);
      cDone++;
    }
    if (!h.includes('/guides/cheapest-'))
      h = h.replace('<p><a href="/c/">Browse all categories</a></p>', () => `<div class="box"><a href="/guides/cheapest-${slug}-kenya.html">Cheapest ${esc(label)} in Kenya: bei nafuu, prices from ${ksh(min)}</a></div>\n<p><a href="/c/">Browse all categories</a></p>`);
    writeFileSync(file, h);
  } catch (e) { console.log('skip category page', f, e.message); }
}
console.log(`Kenya titles and descriptions set on ${cDone} category page(s).`);

const STYLE = `<style>.answer{background:#f1ebff;border-left:4px solid #7c3aed;border-radius:10px;padding:.8rem 1rem;margin:1rem 0}.tw{overflow-x:auto;margin:1rem 0}table{border-collapse:collapse;width:100%;font-size:.95rem}caption{text-align:left;font-weight:700;padding:.3rem 0}th,td{border:1px solid #e6e1f5;padding:.5rem .6rem;text-align:left;vertical-align:top}th{background:#f1ebff}h3{font-size:1.05rem;margin:1.1rem 0 .2rem}</style>`;
const FOOT = `<footer>Stermont Arcade · Online store serving all of Kenya · Pay by M-Pesa · Delivery to all 47 counties · <a href='${WA}'>WhatsApp +254 748 888 230</a> · <a href='/shipping.html'>Shipping</a> · <a href='/returns.html'>Returns</a> · <a href='/privacy.html'>Privacy</a></footer><script src="/analytics.js" defer></script>`;
const shell = ({ title, desc, path, ld, body }) => `<!doctype html>
<html lang='en-KE'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>
<title>${esc(title)}</title><meta name='description' content='${esc(desc)}'>
<link rel='canonical' href='${SITE}${path}'><meta name='robots' content='index, follow, max-image-preview:large'>
<meta property='og:type' content='website'><meta property='og:site_name' content='Stermont Arcade'><meta property='og:locale' content='en_KE'><meta property='og:title' content='${esc(title)}'><meta property='og:description' content='${esc(desc)}'><meta property='og:url' content='${SITE}${path}'><meta property='og:image' content='${SITE}/logo.png'><meta name='twitter:card' content='summary_large_image'><meta name='theme-color' content='#7c3aed'>
<link rel='stylesheet' href='/blog/blog.css'>${STYLE}
<script type='application/ld+json'>${json(ld)}</script></head><body>
<header><a href='${SITE}/'>Stermont Arcade</a></header><main>
${body}
</main>${FOOT}</body></html>
`;
const crumbs = (...c) => ({ '@type': 'BreadcrumbList', itemListElement: c.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url })) });

mkdirSync('guides', { recursive: true });
const sitemapEntries = [];
let gDone = 0;
const stamp = (path, file, build) => {
  // keeps datePublished, only moves dateModified when the page really changed (no daily churn)
  const old = existsSync(file) ? readFileSync(file, 'utf8') : '';
  const oldPub = (old.match(/"datePublished":"(\d{4}-\d{2}-\d{2})"/) || [])[1], oldMod = (old.match(/"dateModified":"(\d{4}-\d{2}-\d{2})"/) || [])[1];
  if (old && build(oldPub, oldMod) === old) { sitemapEntries.push({ loc: SITE + path, mod: oldMod || today }); return; }
  writeFileSync(file, build(oldPub || today, today)); sitemapEntries.push({ loc: SITE + path, mod: today }); gDone++;
};

for (const c of cats) {
  try {
    const { slug, label, items, min, max, sw } = c, path = `/guides/cheapest-${slug}-kenya.html`, cheap = items[0];
    const cheapName = unesc(cheap.name), top = items.slice(0, 12);
    const title = clip(`Cheapest ${label} in Kenya: Bei Nafuu from ${ksh(min)}`, 70);
    const desc = clip(`See the cheapest ${label.toLowerCase()} in Kenya, sorted by price in KSh from ${ksh(min)}. Pay by M-Pesa, delivery to all 47 counties.`, 158);
    const faq = [
      [`What is the cheapest ${label.toLowerCase()} in Kenya?`, `Right now the lowest-priced option at Stermont Arcade is ${cheapName} at ${ksh(min)}. Prices change, so check the product page before you order.`],
      [`How much do ${label.toLowerCase()} cost in Kenya?`, `Our ${label.toLowerCase()} range from ${ksh(min)} to ${ksh(max)}, depending on brand, size and features.`],
      ['Can I pay by M-Pesa?', 'Yes. Order on the website or on WhatsApp and pay by M-Pesa.'],
      ['Do you deliver outside Nairobi?', 'Yes, we deliver to all 47 counties, typically within 1 to 3 days. You can also pick up at The Sarit Centre, Westlands, Nairobi.']
    ];
    if (sw) faq.push([`${cap(sw)} bei gani Kenya?`, `Bei ya ${sw} hapa Stermont Arcade inaanzia ${ksh(min)} hadi ${ksh(max)}. Unaweza kulipa kwa M-Pesa na tunafikisha kaunti zote 47.`]);
    const rows = top.map((i, n) => `<tr><td>${n + 1}</td><td><a href='${i.url}'>${i.name}</a></td><td>${ksh(i.price)}</td></tr>`).join('\n');
    const build = (pub, mod) => shell({
      title, desc, path,
      ld: { '@context': 'https://schema.org', '@graph': [
        { '@type': 'CollectionPage', name: `Cheapest ${label} in Kenya`, description: desc, url: SITE + path, inLanguage: 'en-KE', datePublished: pub, dateModified: mod, publisher: { '@type': 'Organization', name: 'Stermont Arcade', logo: { '@type': 'ImageObject', url: SITE + '/logo.png' } } },
        { '@type': 'ItemList', itemListElement: top.map((i, n) => ({ '@type': 'ListItem', position: n + 1, url: SITE + i.url, name: unesc(i.name) })) },
        crumbs(['Home', SITE + '/'], ['Cheapest prices', SITE + '/guides/'], [label, SITE + path]),
        { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
      ] },
      body: `<nav class='bc'><a href='${SITE}/'>Home</a> › <a href='/guides/'>Cheapest prices</a> › ${esc(label)}</nav>
<h1>Cheapest ${esc(label)} in Kenya</h1>
<p class='meta'>Prices checked ${month} · live prices in KSh</p>
<div class='answer'><strong>Quick answer:</strong> the lowest price right now is <a href='${cheap.url}'>${cheap.name}</a> at <strong>${ksh(min)}</strong>. Our ${esc(label.toLowerCase())} go up to ${ksh(max)}.</div>
<p>Looking for ${esc(label.toLowerCase())} at a fair price? Here are our lowest-priced options, sorted from cheapest to most expensive. Prices are in Kenya shillings and come from our live catalogue, which refreshes several times a day. Pay by M-Pesa and get delivery to all 47 counties.</p>${sw ? `
<p><em>Kwa Kiswahili:</em> Unatafuta ${esc(sw)} kwa bei nafuu? Hizi ndizo bei za chini zaidi tulizo nazo sasa. Lipa kwa M-Pesa, na tunafikisha bidhaa kaunti zote 47.</p>` : ''}
<div class='tw'><table><caption>${esc(label)} sorted by price, cheapest first</caption><thead><tr><th>#</th><th>Product</th><th>Price</th></tr></thead><tbody>
${rows}
</tbody></table></div>
<h2>Buying cheap without buying trouble</h2>
<p>A low price is only a good deal if the item is genuine and comes with support. Check the warranty on the product page, read the full description, and confirm stock and delivery to your area on WhatsApp before you pay. Keep your M-Pesa confirmation message. We accept returns of faulty items within 48 hours, see our <a href='/returns.html'>returns policy</a>.</p>
<h2>Frequently asked questions</h2>
${faq.map(([q, a]) => `<h3>${esc(q)}</h3>\n<p>${esc(a)}</p>`).join('\n')}
<a class='btn' href='/c/${slug}.html'>See all ${esc(label)}</a>
<a class='btn alt' href='/products.html'>Browse all products</a>
<div class='box'><a href='${WA}?text=${encodeURIComponent(`Hello Stermont Arcade, what is your best price on ${label.toLowerCase()}?`)}'>Ask for the best price on WhatsApp</a></div>
<p class='meta'>Check each product page for current price and stock. Read <a href='/blog/how-to-order-and-pay-by-mpesa-online-kenya.html'>how to order and pay by M-Pesa</a>.</p>`
    });
    stamp(path, `guides/cheapest-${slug}-kenya.html`, build);
  } catch (e) { console.log('skip guide', c.slug, e.message); }
}

// guides index
try {
  if (cats.length) {
    const sorted = [...cats].sort((a, b) => a.label.localeCompare(b.label));
    const build = (pub, mod) => shell({
      title: 'Cheapest Prices in Kenya: Bei Nafuu Guides | Stermont Arcade',
      desc: 'Find the lowest prices in Kenya by category: TVs, fridges, phones, pest control and more. Prices in KSh, pay by M-Pesa, delivery to all 47 counties.',
      path: '/guides/',
      ld: { '@context': 'https://schema.org', '@graph': [
        { '@type': 'CollectionPage', name: 'Cheapest prices in Kenya', url: SITE + '/guides/', inLanguage: 'en-KE', datePublished: pub, dateModified: mod },
        crumbs(['Home', SITE + '/'], ['Cheapest prices', SITE + '/guides/'])
      ] },
      body: `<nav class='bc'><a href='${SITE}/'>Home</a> › Cheapest prices</nav>
<h1>Cheapest prices in Kenya (bei nafuu)</h1>
<p class='meta'>Prices checked ${month}</p>
<p>Pick a category to see the lowest prices first. Everything is priced in KSh, you can pay by M-Pesa, and we deliver to all 47 counties. <em>Chagua aina ya bidhaa uone bei nafuu zaidi.</em></p>
${sorted.map(c => `<div class='box'><a href='/guides/cheapest-${c.slug}-kenya.html'>Cheapest ${esc(c.label)} in Kenya</a><p>From ${ksh(c.min)}${c.sw ? ` · ${esc(c.sw)}` : ''}</p></div>`).join('\n')}`
    });
    stamp('/guides/', 'guides/index.html', build);
  }
} catch (e) { console.log('skip guides index', e.message); }
console.log(`Price guides written or updated: ${gDone} (of ${cats.length} categories).`);

// sitemap.xml: rewrite only the /guides/ entries (blog-build.mjs only touches /blog/)
try {
  if (existsSync('sitemap.xml') && sitemapEntries.length) {
    const sm0 = readFileSync('sitemap.xml', 'utf8'), P = SITE + '/guides/';
    let sm = sm0.replace(/[ \t]*<url>[\s\S]*?<\/url>\n?/g, blk => ((blk.match(/<loc>([^<]+)<\/loc>/) || [])[1] || '').startsWith(P) ? '' : blk);
    const blk = e => `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${e.mod}</lastmod>\n    <changefreq>${e.loc === P ? 'weekly' : 'daily'}</changefreq>\n    <priority>${e.loc === P ? '0.6' : '0.7'}</priority>\n  </url>\n`;
    sm = sm.replace('</urlset>', () => sitemapEntries.map(blk).join('') + '</urlset>');
    if (sm !== sm0) { writeFileSync('sitemap.xml', sm); console.log('Updated sitemap.xml with guide pages.'); }
  }
} catch (e) { console.log('sitemap not updated', e.message); }
