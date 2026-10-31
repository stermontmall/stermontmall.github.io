// Stermont Arcade - Services pages generator.
// node services-build.mjs           -> writes services/<slug>.html for every service in services-data.json
// node services-build.mjs --check   -> same, then checks every page (exit 1 on a violation)
// Never edit services/<slug>.html by hand: edit services-data.json or this file, then rebuild.
// Facts come only from services-data.json (owner's PDF). Shop and guide links are added only when the target file exists.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const D = JSON.parse(readFileSync('services-data.json', 'utf8'));
const B = D.business, SITE = B.site;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const unesc = s => String(s ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const ksh = n => 'KSh ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const byslug = Object.fromEntries(D.services.map(s => [s.slug, s]));
const catName = slug => { try { const m = readFileSync(`c/${slug}.html`, 'utf8').match(/<h1>([\s\S]*?)<\/h1>/); return m ? unesc(m[1].replace(/<[^>]+>/g, '').trim()).replace(/\s+in Kenya$/i, '') : slug; } catch { return slug; } };
const blogTitle = slug => { try { const m = readFileSync(`blog/${slug}.html`, 'utf8').match(/<h1>([\s\S]*?)<\/h1>/); return m ? unesc(m[1].replace(/<[^>]+>/g, '').trim()) : slug; } catch { return slug; } };

export const priceText = s => s.priceOpen ? `from ${ksh(s.priceFrom)}, larger jobs cost more` : `${ksh(s.priceFrom)} to ${ksh(s.priceTo)}`;
export const waLink = text => `https://wa.me/${B.wa}?text=${encodeURIComponent(text)}`;

const CSS = ':root{--bg:#fff;--fg:#1c1b22;--mut:#5d5a6b;--card:#f6f2ff;--line:#e6e1f5;--acc:#5b21b6;--btn:#5b21b6;--btnfg:#fff}@media (prefers-color-scheme:dark){:root{--bg:#14121b;--fg:#ece9f6;--mut:#a9a4bd;--card:#1e1a2b;--line:#2f2942;--acc:#c4b0ff;--btn:#8b5cf6;--btnfg:#fff}}' +
  '*{box-sizing:border-box}body{margin:0;font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--fg);padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}' +
  'a{color:var(--acc)}header.top{display:flex;gap:.8rem;align-items:center;justify-content:space-between;padding:.7rem 1rem;border-bottom:1px solid var(--line);flex-wrap:wrap}header.top a{font-weight:700;text-decoration:none}' +
  'main{max-width:820px;margin:0 auto;padding:1rem}h1{font-size:1.65rem;line-height:1.25;margin:.4rem 0 .6rem}h2{font-size:1.2rem;margin:0 0 .5rem;color:var(--acc)}h3{font-size:1rem;margin:.8rem 0 .2rem}' +
  '.bc{font-size:.85rem;color:var(--mut)}.lead{font-size:1.05rem}.box{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:1rem;margin:1rem 0}' +
  '.cta{display:flex;gap:.6rem;flex-wrap:wrap;margin:1rem 0}.btn{display:inline-block;background:var(--btn);color:var(--btnfg);padding:.7rem 1.1rem;border-radius:10px;text-decoration:none;font-weight:600}.btn.alt{background:transparent;color:var(--acc);border:1px solid var(--acc)}' +
  'ul,ol{padding-left:1.2rem}li{margin:.3rem 0}footer{max-width:820px;margin:0 auto;padding:1rem;color:var(--mut);font-size:.9rem;border-top:1px solid var(--line)}';

export function render(s) {
  const url = `${SITE}/services/${s.slug}.html`;
  const book = waLink(`Hello Stermont Arcade, I would like to book ${s.name}. My location is: `);
  const quote = waLink(`Hello Stermont Arcade, please send me a quote for ${s.name}. My location is: `);
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Service', name: s.name, serviceType: s.name, description: s.metaDesc, url,
      provider: { '@type': 'LocalBusiness', name: B.name, url: SITE, telephone: B.phone, address: { '@type': 'PostalAddress', streetAddress: 'The Sarit Centre, Karuna Road', addressLocality: 'Westlands, Nairobi', addressCountry: 'KE' } },
      areaServed: [{ '@type': 'City', name: 'Nairobi' }, { '@type': 'Country', name: 'Kenya' }],
      offers: { '@type': 'Offer', priceCurrency: 'KES', priceSpecification: { '@type': 'PriceSpecification', priceCurrency: 'KES', minPrice: s.priceFrom, ...(s.priceOpen ? {} : { maxPrice: s.priceTo }) }, url } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', SITE + '/'], ['Services', SITE + '/services/'], [s.name, url]].map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: u })) },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: s.faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
  ].map(o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n');
  const shop = (s.shop || []).filter(k => existsSync(`c/${k}.html`)).map(k => `<li><a href="/c/${k}.html">Shop ${esc(catName(k))}</a></li>`);
  const guides = (s.guides || []).filter(g => existsSync(`blog/${g}.html`)).map(g => `<li><a href="/blog/${g}.html">${esc(blogTitle(g))}</a></li>`);
  const rel = (s.related || []).filter(r => byslug[r]).map(r => `<li><a href="/services/${r}.html">${esc(byslug[r].name)}</a>: ${esc(priceText(byslug[r]))}</li>`);
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(s.metaTitle)}</title>
<meta name="description" content="${esc(s.metaDesc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="#5b21b6">
<meta property="og:type" content="website"><meta property="og:site_name" content="${esc(B.name)}"><meta property="og:title" content="${esc(s.metaTitle)}"><meta property="og:description" content="${esc(s.metaDesc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/logo.png">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${esc(s.metaTitle)}"><meta name="twitter:description" content="${esc(s.metaDesc)}">
<link rel="icon" href="/favicon.png">
${ld}
<style>${CSS}</style></head><body>
<header class="top"><a href="/">${esc(B.name)}</a><nav><a href="/services/">All services</a> &middot; <a href="/products.html">Shop</a></nav></header>
<main>
<nav class="bc"><a href="/">Home</a> › <a href="/services/">Services</a> › ${esc(s.name)}</nav>
<h1>${esc(s.h1)}</h1>
<p class="lead">${esc(s.lead)}</p>
<div class="cta"><a class="btn" href="${esc(book)}" rel="noopener">Book on WhatsApp</a><a class="btn alt" href="tel:+${B.wa}">Call ${esc(B.phone)}</a></div>
<div class="box"><h2>Price guide</h2><p><b>${esc(priceText(s))}</b> for ${esc(s.audience.toLowerCase())}. This is a typical range. The final price depends on the job and we confirm it before work starts. <a href="${esc(quote)}" rel="noopener">Ask for a quote</a>.</p></div>
<h2>What is included</h2>
<ul>${s.includes.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
<h2>How it works</h2>
<ol>${s.process.map(([t, d]) => `<li><b>${esc(t)}.</b> ${esc(d)}</li>`).join('')}</ol>
<h2>What affects the price</h2>
<ul>${s.factors.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
<h2>Where we work</h2>
<p>${esc(s.areas)}</p>
<h2>Frequently asked questions</h2>
${s.faqs.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('\n')}
<div class="box"><h2>Ready to book?</h2><p>Message us with your location and what you need, and we reply with the next steps.</p><div class="cta"><a class="btn" href="${esc(book)}" rel="noopener">Book on WhatsApp</a><a class="btn alt" href="tel:+${B.wa}">Call ${esc(B.phone)}</a></div></div>
${rel.length ? `<h2>Related services</h2><ul>${rel.join('')}</ul>` : ''}
${shop.length ? `<h2>Shop related products</h2><ul>${shop.join('')}</ul>` : ''}
${guides.length ? `<h2>Helpful guides</h2><ul>${guides.join('')}</ul>` : ''}
</main>
<footer><p><b>${esc(B.name)}</b>, ${esc(B.address)}. ${esc(B.hours)}. Phone and WhatsApp <a href="tel:+${B.wa}">${esc(B.phone)}</a>.</p></footer>
</body></html>
`;
}

export const words = h => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').split(/\s+/).filter(Boolean).length;

if (process.argv[1] && process.argv[1].endsWith('services-build.mjs')) {
  const bad = []; let checks = 0;
  const ok = (c, m) => { checks++; if (!c) bad.push(m); };
  for (const s of D.services) {
    const h = render(s); writeFileSync(`services/${s.slug}.html`, h);
    if (!process.argv.includes('--check')) continue;
    const id = s.slug, w = words(h);
    ok(s.metaTitle.length >= 30 && s.metaTitle.length <= 65, `${id}: title length ${s.metaTitle.length}`);
    ok(s.metaDesc.length >= 100 && s.metaDesc.length <= 160, `${id}: description length ${s.metaDesc.length}`);
    ok(w >= 350, `${id}: only ${w} words on the page (want 350+)`);
    ok(s.faqs.length >= 4, `${id}: needs 4+ FAQs`);
    ok((h.match(/<h1>/g) || []).length === 1, `${id}: needs exactly one h1`);
    ok(h.includes(`<link rel="canonical" href="${SITE}/services/${s.slug}.html">`), `${id}: canonical`);
    for (const m of h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) { try { JSON.parse(m[1].replace(/\\u003c/g, '<')); ok(true); } catch { ok(false, `${id}: invalid JSON-LD`); } }
    for (const r of s.related || []) ok(!!byslug[r], `${id}: unknown related service ${r}`);
    for (const m of h.matchAll(/href="(\/[^"#?]*)"/g)) { const p = m[1]; if (p === '/' || p === '/services/' || p === '/products.html') continue; ok(existsSync(p.slice(1)), `${id}: broken link ${p}`); }
    const txt = h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ');
    for (const re of [/\bbest\b/i, /\bcertified\b/i, /100\s?%/, /\bguaranteed\b/i, /\bnon-toxic\b/i, /#1/, /\bAs an AI\b/i]) ok(!re.test(txt), `${id}: banned phrase ${re}`);
    if (s.slug !== 'pest-control-fumigation-nairobi') ok(!/guarantee/i.test(txt), `${id}: guarantee wording only allowed on the pest control page (owner-confirmed offer)`);
    console.log(`${id}: ${w} words`);
  }
  console.log(`services-build: ${D.services.length} pages written` + (process.argv.includes('--check') ? `, ${checks} checks, ${bad.length} violations` : ''));
  bad.forEach(b => console.log(' -', b));
  if (bad.length) process.exit(1);
}
