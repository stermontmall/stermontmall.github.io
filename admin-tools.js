/* Stermont Arcade · admin tools: small helpers that make the admin portal smoother.
   - emails a confirmation when the receipt email template is not set up (instead of failing every time)
   - red/amber badges on the menu (new messages, unread chats, reviews waiting, low stock)
   - export orders to CSV
   - un-sticks catalog buttons after a failed action, auto-hides old pop-up messages, Esc closes dialogs
   Loaded by admin.html after receipt.js and catalog-v10.js. Nothing here writes to the database. */
(function () {
  'use strict';
  var D = document;
  function A() { return window.STMAdmin; }

  /* ---------- 1. receipt email: fall back to the confirmation email when the receipt template is empty ---------- */
  (function () {
    var R = window.STM_RECEIPT; if (!R || R.__patched) return; R.__patched = true;
    var orig = R.email;
    R.email = function (o) {
      return orig(o).then(function () { R.fallback = false; }, function (e) {
        if (e && /not set up/i.test(e.message || '') && o && o.email && o.pay_code && R.notify) { R.fallback = true; return R.notify(o, 'confirmed'); }
        throw e;
      });
    };
  })();

  /* ---------- 2. menu badges ---------- */
  var counts = {}, lastC = 0, busyC = false;
  function paint() {
    var nav = D.getElementById('navg'); if (!nav) return;
    Array.prototype.forEach.call(nav.querySelectorAll('.ni[data-tab]'), function (b) {
      var n = counts[b.getAttribute('data-tab')], old = b.querySelector('.cnt.x');
      if (old) old.remove();
      if (n > 0) { var s = D.createElement('span'); s.className = 'cnt x hot'; s.textContent = n > 99 ? '99+' : String(n); b.appendChild(s); }
    });
  }
  function q(path) { return A().api(path).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }); }
  function refreshCounts(force) {
    var a = A(); if (!a || !a.email() || busyC) return;
    if (!force && Date.now() - lastC < 4000) return;
    busyC = true; lastC = Date.now();
    Promise.all([
      q('/rest/v1/messages?select=id&status=eq.new&limit=200'),
      q('/rest/v1/chat_messages?select=id&sender=eq.customer&read_by_staff=eq.false&limit=500'),
      q('/rest/v1/reviews?select=id&status=eq.pending&limit=200'),
      q('/rest/v1/products?select=id,stock,low_at&active=eq.true&limit=2000')
    ]).then(function (r) {
      counts.inbox = r[0].length; counts.livechat = r[1].length; counts.reviews = r[2].length;
      counts.stock = r[3].filter(function (p) { return (+p.stock || 0) < (+p.low_at || 0); }).length;
      paint();
    }).then(function () { busyC = false; }, function () { busyC = false; });
  }

  /* ---------- 3. export orders to CSV ---------- */
  function cell(x) {
    var t = x == null ? '' : String(x);
    if (/^[=+\-@\t\r]/.test(t) && !/^\+\d{9,15}$/.test(t)) t = "'" + t;   /* stops spreadsheet formula injection, keeps +254 numbers */
    return /[",\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
  }
  function exportOrders(rows) {
    var head = ['Reference', 'Placed', 'Status', 'Stage', 'Customer', 'Phone', 'Email', 'Method', 'County', 'Address', 'Items', 'Subtotal', 'Voucher', 'Discount', 'M-Pesa code', 'Amount paid', 'Handled by', 'Handled at', 'Notes'];
    var lines = [head.map(cell).join(',')];
    rows.forEach(function (o) {
      var items = (o.items || []).map(function (i) { return i.qty + ' x ' + i.name; }).join('; ');
      lines.push([o.ref, o.created_at, o.status || 'pending', o.stage || '', o.customer_name, o.phone, o.email, o.method, o.county, o.address, items, o.subtotal, o.voucher_code, o.discount,
        o.pay_code ? String(o.pay_code).toUpperCase() : '', o.pay_amount, o.handled_by, o.handled_at, o.notes].map(cell).join(','));
    });
    var blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var a = D.createElement('a'), d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    a.href = URL.createObjectURL(blob); a.download = 'stermont-orders-' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '.csv';
    D.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    if (A() && A().note) A().note('Exported ' + rows.length + ' order' + (rows.length === 1 ? '' : 's') + ' to CSV.', true);
  }

  /* ---------- 4. housekeeping, once a second ---------- */
  setInterval(function () {
    var now = Date.now();
    /* pop-up messages fade after a while (6 s when good news, 12 s otherwise); tap one to dismiss it sooner */
    Array.prototype.forEach.call(D.querySelectorAll('#aerr,#cx-err,.xm'), function (el) {
      if (el.hidden) { el.__s = null; return; }
      var t = el.textContent;
      if (el.__s !== t) { el.__s = t; el.__t = now; }
      if (now - el.__t > (el.style.background ? 6000 : 12000)) el.hidden = true;
    });
    /* a catalog button that was greyed out while saving comes back to life if the save failed */
    var er = D.getElementById('cx-err');
    if (er && !er.hidden) Array.prototype.forEach.call(D.querySelectorAll('#cx-list button[data-a][disabled]'), function (b) { if (b.textContent.indexOf('Deleting') < 0) b.disabled = false; });
    /* leftover version label in the restock dialog */
    Array.prototype.forEach.call(D.querySelectorAll('.modal h2 small'), function (s) { if (/v\d+/.test(s.textContent)) s.remove(); });
  }, 1000);

  D.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('#aerr,#cx-err,.xm') : null;
    if (t) t.hidden = true;
  });

  /* Esc closes the top dialog (same as Cancel) */
  D.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var ms = D.querySelectorAll('.modal:not([hidden]), .dlg:not([hidden])'), m = ms[ms.length - 1];
    var b = m && m.querySelector('#cf-n, #sg-x, #cx-mn'); if (b) b.click();
  });

  window.STMTools = { paint: paint, refreshCounts: refreshCounts, exportOrders: exportOrders };
})();
