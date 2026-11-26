/*
 * checkout-deferred.v2.js  (Stermont Arcade)
 *
 * SAFE UPGRADE LAYER for checkout-deferred.js. It does NOT replace your file.
 * It loads the original, applies a handful of exact-match edits in memory, and runs the result.
 * If anything does not match (file changed, blocked by CSP, parse error), it quietly loads the
 * ORIGINAL file unchanged, so checkout keeps working exactly as before.
 *
 * Adds:
 *  1. Cart: tick boxes per item + "Select all" + "Remove selected". Only ticked items are checked out;
 *     unticked items stay in the cart.
 *  2. Saved addresses (this device only, per signed-in person) offered at checkout.
 *  3. Order tracking screen (order reference + phone) using the Neon Data API function track_order
 *     (see sql/track_order.sql; until that function exists the screen offers WhatsApp instead).
 *  4. Orders are saved to Neon (and Supabase) - see CFG.ordersTo below.
 *
 * To switch on : change the <script src="checkout-deferred.js"> line to checkout-deferred.v2.js
 * To switch off: change it back. Nothing else needs to change.
 */
(function () {
  var NEON = 'https://ep-dry-butterfly-bhytt90y.apirest.c-10.eu-central-1.aws.neon.tech/stermont/rest/v1';
  var me = document.currentScript && document.currentScript.src;
  var SRC = me ? me.replace(/checkout-deferred\.v2\.js(\?.*)?$/, 'checkout-deferred.js') : '/checkout-deferred.js';

  function useOriginal(why) {
    if (window.STM || document.getElementById('stm-orig')) return;
    try { console.warn('Checkout v2 not applied, using original checkout:', why); } catch (e) {}
    var s = document.createElement('script'); s.id = 'stm-orig'; s.src = SRC; document.head.appendChild(s);
  }

  /* ---------- small styles for the new controls ---------- */
  try {
    var st = document.createElement('style');
    st.textContent = '.stm-selbar{display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.25rem 0 .75rem}' +
      '.stm-chk{display:flex;align-items:center;gap:.6rem;font-weight:700;cursor:pointer}' +
      '.stm-chk input,.stm-box{width:22px;height:22px;accent-color:#7c3aed;flex:none;cursor:pointer}' +
      '.stm-row{display:flex;align-items:center;gap:.6rem}.stm-row .ci{flex:1;min-width:0}.stm-row.off .ci{opacity:.5}' +
      '.stm-addr-x{margin-left:auto;background:none;border:0;color:#b91c1c;font-weight:700;font-size:.8rem;cursor:pointer;padding:.25rem}';
    document.head.appendChild(st);
  } catch (e) {}

  /* ---------- new code, inserted INSIDE the original's scope (so it can use cart, form, h(), btn(), ...) ---------- */
  function plus() {
    /* ===== 1. cart with tick boxes ===== */
    function rCartPlus(b, f, T) {
      var allOn = T.A.length > 0 && T.A.every(function (i) { return i.sel; });
      var bar = h('div', 'stm-selbar'), lab = h('label', 'stm-chk'), ca = h('input');
      ca.type = 'checkbox'; ca.checked = allOn; ca.setAttribute('aria-label', 'Select all items');
      ca.onchange = function () {
        T.A.forEach(function (i) { if (ca.checked) delete unsel[i.id]; else unsel[i.id] = 1; });
        ls('stm_unsel', unsel); sync();
      };
      lab.appendChild(ca); lab.appendChild(h('span', null, 'Select all (' + T.A.length + ')')); bar.appendChild(lab);
      if (T.L.length) {
        var rb = h('button', 'rm', '\u2715 Remove selected'); rb.type = 'button';
        var armed = false, rt0;
        rb.onclick = function () {
          if (armed) {
            clearTimeout(rt0);
            T.L.forEach(function (i) { delete cart[i.id]; delete unsel[i.id]; });
            ls('stm_unsel', unsel); store(); sync(); toast('Removed'); return;
          }
          armed = true; rb.textContent = 'Tap again to confirm'; rb.classList.add('armed');
          rt0 = setTimeout(function () { armed = false; rb.classList.remove('armed'); rb.textContent = '\u2715 Remove selected'; }, 4000);
        };
        bar.appendChild(rb);
      }
      b.appendChild(bar);
      T.A.forEach(function (i) {
        var w = h('div', 'stm-row' + (i.sel ? '' : ' off')), c = h('input');
        c.type = 'checkbox'; c.className = 'stm-box'; c.checked = i.sel; c.setAttribute('aria-label', 'Select ' + i.name);
        c.onchange = function () { if (c.checked) delete unsel[i.id]; else unsel[i.id] = 1; ls('stm_unsel', unsel); sync(); };
        w.appendChild(c);
        var r = h('div', 'ci'), im = h('img'); im.src = i.img; im.alt = ''; im.width = 64; im.height = 64; r.appendChild(im);
        var m = h('div', 'cm'); m.appendChild(h('div', 'cn', i.name)); m.appendChild(h('div', 'cu', money(i.price) + ' each'));
        var q = h('div', 'qty'); q.appendChild(qb('\u2212', function () { setQ(i.id, i.qty - 1); }, 'Decrease quantity')); q.appendChild(h('span', null, i.qty)); q.appendChild(qb('+', function () { setQ(i.id, i.qty + 1); }, 'Increase quantity')); m.appendChild(q); r.appendChild(m);
        var rt = h('div', 'cr'); rt.appendChild(h('div', 'ct', money(i.total)));
        var x = h('button', 'rm', '\u2715 Remove'); x.type = 'button'; x.setAttribute('aria-label', 'Remove ' + i.name); x.onclick = function () { setQ(i.id, 0); }; rt.appendChild(x); r.appendChild(rt);
        w.appendChild(r); b.appendChild(w);
      });
      btn(b, 'Share cart link', shareCart, 'btn-alt');
      row(f, 'Selected (' + T.n + (T.n === 1 ? ' item)' : ' items)'), money(T.s), 'big');
      f.appendChild(h('p', 'note', T.n ? 'Delivery fee is added at checkout based on your county.' : 'Tick at least one item to check out.'));
      var co = btn(f, 'Checkout (' + T.n + ')', function () { go('details'); }); co.disabled = !T.n;
      btn(f, 'Keep shopping', closeDr, 'btn-alt');
      btn(f, 'Track an order', function () { go('track'); }, 'btn-alt');
    }

    /* ===== 2. saved addresses (this device, tied to the signed-in person) ===== */
    function addrList() { var x = ls('stm_addrs'); return x && x.uid === myUid() && x.list ? x.list : []; }
    function saveAddr() {
      if (form.method !== 'delivery' || !form.addr || !form.county) return;
      var a = { name: form.name.trim(), phone: form.phone, county: form.county, addr: form.addr.trim() };
      var list = addrList().filter(function (x) { return !(x.county === a.county && String(x.addr).toLowerCase() === a.addr.toLowerCase()); });
      list.unshift(a); ls('stm_addrs', { uid: myUid(), list: list.slice(0, 4) });
    }
    function addrChips(b) {
      var L = addrList(); if (!L.length || form.method !== 'delivery') return;
      var w = h('div', 'fld'); w.appendChild(h('label', null, 'Saved addresses')); var os = h('div', 'opts');
      L.forEach(function (a) {
        var on = form.addr === a.addr && form.county === a.county;
        var l = h('label', 'opt' + (on ? ' sel' : '')), r = h('input'), t = h('span');
        r.type = 'radio'; r.name = 'savedaddr'; r.checked = on;
        r.onchange = function () { form.name = a.name || form.name; form.phone = a.phone || form.phone; form.county = a.county; form.addr = a.addr; errs = {}; render(); };
        t.appendChild(h('b', null, a.name || 'Saved address')); t.appendChild(h('small', null, a.addr + ', ' + a.county));
        l.appendChild(r); l.appendChild(t);
        var x = h('button', 'stm-addr-x', 'Remove'); x.type = 'button';
        x.onclick = function (e) {
          e.preventDefault(); e.stopPropagation();
          ls('stm_addrs', { uid: myUid(), list: addrList().filter(function (y) { return !(y.county === a.county && y.addr === a.addr); }) }); render();
        };
        l.appendChild(x); os.appendChild(l);
      });
      w.appendChild(os); b.appendChild(w);
    }

    /* ===== 3. order tracking ===== */
    var trk = { busy: false, res: null, msg: '' };
    function trackLevel(r) { if (r.status === 'declined') return -1; if (r.stage === 'delivered') return 4; if (r.stage) return 3; if (r.status === 'paid') return 2; return 1; }
    function doTrack() {
      var rf = String(form.trkref || '').trim().toUpperCase(), ph = normPhone(form.trkphone);
      if (!rf || !ph) { trk.res = null; trk.msg = 'Enter your order reference and a valid phone number.'; render(); return; }
      trk.busy = true; trk.msg = ''; trk.res = null; render();
      fetch(CFG.neonUrl + '/rpc/track_order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ p_ref: rf, p_phone: ph }) })
        .then(function (r) { if (r.status === 404) throw new Error('na'); if (!r.ok) throw new Error('err'); return r.json(); })
        .then(function (j) { trk.busy = false; trk.res = j && j.found ? j : null; trk.msg = trk.res ? '' : 'No order found. Check the reference and phone number.'; render(); })
        .catch(function (e) { trk.busy = false; trk.res = null; trk.msg = e && e.message === 'na' ? 'Online tracking is not switched on yet. Message us on WhatsApp with your order reference.' : 'Could not check right now. Try again, or message us on WhatsApp.'; render(); });
    }
    function rTrack(b, f, T) {
      if (!form.trkref && doneRef) form.trkref = doneRef;
      if (!form.trkphone && form.phone) form.trkphone = form.phone;
      b.appendChild(h('p', 'note', 'Enter your order reference (like STM-AB12CD) and the phone number you ordered with.'));
      fld(b, 'trkref', 'Order reference', inp('text', 'e.g. STM-AB12CD', 'off'));
      fld(b, 'trkphone', 'Phone number', inp('tel', '07XX XXX XXX', 'tel', 'tel'));
      if (trk.msg) b.appendChild(h('div', 'oerr', trk.msg));
      if (trk.res) {
        var lv = trackLevel(trk.res), names = ['Received', 'Confirmed', 'Packed', 'Delivered'];
        if (lv < 0) box(b, 'Order ' + trk.res.ref, [['This order was declined.'], ['Please message us on WhatsApp if you think this is a mistake.']]);
        else box(b, 'Order ' + trk.res.ref, names.map(function (n, k) { return [(k < lv ? '\u2713 ' : '\u25CB ') + n, k === lv - 1 ? 'Current' : '']; }));
        if (trk.res.items && trk.res.items.length) box(b, 'Items', trk.res.items.map(function (x) { return [String(x.name || 'Item'), 'x' + (x.qty || 1)]; }));
      }
      var tb = btn(f, trk.busy ? 'Checking...' : 'Track order', doTrack); tb.disabled = trk.busy;
      var rf2 = String(form.trkref || '').trim();
      var wa = h('a', 'btn btn-alt', 'Ask on WhatsApp'); wa.href = 'https://wa.me/' + CFG.wa + '?text=' + encodeURIComponent('Hello Stermont Arcade, please update me on my order' + (rf2 ? ' ' + rf2 : '') + '.'); wa.target = '_blank'; wa.rel = 'noopener'; f.appendChild(wa);
      btn(f, 'Back to cart', function () { go('cart'); }, 'btn-alt');
    }

    /* ===== 4. save the order to Neon (and Supabase); success if either accepts it ===== */
    function postBoth(rw, hd, ctl) {
      var body = JSON.stringify(rw), sig = ctl ? ctl.signal : undefined, jobs = [], mode = CFG.ordersTo || 'both';
      if (mode !== 'supabase') jobs.push(fetch(CFG.neonUrl + '/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: body, signal: sig }));
      if (mode !== 'neon') jobs.push(fetch(CFG.sbUrl + '/rest/v1/orders', { method: 'POST', headers: hd, body: body, signal: sig }));
      return new Promise(function (resolve, reject) {
        var left = jobs.length, fails = [];
        function fail(r) {
          fails.push(r);
          if (--left === 0) {
            var real = fails.filter(function (x) { return !x.neterr; })[0];
            if (real) resolve(real); else reject(fails[0].neterr);
          }
        }
        jobs.forEach(function (p) { p.then(function (r) { if (r.ok) resolve(r); else fail(r); }, function (e) { fail({ ok: false, neterr: e }); }); });
      });
    }
  }

  var PLUS = (function () { var s = plus.toString(); return s.slice(s.indexOf('{') + 1, s.lastIndexOf('}')); })();

  /* ---------- exact-match edits: [text to find, text to put in its place] ---------- */
  var EDITS = [
    ["var CFG = { paybill: '714777',", "var CFG = { neonUrl: '" + NEON + "', ordersTo: 'both', paybill: '714777',"],
    ["var cart = ls('stm_cart') || {}, cust = ls('stm_cust') || {},", "var unsel = ls('stm_unsel') || {}; var cart = ls('stm_cart') || {}, cust = ls('stm_cust') || {},"],
    ["var L = [], n = 0, s = 0;", "var L = [], n = 0, s = 0, A = [], N = 0;"],
    ["i.qty = cart[id]; i.total = i.price * i.qty; n += i.qty; s += i.total; L.push(i);", "i.qty = cart[id]; i.total = i.price * i.qty; i.sel = !unsel[id]; N += i.qty; A.push(i); if (i.sel) { n += i.qty; s += i.total; L.push(i); }"],
    ["return { L: L, n: n, s: s };", "return { L: L, n: n, s: s, A: A, N: N };"],
    ["b.textContent = T.n > 99 ? '99+' : T.n; b.hidden = !T.n;", "b.textContent = T.N > 99 ? '99+' : T.N; b.hidden = !T.N;"],
    ["+ T.n + (T.n === 1 ? ' item' : ' items');", "+ T.N + (T.N === 1 ? ' item' : ' items');"],
    ["cb.classList.toggle('on', T.n > 0 && !isOpen);", "cb.classList.toggle('on', T.N > 0 && !isOpen);"],
    ["cart[id] = Math.min(99, (cart[id] || 0) + (q || 1));", "cart[id] = Math.min(99, (cart[id] || 0) + (q || 1)); delete unsel[id]; ls('stm_unsel', unsel);"],
    ["function rCart(b, f, T) {", PLUS + "\n      function rCart(b, f, T) { if (T.N) { return rCartPlus(b, f, T); }"],
    ["b.appendChild(e); return;", "btn(e, 'Track an order', function () { go('track'); }, 'btn-alt'); b.appendChild(e); return;"],
    ["fld(b, 'name', 'Full name', inp('text', 'e.g. Jane Wanjiru', 'name'));", "addrChips(b); fld(b, 'name', 'Full name', inp('text', 'e.g. Jane Wanjiru', 'name'));"],
    ["return fetch(CFG.sbUrl + '/rest/v1/orders', { method: 'POST', headers: hd, body: JSON.stringify(rw), signal: ctl ? ctl.signal : undefined })", "return postBoth(rw, hd, ctl)"],
    ["ref = ''; cart = {}; store(); sending = false;", "ref = ''; T.L.forEach(function (i) { delete cart[i.id]; delete unsel[i.id]; }); ls('stm_unsel', unsel); store(); sending = false;"],
    ["ls('stm_cust', { uid: myUid(), name: form.name.trim(),", "saveAddr(); ls('stm_cust', { uid: myUid(), name: form.name.trim(),"],
    ["{ cart: 0, details: 1, review: 2, done: 3 }[step]", "{ cart: 0, details: 1, review: 2, done: 3, track: 0 }[step]"],
    ["done: 'Order received' }[step]", "done: 'Order received', track: 'Track your order' }[step]"],
    ["done: rDone })[step](b, f, T);", "done: rDone, track: rTrack })[step](b, f, T);"],
    ["D.getElementById('steps').hidden = (step === 'done');", "D.getElementById('steps').hidden = (step === 'done' || step === 'track');"],
    ["if (!T.n && step !== 'done') step = 'cart';", "if (!T.n && step !== 'done' && step !== 'track') step = 'cart';"],
    ["btn(f, 'Close', function () { step = 'cart'; closeDr(); }, 'btn-alt');", "btn(f, 'Track this order', function () { form.trkref = doneRef; go('track'); }, 'btn-alt'); btn(f, 'Close', function () { step = 'cart'; closeDr(); }, 'btn-alt');"]
  ];

  function count(hay, needle) { return hay.split(needle).length - 1; }

  try {
    fetch(SRC, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('could not load ' + SRC);
      return r.text();
    }).then(function (code) {
      for (var i = 0; i < EDITS.length; i++) {
        if (count(code, EDITS[i][0]) !== 1) throw new Error('edit ' + (i + 1) + ' did not match exactly once');
      }
      for (var k = 0; k < EDITS.length; k++) code = code.split(EDITS[k][0]).join(EDITS[k][1]);
      var run = new Function(code);   /* a syntax error or a CSP block throws here, before anything runs */
      run();
      if (!window.STM) throw new Error('checkout did not start');
    }).catch(function (e) { useOriginal(e && e.message); });
  } catch (e) { useOriginal(e && e.message); }
})();
