// Renders hand-written product blog posts (400-600 words) into blog/<slug>.html, in the same page layout the blog writer uses
// (blog-write.mjs): quick-answer box, question headings, FAQPage + Article + BreadcrumbList JSON-LD, links to the product page,
// its category and related guides. Facts come only from the catalog text; no prices, doses or guarantees.
// Usage: node seo-pest/blog-build.mjs blogs-05      (writes blog/*.html and marks the topics "drafted" in blog-topics.json)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..');
const SITE = 'https://stermontarcade.co.ke';
export const DATE = '2026-10-30';
export const words = s => (String(s).match(/\S+/g) || []).length;
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const plain = s => String(s).replace(/\[\[\/[^|\]]+\|([^\]]+)\]\]/g, '$1').replace(/\[\[|\]\]/g, '');
const linksOf = s => [...String(s).matchAll(/\[\[(\/[^|\]]+)\|([^\]]+)\]\]/g)].map(m => m[1]);
// the page style is read from blog-write.mjs so these posts always match the generated ones
const CSS = (fs.readFileSync(path.join(root, 'blog-write.mjs'), 'utf8').match(/const CSS = '([^\n]*)';\n/) || [])[1];

export function allText(a) {
  return [a.title, a.answer, a.intro, a.closing, ...a.sections.flatMap(s => [s.heading, ...s.paragraphs, ...(s.bullets || [])]), ...a.faq.flatMap(([q, an]) => [q, an])].filter(Boolean).map(plain).join('\n');
}
export function closingLinks(a) { return [...new Set(linksOf([a.intro, a.closing, ...a.sections.flatMap(s => s.paragraphs)].join(' ')))]; }

export function renderPost(a) {
  const inline = s => esc(s).replace(/\[\[(\/[^|\]]+)\|([^\]]+)\]\]/g, (m, p, t) => `<a href="${p}">${t}</a>`);
  const para = s => `<p>${inline(s)}</p>`;
  const total = words(allText(a));
  const url = `${SITE}/blog/${a.slug}.html`;
  const ld = o => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>';
  const nice = new Date(DATE + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const section = s => `<h2>${esc(s.heading)}</h2>\n${s.paragraphs.map(para).join('\n')}${s.bullets && s.bullets.length ? `\n<ul>${s.bullets.map(b => `<li>${inline(b)}</li>`).join('')}</ul>` : ''}`;
  const faqHtml = `<h2>Frequently asked questions</h2>\n${a.faq.map(([q, an]) => `<h3>${esc(q)}</h3>\n<p>${esc(an)}</p>`).join('\n')}`;
  const catTitle = (() => { try { const m = fs.readFileSync(path.join(root, 'c', a.cat + '.html'), 'utf8').match(/<h1[^>]*>([^<]*)<\/h1>/i); return m ? m[1].trim() : 'Browse the category'; } catch { return 'Browse the category'; } })();
  const relTitle = r => { try { const m = fs.readFileSync(path.join(root, 'blog', r + '.html'), 'utf8').match(/<h1[^>]*>([\s\S]*?)<\/h1>/i); return m ? m[1].replace(/<[^>]+>/g, '').trim() : r; } catch { return r; } };
  const catHtml = `<div class="box"><strong>Shop this category</strong><ul class="rel"><li><a href="/c/${a.cat}.html">${esc(catTitle)}</a></li><li><a href="/p/${a.product}.html">See the product and its sizes</a></li></ul></div>`;
  const relHtml = a.related.length ? `<h2>Related guides</h2>\n<ul class="rel">${a.related.map(r => `<li><a href="/blog/${r}.html">${esc(relTitle(r))}</a></li>`).join('')}</ul>` : '';
  return `<!doctype html>
<html lang="en-KE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(a.title)} | Stermont Arcade</title><meta name="description" content="${esc(a.description)}">
<link rel="canonical" href="${url}"><meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="article"><meta property="og:site_name" content="Stermont Arcade"><meta property="og:locale" content="en_KE">
<meta property="og:title" content="${esc(a.title)}"><meta property="og:description" content="${esc(a.description)}"><meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/logo.png"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#7c3aed">
<style>${CSS}</style>
${ld({ '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.description, datePublished: DATE, dateModified: DATE, inLanguage: 'en-KE', author: { '@type': 'Organization', name: 'Stermont Arcade' }, publisher: { '@type': 'Organization', name: 'Stermont Arcade', logo: { '@type': 'ImageObject', url: `${SITE}/logo.png` } }, mainEntityOfPage: url })}
${ld({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: a.faq.map(([q, an]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: an } })) })}
${ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', `${SITE}/`], ['Buying guides', `${SITE}/blog/`], [a.title, url]].map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) })}
<script src="/analytics.js" defer></script></head><body>
<header><a href="${SITE}/">Stermont Arcade</a></header><main>
<nav class="bc"><a href="${SITE}/">Home</a> › <a href="/blog/">Buying guides</a> › ${esc(a.title)}</nav>
<h1>${esc(a.title)}</h1>
<p class="meta">Updated ${nice} · ${Math.max(2, Math.round(total / 200))} min read</p>
<div class="answer"><strong>Quick answer:</strong> ${esc(plain(a.answer))}</div>
${para(a.intro)}
${a.sections.map(section).join('\n')}
${faqHtml}
${a.closing ? para(a.closing) : ''}
${catHtml}
${relHtml}
<a class="btn" href="/products.html">Browse all products</a>
<div class="box"><a href="https://wa.me/254748888230?text=Hello%20Stermont%20Arcade">Questions? Chat with us on WhatsApp</a></div>
</main>
<footer>Stermont Arcade · Online store serving all of Kenya · Pay by M-Pesa · Delivery to all 47 counties · <a href="https://wa.me/254748888230">WhatsApp +254 748 888 230</a> · <a href="/shipping.html">Shipping</a> · <a href="/returns.html">Returns</a> · <a href="/privacy.html">Privacy</a></footer><script src="/analytics.js" defer></script></body></html>
`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const name = process.argv[2] || 'blogs-05';
  const posts = JSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), 'utf8'));
  const topicsFile = path.join(root, 'blog-topics.json');
  const data = JSON.parse(fs.readFileSync(topicsFile, 'utf8'));
  for (const a of posts) {
    fs.writeFileSync(path.join(root, 'blog', `${a.slug}.html`), renderPost(a));
    let t = data.topics.find(x => x.slug === a.slug);
    if (!t) { t = { slug: a.slug }; data.topics.push(t); }
    Object.assign(t, { title: a.title, angle: `Product guide for ${a.product} (hand-written, ${words(allText(a))} words).`, keywords: [], facts: ['Facts come from the catalog text of the product page.'], links: [`/p/${a.product}.html`, `/c/${a.cat}.html`, ...a.related.map(r => `/blog/${r}.html`)], status: 'drafted', drafted: DATE });
    console.log(`blog/${a.slug}.html  ${words(allText(a))} words`);
  }
  fs.writeFileSync(topicsFile, JSON.stringify(data, null, 2) + '\n');
}
