// Stermont Arcade - blog writer. Drafts ONE new blog post from the next "pending" topic in blog-topics.json.
// The workflow (.github/workflows/blog-writer.yml) then opens a pull request, so a person reviews the draft
// before anything goes live. It never publishes by itself.
// Needs ONE repository secret: GEMINI_API_KEY (free, from aistudio.google.com/apikey) or ANTHROPIC_API_KEY (paid). Node 18+, no installs.
//
// Each draft is written for search intent: a direct answer box first, question-style headings, a comparison table,
// an FAQ (with FAQPage structured data), links to the right shop categories and related guides.
import { readFileSync, writeFileSync, existsSync, readdirSync, appendFileSync } from 'node:fs';

const MODEL = process.env.BLOG_MODEL || 'claude-sonnet-5-5';
// FREE option: a Google Gemini API key (https://aistudio.google.com/apikey, no card needed) works instead of an Anthropic key.
// Models are tried in order; if one is unavailable or its free quota is used up, the next one is used.
const GKEY = process.env.GEMINI_API_KEY;
const GEMINI_MODELS = (process.env.GEMINI_MODEL || 'gemini-3.8-flash,gemini-3.6-flash,gemini-3.5-flash-lite,gemini-3.1-flash-lite').split(',').map(s => s.trim()).filter(Boolean);
const KEY = process.env.ANTHROPIC_API_KEY;
const ONLY = (process.env.TOPIC_SLUG || '').trim();
const TOPICS_FILE = 'blog-topics.json';
const SITE = 'https://stermontarcade.co.ke';
const out = (k, v) => { if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`); };
let data = null, dirty = false;
const save = () => { if (data && dirty) writeFileSync(TOPICS_FILE, JSON.stringify(data, null, 2) + '\n'); };
const stop = msg => { save(); console.log(msg); out('written', 'false'); process.exit(0); };
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const unesc = s => String(s).replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const words = s => (String(s).match(/\S+/g) || []).length;
const STOP = new Set(['kenya', 'how', 'to', 'in', 'a', 'an', 'the', 'and', 'or', 'of', 'for', 'your', 'you', 'at', 'on', 'is', 'are', 'what', 'why', 'with', 'home', 'guide', 'buying', 'buy', 'online', 'tips', 'basics']);
const tokens = s => new Set(String(s).toLowerCase().replace(/\.html$/, '').split(/[^a-z0-9]+/).map(w => w.replace(/s$/, '')).filter(w => w && !STOP.has(w)));
const jaccard = (a, b) => { let i = 0; for (const x of a) if (b.has(x)) i++; const u = a.size + b.size - i; return u ? i / u : 0; };
const titleOf = f => { try { const m = readFileSync(f, 'utf8').match(/<title>([^<]*)<\/title>/i); return m ? unesc(m[1]).replace(/\s*[|\u2013-]\s*Stermont Arcade.*$/i, '').trim() : ''; } catch { return ''; } };

if (!KEY && !GKEY) { console.error('No API key: add the repository secret GEMINI_API_KEY (free) or ANTHROPIC_API_KEY. Nothing written.'); out('written', 'false'); process.exit(1); }
if (!existsSync(TOPICS_FILE)) stop('No blog-topics.json - nothing to do.');
data = JSON.parse(readFileSync(TOPICS_FILE, 'utf8'));

// Existing blog posts (used to avoid duplicates and to suggest related guides).
const posts = existsSync('blog')
  ? readdirSync('blog').filter(f => f.endsWith('.html') && f !== 'index.html').map(f => ({ slug: f.replace(/\.html$/, ''), path: `/blog/${f}`, title: titleOf(`blog/${f}`) || f, tok: tokens(f) }))
  : [];

// Duplicate-topic fix: a pending topic whose post already exists is marked done, and a topic that is almost the
// same as an existing post (very similar slug) is marked "duplicate" instead of being drafted twice.
for (const t of data.topics) {
  if (t.status !== 'pending') continue;
  if (existsSync(`blog/${t.slug}.html`)) { t.status = 'drafted'; t.note = 'post already exists'; dirty = true; continue; }
  if (!ONLY && posts.some(p => jaccard(tokens(t.slug), p.tok) >= 0.6)) { t.status = 'duplicate'; t.note = 'too similar to an existing post'; dirty = true; }
}

// Pick the next topic, rotating between shop categories so consecutive posts are not all about one product group.
const catOf = t => (t.links || []).find(l => /^\/c\//.test(l)) || '';
const pool = data.topics.filter(t => t.status === 'pending' && (!ONLY || t.slug === ONLY));
const last = data.topics.filter(t => t.status === 'drafted' && t.drafted).sort((a, b) => String(b.drafted).localeCompare(String(a.drafted)))[0];
const topic = ONLY ? pool[0] : (pool.find(t => !last || catOf(t) !== catOf(last)) || pool[0]);
if (!topic) stop(ONLY ? `Topic "${ONLY}" is not pending.` : 'No pending topics left in blog-topics.json.');
if (existsSync(`blog/${topic.slug}.html`)) { console.error(`blog/${topic.slug}.html already exists.`); process.exit(1); }

// Pages the writer may link to. Category pages (/c/<name>.html) are included, which fixes the dropped category links.
const allowed = new Set(['/products.html', '/c/', '/shipping.html', '/returns.html']);
if (existsSync('c')) for (const f of readdirSync('c').filter(f => f.endsWith('.html') && f !== 'index.html')) allowed.add(`/c/${f}`);
if (existsSync('p')) for (const f of readdirSync('p').filter(f => f.endsWith('.html')))
  if (!/http-equiv="refresh"/i.test(readFileSync(`p/${f}`, 'utf8'))) allowed.add(`/p/${f}`);
for (const p of posts) allowed.add(p.path);

const tt = tokens([topic.slug, ...(topic.keywords || [])].join(' '));
const related = posts.map(p => ({ ...p, score: jaccard(tt, p.tok) })).filter(p => p.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
const cats = [...new Set((topic.links || []).filter(l => /^\/c\//.test(l) && allowed.has(l)))].slice(0, 3);
const offered = [...new Set([...(topic.links || []), ...cats, ...related.map(r => r.path), '/products.html', '/blog/how-to-order-and-pay-by-mpesa-online-kenya.html'])].filter(p => allowed.has(p));

const SYSTEM = `You write buying guides and how-to articles for Stermont Arcade, an online store in Kenya (pest control, agrovet, appliances and electronics). Write plain, friendly English for Kenyan shoppers. The article must answer what a person typing the topic into Google actually wants to know, quickly and clearly.
Rules:
- Use ONLY the facts supplied in the topic about our store and products. Do not invent product specifications, ingredients, active ingredients, registration numbers, prices, discounts, stock claims, warranty terms or delivery times.
- Never give chemical dosages, mixing rates, dilution ratios, or animal or human medical dosing. Tell readers to follow the product label and to ask a vet, extension officer or other qualified professional.
- No hype or guarantees (no "best", "guaranteed", "100%", "cure"). Do not name competitors.
- Only include general advice that is widely accepted and safe. If you are unsure of something, leave it out.
- Do not mention AI or that the article was generated.
- Do not repeat the existing articles listed in the request. Give a different angle and refer to them instead.
- 900 to 1200 words in total, in short paragraphs.
- Link to store pages only with the exact markup [[/path|anchor text]], using only paths from the allowed list. Use at most 4 links in the body and none in headings, the answer, the table or the FAQ.
Structure (all parts required):
- "answer": a direct answer to the main search question in 30 to 60 words, shown in a box at the top.
- "intro": a short opening paragraph.
- "sections": at least 4, and at least 3 of the headings must be written as questions people search (for example "How do I tell...?", "Which is better for...?").
- "table": a simple comparison or checklist table with 2 to 4 columns and 3 to 6 rows (options compared, signs and meaning, or what to check). No prices and no brand or product claims.
- "faq": 4 to 6 questions with plain-text answers of 25 to 70 words each.
Reply with ONE JSON object and nothing else (no markdown fences):
{"title": "under 70 characters", "description": "meta description, 70 to 160 characters", "answer": "...", "intro": "...", "sections": [{"heading": "...", "paragraphs": ["..."], "bullets": ["optional short list items"]}], "table": {"caption": "...", "headers": ["..."], "rows": [["..."]]}, "faq": [{"q": "...", "a": "..."}], "closing": "short closing paragraph"}`;

const BAD = [
  [/\b(guarantee[ds]?|100\s?%|cures?|cured)\b/i, 'contains a guarantee or cure claim'],
  [/\bAs an AI\b|\bgenerated by\b/i, 'mentions AI'],
  [/KSh\s?\d|\bKES\s?\d/i, 'contains a price'],
  [/\bPCPB\s*(?:no\.?|reg\w*\.?)?\s*[:#]?\s*\d/i, 'contains a registration number'],
  [/\b\d+(?:\.\d+)?\s?(?:ml|g|kg|l|litres?|liters?)\s?(?:per|\/)\s?(?:litre|liter|l|kg|acre|hectare|tank|knapsack|bird|animal|water)\b/i, 'contains a dosage or mixing rate']
];
const str = x => typeof x === 'string' && x.trim().length > 0;
function check(a) {
  const p = [];
  if (!a || typeof a !== 'object') return ['not a JSON object'];
  if (!str(a.title) || a.title.length < 20 || a.title.length > 70) p.push('title must be 20 to 70 characters');
  if (!str(a.description) || a.description.length < 70 || a.description.length > 160) p.push('description must be 70 to 160 characters');
  if (!str(a.answer) || words(a.answer) < 25 || words(a.answer) > 70) p.push('answer must be 30 to 60 words');
  if (!str(a.intro)) p.push('missing intro');
  if (!Array.isArray(a.sections) || a.sections.length < 4 || a.sections.some(s => !s || !str(s.heading) || !Array.isArray(s.paragraphs) || !s.paragraphs.length)) p.push('needs at least 4 sections with a heading and paragraphs');
  else if (a.sections.filter(s => /\?\s*$/.test(s.heading.trim())).length < 3) p.push('at least 3 section headings must be questions ending in ?');
  const t = a.table;
  if (!t || !Array.isArray(t.headers) || t.headers.length < 2 || t.headers.length > 4 || !Array.isArray(t.rows) || t.rows.length < 3 || t.rows.length > 6 || t.rows.some(r => !Array.isArray(r) || r.length !== t.headers.length || r.some(c => !str(c)))) p.push('table needs 2 to 4 headers and 3 to 6 full rows');
  if (!Array.isArray(a.faq) || a.faq.length < 4 || a.faq.length > 6 || a.faq.some(f => !f || !str(f.q) || !str(f.a))) p.push('faq needs 4 to 6 questions with answers');
  const all = [a.title, a.description, a.answer, a.intro, a.closing,
    ...(a.sections || []).flatMap(s => [s.heading, ...(s.paragraphs || []), ...(s.bullets || [])]),
    ...(t ? [t.caption, ...(t.headers || []), ...(t.rows || []).flat()] : []),
    ...(a.faq || []).flatMap(f => [f.q, f.a])].filter(x => typeof x === 'string').join('\n');
  if (words(all) < 700) p.push('too short (under 700 words)');
  if ((all.match(/\[\[/g) || []).length > 6) p.push('too many links');
  if (/\[\[/.test([a.answer, ...(a.faq || []).map(f => f && f.a), ...(t && t.rows ? t.rows.flat() : [])].join(' '))) p.push('no links allowed in the answer, table or FAQ');
  for (const [re, why] of BAD) if (re.test(all)) p.push(why);
  return p;
}

async function ask(extra) {
  const user = `Topic: ${topic.title}\nAngle: ${topic.angle || ''}\nKeywords to work in naturally: ${(topic.keywords || []).join(', ')}\nFacts you may use (nothing else about our products):\n${(topic.facts || []).map(f => '- ' + f).join('\n')}\nAllowed link paths:\n${offered.map(p => '- ' + p).join('\n')}\nExisting articles (do not repeat them):\n${posts.map(p => '- ' + p.title).join('\n') || '- none yet'}${extra ? `\n\nYour previous attempt was rejected because: ${extra}. Fix this.` : ''}`;
  if (!KEY) {   /* free path: Google Gemini */
    const body = JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: 16000, temperature: 0.7, responseMimeType: 'application/json' }
    });
    let lastErr = '';
    for (const m of GEMINI_MODELS) {
      for (let t = 0; t < 2; t++) {
        let r;
        try {
          r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
            method: 'POST', headers: { 'x-goog-api-key': GKEY, 'content-type': 'application/json' }, body, signal: AbortSignal.timeout(120000)
          });
        } catch (e) { lastErr = `Gemini ${m} did not answer: ${e.message}`; console.log(lastErr); break; }   /* timeout or network: next model */
        if (r.ok) {
          const j = await r.json();
          const text = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).filter(p => !p.thought).map(p => p.text || '').join('');
          const a = text.indexOf('{'), b = text.lastIndexOf('}');
          console.log(`Gemini model used: ${m}`);
          try { return JSON.parse(text.slice(a, b + 1)); } catch { return null; }
        }
        lastErr = `Gemini ${m} error ${r.status}: ${(await r.text()).slice(0, 200)}`;
        console.log(lastErr); console.log(`::warning title=Blog writer::${lastErr.replace(/%/g, '%25').replace(/\r?\n/g, ' ')}`);
        if (r.status === 429 || r.status === 503) { if (t === 0) await new Promise(ok => setTimeout(ok, 20000)); continue; }   /* busy or per-minute limit: wait once, then next model */
        break;   /* 400/403/404 etc: this model will not work, try the next one */
      }
    }
    throw new Error(lastErr || 'No Gemini model answered');
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 6000, system: SYSTEM, messages: [{ role: 'user', content: user }] })
  });
  if (!res.ok) throw new Error(`Anthropic API error ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = await res.json();
  const text = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  try { return JSON.parse(text.slice(a, b + 1)); } catch { return null; }
}

