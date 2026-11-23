// Guard: customer-facing product links use clean, crawlable static product URLs.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const shellProductLink = createRequire(import.meta.url)('./product-links.js');
assert.equal(shellProductLink('premise-200-sc-termiticide-50-ml'), 'https://stermontarcade.co.ke/p/premise-200-sc-termiticide-50-ml.html');
assert.equal(shellProductLink(''), 'https://stermontarcade.co.ke/');
const helper = readFileSync('product-links.js', 'utf8');
assert.ok(helper.includes("return 'https://stermontarcade.co.ke/p/'"));
assert.ok(!helper.includes('?product='));
const homepage = readFileSync('index.html', 'utf8');
assert.ok(homepage.includes('<link rel="canonical" href="https://stermontarcade.co.ke/">'));
assert.ok(homepage.includes("location.replace('/p/'"));
const homeGrid = (homepage.match(/<ul id="grid"[\s\S]*?<\/ul>/) || [])[0] || '';
assert.match(homeGrid, /href="(?:https:\/\/stermontarcade\.co\.ke)?\/p\/[a-z0-9-]+\.html"/i);
assert.ok(!homeGrid.includes('?product='));
assert.ok(homepage.includes('<!-- seo-links:start -->') && homepage.includes('<!-- seo-links:end -->'));
const generator = readFileSync('generate-products.mjs', 'utf8');
assert.ok(generator.includes('const normalizeCustomerProductLinks = html =>'));
assert.ok(generator.includes('$' + '{normalizeCustomerProductLinks(body)}'));
for (const marker of ['href="' + '$' + '{shellProductLink(sl(p.id))}"', '$' + '{shellProductLink(v.slug || p.slug || p.id)}']) {
  assert.ok(generator.includes(marker), 'product generator must use canonical helper for: ' + marker);
}
assert.ok(generator.includes('<a href="' + '$' + '{shellProductLink(sl(a.to))}">Continue to the product page</a>'));
for (const file of ['seo-related-fill.mjs','seo-pest/blog-build.mjs','blog-write.mjs','seo-kenya.mjs','services/build-services.mjs','recent-orders.js','wa-float.js','product-trust.js']) {
  assert.ok(readFileSync(file, 'utf8').includes('shellProductLink'), file + ' must use the shared static URL helper');
}
assert.ok(existsSync('no-classic-hop.test.mjs'));
if (process.env.STM_CHECK_GENERATED_PRODUCT_PAGES === '1') {
  const htmlFiles = [];
  const collect = dir => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const path = join(dir, name), info = statSync(path);
      if (info.isDirectory()) collect(path);
      else if (name.endsWith('.html')) htmlFiles.push(path);
    }
  };
  for (const dir of ['p','c','guides','blog','services','pest-control']) collect(dir);
  for (const file of ['index.html','products.html','fashion.html','cars-for-sale.html']) if (existsSync(file)) htmlFiles.push(file);
  const bad = [];
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    const body = html.replace(/<head\b[\s\S]*?<\/head>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '');
    const anchors = [...body.matchAll(/<a\b([^>]*)href=(['"])(.*?)\2/gi)];
    if (anchors.some(m => /\?product=/i.test(m[3]) && !/\bdata-pack-cart\b/i.test(m[1]))) bad.push(file + ': legacy product query href');
  }
  assert.deepEqual(bad, [], bad.join('\n'));
  console.log('OK: static product URLs are used across ' + htmlFiles.length + ' customer-facing HTML files');
}
