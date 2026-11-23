import assert from 'node:assert/strict';
import { SAFE_A11Y_PATHS, safeA11yStyle } from './seo-safe-a11y.mjs';

assert.equal(SAFE_A11Y_PATHS.length, 7);
for (const path of SAFE_A11Y_PATHS) {
  const style = safeA11yStyle(path);
  assert.match(style, /nav\.bc,footer\{background-color:#f8f9fd\}/);
  assert.match(style, /id="stm-safe-a11y"/);
}
for (const path of ['/','/c/computing.html','/c/fashion.html','/p/unlisted-product.html','']) {
  assert.equal(safeA11yStyle(path), '', 'unlisted routes must remain unchanged: ' + path);
}
console.log('OK: 12 safe-route accessibility allowlist checks, 0 violations');
