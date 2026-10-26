/* "Someone just bought" popup: shows REAL recent purchases so shoppers see that others are buying and feel confident to order.
   Data comes from the Supabase function public.recent_purchases(), which returns ONLY the first item name, the county, the
   buyer's FIRST NAME and the time of purchase (never a surname, phone, email or address). If there are no recent orders, nothing is shown.
   Tapping the popup opens that product so the visitor can add it to the cart and order (on the storefront it opens the product view
   directly; on other pages it goes to the storefront with the product open).
   Loaded (as /recent-orders.js) from /img-protect.js on every public store, product, category and blog page. Loading it twice is harmless. */
(function () {
  'use strict';
  if (window.__stmBuyPop) return;
  window.__stmBuyPop = 1;
  if (/admin|upload-photos|track|account/.test(location.pathname)) return;
  try { if (sessionStorage.getItem('stm_buypop_off') === '1') return; } catch (e) {}

  var SB = 'https://oewvtbnmyombbtggamor.supabase.co', KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7';
  /* The popup appears every INTERVAL ms (start to start): visible for SHOW_FOR ms, hidden for the rest. */
  var D = document, FIRST_DELAY = 7000, SHOW_FOR = 8000, INTERVAL = 15000;

  function ago(iso) {
    var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 90) return 'just now';
    if (s < 3600) return Math.round(s / 60) + ' minutes ago';
    if (s < 5400) return '1 hour ago';
    if (s < 86400) return Math.round(s / 3600) + ' hours ago';
    var d = Math.round(s / 86400);
    return d === 1 ? 'yesterday' : d + ' days ago';
  }
  function mk(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function norm(s) { return String(s || '').toLowerCase().replace(/[\u2013\u2014]/g, '-').replace(/\s+/g, ' ').trim(); }

  var css = D.createElement('style');
  css.textContent = '#stm-buy{box-sizing:border-box;position:fixed;left:12px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:9998;display:flex;align-items:center;gap:.7rem;max-width:min(340px,calc(100vw - 96px));padding:.65rem .8rem .65rem .65rem;border-radius:16px;background:#fff;color:#1b1230;border:1px solid #e6def8;box-shadow:0 10px 30px rgba(42,14,92,.22);font:500 13px/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;transform:translateY(24px);opacity:0;pointer-events:none;transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .45s}' +
    '#stm-buy.on{transform:none;opacity:1;pointer-events:auto}#stm-buy.lnk{cursor:pointer}#stm-buy.lnk:hover{border-color:#7c3aed}#stm-buy:focus-visible{outline:3px solid #7c3aed;outline-offset:2px}' +
    '#stm-buy .bi{flex:none;width:46px;height:46px;border-radius:12px;background:#f1ecfc;display:grid;place-items:center;font-size:22px;overflow:hidden;position:relative}' +
    '#stm-buy .bi img{width:100%;height:100%;object-fit:cover;display:block}' +
    '#stm-buy .bi i{position:absolute;right:-2px;bottom:-2px;width:18px;height:18px;border-radius:50%;background:#16a34a;color:#fff;font:700 11px/18px system-ui;text-align:center;border:2px solid #fff;box-sizing:content-box;font-style:normal}' +
    /* Buyer name: the first and boldest line */
    '#stm-buy .bt{min-width:0}#stm-buy .bt b{display:block;font-weight:800;color:#5b21b6;font-size:15px;line-height:1.25;text-transform:none;letter-spacing:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '#stm-buy .bt span{display:-webkit-box;overflow:hidden;-webkit-line-clamp:2;-webkit-box-orient:vertical;font-weight:600;color:#1b1230;margin-top:1px}' +
    '#stm-buy .bt small{display:block;color:#6b6585;font-size:11.5px;margin-top:2px}' +
    '#stm-buy .bt em{display:none;font-style:normal;font-weight:800;font-size:12px;color:#7c3aed;margin-top:2px}#stm-buy.lnk .bt em{display:block}' +
    '#stm-buy button{flex:none;border:0;background:none;color:#8b86a0;font-size:18px;line-height:1;padding:4px;cursor:pointer;align-self:flex-start;border-radius:8px}#stm-buy button:focus-visible{outline:3px solid #7c3aed}' +
    '@media(prefers-reduced-motion:reduce){#stm-buy{transition:opacity .2s;transform:none}}' +
    '@media print{#stm-buy{display:none}}';
  D.head.appendChild(css);

  var box = mk('div'); box.id = 'stm-buy'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite');
  var ic = mk('div', 'bi'), tx = mk('div', 'bt'), head = mk('b'), nm = mk('span'), tm = mk('small'), cta = mk('em', '', 'View & buy \u2192'), x = mk('button', '', '\u00D7');
  x.type = 'button'; x.setAttribute('aria-label', 'Close purchase notifications');
  tx.appendChild(head); tx.appendChild(nm); tx.appendChild(tm); tx.appendChild(cta);
  box.appendChild(ic); box.appendChild(tx); box.appendChild(x);

  var list = [], prods = [], i = 0, timer = null, dead = false, cur = null, curProd = null;
  x.onclick = function (e) { e.stopPropagation(); dead = true; clearTimeout(timer); box.classList.remove('on'); try { sessionStorage.setItem('stm_buypop_off', '1'); } catch (e2) {} };

  /* Match an ordered item name to a product (variant products are named "Name \u2013 100 ml" on the storefront). */
  function findProd(item) {
    var n = norm(item), best = null;
    for (var k = 0; k < prods.length; k++) {
      var p = prods[k];
      if (p.keys.indexOf(n) > -1) return p;
      for (var j = 0; j < p.keys.length; j++) { var key = p.keys[j]; if (key.length > 8 && (n.indexOf(key) === 0 || (n.length >= 85 && key.indexOf(n) === 0))) { if (!best || key.length > best.len) best = { p: p, len: key.length }; } }
    }
    return best ? best.p : null;
  }

  function paint(p) {
    cur = p; curProd = findProd(p.item);
    ic.textContent = '';
    var src = curProd && curProd.img;
    if (src) { var im = new Image(); im.src = src; im.alt = ''; im.width = im.height = 46; ic.appendChild(im); } else { ic.appendChild(D.createTextNode('\uD83D\uDECD\uFE0F')); }
    ic.appendChild(mk('i', '', '\u2713'));
    var who = (p.buyer && String(p.buyer).trim()) || 'A customer';
    head.textContent = who + (p.area ? ' from ' + p.area : '');
    nm.textContent = 'just bought ' + p.item;
    tm.textContent = ago(p.created_at);
    box.classList.toggle('lnk', !!curProd);
    if (curProd) { box.setAttribute('role', 'link'); box.tabIndex = 0; box.setAttribute('aria-label', who + ' bought ' + p.item + '. View and order it.'); }
    else { box.setAttribute('role', 'status'); box.removeAttribute('tabindex'); box.removeAttribute('aria-label'); }
  }

  /* Open the product so the visitor can buy it. */
  function go() {
    if (!curProd) return;
    var id = curProd.id, c = D.getElementById('p-' + id);
    if (c && window.STM_openView) {                       /* storefront: open the product view in place */
      var g = c.closest && c.closest('.mcat'); if (g) g.classList.add('open');
      try { window.STM_openView(c); } catch (e) { location.href = '/#p-' + id; }
    } else {                                               /* any other page: storefront with that product open */
      location.href = '/#p-' + encodeURIComponent(id);
    }
  }
  box.addEventListener('click', function (e) { if (e.target === x) return; go(); });
  box.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target === box) { e.preventDefault(); go(); } });

  /* Keep the popup on screen while the visitor is pointing at it or focusing it, then carry on. */
  function hold() { clearTimeout(timer); }
  function release() { if (box.classList.contains('on')) timer = setTimeout(hideThenNext, 2500); }
  box.addEventListener('mouseenter', hold); box.addEventListener('mouseleave', release);
  box.addEventListener('focusin', hold); box.addEventListener('focusout', release);

  function hideThenNext() { box.classList.remove('on'); timer = setTimeout(cycle, Math.max(2000, INTERVAL - SHOW_FOR)); }
  function cycle() {
    if (dead || !list.length) return;
    if (D.hidden) { timer = setTimeout(cycle, 4000); return; }
    paint(list[i % list.length]); i++;
    box.classList.add('on');
    timer = setTimeout(hideThenNext, SHOW_FOR);
  }

  function hdr() { return { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }; }
  fetch(SB + '/rest/v1/rpc/recent_purchases', { method: 'POST', headers: hdr(), body: '{}', cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (rows) {
      list = (rows || []).filter(function (p) { return p && p.item && p.created_at; });
      if (!list.length) return;
      D.body.appendChild(box);
      /* Look the products up so the popup can show a photo and link to the product. Both are optional. */
      return fetch(SB + '/rest/v1/products?active=eq.true&select=id,name,variant_label,images', { headers: { apikey: KEY } })
        .then(function (r) { if (r.ok) return r.json(); return fetch(SB + '/rest/v1/products?active=eq.true&select=id,name,images', { headers: { apikey: KEY } }).then(function (r2) { return r2.ok ? r2.json() : []; }); })
        .then(function (ps) {
          (ps || []).forEach(function (p) {
            if (!p || !p.id || !p.name) return;
            var keys = [norm(p.name)]; if (p.variant_label) keys.unshift(norm(p.name + ' - ' + p.variant_label));
            prods.push({ id: p.id, keys: keys, img: p.images && p.images[0] });
          });
        })
        .catch(function () {})
        .then(function () { timer = setTimeout(cycle, FIRST_DELAY); });
    })
    .catch(function () {});
})();
