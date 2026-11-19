import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inject, injectCat, MARK } from './seo-shell-redirect.mjs';

const page = '<!doctype html><html><head><title>SEO title</title><link rel="canonical" href="https://stermontarcade.co.ke/p/example.html"></head><body><main><h1>SEO fallback</h1></main></body></html>';
const product = inject(page, 'termidor-96-sc-1-litre');
assert.ok(product.includes(MARK), 'product page receives the full-shell route marker');
assert.ok(product.includes('/shell-route-loader.js?v=1'), 'product page loads the in-place shell loader');
assert.ok(product.includes('rel="canonical"') && product.includes('SEO fallback'), 'product SEO metadata and server-rendered fallback stay intact');
assert.ok(!product.includes('location.replace'), 'product route never redirects to the homepage');
assert.equal(inject(product, 'termidor-96-sc-1-litre'), product, 'product route injection is idempotent');

const oldProduct = page.replace('</head>', '<!--stm-shell-route--><script>location.replace("/?product=example")</script></head>');
const cleanOldProduct = inject(oldProduct, 'example');
assert.ok(!cleanOldProduct.includes('location.replace'), 'legacy product redirect is stripped');
assert.ok(cleanOldProduct.includes('/shell-route-loader.js'), 'legacy product redirect is replaced by in-place hydration');
const oldCategory = page.replace('</head>', '<!--stm-shell-cat--><script>location.replace("/?cat=example")</script></head>');
const cleanOldCategory = injectCat(oldCategory, 'example');
assert.ok(!cleanOldCategory.includes('location.replace'), 'legacy category redirect is stripped');
assert.ok(cleanOldCategory.includes('/shell-route-loader.js'), 'legacy category redirect is replaced by in-place hydration');
const oldEarly = page.replace('</head>', '<!--stm-early--><script>location.replace("/?product=example")</script></head>');
assert.ok(!inject(oldEarly, 'example').includes('location.replace'), 'older early redirect is stripped');

const category = injectCat(page, 'fumigation-chemicals');
assert.ok(category.includes(MARK) && category.includes('/shell-route-loader.js'), 'category page receives the full-shell route loader');
assert.ok(category.includes('rel="canonical"') && category.includes('SEO fallback'), 'category SEO content remains in the original document');

const stub = '<html><head><meta http-equiv="refresh" content="0;url=/p/example.html"></head><body></body></html>';
assert.equal(inject(stub, 'extra-pack'), stub, 'intentional extra-pack redirect stubs remain untouched');

const loader = readFileSync('shell-route-loader.js', 'utf8');
assert.ok(loader.includes("fetch('/')"), 'loader fetches the actual homepage shell');
assert.ok(loader.includes("querySelector('#appbar')") && loader.includes("querySelector('#bottom-nav')"), 'loader verifies the full shell, not just navigation chrome');
assert.ok(loader.includes("originalMain.cloneNode(true)") && loader.includes("document.createElement('details')"), 'loader preserves server-rendered SEO content as an accessible fallback');
assert.ok(loader.includes("loadScript('/mobile-shell/app.js"), 'loader starts the actual mobile-shell application');
const app = readFileSync('mobile-shell/app.js', 'utf8');
assert.ok(app.includes('PRODUCT_PATH') && app.includes('CATEGORY_PATH'), 'the shell recognizes direct product and category paths without query redirects');
console.log('seo-shell-redirect tests passed');
