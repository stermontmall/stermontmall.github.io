// Run: node product-page-design.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const generator = readFileSync('generate-products.mjs','utf8');
const workflow = readFileSync('.github/workflows/product-pages.yml','utf8');
const css = generator.slice(generator.indexOf('const CSS = `'), generator.indexOf('`;\n\nconst shell'));
assert.ok(css.includes('--brand:#6d28d9') && css.includes('--page:#f6f7fb'), 'product pages use the modern storefront palette');
assert.ok(css.includes('.pg>div:first-child') && css.includes('.pg>div:nth-child(2)'), 'photo and purchase details render as separate cards');
assert.ok(css.includes('grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr)'), 'desktop product layout uses a balanced two-column grid');
assert.ok(css.includes('backdrop-filter:blur(12px)') && css.includes('.stk'), 'mobile sticky purchase bar remains styled');
assert.ok(!css.includes('background:#faf9fd') && !css.includes('max-width:920px'), 'legacy narrow classic-HTML styling is removed');
assert.ok(workflow.includes('node product-page-design.test.mjs'), 'design regression test runs in CI');
console.log('product-page-design tests passed');
