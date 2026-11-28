// Protect the existing Google indexing contract without changing any live URLs or directives.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const generator = readFileSync('generate-products.mjs', 'utf8');
const robots = readFileSync('robots.txt', 'utf8');
const workflow = readFileSync('.github/workflows/product-pages.yml', 'utf8');

// Every generated product/category page must retain a self-referencing canonical
// and be indexable by default. Query refinements are handled separately.
assert.match(generator, /<link rel="canonical" href="\$\{SITE\}\$\{path\}">/);
// The generator uses a shared template: verify its indexable default and that the
// resulting robots meta tag is populated from that option (not a brittle literal).
assert.ok(generator.includes("robots = 'index, follow, max-image-preview:large'"), 'generated pages must default to index, follow and large image previews');
assert.ok(generator.includes('<meta name="robots" content="${esc(robots)}">'), 'generated pages must render the configured robots directive');
assert.match(generator, /\["search","sort","filter"\]/);
assert.match(generator, /noindex,follow/);

// Keep parameter URLs crawlable so Google can see the noindex directive.
// Keep the published sitemap endpoints discoverable.
assert.match(robots, /^User-agent: \*/m);
assert.match(robots, /^Allow: \/$/m);
assert.doesNotMatch(robots, /^Disallow: \/(p|c|blog|guides)\//m);
assert.match(robots, /^Sitemap: https:\/\/stermontarcade\.co\.ke\/sitemap\.xml$/m);
assert.match(robots, /^Sitemap: https:\/\/stermontarcade\.co\.ke\/sitemap-products\.xml$/m);
// The build must rebuild the root sitemap from current active catalogue page outputs,
// preserving editorial URLs while replacing stale product/category URLs.
assert.match(generator, /previousSitemap\.matchAll\(\/<url>/);
assert.match(generator, /sitemapUrls\.map\(u =>/);
assert.match(generator, /writeFileSync\('sitemap\.xml'/);
assert.match(generator, /writeFileSync\('robots\.txt'/);
assert.ok(generator.includes("startsWith(SITE + '/p/')"));
assert.ok(generator.includes("startsWith(SITE + '/c/')"));
// Product hero/card images reserve a square box to reduce layout shift.
assert.match(generator, /aspect-ratio:1\/1/);
// Image optimisation now goes through the ImageKit Web Proxy (imagekit-url.js); the
// original source URLs stay in the catalogue data. Supabase Storage transforms were
// removed in the Neon migration, so the old SUPABASE_IMAGE_TRANSFORMS probe is no longer checked.
assert.match(generator, /createRequire\(import\.meta\.url\)\('\.\/imagekit-url\.js'\)/);
assert.match(generator, /optimizedImageUrl = \(source, width\) => imageKitUrl\(source, width\)/);
assert.match(generator, /optimizedImageUrl\(u, 320\)/);
assert.match(generator, /optimizedImageUrl\(u, 900\)/);

// Sitemaps must not list noindex or canonicalised-elsewhere pages.
await import('./sitemap-indexable.test.mjs');
assert.match(generator, /isIndexablePage\(/);

// Ensure this protection test remains part of the production page-build gate.
assert.match(workflow, /node seo-indexing-guard\.test\.mjs/);

// Variant pack URLs must be full, self-canonical product pages with their own offer URLs.
assert.ok(generator.includes('const pageProducts = products;'), 'only real products and pack sizes get full pages');
assert.ok(!generator.includes('legacyPageProducts'), 'old addresses must not be duplicate full pages');
assert.ok(generator.includes('const packLabelOf = p =>'), 'missing variant labels should be recovered only from explicit pack quantities in product names');
assert.ok(generator.includes('p.variants?.find(v => v.id === p.id)'));
assert.ok(generator.includes("encodeURIComponent(sl(v.id)) + '.html'"));
// Historical slugs are loaded from Neon; do not silently query the retired Supabase table.
assert.ok(generator.includes('async function getHistoricalSlugs()'));
assert.ok(generator.includes('product_slug_redirects?select=old_slug,product_id'));
assert.ok(!generator.includes('SB}/rest/v1/product_slug_redirects'));
assert.ok(generator.includes('Old product addresses forward to the current page'), 'old addresses must forward to the current page');
assert.ok(generator.includes('<title>Redirecting'), 'old addresses must be redirect stubs, never duplicate pages');

console.log('SEO indexing guard: canonical, robots, variants, historical product URLs and sitemap checks passed.');
