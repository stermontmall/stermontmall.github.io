import assert from 'node:assert/strict';
import { renderHomeGridFallback } from './home-grid-ssr.mjs';

const rows = [
  { name: 'Sprayer & <Nozzle>', price: 1250, stock: 9, href: '/p/spray-1.html', image: 'https://stermontarcade.co.ke/product-images/spray.webp' },
  { name: 'External Photo Item', price: 999, stock: 2, href: '/p/external-photo.html', image: 'https://images.example/external.webp' },
  { name: 'Sold Out Item', price: 500, stock: 0, href: '/p/sold-out.html' },
  { name: 'Unknown Stock Item', price: 500, stock: null, href: '/p/unknown-stock.html' },
  { name: 'Unsafe Link', price: 500, stock: 3, href: 'https://evil.example/p.html' },
  { name: 'Second Item', price: 2000, stock: 1, href: '/p/second.html' }
];
const html = renderHomeGridFallback(rows, { limit: 8 });
assert.equal((html.match(/ssr-product-card/g) || []).length, 2);
assert.match(html, /href="\/p\/spray-1\.html"/);
assert.match(html, /Sprayer &amp; &lt;Nozzle&gt;/);
assert.match(html, /KSh 1,250/);
assert.doesNotMatch(html, /Sold Out Item|Unknown Stock Item|Unsafe Link/);
assert.doesNotMatch(html, /images\\.example/);
assert.match(html, /loading=\\"eager\\"/);
assert.match(html, /fetchpriority=\\"high\\"/);
assert.equal(renderHomeGridFallback(rows, { limit: 0 }), '');
console.log('OK: homepage SSR eligibility, local URLs, escaping and KES prices');
