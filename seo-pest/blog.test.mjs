// node seo-pest/blog.test.mjs -> checks every blogs-NN.json: 400-600 words, structure, links that resolve, no banned claims.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPost, allText, words, closingLinks } from './blog-build.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(dir, '..');
let checks = 0; const bad = [];
const ok = (c, m) => { checks++; if (!c) bad.push(m); };
const BANNED = [/\bguarantee/i, /100\s?%/, /\bcure[sd]?\b/i, /\bcertified\b/i, /\bbest\b/i, /#1/, /top-rated/i, /pcpb[- ]approved/i, /KSh\s?\d|\bKES\s?\d/i, /\bAs an AI\b/i,
  /\b\d+(?:\.\d+)?\s?(?:ml|g|kg|l|litres?)\s?(?:per|\/)\s?(?:litre|liter|l|kg|acre|hectare|tank|knapsack|water)\b/i, /\bsafe for (babies|children|kids|pets)\b/i];
const slugs = new Set();
for (const f of fs.readdirSync(dir).filter(f => /^blogs-\d+\.json$/.test(f))) {
  const posts = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  ok(posts.length <= 10, `${f}: more than 10 posts`);
  for (const a of posts) {
    const id = `${f} ${a.slug}`, t = allText(a), w = words(t);
    ok(w >= 400 && w <= 600, `${id}: ${w} words (need 400-600)`);
    ok(a.title.length >= 20 && a.title.length <= 70, `${id}: title length ${a.title.length}`);
    ok(a.description.length >= 70 && a.description.length <= 160, `${id}: description length ${a.description.length}`);
    ok(words(a.answer) >= 30 && words(a.answer) <= 60, `${id}: answer ${words(a.answer)} words (need 30-60)`);
    ok(a.sections.length >= 3, `${id}: needs 3+ sections`);
    ok(a.sections.filter(s => /\?\s*$/.test(s.heading)).length >= 2, `${id}: needs 2+ question headings`);
    ok(a.faq.length >= 3 && a.faq.length <= 6, `${id}: faq count`);
    ok(!/\[\[/.test(a.answer + a.faq.flat().join(' ')), `${id}: links in the answer or FAQ`);
    const links = closingLinks(a);
    ok(links.length >= 2 && links.length <= 4, `${id}: ${links.length} body links (need 2-4)`);
    ok(links.includes(`/p/${a.product}.html`), `${id}: no link to its product page`);
    for (const l of [...links, `/p/${a.product}.html`, `/c/${a.cat}.html`, ...a.related.map(r => `/blog/${r}.html`)]) ok(fs.existsSync(path.join(root, l.slice(1))), `${id}: broken link ${l}`);
    for (const re of BANNED) ok(!re.test(t), `${id}: banned phrase ${re}`);
    ok(!slugs.has(a.slug), `${id}: duplicate slug`); slugs.add(a.slug);
    ok(!fs.existsSync(path.join(root, 'blog', a.slug + '.html')) || fs.readFileSync(path.join(root, 'blog', a.slug + '.html'), 'utf8') === renderPost(a), `${id}: blog file exists and differs`);
    const h = renderPost(a);
    for (const m of h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) { try { JSON.parse(m[1].replace(/\\u003c/g, '<')); checks++; } catch { checks++; bad.push(`${id}: invalid JSON-LD`); } }
    ok(!/&amp;(amp|lt|gt|quot|#39);/.test(h), `${id}: double-escaped entity (shows as "&amp;" on the page)`);
    ok((h.match(/<h1>/g) || []).length === 1, `${id}: needs exactly one h1`);
    ok(/<link rel="canonical" href="https:\/\/stermontarcade\.co\.ke\/blog\/[^"]+\.html">/.test(h), `${id}: canonical`);
    ok(/<style>\*\{box-sizing/.test(h), `${id}: page style missing`);
  }
}
console.log(`${checks} checks, ${bad.length} violations`);
bad.forEach(b => console.log(' -', b));
process.exit(bad.length ? 1 : 0);
