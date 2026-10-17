/* Stermont Arcade · admin: M-Pesa payments received (Paybill notifications + STK push), matched to orders.
   Mounted by admin.html through STMMpesa.mount(containerEl). Read-only: it never changes an order by itself.
   Approving still goes through the normal confirm box (STMAdmin.approveWith), so staff stay in control. */
(function () {
  var D = document;
  function h(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function A() { return window.STMAdmin; }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function last9(s) { var d = digits(s); return d.length >= 9 ? d.slice(-9) : d; }
  function money(n) { return A().money(n); }

  function req(path) {
    return A().api(path).then(function (r) {
      if (r.status === 401) throw new Error('Your session expired. Sign in again.');
      if (r.status === 404) { var e = new Error('missing'); e.missing = true; throw e; }
      if (!r.ok) throw new Error('Request failed (' + r.status + ')');
      return r.json();
    });
  }
  function load() {
    var c2b = req('/rest/v1/mpesa_c2b_payments?select=*&order=created_at.desc&limit=300').catch(function (e) { if (e.missing) return null; throw e; });
    var stk = req('/rest/v1/mpesa_payments?select=*&order=created_at.desc&limit=300').catch(function (e) { if (e.missing) return []; throw e; });
    return Promise.all([c2b, stk]);
  }

  /* one list from both sources; the same M-Pesa code is only shown once (the STK row wins because it knows the order) */
  function normalise(c2b, stk) {
    var out = [], seen = {};
    (stk || []).forEach(function (p) {
      var code = String(p.mpesa_receipt || '').trim().toUpperCase();
      if (!code || p.status !== 'success' || seen[code]) return;
      seen[code] = 1;
      out.push({ code: code, amount: Number(p.paid_amount != null ? p.paid_amount : p.amount) || 0, phone: p.phone || '', name: '', at: p.paid_at || p.created_at, src: 'STK push', hint: p.order_ref || '', test: false });
    });
    (c2b || []).forEach(function (p) {
      var code = String(p.trans_id || '').trim().toUpperCase();
      if (!code || seen[code]) return;
      seen[code] = 1;
      out.push({ code: code, amount: Number(p.amount) || 0, phone: p.msisdn || '', name: p.payer_name || '', at: p.created_at, src: 'Paybill', hint: p.bill_ref || '', test: p.env !== 'production' });
    });
    out.sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
    return out;
  }

  function matchFor(p, orders) {
    var used = null;
    orders.forEach(function (o) { if (String(o.pay_code || '').trim().toUpperCase() === p.code) used = o; });
    if (used) return { used: used, cands: [] };
    var hint = String(p.hint || '').toUpperCase().replace(/\s+/g, '');
    var cands = orders.filter(function (o) { return (o.status || 'pending') === 'pending'; }).map(function (o) {
      var s = 0, why = [], ref = String(o.ref || '').toUpperCase().replace(/\s+/g, '');
      if (hint && ref && (hint === ref || hint.indexOf(ref) > -1)) { s += 3; why.push('order number matches'); }
      if (Number(o.subtotal) === p.amount) { s += 2; why.push('amount matches'); }
      if (last9(o.phone) && last9(o.phone) === last9(p.phone)) { s += 1; why.push('phone matches'); }
      return { o: o, s: s, why: why.join(', ') };
    }).filter(function (x) { return x.s >= 2; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 3);
    return { used: null, cands: cands };
  }

  function mount(root) {
    root.textContent = '';
    var c = h('div'); root.appendChild(c);
    var data = { c2b: null, stk: [] }, filter = 'all', needle = '', loaded = false;

    var intro = h('div', 'card');
    intro.appendChild(h('p', 'meta', 'Every payment made to your Paybill (and by STK push) shows here. Tap a suggested order to approve it with the M-Pesa code already filled in. Nothing is approved automatically.'));
    var setup = h('div', 'meta'); intro.appendChild(setup);
    c.appendChild(intro);

    var kp = h('div'); kp.id = 'mp-kpis'; kp.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:.5rem;margin-bottom:.9rem'; c.appendChild(kp);

    var bar = h('div', 'tabs'); c.appendChild(bar);
    var row = h('div'); row.style.cssText = 'display:flex;gap:.5rem;margin-bottom:.9rem'; c.appendChild(row);
    var q = D.createElement('input'); q.type = 'search'; q.placeholder = 'Search code, name, phone or amount'; q.style.cssText = 'flex:1;min-width:0;padding:.7rem .9rem;border:1px solid var(--ln);border-radius:12px;font:inherit;background:#fff';
    var rf = h('button', 'btn alt sm', '↻ Refresh'); rf.type = 'button';
    row.appendChild(q); row.appendChild(rf);
    var list = h('div'); c.appendChild(list);

    function kpi(label, val, cls) { var d = h('div', 'kp ' + (cls || '')); d.appendChild(h('small', null, label)); d.appendChild(h('b', null, String(val))); kp.appendChild(d); }

    function draw() {
      var orders = window.STM_orders || [], all = normalise(data.c2b, data.stk).map(function (p) { p.m = matchFor(p, orders); return p; });
      var real = all.filter(function (p) { return !p.test; }), todayStr = new Date().toDateString();
      var today = real.filter(function (p) { return new Date(p.at).toDateString() === todayStr; }).reduce(function (a, p) { return a + p.amount; }, 0);
      var unmatched = real.filter(function (p) { return !p.m.used; });

      setup.textContent = data.c2b === null ? 'Paybill notifications are not set up yet (the payment tables are missing). STK push payments still show here.'
        : (data.c2b.length ? '' : 'No Paybill notifications received yet. They start arriving once the payments-in links are registered with Safaricom (see supabase/functions/payments-in/README.md).');
      setup.hidden = !setup.textContent;

      kp.textContent = '';
      kpi('Received today', money(today), 'hi'); kpi('Not matched to an order', unmatched.length); kpi('Payments listed', real.length);
      kpi('Latest', real.length ? new Date(real[0].at).toLocaleString('en-KE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '–');

      bar.textContent = '';
      [['all', 'All (' + all.length + ')'], ['unmatched', 'Not matched (' + all.filter(function (p) { return !p.m.used && !p.test; }).length + ')'], ['matched', 'Matched (' + all.filter(function (p) { return p.m.used; }).length + ')']].forEach(function (f) {
        var b = h('button', filter === f[0] ? 'on' : '', f[1]); b.type = 'button'; b.onclick = function () { filter = f[0]; draw(); }; bar.appendChild(b);
      });

      var words = needle.toLowerCase().split(/\s+/).filter(Boolean);
      var shown = all.filter(function (p) {
        if (filter === 'matched' && !p.m.used) return false;
        if (filter === 'unmatched' && (p.m.used || p.test)) return false;
        var hay = [p.code, p.name, p.phone, p.amount, p.hint, p.m.used && p.m.used.ref].join(' ').toLowerCase();
        return words.every(function (w) { return hay.indexOf(w) > -1; });
      });

      list.textContent = '';
      if (!loaded) { list.appendChild(h('div', 'empty', 'Loading payments…')); return; }
      if (!shown.length) { list.appendChild(h('div', 'empty', all.length ? 'No payment matches this view.' : 'No payments recorded yet.')); return; }

      shown.forEach(function (p) {
        var k = h('div', 'card' + (p.m.used ? ' done' : '')), top = h('div', 'top'), l = h('div');
        l.appendChild(h('div', 'ref', money(p.amount)));
        l.appendChild(h('div', 'when', new Date(p.at).toLocaleString('en-KE') + ' · ' + p.src));
        top.appendChild(l);
        var tag = p.test ? ['b-pending', 'Sandbox test'] : p.m.used ? ['b-paid', 'Matched'] : ['b-pending', 'Not matched'];
        top.appendChild(h('span', 'badge ' + tag[0], tag[1])); k.appendChild(top);

        var cd = h('div', 'meta'); cd.appendChild(h('b', null, 'M-Pesa code: '));
        var mono = h('span', null, p.code); mono.style.cssText = 'font-family:ui-monospace,Menlo,monospace;font-weight:700;letter-spacing:.06em;color:var(--tx)'; cd.appendChild(mono); k.appendChild(cd);
        if (p.name) k.appendChild(h('div', 'meta', 'Paid by: ' + p.name));
        if (p.phone && digits(p.phone).length < 14) k.appendChild(h('div', 'meta', 'Phone: ' + p.phone));
        if (p.hint) k.appendChild(h('div', 'meta', 'Account / order number given: ' + p.hint));

        var a = h('div', 'acts');
        if (p.test) {
          k.appendChild(h('div', 'meta', 'This came from the Safaricom test environment. It is not real money, so it cannot be used to approve an order.'));
        } else if (p.m.used) {
          var u = p.m.used; k.appendChild(h('div', 'meta', 'Recorded on order ' + u.ref + ' (' + (u.status || 'pending') + ')'));
          var amtOff = Number(u.pay_amount) !== p.amount;
          if (amtOff) k.appendChild(h('div', 'meta', 'Note: the order records ' + money(u.pay_amount) + ' but this payment is ' + money(p.amount) + '.'));
        } else if (!p.m.cands.length) {
          k.appendChild(h('div', 'meta', 'No pending order matches this payment yet. It will match when the order number or amount lines up.'));
        } else {
          k.appendChild(h('div', 'meta', 'Suggested order' + (p.m.cands.length > 1 ? 's' : '') + ':'));
          p.m.cands.forEach(function (x) {
            var b = h('button', 'btn ok sm', 'Approve ' + x.o.ref + ' · ' + money(x.o.subtotal)); b.type = 'button';
            b.onclick = function () { A().approveWith(x.o.ref, p.code, p.amount); };
            a.appendChild(b);
            k.appendChild(h('div', 'meta', x.o.ref + ' (' + (x.o.customer_name || 'customer') + '): ' + x.why));
          });
        }
        if (a.childNodes.length) k.appendChild(a);
        list.appendChild(k);
      });
    }

    function fetchAll(quiet) {
      if (!quiet) { loaded = false; draw(); }
      return load().then(function (r) { data.c2b = r[0]; data.stk = r[1]; loaded = true; draw(); })
        .catch(function (e) { loaded = true; if (!quiet) { list.textContent = ''; list.appendChild(h('div', 'err', 'Could not load payments: ' + e.message)); } });
    }
    q.addEventListener('input', function () { needle = q.value; draw(); });
    rf.onclick = function () { rf.disabled = true; fetchAll(false).then(function () { rf.disabled = false; }); };
    fetchAll(false);
    var live = setInterval(function () { if (!c.isConnected) { clearInterval(live); return; } if (!D.hidden) fetchAll(true); }, 20000);
  }

  window.STMMpesa = { mount: mount };
})();
