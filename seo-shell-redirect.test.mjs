import assert from 'node:assert/strict';
import { inject, injectCat, MARK } from './seo-shell-redirect.mjs';

const page = '<!doctype html><html><head><title>SEO title</title><link rel="canonical" href="https://stermontarcade.co.ke/p/example.html"></head><body>SEO fallback</body></html>';
const product = inject(page, 'termidor-96-sc-1-litre');
assert.ok(product.includes('rel="canonical"') && product.includes('SEO fallback'), 'product SEO metadata and fallback content stay intact');
assert.ok(product.includes(MARK) && product.includes('location.replace(') && product.includes('/?product=termidor-96-sc-1-litre'), 'product route boots into the full mobile shell');
assert.equal(inject(product, 'termidor-96-sc-1-litre'), product, 'product route injection is idempotent');

const oldProduct = page.replace('</head>', '<!--stm-shell-route--><script>location.replace("/?product=example")</script></head>');
assert.ok(inject(oldProduct, 'example').includes('location.replace(') && inject(oldProduct, 'example').includes('/?product=example'), 'legacy product route is normalized to the current shell route');
const oldCategory = page.replace('</head>', '<!--stm-shell-cat--><script>location.replace("/?cat=example")</script></head>');
assert.ok(injectCat(oldCategory, 'example').includes('location.replace(') && injectCat(oldCategory, 'example').includes('/?cat=example'), 'legacy category route is normalized to the current shell route');

const category = injectCat(page, 'fumigation-chemicals');
assert.ok(category.includes('rel="canonical"') && category.includes('SEO fallback'), 'category SEO metadata and fallback content stay intact');
assert.ok(category.includes(MARK) && category.includes('location.replace(') && category.includes('/?cat=fumigation-chemicals'), 'category route boots into the full mobile shell');
assert.equal(injectCat(category, 'fumigation-chemicals'), category, 'category route injection is idempotent');

const stub = '<html><head><meta http-equiv="refresh" content="0;url=/p/example.html"></head><body></body></html>';
assert.equal(inject(stub, 'extra-pack'), stub, 'intentional extra-pack redirect stubs remain untouched');
console.log('seo-shell-redirect tests passed');
