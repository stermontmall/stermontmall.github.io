/* Stermont Arcade · admin insights: Sales dashboard + M-Pesa payment matching.
   Mounted by admin.html through STMInsights.mount(containerEl, 'sales' | 'mpesa').
   Also offers STMInsights.verify(order) and STMInsights.suggestFor(order) for the order cards and the approve box.
   Read-only: it never marks an order paid. Staff still tap Confirm. All text is set with textContent. */
(function () {
  var D = document, TZ = 'Africa/Nairobi';
  var A = function () { return window.STMAdmin; };
  function h(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function money(n) { return 'KSh ' + Math.round(Number(n || 0)).toLocaleString('en-KE'); }
  function kdate(d) { try { return new Date(d).toLocaleDateString('en-CA', { timeZone: TZ }); } catch (e) { return ''; } }   /* YYYY-MM-DD in Kenya */
  function ktime(d) { try { return new Date(d).toLocaleString('en-KE', { timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }
  function last9(s) { return String(s || '').replace(/\D/g, '').slice(-9); }
  function up(s) { return String(s || '').replace(/\s+/g, '').toUpperCase(); }

  (function css() {
    if (D.getElementById('si-css')) return;
    var s = D.createElement('style'); s.id = 'si-css';
    s.textContent = [
      '.si-chips{display:flex;gap:.4rem;flex-wrap:wrap;margin:0 0 .8rem}',
      '.si-chip{border:1px solid var(--ln,#ddd);background:#fff;border-radius:999px;padding:.45rem .85rem;font:inherit;font-size:.85rem;cursor:pointer;color:var(--tx,#222)}',
      '.si-chip.on{background:#5b21b6;border-color:#5b21b6;color:#fff;font-weight:700}',
      '.si-k{display:grid;grid-template-columns:repeat(2,1fr);gap:.6rem;margin-bottom:.8rem}',
      '@media(min-width:720px){.si-k{grid-template-columns:repeat(4,1fr)}}',
      '.si-kp{background:#fff;border:1px solid var(--ln,#e5e5ee);border-radius:14px;padding:.8rem .9rem}',
      '.si-kp small{display:block;color:#6b6b80;font-size:.72rem;text-transform:uppercase;letter-spacing:.04em}',
      '.si-kp b{display:block;font-size:1.15rem;margin-top:.15rem;word-break:break-word}',
      '.si-kp i{display:block;font-style:normal;font-size:.75rem;color:#6b6b80;margin-top:.1rem}',
      '.si-card{background:#fff;border:1px solid var(--ln,#e5e5ee);border-radius:14px;padding:.9rem;margin-bottom:.8rem}',
      '.si-card h3{margin:0 0 .6rem;font-size:.98rem}',
      '.si-row{display:flex;align-items:center;gap:.5rem;margin:.3rem 0;font-size:.88rem}',
      '.si-row .n{flex:0 0 38%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.si-row .bar{flex:1;height:10px;background:#eceaf5;border-radius:99px;overflow:hidden}',
      '.si-row .bar>span{display:block;height:100%;background:#5b21b6;border-radius:99px}',
      '.si-row .v{flex:0 0 auto;font-weight:700;font-size:.82rem;text-align:right;min-width:4.5rem}',
      '.si-note{color:#6b6b80;font-size:.8rem;margin:.4rem 0 0}',
      '.si-ok{color:#15803d;font-weight:700}.si-warn{color:#b45309;font-weight:700}.si-bad{color:#b91c1c;font-weight:700}',
      '.si-pill{display:inline-block;border-radius:999px;padding:.12rem .55rem;font-size:.72rem;font-weight:700;background:#eceaf5;color:#3b2a7a}',
      '.si-pill.g{background:#dcfce7;color:#166534}.si-pill.o{background:#ffedd5;color:#9a3412}.si-pill.r{background:#fee2e2;color:#991b1b}',
      '.si-sug{margin:.5rem 0 .8rem}.si-sug button{display:block;width:100%;text-align:left;margin:.3rem 0;padding:.55rem .7rem;border:1px solid #c4b5fd;background:#f5f3ff;border-radius:10px;font:inherit;font-size:.85rem;cursor:pointer}'
    ].join('');
    D.head.appendChild(s);
  })();

  function get(path) {
    return A().ready().then(function () { return A().api(path); }).then(function (r) {
      if (r.status === 401) throw new Error('Your session expired. Sign in again.');
      if (r.status === 404) throw new Error('missing');
      if (!r.ok) throw new Error('Request failed (' + r.status + ')');
      return r.json();
    });
  }
  function errBox(root, text) { root.textContent = ''; root.appendChild(h('div', 'err', text)); }

  /* ---------------- payments cache (used by the M-Pesa tab, order cards and the approve box) ---------------- */
  var cache = { at: 0, p: null };
  function payments(force) {
    if (!force && cache.p && Date.now() - cache.at < 20000) return cache.p;
    cache.at = Date.now();
    cache.p = get('/rest/v1/mpesa_c2b_payments?select=*&order=created_at.desc&limit=500').catch(function (e) { cache.at = 0; throw e; });
    return cache.p;
  }
  function claimedCodes() {
    var set = {}; (window.STM_orders || []).forEach(function (o) { if (o.pay_code) set[up(o.pay_code)] = o.ref; }); return set;
  }
  /* Does the code on this order match a payment we received from Safaricom, for the right amount? */
  function verify(o) {
    var code = up(o.pay_code);
    if (!code) return Promise.resolve({ state: 'none' });
    return payments().then(function (rows) {
      var m = rows.filter(function (p) { return up(p.trans_id) === code; })[0];
      if (!m) return { state: 'unseen' };
      var due = Number(o.subtotal || 0), got = Number(m.amount || 0);
      return { state: got >= due ? 'ok' : 'short', got: got, due: due, test: m.env === 'sandbox' };
    }).catch(function () { return { state: 'na' }; });
  }
  /* Unclaimed payments that plausibly belong to this order, best first. */
  function suggestFor(o) {
    return payments().then(function (rows) {
      var taken = claimedCodes(), due = Number(o.subtotal || 0), ph = last9(o.phone), ref = up(o.ref);
      return rows.filter(function (p) { return !taken[up(p.trans_id)] || taken[up(p.trans_id)] === o.ref; }).map(function (p) {
        var s = 0, why = [];
        if (up(p.bill_ref).indexOf(ref) > -1 && ref) { s += 5; why.push('account matches order'); }
        if (Number(p.amount) === due) { s += 3; why.push('exact amount'); } else if (Number(p.amount) > due) { s += 1; why.push('more than total'); }
        if (ph && last9(p.msisdn) === ph) { s += 2; why.push('same phone'); }
        var age = (Date.now() - new Date(p.created_at).getTime()) / 36e5;
        if (o.created_at && new Date(p.created_at) < new Date(o.created_at) - 36e5) s -= 5;   /* paid long before the order existed */
        return { p: p, score: s, why: why, age: age };
      }).filter(function (x) { return x.score >= 3; }).sort(function (a, b) { return b.score - a.score || a.age - b.age; }).slice(0, 3);
    }).catch(function () { return []; });
  }

  /* ---------------- shared chart helpers ---------------- */
  function bars(days, vals, lab) {
    var NS = 'http://www.w3.org/2000/svg', W = 600, H = 170, pad = 22, mx = Math.max.apply(null, vals.concat([1]));
    var svg = D.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + (H + 18)); svg.setAttribute('width', '100%'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', (lab ? 'Searches' : 'Revenue') + ' per ' + (days.length > 62 ? 'month' : 'day'));
    var bw = (W - pad) / Math.max(days.length, 1);
    vals.forEach(function (v, i) {
      var bh = v ? Math.max(2, (v / mx) * (H - 14)) : 0, r = D.createElementNS(NS, 'rect');
      r.setAttribute('x', String(pad + i * bw + 1)); r.setAttribute('width', String(Math.max(1, bw - 2))); r.setAttribute('y', String(H - bh)); r.setAttribute('height', String(bh)); r.setAttribute('rx', '2'); r.setAttribute('fill', '#5b21b6');
      var t = D.createElementNS(NS, 'title'); t.textContent = days[i] + ': ' + (lab ? lab(v) : money(v)); r.appendChild(t); svg.appendChild(r);
    });
    function tx(x, y, s, a) { var t = D.createElementNS(NS, 'text'); t.setAttribute('x', String(x)); t.setAttribute('y', String(y)); t.setAttribute('font-size', '11'); t.setAttribute('fill', '#6b6b80'); if (a) t.setAttribute('text-anchor', a); t.textContent = s; svg.appendChild(t); }
    tx(pad, H + 14, days[0] || '', 'start'); tx(W, H + 14, days[days.length - 1] || '', 'end'); tx(pad, 10, 'Peak ' + (lab ? lab(mx) : money(mx)), 'start');
    return svg;
  }
  function rows(card, list, fmt) {
    var mx = Math.max.apply(null, list.map(function (x) { return x.v; }).concat([1]));
    list.forEach(function (x) {
      var r = h('div', 'si-row'); var n = h('span', 'n', x.n); n.title = x.n; r.appendChild(n);
      var b = h('span', 'bar'), f = h('span'); f.style.width = Math.max(3, x.v / mx * 100) + '%'; b.appendChild(f); r.appendChild(b); r.appendChild(h('span', 'v', fmt(x))); card.appendChild(r);
    });
  }

  /* ---------------- sales dashboard ---------------- */
  var RANGES = [['today', 'Today'], ['7', '7 days'], ['30', '30 days'], ['month', 'This month'], ['all', 'All time']];
  var S = { range: '30' };
  function startOf(range) {
    var now = new Date(), t = kdate(now);
    if (range === 'today') return t;
    if (range === 'month') return t.slice(0, 7) + '-01';
    if (range === 'all') return '0000-00-00';
    var d = new Date(now.getTime() - (Number(range) - 1) * 864e5); return kdate(d);
  }
  function sales(root) {
    root.textContent = ''; var wrap = h('div'); root.appendChild(wrap);
    var chips = h('div', 'si-chips'); wrap.appendChild(chips);
    var body = h('div'); wrap.appendChild(body);
    var data = null;
    RANGES.forEach(function (r) {
      var b = h('button', 'si-chip' + (S.range === r[0] ? ' on' : ''), r[1]); b.type = 'button';
      b.onclick = function () { S.range = r[0]; Array.prototype.forEach.call(chips.children, function (c) { c.className = 'si-chip'; }); b.className = 'si-chip on'; if (data) draw(); };
      chips.appendChild(b);
    });
    body.appendChild(h('div', 'empty', 'Loading sales...'));
    Promise.all([
      get('/rest/v1/orders?select=ref,created_at,status,stage,subtotal,items,county,method,discount,voucher_code&order=created_at.desc&limit=2000'),
      get('/rest/v1/expenses?select=spent_on,amount&order=spent_on.desc&limit=2000').catch(function () { return []; })
    ]).then(function (r) { data = { orders: r[0], expenses: r[1] }; draw(); })
      .catch(function (e) { errBox(body, e.message === 'missing' ? 'Could not load orders.' : e.message); });

    function draw() {
      body.textContent = '';
      var from = startOf(S.range), inR = data.orders.filter(function (o) { return kdate(o.created_at) >= from; });
      var paid = inR.filter(function (o) { return o.status === 'paid'; }), pend = inR.filter(function (o) { return (o.status || 'pending') === 'pending'; }), dec = inR.filter(function (o) { return o.status === 'declined'; });
      var rev = paid.reduce(function (a, o) { return a + (+o.subtotal || 0); }, 0), pv = pend.reduce(function (a, o) { return a + (+o.subtotal || 0); }, 0);
      var exp = data.expenses.filter(function (x) { return String(x.spent_on) >= from; }).reduce(function (a, x) { return a + (+x.amount || 0); }, 0);
      var decided = paid.length + dec.length, conv = decided ? Math.round(paid.length / decided * 100) : null, disc = paid.reduce(function (a, o) { return a + (+o.discount || 0); }, 0);
      var k = h('div', 'si-k');
      [['Revenue (confirmed)', money(rev), paid.length + ' order' + (paid.length === 1 ? '' : 's')],
       ['Average order', paid.length ? money(rev / paid.length) : '–', ''],
       ['Waiting for payment', money(pv), pend.length + ' pending'],
       ['Confirmed rate', conv == null ? '–' : conv + '%', dec.length + ' declined'],
       ['Expenses', money(exp), 'from Expenses tab'],
       ['Revenue less expenses', money(rev - exp), 'before cost of goods'],
       ['Vouchers given', money(disc), 'already off the totals'],
       ['All orders', String(inR.length), 'in this period']].forEach(function (x) {
        var c = h('div', 'si-kp'); c.appendChild(h('small', null, x[0])); c.appendChild(h('b', null, x[1])); if (x[2]) c.appendChild(h('i', null, x[2])); k.appendChild(c);
      });
      body.appendChild(k);

      /* trend */
      var tc = h('div', 'si-card'); tc.appendChild(h('h3', null, 'Revenue over time'));
      var byDay = {}; paid.forEach(function (o) { var d = kdate(o.created_at); byDay[d] = (byDay[d] || 0) + (+o.subtotal || 0); });
      var keys = Object.keys(byDay).sort(), days = [], vals = [];
      if (keys.length) {
        var monthly = S.range === 'all' && keys.length > 62, a = new Date(keys[0] + 'T00:00:00Z'), z = new Date(kdate(new Date()) + 'T00:00:00Z');
        if (S.range !== 'all') a = new Date(from + 'T00:00:00Z');
        if (monthly) { var m = {}; keys.forEach(function (d) { var mk = d.slice(0, 7); m[mk] = (m[mk] || 0) + byDay[d]; }); Object.keys(m).sort().forEach(function (mk) { days.push(mk); vals.push(m[mk]); }); }
        else { for (var d = a; d <= z && days.length < 400; d = new Date(d.getTime() + 864e5)) { var ds = d.toISOString().slice(0, 10); days.push(ds); vals.push(byDay[ds] || 0); } }
        tc.appendChild(bars(days, vals));
        var bi = vals.indexOf(Math.max.apply(null, vals)); tc.appendChild(h('p', 'si-note', 'Best ' + (monthly ? 'month' : 'day') + ': ' + days[bi] + ' with ' + money(vals[bi]) + '.'));
      } else tc.appendChild(h('div', 'empty', 'No confirmed orders in this period.'));
      body.appendChild(tc);

      /* best sellers */
      var prod = {}; paid.forEach(function (o) { (o.items || []).forEach(function (i) {
        if (!i || /^delivery fee/i.test(i.name || '')) return; var p = prod[i.name] || (prod[i.name] = { n: i.name, q: 0, v: 0 }); p.q += +i.qty || 0; p.v += +i.total || 0; }); });
      var top = Object.keys(prod).map(function (n) { return prod[n]; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 8);
      var bc = h('div', 'si-card'); bc.appendChild(h('h3', null, 'Best sellers (by revenue)'));
      if (top.length) rows(bc, top, function (x) { return money(x.v) + ' · ' + x.q + ' sold'; }); else bc.appendChild(h('div', 'empty', 'Nothing sold in this period.'));
      body.appendChild(bc);

      /* where */
      var cty = {}, del = 0, pick = 0; paid.forEach(function (o) { if (o.method === 'delivery') { del++; var c = (o.county || 'Unknown'); cty[c] = (cty[c] || 0) + (+o.subtotal || 0); } else pick++; });
      var cl = Object.keys(cty).map(function (n) { return { n: n, v: cty[n] }; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 6);
      var cc = h('div', 'si-card'); cc.appendChild(h('h3', null, 'Where orders go'));
      cc.appendChild(h('p', 'si-note', 'Delivery: ' + del + ' · Pickup: ' + pick));
      if (cl.length) rows(cc, cl, function (x) { return money(x.v); });
      body.appendChild(cc);

      /* fulfilment */
      var st = { none: 0, packed: 0, out_for_delivery: 0, delivered: 0 }; paid.forEach(function (o) { st[o.stage || 'none']++; });
      var fc = h('div', 'si-card'); fc.appendChild(h('h3', null, 'Fulfilment of confirmed orders'));
      rows(fc, [{ n: 'Not packed yet', v: st.none }, { n: 'Packed', v: st.packed }, { n: 'Out for delivery', v: st.out_for_delivery }, { n: 'Delivered', v: st.delivered }], function (x) { return String(x.v); });
      if (st.none) fc.appendChild(h('p', 'si-note si-warn', st.none + ' confirmed order' + (st.none === 1 ? ' is' : 's are') + ' waiting to be packed.'));
      body.appendChild(fc);
      if (data.orders.length >= 2000) body.appendChild(h('p', 'si-note', 'Showing the latest 2,000 orders.'));
    }
  }


  /* ---------------- shopper searches ---------------- */
  var SR = { range: '30' };
  function searches(root) {
    root.textContent = ''; var wrap = h('div'); root.appendChild(wrap);
    wrap.appendChild(h('p', 'si-note', 'What shoppers type into the search box on your shop. Words only: no names, phones or accounts are stored.'));
    var chips = h('div', 'si-chips'); wrap.appendChild(chips); var body = h('div'); wrap.appendChild(body);
    var all = null;
    RANGES.forEach(function (r) {
      var b = h('button', 'si-chip' + (SR.range === r[0] ? ' on' : ''), r[1]); b.type = 'button';
      b.onclick = function () { SR.range = r[0]; Array.prototype.forEach.call(chips.children, function (c) { c.className = 'si-chip'; }); b.className = 'si-chip on'; if (all) draw(); };
      chips.appendChild(b);
    });
    body.appendChild(h('div', 'empty', 'Loading searches...'));
    get('/rest/v1/search_logs?select=created_at,term,results,source,session_id&order=created_at.desc&limit=5000')
      .then(function (r) { all = r; draw(); })
      .catch(function (e) { errBox(body, e.message === 'missing' ? 'Search tracking is not set up yet. In Supabase, run setup-search.sql (in the root of your website repo). Searches will appear here after that.' : e.message); });

    function group(list) {
      var m = {}; list.forEach(function (x) {   /* list is newest first, so the first row seen holds the latest result count */
        var g = m[x.term] || (m[x.term] = { t: x.term, n: 0, z: 0, last: +x.results || 0, v: {} }); g.n++; if (!(+x.results > 0)) g.z++; if (x.session_id) g.v[x.session_id] = 1; });
      return Object.keys(m).map(function (k) { var g = m[k]; g.visits = Object.keys(g.v).length || g.n; return g; });
    }
    function csvCell(v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
    function draw() {
      body.textContent = '';
      var from = startOf(SR.range), cur = all.filter(function (x) { return kdate(x.created_at) >= from; });
      if (!cur.length) { body.appendChild(h('div', 'empty', all.length ? 'No searches in this period.' : 'No searches recorded yet. They appear here once shoppers use the search box.')); return; }
      var g = group(cur).sort(function (a, b) { return b.n - a.n; }), zeroTerms = g.filter(function (x) { return x.z / x.n >= 0.5; });
      var zeroSearches = cur.filter(function (x) { return !(+x.results > 0); }).length, visits = {}; cur.forEach(function (x) { if (x.session_id) visits[x.session_id] = 1; });
      var k = h('div', 'si-k');
      [['Searches', String(cur.length), Object.keys(visits).length + ' visits searched'], ['Different terms', String(g.length), ''],
       ['Found nothing', Math.round(zeroSearches / cur.length * 100) + '%', zeroSearches + ' searches'], ['Top search', g[0].t, g[0].n + ' times']].forEach(function (x) {
        var c = h('div', 'si-kp'); c.appendChild(h('small', null, x[0])); c.appendChild(h('b', null, x[1])); if (x[2]) c.appendChild(h('i', null, x[2])); k.appendChild(c); });
      body.appendChild(k);

      var tc = h('div', 'si-card'); tc.appendChild(h('h3', null, 'Searches per day'));
      var byDay = {}; cur.forEach(function (x) { var d = kdate(x.created_at); byDay[d] = (byDay[d] || 0) + 1; });
      var keys = Object.keys(byDay).sort(), days = [], vals = [], a = new Date((SR.range === 'all' ? keys[0] : from) + 'T00:00:00Z'), z = new Date(kdate(new Date()) + 'T00:00:00Z');
      for (var d = a; d <= z && days.length < 400; d = new Date(d.getTime() + 864e5)) { var ds = d.toISOString().slice(0, 10); days.push(ds); vals.push(byDay[ds] || 0); }
      tc.appendChild(bars(days, vals, function (v) { return v + ' searches'; })); body.appendChild(tc);

      var top = h('div', 'si-card'); top.appendChild(h('h3', null, 'Most searched'));
      rows(top, g.slice(0, 12).map(function (x) { return { n: x.t, v: x.n, z: x.z / x.n >= 0.5 }; }), function (x) { return x.v + (x.z ? ' · not found' : ''); });
      body.appendChild(top);

      var nf = h('div', 'si-card'); nf.appendChild(h('h3', null, 'Searched but not found (lost sales)'));
      if (zeroTerms.length) {
        rows(nf, zeroTerms.slice(0, 15).map(function (x) { return { n: x.t, v: x.n }; }), function (x) { return x.v + ' search' + (x.v === 1 ? '' : 'es'); });
        nf.appendChild(h('p', 'si-note', 'Shoppers wanted these and saw nothing. Stock them, or add them to the shop so the search finds them.'));
        var cp = h('button', 'si-chip', 'Copy this list'); cp.type = 'button'; cp.style.marginTop = '.5rem';
        cp.onclick = function () { var txt = zeroTerms.map(function (x) { return x.t + ' (' + x.n + ')'; }).join('\n'); try { navigator.clipboard.writeText(txt).then(function () { cp.textContent = 'Copied ✓'; }); } catch (e) { cp.textContent = 'Could not copy'; } };
        nf.appendChild(cp);
      } else nf.appendChild(h('p', 'si-note si-ok', 'Every search found something. 🎉'));
      body.appendChild(nf);

      /* trending: last 7 days against the 7 before, whatever range is chosen */
      var t7 = kdate(new Date(Date.now() - 6 * 864e5)), t14 = kdate(new Date(Date.now() - 13 * 864e5));
      var now7 = group(all.filter(function (x) { return kdate(x.created_at) >= t7; })), prev = {}; group(all.filter(function (x) { var d = kdate(x.created_at); return d >= t14 && d < t7; })).forEach(function (x) { prev[x.t] = x.n; });
      var tr = now7.filter(function (x) { return x.n >= 2 && x.n > (prev[x.t] || 0); }).map(function (x) { return { n: x.t, v: x.n - (prev[x.t] || 0), now: x.n, was: prev[x.t] || 0 }; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 6);
      var tg = h('div', 'si-card'); tg.appendChild(h('h3', null, 'Rising this week'));
      if (tr.length) rows(tg, tr, function (x) { return x.now + ' (was ' + x.was + ')'; }); else tg.appendChild(h('p', 'si-note', 'Nothing is climbing yet. This fills in after a couple of weeks of data.'));
      body.appendChild(tg);

      var src = { typed: 0, suggestion: 0, category: 0, list: 0 }; cur.forEach(function (x) { src[x.source] = (src[x.source] || 0) + 1; });
      var sc = h('div', 'si-card'); sc.appendChild(h('h3', null, 'How shoppers searched'));
      rows(sc, [{ n: 'Typed it', v: src.typed }, { n: 'Tapped a suggestion', v: src.suggestion }, { n: 'Tapped a category', v: src.category }, { n: 'Tapped a list item', v: src.list }], function (x) { return String(x.v); });
      body.appendChild(sc);

      var ac = h('div', 'acts');
      var ex = h('button', 'btn alt sm', 'Download CSV'); ex.type = 'button';
      ex.onclick = function () {
        var csv = ['Search,Times,Visits,Not found'].concat(g.map(function (x) { return [x.t, x.n, x.visits, x.z].map(csvCell).join(','); })).join('\n');
        var a2 = D.createElement('a'); a2.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a2.download = 'searches-' + kdate(new Date()) + '.csv'; D.body.appendChild(a2); a2.click(); setTimeout(function () { URL.revokeObjectURL(a2.href); a2.remove(); }, 500);
      };
      var cl = h('button', 'btn no sm', 'Delete searches older than 90 days'); cl.type = 'button';
      cl.onclick = function () {
        if (!window.confirm('Permanently delete search records older than 90 days?')) return;
        var cut = new Date(Date.now() - 90 * 864e5).toISOString();
        A().ready().then(function () { return A().api('/rest/v1/search_logs?created_at=lt.' + encodeURIComponent(cut), { method: 'DELETE', headers: { Prefer: 'return=minimal' } }); })
          .then(function (r) { if (!r.ok) throw 0; cl.textContent = 'Old searches deleted ✓'; }).catch(function () { cl.textContent = 'Could not delete'; });
      };
      ac.appendChild(ex); ac.appendChild(cl); body.appendChild(ac);
      if (all.length >= 5000) body.appendChild(h('p', 'si-note', 'Showing the latest 5,000 searches.'));
    }
  }

  /* ---------------- M-Pesa payments ---------------- */
  var MS = { f: 'unmatched' };
  function mpesa(root) {
    root.textContent = ''; var wrap = h('div'); root.appendChild(wrap);
    wrap.appendChild(h('p', 'si-note', 'Every payment Safaricom reports to your Paybill. Match them to orders here, then approve as usual. Nothing is marked paid automatically.'));
    var chips = h('div', 'si-chips'); wrap.appendChild(chips);
    var body = h('div'); wrap.appendChild(body);
    body.appendChild(h('div', 'empty', 'Loading payments...'));
    var rowsData = null;
    [['unmatched', 'Needs matching'], ['matched', 'Matched'], ['all', 'All']].forEach(function (x) {
      var b = h('button', 'si-chip' + (MS.f === x[0] ? ' on' : ''), x[1]); b.type = 'button';
      b.onclick = function () { MS.f = x[0]; Array.prototype.forEach.call(chips.children, function (c) { c.className = 'si-chip'; }); b.className = 'si-chip on'; if (rowsData) draw(); };
      chips.appendChild(b);
    });
    var rf = h('button', 'si-chip', '↻ Refresh'); rf.type = 'button'; rf.onclick = function () { load(true); }; chips.appendChild(rf);

    function load(force) {
      body.textContent = ''; body.appendChild(h('div', 'empty', 'Loading payments...'));
      Promise.all([payments(force), A().api('/rest/v1/orders?select=ref,status,subtotal,phone,pay_code,created_at,customer_name&order=created_at.desc&limit=500').then(function (r) { return r.ok ? r.json() : []; })])
        .then(function (r) { rowsData = r[0]; window.__siOrders = r[1]; draw(); })
        .catch(function (e) {
          errBox(body, e.message === 'missing' ? 'The payments table is not set up yet. In Supabase, run supabase-mpesa.sql, then deploy the payments-in function (steps are in supabase/functions/payments-in/README.md).' : e.message);
        });
    }
    function draw() {
      body.textContent = '';
      var orders = window.__siOrders || window.STM_orders || [], byCode = {};
      orders.forEach(function (o) { if (o.pay_code) byCode[up(o.pay_code)] = o; });
      var list = rowsData.filter(function (p) { var m = !!byCode[up(p.trans_id)]; return MS.f === 'all' || (MS.f === 'matched' ? m : !m); });
      var un = rowsData.filter(function (p) { return !byCode[up(p.trans_id)]; }).length, tot = rowsData.reduce(function (a, p) { return a + (+p.amount || 0); }, 0);
      body.appendChild(h('p', 'si-note', rowsData.length + ' payment' + (rowsData.length === 1 ? '' : 's') + ' received · ' + money(tot) + ' total · ' + un + ' still need matching'));
      if (!list.length) { body.appendChild(h('div', 'empty', MS.f === 'unmatched' ? 'Everything is matched. 🎉' : 'No payments here yet.')); return; }
      list.forEach(function (p) {
        var c = h('div', 'card'), top = h('div', 'top'), l = h('div'); l.appendChild(h('div', 'ref', String(p.trans_id).toUpperCase())); l.appendChild(h('div', 'when', ktime(p.created_at)));
        top.appendChild(l); var o = byCode[up(p.trans_id)];
        top.appendChild(h('span', 'si-pill ' + (o ? 'g' : 'o'), o ? 'Matched · ' + o.ref : 'Needs matching')); c.appendChild(top);
        var t = h('div', 'tot'); t.appendChild(h('span', null, 'Amount')); t.appendChild(h('span', null, money(p.amount))); c.appendChild(t);
        function meta(k, v) { if (!v) return; var m = h('div', 'meta'); m.appendChild(h('b', null, k + ': ')); m.appendChild(D.createTextNode(v)); c.appendChild(m); }
        meta('Paid by', p.payer_name); meta('Account / reference', p.bill_ref); meta('Phone', p.msisdn && /^\d{9,}$/.test(p.msisdn) ? p.msisdn : (p.msisdn ? 'hidden by Safaricom' : ''));
        if (p.env === 'sandbox') { var tp = h('div', 'meta si-warn', 'Test payment (sandbox). Not real money.'); c.appendChild(tp); }
        if (o) {
          var due = Number(o.subtotal || 0), got = Number(p.amount || 0);
          c.appendChild(h('div', 'meta ' + (got >= due ? 'si-ok' : 'si-bad'), got >= due ? '✅ Covers the order total (' + money(due) + ')' : '⚠ Short: order total is ' + money(due)));
        } else {
          var cands = orders.filter(function (x) { return (x.status || 'pending') === 'pending' && !x.pay_code; }).map(function (x) {
            var s = 0, why = []; if (Number(x.subtotal) === Number(p.amount)) { s += 3; why.push('exact amount'); }
            if (up(p.bill_ref).indexOf(up(x.ref)) > -1) { s += 5; why.push('account matches'); }
            if (last9(x.phone) && last9(x.phone) === last9(p.msisdn)) { s += 2; why.push('same phone'); }
            return { x: x, s: s, why: why };
          }).filter(function (y) { return y.s >= 3; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 3);
          var a = h('div', 'acts');
          if (!cands.length) c.appendChild(h('div', 'meta', 'No pending order fits this payment yet. It may belong to an order that is not placed yet.'));
          cands.forEach(function (y) {
            var b = h('button', 'btn ok sm', 'Approve ' + y.x.ref + ' · ' + (y.x.customer_name || '') + ' (' + y.why.join(', ') + ')'); b.type = 'button';
            b.onclick = function () { A().approveWith(y.x.ref, String(p.trans_id).toUpperCase(), Number(p.amount)); }; a.appendChild(b);
          });
          if (cands.length) c.appendChild(a);
        }
        body.appendChild(c);
      });
    }
    load(false);
  }

  window.STMInsights = {
    mount: function (root, tab) { if (tab === 'sales') sales(root); else if (tab === 'mpesa') mpesa(root); else if (tab === 'searches') searches(root); },
    verify: verify, suggestFor: suggestFor, payments: payments
  };
})();
