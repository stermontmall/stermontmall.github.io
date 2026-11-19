import assert from 'node:assert/strict';
import { inject, injectCat, MARK } from './seo-shell-redirect.mjs';

const page = '<!doctype html><html><head><title>SEO title</title><link rel="canonical" href="https://stermontarcade.co.ke/p/example.html"></head><body>SEO fallback</body></html>';
const product = inject(page, 'termidor-96-sc-1-litre');
assert.equal(product, page, 'a product page remains on its own canonical URL');
assert.ok(product.includes('rel="canonical"') && product.includes('SEO fallback'), 'product SEO metadata and fallback content stay intact');
assert.ok(!product.includes(MARK) && !product.includes('location.replace'), 'no product redirect is added');
assert.equal(inject(product, 'termidor-96-sc-1-litre'), product, 'product cleanup is idempotent');

const oldProduct = page.replace('</head>', '<!--stm-shell-route--><script>location.replace("/?product=example")</script></head>');
assert.equal(inject(oldProduct, 'example'), page, 'legacy product route bootstrap is stripped');
const oldCategory = page.replace('</head>', '<!--stm-shell-cat--><script>location.replace("/?cat=example")</script></head>');
assert.equal(injectCat(oldCategory, 'example'), page, 'legacy category route bootstrap is stripped');
const oldEarly = page.replace('</head>', '<!--stm-early--><script>location.replace("/?product=example")</script></head>');
assert.equal(inject(oldEarly, 'example'), page, 'older early redirect is stripped');

const category = injectCat(page, 'fumigation-chemicals');
assert.equal(category, page, 'a category page remains on its own canonical URL');
assert.ok(!category.includes(MARK) && !category.includes('location.replace'), 'no category redirect is added');

const stub = '<html><head><meta http-equiv="refresh" content="0;url=/p/example.html"></head><body></body></html>';
assert.equal(inject(stub, 'extra-pack'), stub, 'intentional extra-pack redirect stubs remain untouched');
console.log('seo-shell-redirect tests passed');
