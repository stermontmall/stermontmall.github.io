// Browser behaviour of imagekit-url.js, run in a Node vm with a minimal window (the real Chromium run is in mobile-shell/shell.test.py).
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const code = readFileSync(new URL('./imagekit-url.js', import.meta.url), 'utf8');
const SB = 'https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/a.jpg';
const SB2 = 'https://oewvtbnmyombbtggamor.supabase.co/storage/v1/object/public/product-images/b.jpg';
const PAGES = 'https://stermontmall.github.io/product-photos/c.webp';
function boot(store = {}) {
  let listener = null;
  const win = { document: {}, Image: class { set src(v) { this._s = v; } }, setTimeout: () => 0, localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } },
    addEventListener: (t, fn) => { if (t === 'error') listener = fn; } };
  vm.runInNewContext(code, win); // eslint-disable-line
  const fire = (img) => { let stopped = false; listener({ target: img, stopImmediatePropagation: () => { stopped = true; } }); return stopped; };
  return { win, fire, store };
}
const img = (src, fallbacks) => { const a = { src, 'data-fallbacks': fallbacks }; return { tagName: 'IMG', getAttribute: (k) => (k === 'src' ? a.src : a[k] ?? null), setAttribute: (k, v) => { a[k] = String(v); }, get src() { return a.src; }, set src(v) { a.src = v; }, attrs: a }; };

// 1. Healthy Supabase: original URL is used (ImageKit proxy not proven).
let t = boot();
assert.equal(t.win.STM_IMAGE_URL(SB, 480), SB);
// 2. An original Supabase photo fails (HTTP 402): placeholder, Supabase marked down, later photos skip the broken URL entirely.
let el = img(SB, '[]');
assert.equal(t.fire(el), true);
assert.equal(el.src, '/placeholder.svg'); assert.equal(el.attrs['data-photo-unavailable'], 'true');
assert.equal(t.win.STM_IMAGE_URL.supabaseDown(), true);
assert.equal(t.win.STM_IMAGE_URL(SB2, 480), '/placeholder.svg');
// 3. Gallery: a verified non-Supabase photo wins over the placeholder; Supabase gallery entries are skipped.
t = boot(); el = img(SB, JSON.stringify([SB2, PAGES, 'https://img.test/z.jpg']));
t.fire(el); assert.equal(el.src, PAGES); assert.equal(el.attrs['data-fallbacks'], JSON.stringify(['https://img.test/z.jpg']));
// 4. Multi-pack product: every pack photo is Supabase-only -> placeholder, never a broken URL.
t = boot(); el = img(SB, JSON.stringify([SB2, SB])); t.fire(el); assert.equal(el.src, '/placeholder.svg');
// 5. Broken ImageKit proxy URL while Supabase is healthy: one retry of the original; if that fails too, placeholder.
t = boot(); el = img('https://ik.imagekit.io/w6hxfnwmw/supabase/tr:w-480,q-75,f-auto/' + SB, '[]');
t.fire(el); assert.equal(el.src, SB); t.fire(el); assert.equal(el.src, '/placeholder.svg');
// 6. Broken ImageKit proxy URL while Supabase is known down: no retry of the broken original.
t = boot({ 'stm.supabase.photos.down.v1': String(Date.now()) }); el = img('https://ik.imagekit.io/w6hxfnwmw/supabase/tr:w-480,q-75,f-auto/' + SB, '[]');
t.fire(el); assert.equal(el.src, '/placeholder.svg');
// 7. Non-Supabase sources keep the old behaviour; the placeholder itself never loops.
t = boot(); el = img('https://ik.imagekit.io/w6hxfnwmw/supabase/tr:w-480,q-75,f-auto/' + PAGES, '[]'); assert.equal(t.fire(el), true); assert.equal(el.src, PAGES);
el = img('/placeholder.svg', '[]'); assert.equal(t.fire(el), true); assert.equal(el.src, '/placeholder.svg');
// 8. A stale down verdict (older than 10 minutes) is ignored.
t = boot({ 'stm.supabase.photos.down.v1': String(Date.now() - 11 * 60 * 1000) }); assert.equal(t.win.STM_IMAGE_URL(SB, 480), SB);
console.log('ImageKit/Supabase fallback tests passed.');
