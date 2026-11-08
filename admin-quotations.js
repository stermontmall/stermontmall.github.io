/* Stermont Arcade · admin Quotations: create, save, edit, duplicate and send quotations to different clients.
   Mounted by admin.html through STMQuotations.mount(containerEl). The PDF, email and WhatsApp text are built by receipt.js
   (STM_RECEIPT.quote) so a quotation looks exactly like the receipt. Saved in Supabase table public.client_quotations
   (setup-client-quotations.sql). Uses window.STMAdmin (api, ready, money, fmt, email). All text is set with textContent. */
(function () {
  var D = document;
  function A() { return window.STMAdmin; }
  function Q() { return window.STM_RECEIPT && window.STM_RECEIPT.quote; }
  function h(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function money(n) { return 'KSh ' + Number(n || 0).toLocaleString('en-KE'); }
  function num(v) { var n = Number(v); return isFinite(n) && n > 0 ? n : 0; }
  function ymd(d) { function p(n) { return (n < 10 ? '0' : '') + n; } return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
  function req(path, method, body, prefer) {
    return A().ready().then(function () { return A().api(path, { method: method || 'GET', body: body, headers: prefer ? { Prefer: prefer } : {} }); })
      .then(function (r) {
        if (r.status === 401) throw new Error('Your session expired. Sign in again.');
        if (r.status === 404) throw new Error('Table missing. Run setup-client-quotations.sql in Supabase.');
        if (!r.ok) return r.text().then(function (t) { var m = ''; try { m = JSON.parse(t).message; } catch (e) {} throw new Error(m || 'Request failed (' + r.status + ')'); });
        return r.status === 204 ? null : r.text().then(function (t) { return t ? JSON.parse(t) : null; });
      });
  }

  var DEF_TERMS = 'Prices are quoted in Kenya shillings and are valid until the date shown. Goods remain the property of Stermont Arcade until paid in full. Delivery time starts once payment or the agreed deposit is confirmed.';
  var STATUSES = [['draft', 'Draft'], ['sent', 'Sent'], ['accepted', 'Accepted'], ['declined', 'Declined'], ['expired', 'Expired']];
  var PAY_PRESETS = ['Full payment before delivery', '50% deposit, balance on delivery', '30 days credit after delivery', 'Payment on delivery (M-Pesa)'];
  var DEL_PRESETS = ['Store pickup (Sarit Centre, Westlands)', 'Delivered within Nairobi in 1-2 working days', 'Delivered countrywide in 3-5 working days'];

  function blank() {
    return { id: null, ref: null, created_at: null, status: 'draft', anonymous: false, client_name: '', client_company: '', client_phone: '', client_email: '', client_pin: '', client_address: '',
      items: [{ name: '', qty: 1, price: '', disc: '' }], discount_type: 'none', discount_value: '', vat_rate: 16, vat_inclusive: true, delivery_fee: '', deposit_percent: '', valid_days: 14,
      payment_terms: '', delivery_terms: '', notes: '', terms: DEF_TERMS, accepted_at: null, sent_at: null };
  }
  function fromRow(r) {
    var s = blank(); Object.keys(s).forEach(function (k) { if (r[k] != null) s[k] = r[k]; });
    s.items = (r.items || []).map(function (i) { return { name: i.name, qty: i.qty, price: i.price, disc: i.disc || '' }; });
    if (!s.items.length) s.items = blank().items;
    if (s.anonymous) s.client_name = '';
    return s;
  }
  function validUntil(S) { var d = S.created_at ? new Date(S.created_at) : new Date(); d.setDate(d.getDate() + (Math.round(num(S.valid_days)) || 14)); return ymd(d); }
  function view(S) { return Object.assign({}, S, { valid_until: validUntil(S) }); }
  function nz(v) { v = String(v == null ? '' : v).trim(); return v ? v : null; }
  function payload(S) {
    var c = Q().calc(S), p = {
      status: S.status, anonymous: !!S.anonymous, client_name: S.anonymous ? 'Not disclosed' : String(S.client_name).trim(), client_company: S.anonymous ? null : nz(S.client_company), client_phone: S.anonymous ? null : nz(S.client_phone), client_email: S.anonymous ? null : nz(S.client_email), client_pin: S.anonymous ? null : nz(S.client_pin), client_address: S.anonymous ? null : nz(S.client_address),
      items: c.items, discount_type: S.discount_type || 'none', discount_value: S.discount_type === 'none' ? 0 : num(S.discount_value), vat_rate: Math.min(100, num(S.vat_rate)), vat_inclusive: !!S.vat_inclusive, delivery_fee: num(S.delivery_fee),
      deposit_percent: Math.min(100, num(S.deposit_percent)), valid_days: Math.min(365, Math.max(1, Math.round(num(S.valid_days)) || 14)), valid_until: validUntil(S),
      payment_terms: nz(S.payment_terms), delivery_terms: nz(S.delivery_terms), notes: nz(S.notes), terms: nz(S.terms),
      subtotal: c.subtotal, discount_amount: c.discount_amount, vat_amount: c.vat_amount, total: c.total, updated_at: new Date().toISOString()
    };
    if (S.status === 'sent' && !S.sent_at) p.sent_at = new Date().toISOString();
    if (S.status === 'accepted') p.accepted_at = S.accepted_at || new Date().toISOString();
    return p;
  }
  function waPhone(p) { var d = String(p || '').replace(/\D/g, ''); if (!d) return ''; if (d.charAt(0) === '0') d = '254' + d.slice(1); else if (d.length === 9 && /^[17]/.test(d)) d = '254' + d; return d; }

  function css() {
    if (D.getElementById('qt-css')) return;
    var s = h('style'); s.id = 'qt-css';
    s.textContent = '.qt-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:.7rem}.qt-grid label{display:block;font-size:.82rem;color:var(--mu);margin:0 0 .2rem;font-weight:600}' +
      '.qt-in{width:100%;padding:.6rem .7rem;border:1px solid var(--ln);border-radius:10px;font:inherit;background:#fff}.qt-h{font-weight:800;margin:1rem 0 .5rem;color:var(--pd)}' +
      '.qt-row{display:grid;grid-template-columns:minmax(150px,3fr) 70px 110px 70px 100px 40px;gap:.4rem;align-items:center;margin-bottom:.4rem}' +
      '.qt-row .qt-t{text-align:right;font-weight:700;font-size:.95rem}.qt-hd{font-size:.75rem;color:var(--mu);font-weight:700;text-transform:uppercase}' +
      '@media(max-width:640px){.qt-row{grid-template-columns:1fr 1fr 1fr 40px}.qt-row .qt-n{grid-column:1/-1}.qt-row .qt-t{grid-column:1/4;text-align:left}.qt-hd{display:none}}' +
      '.qt-tot{background:#f6f2ff;border:1px solid var(--ln);border-radius:12px;padding:.8rem 1rem;margin:.8rem 0;max-width:420px;margin-left:auto}.qt-tot div{display:flex;justify-content:space-between;padding:.15rem 0}' +
      '.qt-tot .g{font-weight:800;font-size:1.15rem;border-top:1px solid var(--ln);margin-top:.3rem;padding-top:.4rem;color:var(--pd)}' +
      '.qt-b{display:inline-block;border-radius:999px;padding:.12rem .6rem;font-size:.75rem;font-weight:700;background:#eceaf5;color:var(--tx)}.qt-b.sent{background:#dbeafe;color:#1d4ed8}.qt-b.accepted{background:var(--okb);color:var(--ok)}.qt-b.declined,.qt-b.expired{background:var(--nob);color:var(--no)}.qt-b.draft{background:var(--wab);color:#92400e}' +
      '.qt-f{display:flex;gap:.4rem;flex-wrap:wrap;margin:.6rem 0}.qt-f button{border:1px solid var(--ln);background:#fff;border-radius:999px;padding:.35rem .8rem;font:inherit;font-size:.85rem;cursor:pointer}.qt-f button.on{background:var(--p);color:#fff;border-color:var(--p)}';
    D.head.appendChild(s);
  }

  function mount(root) {
    css();
    root.textContent = '';
    var c = h('div'); root.appendChild(c);
    if (!Q()) { c.appendChild(h('div', 'err', 'The quotation tool did not load. Refresh the page (Ctrl+F5).')); return; }
    var S = blank(), rows = [], filter = 'all', needle = '', clients = {}, products = {}, catalog = [], pickRender = null, busy = false;
    var msgBox = h('div', 'err'); msgBox.hidden = true; c.appendChild(msgBox);
    function msg(t, ok) { msgBox.textContent = t || ''; msgBox.style.color = ok ? '#15803d' : ''; msgBox.style.background = ok ? '#dcfce7' : ''; msgBox.hidden = !t; }
    var bar = h('div', 'card'); c.appendChild(bar);
    var nb = h('button', 'btn', '+ New quotation'); nb.type = 'button'; bar.appendChild(nb);
    var formHost = h('div'); c.appendChild(formHost);
    var listHead = h('div'); c.appendChild(listHead); var list = h('div'); c.appendChild(list);

    /* ---------- suggestions: past clients (quotations + orders) and products ---------- */
    var dlC = h('datalist'); dlC.id = 'qt-clients'; var dlP = h('datalist'); dlP.id = 'qt-products'; c.appendChild(dlC); c.appendChild(dlP);
    function addClient(n, co, ph, em, pin, ad) {
      n = String(n || '').trim(); if (n.length < 2) return; var k = n.toLowerCase(); var e = clients[k] || (clients[k] = { name: n });
      if (co && !e.company) e.company = co; if (ph && !e.phone) e.phone = ph; if (em && !e.email) e.email = em; if (pin && !e.pin) e.pin = pin; if (ad && !e.address) e.address = ad;
    }
    function drawClients() {
      dlC.textContent = ''; Object.keys(clients).sort().slice(0, 400).forEach(function (k) { var o = h('option'); o.value = clients[k].name; o.label = [clients[k].company, clients[k].phone].filter(Boolean).join(' · '); dlC.appendChild(o); });
    }
    function loadSuggest() {
      req('/rest/v1/orders?select=customer_name,phone,email&order=created_at.desc&limit=400').then(function (r) { (r || []).forEach(function (o) { addClient(o.customer_name, '', o.phone, o.email); }); drawClients(); }).catch(function () {});
      function addCat(it) { catalog.push(it); products[it.name.toLowerCase()] = it; if (!it.off) { var o = h('option'); o.value = it.name; o.label = money(it.price); dlP.appendChild(o); } }
      function done() { catalog.sort(function (a, b) { return a.name.localeCompare(b.name); }); if (pickRender) pickRender(); }
      function title(slug) { return String(slug).replace(/-/g, ' ').replace(/\b[a-z]/g, function (m) { return m.toUpperCase(); }); }
      req('/rest/v1/products?select=name,price,stock,active&order=name&limit=2000').then(function (r) {
        (r || []).forEach(function (p) { addCat({ name: String(p.name), price: p.price, stock: p.stock, kind: 'Product', off: !p.active }); });
      }).catch(function () {}).then(function () {
        return req('/rest/v1/service_catalog?select=slug,price_min,price_open,active&order=slug').then(function (r) {
          (r || []).forEach(function (v) { addCat({ name: title(v.slug), price: v.price_open ? '' : v.price_min, kind: 'Service', off: !v.active }); });
        }).catch(function () {});
      }).then(done);
    }

    /* ---------- form ---------- */
    function inp(type, val, attrs, on) {
      var i = h(type === 'textarea' ? 'textarea' : type === 'select' ? 'select' : 'input', 'qt-in'); if (type !== 'textarea' && type !== 'select') i.type = type;
      Object.keys(attrs || {}).forEach(function (k) { i.setAttribute(k, attrs[k]); });
      if (type !== 'select') i.value = val == null ? '' : val;
      if (on) i.addEventListener('input', function () { on(i.value, i); });
      return i;
    }
    function fld(label, input) { var w = h('div'); w.appendChild(h('label', null, label)); w.appendChild(input); return w; }
    function sel(opts, val, on) { var s = inp('select', null, {}, on); opts.forEach(function (o) { var op = h('option', null, o[1]); op.value = o[0]; s.appendChild(op); }); s.value = val; return s; }

    var totBox = null, itemsBox = null;
    function recalc() {
      if (!totBox) return; var k = Q().calc(S); totBox.textContent = '';
      function row(l, v, cls) { var d = h('div', cls); d.appendChild(h('span', null, l)); d.appendChild(h('span', null, v)); totBox.appendChild(d); }
      row('Subtotal', money(k.subtotal));
      if (k.discount_amount) row('Discount', '- ' + money(k.discount_amount));
      var incl = k.vat_inclusive && num(S.vat_rate);
      if (num(S.vat_rate) && !k.vat_inclusive) row('VAT (' + num(S.vat_rate) + '%)', money(k.vat_amount));
      if (k.delivery_fee) row('Delivery fee', money(k.delivery_fee));
      row(incl ? 'Total (VAT included)' : 'Total', money(k.total), 'g');
      if (incl) { row('Includes VAT (' + num(S.vat_rate) + '%)', money(k.vat_amount)); row('Amount before VAT', money(k.net)); }
      if (k.deposit_amount) { row('Deposit to confirm (' + num(S.deposit_percent) + '%)', money(k.deposit_amount)); row('Balance after deposit', money(k.balance_after_deposit)); }
    }
    function drawItems() {
      itemsBox.textContent = '';
      var hd = h('div', 'qt-row qt-hd'); ['Item', 'Qty', 'Unit price', 'Disc %', 'Amount', ''].forEach(function (t) { hd.appendChild(h('span', null, t)); }); itemsBox.appendChild(hd);
      S.items.forEach(function (it, idx) {
        var r = h('div', 'qt-row'), tt = h('span', 'qt-t');
        function line() { var q = Q().calc({ items: [it] }); tt.textContent = q.items.length ? money(q.items[0].total) : '-'; }
        var n = inp('text', it.name, { list: 'qt-products', maxlength: 160, placeholder: 'Item or service (pick from catalog or type your own)' }, function (v) { it.name = v; line(); recalc(); });
        n.className += ' qt-n';
        n.addEventListener('change', function () { var p = products[String(n.value).toLowerCase()]; if (p && !num(it.price)) { it.price = p.price; pr.value = p.price; line(); recalc(); } });
        var qy = inp('number', it.qty, { min: 1, step: 'any', placeholder: 'Qty' }, function (v) { it.qty = v; line(); recalc(); });
        var pr = inp('number', it.price, { min: 0, step: 'any', placeholder: 'Price' }, function (v) { it.price = v; line(); recalc(); });
        var di = inp('number', it.disc, { min: 0, max: 100, step: 'any', placeholder: '0' }, function (v) { it.disc = v; line(); recalc(); });
        var rm = h('button', 'btn no sm', '×'); rm.type = 'button'; rm.title = 'Remove this item';
        rm.onclick = function () { if (S.items.length > 1) S.items.splice(idx, 1); else S.items[0] = { name: '', qty: 1, price: '', disc: '' }; drawItems(); recalc(); };
        [n, qy, pr, di].forEach(function (x) { r.appendChild(x); }); r.appendChild(tt); r.appendChild(rm); itemsBox.appendChild(r); line();
      });
    }
    function setStatus(st) { S.status = st; }

    function save(after) {
      if (busy) return Promise.resolve(null);
      var k = Q().calc(S);
      if (!S.anonymous && String(S.client_name).trim().length < 2) { msg('Add the client name first, or tick "Client not disclosed".'); return Promise.resolve(null); }
      if (!k.items.length) { msg('Add at least one item with a name first.'); return Promise.resolve(null); }
      busy = true; msg('');
      var p = payload(S), call = S.id ? req('/rest/v1/client_quotations?id=eq.' + S.id, 'PATCH', p, 'return=representation') : req('/rest/v1/client_quotations', 'POST', p, 'return=representation');
      return call.then(function (r) {
        var row = r && r[0]; if (!row) throw new Error('Could not save the quotation.');
        S = fromRow(row); S.id = row.id; S.ref = row.ref; S.created_at = row.created_at; S.sent_at = row.sent_at; S.accepted_at = row.accepted_at;
        msg('Saved as ' + row.ref + '.', true); return loadList().then(function () { return row; });
      }).catch(function (e) { msg(e.message); return null; }).then(function (row) { busy = false; return row; });
    }
    function afterSave(fn) { return save().then(function (row) { if (row) { drawForm(); return fn(row); } }); }
    function doPdf(q) { return Q().pdf(q).catch(function (e) { msg(e.message); }); }
    function doEmail(q) {
      return Q().email(q).then(function () {
        msg('Quotation emailed to ' + q.client_email + '.', true);
        if (q.status === 'draft' && q.id) return req('/rest/v1/client_quotations?id=eq.' + q.id, 'PATCH', { status: 'sent', sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }, 'return=minimal').then(loadList);
      }).catch(function (e) { msg('Not emailed: ' + e.message); });
    }
    function waLink(q) { var ph = waPhone(q.client_phone); return 'https://wa.me/' + ph + '?text=' + encodeURIComponent(Q().text(q)); }

    function drawForm() {
      formHost.textContent = '';
      var f = h('form', 'card'); formHost.appendChild(f); f.noValidate = true;
      f.appendChild(h('div', 'qt-h', S.id ? 'Edit quotation ' + S.ref : 'New quotation'));
      f.appendChild(h('div', 'qt-h', 'Client'));
      var g = h('div', 'qt-grid'); f.appendChild(g);
      var anRow = h('label'); anRow.style.cssText = 'display:flex;gap:.5rem;align-items:center;margin:.2rem 0 .7rem;font-weight:600;cursor:pointer';
      var an = h('input'); an.type = 'checkbox'; an.checked = !!S.anonymous; anRow.appendChild(an); anRow.appendChild(D.createTextNode('Client not disclosed: print only the items and prices'));
      an.onchange = function () { S.anonymous = an.checked; g.style.display = an.checked ? 'none' : ''; }; g.style.display = S.anonymous ? 'none' : ''; f.insertBefore(anRow, g);
      var nm = inp('text', S.client_name, { list: 'qt-clients', maxlength: 120, placeholder: 'Client name (type to pick a past client)' }, function (v) { S.client_name = v; });
      var co = inp('text', S.client_company, { maxlength: 160 }, function (v) { S.client_company = v; }), ph = inp('tel', S.client_phone, { maxlength: 30, placeholder: '+2547...' }, function (v) { S.client_phone = v; }),
        em = inp('email', S.client_email, { maxlength: 150 }, function (v) { S.client_email = v; }), pin = inp('text', S.client_pin, { maxlength: 30 }, function (v) { S.client_pin = v; }),
        ad = inp('text', S.client_address, { maxlength: 300 }, function (v) { S.client_address = v; });
      nm.addEventListener('change', function () {
        var e = clients[String(nm.value).trim().toLowerCase()]; if (!e) return;
        [[co, 'company', 'client_company'], [ph, 'phone', 'client_phone'], [em, 'email', 'client_email'], [pin, 'pin', 'client_pin'], [ad, 'address', 'client_address']].forEach(function (x) { if (e[x[1]] && !String(x[0].value).trim()) { x[0].value = e[x[1]]; S[x[2]] = e[x[1]]; } });
      });
      [['Client name *', nm], ['Company', co], ['Phone', ph], ['Email', em], ['KRA PIN', pin], ['Address', ad]].forEach(function (x) { g.appendChild(fld(x[0], x[1])); });

      f.appendChild(h('div', 'qt-h', 'Items'));
      var pk = h('div'); pk.style.cssText = 'border:1px solid var(--ln);border-radius:12px;padding:.6rem;margin-bottom:.7rem;background:#faf8ff';
      var ps = inp('search', '', { placeholder: 'Search all products and services, then tap one to add it' }), pc = h('div', 'meta'), pl = h('div');
      pl.style.cssText = 'max-height:260px;overflow:auto;margin-top:.4rem'; pk.appendChild(ps); pk.appendChild(pc); pk.appendChild(pl); f.appendChild(pk);
      function addFromCatalog(p) {
        var low = p.name.toLowerCase(), ex = S.items.filter(function (i) { return String(i.name).trim().toLowerCase() === low; })[0], em = S.items.filter(function (i) { return !String(i.name).trim(); })[0];
        if (ex) ex.qty = (num(ex.qty) || 1) + 1; else if (em) { em.name = p.name; em.qty = 1; em.price = p.price; } else S.items.push({ name: p.name, qty: 1, price: p.price, disc: '' });
        drawItems(); recalc();
      }
      function renderPick() {
        var words = ps.value.toLowerCase().split(/\s+/).filter(Boolean);
        var hits = catalog.filter(function (p) { var t = (p.name + ' ' + p.kind).toLowerCase(); return words.every(function (w) { return t.indexOf(w) > -1; }); });
        pc.textContent = catalog.length ? hits.length + ' of ' + catalog.length + ' items' + (hits.length > 60 ? ' (showing the first 60, type more to narrow)' : '') : 'Loading items...';
        pl.textContent = '';
        hits.slice(0, 60).forEach(function (p) {
          var b = h('button'); b.type = 'button'; b.style.cssText = 'display:flex;justify-content:space-between;gap:.6rem;width:100%;text-align:left;border:0;border-bottom:1px solid var(--ln);background:#fff;padding:.5rem .4rem;font:inherit;cursor:pointer';
          var l = h('span'); l.appendChild(h('b', null, p.name)); l.appendChild(h('small', null, '  ' + p.kind + (p.kind === 'Product' && p.stock != null ? ' · ' + (p.stock > 0 ? p.stock + ' in stock' : 'out of stock') : '') + (p.off ? ' · hidden' : ''))); l.lastChild.style.cssText = 'color:var(--mu)';
          b.appendChild(l); b.appendChild(h('span', null, p.price === '' || p.price == null ? 'price on quote' : money(p.price))); b.onclick = function () { addFromCatalog(p); };
          pl.appendChild(b);
        });
      }
      pickRender = renderPick; ps.addEventListener('input', renderPick); renderPick();
      itemsBox = h('div'); f.appendChild(itemsBox); drawItems();
      var ab = h('button', 'btn alt sm', '+ Add item'); ab.type = 'button'; ab.onclick = function () { S.items.push({ name: '', qty: 1, price: '', disc: '' }); drawItems(); }; f.appendChild(ab);

      f.appendChild(h('div', 'qt-h', 'Pricing options'));
      var g2 = h('div', 'qt-grid'); f.appendChild(g2);
      var dv = inp('number', S.discount_value, { min: 0, step: 'any' }, function (v) { S.discount_value = v; recalc(); });
      var dt = sel([['none', 'No overall discount'], ['percent', 'Percent (%) off'], ['fixed', 'Fixed amount (KSh) off']], S.discount_type, function (v) { S.discount_type = v; dv.disabled = v === 'none'; recalc(); }); dv.disabled = S.discount_type === 'none';
      var vm = sel([['1', 'Prices already include VAT'], ['0', 'Add VAT on top of prices']], S.vat_inclusive ? '1' : '0', function (v) { S.vat_inclusive = v === '1'; recalc(); });
      var vat = inp('number', S.vat_rate, { min: 0, max: 100, step: 'any', list: 'qt-vat' }, function (v) { S.vat_rate = v; recalc(); });
      var dl = h('datalist'); dl.id = 'qt-vat'; ['0', '16'].forEach(function (x) { var o = h('option'); o.value = x; dl.appendChild(o); }); g2.appendChild(dl);
      var df = inp('number', S.delivery_fee, { min: 0, step: 'any' }, function (v) { S.delivery_fee = v; recalc(); });
      var dp = inp('number', S.deposit_percent, { min: 0, max: 100, step: 'any' }, function (v) { S.deposit_percent = v; recalc(); });
      var vd = inp('number', S.valid_days, { min: 1, max: 365, step: 1 }, function (v) { S.valid_days = v; });
      [['Overall discount', dt], ['Discount value', dv], ['VAT treatment', vm], ['VAT % (0 = no VAT, 16 = standard)', vat], ['Delivery fee (KSh)', df], ['Deposit required (%)', dp], ['Valid for (days)', vd]].forEach(function (x) { g2.appendChild(fld(x[0], x[1])); });

      totBox = h('div', 'qt-tot'); f.appendChild(totBox); recalc();

      f.appendChild(h('div', 'qt-h', 'Terms and notes'));
      var g3 = h('div', 'qt-grid'); f.appendChild(g3);
      var plD = h('datalist'); plD.id = 'qt-pay'; PAY_PRESETS.forEach(function (x) { var o = h('option'); o.value = x; plD.appendChild(o); }); g3.appendChild(plD);
      var dlD = h('datalist'); dlD.id = 'qt-del'; DEL_PRESETS.forEach(function (x) { var o = h('option'); o.value = x; dlD.appendChild(o); }); g3.appendChild(dlD);
      var pt = inp('text', S.payment_terms, { list: 'qt-pay', maxlength: 300 }, function (v) { S.payment_terms = v; }), dtm = inp('text', S.delivery_terms, { list: 'qt-del', maxlength: 300 }, function (v) { S.delivery_terms = v; });
      var st = sel(STATUSES, S.status, setStatus);
      [['Payment terms', pt], ['Delivery / collection', dtm], ['Status', st]].forEach(function (x) { g3.appendChild(fld(x[0], x[1])); });
      var nt = inp('textarea', S.notes, { rows: 2, maxlength: 1000, placeholder: 'Notes printed under the totals (optional)' }, function (v) { S.notes = v; });
      var tm = inp('textarea', S.terms, { rows: 3, maxlength: 2000 }, function (v) { S.terms = v; });
      f.appendChild(h('div', 'qt-h', 'Notes')); f.appendChild(nt); f.appendChild(h('div', 'qt-h', 'Terms & conditions')); f.appendChild(tm);

      var acts = h('div', 'qt-f'); f.appendChild(acts);
      function b(label, cls, fn) { var x = h('button', 'btn ' + cls, label); x.type = 'button'; x.onclick = function () { x.disabled = true; Promise.resolve(fn()).then(function () { x.disabled = false; }, function () { x.disabled = false; }); }; acts.appendChild(x); return x; }
      b('Save quotation', '', function () { return save().then(function (r) { if (r) drawForm(); }); });
      b('Save & download PDF', 'alt', function () { return afterSave(doPdf); });
      b('PDF only', 'alt', function () { return doPdf(view(S)); });
      b('Save & email client', 'alt', function () { if (S.anonymous) { msg('No client details, so there is no email address to send to.'); return null; } if (!String(S.client_email).trim()) { msg('Add the client email first.'); return null; } return afterSave(function (row) { return doEmail(row); }); });
      var wa = h('button', 'btn alt', 'WhatsApp client'); wa.type = 'button';
      wa.onclick = function () { if (!S.anonymous && !waPhone(S.client_phone)) { msg('Add the client phone first.'); return; } if (!Q().calc(S).items.length) { msg('Add at least one item first.'); return; } window.open(waLink(view(S)), '_blank', 'noopener'); };
      acts.appendChild(wa);
      var cn = h('button', 'btn alt', 'Close form'); cn.type = 'button'; cn.onclick = function () { formHost.textContent = ''; totBox = null; itemsBox = null; msg(''); }; acts.appendChild(cn);
      f.addEventListener('submit', function (e) { e.preventDefault(); });
      formHost.scrollIntoView && formHost.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    nb.onclick = function () { S = blank(); msg(''); drawForm(); };

    /* ---------- saved quotations ---------- */
    function drawHead() {
      listHead.textContent = '';
      var t = h('div', 'qt-h', 'Saved quotations'); listHead.appendChild(t);
      var s = h('input', 'qt-in'); s.type = 'search'; s.placeholder = 'Search client, company or quote number'; s.value = needle; s.oninput = function () { needle = s.value; drawList(); }; listHead.appendChild(s);
      var fb = h('div', 'qt-f'); listHead.appendChild(fb);
      [['all', 'All']].concat(STATUSES).forEach(function (x) {
        var n = x[0] === 'all' ? rows.length : rows.filter(function (r) { return Q().status(r).label && shown(r) === x[0]; }).length;
        var b = h('button', filter === x[0] ? 'on' : '', x[1] + ' (' + n + ')'); b.type = 'button'; b.onclick = function () { filter = x[0]; drawHead(); drawList(); }; fb.appendChild(b);
      });
    }
    function shown(r) { var st = Q().status(r).label; return (r.status === 'draft' || r.status === 'sent') && st === 'EXPIRED' ? 'expired' : r.status; }
    function patch(r, body, ok) {
      body.updated_at = new Date().toISOString();
      return req('/rest/v1/client_quotations?id=eq.' + r.id, 'PATCH', body, 'return=minimal').then(function () { msg(ok, true); return loadList(); }).catch(function (e) { msg(e.message); });
    }
    function card(r) {
      var k = h('div', 'card'), top = h('div'); top.style.cssText = 'display:flex;justify-content:space-between;gap:.6rem;flex-wrap:wrap;align-items:center';
      var l = h('b', null, r.ref + ' · ' + (r.anonymous ? 'Client not disclosed' : r.client_name)); top.appendChild(l); var sh = shown(r); top.appendChild(h('span', 'qt-b ' + sh, (STATUSES.filter(function (x) { return x[0] === sh; })[0] || [0, sh])[1])); k.appendChild(top);
      k.appendChild(h('div', 'meta', [r.client_company, r.client_phone, r.client_email].filter(Boolean).join(' · ')));
      var d = h('div', 'meta'); d.appendChild(h('b', null, money(r.total))); d.appendChild(D.createTextNode(' · ' + (r.items || []).length + ' item(s) · issued ' + A().fmt(r.created_at) + ' · valid until ' + (r.valid_until || '-'))); k.appendChild(d);
      var a = h('div', 'qt-f'); k.appendChild(a);
      function b(label, cls, fn) { var x = h('button', 'btn sm ' + cls, label); x.type = 'button'; x.onclick = function () { x.disabled = true; Promise.resolve(fn()).then(function () { x.disabled = false; }, function () { x.disabled = false; }); }; a.appendChild(x); return x; }
      b('Edit', 'alt', function () { S = fromRow(r); S.id = r.id; S.ref = r.ref; S.created_at = r.created_at; S.sent_at = r.sent_at; S.accepted_at = r.accepted_at; msg(''); drawForm(); });
      b('PDF', 'alt', function () { return doPdf(r); });
      if (r.client_email) b('Email', 'alt', function () { return doEmail(r); });
      if (r.anonymous || waPhone(r.client_phone)) { var w = h('a', 'btn alt sm', 'WhatsApp'); w.href = waLink(r); w.target = '_blank'; w.rel = 'noopener'; a.appendChild(w); }
      b('Duplicate', 'alt', function () { S = fromRow(r); S.id = null; S.ref = null; S.created_at = null; S.status = 'draft'; S.sent_at = null; S.accepted_at = null; msg('Copy ready: change the client or items, then save.', true); drawForm(); });
      if (r.status !== 'sent' && r.status !== 'accepted') b('Mark sent', 'alt', function () { return patch(r, { status: 'sent', sent_at: r.sent_at || new Date().toISOString() }, r.ref + ' marked as sent.'); });
      if (r.status !== 'accepted') b('Mark accepted', 'ok', function () { return patch(r, { status: 'accepted', accepted_at: new Date().toISOString() }, r.ref + ' marked as accepted.'); });
      if (r.status !== 'declined') b('Mark declined', 'no', function () { return patch(r, { status: 'declined' }, r.ref + ' marked as declined.'); });
      b('Delete', 'no', function () { if (!window.confirm('Delete quotation ' + r.ref + '? This cannot be undone.')) return null; return req('/rest/v1/client_quotations?id=eq.' + r.id, 'DELETE', null, 'return=minimal').then(function () { msg(r.ref + ' deleted.', true); return loadList(); }).catch(function (e) { msg(e.message); }); });
      return k;
    }
    function drawList() {
      list.textContent = '';
      var nd = needle.trim().toLowerCase(), shownRows = rows.filter(function (r) {
        if (filter !== 'all' && shown(r) !== filter) return false;
        return !nd || [r.ref, r.client_name, r.client_company, r.client_phone, r.client_email].join(' ').toLowerCase().indexOf(nd) > -1;
      });
      if (!shownRows.length) { list.appendChild(h('div', 'empty', rows.length ? 'No quotations match.' : 'No quotations yet. Tap "New quotation" to make the first one.')); return; }
      shownRows.forEach(function (r) { list.appendChild(card(r)); });
    }
    function loadList() {
      return req('/rest/v1/client_quotations?select=*&order=created_at.desc&limit=300').then(function (r) {
        rows = r || []; rows.forEach(function (x) { if (!x.anonymous) addClient(x.client_name, x.client_company, x.client_phone, x.client_email, x.client_pin, x.client_address); }); drawClients(); drawHead(); drawList();
      }).catch(function (e) { msg(e.message); });
    }
    drawHead(); loadSuggest(); loadList();
  }

  window.STMQuotations = { mount: mount };
})();
