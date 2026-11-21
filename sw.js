/* Stermont Arcade service worker (v7): NETWORK-FIRST for pages and data, STALE-WHILE-REVALIDATE for versioned scripts and styles.
   Pages (HTML), data files (.json) and unversioned scripts/styles are always re-checked with the server (cache:'no-cache' = conditional request, a cheap 304 when unchanged),
   so a product page rebuilt by the bot shows its new title/description straight away instead of waiting out GitHub Pages' 10-minute browser cache.
   Scripts and styles whose address carries a version (app.js?v=43, tailwind.css?v=5) are served from the cache at once and refreshed in the background: they are on the
   critical path of every visit (the live product grid waits for app.js), and re-checking them with the server first cost a round trip on every load. Bumping ?v= still gives
   everyone the new file immediately (new address = nothing cached); an edit without a bump reaches a visitor on their next visit.
   The cache is otherwise only an offline fallback. Only successful same-origin responses are stored. Supabase (cross-origin) is never touched here. */
var C = 'stermont-v7', SHELL = ['/', '/index.html', '/manifest.json', '/icon-192.png'];
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
function versionedAsset(r, u) {
  return r.mode !== 'navigate' && /\.(js|css)$/i.test(u.pathname) && /[?&]v=[^&]/.test(u.search);
}
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  if (versionedAsset(r, u)) {
    e.respondWith(caches.open(C).then(function (c) {
      return c.match(r).then(function (hit) {
        var net = fetch(r).then(function (res) {
          if (res && res.status === 200 && res.type === 'basic') c.put(r, res.clone()).catch(function () {});
          return res;
        });
        if (hit) { e.waitUntil(net.catch(function () {})); return hit; }
        return net;
      });
    }));
    return;
  }
  var req = r;
  if (wantsFresh(r, u)) { try { req = new Request(r, { cache: 'no-cache' }); } catch (err) { req = r; } }
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok && res.type === 'basic') { var cp = res.clone(); caches.open(C).then(function (c) { return c.put(r, cp); }); }
    return res;
  }).catch(function () {
    return caches.match(r).then(function (m) { return m || caches.match('/index.html'); });
  }));
});
