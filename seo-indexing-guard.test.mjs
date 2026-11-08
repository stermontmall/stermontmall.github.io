// Protect the existing Google indexing contract without changing any live URLs or directives.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const generator = readFileSync('generate-products.mjs', 'utf8');
const robots = readFileSync('robots.txt', 'utf8');
const workflow = readFileSync('.github/workflows/product-pages.yml', 'utf8');

// Every generated product/category page must retain a self-referencing canonical
// and be indexable by default. Query refinements are handled separately.
assert.match(generator, /<link rel="canonical" href="\$\{SITE\}\$\{path\}">/);
assert.match(generator, /<meta name="robots" content="index, follow, max-image-preview:large">/);
assert.match(generator, /\["search","sort","filter"\]/);
assert.match(generator, /noindex,follow/);

// Keep parameter URLs crawlable so Google can see the noindex directive.
// Keep the published sitemap endpoints discoverable.
assert.match(robots, /^User-agent: \*/m);
assert.match(robots, /^Allow: \/$/m);
assert.doesNotMatch(robots, /^Disallow: \/(p|c|blog|guides)\//m);
assert.match(robots, /^Sitemap: https:\/\/stermontarcade\.co\.ke\/sitemap\.xml$/m);
assert.match(robots, /^Sitemap: https:\/\/stermontarcade\.co\.ke\/sitemap-products\.xml$/m);

// Ensure this protection test remains part of the production page-build gate.
assert.match(workflow, /node seo-indexing-guard\.test\.mjs/);

console.log('SEO indexing guard: canonical, robots, parameter handling and sitemap checks passed.');
