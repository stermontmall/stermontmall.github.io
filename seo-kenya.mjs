// Stermont Arcade - Kenya SEO pass. Runs in .github/workflows/product-pages.yml right after generate-products.mjs
// and BEFORE seo-overrides.mjs, so hand-written overrides in seo-overrides.json always win.
// 1) Product pages: Kenyan-search titles/descriptions (price in KSh, "in Kenya", M-Pesa, 47 counties).
//    Titles now start with "Buy" ("Buy <product> in Kenya | KSh X"). Descriptions say what the product is (first sentence of its own description). The store name is no longer
//    claimed as the product brand in the Product schema when no real brand is known.
// 2) Category pages: "from KSh X" in the description + a link to the cheapest-prices guide.
// 3) /guides/: one "Cheapest <category> in Kenya (bei nafuu)" page per category, built from the prices already on the
//    category pages (no network, no database), plus /guides/ index and the /guides/ entries in sitemap.xml.
// Safe by design: every file is wrapped in try/catch, a bad page is skipped, the script never exits with an error.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';

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
  'sprayers-equipment': 'pampu za kunyunyizia dawa', 'protective-wear-safety': 'vifaa vya usalama', 'disinfectants-hygiene': 'dawa za usafi'
};

// ---------- 1) product pages ----------
let pDone = 0;
if (existsSync('p')) for (const f of readdirSync('p').filter(f => f.endsWith('.html'))) {
  try {
    const file = `p/${f}`; let h = readFileSync(file, 'utf8');
    const pm = h.match(/product:price:amount" content="(\d+)"/), nm = h.match(/<h1>([\s\S]*?)<\/h1>/);
    if (!pm || !nm) continue;
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
if (existsSync('c')) for (const f of readdirSync('c').filter(f => f.endsWith('.html') && f !== 'index.html')) {
  try {
    const slug = f.replace(/\.html$/, ''), file = `c/${f}`; let h = readFileSync(file, 'utf8');
    const h1 = unesc(((h.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, '').trim());
    const items = [...h.matchAll(ITEM)].map(m => ({ url: m[1], name: m[2], price: Number(m[3].replace(/,/g, '')) })).filter(i => i.price > 0);
    if (!h1 || items.length < 3) continue;
    items.sort((a, b) => a.price - b.price);
    const label = h1.replace(/\s+in Kenya$/i, '');
    const min = items[0].price, max = items[items.length - 1].price;
    cats.push({ slug, label, h1, items, min, max, sw: SW[slug] || '' });
    // category description: lead with "from KSh X"
    const mark = `${esc(h1)} from KSh `;
    h = h.replace(/(<meta name="description" content=")([^"]*)(">)/, (m, a, cur, b) => {
      if (cur.startsWith(mark)) cur = cur.slice(cur.indexOf('. ') + 2);
      return a + `${mark}${min.toLocaleString('en-US')}. ` + cur + b;
    });
    const dm = h.match(/<meta name="description" content="([^"]*)">/);
    if (dm) h = h.replace(/(<meta property="og:description" content=")[^"]*(">)/, (m, a, b) => a + dm[1] + b).replace(/(<meta name="twitter:description" content=")[^"]*(">)/, (m, a, b) => a + dm[1] + b);
    if (!h.includes('/guides/cheapest-'))
      h = h.replace('<p><a href="/c/">Browse all categories</a></p>', () => `<div class="box"><a href="/guides/cheapest-${slug}-kenya.html">Cheapest ${esc(label)} in Kenya: bei nafuu, prices from ${ksh(min)}</a></div>\n<p><a href="/c/">Browse all categories</a></p>`);
    writeFileSync(file, h);
  } catch (e) { console.log('skip category page', f, e.message); }
}

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
