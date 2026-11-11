/* Stermont Arcade - light deterrent against casual copying of product photos.
   Blocks right-click "Save image", dragging an image out of the page, and long-press save on phones.
   It only touches images (text, links and buttons behave normally) and does not affect Google, the
   Merchant feed or the page's HTML. It cannot stop screenshots or determined users: a browser has to
   receive an image in order to display it. */
(function () {
  'use strict';
  try {
    var s = document.createElement('style');
    // Large photos (product popup, order popup, generated product pages) have no click handler on the image itself,
    // so they can safely let pointer events pass through: right-click / long-press then land on the page, not the photo.
    // Small card photos keep their click handlers, so they are covered by the listeners below instead.
    s.textContent = 'img{-webkit-user-drag:none;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}' +
      '#om-i,#stm-pd .main img,.pg img{pointer-events:none}';
    document.head.appendChild(s);
  } catch (e) {}
  // If a lead product photo fails, try the next genuine photo from that product's own gallery. Never show an emoji placeholder.
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || img.tagName !== 'IMG' || !img.hasAttribute('data-fallbacks')) return;
    var next = [];
    try { next = JSON.parse(img.getAttribute('data-fallbacks') || '[]'); } catch (err) {}
    if (next.length) {
      img.setAttribute('data-fallbacks', JSON.stringify(next.slice(1)));
      img.src = next[0];
      return;
    }
    var note = document.createElement('p');
    note.textContent = 'Product photo unavailable';
    note.setAttribute('role', 'status');
    img.parentNode.insertBefore(note, img.nextSibling);
    img.removeAttribute('data-fallbacks');
    img.style.display = 'none';
  }, true);
  function isImg(t) { return !!t && t.nodeType === 1 && (t.tagName === 'IMG' || t.tagName === 'PICTURE'); }
  document.addEventListener('contextmenu', function (e) { if (isImg(e.target)) e.preventDefault(); });
  document.addEventListener('dragstart', function (e) { if (isImg(e.target)) e.preventDefault(); });
})();

/* Visitor analytics: loads /analytics.js, which does nothing until an ID is set inside it.
   It is loaded from here only because this script is already on every public store and product page. */
(function () {
  try { var a = document.createElement('script'); a.src = '/analytics.js'; a.defer = true; document.head.appendChild(a); } catch (e) {}
})();

/* Floating WhatsApp button on every store, product and category page (see /wa-float.js). Loading it twice is harmless. */
(function () {
  try { if (/admin|upload-photos/.test(location.pathname)) return; var w = document.createElement('script'); w.src = '/wa-float.js?v=2'; w.defer = true; document.head.appendChild(w); } catch (e) {}
})();

/* Delivery times and customer reviews on product pages and in the storefront product view (see /product-trust.js). */
(function () {
  try { if (/admin|upload-photos/.test(location.pathname)) return; var t = document.createElement('script'); t.src = '/product-trust.js?v=2'; t.defer = true; document.head.appendChild(t); } catch (e) {}
})();

/* Footer links to the About, FAQ, Contact and Terms pages (see /site-links.js). */
(function () {
  try { var l = document.createElement('script'); l.src = '/site-links.js'; l.defer = true; document.head.appendChild(l); } catch (e) {}
})();

/* Homepage department navigation (see /nav-modern.js). Does nothing on pages without the homepage category strip. */
(function () {
  try { if (!document.getElementById('cats')) return; var n = document.createElement('script'); n.src = '/nav-modern.js?v=2'; n.defer = true; document.head.appendChild(n); } catch (e) {}
})();

/* "Someone just bought" popup showing real recent orders (see /recent-orders.js). Loading it twice is harmless. */
(function () {
  try { if (/admin|upload-photos/.test(location.pathname)) return; var b = document.createElement('script'); b.src = '/recent-orders.js?v=6'; b.defer = true; document.head.appendChild(b); } catch (e) {}
})();

