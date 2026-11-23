import test from 'node:test';
import assert from 'node:assert/strict';
import { extractJsonImageCandidates } from './imagekit-source-parser.mjs';

test('extracts WooCommerce image src URLs and preserves distinct candidates', () => {
  const data = { images: [{ src: 'https://cdn.example.test/a.jpg' }, { src: 'https://cdn.example.test/b.webp' }] };
  assert.deepEqual(extractJsonImageCandidates(data, 'https://supplier.example.test/product/'), [
    'https://cdn.example.test/a.jpg',
    'https://cdn.example.test/b.webp'
  ]);
});

test('extracts WordPress media source_url and relative image paths', () => {
  const data = { source_url: '/uploads/item.png', title: { rendered: 'Product' }, media_details: { sizes: { large: { source_url: '/uploads/item-large.png' } } } };
  assert.deepEqual(extractJsonImageCandidates(data, 'https://supplier.example.test/wp-json/wp/v2/media/1'), [
    'https://supplier.example.test/uploads/item.png',
    'https://supplier.example.test/uploads/item-large.png'
  ]);
});

test('ignores ordinary text, non-image URL fields, duplicates and insecure URLs', () => {
  const data = { name: 'Pest sprayer', link: 'https://supplier.example.test/product/', images: ['http://insecure.example.test/a.jpg', 'https://cdn.example.test/a.jpg', 'https://cdn.example.test/a.jpg'] };
  assert.deepEqual(extractJsonImageCandidates(data, 'https://supplier.example.test/'), ['https://cdn.example.test/a.jpg']);
});
