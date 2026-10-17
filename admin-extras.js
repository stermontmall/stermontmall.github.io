/* Stermont Arcade · admin extras: Vouchers, Expenses, Inbox (customer messages), Reviews.
   Mounted by admin.html through STMExtras.mount(containerEl, 'vouchers' | 'expenses' | 'inbox' | 'reviews').
   Uses window.STMAdmin (api, ready, money, fmt, email) exposed by admin.html. All text is set with textContent. */
(function () {
  var A = function () { return window.STMAdmin; };
  var D = document;
  function h(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function field(label, input) { var w = h('div'); w.appendChild(h('label', null, label)); w.appendChild(input); return w; }
  function inp(type, attrs) { var i = D.createElement(type === 'textarea' || type === 'select' ? type : 'input'); if (type !== 'textarea' && type !== 'select') i.type = type; Object.keys(attrs || {}).forEach(function (k) { i.setAttribute(k, attrs[k]); }); i.style.cssText = 'width:100%;padding:.65rem .75rem;border:1px solid var(--ln);border-radius:10px;font:inherit;background:#fff'; return i; }
  function req(path, method, body, prefer) {
    return A().ready().then(function () { return A().api(path, { method: method || 'GET', body: body, headers: prefer ? { Prefer: prefer } : {} }); })
      .then(function (r) {
        if (r.status === 401) throw new Error('Your session expired. Sign in again.');
        if (r.status === 404) throw new Error('Table missing. Run setup-admin-extras.sql in Supabase.');
        if (!r.ok) return r.text().then(function (t) { var m = ''; try { m = JSON.parse(t).message; } catch (e) {} throw new Error(m || 'Request failed (' + r.status + ')'); });
        return r.status === 204 ? null : r.text().then(function (t) { return t ? JSON.parse(t) : null; });
      });
  }
  function msg(root, text, ok) { var e = root.querySelector('.xm') || root.insertBefore(h('div', 'err xm'), root.firstChild); e.textContent = text; e.style.color = ok ? '#15803d' : ''; e.style.background = ok ? '#dcfce7' : ''; e.hidden = !text; }
  function ymd(d) { return d.toISOString().slice(0, 10); }
  function shell(root) { root.textContent = ''; var c = h('div'); root.appendChild(c); return c; } /* page title + hint come from admin.html */
  function confirmDo(text, fn) { if (window.confirm(text)) fn(); }

  /* ---------------- vouchers ---------------- */
  function vouchers(root) {
    var c = shell(root, 'Vouchers 🎟️', 'Discount codes shoppers type at checkout. Mark one "public offer" to show it on the storefront.');
    var f = h('form', 'card xform'); c.appendChild(f);
    var code = inp('text', { maxlength: 24, placeholder: 'e.g. WELCOME10', required: '' }), kind = inp('select'), val = inp('number', { min: 1, step: 'any', required: '' }),
      min = inp('number', { min: 0, value: 0 }), max = inp('number', { min: 1, placeholder: 'Unlimited' }), exp = inp('date'), note = inp('text', { maxlength: 200, placeholder: 'Internal note (optional)' }),
      pub = inp('checkbox'); pub.style.width = 'auto';
    [['percent', '% off'], ['fixed', 'KSh off']].forEach(function (x) { var o = h('option', null, x[1]); o.value = x[0]; kind.appendChild(o); });
    [['Code', code], ['Type', kind], ['Value', val], ['Minimum order (KSh)', min], ['Max uses', max], ['Expires on', exp], ['Note', note]].forEach(function (x) { f.appendChild(field(x[0], x[1])); });
    var pl = h('label', 'full'); pl.style.cssText = 'display:flex;gap:.5rem;align-items:center'; pl.appendChild(pub); pl.appendChild(D.createTextNode('Show as a public offer')); f.appendChild(pl);
    var go = h('button', 'btn full', 'Create voucher'); go.type = 'submit'; go.style.cssText = 'width:100%;margin-top:.8rem'; f.appendChild(go);
    var list = h('div'); c.appendChild(list);
    function draw(rows) {
      list.textContent = '';
      if (!rows.length) { list.appendChild(h('div', 'empty', 'No vouchers yet.')); return; }
      rows.forEach(function (v) {
        var k = h('div', 'card'), top = h('div', 'top'); top.appendChild(h('span', 'ref', v.code));
        var live = v.active && (!v.expires_at || new Date(v.expires_at) > new Date()) && (v.max_uses == null || v.used_count < v.max_uses);
        top.appendChild(h('span', 'badge ' + (live ? 'b-paid' : 'b-declined'), live ? 'Live' : (v.active ? 'Ended' : 'Off'))); k.appendChild(top);
        k.appendChild(h('div', 'meta', (v.kind === 'percent' ? v.value + '% off' : A().money(v.value) + ' off') + (v.min_order > 0 ? ' · min ' + A().money(v.min_order) : '') + (v.public_offer ? ' · public' : '')));
        k.appendChild(h('div', 'meta', 'Used ' + v.used_count + (v.max_uses ? ' / ' + v.max_uses : '') + (v.expires_at ? ' · expires ' + A().fmt(v.expires_at) : '')));
        if (v.note) k.appendChild(h('div', 'meta', v.note));
        var a = h('div', 'acts');
        var t = h('button', 'btn alt sm', v.active ? 'Turn off' : 'Turn on'); t.type = 'button';
        t.onclick = function () { req('/rest/v1/vouchers?id=eq.' + v.id, 'PATCH', { active: !v.active }, 'return=minimal').then(load).catch(function (e) { msg(c, e.message); }); };
        var d = h('button', 'btn no sm', 'Delete'); d.type = 'button';
        d.onclick = function () { confirmDo('Delete voucher ' + v.code + '?', function () { req('/rest/v1/vouchers?id=eq.' + v.id, 'DELETE', null, 'return=minimal').then(load).catch(function (e) { msg(c, e.message); }); }); };
        a.appendChild(t); a.appendChild(d); k.appendChild(a); list.appendChild(k);
      });
    }
    function load() { return req('/rest/v1/vouchers?select=*&order=created_at.desc').then(draw).catch(function (e) { msg(c, e.message); }); }
    f.addEventListener('submit', function (e) {
      e.preventDefault(); msg(c, '');
      var body = { code: code.value.trim().toUpperCase(), kind: kind.value, value: +val.value, min_order: +min.value || 0, max_uses: max.value ? +max.value : null,
        expires_at: exp.value ? new Date(exp.value + 'T23:59:59+03:00').toISOString() : null, public_offer: pub.checked, note: note.value.trim() || null };
      if (body.kind === 'percent' && body.value > 90) { msg(c, 'Percent discounts are capped at 90%.'); return; }
      go.disabled = true;
      req('/rest/v1/vouchers', 'POST', body, 'return=minimal').then(function () { f.reset(); msg(c, 'Voucher created.', true); return load(); })
        .catch(function (x) { msg(c, /duplicate|unique/i.test(x.message) ? 'That code already exists.' : x.message); }).then(function () { go.disabled = false; });
    });
    load();
  }

  /* ---------------- expenses ---------------- */
  function expenses(root) {
    var c = shell(root, 'Expenses 💸', 'Record running costs (transport, rent, airtime, packaging). They are kept separate from product cost (COGS).');
    var f = h('form', 'card xform'); c.appendChild(f);
    var on = inp('date', { required: '' }); on.value = ymd(new Date());
    var cat = inp('text', { maxlength: 40, placeholder: 'e.g. Transport', required: '', list: 'xcats' }), amt = inp('number', { min: 1, step: 'any', required: '' }), note = inp('text', { maxlength: 200, placeholder: 'Optional' });
    var dl = h('datalist'); dl.id = 'xcats'; ['Transport', 'Rent', 'Airtime & data', 'Packaging', 'Salaries', 'Marketing', 'Licences & fees', 'Other'].forEach(function (x) { var o = h('option'); o.value = x; dl.appendChild(o); }); f.appendChild(dl);
    [['Date', on], ['Category', cat], ['Amount (KSh)', amt], ['Note', note]].forEach(function (x) { f.appendChild(field(x[0], x[1])); });
    var go = h('button', 'btn full', 'Add expense'); go.type = 'submit'; go.style.cssText = 'width:100%;margin-top:.8rem'; f.appendChild(go);
    var sum = h('div', 'card'); c.appendChild(sum); var list = h('div'); c.appendChild(list);
    function draw(rows) {
      var now = new Date(), mk = now.toISOString().slice(0, 7), tm = 0, all = 0, by = {};
      rows.forEach(function (r) { all += +r.amount; if (r.spent_on.slice(0, 7) === mk) { tm += +r.amount; by[r.category] = (by[r.category] || 0) + +r.amount; } });
      sum.textContent = ''; var t1 = h('div', 'tot'); t1.appendChild(h('span', null, 'This month')); t1.appendChild(h('span', null, A().money(tm))); sum.appendChild(t1);
      Object.keys(by).sort(function (a, b) { return by[b] - by[a]; }).forEach(function (k) { var l = h('div', 'meta'); l.appendChild(h('b', null, k + ': ')); l.appendChild(D.createTextNode(A().money(by[k]))); sum.appendChild(l); });
      sum.appendChild(h('div', 'meta', 'All time: ' + A().money(all)));
      list.textContent = '';
      if (!rows.length) { list.appendChild(h('div', 'empty', 'No expenses recorded.')); return; }
      rows.forEach(function (r) {
        var k = h('div', 'card'), top = h('div', 'top'); top.appendChild(h('span', 'ref', A().money(r.amount))); top.appendChild(h('span', 'when', r.spent_on)); k.appendChild(top);
        k.appendChild(h('div', 'meta', r.category + (r.note ? ' · ' + r.note : '')));
        var d = h('button', 'btn no sm', 'Delete'); d.type = 'button'; d.style.marginTop = '.5rem';
        d.onclick = function () { confirmDo('Delete this expense?', function () { req('/rest/v1/expenses?id=eq.' + r.id, 'DELETE', null, 'return=minimal').then(load).catch(function (e) { msg(c, e.message); }); }); };
        k.appendChild(d); list.appendChild(k);
      });
    }
    function load() { return req('/rest/v1/expenses?select=*&order=spent_on.desc,id.desc&limit=500').then(draw).catch(function (e) { msg(c, e.message); }); }
    f.addEventListener('submit', function (e) {
      e.preventDefault(); msg(c, ''); go.disabled = true;
      req('/rest/v1/expenses', 'POST', { spent_on: on.value, category: cat.value.trim(), amount: +amt.value, note: note.value.trim() || null }, 'return=minimal')
        .then(function () { cat.value = amt.value = note.value = ''; msg(c, 'Expense added.', true); return load(); })
        .catch(function (x) { msg(c, x.message); }).then(function () { go.disabled = false; });
    });
    load();
  }

  /* ---------------- inbox ---------------- */
  function inbox(root) {
    var c = shell(root, 'Customer messages 💬', 'Questions sent from the shop. Your reply shows in the customer’s account.');
    var list = h('div'), show = 'open'; c.appendChild(list);
    var bar = h('div', 'tabs'); c.insertBefore(bar, list); var rows = [];
    function draw() {
      bar.textContent = '';
      [['open', 'Open'], ['closed', 'Closed']].forEach(function (x) { var b = h('button', show === x[0] ? 'on' : '', x[1]); b.type = 'button'; b.onclick = function () { show = x[0]; draw(); }; bar.appendChild(b); });
      list.textContent = '';
      var vis = rows.filter(function (m) { return show === 'closed' ? m.status === 'closed' : m.status !== 'closed'; });
      if (!vis.length) { list.appendChild(h('div', 'empty', 'No messages here.')); return; }
      vis.forEach(function (m) {
        var k = h('div', 'card'), top = h('div', 'top'); top.appendChild(h('span', 'ref', m.name));
        top.appendChild(h('span', 'badge ' + (m.status === 'new' ? 'b-pending' : 'b-paid'), m.status)); k.appendChild(top);
        k.appendChild(h('div', 'when', A().fmt(m.created_at) + (m.phone ? ' · ' + m.phone : '') + (m.email ? ' · ' + m.email : '')));
        var b = h('p', null, m.body); b.style.whiteSpace = 'pre-wrap'; k.appendChild(b);
        if (m.reply) { var r = h('div', 'meta'); r.appendChild(h('b', null, 'Your reply: ')); r.appendChild(D.createTextNode(m.reply)); k.appendChild(r); }
        if (m.status !== 'closed') {
          var ta = inp('textarea', { rows: 3, maxlength: 1000, placeholder: 'Type a reply' }); ta.value = m.reply || ''; ta.defaultValue = ta.value; k.appendChild(ta);
          var a = h('div', 'acts'), send = h('button', 'btn sm', m.reply ? 'Update reply' : 'Send reply'), cl = h('button', 'btn alt sm', 'Close'); send.type = cl.type = 'button';
          send.onclick = function () { var t = ta.value.trim(); if (t.length < 2) { msg(c, 'Write a reply first.'); return; }
            req('/rest/v1/messages?id=eq.' + m.id, 'PATCH', { reply: t, status: 'replied', replied_by: A().email(), replied_at: new Date().toISOString() }, 'return=minimal').then(function () { msg(c, 'Reply saved.', true); return load(); }).catch(function (e) { msg(c, e.message); }); };
          cl.onclick = function () { req('/rest/v1/messages?id=eq.' + m.id, 'PATCH', { status: 'closed' }, 'return=minimal').then(load).catch(function (e) { msg(c, e.message); }); };
          a.appendChild(send); a.appendChild(cl); k.appendChild(a);
        }
        if (m.phone) { var wa = h('a', 'btn alt sm', 'WhatsApp'); wa.href = 'https://wa.me/' + String(m.phone).replace(/\D/g, '').replace(/^0/, '254'); wa.target = '_blank'; wa.rel = 'noopener'; wa.style.marginTop = '.5rem'; k.appendChild(wa); }
        list.appendChild(k);
      });
    }
    function load() { return req('/rest/v1/messages?select=*&order=created_at.desc&limit=300').then(function (r) { rows = r; draw(); }).catch(function (e) { msg(c, e.message); }); }
    load();
    /* live chat: refresh every 8s while this tab is open, but never while a reply is being typed */
    var live = setInterval(function () {
      if (!c.isConnected) { clearInterval(live); return; }
      if (D.hidden) return;
      var typing = [].some.call(list.querySelectorAll('textarea'), function (t) { return t === D.activeElement || t.value !== t.defaultValue; });
      if (typing) return;
      req('/rest/v1/messages?select=*&order=created_at.desc&limit=300').then(function (r) { rows = r; draw(); }).catch(function () {});
    }, 8000);
  }

  /* ---------------- reviews ---------------- */
  function reviews(root) {
    var c = shell(root, 'Reviews ⭐', '');
    var list = h('div'), flt = 'pending'; c.appendChild(list);
    var bar = h('div', 'tabs'); c.insertBefore(bar, list); var rows = [];
    function draw() {
      bar.textContent = '';
      [['pending', 'Pending'], ['approved', 'Approved'], ['hidden', 'Hidden']].forEach(function (x) {
        var n = rows.filter(function (r) { return r.status === x[0]; }).length; var b = h('button', flt === x[0] ? 'on' : '', x[1] + ' (' + n + ')'); b.type = 'button'; b.onclick = function () { flt = x[0]; draw(); }; bar.appendChild(b); });
      list.textContent = '';
      var vis = rows.filter(function (r) { return r.status === flt; });
      if (!vis.length) { list.appendChild(h('div', 'empty', 'No reviews here.')); return; }
      vis.forEach(function (r) {
        var k = h('div', 'card'), top = h('div', 'top'); top.appendChild(h('span', 'ref', r.product_name)); top.appendChild(h('span', 'ref', '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating))); k.appendChild(top);
        k.appendChild(h('div', 'when', (r.reviewer || 'Customer') + ' · ' + A().fmt(r.created_at) + (r.order_ref ? ' · ' + r.order_ref : '')));
        if (r.body) { var b = h('p', null, r.body); b.style.whiteSpace = 'pre-wrap'; k.appendChild(b); }
        var a = h('div', 'acts');
        function set(s, label, cls) { var bt = h('button', 'btn ' + cls + ' sm', label); bt.type = 'button'; bt.onclick = function () { req('/rest/v1/reviews?id=eq.' + r.id, 'PATCH', { status: s }, 'return=minimal').then(load).catch(function (e) { msg(c, e.message); }); }; a.appendChild(bt); }
        if (r.status !== 'approved') set('approved', 'Approve ✅', 'ok');
        if (r.status !== 'hidden') set('hidden', 'Hide', 'no');
        var del = h('button', 'btn alt sm', 'Delete'); del.type = 'button'; del.onclick = function () { confirmDo('Permanently delete this review? This cannot be undone.', function () { req('/rest/v1/reviews?id=eq.' + r.id, 'DELETE', null, 'return=minimal').then(function () { msg(c, 'Review deleted.', true); return load(); }).catch(function (e) { msg(c, e.message); }); }); }; a.appendChild(del);
        k.appendChild(a); list.appendChild(k);
      });
    }
    function load() { return req('/rest/v1/reviews?select=*&order=created_at.desc&limit=300').then(function (r) { rows = r; draw(); }).catch(function (e) { msg(c, e.message); }); }
    load();
  }

  function bulk(root) { if (!window.STMBulk) { root.textContent = 'The bulk import script did not load. Refresh the page (Ctrl+F5).'; return; } STMBulk.mount(root); }
  /* ---------------- live chat (public.chat_messages: one conversation per logged-in customer) ---------------- */
  function livechat(root) {
    var c = shell(root), wrap = h('div'), rows = [], cur = null, busy = false; c.appendChild(wrap);
    function pv(t) { t = String(t || ''); return t.length > 90 ? t.slice(0, 90) + '…' : t; }
    function groups() {
      var g = {};
      rows.forEach(function (m) {
        var x = g[m.user_id] || (g[m.user_id] = { id: m.user_id, name: '', msgs: [], unread: 0, last: null });
        x.msgs.push(m); x.last = m;
        if (m.sender === 'customer') { if (m.name) x.name = m.name; if (!m.read_by_staff) x.unread++; }
      });
      return Object.keys(g).map(function (k) { return g[k]; }).sort(function (a, b) { return Date.parse(b.last.created_at) - Date.parse(a.last.created_at); });
    }
    function typing() { return [].some.call(wrap.querySelectorAll('textarea'), function (t) { return t === D.activeElement || t.value !== ''; }); }
    function markRead(g) {
      if (!g || !g.unread) return;
      req('/rest/v1/chat_messages?user_id=eq.' + g.id + '&sender=eq.customer&read_by_staff=eq.false', 'PATCH', { read_by_staff: true }, 'return=minimal')
        .then(function () { g.msgs.forEach(function (m) { m.read_by_staff = true; }); g.unread = 0; }).catch(function () {});
    }
    function draw() {
      wrap.textContent = '';
      var gs = groups();
      if (!cur) {
        if (!gs.length) { wrap.appendChild(h('div', 'empty', 'No chats yet. When a logged-in customer writes from the shop, it shows here.')); return; }
        gs.forEach(function (g) {
          var k = h('div', 'card'), top = h('div', 'top'); top.appendChild(h('span', 'ref', g.name || 'Customer'));
          if (g.unread) top.appendChild(h('span', 'badge b-pending', g.unread + ' new')); else if (g.last.sender === 'staff') top.appendChild(h('span', 'badge b-paid', 'replied'));
          k.appendChild(top); k.appendChild(h('div', 'when', A().fmt(g.last.created_at)));
          k.appendChild(h('div', 'meta', (g.last.sender === 'staff' ? 'You: ' : '') + pv(g.last.body)));
          k.style.cursor = 'pointer'; k.onclick = function () { cur = g.id; markRead(g); draw(); }; wrap.appendChild(k);
        });
        return;
      }
      var g = gs.filter(function (x) { return x.id === cur; })[0];
      if (!g) { cur = null; draw(); return; }
      var back = h('button', 'btn alt sm', '← All chats'); back.type = 'button'; back.onclick = function () { cur = null; draw(); }; wrap.appendChild(back);
      var card = h('div', 'card'); card.appendChild(h('div', 'ref', g.name || 'Customer')); wrap.appendChild(card);
      var box = h('div'); box.style.cssText = 'display:flex;flex-direction:column;gap:.4rem;margin:.6rem 0;max-height:55vh;overflow-y:auto'; wrap.appendChild(box);
      g.msgs.forEach(function (m) {
        var mine = m.sender === 'staff', b = h('div', null, m.body);
        b.style.cssText = 'max-width:85%;padding:.5rem .7rem;border-radius:12px;white-space:pre-wrap;word-wrap:break-word;' + (mine ? 'align-self:flex-end;background:#f68b1e;color:#fff' : 'align-self:flex-start;background:#fff;border:1px solid var(--ln)');
        var sm = h('small', null, A().fmt(m.created_at) + (mine && m.staff_email ? ' · ' + m.staff_email.split('@')[0] : '')); sm.style.cssText = 'display:block;opacity:.7;font-size:.7rem;margin-top:.15rem'; b.appendChild(sm); box.appendChild(b);
      });
      box.scrollTop = box.scrollHeight;
      var ta = inp('textarea', { rows: 2, maxlength: 1000, placeholder: 'Type a reply' }); wrap.appendChild(ta);
      var send = h('button', 'btn sm', 'Send reply'); send.type = 'button'; send.style.marginTop = '.5rem'; wrap.appendChild(send);
      function go() {
        var t = ta.value.trim(); if (t.length < 1 || busy) return; busy = true; send.disabled = true;
        req('/rest/v1/chat_messages', 'POST', { user_id: cur, sender: 'staff', staff_email: A().email() || null, body: t }, 'return=minimal')
          .then(function () { ta.value = ''; return load(true); }).catch(function (e) { msg(c, e.message); }).then(function () { busy = false; send.disabled = false; });
      }
      send.onclick = go;
      ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); go(); } });
    }
    function load(force) {
      return req('/rest/v1/chat_messages?select=*&order=created_at.desc&limit=1000').then(function (r) {
        rows = (r || []).slice().reverse();
        if (force || !typing()) { draw(); if (cur) markRead(groups().filter(function (x) { return x.id === cur; })[0]); }
      }).catch(function (e) { msg(c, e.message.indexOf('Table missing') > -1 ? 'Chat table missing. Run setup-chat.sql in Supabase.' : e.message); });
    }
    load(true);
    var live = setInterval(function () { if (!c.isConnected) { clearInterval(live); return; } if (!D.hidden) load(false); }, 6000);
  }

  window.STMExtras = { mount: function (root, view) { ({ bulk: bulk, vouchers: vouchers, expenses: expenses, inbox: inbox, livechat: livechat, reviews: reviews })[view](root); } };
})();
