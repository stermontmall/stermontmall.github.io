import assert from 'node:assert/strict';
import { renderHomeGridFallback } from './home-grid-ssr.mjs';

const rows = [
  { id: 'spray-1', name: 'Sprayer & <Nozzle>', price: 1250, stock: 9, href: '/p/spray-1.html', image: 'https://images.example/spray.webp' },
  { id: 'sold-out', name: 'Sold Out Item', price: 500, stock: 0, href: '/p/sold-out.html', image: 'https://images.example/sold.webp' },
  { id: 'unknown-stock', name: 'Unknown Stock Item', price: 500, stock: null, href: '/p/unknown-stock.html' },
  { id: 'unsafe-link', name: 'Unsafe Link', price: 500, stock: 3, href: 'https://evil.example/p.html' },
  { id: 'second', name: 'Second Item', price: 2000, stock: 1, href: '/p/second.html' }
];

const html = renderHomeGridFallback(rows, { limit: 8 });
assert.equal((html.match(/ssr-product-card/g) || []).length, 2, 'only positive-stock products with safe local product URLs render');
assert.match(html, /href="\\/p\\/spray-1\\.html"/);
assert.match(html, /Sprayer &amp; &lt;Nozzle&gt;/, 'product text is HTML-escaped');
assert.match(html, /KSh 1,250/);
assert.doesNotMatch(html, /Sold Out Item|Unknown Stock Item|Unsafe Link/);
assert.doesNotMatch(html, /images\\.example\\/sold/);
assert.equal(renderHomeGridFallback(rows, { limit: 0 }), '');
console.log('OK: homepage SSR grid eligibility, safe links, escaping, prices and limit');
