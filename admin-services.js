/* Admin console: SERVICES tabs. STMServices.mount(listEl, 'quotes' | 'services') is called by admin.html render().
   Quote requests come from public.service_quotes (written by /services/quote.js, no payment). Staff only (RLS is_staff()).
   Tab 2 reads /services/services-data.json (+ /services/pests-data.json when present) and joins it with the quote counts. */
(function () {
  'use strict';
  var D = document, ST = ['new', 'contacted', 'quoted', 'won', 'lost'], LB = { new: 'New', contacted: 'Contacted', quoted: 'Quoted', won: 'Won', lost: 'Lost' };
  var rows = [], filter = 'new', needle = '', timer = null, deep = '', root = null, deepDone = false;
  function h(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function api(p, o) { return STMAdmin.ready().then(function () { return STMAdmin.api(p, o); }); }
  function money(n) { return STMAdmin.money(n); }
  function count(s) { return rows.filter(function (r) { return r.status === s; }).length; }
  function note(msg, ok) { var e = D.getElementById('aerr'); if (!e) return; e.textContent = msg; e.style.color = ok ? '#15803d' : ''; e.hidden = !msg; }

  var css = '.sqs{display:flex;gap:.4rem;overflow-x:auto;margin:0 0 .8rem;padding-bottom:.2rem;scrollbar-width:none}.sqs::-webkit-scrollbar{display:none}' +
    '.sqs button{border:1px solid var(--ln);background:#fff;border-radius:999px;padding:.45rem .85rem;font:inherit;font-size:.9rem;white-space:nowrap;cursor:pointer;color:var(--tx);min-height:40px}.sqs button.on{background:var(--p);border-color:var(--p);color:#fff}' +
    '.sqs .n{font-weight:800;margin-left:.3rem;opacity:.85}.sqtool{display:flex;gap:.5rem;margin-bottom:.8rem}.sqtool input{flex:1;min-width:0;padding:.7rem .9rem;border:1px solid var(--ln);border-radius:12px;font:inherit;background:#fff}' +
    '.sqb-new{background:var(--wab);color:#92400e}.sqb-contacted{background:#dbeafe;color:#1d4ed8}.sqb-quoted{background:#ede9fe;color:var(--pd)}.sqb-won{background:var(--okb);color:var(--ok)}.sqb-lost{background:var(--nob);color:var(--no)}' +
    '.sq{overflow-wrap:anywhere}.sq.hl{outline:3px solid #a78bfa}.sqsvc{font-weight:700;margin:.5rem 0 .2rem;font-size:1.02rem}.sq .fld{display:block;margin:.6rem 0 0}.sq .fld span{display:block;font-size:.78rem;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.04em;margin-bottom:.2rem}' +
    '.sq input[type=number],.sq textarea{width:100%;padding:.65rem .75rem;border:1px solid var(--ln);border-radius:10px;font:inherit;background:#fff;color:var(--tx)}.sq textarea{min-height:70px;resize:vertical}' +
    '.sqg{display:grid;gap:.9rem}@media(min-width:760px){.sqg{grid-template-columns:1fr 1fr}}.sqbar{height:8px;border-radius:99px;background:#eceaf5;overflow:hidden;margin:.4rem 0 .2rem}.sqbar i{display:block;height:100%;background:var(--p)}' +
    '.sqt{width:100%;border-collapse:collapse;font-size:.92rem}.sqt td,.sqt th{padding:.45rem .3rem;border-bottom:1px solid var(--ln);text-align:left}.sqt th{font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:var(--mu)}.sqt td:last-child,.sqt th:last-child{text-align:right}';
  if (!D.getElementById('sq-css')) { var s = h('style'); s.id = 'sq-css'; s.textContent = css; D.head.appendChild(s); }

  function load() {
    return api('/rest/v1/service_quotes?select=*&order=created_at.desc&limit=500').then(function (r) {
      if (r.status === 401) throw new Error('expired'); if (!r.ok) throw new Error('load'); return r.json();
    }).then(function (j) { rows = j; window.STM_quotesNew = count('new'); return j; });
  }
  function fail(L, e) {
    L.textContent = '';
    if (e && e.message === 'expired') { L.appendChild(h('div', 'err', 'Your session expired. Refresh the page and sign in again.')); return; }
    L.appendChild(h('div', 'err', 'Could not load quote requests. Run setup-service-quotes.sql in Supabase and make sure your email is in the staff table.'));
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  /* ---------- tab 1: quote requests ---------- */
  function mountQuotes(L) {
    stop(); root = L; L.textContent = '';
    var bar = h('div', 'sqtool'), q = h('input'); q.type = 'search'; q.placeholder = 'Search reference, name, phone, service or town'; q.value = needle; q.setAttribute('aria-label', 'Search quote requests');
    var rf = h('button', 'btn alt sm', 'Refresh'); rf.type = 'button'; bar.appendChild(q); bar.appendChild(rf);
    var kp = h('div'); kp.id = 'sq-kp'; kp.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:.5rem;margin-bottom:.9rem';
    var chips = h('div', 'sqs'), list = h('div');
    L.appendChild(bar); L.appendChild(kp); L.appendChild(chips); L.appendChild(list);
    function kpis() {
      kp.textContent = '';
      var won = rows.filter(function (r) { return r.status === 'won'; }), val = won.reduce(function (a, r) { return a + (+r.quote_amount || 0); }, 0), dec = count('won') + count('lost');
      [['New', count('new'), 'hi'], ['Quoted', count('quoted'), ''], ['Won', count('won'), ''], ['Won value', money(val), ''], ['Win rate', dec ? Math.round(count('won') / dec * 100) + '%' : 'n/a', ''], ['All requests', rows.length, '']].forEach(function (x) {
        var d = h('div', 'kp ' + x[2]); d.appendChild(h('small', null, x[0])); d.appendChild(h('b', null, String(x[1]))); kp.appendChild(d);
      });
      kp.style.gridTemplateColumns = window.innerWidth >= 700 ? 'repeat(6,1fr)' : 'repeat(2,1fr)';
    }
    function drawChips() {
      chips.textContent = '';
      [['all', 'All', rows.length]].concat(ST.map(function (s) { return [s, LB[s], count(s)]; })).forEach(function (x) {
        var b = h('button', filter === x[0] ? 'on' : '', x[1]); b.type = 'button'; b.appendChild(h('span', 'n', String(x[2]))); b.onclick = function () { filter = x[0]; paint(); }; chips.appendChild(b);
      });
    }
    function paint() {
      kpis(); drawChips(); list.textContent = '';
      var n = needle.trim().toLowerCase(), digits = n.replace(/\D/g, '').replace(/^(254|0)/, '');
      var vis = rows.filter(function (r) {
        if (filter !== 'all' && r.status !== filter) return false;
        if (!n) return true;
        var hay = [r.ref, r.customer_name, r.phone, r.email, r.service_name, r.location, r.county].join(' ').toLowerCase();
        return n.split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; }) || (digits.length >= 3 && String(r.phone || '').replace(/\D/g, '').indexOf(digits) > -1);
      });
      if (!vis.length) { list.appendChild(h('div', 'empty', rows.length ? 'No quote requests match.' : 'No quote requests yet. They appear here the moment a customer sends one from a service page.')); return; }
      vis.forEach(function (r) { list.appendChild(card(r)); });
      if (deep && !deepDone) { var t = D.getElementById('sq-' + deep); if (t) { deepDone = true; t.classList.add('hl'); try { t.scrollIntoView({ block: 'center' }); } catch (e) {} } }
    }
    function reload() { return load().then(paint).catch(function (e) { fail(list, e); }); }
    q.addEventListener('input', function () { needle = q.value; paint(); });
    rf.onclick = function () { rf.disabled = true; reload().then(function () { rf.disabled = false; }); };
    list.appendChild(h('div', 'empty', 'Loading quote requests...'));
    load().then(function () {
      if (deep && rows.some(function (r) { return r.ref === deep; })) { filter = 'all'; needle = ''; q.value = ''; }
      paint(); if (window.STMServices && STMServices.onBadge) STMServices.onBadge();
    }).catch(function (e) { fail(list, e); });
    timer = setInterval(function () {
      if (!L.isConnected) { stop(); return; }
      if (D.hidden || !D.getElementById('cf').hidden || L.querySelector('.sq input:focus, .sq textarea:focus')) return;
      reload();
    }, 45000);

    function card(r) {
      var c = h('div', 'card sq'); c.id = 'sq-' + r.ref;
      var top = h('div', 'top'), l = h('div'); l.appendChild(h('div', 'ref', r.ref)); l.appendChild(h('div', 'when', STMAdmin.fmt(r.created_at)));
      top.appendChild(l); top.appendChild(h('span', 'badge sqb-' + r.status, LB[r.status] || r.status)); c.appendChild(top);
      c.appendChild(h('div', 'sqsvc', r.service_name));
      function meta(k, v) { if (!v) return; var m = h('div', 'meta'); m.appendChild(h('b', null, k + ': ')); m.appendChild(D.createTextNode(v)); c.appendChild(m); }
      meta('Customer', r.customer_name); meta('Phone', r.phone); meta('Email', r.email);
      meta('Where', [r.location, r.county].filter(Boolean).join(', ')); meta('Property', r.property_type);
      meta('Preferred', [r.preferred_date, r.preferred_slot].filter(Boolean).join(', ')); meta('Details', r.details);
      if (r.handled_by) meta('Last updated by', r.handled_by + (r.handled_at ? ' on ' + STMAdmin.fmt(r.handled_at) : ''));
      var f1 = h('label', 'fld'); f1.appendChild(h('span', null, 'Quote amount (KSh)')); var am = h('input'); am.type = 'number'; am.min = '0'; am.step = 'any'; am.inputMode = 'decimal'; am.value = r.quote_amount != null ? r.quote_amount : ''; f1.appendChild(am); c.appendChild(f1);
      var f2 = h('label', 'fld'); f2.appendChild(h('span', null, 'Staff notes (private)')); var nt = h('textarea'); nt.maxLength = 2000; nt.value = r.staff_notes || ''; f2.appendChild(nt); c.appendChild(f2);
      var er = h('div', 'err'); er.hidden = true; c.appendChild(er);
      var a = h('div', 'acts'), ph = String(r.phone || '').replace(/\D/g, '');
      if (ph) {
        var w = h('a', 'btn alt sm', 'WhatsApp'); w.target = '_blank'; w.rel = 'noopener';
        var fn = String(r.customer_name || '').split(/\s+/)[0] || 'there', amt = +r.quote_amount;
        var txt = 'Hello ' + fn + ', thank you for asking Stermont Arcade for a quote for ' + r.service_name + ' (ref ' + r.ref + ').' + (amt > 0 ? ' Our quote is ' + money(amt) + '. Prices are confirmed after inspection where needed. Reply here to confirm and we will schedule you in.' : ' Could you share a few photos or a good time to call?');
        w.href = 'https://wa.me/' + ph + '?text=' + encodeURIComponent(txt); a.appendChild(w);
        var cl = h('a', 'btn alt sm', 'Call'); cl.href = 'tel:' + r.phone; a.appendChild(cl);
      }
      if (r.email) { var em = h('a', 'btn alt sm', 'Email'); em.href = 'mailto:' + r.email + '?subject=' + encodeURIComponent('Your quote request ' + r.ref) + '&body=' + encodeURIComponent('Hello ' + (r.customer_name || '') + ',\n\nThank you for your quote request for ' + r.service_name + '.\n'); a.appendChild(em); }
      function save(status, b) {
        er.hidden = true; var v = am.value === '' ? null : Number(am.value);
        if (v != null && !(v >= 0)) { er.textContent = 'Enter a valid amount.'; er.hidden = false; return; }
        if (status === 'quoted' && !(v > 0)) { er.textContent = 'Enter the quote amount before marking it as quoted.'; er.hidden = false; am.focus(); return; }
        var patch = { quote_amount: v, staff_notes: nt.value.trim() || null, handled_by: STMAdmin.email() || null, handled_at: new Date().toISOString() }; if (status) patch.status = status;
        b.disabled = true;
        api('/rest/v1/service_quotes?ref=eq.' + encodeURIComponent(r.ref) + '&select=ref', { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: patch })
          .then(function (x) { if (!x.ok) throw x.status; return x.json(); })
          .then(function (j) { if (!j.length) throw 0; Object.assign(r, patch); window.STM_quotesNew = count('new'); paint(); note(r.ref + ' saved' + (status ? ' as ' + LB[status] : '') + '.', true); if (window.STMServices && STMServices.onBadge) STMServices.onBadge(); })
          .catch(function (e) { b.disabled = false; er.textContent = e === 401 ? 'Your session expired. Refresh and sign in again.' : 'Could not save. You may not have staff access.'; er.hidden = false; });
      }
      var sv = h('button', 'btn alt sm', 'Save notes and amount'); sv.type = 'button'; sv.onclick = function () { save(null, sv); }; a.appendChild(sv);
      [['contacted', 'Mark contacted', 'alt'], ['quoted', 'Mark quoted', ''], ['won', 'Mark won', 'ok'], ['lost', 'Mark lost', 'no']].forEach(function (x) {
        if (r.status === x[0]) return; var b = h('button', 'btn sm ' + x[2], x[1]); b.type = 'button'; b.onclick = function () { save(x[0], b); }; a.appendChild(b);
      });
      if (r.status !== 'new') { var ro = h('button', 'btn alt sm', 'Reopen as new'); ro.type = 'button'; ro.onclick = function () { save('new', ro); }; a.appendChild(ro); }
      c.appendChild(a); return c;
    }
  }

  /* ---------- tab 2: services overview ---------- */
  function getJson(u) { return fetch(u, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function mountOverview(L) {
    stop(); L.textContent = ''; L.appendChild(h('div', 'empty', 'Loading services...'));
    Promise.all([getJson('services/services-data.json'), getJson('services/pests-data.json'), load().catch(function () { return null; })]).then(function (res) {
      var data = res[0], pests = res[1]; L.textContent = '';
      var site = 'https://stermontarcade.co.ke';
      function copy(t, b) { try { navigator.clipboard.writeText(t).then(function () { var o = b.textContent; b.textContent = 'Copied'; setTimeout(function () { b.textContent = o; }, 1200); }); } catch (e) { note('Copy this link: ' + t, true); } }
      var top = h('div', 'card'); top.appendChild(h('div', 'ref', 'Quote requests (no payment)'));
      var tot = rows.length, won = count('won'), dec = won + count('lost');
      top.appendChild(h('p', 'meta', res[2] ? tot + ' requests: ' + count('new') + ' new, ' + count('contacted') + ' contacted, ' + count('quoted') + ' quoted, ' + won + ' won, ' + count('lost') + ' lost' + (dec ? ' (win rate ' + Math.round(won / dec * 100) + '%)' : '') + '.' : 'Quote data could not be loaded (staff access needed).'));
      var ta = h('div', 'acts');
      var b1 = h('button', 'btn sm', 'Open quote requests'); b1.type = 'button'; b1.onclick = function () { [].forEach.call(D.querySelectorAll('.ni'), function (n) { if (/Quote requests/.test(n.textContent)) n.click(); }); }; ta.appendChild(b1);
      var b2 = h('button', 'btn alt sm', 'Copy quote link'); b2.type = 'button'; b2.onclick = function () { copy(site + '/services/?quote=1', b2); }; ta.appendChild(b2);
      var b3 = h('a', 'btn alt sm', 'Open services page'); b3.href = '/services/'; b3.target = '_blank'; b3.rel = 'noopener'; ta.appendChild(b3);
      top.appendChild(ta); L.appendChild(top);
      /* demand by service */
      var by = {}; rows.forEach(function (r) { var k = r.service_name; by[k] = by[k] || { n: 0, won: 0, open: 0 }; by[k].n++; if (r.status === 'won') by[k].won++; if (r.status === 'new') by[k].open++; });
      var keys = Object.keys(by).sort(function (a, b) { return by[b].n - by[a].n; });
      if (keys.length) {
        var dc = h('div', 'card'); dc.appendChild(h('div', 'ref', 'Demand by service')); var tb = h('table', 'sqt');
        tb.innerHTML = '<thead><tr><th>Service</th><th>Requests</th><th>New</th><th>Won</th></tr></thead>'; var tbd = h('tbody');
        keys.slice(0, 15).forEach(function (k) { var tr = h('tr'); [k, by[k].n, by[k].open, by[k].won].forEach(function (v, i) { var td = h('td', null, String(v)); if (i === 0) td.style.overflowWrap = 'anywhere'; tr.appendChild(td); }); tbd.appendChild(tr); });
        tb.appendChild(tbd); var wrap = h('div'); wrap.style.overflowX = 'auto'; wrap.appendChild(tb); dc.appendChild(wrap); L.appendChild(dc);
      }
      var cc = {}; rows.forEach(function (r) { if (r.county) cc[r.county] = (cc[r.county] || 0) + 1; });
      var ck = Object.keys(cc).sort(function (a, b) { return cc[b] - cc[a]; }).slice(0, 8);
      if (ck.length) { var cd = h('div', 'card'); cd.appendChild(h('div', 'ref', 'Where requests come from')); ck.forEach(function (k) { var rr = h('div', 'meta'); rr.appendChild(h('b', null, k + ': ')); rr.appendChild(D.createTextNode(cc[k] + ' request' + (cc[k] === 1 ? '' : 's'))); var bar = h('div', 'sqbar'), i = h('i'); i.style.width = Math.round(cc[k] / cc[ck[0]] * 100) + '%'; bar.appendChild(i); cd.appendChild(rr); cd.appendChild(bar); }); L.appendChild(cd); }
      /* service pages */
      if (data && data.services) {
        L.appendChild(h('h3', null, 'Service pages (' + data.services.length + ')'));
        var g = h('div', 'sqg');
        data.services.forEach(function (s) {
          var c = h('div', 'card'); c.appendChild(h('div', 'ref', s.name)); c.appendChild(h('p', 'meta', 'KSh ' + Number(s.priceMin).toLocaleString('en-KE') + ' to ' + Number(s.priceMax).toLocaleString('en-KE') + (s.priceOpen ? '+' : '') + ' \u00b7 ' + (by[s.name] ? by[s.name].n : 0) + ' quote request(s)'));
          var a = h('div', 'acts'), pg = h('a', 'btn alt sm', 'Open page'); pg.href = '/services/' + s.slug + '.html'; pg.target = '_blank'; pg.rel = 'noopener'; a.appendChild(pg);
          var gd = (data.guides || []).filter(function (x) { return x.service === s.slug; })[0];
          if (gd) { var ga = h('a', 'btn alt sm', 'Open guide'); ga.href = '/services/guides/' + gd.slug + '.html'; ga.target = '_blank'; ga.rel = 'noopener'; a.appendChild(ga); }
          var cp = h('button', 'btn alt sm', 'Copy link'); cp.type = 'button'; cp.onclick = function () { copy(site + '/services/' + s.slug + '.html', cp); }; a.appendChild(cp);
          c.appendChild(a); g.appendChild(c);
        }); L.appendChild(g);
      } else L.appendChild(h('div', 'err', 'Could not load services/services-data.json.'));
      /* pests */
      if (pests && pests.pests) {
        L.appendChild(h('h3', null, 'Pest control pages (' + pests.pests.length + ')'));
        var pg2 = h('div', 'sqg');
        pests.pests.forEach(function (p) {
          var c = h('div', 'card'); c.appendChild(h('div', 'ref', p.name)); c.appendChild(h('p', 'meta', [p.group, (p.varieties || []).length ? (p.varieties || []).length + ' varieties covered' : ''].filter(Boolean).join(' \u00b7 ')));
          var a = h('div', 'acts'), pa = h('a', 'btn alt sm', 'Open page'); pa.href = '/services/pests/' + p.slug + '.html'; pa.target = '_blank'; pa.rel = 'noopener'; a.appendChild(pa); c.appendChild(a); pg2.appendChild(c);
        }); L.appendChild(pg2);
      }
    });
  }

  window.STMServices = {
    mount: function (L, tab, ref) { if (ref) { deep = ref; } if (tab === 'quotes') mountQuotes(L); else { stop(); mountOverview(L); } },
    setDeep: function (r) { deep = r || ''; deepDone = false; },
    onBadge: null,
    /* light count of NEW requests for the nav badge (no full list) */
    badge: function (cb) { api('/rest/v1/service_quotes?select=ref&status=eq.new&limit=100').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j) { window.STM_quotesNew = j.length; if (cb) cb(); } }).catch(function () {}); },
    stop: stop
  };
})();
