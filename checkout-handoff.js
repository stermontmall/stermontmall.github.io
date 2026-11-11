/* Checkout hand-off failsafe + self-heal (2026-11-11).
   checkout.html covers the page with "Preparing your checkout..." (html.stm-co-wait) until the shell's cart has been
   rebuilt and the checkout panel has opened. If anything in that hand-off failed, the cover stayed forever with no message.
   checkout.html itself gives up after about 15 s, so this waits 16 s, then lifts the cover and shows a message with ways forward.
   It does nothing on any other page, and nothing when the checkout opened normally (the cover class is already gone by then).

   SELF-HEAL: checkout.html looks the cart items up in Supabase ONCE. On a weak mobile connection that single request can
   fail or hang, and then the checkout gave up even though the products are fine. If the cart cards are still missing about
   2.5 s after the page loads, this script repeats the lookup (short timeout, up to 5 tries, inside the same 15 s window) and
   adds the same hidden cards, so checkout.html's own poll finds them and opens normally. Cards that already exist are never
   touched, so it cannot double up the cart. Everything is wrapped in try/catch and can never block checkout. */
(function () {
  try {
    var root = document.documentElement;
    if (!root.classList.contains('stm-co-wait')) return;

    /* ---- self-heal: retry the cart lookup if the first one did not produce the cards ---- */
    try {
      (function () {
        var SB = 'https://oewvtbnmyombbtggamor.supabase.co', KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7';
        var items; try { items = JSON.parse(localStorage.getItem('stm_handoff') || 'null'); } catch (e) { items = null; }
        if (!Array.isArray(items) || !items.length) return;
        var ids = items.map(function (i) { return String(i && i.rowId || ''); }).filter(function (id) { return /^[a-z0-9][a-z0-9-]{0,120}$/i.test(id); });
        if (!ids.length || ids.length !== items.length) return;
        var tries = 0, t0 = Date.now();
        function missing() { return ids.filter(function (id) { return !document.getElementById('p-' + id); }); }
        function host() {
          var h = document.getElementById('stm-fast-cards');
          if (!h) {
            h = document.createElement('div'); h.id = 'stm-fast-cards'; h.setAttribute('aria-hidden', 'true');
            h.style.cssText = 'position:absolute;left:-100000px;top:0;width:1px;height:1px;overflow:hidden';
            document.body.appendChild(h);
          }
          return h;
        }
        function attempt() {
          try {
            if (!root.classList.contains('stm-co-wait')) return;            /* checkout already opened or gave up */
            var miss = missing(); if (!miss.length) return;                  /* all cards present: nothing to heal */
            if (++tries > 5 || Date.now() - t0 > 14000) return;
            var ctl = window.AbortController ? new AbortController() : null, to = setTimeout(function () { if (ctl) ctl.abort(); }, 6000);
            var url = SB + '/rest/v1/products?active=eq.true&id=in.%28' + miss.map(encodeURIComponent).join('%2C') + '%29&select=id,name,price,stock,images';
            fetch(url, { headers: { apikey: KEY }, cache: 'no-store', credentials: 'omit', signal: ctl ? ctl.signal : undefined }).then(function (r) {
              clearTimeout(to); if (!r.ok) throw new Error('Product lookup ' + r.status); return r.json();
            }).then(function (rows) {
              if (!Array.isArray(rows)) throw new Error('Invalid product response');
              var byId = {}; rows.forEach(function (r) { byId[r.id] = r; });
              items.forEach(function (item) {
                var id = String(item.rowId), row = byId[id];
                if (!row || !(Number(row.stock) > 0) || document.getElementById('p-' + id)) return;
                var card = document.createElement('div'); card.className = 'pcard stm-checkout-fast-card'; card.id = 'p-' + id;
                var title = document.createElement('h3'); title.textContent = item.name || row.name || id;
                var price = document.createElement('p'); price.className = 'price'; price.textContent = 'KSh ' + Math.round(Number(row.price)).toLocaleString('en-KE');
                card.appendChild(title); card.appendChild(price);
                if (Array.isArray(row.images) && row.images[0]) { var img = document.createElement('img'); img.src = row.images[0]; img.alt = ''; card.appendChild(img); }
                host().appendChild(card);
              });
              if (missing().length) setTimeout(attempt, 1500);
            }).catch(function () { clearTimeout(to); setTimeout(attempt, 1500); });
          } catch (e) {}
        }
        setTimeout(attempt, 2500);
      })();
    } catch (e) {}

    /* ---- failsafe: lift the cover and show a message if checkout still has not opened ---- */
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
