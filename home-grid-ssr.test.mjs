import assert from 'node:assert/strict';
import { renderHomeGridFallback } from './home-grid-ssr.mjs';

const rows = [
  { name: 'Sprayer & <Nozzle>', price: 1250, stock: 9, href: 'https://stermontarcade.co.ke/?product=spray-1', image: 'https://images.example/spray.webp' },
  { name: 'Sold Out Item', price: 500, stock: 0, href: 'https://stermontarcade.co.ke/?product=sold-out' },
  { name: 'Unknown Stock Item', price: 500, stock: null, href: 'https://stermontarcade.co.ke/?product=unknown-stock' },
  { name: 'Unsafe Link', price: 500, stock: 3, href: 'https://evil.example/?product=evil' },
  { name: 'Second Item', price: 2000, stock: 1, href: 'https://stermontarcade.co.ke/?product=second' }
];
const html = renderHomeGridFallback(rows, { limit: 8 });
assert.equal((html.match(/ssr-product-card/g) || []).length, 2);
assert.match(html, /href="https:\/\/stermontarcade\.co\.ke\/\?product=spray-1"/);
assert.doesNotMatch(html, /href="[^"]*\/p\//);
assert.match(html, /Sprayer &amp; &lt;Nozzle&gt;/);
assert.match(html, /KSh 1,250/);
assert.doesNotMatch(html, /Sold Out Item|Unknown Stock Item|Unsafe Link/);
assert.equal(renderHomeGridFallback(rows, { limit: 0 }), '');
console.log('OK: homepage SSR eligibility, shell URLs, escaping and KES prices');
