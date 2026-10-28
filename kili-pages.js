/* Stermont Arcade · Kilimall-style extras for the static pages (category /c/, product /p/ and /products.html).
   - Search box in the header with instant product suggestions.
   - Cart icon in the header and mobile bottom menu (Home, Categories, Search, Cart, Orders) on category pages.
   - "Add to cart" on product cards and product pages. Items are saved on the phone and added to the real cart when the
     shop opens (see /cart-bridge.js). Products with several pack sizes open the shop so the size can be chosen.
   - Live discount badges, current prices and "Sold out" tags on product cards (read from the shop database).
   - Product page: photo gallery with thumbnails + swipe.
   Loaded by img-protect.js. To switch off: remove the kili-pages loader at the bottom of img-protect.js. */
(function () {
  'use strict';
  try {
    var P = location.pathname, D = document;
    var isC = /^\/c\//.test(P), isP = /^\/p\//.test(P), isAll = P === '/products.html';
    if (!isC && !isP && !isAll) return;
    var SB = 'https://oewvtbnmyombbtggamor.supabase.co', KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7', PK = 'stm_pending_cart';
    function api(q) { return fetch(SB + '/rest/v1/' + q, { headers: { apikey: KEY } }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }); }
    function money(n) { return 'KSh ' + Math.round(Number(n) || 0).toLocaleString('en-KE'); }
    function el(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
    function idOf(h) { try { return decodeURIComponent(String(h).replace(/^.*\/p\//, '').replace(/\.html.*$/, '')); } catch (e) { return ''; } }

    /* ---------- cart helpers (items wait under stm_pending_cart until the shop opens) ---------- */
    function pend() { try { var o = JSON.parse(localStorage.getItem(PK) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
    function addPending(id) {
      if (!id) return false;
      var o = pend(); o[id] = Math.min(99, (parseInt(o[id], 10) || 0) + 1);
      try { localStorage.setItem(PK, JSON.stringify(o)); return true; } catch (e) { return false; }
    }
    function cartCount() {
      var n = 0, o = pend();
      Object.keys(o).forEach(function (k) { n += parseInt(o[k], 10) || 0; });
      try { var c = JSON.parse(localStorage.getItem('stm_cart') || '{}'); Object.keys(c).forEach(function (k) { n += parseInt(c[k], 10) || 0; }); } catch (e) {}
      return n;
    }
    function badges() { var n = cartCount(); [].forEach.call(D.querySelectorAll('.kp-cn'), function (b) { b.textContent = n > 99 ? '99+' : n; b.hidden = !n; }); }
    var tEl = null, tt = null;
    function toast(msg, link) {
      if (!tEl) { tEl = el('div'); tEl.id = 'kp-toast'; tEl.setAttribute('role', 'status'); D.body.appendChild(tEl); }
      tEl.textContent = msg + ' ';
      if (link) { var a = el('a', '', 'View cart'); a.href = '/#cart'; tEl.appendChild(a); }
      tEl.classList.add('on'); clearTimeout(tt); tt = setTimeout(function () { tEl.classList.remove('on'); }, 2800);
    }
    function badge() { var s = el('span', 'kp-cn', '0'); s.hidden = true; return s; }

    var st = el('style');
    st.textContent =
      'header{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem .8rem}' +
      '.kp-s{position:relative;flex:1 1 100%}@media(min-width:720px){.kp-s{flex:1 1 340px;max-width:520px;margin-left:auto;order:2}}' +
      '.kp-hc{position:relative;margin-left:auto;color:#fff;text-decoration:none;font-size:1.35rem;line-height:1;padding:.15rem .4rem}@media(min-width:720px){.kp-hc{order:3;margin-left:0}}' +
      '.kp-cn{position:absolute;top:-.3rem;right:-.45rem;min-width:1.15rem;height:1.15rem;padding:0 .25rem;box-sizing:border-box;border-radius:999px;background:#dc2626;color:#fff;font:800 .68rem/1 system-ui,sans-serif;display:grid;place-items:center}.kp-cn[hidden]{display:none!important}' +
      '.kp-s input{width:100%;box-sizing:border-box;font:inherit;font-size:1rem;border:0;border-radius:999px;padding:.55rem 1rem;color:#1f1b2e;background:#fff}' +
      '.kp-dd{position:absolute;left:0;right:0;top:calc(100% + .35rem);background:#fff;color:#1f1b2e;border-radius:14px;box-shadow:0 12px 32px rgba(31,27,46,.28);max-height:65vh;overflow-y:auto;z-index:70}.kp-dd[hidden]{display:none}' +
      '.kp-dd a{display:flex;align-items:center;gap:.6rem;padding:.55rem .7rem;color:#1f1b2e;text-decoration:none;font-weight:600;font-size:.92rem;border-bottom:1px solid #f0ecfa}' +
      '.kp-dd img{width:44px;height:44px;object-fit:contain;background:#fff;border-radius:8px;flex:none}.kp-dd small{display:block;color:#5b21b6;font-weight:800}.kp-dd p{margin:0;padding:.8rem;font-size:.92rem}' +
      '#kp-nav{display:none}' +
      '@media(max-width:700px){#kp-nav{position:fixed;left:0;right:0;bottom:0;z-index:50;display:flex;background:#fff;border-top:1px solid #e6e1f5;padding-bottom:env(safe-area-inset-bottom,0px);box-shadow:0 -2px 10px rgba(31,27,46,.1)}' +
      '#kp-nav a,#kp-nav button{flex:1;display:flex;flex-direction:column;align-items:center;gap:.1rem;padding:.45rem 0;font:inherit;font-size:.72rem;font-weight:600;color:#6b6b80;background:none;border:0;text-decoration:none;cursor:pointer}' +
      '#kp-nav b{position:relative;font-size:1.25rem;line-height:1}#kp-nav .on{color:#6d28d9}' +
      'body.kp-nav{padding-bottom:64px}body.kp-nav #wa-float{bottom:calc(76px + env(safe-area-inset-bottom,0px))}}' +
      '#kp-toast{position:fixed;left:50%;bottom:92px;transform:translate(-50%,20px);opacity:0;pointer-events:none;z-index:80;background:#1f1b2e;color:#fff;font-weight:700;font-size:.9rem;padding:.65rem 1.1rem;border-radius:999px;transition:opacity .2s,transform .2s;white-space:nowrap}' +
      '#kp-toast.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}#kp-toast a{color:#c4b5fd;margin-left:.3rem}' +
      'ul.g li{position:relative}' +
      'main ul.g li .kp-add{display:block;width:100%;box-sizing:border-box;margin-top:.5rem;font:inherit;font-weight:800;font-size:.88rem;text-align:center;text-decoration:none;color:#fff;background:#7c3aed;border:2px solid #7c3aed;border-radius:10px;padding:.5rem;cursor:pointer}' +
      'main ul.g li .kp-add.kp-alt{background:#fff;color:#6d28d9}main ul.g li .kp-add[disabled]{opacity:.55;cursor:default}' +
      '.kp-b{position:absolute;top:.6rem;left:.6rem;z-index:2;background:#dc2626;color:#fff;font-weight:800;font-size:.72rem;border-radius:999px;padding:.18rem .5rem;box-shadow:0 2px 6px rgba(220,38,38,.35)}' +
      '.kp-so img{opacity:.5}.kp-so .kp-b{background:#6b6b80;box-shadow:none}' +
      '.kp-old{color:#8b86a0;font-size:.8rem;font-weight:500;margin-left:.35rem}' +
      '.kp-th{display:flex;gap:.5rem;overflow-x:auto;margin-top:.6rem;padding-bottom:.2rem;scrollbar-width:none}.kp-th::-webkit-scrollbar{display:none}' +
      '.kp-th button{flex:none;width:62px;height:62px;padding:0;border:2px solid transparent;border-radius:10px;background:#fff;cursor:pointer;overflow:hidden}.kp-th button.on{border-color:#7c3aed}' +
      '.kp-th img{width:100%!important;height:100%!important;max-height:none!important;border:0!important;border-radius:8px!important;object-fit:cover!important}' +
      '.btn.kp-cart{background:#7c3aed}.stk a.kp-c{background:#7c3aed;color:#fff}';
    D.head.appendChild(st);

    /* ---------- header: cart icon + search with instant suggestions ---------- */
    var hd = D.querySelector('header'), inp = null, dd = null;
    if (hd) {
      var hc = el('a', 'kp-hc'); hc.href = '/#cart'; hc.setAttribute('aria-label', 'Cart'); hc.appendChild(D.createTextNode('\uD83D\uDED2')); hc.appendChild(badge()); hd.appendChild(hc);
      var form = el('form', 'kp-s'); form.setAttribute('role', 'search'); form.action = '/products.html';
      inp = el('input'); inp.type = 'search'; inp.placeholder = 'Search products'; inp.autocomplete = 'off'; inp.setAttribute('aria-label', 'Search products');
      dd = el('div', 'kp-dd'); dd.hidden = true; form.appendChild(inp); form.appendChild(dd); hd.appendChild(form);
      var tm = null, last = '';
      var render = function (rows, q) {
        dd.textContent = ''; var seen = {}, n = 0;
        rows.forEach(function (r) {
          var k = String(r.name || '').toLowerCase(); if (!k || seen[k]) return; seen[k] = 1; n++;
          var a = el('a'); a.href = '/p/' + encodeURIComponent(r.id) + '.html';
          var im = (r.images || []).filter(Boolean)[0]; if (im) { var i = new Image(); i.src = im; i.alt = ''; i.loading = 'lazy'; a.appendChild(i); }
          var t = el('span', '', r.name); t.appendChild(el('small', '', money(r.price))); a.appendChild(t); dd.appendChild(a);
        });
        if (!n) { var p = el('p'); p.appendChild(D.createTextNode('No match for "' + q + '". ')); var w = el('a', '', 'Ask us on WhatsApp'); w.href = 'https://wa.me/254748888230?text=' + encodeURIComponent('Hello Stermont Arcade, do you have: ' + q + '?'); w.style.cssText = 'display:inline;padding:0;border:0;color:#16a34a'; p.appendChild(w); dd.appendChild(p); }
        dd.hidden = false;
      };
      var run = function (q) {
        var term = q.replace(/[*(),%\\]/g, ' ').replace(/\s+/g, ' ').trim(); if (term.length < 2) return; last = term;
        api('products?active=eq.true&name=ilike.' + encodeURIComponent('*' + term.replace(/ /g, '*') + '*') + '&select=id,name,price,images&order=name.asc&limit=12').then(function (rows) { if (term === last) render(rows.slice(0, 12), q); });
      };
      inp.addEventListener('input', function () { clearTimeout(tm); var q = inp.value.trim(); if (q.length < 2) { dd.hidden = true; return; } tm = setTimeout(function () { run(q); }, 220); });
      form.addEventListener('submit', function (e) { e.preventDefault(); var a = dd.querySelector('a[href^="/p/"]'); if (a) location.href = a.href; else if (inp.value.trim().length > 1) run(inp.value.trim()); });
      D.addEventListener('click', function (e) { if (!form.contains(e.target)) dd.hidden = true; });
      D.addEventListener('keydown', function (e) { if (e.key === 'Escape') dd.hidden = true; });
      setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 0);
    }

    /* ---------- mobile bottom menu (category pages and all-products page) ---------- */
    if (isC || isAll) {
      var nav = el('nav'); nav.id = 'kp-nav'; nav.setAttribute('aria-label', 'Main menu');
      var mkA = function (ic, tx, href, on, withBadge) { var a = el('a', on ? 'on' : ''); a.href = href; var b = el('b', '', ic); if (withBadge) b.appendChild(badge()); a.appendChild(b); a.appendChild(D.createTextNode(tx)); return a; };
      nav.appendChild(mkA('\uD83C\uDFE0', 'Home', '/'));
      nav.appendChild(mkA('\u2630', 'Categories', '/c/', isC));
      var sb = el('button'); sb.type = 'button'; sb.appendChild(el('b', '', '\uD83D\uDD0D')); sb.appendChild(D.createTextNode('Search'));
      sb.onclick = function () { window.scrollTo({ top: 0, behavior: 'smooth' }); if (inp) setTimeout(function () { inp.focus(); }, 250); };
      nav.appendChild(sb);
      nav.appendChild(mkA('\uD83D\uDED2', 'Cart', '/#cart', false, true));
      nav.appendChild(mkA('\uD83D\uDCE6', 'Orders', '/track.html'));
      D.body.appendChild(nav); D.body.classList.add('kp-nav');
    }
    badges();
    window.addEventListener('pageshow', badges);
    window.addEventListener('storage', badges);

    /* ---------- live badges, prices and Add to cart on product cards ---------- */
    if (isC || isAll) {
      api('products?active=eq.true&select=id,price,old_price,stock').then(function (rows) {
        var m = {}; rows.forEach(function (r) { m[r.id] = r; });
        [].forEach.call(D.querySelectorAll('ul.g li'), function (li) {
          var a = li.querySelector('a[href^="/p/"]'), pr = li.lastElementChild; if (!a || !pr || pr === a) return;
          var id = idOf(a.getAttribute('href')), r = m[id]; if (!r) return;
          if (/^\s*from/i.test(pr.textContent)) {   /* several pack sizes: keep the "From" price and let the shopper pick a size on the product page */
            var sz = el('a', 'kp-add kp-alt', 'Select size'); sz.href = a.href; li.appendChild(sz); return;
          }
          var now = Number(r.price), was = Number(r.old_price), out = Number(r.stock) <= 0;
          pr.textContent = money(now);
          if (was > now && now >= 0) {
            pr.appendChild(el('s', 'kp-old', money(was)));
            li.insertBefore(el('span', 'kp-b', '-' + Math.max(1, Math.round((was - now) / was * 100)) + '%'), li.firstChild);
          }
          var b = el('button', 'kp-add', out ? 'Sold out' : 'Add to cart'); b.type = 'button';
          if (out) { li.classList.add('kp-so'); b.disabled = true; if (!li.querySelector('.kp-b')) li.insertBefore(el('span', 'kp-b', 'Sold out'), li.firstChild); }
          else b.onclick = function (e) {
            e.preventDefault();
            if (addPending(id)) { b.textContent = '\u2713 Added'; setTimeout(function () { b.textContent = 'Add to cart'; }, 1500); toast('Added to cart', true); badges(); }
            else toast('Could not save your cart on this browser');
          };
          li.appendChild(b);
        });
      });
    }

    /* ---------- product page: photo gallery + Add to cart ---------- */
    if (isP) {
      var pid = idOf(P), soldOut = !!D.querySelector('main p.no');
      var hasSizes = [].some.call(D.querySelectorAll('h2'), function (h) { return /^available sizes/i.test(h.textContent); });
      var imgs = [];
      [].forEach.call(D.querySelectorAll('script[type="application/ld+json"]'), function (s) {
        try {
          var j = JSON.parse(s.textContent);
          (Array.isArray(j) ? j : [j]).forEach(function (o) {
            if (!o) return;
            var add = function (v) { [].concat(v || []).forEach(function (u) { if (typeof u === 'string' && imgs.indexOf(u) < 0) imgs.push(u); }); };
            if (o['@type'] === 'Product') add(o.image);
            if (o['@type'] === 'ProductGroup') (o.hasVariant || []).forEach(function (v) { add(v.image); });
          });
        } catch (e) {}
      });
      var main = D.querySelector('.pg img'), col = main && main.parentElement;
      if (main && col && imgs.length > 1) {
        var th = el('div', 'kp-th'), cur = Math.max(0, imgs.indexOf(main.getAttribute('src')));
        var go = function (n) {
          cur = (n + imgs.length) % imgs.length; main.src = imgs[cur]; main.removeAttribute('srcset');
          [].forEach.call(th.children, function (b, k) { b.classList.toggle('on', k === cur); });
        };
        imgs.forEach(function (u, k) {
          var b = el('button'); b.type = 'button'; b.setAttribute('aria-label', 'Photo ' + (k + 1));
          var i = new Image(); i.src = u; i.alt = ''; i.loading = 'lazy'; i.style.pointerEvents = 'none'; b.appendChild(i);
          b.onclick = function () { go(k); }; th.appendChild(b);
        });
        col.appendChild(th); go(cur);
        var sx = 0;
        col.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
        col.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1)); }, { passive: true });
      }
      if (!soldOut && pid) {
        /* single-size products are added straight away; products with sizes open the shop so a size can be chosen */
        var cartHref = '/#p-' + encodeURIComponent(pid);
        var direct = function (e) { if (hasSizes) return; e.preventDefault(); if (addPending(pid)) { toast('Added to cart', true); badges(); } else toast('Could not save your cart on this browser'); };
        var first = D.querySelector('.pg a.btn');
        if (first) { var cb = el('a', 'btn kp-cart', '\uD83D\uDED2 Add to cart'); cb.href = cartHref; cb.addEventListener('click', direct); first.parentNode.insertBefore(cb, first); }
        var stk = D.querySelector('.stk');
        if (stk) {
          var wa = stk.querySelector('a:not(.call)'), call = stk.querySelector('a.call');
          var sc = el('a', 'kp-c', 'Add to cart'); sc.href = cartHref; sc.addEventListener('click', direct); stk.insertBefore(sc, wa || null);
          if (call) { call.textContent = '\uD83D\uDCDE'; call.setAttribute('aria-label', 'Call Stermont Arcade'); }
          if (wa && /^Order on WhatsApp/i.test(wa.textContent)) wa.textContent = 'WhatsApp';
        }
      }
    }
  } catch (e) { /* never break the page */ }
})();
