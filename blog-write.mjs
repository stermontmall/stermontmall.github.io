// Stermont Arcade - blog writer. Drafts ONE new post from the next ready "pending" topic.
// Strategy it follows (details in BLOG-STRATEGY.md):
//  - Hub and spoke: pillar guides (blog-pillars.json, 1,500-2,500 words) come first, then focused spoke posts (blog-topics.json, 800-1,200 words).
//    Every spoke links to its pillar page AND to product / category pages. A spoke waits until its pillar is live on the site.
//  - Every post gets local-intent wording (Kenya, Nairobi, M-Pesa, delivery), a "Safety and compliance" section, an FAQ with FAQPage schema,
//    Article schema and a buy / WhatsApp call to action.
//  - It never writes more than 2 posts a week (see the workflow) and pauses while 2 or more drafts are still waiting for review.
// The workflow (.github/workflows/blog-writer.yml) then opens a pull request, so a person reviews the draft
// before anything goes live. It never publishes by itself.
// Needs the repository secret ANTHROPIC_API_KEY. Node 18+, no installs.
import { readFileSync, writeFileSync, existsSync, readdirSync, appendFileSync } from 'node:fs';

const MODEL = process.env.BLOG_MODEL || 'claude-sonnet-5-5';
const KEY = process.env.ANTHROPIC_API_KEY;
const ONLY = (process.env.TOPIC_SLUG || '').trim();
const MAX_OPEN = Number(process.env.MAX_OPEN_DRAFTS || 2);
const TOPICS_FILE = 'blog-topics.json', PILLARS_FILE = 'blog-pillars.json';
const SITE = 'https://stermontarcade.co.ke';
const SHOP_FACT = 'Stermont Arcade has a shop at The Sarit Centre, Westlands, Nairobi.';
const out = (k, v) => { if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`); };
const stop = msg => { console.log(msg); out('written', 'false'); process.exit(0); };
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const words = s => (String(s).match(/\S+/g) || []).length;
const load = f => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {});
const nameOf = p => p.replace(/\.html$/, '').split('/').filter(Boolean).pop().split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
const plain = s => String(s).replace(/\[\[\/[^|\]]+\|([^\]]+)\]\]/g, '$1');

if (!KEY) stop('The ANTHROPIC_API_KEY secret is not set - nothing written.');
const topicsData = load(TOPICS_FILE), pillarData = load(PILLARS_FILE);
const pillars = pillarData.pillars || [], spokes = topicsData.topics || [], clusters = pillarData.clusters || [];
if (!pillars.length && !spokes.length) stop('No topics found - nothing to do.');

// Drafts that are still open pull requests (the workflow writes their slugs to open-drafts.txt).
const openDrafts = existsSync('open-drafts.txt') ? readFileSync('open-drafts.txt', 'utf8').split(/\s+/).filter(Boolean) : [];
if (!ONLY && openDrafts.length >= MAX_OPEN) stop(`${openDrafts.length} drafts are still waiting for review - not writing more until you merge or close some.`);

const isPillar = t => pillars.includes(t);
const pillarSlugOf = t => isPillar(t) ? '' : (t.pillar || (clusters.find(c => (t.links || []).some(l => (c.categories || []).includes(l))) || {}).pillar || '');
const live = slug => existsSync(`blog/${slug}.html`);
const ready = t => t.status === 'pending' && !openDrafts.includes(t.slug) && (!ONLY || t.slug === ONLY) && (isPillar(t) || !pillarSlugOf(t) || live(pillarSlugOf(t)));
const topic = [...pillars, ...spokes].find(ready);
if (!topic) stop(ONLY ? `Topic "${ONLY}" is not ready (not pending, already drafted, or its pillar guide is not live yet).` : 'Nothing ready to write: the remaining topics are waiting for a pillar guide to be reviewed and merged, or the list is empty.');
if (live(topic.slug)) { console.error(`blog/${topic.slug}.html already exists. Change the slug or mark the topic done.`); process.exit(1); }

// Pages the writer may link to: real product pages (not size-redirect pages), category pages, existing blog posts and a few fixed pages.
const allowed = new Set(['/products.html', '/c/', '/shipping.html', '/returns.html']);
const addDir = (dir, prefix, skipRedirects) => {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'index.html')) {
    if (skipRedirects && /http-equiv="refresh"/i.test(readFileSync(`${dir}/${f}`, 'utf8'))) continue;
    allowed.add(`${prefix}${f}`);
  }
};
addDir('p', '/p/', true); addDir('c', '/c/', false); addDir('blog', '/blog/', false);

const pillarSlug = pillarSlugOf(topic);
const pillarTopic = pillars.find(p => p.slug === pillarSlug);
const pillarTitle = pillarTopic ? pillarTopic.title : (pillarSlug ? nameOf(pillarSlug) : '');
const offered = [...new Set([pillarSlug ? `/blog/${pillarSlug}.html` : '', ...(topic.links || []), '/products.html', '/blog/how-to-order-and-pay-by-mpesa-online-kenya.html'])].filter(p => p && allowed.has(p));
const isProd = p => /^\/(p|c)\//.test(p) && p !== '/c/';
const facts = [...(topic.facts || []), SHOP_FACT];
const factsText = facts.join(' ');

const T = isPillar(topic)
  ? { kind: 'pillar', lo: 1500, hi: 2500, min: 1300, max: 3200, nSections: 7, sectionsText: 'at least 7', links: 8, tokens: 10000, minProd: 3 }
  : { kind: 'spoke', lo: 800, hi: 1200, min: 700, max: 1500, nSections: 4, sectionsText: 'at least 4', links: 5, tokens: 6000, minProd: 1 };
const needProd = Math.min(T.minProd, offered.filter(isProd).length);

const SYSTEM = `You write buying guides and how-to articles for Stermont Arcade, an online store in Kenya (pest control, agrovet, appliances and electronics) with a shop at The Sarit Centre, Westlands, Nairobi. Write plain, friendly English for Kenyan shoppers.
${T.kind === 'pillar' ? 'This is the main (pillar) guide of a topic cluster: cover the whole subject broadly and practically. More detailed guides are listed on the page automatically, so do not go deep on any one sub-topic.' : 'This is a focused guide that answers one specific question a Kenyan customer would search for. Stay on that question.'}
Rules:
- Use ONLY the facts supplied in the topic. Do not invent product specifications, ingredients, active ingredients, registration numbers, prices, discounts, stock claims, warranty terms or delivery times.
- Never give chemical dosages, mixing rates, dilution ratios, or animal or human medical dosing. Tell readers to follow the product label and to ask a vet, extension officer or other qualified professional.
- No hype or guarantees (no "best", "guaranteed", "100%", "cure"). Do not name competitors.
- Only include general advice that is widely accepted and safe. If you are unsure of something, leave it out.
- Do not mention AI or that the article was generated.
- Local intent: mention Kenya in the opening paragraph, and work in Nairobi, delivery across Kenya and paying by M-Pesa naturally where the supplied facts support it. Use the supplied keywords naturally; use any Swahili keyword phrase once, in a sentence that explains it.
- Include one section whose heading contains "Safety and compliance". In it tell readers to check the PCPB registration on the pack for pesticides, read the label, keep products away from children, pets, food and feed, and ask a licensed operator, vet or extension officer when unsure. State a specific PCPB number, warranty term or specification only if it appears in the supplied facts.
- Length: ${T.lo} to ${T.hi} words in total (not counting the FAQs), in short paragraphs, with ${T.sectionsText} sections.
- Link to store pages only with the exact markup [[/path|anchor text]], using only paths from the allowed list. Use at most ${T.links} links and none in headings. Link at least ${needProd} time(s) to a product or category page (paths starting /p/ or /c/) where it genuinely helps the reader.
- Write 3 to 5 FAQs: questions Kenyan shoppers really ask about this topic, each answer 25 to 70 words, no links, following all the rules above.
Reply with ONE JSON object and nothing else (no markdown fences):
{"title": "under 70 characters", "description": "meta description, 70 to 160 characters", "intro": "opening paragraph", "sections": [{"heading": "...", "paragraphs": ["..."]}], "closing": "short closing paragraph", "faqs": [{"q": "...", "a": "..."}]}`;

const BAD = [
  [/\b(guarantee[ds]?|100\s?%|cures?|cured)\b/i, 'contains a guarantee or cure claim'],
  [/\bAs an AI\b|\bgenerated by\b/i, 'mentions AI'],
  [/KSh\s?\d|\bKES\s?\d/i, 'contains a price'],
  [/\b\d+(?:\.\d+)?\s?(?:ml|g|kg|l|litres?|liters?)\s?(?:per|\/)\s?(?:litre|liter|l|kg|acre|hectare|tank|knapsack|bird|animal|water)\b/i, 'contains a dosage or mixing rate']
];
function check(a) {
  const p = [];
  if (!a || typeof a !== 'object') return ['not a JSON object'];
  if (typeof a.title !== 'string' || a.title.length < 20 || a.title.length > 70) p.push('title must be 20 to 70 characters');
  if (typeof a.description !== 'string' || a.description.length < 70 || a.description.length > 160) p.push('description must be 70 to 160 characters');
  if (typeof a.intro !== 'string' || !a.intro.trim()) p.push('missing intro');
  if (!Array.isArray(a.sections) || a.sections.length < T.nSections || a.sections.some(s => !s || typeof s.heading !== 'string' || !Array.isArray(s.paragraphs) || !s.paragraphs.length)) p.push(`needs ${T.sectionsText} sections with a heading and paragraphs`);
  if (!Array.isArray(a.faqs) || a.faqs.length < 3 || a.faqs.length > 5 || a.faqs.some(f => !f || typeof f.q !== 'string' || typeof f.a !== 'string' || !f.q.trim() || !f.a.trim())) p.push('needs 3 to 5 faqs, each with q and a');
  const secs = Array.isArray(a.sections) ? a.sections : [], faqs = Array.isArray(a.faqs) ? a.faqs : [];
  const body = [a.title, a.intro, a.closing, ...secs.flatMap(s => [s && s.heading, ...((s && s.paragraphs) || [])])].filter(x => typeof x === 'string');
  const all = [a.description, ...body, ...faqs.flatMap(f => [f && f.q, f && f.a])].filter(x => typeof x === 'string').join('\n');
  const wc = words(body.map(plain).join(' '));
  if (wc < T.min) p.push(`too short (${wc} words; aim for ${T.lo} to ${T.hi})`);
  if (wc > T.max) p.push(`too long (${wc} words; aim for ${T.lo} to ${T.hi})`);
  if (!secs.some(s => s && /safety and compliance/i.test(s.heading || ''))) p.push('missing a "Safety and compliance" section');
  if (!/kenya/i.test(a.intro || '')) p.push('the intro must mention Kenya');
  if (!/nairobi|47 counties|m-pesa|mpesa/i.test(all)) p.push('mention Nairobi, M-Pesa or delivery across Kenya');
  if (secs.some(s => s && /\[\[/.test(s.heading || ''))) p.push('no links in headings');
  if (faqs.some(f => f && /\[\[/.test(String(f.q) + String(f.a)))) p.push('no links in FAQs');
  const links = [...all.matchAll(/\[\[(\/[^|\]]+)\|/g)].map(m => m[1]);
  if (links.length > T.links) p.push(`too many links (max ${T.links})`);
  const unknown = links.filter(l => !allowed.has(l));
  if (unknown.length) p.push(`links outside the allowed list: ${unknown.join(', ')}`);
  if (new Set(links.filter(isProd)).size < needProd) p.push(`link to at least ${needProd} product or category page(s) from the allowed list`);
  for (const m of all.matchAll(/\bPCPB\s*(?:no\.?|reg\w*\.?)?\s*[:#]?\s*(\d[\d\/-]*)/gi)) if (!factsText.includes(m[1])) { p.push('contains a PCPB number that is not in the supplied facts'); break; }
  for (const [re, why] of BAD) if (re.test(all)) p.push(why);
  return p;
}

async function ask(extra) {
  const user = `Topic: ${topic.title}\nAngle: ${topic.angle || ''}\nKeywords to work in naturally: ${(topic.keywords || []).join(', ')}\nFacts you may use (nothing else about our products or shop):\n${facts.map(f => '- ' + f).join('\n')}\nAllowed link paths:\n${offered.map(p => '- ' + p).join('\n')}${pillarSlug && offered.includes(`/blog/${pillarSlug}.html`) ? `\nThis post belongs to the cluster guide "${pillarTitle}" at /blog/${pillarSlug}.html - link to it once, with natural anchor text.` : ''}${extra ? `\n\nYour previous attempt was rejected because: ${extra}. Fix this.` : ''}`;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: T.tokens, system: SYSTEM, messages: [{ role: 'user', content: user }] })
  });
  if (!res.ok) throw new Error(`Anthropic API error ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = await res.json();
  const text = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  try { return JSON.parse(text.slice(a, b + 1)); } catch { return null; }
}

