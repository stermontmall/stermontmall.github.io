// Guard: all customer-facing product links use the sitemap's static /p/<slug>.html URL.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const shellProductLink = createRequire(import.meta.url)('./product-links.js');
assert.equal(shellProductLink('premise-200-sc-termiticide-50-ml'), 'https://stermontarcade.co.ke/p/premise-200-sc-termiticide-50-ml.html');

const homepage = readFileSync('index.html', 'utf8');
assert.match(homepage, /<link rel="canonical" href="https:\/\/stermontarcade\.co\.ke\/">/, 'homepage canonical stays on the root URL');
assert.ok(homepage.includes("var legacyProduct = q.get('product')"), 'legacy query product links are recognized');
assert.ok(homepage.includes("location.replace(productPath"), 'legacy query product links replace to the static product URL');
assert.ok(homepage.includes("canonical.href = 'https://stermontarcade.co.ke' + productPath"), 'legacy query redirect sets the product canonical before navigating');
assert.ok(homepage.includes('<!-- seo-links:start -->') && homepage.includes('<!-- seo-links:end -->'), 'homepage SEO crawl links remain present');
assert.ok(homepage.includes('id="pp-whatsapp"'), 'the full mobile-shell product page includes a WhatsApp order action');
const homeGrid = (homepage.match(/<ul id="grid"[\s\S]*?<\/ul>/) || [])[0] || '';
assert.ok(homeGrid.includes('https://stermontarcade.co.ke/p/'), 'homepage SSR cards use static product URLs');
assert.doesNotMatch(homeGrid, /\?product=/, 'homepage SSR cards contain no query product URLs');

const helper = readFileSync('product-links.js', 'utf8');
assert.match(helper, /\/p\/.*\.html/, 'shared product-link helper generates static URLs');
assert.doesNotMatch(helper, /\?product=/, 'shared product-link helper never generates query product URLs');

const generator = readFileSync('generate-products.mjs', 'utf8');
assert.ok(generator.includes('<link rel="canonical" href="${SITE}${path}">'), 'generated product pages self-canonicalize to their static path');
assert.ok(generator.includes('static-product-purchase.js'), 'generated product pages load the static purchase fallback');
assert.ok(generator.includes('data-product-qty') && generator.includes('data-pack-cart'), 'generated product pages expose quantity and Add to Cart controls');
assert.ok(generator.includes('data-product-row-id'), 'variant cart controls use the exact Neon product row ID');
assert.ok(generator.includes("const WHATSAPP = '254789514060'"), 'product WhatsApp orders use +254 789 514 060');
assert.doesNotMatch(generator, /data-pack-cart href="[^"]*\?product=/, 'Add to Cart does not navigate back to query product links');

const purchase = readFileSync('static-product-purchase.js', 'utf8');
assert.ok(purchase.includes("localStorage.getItem('shell.cart')") && purchase.includes("localStorage.setItem('shell.cart'"), 'static product pages share the mobile-shell cart state');
assert.ok(purchase.includes("localStorage.setItem('stm_handoff'"), 'static product pages hand the shared cart to checkout');
assert.ok(purchase.includes("location.href = '/checkout.html'"), 'static product pages open the M-Pesa checkout flow');
assert.ok(purchase.includes('data-cart-checkout') && purchase.includes('data-cart-items'), 'static product pages provide a cart drawer');
assert.ok(purchase.includes('data-qty-plus') && purchase.includes('data-qty-minus'), 'static product pages provide a quantity selector');

const checkout = readFileSync('checkout.html', 'utf8');
assert.ok(checkout.includes("localStorage.getItem('stm_handoff')"), 'checkout consumes the same handoff payload');
assert.ok(checkout.includes('714777') && checkout.includes('0789514060'), 'M-Pesa Paybill details remain present');

const app = readFileSync('mobile-shell/app.js', 'utf8');
assert.ok(app.includes("localStorage.getItem('shell.' + k)"), 'mobile shell reads the shared shell cart');
assert.ok(app.includes("const productUrl ="), 'mobile shell keeps the static product URL in the address bar');
assert.ok(app.includes("https://wa.me/254789514060?text="), 'mobile-shell product WhatsApp orders use +254 789 514 060');
assert.doesNotMatch(app, /s => '\/\?product='/, 'mobile shell fallback links no longer generate query product URLs');

const normalizer = readFileSync('product-link-normalizer.mjs', 'utf8');
assert.ok(normalizer.includes("u.searchParams.get('product')"), 'generated-page normalizer converts legacy query product links');
assert.ok(normalizer.includes('shellProductLink(slug)'), 'generated-page normalizer emits static product links');

const sourceFiles = [];
const skip = new Set(['.git', 'node_modules', 'p', 'c', 'guides', 'blog', 'product-photos', 'assets', 'services', 'pest-control']);
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const file = join(dir, name), info = statSync(file);
    if (info.isDirectory()) walk(file);
    else if (/\.(html|js|mjs|ts|json|css|webmanifest)$/.test(name) && info.size < 3000000) sourceFiles.push(file);
  }
}
walk('.');
const offenders = [];
for (const file of sourceFiles) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    if (/\b(?:href\s*=|\.href\s*=|Link:\s*|window\.open\s*\()[^\n]*\?product=/i.test(line) &&
        !['no-static-share-links.test.mjs', 'product-link-normalizer.mjs', 'blog-build.mjs'].includes(file)) {
      offenders.push(file + ':' + (index + 1) + ': ' + line.trim().slice(0, 220));
    }
  });
}
assert.deepEqual(offenders, [], 'Internal customer-facing links still contain ?product=:\n' + offenders.join('\n'));

if (process.env.STM_CHECK_GENERATED_PRODUCT_PAGES === '1') {
  const generatedDirs = ['p', 'c', 'guides', 'blog', 'services', 'pest-control'];
  const generatedFiles = ['index.html', 'products.html', 'fashion.html', 'cars-for-sale.html'];
  const files = generatedFiles.filter(file => existsSync(file));
  const collect = dir => { if (!existsSync(dir)) return; for (const name of readdirSync(dir)) { const file = join(dir, name), info = statSync(file); if (info.isDirectory()) collect(file); else if (name.endsWith('.html')) files.push(file); } };
  generatedDirs.forEach(collect);
  const bad = [];
  for (const file of files) {
    const html = readFileSync(file, 'utf8');
    if (/\bhref=["'][^"']*\?product=/i.test(html)) bad.push(file);
    if (/^p\//.test(file) && !/http-equiv=["']refresh["']/i.test(html) && !html.includes('<link rel="canonical" href="https://stermontarcade.co.ke' + file.replace(/^p/, '') + '">')) bad.push(file + ' (missing self canonical)');
  }
  assert.deepEqual(bad, [], 'Generated pages contain query product links or missing static canonicals: ' + bad.join(', '));
}
console.log('OK: product links use static /p/<slug>.html URLs; shared cart, quantity, M-Pesa and WhatsApp purchase paths are present.');
