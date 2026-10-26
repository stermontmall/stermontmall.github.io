/* "Someone just bought" popup: shows REAL recent purchases so shoppers see that others are buying and feel confident to order.
   Data comes from the Supabase function public.recent_purchases(), which returns ONLY the first item name, the county, the
   buyer's FIRST NAME and the time of purchase (never a surname, phone, email or address). If there are no recent orders, nothing is shown.
   Loaded from /img-protect.js on every public store, product, category and blog page. Loading it twice is harmless. */
(function () {
  'use strict';
  if (window.__stmBuyPop) return;
  window.__stmBuyPop = 1;
  if (/admin|upload-photos|track|account/.test(location.pathname)) return;
  try { if (sessionStorage.getItem('stm_buypop_off') === '1') return; } catch (e) {}

  var SB = 'https://oewvtbnmyombbtggamor.supabase.co', KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7';
  /* The popup appears every INTERVAL ms (start to start): visible for SHOW_FOR ms, hidden for the rest. */
  var D = document, FIRST_DELAY = 7000, SHOW_FOR = 6500, INTERVAL = 15000;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;

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

  var css = D.createElement('style');
  css.textContent = '#stm-buy{box-sizing:border-box;position:fixed;left:12px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:9998;display:flex;align-items:center;gap:.7rem;max-width:min(330px,calc(100vw - 96px));padding:.6rem .8rem .6rem .6rem;border-radius:16px;background:#fff;color:#1b1230;border:1px solid #e6def8;box-shadow:0 10px 30px rgba(42,14,92,.22);font:500 13px/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;transform:translateY(24px);opacity:0;pointer-events:none;transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .45s}' +
    '#stm-buy.on{transform:none;opacity:1;pointer-events:auto}' +
    '#stm-buy .bi{flex:none;width:46px;height:46px;border-radius:12px;background:#f1ecfc;display:grid;place-items:center;font-size:22px;overflow:hidden;position:relative}' +
    '#stm-buy .bi img{width:100%;height:100%;object-fit:cover;display:block}' +
    '#stm-buy .bi i{position:absolute;right:-2px;bottom:-2px;width:18px;height:18px;border-radius:50%;background:#16a34a;color:#fff;font:700 11px/18px system-ui;text-align:center;border:2px solid #fff;box-sizing:content-box;font-style:normal}' +
    '#stm-buy .bt{min-width:0}#stm-buy .bt b{display:block;font-weight:700;color:#5b21b6;font-size:11.5px;letter-spacing:.01em;text-transform:uppercase}' +
    '#stm-buy .bt span{display:block;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;font-weight:600}' +
    '#stm-buy .bt small{display:block;color:#6b6585;font-size:11.5px;margin-top:1px}' +
    '#stm-buy button{flex:none;border:0;background:none;color:#8b86a0;font-size:18px;line-height:1;padding:4px;cursor:pointer;align-self:flex-start;border-radius:8px}#stm-buy button:focus-visible{outline:3px solid #7c3aed}' +
    '@media(prefers-reduced-motion:reduce){#stm-buy{transition:opacity .2s;transform:none}}' +
    '@media print{#stm-buy{display:none}}';
  D.head.appendChild(css);

  var box = mk('div'); box.id = 'stm-buy'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite');
  var ic = mk('div', 'bi'), tx = mk('div', 'bt'), head = mk('b', '', 'Just bought'), nm = mk('span'), tm = mk('small'), x = mk('button', '', '\u00D7');
  x.type = 'button'; x.setAttribute('aria-label', 'Close purchase notifications');
  tx.appendChild(head); tx.appendChild(nm); tx.appendChild(tm);
  box.appendChild(ic); box.appendChild(tx); box.appendChild(x);

  var list = [], imgs = {}, i = 0, timer = null, dead = false;
  x.onclick = function () { dead = true; clearTimeout(timer); box.classList.remove('on'); try { sessionStorage.setItem('stm_buypop_off', '1'); } catch (e) {} };

  function paint(p) {
    ic.textContent = '';
    var src = imgs[String(p.item).toLowerCase()];
    if (src) { var im = new Image(); im.src = src; im.alt = ''; im.width = im.height = 46; ic.appendChild(im); } else { ic.appendChild(D.createTextNode('\uD83D\uDECD\uFE0F')); }
    ic.appendChild(mk('i', '', '\u2713'));
    nm.textContent = p.item;
    var who = p.buyer || 'A customer';
    tm.textContent = who + (p.area ? ' from ' + p.area : '') + ' \u00B7 ' + ago(p.created_at);
  }
  function cycle() {
    if (dead || !list.length) return;
    if (D.hidden) { timer = setTimeout(cycle, 4000); return; }
    paint(list[i % list.length]); i++;
    box.classList.add('on');
    timer = setTimeout(function () { box.classList.remove('on'); timer = setTimeout(cycle, INTERVAL - SHOW_FOR); }, SHOW_FOR);
  }

  function hdr() { return { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }; }
  fetch(SB + '/rest/v1/rpc/recent_purchases', { method: 'POST', headers: hdr(), body: '{}' })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (rows) {
      list = (rows || []).filter(function (p) { return p && p.item && p.created_at; });
      if (!list.length) return;
      D.body.appendChild(box);
      /* Product photos are optional: look them up by name, and fall back to an icon if there is none. */
      return fetch(SB + '/rest/v1/products?active=eq.true&select=name,images', { headers: { apikey: KEY } })
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (ps) { (ps || []).forEach(function (p) { if (p.name && p.images && p.images[0]) imgs[String(p.name).toLowerCase()] = p.images[0]; }); })
        .catch(function () {})
        .then(function () { timer = setTimeout(cycle, FIRST_DELAY); });
    })
    .catch(function () {});
})();