let art = null, problems = [];
for (let i = 0; i < 2; i++) {
  art = await ask(problems.join('; '));
  problems = check(art);
  if (!problems.length) break;
  console.log(`Attempt ${i + 1} rejected: ${problems.join('; ')}`);
}
if (problems.length) { console.error('Could not produce a draft that passes the checks. Nothing written.'); process.exit(1); }

const para = s => '<p>' + esc(s).replace(/\[\[(\/[^|\]]+)\|([^\]]+)\]\]/g, (m, path, text) => allowed.has(path) ? `<a href="${path}">${text}</a>` : text).replace(/\[\[|\]\]/g, '') + '</p>';
const total = words([art.title, art.intro, art.closing, ...art.sections.flatMap(s => [s.heading, ...s.paragraphs])].filter(Boolean).map(plain).join(' '));
const now = new Date(), iso = now.toISOString().slice(0, 10);
const nice = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const url = `${SITE}/blog/${topic.slug}.html`;
const ld = o => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>';

// Call to action: the featured product (or its category) with M-Pesa, plus WhatsApp.
const prim = offered.find(p => p.startsWith('/p/')) || offered.find(isProd) || '/products.html';
const ctaLabel = prim.startsWith('/p/') ? 'Buy this product on Stermont Arcade' : prim.startsWith('/c/') ? `Shop ${nameOf(prim)} online` : 'Browse all products';
const waText = encodeURIComponent(`Hello Stermont Arcade, I read your guide "${art.title}" and would like to order or ask a question.`);

