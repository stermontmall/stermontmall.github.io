// node services/build-services.mjs
// Reads services/services-data.json (+ optional services-extra.json and services-more.json) and writes:
//   services/<slug>.html            one landing page per service
//   services/guides/<slug>.html     one guide (blog) post per service
//   services/guides/index.html      guides index
//   services/sitemap-services.xml   URLs of all pages above
//   services/word-counts.json       words of the main copy of every page (target 600 or more)
// LOOK: every page uses the shop's mobile shell on phones (/shell-chrome.js top bar + bottom nav, /services/page.js) and the
// same violet hero as the hub. Desktop keeps the plain full page. Never hand-edit the generated pages; edit this file.
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
const words = html => html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<a class="btn[^>]*>[\s\S]*?<\/a>/g, ' ').replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').split(/\s+/).filter(Boolean).length;
const counts = { services: {}, guides: {} };

// Same theme as the shop: violet #7c3aed (theme-color), dark violet #5b21b6 for headings, tint #f1ebff, line #e6e1f5.
const CSS = `:root{--bg:#fff;--fg:#1e1b2e;--mut:#5f5a73;--card:#f1ebff;--brand:#7c3aed;--brand-fg:#fff;--link:#5b21b6;--line:#e6e1f5}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#14111f;--fg:#ece8f7;--mut:#a79fbd;--card:#1d1830;--brand:#a78bfa;--brand-fg:#1b1033;--link:#c4b5fd;--line:#322a4a}}
*{box-sizing:border-box}html{scroll-padding-top:calc(60px + env(safe-area-inset-top,0px))}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.65 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}
body.stm-chrome{padding-top:0}
main{max-width:760px;margin:0 auto;padding:0 16px 24px}
nav.crumbs{font-size:13px;color:var(--mut);margin:12px 0 10px}nav.crumbs a{color:var(--mut)}
a{color:var(--link)}
.hero{margin:0 -16px 8px;padding:24px 16px 22px;background:linear-gradient(135deg,#4c1d95,#7c3aed 55%,#a855f7);color:#fff;border-radius:0 0 26px 26px}
.hero .eyebrow{margin:0;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;font-weight:700;opacity:.85}
.hero h1{color:#fff;font-size:1.55rem;line-height:1.25;margin:.35em 0 .5em}
.hero .lead{color:rgba(255,255,255,.92);font-size:.98rem;margin:0 0 14px}
.pricebox{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);border-radius:14px;padding:12px 14px;margin:0 0 14px}
.pricebox span{display:block;font-size:.8rem;opacity:.85}.pricebox b{display:block;font-size:1.35rem}.pricebox small{display:block;opacity:.85;line-height:1.4;margin-top:2px}
.cta{display:flex;gap:10px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;background:var(--brand);color:var(--brand-fg);padding:10px 18px;border-radius:999px;border:1px solid transparent;text-decoration:none;font-weight:600}
.btn.light{background:#fff;color:#4c1d95}
.btn.ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.75)}
.btn.alt{background:transparent;color:var(--link);border-color:var(--brand)}
.chips{list-style:none;display:flex;gap:8px;flex-wrap:wrap;padding:0;margin:14px 0 0}
.chips li{background:rgba(255,255,255,.16);border-radius:999px;padding:4px 12px;font-size:.82rem;margin:0}
h2{font-size:1.2rem;line-height:1.3;margin:1.7em 0 .6em;color:var(--link);border-left:4px solid var(--brand);padding-left:10px}
h3{font-size:1.05rem;margin:1em 0 .3em}
p{margin:.7em 0}
.price{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin:20px 0}
.price b{font-size:1.2rem;color:var(--link)}
ul,ol{padding-left:1.2em}li{margin:.3em 0}
ul.checks,ol.steps{list-style:none;padding:0}
.checks li{position:relative;padding:10px 12px 10px 40px;background:var(--card);border:1px solid var(--line);border-radius:12px;margin:8px 0}
.checks li::before{content:"✓";position:absolute;left:14px;top:10px;color:var(--brand);font-weight:700}
.steps{counter-reset:s}
.steps li{counter-increment:s;position:relative;padding:12px 12px 12px 56px;background:var(--card);border:1px solid var(--line);border-radius:14px;margin:8px 0}
.steps li::before{content:counter(s);position:absolute;left:13px;top:11px;width:30px;height:30px;border-radius:50%;background:var(--brand);color:var(--brand-fg);display:grid;place-items:center;font-weight:700}
details{border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:8px 0;background:var(--card)}
summary{cursor:pointer;font-weight:600;list-style:none;display:flex;align-items:center;gap:10px}
summary::-webkit-details-marker{display:none}
summary::after{content:"›";margin-left:auto;font-size:1.4rem;line-height:1;color:var(--mut);transition:transform .2s}
details[open] summary::after{transform:rotate(90deg)}
details p{margin:.6em 0 0}
.tiles{display:grid;gap:12px;grid-template-columns:repeat(2,1fr)}
@media (min-width:640px){.tiles{grid-template-columns:repeat(4,1fr)}}
.tile{display:flex;flex-direction:column;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;text-decoration:none;color:var(--fg)}
.tile .art{display:grid;place-items:center;aspect-ratio:16/10;background:linear-gradient(135deg,var(--g1),var(--g2))}
.tile .art svg{width:44px;height:44px;fill:none;stroke:#fff;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.tile b{display:block;padding:10px 12px 0;font-size:.92rem;line-height:1.25}
.tile small{display:block;padding:2px 12px 12px;color:var(--mut);font-size:.8rem}
.grid{display:grid;gap:8px;grid-template-columns:1fr}
.grid a{display:block;padding:12px 14px;border:1px solid var(--line);border-radius:12px;text-decoration:none;color:var(--fg);background:var(--card)}
.grid small{display:block;color:var(--mut)}
.fab{position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:40;padding:12px 20px;box-shadow:0 6px 18px rgba(76,29,149,.35)}
body.stm-chrome .fab{bottom:calc(72px + env(safe-area-inset-bottom,0px))}
footer{color:var(--mut);font-size:14px;margin:32px 0 8px;border-top:1px solid var(--line);padding-top:12px}
@media (prefers-reduced-motion:reduce){summary::after{transition:none}}`;

