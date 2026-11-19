import assert from 'node:assert/strict';
import fs from 'node:fs';

const generator = fs.readFileSync('generate-products.mjs', 'utf8');
const admin = fs.readFileSync('catalog-v10.js', 'utf8');

assert.match(generator, /sku:\s*String\(p\.product_code\s*\|\|\s*p\.id\)/,
  'Single-product JSON-LD must use the permanent product code as SKU');
assert.match(generator, /sku:\s*String\(v\.product_code\s*\|\|\s*v\.id\)/,
  'Variant JSON-LD must use each variant row product code as SKU');
assert.match(generator, /Product code:<\/b>/,
  'Product pages must visibly display the permanent product code');
assert.match(generator, /Code: \$\{esc\(v\.product_code/,
  'Each pack-size option must visibly display its own product code');

assert.match(admin, /Product code: '\s*\+\s*esc\(p\.product_code/,
  'Admin edit form must show the assigned, non-editable code');
assert.match(admin, /Code: '\s*\+\s*esc\(p\.product_code/,
  'Admin product cards must show the assigned code');
assert.match(admin, /\['Product code', 'Item'/,
  'Admin CSV backup must export product codes');
assert.match(admin, /p\.product_code, catName/,
  'Admin search must index product codes');
assert.doesNotMatch(admin, /row\.product_code\s*=/,
  'Admin must not overwrite database-generated codes');

console.log('PASS: Product codes are displayed on product pages, variant options, admin cards and edit forms; searchable and exported; JSON-LD uses permanent codes.');
