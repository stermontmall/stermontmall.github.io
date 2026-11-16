// Run: node seo-kenya-category-meta.test.mjs   (no dependencies)
// Regression test for the 2026-11-16 go-live bug: seo-kenya.mjs used to overwrite every category page's description with the generic
// catDescription() text, so categories.meta_description from the database (and hand-written INFO text) never reached production.
// The category TITLE must still be rewritten; the DESCRIPTION chosen by generate-products.mjs must survive untouched.
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { catTitle, catDescription } from './seo-meta.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const work = mkdtempSync(join(tmpdir(), 'seo-kenya-cat-'));

const DB_DESC = 'Buy Fertilizers for your Kenyan farm. Compare pack sizes and prices, pay by M-Pesa. Sarit Centre pickup or delivery to 47 counties.';
const items = [1, 2, 3].map(i => `<li><a href="/p/item-${i}.html"><img src="/x.jpg" alt="">Item ${i}</a><span>KSh ${i}00</span></li>`).join('');

function page(name, desc) {
  const t = 'Generic generated title';
  return `<!doctype html><html lang="en-KE"><head><meta charset="utf-8"><title>${t}</title>
<meta name="description" content="${desc}"><meta property="og:title" content="${t}"><meta property="og:description" content="${desc}">
<meta name="twitter:title" content="${t}"><meta name="twitter:description" content="${desc}"></head><body>
<nav class="bc"><a href="https://stermontarcade.co.ke/">Home</a> › ${name}</nav><h1>${name} in Kenya</h1>
<ul class="g">${items}</ul><p><a href="/c/">Browse all categories</a></p></body></html>`;
}

try {
  mkdirSync(join(work, 'c'));
  // 1) the generator used the database description
  writeFileSync(join(work, 'c', 'fertilizers.html'), page('Fertilizers', DB_DESC));
  // 2) the generator fell back to the generic text (no database copy): must be identical before and after
  const fallback = catDescription('Seeds & Seedlings', 'seeds-seedlings').replace(/&/g, '&amp;');
  writeFileSync(join(work, 'c', 'seeds-seedlings.html'), page('Seeds &amp; Seedlings', fallback));

  const r = spawnSync(process.execPath, [join(here, 'seo-kenya.mjs')], { cwd: work, encoding: 'utf8' });
  assert.equal(r.status, 0, `seo-kenya.mjs exited ${r.status}: ${r.stderr}`);

  const get = (slug, re) => (readFileSync(join(work, 'c', `${slug}.html`), 'utf8').match(re) || [])[1];
  const DESC = /<meta name="description" content="([^"]*)">/, OGD = /<meta property="og:description" content="([^"]*)">/, TWD = /<meta name="twitter:description" content="([^"]*)">/;
  const TITLE = /<title>([^<]*)<\/title>/, OGT = /<meta property="og:title" content="([^"]*)">/, TWT = /<meta name="twitter:title" content="([^"]*)">/;

  // database description survives in all three tags
  assert.equal(get('fertilizers', DESC), DB_DESC, 'meta description must keep the database copy');
  assert.equal(get('fertilizers', OGD), DB_DESC, 'og:description must keep the database copy');
  assert.equal(get('fertilizers', TWD), DB_DESC, 'twitter:description must keep the database copy');

  // title is still rewritten to the shared seo-meta pattern
  const want = catTitle('Fertilizers');
  assert.equal(get('fertilizers', TITLE), want, 'title must still be rewritten');
  assert.equal(get('fertilizers', OGT), want);
  assert.equal(get('fertilizers', TWT), want);

  // fallback pages keep exactly the generic description (no behaviour change where there is no database copy)
  assert.equal(get('seeds-seedlings', DESC), fallback);
  console.log('seo-kenya category meta: all checks passed');
} finally {
  rmSync(work, { recursive: true, force: true });
}
