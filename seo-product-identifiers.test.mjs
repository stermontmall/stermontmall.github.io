import assert from 'node:assert/strict';
import { productIdentifiers } from './seo-product-identifiers.mjs';

assert.deepEqual(productIdentifiers({}), {});
assert.deepEqual(productIdentifiers({ gtin: '4006381333931', mpn: 'AB-123' }), { gtin13: '4006381333931', mpn: 'AB-123' });
assert.deepEqual(productIdentifiers({ gtin: ' 4006-3813-33931 ' }), { gtin13: '4006381333931' });
assert.deepEqual(productIdentifiers({ gtin: '4006381333932' }), {}); // invalid check digit
assert.deepEqual(productIdentifiers({ gtin: '12345', mpn: 'x'.repeat(71) }), {});
console.log('Optional product identifiers: validation passed.');
