// node services/build-services.mjs
// Reads services/services-data.json and writes:
//   services/<slug>.html            one landing page per service
//   services/guides/<slug>.html     one guide (blog) post per service
//   services/guides/index.html      guides index
//   services/sitemap-services.xml   URLs of all pages above
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(path.join(dir, 'services-data.json'), 'utf8'));
const SITE = 'https://stermontarcade.co.ke';
const WA = '254748888230';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const kes = n => 'KSh ' + Number(n).toLocaleString('en-US');
const wa = t => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
const ld = o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;

const CSS = `:root{--bg:#fff;--fg:#1b1f23;--mut:#5b6670;--card:#f4f6f8;--brand:#0a7d3b;--brand-fg:#fff;--line:#dfe4e8}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#101418;--fg:#e8ecef;--mut:#9aa6b0;--card:#1a2026;--brand:#2fbf71;--brand-fg:#06210f;--line:#2a323a}}
*{box-sizing:border-box}html{scroll-padding-top:env(safe-area-inset-top,0px)}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}
main{max-width:760px;margin:0 auto;padding:16px}
nav.crumbs{font-size:14px;color:var(--mut);margin:4px 0 12px}nav.crumbs a{color:var(--mut)}
h1{font-size:1.6rem;line-height:1.25;margin:.2em 0 .4em}h2{font-size:1.25rem;margin:1.6em 0 .5em}h3{font-size:1.05rem;margin:1em 0 .3em}
.lead{font-size:1.05rem;color:var(--mut)}
.price{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:16px 0}
.price b{font-size:1.3rem;color:var(--brand)}
.btn{display:inline-block;background:var(--brand);color:var(--brand-fg);padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:600;margin:6px 8px 6px 0}
.btn.alt{background:transparent;color:var(--brand);border:1px solid var(--brand)}
ul,ol{padding-left:1.2em}li{margin:.3em 0}
details{border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin:8px 0;background:var(--card)}summary{cursor:pointer;font-weight:600}
.grid{display:grid;gap:8px;grid-template-columns:1fr}.grid a{display:block;padding:10px 12px;border:1px solid var(--line);border-radius:10px;text-decoration:none;color:var(--fg)}
.grid small{display:block;color:var(--mut)}
.tbl{overflow-x:auto}footer{color:var(--mut);font-size:14px;margin:32px 0 8px;border-top:1px solid var(--line);padding-top:12px}a{color:var(--brand)}`;

function head({ title, desc, url, extra = '' }) {
  return `<!doctype html><html lang="en-KE"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}"><meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website"><meta property="og:locale" content="en_KE"><meta property="og:site_name" content="Stermont Arcade">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%9B%A0%3C/text%3E%3C/svg%3E">
<style>${CSS}</style>${extra}</head><body><main>`;
}
const foot = `<footer>Stermont Arcade, Sarit Centre, Westlands, Nairobi. WhatsApp <a href="${wa('Hello Stermont Arcade, I need a service quote.')}">+254 748 888 230</a>. Prices are estimates and are confirmed after inspection.</footer></main></body></html>`;

const business = {
  '@type': 'LocalBusiness', '@id': SITE + '/#business', name: 'Stermont Arcade', url: SITE + '/',
  telephone: '+254748888230', areaServed: [{ '@type': 'City', name: 'Nairobi' }, { '@type': 'Country', name: 'Kenya' }],
  address: { '@type': 'PostalAddress', streetAddress: 'Sarit Centre, Westlands', addressLocality: 'Nairobi', addressCountry: 'KE' }
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
      provider: business, areaServed: [{ '@type': 'City', name: 'Nairobi' }, { '@type': 'Country', name: 'Kenya' }],
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
<h2>Who we serve</h2><p>${esc(s.audience)}</p>
<h2>Where we work</h2><p>${esc(s.areas)}</p>
${s.guaranteeNote ? `<h2>Our promise</h2><p>${esc(s.guaranteeNote)}</p>` : ''}
<h2 id="faq">Frequently asked questions</h2>${s.faqs.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
${guide ? `<h2>Read the guide</h2><p><a href="/services/guides/${guide.slug}.html">${esc(guide.title)}</a></p>` : ''}
<p><a class="btn" href="${ask}">Book ${esc(s.name)}</a></p>
<h2>Other services</h2><div class="grid">${others.map(o => `<a href="/services/${o.slug}.html">${esc(o.name)}<small>${kes(o.priceMin)} to ${kes(o.priceMax)}${o.priceOpen ? '+' : ''}</small></a>`).join('')}</div>` + foot;
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
  h += `<nav class="crumbs"><a href="/">Home</a> / <a href="/services/guides/">Guides</a></nav>
<h1>${esc(g.title)}</h1>
<p class="lead"><b>Quick answer:</b> ${esc(g.answer)}</p>
${g.sections.map(x => `<h2>${esc(x.h)}</h2>${x.p.map(p => `<p>${esc(p)}</p>`).join('')}`).join('')}
<h2>Questions people ask</h2>${g.faqs.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
<div class="price"><div>Need this done?</div><b>${esc(s.name)}: ${kes(s.priceMin)} to ${kes(s.priceMax)}${s.priceOpen ? '+' : ''}</b></div>
<p><a class="btn" href="${ask}">Get a quote on WhatsApp</a><a class="btn alt" href="/services/${s.slug}.html">See the service page</a></p>` + foot;
  write(`guides/${g.slug}.html`, h);
}

{
  const url = `${SITE}/services/guides/`;
  let h = head({ title: 'Home Services Guides for Nairobi and Kenya | Stermont Arcade', desc: 'Plain-language guides on pest control, solar, CCTV, appliance repair, cleaning and more, with typical Kenyan prices.', url });
  h += `<nav class="crumbs"><a href="/">Home</a> / <a href="/services/">Services</a> / Guides</nav><h1>Service guides for Nairobi and Kenya</h1>
<p class="lead">Straight answers and typical prices before you book.</p><div class="grid">${data.guides.map(g => `<a href="/services/guides/${g.slug}.html">${esc(g.title)}<small>${esc(g.desc)}</small></a>`).join('')}</div>` + foot;
  write('guides/index.html', h);
}

const urls = ['/services/guides/', ...data.services.map(s => `/services/${s.slug}.html`), ...data.guides.map(g => `/services/guides/${g.slug}.html`)];
write('sitemap-services.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `<url><loc>${SITE}${u}</loc><lastmod>${data.published}</lastmod></url>`).join('\n')}\n</urlset>\n`);
console.log('wrote', out.length, 'files');