// One simple line icon and one violet-family gradient per service, shown on the "Other services" tiles.
const ICONS = {
  'pest-control-fumigation-nairobi': '<rect x="7" y="8" width="10" height="11" rx="5"/><path d="M9 8a3 3 0 016 0M12 8v11M3 10l4 2M21 10l-4 2M3 17l4-2M21 17l-4-2"/>',
  'solar-system-installation-kenya': '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  'cctv-smart-security-installation-nairobi': '<rect x="3" y="7" width="14" height="9" rx="2"/><path d="M17 10l4-2v8l-4-2M8 16v3h5"/>',
  'tv-mounting-audio-visual-setup-nairobi': '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
  'agrovet-spraying-crop-consultancy-kenya': '<path d="M12 21v-8M12 13c0-4 3-6 7-6 0 4-3 6-7 6zM12 15c0-3-2-5-6-5 0 3 2 5 6 5z"/>',
  'home-appliance-repair-nairobi': '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M8 7h2"/>',
  'deep-cleaning-carpet-wash-nairobi': '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  'electrical-plumbing-maintenance-nairobi': '<path d="M13 3L5.5 13.5H11L10 21l7.5-10.5H12z"/>'
};
const GRADS = [['#4c1d95', '#7c3aed'], ['#6d28d9', '#a855f7'], ['#5b21b6', '#8b5cf6'], ['#7c3aed', '#c084fc']];
const icon = slug => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[slug] || ICONS['electrical-plumbing-maintenance-nairobi']}</svg>`;
const tile = (o, i) => `<a class="tile" href="/services/${o.slug}.html"><span class="art" style="--g1:${GRADS[i % 4][0]};--g2:${GRADS[i % 4][1]}">${icon(o.slug)}</span><b>${esc(o.name)}</b><small>${kes(o.priceMin)} to ${kes(o.priceMax)}${o.priceOpen ? '+' : ''}</small></a>`;
const hero = ({ eyebrow, h1, lead, priceHtml = '', cta = '', chips = [] }) => `<header class="hero"><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(h1)}</h1><p class="lead">${lead}</p>${priceHtml}${cta ? `<div class="cta">${cta}</div>` : ''}${chips.length ? `<ul class="chips">${chips.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}</header>`;

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
<style>${CSS}</style>${extra}<script src="/shell-chrome.js?v=1" defer></script><script src="/services/page.js?v=1" defer></script></head><body><main>`;
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
${hero({
    eyebrow: 'Stermont Arcade services',
    h1: s.h1,
    lead: esc(s.short),
    priceHtml: `<div class="pricebox"><span>Typical price range</span><b>${priceTxt}</b><small>${esc(s.priceNote)}</small></div>`,
    cta: `<a class="btn light" href="${ask}">Get a quote on WhatsApp</a><a class="btn ghost" href="#faq">Common questions</a>`,
    chips: ['Quote after inspection', 'Pay by M-Pesa', 'Nairobi and all 47 counties']
  })}
${s.intro.map(p => `<p>${esc(p)}</p>`).join('')}
<h2>What is included</h2><ul class="checks">${s.included.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
<h2>How it works</h2><ol class="steps">${s.steps.map(i => `<li>${esc(i)}</li>`).join('')}</ol>
<h2>What decides the price</h2><ul class="checks">${s.priceFactors.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
${s.extraSections.map(x => `<h2>${esc(x.h)}</h2>${x.p.map(p => `<p>${esc(p)}</p>`).join('')}`).join('')}
<h2>Who we serve</h2><p>${esc(s.audience)}</p>
<h2>Where we work</h2><p>${esc(s.areas)}</p>
${coverageBlock(s.name)}
${s.guaranteeNote ? `<h2>Our promise</h2><p>${esc(s.guaranteeNote)}</p>` : ''}
<h2 id="faq">Frequently asked questions</h2>${s.faqs.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
${s.searches.length ? `<h2>Popular searches in Kenya</h2><p>${s.searches.map(esc).join(' · ')}</p>` : ''}
${guide ? `<h2>Read the guide</h2><p><a href="/services/guides/${guide.slug}.html">${esc(guide.title)}</a></p>` : ''}
<p><a class="btn" href="${ask}">Book ${esc(s.name)}</a></p>
<h2>Other services</h2><div class="tiles">${others.map((o, i) => tile(o, i)).join('')}</div>
<a class="btn fab" href="${ask}">Get a quote</a>` + foot;
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
${hero({
    eyebrow: 'Guide',
    h1: g.title,
    lead: `<b>Quick answer:</b> ${esc(g.answer)}`,
    cta: `<a class="btn light" href="${ask}">Get a quote on WhatsApp</a><a class="btn ghost" href="/services/${s.slug}.html">See the service page</a>`
  })}
${g.sections.map(x => `<h2>${esc(x.h)}</h2>${x.p.map(p => `<p>${esc(p)}</p>`).join('')}`).join('')}
<h2>Where this applies</h2><p>${esc(s.name)} is available in Nairobi and the other big cities (${BIG_CITIES.filter(c => c !== 'Nairobi').join(', ')}), and we take requests from all 47 counties. Send your town on WhatsApp and we confirm the schedule and any travel cost.</p>
<h2>Questions people ask</h2>${g.faqs.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
<div class="price"><div>Need this done?</div><b>${esc(s.name)}: ${kes(s.priceMin)} to ${kes(s.priceMax)}${s.priceOpen ? '+' : ''}</b></div>
<p><a class="btn" href="${ask}">Get a quote on WhatsApp</a> <a class="btn alt" href="/services/${s.slug}.html">See the service page</a></p>
<a class="btn fab" href="${ask}">Get a quote</a>` + foot;
  counts.guides[g.slug] = words(h.slice(h.indexOf('<h1>'), h.indexOf('<div class="price"><div>Need this done?')));
  write(`guides/${g.slug}.html`, h);
}

{
  const url = `${SITE}/services/guides/`;
  let h = head({ title: 'Home Services Guides for Nairobi and Kenya | Stermont Arcade', desc: 'Plain-language guides on pest control, solar, CCTV, appliance repair, cleaning and more, with typical Kenyan prices.', url });
  h += `<nav class="crumbs"><a href="/">Home</a> / <a href="/services/">Services</a> / Guides</nav>
${hero({ eyebrow: 'Guides', h1: 'Service guides for Nairobi and Kenya', lead: 'Straight answers and typical prices before you book.' })}
<h2>All guides</h2><div class="grid">${data.guides.map(g => `<a href="/services/guides/${g.slug}.html">${esc(g.title)}<small>${esc(g.desc)}</small></a>`).join('')}</div>` + foot;
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
