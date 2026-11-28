/* Stermont Admin PWA service worker (scope /neon-admin).
   Network-only: nothing from the admin, Neon Auth or the Data API is ever cached,
   so prices, stock and login state are always live. It only supplies an offline
   message when a page load fails, and its fetch handler makes the app installable. */
const OFFLINE = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><body style="font-family:system-ui;background:#321064;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px"><div><h1 style="font-size:20px">You are offline</h1><p>Stermont Admin needs a connection. Reconnect and try again.</p><button onclick="location.reload()" style="padding:11px 18px;border:0;border-radius:9px;font:inherit;font-weight:650">Retry</button></div></body>';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(() => new Response(OFFLINE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
});
