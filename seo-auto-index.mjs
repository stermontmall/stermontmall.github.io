// Stermont Arcade - seo-auto-index
// 1) Standardizes HTML meta tags and JSON-LD schema on the hand-written pages (idempotent: only adds what is missing).
// 2) Submits every indexable URL in the sitemaps to IndexNow (Bing, Yandex and others).
//
// Usage (Node 18+, no installs):
//   node seo-auto-index.mjs            fix the pages in place
//   node seo-auto-index.mjs --check    report what would change, exit 1 if anything is missing (no writes)
//   node seo-auto-index.mjs --submit   fix pages, then submit all sitemap URLs to IndexNow
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const SITE = 'https://stermontarcade.co.ke';
const IMAGE = `${SITE}/logo.png`;
const KEY = '8f12b16c2962614f0cce8ada60431436';
const args = new Set(process.argv.slice(2));
const CHECK = args.has('--check');

// Generated pages (p/, c/, blog/, products.html) are owned by their own build scripts and already complete.
const PAGES = readdirSync('.').filter(f => f.endsWith('.html') && !/^(admin|upload-photos|google|index\.html|products\.html)/.test(f));
const TITLES = { 'about.html': 'About', 'contact.html': 'Contact', 'faq.html': 'FAQ', 'privacy.html': 'Privacy', 'returns.html': 'Returns', 'shipping.html': 'Shipping', 'terms.html': 'Terms' };

