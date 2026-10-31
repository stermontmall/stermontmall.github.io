// node services/build-services.mjs
// Reads services/services-data.json (+ optional services-extra.json and services-more.json) and writes:
//   services/<slug>.html            one landing page per service
//   services/guides/<slug>.html     one guide (blog) post per service
//   services/guides/index.html      guides index
//   services/sitemap-services.xml   URLs of all pages above
//   services/word-counts.json       words of the main copy of every page (target 600 or more)
// OWNER RULE: the word "Kitale" must never appear in a generated page. The build fails if it does.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(dir, 'services-data.json'), 'utf8'));
const xf = path.join(dir, 'services-extra.json');
const extra = fs.existsSync(xf) ? JSON.parse(fs.readFileSync(xf, 'utf8')) : { services: {}, guides: {} };
for (const s of data.services) {
  const e = (extra.services || {})[s.slug] || {};
  s.extraSections = e.sections || []; s.searches = e.searches || [];
  if (e.areas) s.areas = e.areas;
  if (e.faqs) s.faqs = s.faqs.concat(e.faqs);
}
for (const g of data.guides) {
  const e = (extra.guides || {})[g.slug] || {};
  if (e.sections) g.sections = g.sections.concat(e.sections);
  if (e.faqs) g.faqs = g.faqs.concat(e.faqs);
}
// Second extra file: tender, city and checklist sections (added after the first file's sections).
// Its "areas" text wins over the one in services-extra.json (which still names a town the owner has banned).
const mf = path.join(dir, 'services-more.json');
const more = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, 'utf8')) : { services: {}, guides: {} };
for (const s of data.services) {
  const e = (more.services || {})[s.slug] || {};
  s.extraSections = s.extraSections.concat(e.sections || []);
  s.searches = s.searches.concat(e.searches || []);
  if (e.areas) s.areas = e.areas;
  if (e.faqs) s.faqs = s.faqs.concat(e.faqs);
}
for (const g of data.guides) {
  const e = (more.guides || {})[g.slug] || {};
  if (e.sections) g.sections = g.sections.concat(e.sections);
  if (e.faqs) g.faqs = g.faqs.concat(e.faqs);
}
const SITE = 'https://stermontarcade.co.ke';
const WA = '254748888230';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const kes = n => 'KSh ' + Number(n).toLocaleString('en-US');
const wa = t => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
const ld = o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
const words = html => html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<a class="btn[^>]*>[\s\S]*?<\/a>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').split(/\s+/).filter(Boolean).length;
const counts = { services: {}, guides: {} };

// Same theme as the shop: violet #7c3aed (theme-color), dark violet #5b21b6 for headings, tint #f1ebff, line #e6e1f5.
const CSS = `:root{--bg:#fff;--fg:#1e1b2e;--mut:#5f5a73;--card:#f1ebff;--brand:#7c3aed;--brand-fg:#fff;--link:#5b21b6;--line:#e6e1f5}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#14111f;--fg:#ece8f7;--mut:#a79fbd;--card:#1d1830;--brand:#a78bfa;--brand-fg:#1b1033;--link:#c4b5fd;--line:#322a4a}}
*{box-sizing:border-box}html{scroll-padding-top:env(safe-area-inset-top,0px)}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.65 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}
main{max-width:760px;margin:0 auto;padding:16px}
nav.crumbs{font-size:14px;color:var(--mut);margin:4px 0 12px}nav.crumbs a{color:var(--mut)}
h1{font-size:1.6rem;line-height:1.25;margin:.2em 0 .4em}h2{font-size:1.25rem;margin:1.6em 0 .5em;color:var(--link)}h3{font-size:1.05rem;margin:1em 0 .3em}
.lead{font-size:1.05rem;color:var(--mut)}
.price{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:16px 0}
.price b{font-size:1.3rem;color:var(--link)}
.btn{display:inline-block;background:var(--brand);color:var(--brand-fg);padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:600;margin:6px 8px 6px 0}
.btn.alt{background:transparent;color:var(--link);border:1px solid var(--brand)}
ul,ol{padding-left:1.2em}li{margin:.3em 0}
details{border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin:8px 0;background:var(--card)}summary{cursor:pointer;font-weight:600}
.grid{display:grid;gap:8px;grid-template-columns:1fr}.grid a{display:block;padding:10px 12px;border:1px solid var(--line);border-radius:10px;text-decoration:none;color:var(--fg)}
.grid small{display:block;color:var(--mut)}
footer{color:var(--mut);font-size:14px;margin:32px 0 8px;border-top:1px solid var(--line);padding-top:12px}a{color:var(--link)}`;