/* Kilimall-style category pages: sticky sort + sub-category chips, two-column grid, products load as you scroll (see /cat-feel.js). Only runs on /c/ pages. */
(function () {
  try { if (!/^\/c\//.test(location.pathname)) return; var k = document.createElement('script'); k.src = '/cat-feel.js?v=1'; k.defer = true; document.head.appendChild(k); } catch (e) {}
})();

/* Kilimall-style extras on category, product and all-products pages: header search, mobile bottom menu, live discount badges, photo gallery and Add to cart (see /kili-pages.js). */
(function () {
  try { var p = location.pathname; if (!/^\/(c|p)\//.test(p) && p !== '/products.html') return; var x = document.createElement('script'); x.src = '/kili-pages.js?v=1'; x.defer = true; document.head.appendChild(x); } catch (e) {}
})();

/* Checkout hand-off failsafe (2026-11-11).
   checkout.html covers the page with "Preparing your checkout..." (html.stm-co-wait) until the shell's cart has been
   rebuilt and the checkout panel has opened. If anything in that hand-off failed, the cover stayed forever with no message.
   checkout.html itself gives up after about 12 s, so this waits 16 s, then lifts the cover and shows a message with ways forward.
   It does nothing on any other page, and nothing when the checkout opened normally (the cover class is already gone by then). */
(function () {
  try {
    var root = document.documentElement;
    if (!root.classList.contains('stm-co-wait')) return;
    setTimeout(function () {
      try {
        if (!root.classList.contains('stm-co-wait')) return;
        root.classList.remove('stm-co-wait');
        var box = document.createElement('div');
        box.setAttribute('role', 'alert');
        box.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;background:#fff;font:16px/1.5 system-ui,sans-serif;color:#282828';
        var card = document.createElement('div');
        card.style.cssText = 'max-width:380px;width:100%;text-align:center';
        var h = document.createElement('h2');
        h.textContent = 'Checkout did not load';
        h.style.cssText = 'font-size:1.3rem;margin:0 0 8px';
        var p = document.createElement('p');
        p.textContent = 'Your cart is safe. Tap Try again, or go back to the shop and add your items again. You can also send your order on WhatsApp.';
        p.style.cssText = 'margin:0 0 16px;color:#555';
        function btn(label, bg, fg, border) {
          var b = document.createElement('button');
          b.type = 'button'; b.textContent = label;
          b.style.cssText = 'display:block;width:100%;margin:8px 0;padding:14px;border-radius:12px;font:700 16px system-ui,sans-serif;cursor:pointer;text-align:center;text-decoration:none;background:' + bg + ';color:' + fg + ';border:' + (border || '0');
          return b;
        }
        var again = btn('Try again', '#7c3aed', '#fff');
        again.onclick = function () { location.reload(); };
        var back = btn('Back to the shop', '#fff', '#7c3aed', '2px solid #7c3aed');
        back.onclick = function () {
          try { localStorage.removeItem('stm_handoff'); } catch (e) {}
          if (window.parent !== window) { try { window.parent.postMessage({ stmCheckout: 'closed' }, location.origin); return; } catch (e) {} }
          location.replace('/');
        };
        var wa = document.createElement('a');
        wa.href = 'https://wa.me/254748888230?text=' + encodeURIComponent('Hello Stermont Arcade, my checkout did not load. I would like to place an order.');
        wa.target = '_blank'; wa.rel = 'noopener'; wa.textContent = 'Order on WhatsApp';
        wa.style.cssText = 'display:block;margin:8px 0;padding:14px;border-radius:12px;font:700 16px system-ui,sans-serif;text-align:center;text-decoration:none;background:#25d366;color:#fff';
        card.appendChild(h); card.appendChild(p); card.appendChild(again); card.appendChild(back); card.appendChild(wa);
        box.appendChild(card);
        document.body.appendChild(box);
      } catch (e) {}
    }, 16000);
  } catch (e) {}
})();

/* Checkout hand-off, fast path (2026-11-11).
   ROOT CAUSE of "Preparing your checkout..." hanging: checkout.html only starts the hand-off once storefront-live.js has built a
   product card (#p-<id>) for every cart line, and storefront-live.js builds them from ONE request that downloads every active
   product including its full description (about 3.5 MB, 856 rows). On a phone connection that takes longer than the 12 s the
   hand-off waits, so the cover never lifted properly.
   Fix: when the shell hands a cart over (html.stm-co-wait), ask Supabase only for the products in that cart (a few hundred bytes),
   and add hidden cards for them with the CURRENT database price and the exact pack-size name. checkout.html's own hand-off then finds
   its cards within a second, still refuses any line whose live price differs from the price the customer saw, and everything after
   that (cart, delivery fee, M-Pesa, order e-mails) is the unchanged proven flow. Lines that are inactive or out of stock get no card,
   so they are still reported by the existing message. Nothing changes on any other page. */
(function () {
  try {
    var root = document.documentElement;
    if (!root.classList.contains('stm-co-wait')) return;
    var items = JSON.parse(localStorage.getItem('stm_handoff') || '[]');
    if (!Array.isArray(items) || !items.length) return;
    var ids = [], by = {};
    items.forEach(function (i) { var id = String(i && i.rowId || ''); if (/^[A-Za-z0-9._-]{1,120}$/.test(id)) { ids.push(id); by[id] = i; } });
    if (!ids.length) return;
    var SB = 'https://oewvtbnmyombbtggamor.supabase.co', KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7';
    var url = SB + '/rest/v1/products?active=eq.true&stock=gt.0&id=in.(' + ids.map(function (x) { return '"' + x + '"'; }).join(',') + ')&select=id,name,variant_label,price,images';
    fetch(url, { headers: { apikey: KEY }, cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        if (!Array.isArray(rows) || !rows.length) return;
        var host = document.createElement('div');
        host.id = 'stm-handoff-cards'; host.style.display = 'none';
        rows.forEach(function (p) {
          if (document.getElementById('p-' + p.id)) return;
          var it = by[p.id] || {}, size = it.size && it.size !== 'Standard' ? it.size : (p.variant_label || '');
          var base = String(it.name || p.name || '').replace(/^Buy\s+/i, '');
          var c = document.createElement('div'); c.className = 'pcard'; c.id = 'p-' + p.id;
          var h3 = document.createElement('h3'); h3.textContent = base + (size ? ' – ' + size : ''); c.appendChild(h3);
          var pr = document.createElement('p'); pr.className = 'price'; pr.textContent = 'KSh ' + Math.round(Number(p.price)).toLocaleString('en-KE'); c.appendChild(pr);
          if (p.images && p.images[0]) { var im = document.createElement('img'); im.src = p.images[0]; im.alt = ''; c.appendChild(im); }
          host.appendChild(c);
        });
        document.body.appendChild(host);
      })
      .catch(function () {});
  } catch (e) {}
})();
