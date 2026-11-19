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
assert.equal(shellProductLink('premise-200-sc-termiticide-50-ml'), SITE + '/?product=premise-200-sc-termiticide-50-ml');
const SEO_SURFACE_ALLOWLIST = [
  'canonical and og:url metadata',
  'Product/ProductGroup JSON-LD URLs',
  'product sitemap entries',
  'product breadcrumbs',
  'homepage <!-- seo-links:start --> ... <!-- seo-links:end --> crawl links'
];
const SKIP_DIRS = new Set(['.git', 'node_modules', 'assets', 'product-photos', 'docs']);
const GENERATED_DIRS = new Set(['p', 'c', 'guides', 'pest-control', 'services']);
const GENERATED_FILES = new Set(['products.html', 'index.html']);
const GENERATED_MARKER = '<!-- stm-shell-product-links:v1 -->';
const CLASSIC_FILE = ['classic', 'html'].join('.');
const SKIP_FILES = new Set(['no-static-share-links.test.mjs', 'no-classic-hop.test.mjs', CLASSIC_FILE]);
const HUMAN_PRODUCT = /<a\b[^>]*\bhref\s*=\s*["'][^"']*(?:\/p\/|%2fp%2f)|href\s*=\s*["'][^"']*(?:\/p\/|%2fp%2f)|(?:Link|Product link):[^\n]*(?:\/p\/|%2fp%2f)/i;
const HUMAN_CLASSIC = new RegExp('<a\\b[^>]*\\bhref\\s*=\\s*["\\x27\\x60][^"\\x27\\x60]*' + CLASSIC_FILE + '|href\\s*=\\s*["\\x27\\x60][^"\\x27\\x60]*' + CLASSIC_FILE + '|(?:location\\.(?:href|assign|replace)|window\\.open)\\s*[^;\\n]*' + CLASSIC_FILE, 'i');
assert.ok(HUMAN_CLASSIC.test('<a href="/' + CLASSIC_FILE + '">fixture</a>'), 'classic-link detector must recognize forbidden customer links');

assert.equal(shellProductLink('premise-200-sc-termiticide-50-ml'), SITE + '/?product=premise-200-sc-termiticide-50-ml');
assert.equal(shellProductLink(''), SITE + '/');


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
  if (file === 'index.html') {
    const start = source.indexOf('<!-- seo-links:start -->');
    const end = source.indexOf('<!-- seo-links:end -->');
    assert.ok(start >= 0 && end > start, 'homepage SEO crawl-link markers must remain present');
  }
  // The explicit SEO crawl block and product breadcrumb are allowlisted, never treated as customer CTAs.
  // Canonical/Open Graph metadata and structured data are SEO-only, not share links.
  source = source.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '');
  source = source.replace(/<script\b(?=[^>]*type=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>/gi, '');
  source = source.replace(/<!--\s*seo-links:start\s*-->[\s\S]*?<!--\s*seo-links:end\s*-->/gi, '');
  source = source.replace(/<nav\b[^>]*class=["'][^"']*\bbc\b[^"']*["'][^>]*>[\s\S]*?<\/nav>/gi, '');
  if (HUMAN_PRODUCT.test(source)) offenders.push(file + ' (static product URL)');
  if (HUMAN_CLASSIC.test(source)) offenders.push(file + ' (classic URL)');
}
assert.deepEqual(offenders, [], 'human-facing static product/classic links found: ' + offenders.join(', '));

// The generated-page migration changes only human-facing body URLs.
const migrated = rewriteHtml('<html><head><link rel="canonical" href="https://stermontarcade.co.ke/p/demo-product.html"><meta property="og:url" content="https://stermontarcade.co.ke/p/demo-product.html"></head><body><nav class="bc"><a href="/p/breadcrumb.html">Breadcrumb</a></nav><!-- seo-links:start --><a href="/p/crawl-only.html">Crawler</a><!-- seo-links:end --><a href="/p/demo-product.html">Buy product</a><script>var pack={url:"/p/demo-product.html"};</script><script type="application/ld+json">{"url":"https://stermontarcade.co.ke/p/demo-product.html"}</script><a href="https://wa.me/?text=Link%3A%20https%3A%2F%2Fstermontarcade.co.ke%2Fp%2Fdemo-product.html">WhatsApp</a></body></html>');
assert.equal(migrated.replaced, 3);
assert.match(migrated.html, /href="https:\/\/stermontarcade\.co\.ke\/\?product=demo-product"/);
assert.match(migrated.html, /url:"https:\/\/stermontarcade\.co\.ke\/\?product=demo-product"/);
assert.match(migrated.html, /https%3A%2F%2Fstermontarcade\.co\.ke%2F%3Fproduct%3Ddemo-product/);
assert.match(migrated.html, /rel="canonical" href="https:\/\/stermontarcade\.co\.ke\/p\/demo-product\.html"/);
assert.match(migrated.html, /property="og:url" content="https:\/\/stermontarcade\.co\.ke\/p\/demo-product\.html"/);
assert.match(migrated.html, /href="\/p\/breadcrumb\.html"/);
assert.match(migrated.html, /href="\/p\/crawl-only\.html"/);
assert.match(migrated.html, /"url":"https:\/\/stermontarcade\.co\.ke\/p\/demo-product\.html"/);

// Explicitly protect the SEO surfaces from accidental removal or conversion.
const generator = readFileSync('generate-products.mjs', 'utf8');
const relatedFill = readFileSync('seo-related-fill.mjs', 'utf8');
assert.ok(generator.includes('productLink = shellProductLink(sl(p.id), SITE)'));
assert.ok(generator.includes('`Link: ${productLink}`'));
assert.ok(generator.includes('url:shellProductLink(v.slug || p.slug || sl(p.id), SITE)'));
assert.ok(generator.includes('window.shellProductLink(v.slug||v.id)'));
const serviceBuilder = readFileSync('services/build-services.mjs', 'utf8');
assert.ok(serviceBuilder.includes('shellProductLink(decodeURIComponent(m[1]), SITE)'));
assert.ok(serviceBuilder.includes('href="${shopHref(p.shop.href)}"'));
const kenya = readFileSync('seo-kenya.mjs', 'utf8');
assert.ok(kenya.includes('shellProductLink(i.slug)'));
assert.ok(kenya.includes('shellProductLink(cheap.slug)'));
assert.ok(kenya.includes('url: SITE + i.url')); // ItemList JSON-LD retains canonical /p/ URLs
assert.ok(relatedFill.includes('shellHref: shellProductLink'));
assert.ok(relatedFill.includes('href="${p.shellHref}"'));
assert.ok(generator.includes('<link rel="canonical" href="${SITE}${path}">'));
assert.ok(generator.includes('property="og:url" content="${SITE}${path}"'));
assert.ok(generator.includes('url: SITE + path'));
assert.ok(generator.includes("crumbLd([['Home', SITE + '/']")); // BreadcrumbList remains on the canonical product page
const admin = readFileSync('admin-blog.js', 'utf8');
assert.match(admin, /window\.shellProductLink\(product\[1\]\)/);
const adminPage = readFileSync('admin.html', 'utf8');
assert.ok(adminPage.indexOf('/product-links.js') < adminPage.indexOf('admin-blog.js'), 'shared helper must load before admin blog preview');
const kili = readFileSync('kili-pages.js', 'utf8');
assert.ok(kili.includes('var cartHref = window.shellProductLink(pid)'));
const receipt = readFileSync('receipt.js', 'utf8');
assert.doesNotMatch(receipt, /\\/p\\/[a-z0-9-]+\\.html|classic\\.html/i);
assert.ok(generator.includes('seo-links:start')); // Homepage crawler links remain in their dedicated block
const sitemap = readFileSync('seo-extras.mjs', 'utf8');
assert.ok(sitemap.includes('${SITE}/p/${f}')); // sitemap-products.xml keeps canonical /p/ URLs
assert.ok(SEO_SURFACE_ALLOWLIST.length === 5);

console.log('OK: customer-facing product links use the mobile shell; SEO-only /p/ surfaces remain allowlisted.');