function head({ title, desc, url, extra = '' }) {
  return `<!doctype html><html lang="en-KE"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#7c3aed">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}"><meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website"><meta property="og:locale" content="en_KE"><meta property="og:site_name" content="Stermont Arcade">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/icon-512.png">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}">
<link rel="icon" href="/favicon.png">
<style>${CSS}</style>${extra}</head><body><main>`;
}
const foot = `<footer>Stermont Arcade, head office: The Sarit Centre, Karuna Road, Westlands, Nairobi. WhatsApp <a href="${wa('Hello Stermont Arcade, I need a service quote.')}">+254 748 888 230</a>. Pay by M-Pesa. Prices are estimates and are confirmed after inspection. <a href="/services/">All services</a> · <a href="/services/guides/">Guides</a> · <a href="/">Shop</a></footer></main></body></html>`;

// Coverage (owner, 2026-10-31): services are bookable from ALL 47 counties; Nairobi and the big cities come first.
// Order: Nairobi, then the counties of the big cities, then the other counties A to Z. The build fails unless there are exactly 47.
const BIG_CITIES = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Nyeri', 'Meru', 'Machakos', 'Naivasha', 'Kisii', 'Kakamega', 'Malindi'];
const FIRST_COUNTIES = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Uasin Gishu', 'Kiambu', 'Machakos', 'Kajiado', 'Nyeri', 'Meru', 'Kisii', 'Kakamega', 'Kilifi'];
const OTHER_COUNTIES = ['Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kericho', 'Kirinyaga', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Makueni', 'Mandera', 'Marsabit', 'Migori', "Murang'a", 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Vihiga', 'Wajir', 'West Pokot'];
const COUNTIES = [...FIRST_COUNTIES, ...OTHER_COUNTIES];
if (COUNTIES.length !== 47 || new Set(COUNTIES).size !== 47) { console.error('COUNTY LIST MUST HAVE 47 DIFFERENT COUNTIES, HAS', COUNTIES.length); process.exit(1); }
const coverageBlock = name => `<h2>${esc(name)} in all 47 counties</h2><p>We take ${esc(name.toLowerCase())} requests from all 47 counties in Kenya. Nairobi is our home market, with our head office at The Sarit Centre in Westlands, and we put the big cities first: ${BIG_CITIES.join(', ')}. For any other county, send your town and the job on WhatsApp and we confirm the schedule and any travel cost before you pay.</p><p>Counties we take bookings from: ${COUNTIES.join(', ')}.</p>`;

const business = {
  '@type': 'LocalBusiness', '@id': SITE + '/#business', name: 'Stermont Arcade', url: SITE + '/',
  telephone: '+254748888230', priceRange: 'KES',
  areaServed: [{ '@type': 'City', name: 'Nairobi' }, ...COUNTIES.filter(c => c !== 'Nairobi').map(c => ({ '@type': 'AdministrativeArea', name: c + ' County' })), { '@type': 'Country', name: 'Kenya' }],
  address: { '@type': 'PostalAddress', streetAddress: 'The Sarit Centre, Karuna Road, Westlands', addressLocality: 'Nairobi', addressCountry: 'KE' }
};

const out = [];
const write = (rel, txt) => { const f = path.join(dir, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, txt); out.push(rel); };

for (const s of data.services) {
  const url = `${SITE}/services/${s.slug}.html`;
  const guide = data.guides.find(g => g.service === s.slug);
  const ask = wa(`Hello Stermont Arcade, I would like a quote for ${s.name}. My location is: `);
  const others = data.services.filter(x => x.slug !== s.slug);
  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'Service', name: s.name, serviceType: s.name, description: s.metaDesc, url,
      provider: business, areaServed: business.areaServed,
      offers: { '@type': 'AggregateOffer', priceCurrency: 'KES', lowPrice: s.priceMin, highPrice: s.priceMax, url } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: s.faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Services', item: SITE + '/services/' },
      { '@type': 'ListItem', position: 3, name: s.name, item: url }] }
  ];
  const priceTxt = `${kes(s.priceMin)} to ${kes(s.priceMax)}${s.priceOpen ? '+' : ''}`;
  let h = head({ title: s.metaTitle, desc: s.metaDesc, url, extra: jsonld.map(ld).join('') });
  h += `<nav class="crumbs"><a href="/">Home</a> / <a href="/services/">Services</a> / ${esc(s.name)}</nav>
<h1>${esc(s.h1)}</h1><p class="lead">${esc(s.short)}</p>
<div class="price"><div>Typical price range</div><b>${priceTxt}</b><div>${esc(s.priceNote)}</div></div>
<p><a class="btn" href="${ask}">Get a quote on WhatsApp</a><a class="btn alt" href="#faq">Common questions</a></p>
${s.intro.map(p => `<p>${esc(p)}</p>`).join('')}
<h2>What is included</h2><ul>${s.included.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
<h2>How it works</h2><ol>${s.steps.map(i => `<li>${esc(i)}</li>`).join('')}</ol>
<h2>What decides the price</h2><ul>${s.priceFactors.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
${s.extraSections.map(x => `<h2>${esc(x.h)}</h2>${x.p.map(p => `<p>${esc(p)}</p>`).join('')}`).join('')}
<h2>Who we serve</h2><p>${esc(s.audience)}</p>
<h2>Where we work</h2><p>${esc(s.areas)}</p>
${coverageBlock(s.name)}
${s.guaranteeNote ? `<h2>Our promise</h2><p>${esc(s.guaranteeNote)}</p>` : ''}
<h2 id="faq">Frequently asked questions</h2>${s.faqs.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
${s.searches.length ? `<h2>Popular searches in Kenya</h2><p>${s.searches.map(esc).join(' · ')}</p>` : ''}
${guide ? `<h2>Read the guide</h2><p><a href="/services/guides/${guide.slug}.html">${esc(guide.title)}</a></p>` : ''}
<p><a class="btn" href="${ask}">Book ${esc(s.name)}</a></p>
<h2>Other services</h2><div class="grid">${others.map(o => `<a href="/services/${o.slug}.html">${esc(o.name)}<small>${kes(o.priceMin)} to ${kes(o.priceMax)}${o.priceOpen ? '+' : ''}</small></a>`).join('')}</div>` + foot;
  counts.services[s.slug] = words(h.slice(h.indexOf('<h1>'), h.indexOf('<h2>Other services</h2>')));
  write(`${s.slug}.html`, h);
}

