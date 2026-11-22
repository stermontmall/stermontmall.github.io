import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const imageKitUrl = createRequire(import.meta.url)('./imagekit-url.js');
assert.equal(imageKitUrl('https://stermontmall.github.io/product-photos/test.jpg', 480),
  'https://ik.imagekit.io/w6hxfnwmw/supabase/tr:w-480,q-75,f-auto/https://stermontmall.github.io/product-photos/test.jpg');
assert.equal(imageKitUrl('https://ik.imagekit.io/w6hxfnwmw/photo.jpg', 320), 'https://ik.imagekit.io/w6hxfnwmw/photo.jpg');
assert.equal(imageKitUrl('https://ik.imagekit.io/other/photo.jpg', 320), 'https://ik.imagekit.io/other/photo.jpg');
assert.equal(imageKitUrl('', 320), '');
assert.equal(imageKitUrl(null, 320), null);
console.log('ImageKit URL helper tests passed.');
