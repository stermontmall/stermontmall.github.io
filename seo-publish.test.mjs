// Tests for seo-publish.mjs (approved SEO proposals -> live files). No network, no files touched: pages live in memory.
// Run: node seo-publish.test.mjs
import assert from 'node:assert/strict';
import { processProposal, applyToHtml, bumpSitemap, resolveTarget, titleProblems, descProblems, readHead, verifyLive, SITE, BRAND } from './seo-publish.mjs';

let n = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); n++; };
const eq = (a, b, msg) => { assert.equal(a, b, msg); n++; };

// ---- fixtures: one blog page (single-quoted attributes, like blog-write.mjs) and one static page (double quotes) ----
const OLD_T = 'Guide to Rat Bait in Kenya: Where to Put It' + BRAND;
const OLD_D = 'Rat bait works best inside a station. See where to place it in a home, shop or store in Kenya and how long to keep baiting.';
const blog = `<!doctype html>
<html lang='en-KE'><head><meta charset='utf-8'>
<title>${OLD_T}</title><meta name='description' content='${OLD_D}'>
<link rel='canonical' href='${SITE}/blog/rat-bait.html'><meta name='robots' content='index, follow'>
<meta property='og:title' content='${OLD_T}'><meta property='og:description' content='${OLD_D}'>
<meta name='twitter:title' content='${OLD_T}'><meta name='twitter:description' content='${OLD_D}'>
<script type='application/ld+json'>{"@type":"Article","headline":"Rat bait in Kenya","datePublished":"2026-10-01","dateModified":"2026-10-20"}</script>
</head><body><h1>Where to put rat bait in Kenya: a practical guide</h1><p>Body text stays exactly as it is.</p></body></html>`;
const stat = `<!doctype html><html><head><title>Online Shopping in Nairobi | Pick Up in Westlands${BRAND}</title>
<meta name="description" content="Shop online in Nairobi and pay by M-Pesa. Pick up at Sarit Centre, Westlands, or arrange delivery. Browse pest control and appliances.">
<meta property="og:title" content="Online Shopping in Nairobi | Pick Up in Westlands${BRAND}"></head><body><h1>Online shopping in Nairobi</h1></body></html>`;
const files = { 'blog/rat-bait.html': blog, 'nairobi.html': stat, 'p/some-product.html': '<title>x</title>', 'guides/g.html': '<title>Guide title that is long enough to be valid here' + BRAND + '</title><meta name="description" content="' + OLD_D + '"><h1>g</h1>' };
const mk = () => {
  const fs = { ...files }, written = [];
  return { fs, written, ctx: { exists: f => f in fs, read: f => fs[f], write: (f, c) => { fs[f] = c; written.push(f); }, index: { titles: new Map(), descs: new Map() }, today: '2026-11-02' } };
};
const prop = (over = {}) => ({ id: 'p1', target_url: `${SITE}/blog/rat-bait.html`, title: 'Where to Put Rat Bait in Kenya: Stations and Spacing' + BRAND, meta_description: 'Learn where rat bait stations go in a home, shop or store in Kenya, how many you need, and how long to keep baiting before you review.', generation_model: 'admin-authored', ...over });