for (const g of data.guides) {
  const s = data.services.find(x => x.slug === g.service);
  const url = `${SITE}/services/guides/${g.slug}.html`;
  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'Article', headline: g.title, description: g.desc, mainEntityOfPage: url, inLanguage: 'en-KE',
      datePublished: data.published, dateModified: data.published, author: { '@type': 'Organization', name: 'Stermont Arcade' },
      publisher: { '@type': 'Organization', name: 'Stermont Arcade', url: SITE + '/' } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: g.faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }
  ];
  const ask = wa(`Hello Stermont Arcade, I read your guide and would like a quote for ${s.name}. My location is: `);
  let h = head({ title: g.title + ' | Stermont Arcade', desc: g.desc, url, extra: jsonld.map(ld).join('') });
  h += `<nav class="crumbs"><a href="/">Home</a> / <a href="/services/">Services</a> / <a href="/services/guides/">Guides</a></nav>
<h1>${esc(g.title)}</h1>
<p class="lead"><b>Quick answer:</b> ${esc(g.answer)}</p>
${g.sections.map(x => `<h2>${esc(x.h)}</h2>${x.p.map(p => `<p>${esc(p)}</p>`).join('')}`).join('')}
<h2>Where this applies</h2><p>${esc(s.name)} is available in Nairobi and the other big cities (${BIG_CITIES.filter(c => c !== 'Nairobi').join(', ')}), and we take requests from all 47 counties. Send your town on WhatsApp and we confirm the schedule and any travel cost.</p>
<h2>Questions people ask</h2>${g.faqs.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
<div class="price"><div>Need this done?</div><b>${esc(s.name)}: ${kes(s.priceMin)} to ${kes(s.priceMax)}${s.priceOpen ? '+' : ''}</b></div>
<p><a class="btn" href="${ask}">Get a quote on WhatsApp</a><a class="btn alt" href="/services/${s.slug}.html">See the service page</a></p>` + foot;
  counts.guides[g.slug] = words(h.slice(h.indexOf('<h1>'), h.indexOf('<div class="price"><div>Need this done?')));
  write(`guides/${g.slug}.html`, h);
}

{
  const url = `${SITE}/services/guides/`;
  let h = head({ title: 'Home Services Guides for Nairobi and Kenya | Stermont Arcade', desc: 'Plain-language guides on pest control, solar, CCTV, appliance repair, cleaning and more, with typical Kenyan prices.', url });
  h += `<nav class="crumbs"><a href="/">Home</a> / <a href="/services/">Services</a> / Guides</nav><h1>Service guides for Nairobi and Kenya</h1>
<p class="lead">Straight answers and typical prices before you book.</p><div class="grid">${data.guides.map(g => `<a href="/services/guides/${g.slug}.html">${esc(g.title)}<small>${esc(g.desc)}</small></a>`).join('')}</div>` + foot;
  write('guides/index.html', h);
}

const urls = ['/services/', '/services/guides/', ...data.services.map(s => `/services/${s.slug}.html`), ...data.guides.map(g => `/services/guides/${g.slug}.html`)];
write('sitemap-services.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${SITE}${u}</loc><lastmod>${data.published}</lastmod></url>`).join('\n')}\n</urlset>\n`);
write('word-counts.json', JSON.stringify(counts, null, 1) + '\n');

// Owner rule: never publish the banned town name. Fail the build (so CI commits nothing) if any generated file has it.
const banned = out.filter(rel => /kitale/i.test(fs.readFileSync(path.join(dir, rel), 'utf8')));
if (banned.length) { console.error('BANNED TOWN NAME FOUND IN:', banned.join(', ')); process.exit(1); }

const low = [...Object.entries(counts.services), ...Object.entries(counts.guides)].filter(([, n]) => n < 600);
console.log('wrote', out.length, 'files', JSON.stringify(counts));
if (low.length) console.log('UNDER 600 WORDS:', JSON.stringify(low));
