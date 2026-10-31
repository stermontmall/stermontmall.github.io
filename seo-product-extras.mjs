// Stermont Arcade - product page structure + internal links pass.
// Runs in .github/workflows/product-pages.yml right after seo-kenya.mjs (and before seo-overrides.mjs). Safe by design: every file is wrapped in try/catch, a bad page is skipped.
// What it does (no invented data: everything comes from the page itself or from the fixed maps below):
// 1) Product page: the plain-text description becomes real headings (h3), bullet lists and paragraphs, so Google and readers can scan it.
// 2) Product page: "At a glance" table (active ingredient and formulation) when the description names them.
// 3) Product page: "Safe use" box for agrochemical and pest control products (label, PCPB number, PPE, pre-harvest interval). Generic rules only, never dosages.
// 4) Product page: breadcrumb with the parent hub (Home > Agrochemicals > Crop Insecticides > product) + matching BreadcrumbList JSON-LD.
// 5) Product page and category page: links to related categories, buying guides and the "cheapest" price guide.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const SITE = 'https://stermontarcade.co.ke';
const WA = '254748888230';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const unesc = s => String(s ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const clip = (s, n) => s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;
const MARK = '<!--stm-extras-->';

const CROP = new Set(['crop-insecticides', 'fungicides', 'herbicides', 'adjuvants-growth-regulators', 'agrochemicals', 'fertilizers']);
const PEST = new Set(['pest-control-fumigation', 'bed-bug-killers', 'cockroach-ant-killers', 'mosquito-fly-control', 'rodent-control', 'termite-control', 'fumigation-chemicals']);
// Plant inputs (rooting hormone, foliar feeds, growth regulators) are not sprayed pesticides: no PCPB, pre-harvest or "mixing and spraying" wording for them.
const PLANT_INPUT = new Set(['adjuvants-growth-regulators']);

const HUB_NAME = { 'pest-control-fumigation': 'Pest Control & Fumigation', 'agrochemicals': 'Agrochemicals', 'agrovet': 'Agrovet', 'tvs-audio': 'TVs & Audio', 'appliances': 'Appliances' };
const PARENT = {
  'bed-bug-killers': 'pest-control-fumigation', 'cockroach-ant-killers': 'pest-control-fumigation', 'mosquito-fly-control': 'pest-control-fumigation', 'rodent-control': 'pest-control-fumigation',
  'termite-control': 'pest-control-fumigation', 'fumigation-chemicals': 'pest-control-fumigation', 'sprayers-equipment': 'pest-control-fumigation',
  'crop-insecticides': 'agrochemicals', 'herbicides': 'agrochemicals', 'fungicides': 'agrochemicals', 'adjuvants-growth-regulators': 'agrochemicals',
  'agrochemicals': 'agrovet', 'fertilizers': 'agrovet', 'veterinary-drugs': 'agrovet', 'animal-feeds': 'agrovet', 'disinfectants-hygiene': 'agrovet',
  'televisions': 'tvs-audio', 'home-theatre': 'tvs-audio', 'bluetooth-speakers': 'tvs-audio', 'tv-mounts-accessories': 'tvs-audio',
  'washing-machines': 'appliances', 'fridges-freezers': 'appliances', 'kitchen-dining': 'appliances'
};
const SIBLINGS = {
  'crop-insecticides': ['fungicides', 'herbicides', 'adjuvants-growth-regulators', 'sprayers-equipment'],
  'fungicides': ['crop-insecticides', 'herbicides', 'adjuvants-growth-regulators', 'sprayers-equipment'],
  'herbicides': ['crop-insecticides', 'fungicides', 'adjuvants-growth-regulators', 'sprayers-equipment'],
  'adjuvants-growth-regulators': ['crop-insecticides', 'fungicides', 'herbicides', 'sprayers-equipment'],
  'bed-bug-killers': ['cockroach-ant-killers', 'mosquito-fly-control', 'sprayers-equipment'],
  'cockroach-ant-killers': ['bed-bug-killers', 'rodent-control', 'sprayers-equipment'],
  'mosquito-fly-control': ['bed-bug-killers', 'cockroach-ant-killers', 'sprayers-equipment'],
  'rodent-control': ['termite-control', 'cockroach-ant-killers', 'sprayers-equipment'],
  'termite-control': ['rodent-control', 'fumigation-chemicals', 'sprayers-equipment'],
  'fumigation-chemicals': ['pest-control-fumigation', 'sprayers-equipment', 'protective-wear-safety'],
  'sprayers-equipment': ['crop-insecticides', 'pest-control-fumigation', 'protective-wear-safety'],
  'pest-control-fumigation': ['agrochemicals', 'sprayers-equipment'],
  'agrochemicals': ['pest-control-fumigation', 'fertilizers', 'sprayers-equipment']
};
const LABEL = ['/blog/how-to-read-an-insecticide-label-kenya.html', 'How to read an insecticide label'];
const AGRO = ['/blog/how-to-buy-agrovet-products-online-kenya.html', 'How to buy agrovet products online in Kenya'];
const GUIDES = {
  'bed-bug-killers': [['/blog/how-to-get-rid-of-bed-bugs-kenya.html', 'How to get rid of bed bugs in Kenya'], ['/blog/where-to-buy-bed-bug-killer-in-kenya.html', 'Where to buy bed bug killer in Kenya'], LABEL],
  'cockroach-ant-killers': [['/blog/how-to-get-rid-of-cockroaches-kenya.html', 'How to get rid of cockroaches in Kenya'], ['/blog/how-to-get-rid-of-ants-at-home-kenya.html', 'How to get rid of ants at home'], ['/blog/cockroach-gel-spray-or-powder-kenya.html', 'Cockroach gel, spray or powder?']],
  'mosquito-fly-control': [['/blog/mosquito-control-at-home-kenya.html', 'Mosquito control at home in Kenya'], LABEL],
  'rodent-control': [['/blog/rat-and-mouse-control-kenya.html', 'Rat and mouse control in Kenya'], ['/blog/rat-poison-glue-board-or-trap-kenya.html', 'Rat poison, glue board or trap?']],
  'termite-control': [['/blog/termite-control-at-home-kenya.html', 'Termite control at home in Kenya'], LABEL],
  'pest-control-fumigation': [['/blog/pest-control-products-for-hotels-and-restaurants-kenya.html', 'Pest control products for hotels and restaurants'], LABEL],
  'fumigation-chemicals': [['/blog/pest-control-products-for-hotels-and-restaurants-kenya.html', 'Pest control products for hotels and restaurants'], LABEL],
  'crop-insecticides': [LABEL, AGRO], 'fungicides': [AGRO, LABEL], 'herbicides': [AGRO, LABEL], 'adjuvants-growth-regulators': [AGRO], 'agrochemicals': [AGRO, LABEL], 'agrovet': [AGRO],
  'fertilizers': [AGRO], 'veterinary-drugs': [AGRO], 'animal-feeds': [AGRO, ['/blog/poultry-feed-premix-lysine-phosphate-kenya.html', 'Poultry feed, premix and lysine']],
  'televisions': [['/blog/smart-tv-buying-guide-kenya.html', 'Smart TV buying guide for Kenya']], 'fridges-freezers': [['/blog/how-to-choose-a-fridge-in-kenya.html', 'How to choose a fridge in Kenya']],
  'washing-machines': [['/blog/washing-machine-buying-guide-kenya.html', 'Washing machine buying guide']], 'kitchen-dining': [['/blog/air-fryer-buying-guide-kenya.html', 'Air fryer buying guide']],
  'phones-tablets': [['/blog/how-to-buy-smartphones-online-kenya.html', 'How to buy a smartphone online in Kenya']], 'computing': [['/blog/laptop-buying-guide-kenya.html', 'Laptop buying guide for Kenya']]
};
// Standard CropLife formulation codes (only read from the product NAME of agrochemical categories).
const FORM = { EC: 'Emulsifiable concentrate (EC)', SL: 'Soluble liquid (SL)', SC: 'Suspension concentrate (SC)', WP: 'Wettable powder (WP)', WG: 'Water-dispersible granules (WG)', WDG: 'Water-dispersible granules (WDG)', EW: 'Emulsion in water (EW)', OD: 'Oil dispersion (OD)', CS: 'Capsule suspension (CS)', DP: 'Dustable powder (DP)' };

const catName = slug => {
  try { const h = readFileSync(`c/${slug}.html`, 'utf8'); const m = h.match(/<h1>([\s\S]*?)<\/h1>/); return m ? unesc(m[1].replace(/<[^>]+>/g, '').trim()).replace(/\s+in Kenya$/i, '') : HUB_NAME[slug] || slug; } catch { return HUB_NAME[slug] || slug; }
};
const hasCat = slug => existsSync(`c/${slug}.html`);
const hasBlog = href => existsSync(href.replace(/^\//, ''));

const isHead = s => /^[A-Z][A-Z0-9 &'’,\/()%.+:\-]{2,70}$/.test(s) && (s.match(/[A-Z]/g) || []).length >= 3;
const BUL = /^[•·▪●]\s*|^-\s+/;
function structure(lines, name) {
  const out = []; let ul = false, first = true;
  const cased = {}; name.split(/\s+/).forEach(w => { cased[w.toLowerCase().replace(/[^a-z0-9%]/g, '')] = w; });
  const head = t => t.charAt(0) + t.slice(1).toLowerCase().replace(/[A-Za-z0-9%]+/g, w => cased[w.toLowerCase()] || w);
  const close = () => { if (ul) { out.push('</ul>'); ul = false; } };
  for (const s of lines) {
    if (!s) { close(); continue; }
    if (first) {
      first = false;
      const key = name.toLowerCase().split(' ').slice(0, 3).join(' ');
      if (s.length < 110 && !/[.!?]$/.test(s) && s.toLowerCase().includes(key)) continue;   // title line that repeats the H1
    }
    if (BUL.test(s)) { if (!ul) { out.push('<ul>'); ul = true; } out.push(`<li>${esc(s.replace(BUL, ''))}</li>`); continue; }
    close();
    out.push(isHead(s) ? `<h3>${esc(head(s))}</h3>` : `<p>${esc(s)}</p>`);
  }
  close();
  return out.join('\n');
}
function activeIngredient(lines) {
  const i = lines.findIndex(s => /^ACTIVE INGREDIENTS?$/.test(s));
  if (i < 0) return '';
  const got = [];
  for (let j = i + 1; j < lines.length; j++) {
    const s = lines[j];
    if (!s) { if (got.length) break; continue; }
    if (isHead(s)) break;
    got.push(s.replace(BUL, ''));
  }
  return clip(got.join('; '), 220);
}

const STYLE = `<style>.desc h3{font-size:1.05rem;margin:1.1rem 0 .3rem;color:#5b21b6}.desc p{margin:.4rem 0}.desc ul{margin:.3rem 0 .8rem;padding-left:1.2rem}.facts table{border-collapse:collapse;width:100%}.facts th,.facts td{border:1px solid #e6e1f5;padding:.45rem .6rem;text-align:left;vertical-align:top}.facts th{background:#f1ebff;width:34%}.safe li{margin:.3rem 0}.rel ul{margin:.3rem 0;padding-left:1.2rem}.rel li{margin:.25rem 0}</style>`;

let pDone = 0, cDone = 0;
// ---------- product pages ----------
if (existsSync('p')) for (const f of readdirSync('p').filter(f => f.endsWith('.html'))) {
  try {
    const file = `p/${f}`; let h = readFileSync(file, 'utf8');
    if (h.includes(MARK) || !/<h1>/.test(h)) continue;   // already done, or a redirect stub
    const nm = h.match(/<h1>([\s\S]*?)<\/h1>/), cm = h.match(/<nav class="bc">[\s\S]*?<a href="\/c\/([^"]+)\.html">([^<]*)<\/a>/), canon = (h.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
    // The H1 starts with the "Buy" prefix (seo-meta.mjs buyName). Headings and sentences built around the name add their own "Buy", so drop it here (no "Buy Buy Original ...").
    const name = unesc(nm[1].replace(/<[^>]+>/g, '').trim()).replace(/^Buy\s+/i, '');
    const slug = cm ? decodeURIComponent(cm[1]) : '', cname = cm ? cm[2] : '';
    let before = h;
    // 1) structured description
    let lines = [];
    h = h.replace(/(<div class="box"><h2 style="margin-top:0">About [^<]*<\/h2>)<div class="desc">([\s\S]*?)<\/div>(<\/div>)/, (m, a, inner, z) => {
      lines = unesc(inner.replace(/<[^>]+>/g, ' ')).split(/\n/).map(s => s.replace(/\s+/g, ' ').trim());
      return `${a}<div class="desc" style="white-space:normal">\n${structure(lines, name)}\n</div>${z}`;
    });
    // 2) at a glance
    const rows = [];
    const ai = activeIngredient(lines);
    const fm = (CROP.has(slug) || PEST.has(slug)) ? name.match(/\d(?:\.\d+)?\s?%?\s?(EC|SL|SC|WP|WG|WDG|EW|OD|CS|DP)\b/) : null;
    if (ai) rows.push(['Active ingredient', esc(ai)]);
    if (fm) rows.push(['Formulation', esc(FORM[fm[1]])]);
    if (ai || fm) {
      if (cm) rows.push(['Category', `<a href="/c/${cm[1]}.html">${cm[2]}</a>`]);
      const unit = (h.match(/<div class="pr">[\s\S]*?<small>\/ ([^<]*)<\/small>/) || [])[1];
      if (unit) rows.push(['Pack', unit]);
      rows.push(['Availability', /product:availability" content="in stock"/.test(h) ? 'In stock. Delivery to all 47 counties' : 'Currently sold out']);
      const facts = `${MARK}<div class="box facts"><h2 style="margin-top:0">${esc(name)} at a glance</h2><table>${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}</table></div>\n`;
      h = h.includes('<div class="box"><h2 style="margin-top:0">About ') ? h.replace('<div class="box"><h2 style="margin-top:0">About ', () => facts + '<div class="box"><h2 style="margin-top:0">About ') : h.replace('<div class="stk"', () => facts + '<div class="stk"');
    }
    // 3) safe use
    if (CROP.has(slug) || PEST.has(slug)) {
      const plant = PLANT_INPUT.has(slug);
      const li = plant ? [
        'Read the whole label before you use the product. The label is the instruction for rates, crops and safety.',
        'Wear gloves and avoid contact with skin and eyes; wash your hands after handling.',
        'Keep chemicals in their original container, out of reach of children, pets and livestock, and away from food and feed.',
        'Store tightly closed in a cool, dry place away from direct sunlight. Never reuse empty containers for food or water.'
      ] : [
        'Read the whole label before you buy or mix. The label is the legal instruction for crops, pests, rates and safety.',
        'Look for the PCPB registration number on the pack. Do not buy chemicals that carry none.',
        'Wear gloves, a mask or respirator, eye protection and long protective clothing when mixing and spraying, and wash well afterwards.',
        'Keep chemicals in their original container, out of reach of children, pets and livestock. Never reuse empty containers for food or water.'
      ];
      if (CROP.has(slug) && !plant) li.splice(2, 0, 'Respect the pre-harvest interval (PHI) printed on the label, the number of days that must pass between the last spray and harvest. Use the product only on the crops the label lists.');
      const safe = `<div class="box safe"><h2 style="margin-top:0">Safe use of ${esc(name)}</h2><ul>${li.map(x => `<li>${esc(x)}</li>`).join('')}</ul><p>Need advice on the right product, rate or crop? <a href="https://wa.me/${WA}?text=${encodeURIComponent(`Hello Stermont Arcade, I need advice on using ${name}`)}">Ask us on WhatsApp</a>${!plant && hasBlog(LABEL[0]) ? ` or read <a href="${LABEL[0]}">${LABEL[1].toLowerCase()}</a>` : ''}.</p></div>\n`;
      const about = /(<div class="box"><h2 style="margin-top:0">About [\s\S]*?<\/div><\/div>)/;
      h = about.test(h) ? h.replace(about, (m) => m + '\n' + (h.includes(MARK) ? '' : MARK) + safe) : h.replace('<div class="stk"', () => (h.includes(MARK) ? '' : MARK) + safe + '<div class="stk"');
    }
    // 4) hub breadcrumb
    const hub = PARENT[slug];
    if (hub && hasCat(hub) && cm && canon) {
      h = h.replace(/<nav class="bc">[\s\S]*?<\/nav>/, () => `<nav class="bc"><a href="${SITE}/">Home</a> › <a href="/c/${hub}.html">${esc(HUB_NAME[hub] || catName(hub))}</a> › <a href="/c/${cm[1]}.html">${cm[2]}</a> › ${nm[1]}</nav>`);
      const ld = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', SITE + '/'], [HUB_NAME[hub] || catName(hub), `${SITE}/c/${hub}.html`], [unesc(cname), `${SITE}/c/${cm[1]}.html`], [name, canon]].map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: u })) };
      h = h.replace(/<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"BreadcrumbList"[\s\S]*?<\/script>/, () => '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>');
    }
    // 5) related guides and categories
    const items = [];
    // cname is already HTML-escaped on the page (e.g. "Adjuvants &amp; Growth Regulators"), so unescape before escaping again
    if (slug && existsSync(`guides/cheapest-${slug}-kenya.html`)) items.push([`/guides/cheapest-${slug}-kenya.html`, `Cheapest ${esc(unesc(cname))} in Kenya: price list`]);
    (GUIDES[slug] || []).filter(g => hasBlog(g[0])).forEach(g => items.push([g[0], esc(g[1])]));
    (SIBLINGS[slug] || []).filter(hasCat).forEach(k => items.push([`/c/${k}.html`, `Shop ${esc(catName(k))}`]));
    if (hub && hasCat(hub)) items.push([`/c/${hub}.html`, `All ${esc(HUB_NAME[hub] || catName(hub))}`]);
    if (items.length) {
      const rel = `<div class="box rel"><h2 style="margin-top:0">Related guides and categories</h2><ul>${items.map(([u, t]) => `<li><a href="${u}">${t}</a></li>`).join('')}</ul></div>\n`;
      h = h.replace('<div class="stk"', () => rel + '<div class="stk"');
    }
    if (h !== before) {
      if (!h.includes(MARK)) h = h.replace('<div class="stk"', () => MARK + '<div class="stk"');
      h = h.replace('</head>', () => STYLE + '</head>');
      writeFileSync(file, h); pDone++;
    }
  } catch (e) { console.log('skip product page', f, e.message); }
}
console.log(`Product pages restructured with facts, safety and links: ${pDone}.`);

// ---------- category pages ----------
const BROWSE = '<p><a href="/c/">Browse all categories</a></p>';
if (existsSync('c')) for (const f of readdirSync('c').filter(f => f.endsWith('.html') && f !== 'index.html')) {
  try {
    const slug = f.replace(/\.html$/, ''), file = `c/${f}`; let h = readFileSync(file, 'utf8');
    if (h.includes(MARK) || !h.includes(BROWSE)) continue;
    const items = [];
    (GUIDES[slug] || []).filter(g => hasBlog(g[0])).forEach(g => items.push([g[0], esc(g[1])]));
    (SIBLINGS[slug] || []).filter(hasCat).forEach(k => items.push([`/c/${k}.html`, `Shop ${esc(catName(k))}`]));
    const hub = PARENT[slug];
    if (hub && hasCat(hub)) items.push([`/c/${hub}.html`, `All ${esc(HUB_NAME[hub] || catName(hub))}`]);
    if (!items.length) continue;
    h = h.replace(BROWSE, () => `${MARK}<div class="box rel"><h2 style="margin-top:0">Guides and related categories</h2><ul>${items.map(([u, t]) => `<li><a href="${u}">${t}</a></li>`).join('')}</ul></div>\n${BROWSE}`).replace('</head>', () => STYLE + '</head>');
    writeFileSync(file, h); cDone++;
  } catch (e) { console.log('skip category page', f, e.message); }
}
console.log(`Category pages with guide and related links: ${cDone}.`);
