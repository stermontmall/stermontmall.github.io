// Ensure every product represented by the active Neon catalogue has a generated /p/ page.
import { existsSync, readFileSync } from 'node:fs';

export function missingPages(products, hasPage) {
  const missing = [];
  for (const product of Array.isArray(products) ? products : []) {
    const id = String(product?.id ?? '').trim();
    const slug = String(product?.slug ?? '').trim();
    const candidates = [...new Set([slug, id].filter(Boolean).map(value => value + '.html'))];
    if (!candidates.some(hasPage)) missing.push(slug || id || '(unknown product)');
  }
  return missing;
}

function main() {
  let names;
  try {
    names = JSON.parse(readFileSync('product-names.json', 'utf8'));
  } catch (error) {
    console.error('Cannot read product-names.json generated from the active Neon catalogue:', error.message);
    process.exitCode = 1;
    return;
  }
  if (!names || typeof names !== 'object' || Array.isArray(names)) {
    console.error('product-names.json is not a product-name map.');
    process.exitCode = 1;
    return;
  }

  const products = Object.keys(names).map(id => ({ id, slug: id }));
  const missing = missingPages(products, file => existsSync('p/' + file));
  if (missing.length) {
    console.error(`Missing generated product pages for ${missing.length} active catalogue item(s): ${missing.slice(0, 30).join(', ')}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Product page guard passed: all ${products.length} active catalogue entries have generated pages.`);
}

if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) main();
