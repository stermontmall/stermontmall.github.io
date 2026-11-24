// Regression guards for the published product URL contract.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { slugifyNewProduct } from './product-slug.mjs';

const require = createRequire(import.meta.url);
const productLink = require('./product-links.js');
const generator = readFileSync('generate-products.mjs', 'utf8');
const admin = readFileSync('neon-admin.html', 'utf8');
const normalizer = readFileSync('product-link-normalizer.mjs', 'utf8');
const workflow = readFileSync('.github/workflows/product-pages.yml', 'utf8');

assert.equal(productLink('CoverMax-500-ML'), 'https://stermontarcade.co.ke/p/covermax-500-ml.html');
assert.equal(productLink('covermax-500-ml'), 'https://stermontarcade.co.ke/p/covermax-500-ml.html');
assert.equal(productLink('../bad slug'), 'https://stermontarcade.co.ke/');
assert.equal(slugifyNewProduct('Termidor 96 SC Termiticide with 1 Litre', '1 litre'), 'termidor-96-sc-termiticide-1-litre');
assert.equal(slugifyNewProduct('Zagro Ultraxide Disinfectant and Disinfectant 5 Litre', '5 litre'), 'zagro-ultraxide-disinfectant-5-litre');
assert.ok(slugifyNewProduct('Acme Brand Model ABC Pest Control Concentrate', '500 ml').split('-').length <= 7);
assert.match(admin, /slugifyNewProduct\(suppliedSlug\|\|name,suppliedSlug\?"":unit\)/);
assert.ok(generator.includes('<link rel="canonical" href="${SITE}${path}">'));
assert.match(generator, /'@type': 'Product', name: p\.name, url: SITE \+ path/);
assert.match(generator, /offers: \{ '@type': 'Offer', url: SITE \+ path, priceCurrency: 'KES', price: Number\(Math\.round\(Number\(p\.price\)/);
assert.match(generator, /availability: 'https:\/\/schema\.org\/' \+ \(inStock \? 'InStock' : 'OutOfStock'\)/);
assert.match(generator, /sku: String\(p\.product_code \|\| p\.id\)/);
assert.match(generator, /\.\.\.productIdentifiers\(p\)/);
assert.match(admin, /function productSlugify\(name,unit\)/);
assert.match(admin, /new Set\(\["a","an","and","for","the","with","of","to"\]\)/);
assert.match(admin, /productSlugify\(suppliedSlug\|\|name,suppliedSlug\?"":unit\)/);
assert.match(admin, /products\?select=id&slug=eq\./);
assert.match(normalizer, /shellProductLink\(slug\)/);
assert.match(normalizer, /decodeURIComponent\(slug\)\.toLowerCase\(\)/);
assert.match(workflow, /node product-url-policy\.test\.mjs/);

console.log('Product URL policy: lowercase absolute links, canonical Product schema and new-only slug generation passed.');