// Messages shown as annotations on the GitHub run page (readable without opening the log).
const note = (lvl, msg) => console.log(`::${lvl} title=Blog writer::${String(msg).replace(/%/g, '%25').replace(/\r?\n/g, ' ').slice(0, 900)}`);
let art = null, problems = [];
for (let i = 0; i < 3; i++) {
  try { art = await ask(problems.join('; ')); }
  catch (e) { note('error', `AI request failed: ${e.message}`); save(); console.error(e.message); process.exit(1); }
  problems = art ? check(art) : ['the reply was not valid JSON (it may have been cut off)'];
  if (!problems.length) break;
  note('warning', `Attempt ${i + 1} rejected: ${problems.join('; ')}`);
  console.log(`Attempt ${i + 1} rejected: ${problems.join('; ')}`);
}
if (problems.length) { save(); note('error', `Could not produce a draft that passes the checks. Last problems: ${problems.join('; ')}`); console.error('Could not produce a draft that passes the checks. Nothing written.'); process.exit(1); }

const inline = s => esc(s).replace(/\[\[(\/[^|\]]+)\|([^\]]+)\]\]/g, (m, path, text) => allowed.has(path) ? `<a href="${path}">${text}</a>` : text).replace(/\[\[|\]\]/g, '');
const para = s => '<p>' + inline(s) + '</p>';
const plain = s => String(s).replace(/\[\[\/[^|\]]+\|([^\]]+)\]\]/g, '$1').replace(/\[\[|\]\]/g, '');
const parts = [art.title, art.answer, art.intro, art.closing, ...art.sections.flatMap(s => [s.heading, ...s.paragraphs, ...(s.bullets || [])]), art.table.caption, ...art.table.headers, ...art.table.rows.flat(), ...art.faq.flatMap(f => [f.q, f.a])].filter(Boolean).map(plain);
const total = words(parts.join(' '));
const now = new Date(), iso = now.toISOString().slice(0, 10);
const nice = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const url = `${SITE}/blog/${topic.slug}.html`;
const ld = o => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>';
const CSS = '*{box-sizing:border-box}body{margin:0;font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1f1b2e;background:#faf9fd}a{color:#6d28d9}header{background:#7c3aed;color:#fff;padding:.8rem 1rem}header a{color:#fff;text-decoration:none;font-weight:800;font-size:1.15rem}main{max-width:760px;margin:0 auto;padding:1rem}nav.bc{font-size:.85rem;color:#6b6b80;margin:.3rem 0 1rem}h1{font-size:1.6rem;line-height:1.25;margin:.2rem 0 .6rem}h2{font-size:1.25rem;margin:1.6rem 0 .4rem}h3{font-size:1.05rem;margin:1.1rem 0 .2rem}.btn{display:block;text-align:center;background:#16a34a;color:#fff;text-decoration:none;font-weight:800;padding:.85rem;border-radius:12px;margin:1rem 0}.box{background:#fff;border:1px solid #e6e1f5;border-radius:14px;padding:.9rem 1rem;margin:1rem 0}.answer{background:#f1ebff;border-left:4px solid #7c3aed;border-radius:10px;padding:.8rem 1rem;margin:1rem 0}.meta{color:#6b6b80;font-size:.85rem}.tw{overflow-x:auto;margin:1rem 0}table{border-collapse:collapse;width:100%;font-size:.95rem}caption{text-align:left;font-weight:700;padding:.3rem 0}th,td{border:1px solid #e6e1f5;padding:.5rem .6rem;text-align:left;vertical-align:top}th{background:#f1ebff}ul.rel{padding-left:1.1rem}footer{max-width:760px;margin:2rem auto;padding:1rem;color:#6b6b80;font-size:.85rem;border-top:1px solid #e6e1f5}';
const section = s => `<h2>${esc(s.heading)}</h2>\n${s.paragraphs.map(para).join('\n')}${s.bullets && s.bullets.length ? `\n<ul>${s.bullets.map(b => `<li>${inline(b)}</li>`).join('')}</ul>` : ''}`;
const tableHtml = `<div class="tw"><table><caption>${esc(art.table.caption || '')}</caption><thead><tr>${art.table.headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${art.table.rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const faqHtml = `<h2>Frequently asked questions</h2>\n${art.faq.map(f => `<h3>${esc(plain(f.q))}</h3>\n<p>${esc(plain(f.a))}</p>`).join('\n')}`;
const catHtml = cats.length ? `<div class="box"><strong>Shop this category</strong><ul class="rel">${cats.map(c => `<li><a href="${c}">${esc(titleOf(c.slice(1)) || 'Browse the category')}</a></li>`).join('')}</ul></div>` : '';
const relHtml = related.length ? `<h2>Related guides</h2>\n<ul class="rel">${related.map(r => `<li><a href="${r.path}">${esc(r.title)}</a></li>`).join('')}</ul>` : '';
const html = `<!doctype html>
<html lang="en-KE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(art.title)} | Stermont Arcade</title><meta name="description" content="${esc(art.description)}">
<link rel="canonical" href="${url}"><meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="article"><meta property="og:site_name" content="Stermont Arcade"><meta property="og:locale" content="en_KE">
<meta property="og:title" content="${esc(art.title)}"><meta property="og:description" content="${esc(art.description)}"><meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/logo.png"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#7c3aed">
<style>${CSS}</style>
${ld({ '@context': 'https://schema.org', '@type': 'Article', headline: art.title, description: art.description, datePublished: iso, dateModified: iso, inLanguage: 'en-KE', author: { '@type': 'Organization', name: 'Stermont Arcade' }, publisher: { '@type': 'Organization', name: 'Stermont Arcade', logo: { '@type': 'ImageObject', url: `${SITE}/logo.png` } }, mainEntityOfPage: url, image: `${SITE}/logo.png` })}
${ld({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: art.faq.map(f => ({ '@type': 'Question', name: plain(f.q), acceptedAnswer: { '@type': 'Answer', text: plain(f.a) } })) })}
${ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', `${SITE}/`], ['Buying guides', `${SITE}/blog/`], [art.title, url]].map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) })}
<script src="/analytics.js" defer></script></head><body>
<header><a href="${SITE}/">Stermont Arcade</a></header><main>
<nav class="bc"><a href="${SITE}/">Home</a> \u203a <a href="/blog/">Buying guides</a> \u203a ${esc(art.title)}</nav>
<h1>${esc(art.title)}</h1>
<p class="meta">Updated ${nice} \u00b7 ${Math.max(2, Math.round(total / 200))} min read</p>
<div class="answer"><strong>Quick answer:</strong> ${esc(plain(art.answer))}</div>
${para(art.intro)}
${art.sections.map(section).join('\n')}
${tableHtml}
${faqHtml}
${art.closing ? para(art.closing) : ''}
${catHtml}
${relHtml}
<a class="btn" href="/products.html">Browse all products</a>
<div class="box"><a href="https://wa.me/254748888230?text=Hello%20Stermont%20Arcade">Questions? Chat with us on WhatsApp</a></div>
</main>
<footer>Stermont Arcade \u00b7 Online store serving all of Kenya \u00b7 Pay by M-Pesa \u00b7 Delivery to all 47 counties \u00b7 <a href="https://wa.me/254748888230">WhatsApp +254 748 888 230</a> \u00b7 <a href="/shipping.html">Shipping</a> \u00b7 <a href="/returns.html">Returns</a> \u00b7 <a href="/privacy.html">Privacy</a></footer><script src="/analytics.js" defer></script></body></html>
`;
writeFileSync(`blog/${topic.slug}.html`, html);
topic.status = 'drafted'; topic.drafted = iso; dirty = true;
save();
console.log(`Wrote blog/${topic.slug}.html (${total} words).`);
out('written', 'true'); out('slug', topic.slug); out('title', art.title.replace(/[\r\n]/g, ' '));
