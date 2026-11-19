import assert from 'node:assert/strict';
import { inject, injectCat, MARK } from './seo-shell-redirect.mjs';

const page = '<!doctype html><html><head><title>SEO title</title><link rel="canonical" href="https://stermontarcade.co.ke/p/example.html"></head><body>SEO fallback</body></html>';
const product = inject(page, 'termidor-96-sc-1-litre');
assert.ok(product.includes(MARK), 'product page gets the shell bootstrap');
assert.ok(product.includes('"product"'), 'product page routes through the product deep link');
assert.ok(product.includes('location.replace(u)'), 'product route launches the full shell');
assert.ok(product.includes('rel="canonical"'), 'crawlable product metadata remains available');
assert.equal(inject(product, 'termidor-96-sc-1-litre'), product, 'product bootstrap is idempotent');
const category = injectCat(page, 'fumigation-chemicals');
assert.ok(category.includes('"cat"'), 'category page routes through the category deep link');
const stub = '<html><head><meta http-equiv="refresh" content="0;url=/p/example.html"></head><body></body></html>';
assert.equal(inject(stub, 'extra-pack'), stub, 'existing extra-pack aliases remain untouched');
console.log('seo-shell-redirect tests passed');