const CSS = '*{box-sizing:border-box}body{margin:0;font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1f1b2e;background:#faf9fd}a{color:#6d28d9}header{background:#7c3aed;color:#fff;padding:.8rem 1rem}header a{color:#fff;text-decoration:none;font-weight:800;font-size:1.15rem}main{max-width:760px;margin:0 auto;padding:1rem}nav.bc{font-size:.85rem;color:#6b6b80;margin:.3rem 0 1rem}h1{font-size:1.6rem;line-height:1.25;margin:.2rem 0 .6rem}h2{font-size:1.25rem;margin:1.6rem 0 .4rem}h3{font-size:1.05rem;margin:1.1rem 0 .2rem}.btn{display:block;text-align:center;background:#16a34a;color:#fff;text-decoration:none;font-weight:800;padding:.85rem;border-radius:12px;margin:1rem 0}.btn.wa{background:#25d366;color:#073b1d}.box{background:#fff;border:1px solid #e6e1f5;border-radius:14px;padding:.9rem 1rem;margin:1rem 0}.meta{color:#6b6b80;font-size:.85rem}footer{max-width:760px;margin:2rem auto;padding:1rem;color:#6b6b80;font-size:.85rem;border-top:1px solid #e6e1f5}';
const faqHtml = `<!--FAQ-START-->\n<section id="faq"><h2>Frequently asked questions</h2>\n${art.faqs.map(f => `<h3>${esc(plain(f.q))}</h3>\n<p>${esc(plain(f.a))}</p>`).join('\n')}\n</section>\n<!--FAQ-END-->`;
const html = `<!doctype html>
<html lang="en-KE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(art.title)} | Stermont Arcade</title><meta name="description" content="${esc(art.description)}">
<link rel="canonical" href="${url}"><meta name="robots" content="index, follow, max-image-preview:large">
${pillarSlug ? `<meta name="cluster-pillar" content="${esc(pillarSlug)}">\n` : ''}<meta property="og:type" content="article"><meta property="og:site_name" content="Stermont Arcade"><meta property="og:locale" content="en_KE">
<meta property="og:title" content="${esc(art.title)}"><meta property="og:description" content="${esc(art.description)}"><meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/logo.png"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#7c3aed">
<style>${CSS}</style>
${ld({ '@context': 'https://schema.org', '@type': 'Article', headline: art.title, description: art.description, datePublished: iso, dateModified: iso, inLanguage: 'en-KE', author: { '@type': 'Organization', name: 'Stermont Arcade' }, publisher: { '@type': 'Organization', name: 'Stermont Arcade', logo: { '@type': 'ImageObject', url: `${SITE}/logo.png` } }, mainEntityOfPage: url, image: `${SITE}/logo.png` })}
${ld({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: art.faqs.map(f => ({ '@type': 'Question', name: plain(f.q), acceptedAnswer: { '@type': 'Answer', text: plain(f.a) } })) })}
${ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', `${SITE}/`], ['Buying guides', `${SITE}/blog/`], [art.title, url]].map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) })}
<script src="/analytics.js" defer></script></head><body>
<header><a href="${SITE}/">Stermont Arcade</a></header><main>
<nav class="bc"><a href="${SITE}/">Home</a> › <a href="/blog/">Buying guides</a> › ${esc(art.title)}</nav>
<h1>${esc(art.title)}</h1>
<p class="meta">Updated ${nice} · ${Math.max(2, Math.round(total / 200))} min read</p>
${para(art.intro)}
${pillarSlug ? `<div class="box">Part of our guide: <a href="/blog/${pillarSlug}.html">${esc(pillarTitle)}</a></div>\n` : ''}${art.sections.map(s => `<h2>${esc(s.heading)}</h2>\n${s.paragraphs.map(para).join('\n')}`).join('\n')}
${art.closing ? para(art.closing) : ''}
${T.kind === 'pillar' ? '<!--CLUSTER-START-->\n<!--CLUSTER-END-->\n' : ''}${faqHtml}
<a class="btn" href="${prim}">${esc(ctaLabel)} · pay by M-Pesa</a>
<a class="btn wa" href="https://wa.me/254748888230?text=${waText}">Order or ask a question on WhatsApp</a>
</main>
<footer>Stermont Arcade · Online store serving all of Kenya · Pay by M-Pesa · Delivery to all 47 counties · <a href="https://wa.me/254748888230">WhatsApp +254 748 888 230</a> · <a href="/shipping.html">Shipping</a> · <a href="/returns.html">Returns</a> · <a href="/privacy.html">Privacy</a></footer><script src="/analytics.js" defer></script></body></html>
`;
writeFileSync(`blog/${topic.slug}.html`, html);
topic.status = 'drafted'; topic.drafted = iso;
writeFileSync(isPillar(topic) ? PILLARS_FILE : TOPICS_FILE, JSON.stringify(isPillar(topic) ? pillarData : topicsData, null, 2) + '\n');
console.log(`Wrote blog/${topic.slug}.html (${T.kind}, ${total} words${pillarSlug ? `, cluster: ${pillarSlug}` : ''}).`);
out('written', 'true'); out('slug', topic.slug); out('title', art.title.replace(/[\r\n]/g, ' ')); out('kind', T.kind);
