import assert from 'node:assert/strict';
import fs from 'node:fs';

const generator = fs.readFileSync('generate-products.mjs', 'utf8');
const admin = fs.readFileSync('neon-admin.html', 'utf8');

assert.match(generator, /id,product_code,created_at/,
  'The public product query must fetch product_code for every generated page');
assert.match(generator, /sku:\s*String\(p\.product_code\s*\|\|\s*p\.id\)/,
  'Single-product JSON-LD must use the permanent product code as SKU');
assert.match(generator, /sku:\s*String\(v\.product_code\s*\|\|\s*v\.id\)/,
  'Variant JSON-LD must use each variant row product code as SKU');
assert.match(generator, /Product code:<\\/b>/,
  'Product pages must visibly display the permanent product code');
assert.match(generator, /Code: \$\{esc\(v\.product_code/,
  'Each pack-size option must visibly display its own product code');

// The current Neon admin is neon-admin.html. catalog-v10.js was removed
// during the Neon migration, so the old test target caused every page build
// to stop before generation and sitemap output.
assert.match(admin, /Permanent product code/,
  'Neon admin must label the permanent product-code field');
assert.match(admin, /name="product_code"/,
  'Neon admin product form must expose the product_code field');

console.log('PASS: Product codes are rendered on generated product pages and variants, used in JSON-LD, and available in the Neon admin form.');
