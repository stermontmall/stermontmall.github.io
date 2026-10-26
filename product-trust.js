/* Stermont Arcade · delivery times and customer reviews on every product page and in the storefront product view.
   Loaded from /img-protect.js, which is already on the storefront, every product page and every category page.
   Reviews shown here are only real ones: customers write them from their own orders and you approve them in
   admin > Customers > Reviews. Nothing is invented. All text is set with textContent. */
(function () {
  'use strict';
  var D = document, SBU = 'https://oewvtbnmyombbtggamor.supabase.co', KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7', WA = '254748888230';
  if (/^\/(admin|account|upload-photos)/.test(location.pathname) || D.getElementById('stt-style')) return;

  function mk(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function key(n) { return String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  function stars(n) { var f = Math.round(n), s = ''; for (var i = 1; i <= 5; i++) s += i <= f ? '\u2605' : '\u2606'; return s; }
  function dmy(d) { d = new Date(d); if (isNaN(d)) return ''; var p = function (n) { return (n < 10 ? '0' : '') + n; }; return p(d.getDate()) + '-' + p(d.getMonth() + 1) + '-' + d.getFullYear(); }

  var st = mk('style'); st.id = 'stt-style';
  st.textContent = '.stt-card{background:#faf9fd;border:1px solid #e6e1f5;border-radius:14px;padding:.8rem 1rem;margin:.9rem 0;color:#1f1b2e;font-size:.92rem;line-height:1.5;text-align:left}' +
    '.stt-card h3{margin:0 0 .45rem;font-size:1rem}.stt-card p{margin:.2rem 0}' +
    '.stt-card ul{list-style:none;margin:0;padding:0;display:grid;gap:.35rem}.stt-card li b{color:#5b21b6}' +
    '.stt-card a{color:#166534;font-weight:700;text-decoration:underline}.stt-card small{display:block;margin-top:.55rem;color:#5c5873;font-size:.85rem}' +
    '.stt-st{color:#b45309;letter-spacing:.06em;font-weight:700}.stt-it{padding:.5rem 0;border-top:1px solid #e6e1f5}.stt-it:first-of-type{border-top:0}';
  D.head.appendChild(st);

  /* ---------- delivery times ---------- */
  function delivery(name) {
    var c = mk('div', 'stt-card'); c.setAttribute('data-stt', 'delivery');
    c.appendChild(mk('h3', null, '\uD83D\uDE9A Delivery times'));
    var ul = mk('ul');
    [['Nairobi', 'usually same day or next day'],
     ['Other counties', 'usually 1 to 3 days (remote areas can take longer)'],
     ['Delivery fee', 'confirmed before you pay, based on your location and the size of your order'],
     ['Collect from our shop', 'The Sarit Centre (Westlands), Karuna Road. Message us first so your items are ready']
    ].forEach(function (r) { var li = mk('li'); li.appendChild(mk('b', null, r[0] + ': ')); li.appendChild(D.createTextNode(r[1])); ul.appendChild(li); });
    c.appendChild(ul);
    var s = mk('small'); s.appendChild(D.createTextNode('Pay by M-Pesa \u00B7 48-hour returns on faulty items. '));
    var a = mk('a', null, 'Ask about stock or delivery fees on WhatsApp');
    a.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent('Hello Stermont Arcade, is this in stock and how much is delivery to my area? ' + name + ' ' + location.href);
    a.target = '_blank'; a.rel = 'noopener';
    s.appendChild(a); s.appendChild(D.createTextNode('. We reply 8:00 AM to 9:00 PM every day.')); c.appendChild(s);
    return c;
  }

  /* ---------- approved customer reviews ---------- */
  var by = null, loading = false, waiters = [];
  function loadReviews(cb) {
    if (by) return cb(by);
    waiters.push(cb); if (loading) return; loading = true;
    fetch(SBU + '/rest/v1/reviews?select=product_name,rating,body,reviewer,created_at&status=eq.approved&order=created_at.desc&limit=1000', { headers: { apikey: KEY } })
      .then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; })
      .then(function (rows) {
        by = {};
        (rows || []).forEach(function (r) { var k = key(r.product_name), n = Number(r.rating); if (!k || !(n >= 1 && n <= 5)) return; r.rating = n; (by[k] = by[k] || []).push(r); });
        waiters.splice(0).forEach(function (f) { f(by); });
      });
  }
  function match(map, name) {
    var k = key(name), out = []; if (!k) return out;
    Object.keys(map).forEach(function (m) { if (m === k || m.indexOf(k + ' ') === 0) out = out.concat(map[m]); });
    return out;
  }
  function reviewBox(list) {
    var c = mk('div', 'stt-card stt-rev'); c.setAttribute('data-stt', 'reviews');
    if (list.length) {
      var t = 0; list.forEach(function (r) { t += r.rating; });
      var h = mk('h3'); h.appendChild(mk('span', 'stt-st', stars(t / list.length)));
      h.appendChild(D.createTextNode(' ' + (t / list.length).toFixed(1) + ' / 5 from ' + list.length + (list.length === 1 ? ' customer review' : ' customer reviews')));
      c.appendChild(h);
      list.slice(0, 3).forEach(function (r) {
        var it = mk('div', 'stt-it'); it.appendChild(mk('span', 'stt-st', stars(r.rating)));
        if (r.body) it.appendChild(mk('div', null, r.body));
        var d = dmy(r.created_at); it.appendChild(mk('small', null, (r.reviewer || 'Verified buyer') + (d ? ' \u00B7 ' + d : '')));
        c.appendChild(it);
      });
    } else {
      c.appendChild(mk('h3', null, 'Customer reviews'));
      c.appendChild(mk('p', null, 'No reviews for this product yet. Reviews are written by customers from their own orders and checked by us before they show here.'));
      var s = mk('small'), a = mk('a', null, 'Bought this? Rate your order in My account'); a.href = '/account.html'; s.appendChild(a); c.appendChild(s);
    }
    return c;
  }

  /* ---------- shop service rating (reviews saved against "Our service") ---------- */
  function serviceCard(map) {
    var l = map['our service']; if (!l || !l.length) return null;
    var t = 0; l.forEach(function (r) { t += r.rating; });
    var c = mk('div', 'stt-card'); c.setAttribute('data-stt', 'service');
    var h = mk('h3'); h.appendChild(mk('span', 'stt-st', stars(t / l.length)));
    h.appendChild(D.createTextNode(' ' + (t / l.length).toFixed(1) + ' / 5 from ' + l.length + (l.length === 1 ? ' customer rating' : ' customer ratings') + ' of our service'));
    c.appendChild(h);
    var r0 = l.filter(function (r) { return r.body; })[0];
    if (r0) { var it = mk('div', 'stt-it'); it.appendChild(mk('div', null, r0.body)); var d = dmy(r0.created_at); it.appendChild(mk('small', null, (r0.reviewer || 'Verified buyer') + (d ? ' \u00B7 ' + d : ''))); c.appendChild(it); }
    return c;
  }

  /* ---------- static product pages (/p/...) ---------- */
  function productPage() {
    if (!/^\/p\/[^/]+\.html$/.test(location.pathname)) return;
    var main = D.querySelector('main'), h1 = main && main.querySelector('h1'), col = D.querySelector('.pg > div:last-child');
    if (!h1 || D.querySelector('[data-stt]')) return;
    var name = h1.textContent.trim();
    if (col) col.appendChild(delivery(name));
    var hasRev = [].some.call(main.querySelectorAll('h2'), function (h) { return /^Customer reviews/.test(h.textContent); });
    /* Approved ratings of the shop's service ("Our service") show on every product page, so shoppers see real feedback. */
    loadReviews(function (map) { var sv = serviceCard(map); if (sv && col && !D.querySelector('[data-stt="service"]')) { var d = col.querySelector('[data-stt="delivery"]'); col.insertBefore(sv, d || null); } });
    if (hasRev) return;   /* the page already lists approved reviews */
    loadReviews(function (map) {
      var box = reviewBox(match(map, name)), more = [].filter.call(main.querySelectorAll('h2'), function (h) { return /^More in /.test(h.textContent); })[0];
      if (more) more.parentNode.insertBefore(box, more); else main.appendChild(box);
    });
  }

  /* ---------- storefront product view (#stm-pd, opened over the homepage) ---------- */
  function watchPopup() {
    if (!D.getElementById('music-gear')) return;
    var last = '';
    function render(pd) {
      if (!pd.classList.contains('on')) return;
      var info = pd.querySelector('.info'), h2 = info && info.querySelector('h2'); if (!info || !h2) return;
      var name = h2.textContent.trim();
      if (!name || (name === last && info.querySelector('[data-stt="delivery"]'))) return;
      last = name;
      [].forEach.call(info.querySelectorAll('[data-stt]'), function (n) { n.remove(); });
      info.appendChild(delivery(name));
      loadReviews(function (map) { if (last !== name || info.querySelector('[data-stt="reviews"]')) return; info.appendChild(reviewBox(match(map, name))); });
    }
    function attach(pd) {
      if (pd._stt) return; pd._stt = 1;
      new MutationObserver(function () { render(pd); }).observe(pd, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class'] });
      render(pd);
    }
    var pd = D.getElementById('stm-pd'); if (pd) return attach(pd);
    new MutationObserver(function (m, o) { var x = D.getElementById('stm-pd'); if (x) { o.disconnect(); attach(x); } }).observe(D.body, { childList: true });
  }

  function init() { try { productPage(); watchPopup(); } catch (e) {} }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();
})();
