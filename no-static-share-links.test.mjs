// Regression guard: customer/staff product links must open the mobile shell.
// SEO-only /p/ references remain intentionally allowed in canonical/og:url, JSON-LD,
// product sitemap entries, breadcrumbs and the homepage's marked seo-links crawl block.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import shellProductLink from './product-links.js';
import { productDescriptionHtml } from './product-description-html.mjs';
import { renderPost } from './seo-pest/blog-build.mjs';
import { rewriteHtml } from './rewrite-static-product-links.mjs';

const SITE = 'https://stermontarcade.co.ke';
const SEO_SURFACE_ALLOWLIST = [
  'canonical and og:url metadata',
  'Product/ProductGroup JSON-LD URLs',
  'product sitemap entries',
  'product breadcrumbs',
  'homepage <!-- seo-links:start --> ... <!-- seo-links:end --> crawl links'
];
const SKIP_DIRS = new Set(['.git', 'node_modules', 'assets', 'product-photos']);
const GENERATED_DIRS = new Set(['p', 'c', 'blog', 'guides', 'pest-control']);
const GENERATED_FILES = new Set(['products.html']);
const GENERATED_MARKER = '<!-- stm-shell-product-links:v1 -->';
const CLASSIC_FILE = ['classic', 'html'].join('.');
const SKIP_FILES = new Set(['no-static-share-links.test.mjs', 'no-classic-hop.test.mjs', CLASSIC_FILE]);
const HUMAN_PRODUCT = /<a\b[^>]*\bhref\s*=\s*["'`][^"'`]*\/p\/|href\s*=\s*["'`]\/p\/|(?:Link|Product link):[^\n`]*\/p\//i;
const HUMAN_CLASSIC = new RegExp('<a\\b[^>]*\\bhref\\s*=\\s*["\\x27\\x60][^"\\x27\\x60]*' + CLASSIC_FILE + '|href\\s*=\\s*["\\x27\\x60][^"\\x27\\x60]*' + CLASSIC_FILE + '|(?:location\\.(?:href|assign|replace)|window\\.open)\\s*[^;\\n]*' + CLASSIC_FILE, 'i');

assert.equal(shellProductLink('premise-200-sc-termiticide-50-ml'), SITE + '/?product=premise-200-sc-termiticide-50-ml');
assert.equal(shellProductLink(''), SITE + '/');

// The migration rewrites only customer anchors and protects the explicit SEO surfaces.
const migrated = rewriteHtml('<html><head></head><body><a href="/p/demo-product.html">Product</a><nav class="bc"><a href="/p/breadcrumb.html">Breadcrumb</a></nav><!-- seo-links:start --><a href="/p/crawl-only.html">Crawler</a><!-- seo-links:end --><link rel="canonical" href="https://stermontarcade.co.ke/p/demo-product.html"></body></html>');
assert.equal(migrated.replaced, 1);
assert.match(migrated.html, /href="https:\/\/stermontarcade\.co\.ke\/\?product=demo-product"/);
assert.match(migrated.html, /href="\/p\/breadcrumb\.html"/);
assert.match(migrated.html, /href="\/p\/crawl-only\.html"/);
assert.match(migrated.html, /rel="canonical" href="https:\/\/stermontarcade\.co\.ke\/p\/demo-product\.html"/);
assert.ok(migrated.html.includes(GENERATED_MARKER));

// Exercise actual generated HTML renderers, not just a helper string.
const description = productDescriptionHtml('Related item: [Premise 200 SC](/p/premise-200-sc-termiticide-50-ml.html).');
assert.match(description, /href="https:\/\/stermontarcade\.co\.ke\/\?product=premise-200-sc-termiticide-50-ml"/);
assert.doesNotMatch(description, /href="[^"]*\/p\//);

const post = renderPost({
  slug: 'shell-link-fixture', title: 'Shell link fixture', description: 'A test guide.',
  answer: 'Use the shell product link.', intro: 'Read [[/p/premise-200-sc-termiticide-50-ml.html|Premise 200 SC]] before ordering.',
  sections: [], faq: [], closing: '', cat: 'missing-category',
  product: 'premise-200-sc-termiticide-50-ml', related: []
});
assert.match(post, /href="https:\/\/stermontarcade\.co\.ke\/\?product=premise-200-sc-termiticide-50-ml"/);
assert.match(post, /Premise 200 SC/);
assert.doesNotMatch(post, /<a\b[^>]*href="[^"]*\/p\//i);

// Source scan covers storefront scripts, generators, admin tools and static root pages.
// The homepage's explicitly marked seo-links block is the one intentional crawl-link exception.
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const path = join(dir, name), st = statSync(path);
    if (st.isDirectory()) walk(path, out);
    else if (!name.endsWith('.test.mjs') && !SKIP_FILES.has(path.replace(/^\.\//, '')) && /\.(?:html|js|mjs|ts)$/.test(name) && st.size < 3_000_000) out.push(path);
  }
  return out;
}
const offenders = [];
for (const file of walk('.')) {
  let source = readFileSync(file, 'utf8');
  const top = file.split('/')[0];
  if ((GENERATED_DIRS.has(top) || GENERATED_FILES.has(file)) && !source.includes(GENERATED_MARKER)) continue; // stale output is rebuilt by the post-merge page workflows
  if (file === 'index.html') {
    const start = source.indexOf('<!-- seo-links:start -->');
    const end = source.indexOf('<!-- seo-links:end -->');
    assert.ok(start >= 0 && end > start, 'homepage SEO crawl-link markers must remain present');
  }
  // The explicit SEO crawl block and product breadcrumb are allowlisted, never treated as customer CTAs.
  source = source.replace(/<!--\s*seo-links:start\s*-->[\s\S]*?<!--\s*seo-links:end\s*-->/gi, '');
  source = source.replace(/<nav\b[^>]*class=["'][^"']*\bbc\b[^"']*["'][^>]*>[\s\S]*?<\/nav>/gi, '');
  if (HUMAN_PRODUCT.test(source)) offenders.push(file + ' (static product URL)');
  if (HUMAN_CLASSIC.test(source)) offenders.push(file + ' (classic URL)');
}
assert.deepEqual(offenders, [], 'human-facing static product/classic links found: ' + offenders.join(', '));

// Explicitly protect the SEO surfaces from accidental removal or conversion.
const generator = readFileSync('generate-products.mjs', 'utf8');
const relatedFill = readFileSync('seo-related-fill.mjs', 'utf8');
assert.match(relatedFill, /shellHref: shellProductLink/);
assert.ok(relatedFill.includes('href="${p.shellHref}"'));
assert.match(generator, /<link rel="canonical" href="\$\{SITE\}\$\{path\}">/);
assert.match(generator, /property="og:url" content="\$\{SITE\}\$\{path\}"/);
assert.match(generator, /url: SITE \+ path/);
assert.match(generator, /crumbLd\(\[\['Home', SITE \+ '\/'\]/); // BreadcrumbList remains on the canonical product page
assert.match(generator, /seo-links:start/); // Homepage crawler links remain in their dedicated block
const sitemap = readFileSync('seo-extras.mjs', 'utf8');
assert.match(sitemap, /\$\{SITE\}\/p\/\$\{f\}/); // sitemap-products.xml keeps canonical /p/ URLs
assert.ok(SEO_SURFACE_ALLOWLIST.length === 5);

console.log('OK: customer-facing product links use the mobile shell; SEO-only /p/ surfaces remain allowlisted.');