const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const unesc = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
const has = (h, re) => re.test(h);
const metaContent = (h, attr, name) => {
  const m = h.match(new RegExp(`<meta ${attr}=["']${name}["'] content=(?:"([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[1] ?? m[2]) : '';
};

let problems = 0;
for (const file of PAGES) {
  let h = readFileSync(file, 'utf8');
  const before = h;
  const notes = [];
  const robots = metaContent(h, 'name', 'robots');
  const indexable = !/noindex/i.test(robots);
  const title = unesc((h.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '').trim();
  const desc = unesc(metaContent(h, 'name', 'description'));
  const url = `${SITE}/${file}`;
  const insert = (tag, why) => { h = h.replace(/<\/head>/i, `${tag}\n</head>`); notes.push(why); };

  // Duplicate robots tags confuse crawlers: keep the strictest (first noindex) one.
  const robotsTags = h.match(/<meta name=["']robots["'][^>]*>/gi) || [];
  if (robotsTags.length > 1) {
    const keep = robotsTags.find(t => /noindex/i.test(t)) || robotsTags[0];
    let kept = false;
    h = h.replace(/[ \t]*<meta name=["']robots["'][^>]*>\n?/gi, t => (!kept && t.includes(keep.trim()) ? ((kept = true), t) : ''));
    notes.push('removed duplicate robots meta');
  }

  if (!has(h, /<meta name=["']description["']/i) && title) {
    const fixed = {
      '404.html': 'The page you are looking for does not exist. Browse Stermont Arcade for pest control, agrovet supplies and electronics in Kenya.',
      'account.html': 'Sign in to your Stermont Arcade account to see your orders and saved details.',
    };
    const d = fixed[file] || `${title} - Stermont Arcade, online shopping in Kenya with M-Pesa payment and delivery to all 47 counties.`;
    insert(`<meta name="description" content="${esc(d)}">`, 'added meta description');
  }

  if (indexable) {
    const d = unesc(metaContent(h, 'name', 'description')) || desc;
    if (!has(h, /rel=["']canonical["']/i)) insert(`<link rel="canonical" href="${url}">`, 'added canonical');
    if (!has(h, /property=["']og:title["']/i)) insert(`<meta property="og:title" content="${esc(title)}">`, 'added og:title');
    if (!has(h, /property=["']og:description["']/i) && d) insert(`<meta property="og:description" content="${esc(d)}">`, 'added og:description');
    if (!has(h, /property=["']og:url["']/i)) insert(`<meta property="og:url" content="${url}">`, 'added og:url');
    if (!has(h, /property=["']og:image["']/i)) insert(`<meta property="og:image" content="${IMAGE}">`, 'added og:image');
    if (!has(h, /property=["']og:image:alt["']/i)) insert(`<meta property="og:image:alt" content="Stermont Arcade logo">`, 'added og:image:alt');
    if (!has(h, /property=["']og:type["']/i)) insert(`<meta property="og:type" content="website">`, 'added og:type');
    if (!has(h, /property=["']og:site_name["']/i)) insert(`<meta property="og:site_name" content="Stermont Arcade">`, 'added og:site_name');
    if (!has(h, /property=["']og:locale["']/i)) insert(`<meta property="og:locale" content="en_KE">`, 'added og:locale');
    if (!has(h, /name=["']twitter:card["']/i)) {
      insert(`<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="${esc(unesc(metaContent(h, 'property', 'og:title')) || title)}">\n<meta name="twitter:description" content="${esc(unesc(metaContent(h, 'property', 'og:description')) || d)}">\n<meta name="twitter:image" content="${IMAGE}">`, 'added Twitter card');
    }
    // JSON-LD: pages with no structured data get WebPage + BreadcrumbList.
    if (!has(h, /application\/ld\+json/i)) {
      const crumbs = [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` }, { '@type': 'ListItem', position: 2, name: TITLES[file] || title.split('|')[0].trim(), item: url }];
      const ld = { '@context': 'https://schema.org', '@graph': [
        { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: title, description: d, inLanguage: 'en-KE', isPartOf: { '@type': 'WebSite', name: 'Stermont Arcade', url: `${SITE}/` }, breadcrumb: { '@id': `${url}#breadcrumb` } },
        { '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: crumbs },
      ] };
      insert(`<script type="application/ld+json">${JSON.stringify(ld)}</script>`, 'added WebPage + BreadcrumbList schema');
    }
  } else if (!/noindex/i.test(robots) && !robots) {
    insert('<meta name="robots" content="noindex">', 'added robots noindex');
  }

  // Every existing JSON-LD block must parse.
  for (const m of h.matchAll(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(m[1]); } catch { notes.push('BROKEN JSON-LD (fix by hand)'); problems++; }
  }

  if (notes.length) {
    console.log(`${file}: ${notes.join('; ')}`);
    if (h !== before) { problems += notes.filter(n => !n.startsWith('BROKEN')).length; if (!CHECK) writeFileSync(file, h); }
  }
}
// ---- Tracking: every public page loads /analytics.js (GA4 + Core Web Vitals). Generators add it too; this heals any gap. ----
const TRACK = '<script src="/analytics.js" defer></script>';
const dirHtml = d => (existsSync(d) ? readdirSync(d).filter(f => f.endsWith('.html')).map(f => `${d}/${f}`) : []);
const ALL = [...readdirSync('.').filter(f => f.endsWith('.html') && !/^(admin|upload-photos|google)/.test(f)), ...dirHtml('p'), ...dirHtml('c'), ...dirHtml('blog')];
let tracked = 0;
for (const f of ALL) {
  const h = readFileSync(f, 'utf8');
  if (/analytics\.js/.test(h) || /http-equiv=["']refresh["']/i.test(h) || !/<\/body>/i.test(h)) continue;   // redirect pages need no tracking
  tracked++;
  if (!CHECK) writeFileSync(f, h.replace(/<\/body>/i, `${TRACK}</body>`));
}
if (tracked) { console.log(`analytics.js ${CHECK ? 'missing on' : 'added to'} ${tracked} page(s)`); problems += tracked; }

console.log(problems ? (CHECK ? `\n${problems} issue(s) found.` : '\nPages updated.') : 'All pages already standardized.');

// ---- IndexNow submission ----
if (args.has('--submit') && !CHECK) {
  const urls = new Set();
  for (const sm of ['sitemap.xml', 'sitemap-products.xml']) if (existsSync(sm))
    for (const m of readFileSync(sm, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) urls.add(m[1]);
  const list = [...urls].slice(0, 9000);
  const body = { host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: list };
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });
    console.log(`IndexNow: HTTP ${res.status} for ${list.length} URLs`);
  } catch (e) { console.log('IndexNow submit failed (not critical):', e.message); }
}
process.exit(CHECK && problems ? 1 : 0);