// ---- 1. a valid admin-authored proposal is published, and ONLY title/description/dateModified change ----
{
  const { fs, written, ctx } = mk();
  const r = processProposal(prop(), ctx);
  eq(r.status, 'published'); ok(r.changed, 'changed'); eq(written.join(), 'blog/rat-bait.html');
  const after = fs['blog/rat-bait.html'], h = readHead(after);
  eq(h.title, prop().title); eq(h.desc, prop().meta_description);
  ok(after.includes(`<meta property='og:title' content='${prop().title}'>`), 'og:title updated, quote style kept');
  ok(after.includes(`<meta name='twitter:description' content='${prop().meta_description}'>`), 'twitter:description updated');
  ok(after.includes('"dateModified":"2026-11-02"'), 'blog dateModified bumped so the sitemap lastmod moves');
  ok(after.includes('"datePublished":"2026-10-01"'), 'datePublished untouched');
  ok(after.includes('<p>Body text stays exactly as it is.</p>') && after.includes('<h1>Where to put rat bait in Kenya: a practical guide</h1>'), 'article body untouched');
  eq(after.replace(/<title>[\s\S]*?<\/title>/, '').replace(/content='[^']*'/g, "content=''").replace(/"dateModified":"[^"]*"/, '').length,
     blog.replace(/<title>[\s\S]*?<\/title>/, '').replace(/content='[^']*'/g, "content=''").replace(/"dateModified":"[^"]*"/, '').length, 'nothing else in the file changed');
}
// ---- 2. identical to the live page = already live, no edit ----
{
  const { written, ctx } = mk();
  const r = processProposal(prop({ title: OLD_T, meta_description: OLD_D }), ctx);
  eq(r.status, 'published'); eq(r.changed, false); eq(written.length, 0);
}
// ---- 3. a live title that only differs by a trailing ellipsis counts as the same title ----
{
  const { fs, ctx } = mk(); fs['blog/rat-bait.html'] = blog.replaceAll(OLD_T, 'Guide to Rat Bait in Kenya: Where to Put…' + BRAND);
  const r = processProposal(prop({ title: 'Guide to Rat Bait in Kenya: Where to Put' + BRAND, meta_description: OLD_D }), ctx);
  eq(r.changed, false); eq(r.status, 'published');
}
// ---- 4. the broken drafts the free audit produces are refused ----
for (const [title, why] of [
  ['Where to put rat bait in Kenya: a practic | Stermont Arcade', /middle of a word/],
  ['Rat bait stations: where they go and  | Stermont Arcade', /double space/],
  ['Rat bait stations: where they go and what | Stermont Arcade', /stops on the word "what"/],
  ['Rat bait stations: where they go and… | Stermont Arcade', /ellipsis/],
  ['Rat bait stations', /minimum 25/],
  ['Rat bait stations in Kenya: where they go, how many you need and how to check them' + BRAND, /maximum 70/]
]) {
  const { written, ctx } = mk();
  const r = processProposal(prop({ title }), ctx);
  eq(r.status, 'failed', title); ok(r.reasons.some(x => why.test(x)), `${title} -> ${r.reasons}`); eq(written.length, 0);
}
{
  const { written, ctx } = mk();
  const r = processProposal(prop({ meta_description: 'Rat bait stations in a home, shop or store in Kenya. Explore the details, check what applies to your location and request a clear quotation from Stermont Arcade.' }), ctx);
  eq(r.status, 'failed'); ok(r.reasons.some(x => /generic fallback/.test(x)), 'boilerplate description refused'); eq(written.length, 0);
}
// ---- 5. automatic audits may not swap a valid live title for a shorter one; an admin may ----
{
  const shorter = 'Rat bait stations in Kenya | Stermont Arcade';
  const auto = mk(), man = mk();
  const a = processProposal(prop({ title: shorter, generation_model: 'free-live-audit-v1' }), auto.ctx);
  eq(a.status, 'failed'); ok(a.reasons.some(x => /shorter/.test(x)), 'automatic audit refused');
  const m = processProposal(prop({ title: shorter, generation_model: 'admin-authored' }), man.ctx);
  eq(m.status, 'published'); ok(m.changed, 'admin-written shorter title allowed');
}
// ---- 6. duplicates across the site are refused, and the index moves with a publish ----
{
  const { ctx } = mk(); ctx.index.titles.set(prop().title.toLowerCase(), new Set(['blog/other.html']));
  const r = processProposal(prop(), ctx);
  eq(r.status, 'failed'); ok(r.reasons.some(x => /already uses this exact title/.test(x)), 'duplicate title refused');
  const two = mk();
  eq(processProposal(prop(), two.ctx).status, 'published');
  const again = processProposal(prop({ id: 'p2', target_url: `${SITE}/nairobi.html` }), two.ctx);
  eq(again.status, 'failed'); ok(again.reasons.some(x => /already uses/.test(x)), 'a second page cannot reuse a title that was just published');
}
// ---- 7. generated and unsafe targets are never edited ----
for (const url of [`${SITE}/p/some-product.html`, `${SITE}/guides/g.html`, `${SITE}/blog/index.html`, 'https://evil.example/blog/rat-bait.html', `${SITE}/blog/../admin.html`, `${SITE}/blog/missing.html`, 'not a url']) {
  const { written, ctx } = mk();
  const r = processProposal(prop({ target_url: url }), ctx);
  eq(r.status, 'failed', url); eq(written.length, 0, url);
}
ok(resolveTarget(`${SITE}/nairobi.html`, f => f in files).editable, 'root pages are editable');
eq(resolveTarget(`${SITE}/admin.html`, () => true).ok, false, 'admin page is not a publish target');
// ---- 8. static page: double-quoted tags, apostrophes survive, sitemap date moves ----
{
  const { fs, ctx } = mk();
  const t = "Online Shopping in Nairobi: Pick Up at Sarit Centre" + BRAND, d = "Shop online in Nairobi, pay by M-Pesa and collect at Sarit Centre, Westlands, or get delivery. We're open daily and pack every order the same day.";
  const r = processProposal(prop({ target_url: `${SITE}/nairobi.html`, title: t, meta_description: d }), ctx);
  eq(r.status, 'published'); eq(r.kind, 'static');
  ok(fs['nairobi.html'].includes(`<meta name="description" content="Shop online in Nairobi, pay by M-Pesa and collect at Sarit Centre, Westlands, or get delivery. We&#39;re open daily`), 'apostrophe encoded safely');
  eq(readHead(fs['nairobi.html']).desc, d, 'decodes back to the exact text');
  ok(!fs['nairobi.html'].includes('dateModified'), 'no dateModified invented on static pages');
  const xml = `<urlset><url>\n    <loc>${SITE}/nairobi.html</loc>\n    <lastmod>2026-10-24</lastmod>\n  </url><url><loc>${SITE}/faq.html</loc><lastmod>2026-10-23</lastmod></url></urlset>`;
  const next = bumpSitemap(xml, `${SITE}/nairobi.html`, '2026-11-02');
  ok(next.includes('<lastmod>2026-11-02</lastmod>') && next.includes('<loc>' + SITE + '/faq.html</loc><lastmod>2026-10-23</lastmod>'), 'only the edited page lastmod moves');
  eq(bumpSitemap(xml, `${SITE}/unknown.html`, '2026-11-02'), xml, 'unknown pages never add sitemap entries');
}
// ---- 9. helpers ----
eq(titleProblems('Air Fryer Buying Guide Kenya: Size, Watts, Tokens' + BRAND, null).length, 0, 'a good title has no problems');
eq(descProblems('Buying an air fryer in Kenya: pick the right litres for your family, check watts against your KPLC tokens, and cook chips, chicken and samosas.').length, 0, 'a good description has no problems');
eq(applyToHtml('<p>nothing</p>', { title: 'x', desc: 'y' }), '<p>nothing</p>', 'no matching tags -> no change');

// ---- 10. live verification: waits for Pages, then checks title, description and the sitemap date ----
{
  const loc = `${SITE}/blog/rat-bait.html`, data = { at: '2026-11-02T05:00:00Z', results: [{ changed: true, loc, wantTitle: prop().title, wantDesc: prop().meta_description }, { changed: false, loc: `${SITE}/faq.html` }] };
  const live = { stale: true };
  const page = (t, d) => `<title>${t}</title><meta name='description' content='${d}'>`;
  const sm = v => `<urlset><url><loc>${loc}</loc><lastmod>${v}</lastmod></url></urlset>`;
  let calls = 0; const logs = [];
  const fetchText = async u => { calls++; if (u.includes('sitemap.xml')) return sm(live.stale ? '2026-10-20' : '2026-11-02'); return live.stale ? page(OLD_T, OLD_D) : page(prop().title, prop().meta_description); };
  const sleep = async () => { live.stale = false; };   // Pages finishes deploying while we wait
  const res = await verifyLive(data, { fetchText, sleep, attempts: 3, waitMs: 1, log: m => logs.push(m) });
  ok(res.ok, 'verification passes once the site has updated'); ok(logs.some(l => /LIVE OK/.test(l)), 'reports the page as live'); ok(logs.some(l => /Waiting for GitHub Pages/.test(l)), 'waited for deployment first');
  live.stale = true; const never = await verifyLive(data, { fetchText, sleep: async () => {}, attempts: 2, waitMs: 1, log: () => {} });
  eq(never.ok, false, 'a page that never updates fails verification'); ok(/sitemap lastmod is 2026-10-20/.test(never.pending[0].issues.join()), 'names the stale sitemap date'); ok(/title is/.test(never.pending[0].issues.join()), 'names the stale title');
  const missing = await verifyLive(data, { fetchText: async u => { if (u.includes('sitemap.xml')) return '<urlset></urlset>'; return page(prop().title, prop().meta_description); }, sleep: async () => {}, attempts: 1, log: () => {} });
  ok(!missing.ok && /missing from sitemap/.test(missing.pending[0].issues.join()), 'a page absent from the sitemap fails');
}

console.log(`SEO publish tests passed (${n} checks).`);
