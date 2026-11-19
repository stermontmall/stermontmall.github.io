// Regression guard: customer/staff product links must open the mobile shell.
// SEO-only /p/ references remain intentionally allowed in canonical/og:url, JSON-LD,
// product sitemap entries, breadcrumbs and the homepage's marked seo-links crawl block.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import shellProductLink from './product-links.js';
import { productDescriptionHtml } from './product-description-html.mjs';
import { renderPost } from './seo-pest/blog-build.mjs';

const SITE = 'https://stermontarcade.co.ke';
const SEO_SURFACE_ALLOWLIST = [
  'canonical and og:url metadata',
  'Product/ProductGroup JSON-LD URLs',
  'product sitemap entries',
  'product breadcrumbs',
  'homepage <!-- seo-links:start --> ... <!-- seo-links:end --> crawl links'
];
const SKIP_DIRS = new Set(['.git', 'node_modules', 'p', 'c', 'blog', 'guides', 'services', 'pest-control', 'assets', 'product-photos']);
const SKIP_FILES = new Set(['no-static-share-links.test.mjs', 'no-classic-hop.test.mjs', 'classic.html', 'products.html']);
const HUMAN_PRODUCT = /<a\\b[^>]*\\bhref\\s*=\\s*["'`][^"'`]*\\/p\\/|href\\s*=\\s*["'`]\\/p\\/|(?:Link|Product link):[^\\n`]*\\/p\\/|https?:\\/\\/stermontarcade\\.co\\.ke\\/p\\/[^\\s"'`<>]*/i;
const HUMAN_CLASSIC = /<a\\b[^>]*\\bhref\\s*=\\s*["'`][^"'`]*classic\\.html|href\\s*=\\s*["'`][^"'`]*classic\\.html|(?:location\\.(?:href|assign|replace)|window\\.open)\\s*[^;\\n]*classic\\.html/i;

assert.equal(shellProductLink('premise-200-sc-termiticide-50-ml'), SITE + '/?product=premise-200-sc-termiticide-50-ml');
assert.equal(shellProductLink(''), SITE + '/');

// Exercise actual generated HTML renderers, not just a helper string.
const description = productDescriptionHtml('Related item: [Premise 200 SC](/p/premise-200-sc-termiticide-50-ml.html).');
assert.match(description, /href="https:\\/\\/stermontarcade\\.co\\.ke\\/\\?product=premise-200-sc-termiticide-50-ml"/);
assert.doesNotMatch(description, /href="[^"]*\\/p\\//);

const post = renderPost({
  slug: 'shell-link-fixture', title: 'Shell link fixture', description: 'A test guide.',
  answer: 'Use the shell product link.', intro: 'This is a generated test article.',
  sections: [], faq: [], closing: '', cat: 'missing-category',
  product: 'premise-200-sc-termiticide-50-ml', related: []
});
assert.match(post, /href="https:\\/\\/stermontarcade\\.co\\.ke\\/\\?product=premise-200-sc-termiticide-50-ml"/);
assert.doesNotMatch(post, /<a\\b[^>]*href="[^"]*\\/p\\//i);

// Source scan covers storefront scripts, generators, admin tools and static root pages.
// The homepage's explicitly marked seo-links block is the one intentional crawl-link exception.
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const path = join(dir, name), st = statSync(path);
    if (st.isDirectory()) walk(path, out);
    else if (!SKIP_FILES.has(path.replace(/^\\.\\//, '')) && /\\.(?:html|js|mjs|ts)$/.test(name) && st.size < 3_000_000) out.push(path);
  }
  return out;
}
const offenders = [];
for (const file of walk('.')) {
  let source = readFileSync(file, 'utf8');
  if (file === 'index.html') {
    const start = source.indexOf('<!-- seo-links:start -->');
    const end = source.indexOf('<!-- seo-links:end -->');
    assert.ok(start >= 0 && end > start, 'homepage SEO crawl-link markers must remain present');
    source = source.slice(0, start) + source.slice(end + '<!-- seo-links:end -->'.length);
  }
  if (HUMAN_PRODUCT.test(source)) offenders.push(file + ' (static product URL)');
  if (HUMAN_CLASSIC.test(source)) offenders.push(file + ' (classic URL)');
}
assert.deepEqual(offenders, [], 'human-facing static product/classic links found: ' + offenders.join(', '));

// Explicitly protect the SEO surfaces from accidental removal or conversion.
const generator = readFileSync('generate-products.mjs', 'utf8');
assert.match(generator, /<link rel="canonical" href="\\$\\{SITE\\}\\$\\{path\\}">/);
assert.match(generator, /url: SITE \\+ path/);
assert.match(generator, /crumbLd\\(\\[\\['Home', SITE \\+ '\/'\\]/);
assert.match(generator, /sitemap-products|sitemap/);
assert.ok(SEO_SURFACE_ALLOWLIST.length === 5);

console.log('OK: customer-facing product links use the mobile shell; SEO-only /p/ surfaces remain allowlisted.');
