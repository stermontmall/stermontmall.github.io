/* Stermont Arcade service worker (v3): NETWORK-FIRST with revalidation.
   Pages (HTML), data files (.json) and the site's own scripts/styles (.js, .css: they build product names, prices and badges) are always re-checked with the server (cache:'no-cache' = conditional request, a cheap 304 when unchanged),
   so a product page rebuilt by the bot shows its new title/description straight away instead of waiting out GitHub Pages' 10-minute browser cache.
   The cache is only an offline fallback. Only successful same-origin responses are stored. Supabase (cross-origin) is never touched here. */
var C = 'stermont-v4', SHELL = ['/', '/index.html', '/manifest.json', '/icon-192.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(C).then(function (c) {
    return c.addAll(SHELL.map(function (u) { return new Request(u, { cache: 'reload' }); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (k) {
    return Promise.all(k.filter(function (x) { return x !== C; }).map(function (x) { return caches.delete(x); }));
  }).then(function () { return self.clients.claim(); }));
});
function wantsFresh(r, u) {
  return r.mode === 'navigate' || r.destination === 'document' || u.pathname.slice(-1) === '/' || /\.(html|json|js|css)$/i.test(u.pathname);
}
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  var req = r;
  if (wantsFresh(r, u)) { try { req = new Request(r, { cache: 'no-cache' }); } catch (err) { req = r; } }
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok && res.type === 'basic') { var cp = res.clone(); caches.open(C).then(function (c) { return c.put(r, cp); }); }
    return res;
  }).catch(function () {
    return caches.match(r).then(function (m) { return m || caches.match('/index.html'); });
  }));
});
