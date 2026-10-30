    (function () {
      var D = document;
      /* ---- Settings: put your M-Pesa Till or Paybill here ---- */
      var CFG = { paybill: '714777', payAcct: '0748888230', wa: '254748888230',
        sbUrl: 'https://oewvtbnmyombbtggamor.supabase.co', sbKey: 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7', sbRef: 'oewvtbnmyombbtggamor',
        /* M-Pesa STK Push (Daraja). Keep false while on sandbox; set true when production keys are live. Test any time with ?stk=1 in the page URL. */
        stk: true,
        /* Free key from https://web3forms.com (enter the email that should receive order alerts) */
        mailKey: '2c55cbd0-5ec1-4603-a6a0-293b8a68faab',
        /* Optional second inbox: paste a key made with the other email here */
        mailKey2: '',
        /* EmailJS (backup alert to staff + confirmation email to customer). Fill these 4 from your EmailJS dashboard. */
        ejsKey: 'PayiXKhM6gVQLHYAE', ejsService: 'service_zoho', ejsAdminTpl: '', ejsCustTpl: 'template_n60yao4',
        adminEmail: 'info@stermontarcade.co.ke', staffEmail: 'info@stermontarcade.co.ke', ejsStaffTpl: 'template_cv2qjgm',
        /* Delivery fee per county in KSh. It is added to the total the customer pays. Counties not listed (far north / remote) say the fee is confirmed on WhatsApp. Edit the numbers here any time. */
        fees: { 'Nairobi': 300, 'Kiambu': 400, 'Machakos': 400, 'Kajiado': 400, 'Nakuru': 600, 'Nyeri': 600, 'Meru': 600, 'Tharaka-Nithi': 600, 'Embu': 600, 'Kirinyaga': 600, "Murang'a": 600, 'Nyandarua': 600, 'Laikipia': 600, 'Mombasa': 600, 'Kisumu': 600, 'Uasin Gishu': 600, 'Kwale': 800, 'Kilifi': 800, 'Taita-Taveta': 800, 'Garissa': 800, 'Isiolo': 800, 'Kitui': 800, 'Makueni': 800, 'Trans Nzoia': 800, 'Elgeyo-Marakwet': 800, 'Nandi': 800, 'Baringo': 800, 'Narok': 800, 'Kericho': 800, 'Bomet': 800, 'Kakamega': 800, 'Vihiga': 800, 'Bungoma': 800, 'Busia': 800, 'Siaya': 800, 'Homa Bay': 800, 'Migori': 800, 'Kisii': 800, 'Nyamira': 800 } };
      function slug(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
      function ls(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} return null; }
      function h(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
      function money(n) { return 'KSh ' + n.toLocaleString('en-KE'); }
      var cart = ls('stm_cart') || {}, cust = ls('stm_cust') || {}, step = 'cart', isOpen = false, opener = null, ref = '', lastMsg = '', lastUrl = '', sending = false, sendErr = '', doneRef = '', doneTotal = 0, doneCode = '', doneAmt = 0;
      /* Saved checkout details belong to one person. If a different account (or a guest) is now using this phone, drop them so nobody sees the previous customer's details. */
      function myUid() { try { var x = JSON.parse(localStorage.getItem('sb-' + CFG.sbRef + '-auth-token')); return x && x.user && x.user.id ? x.user.id : null; } catch (e) { return null; } }
      var lastUid = myUid();
      if (!cust || cust.uid === undefined || cust.uid !== lastUid) { cust = {}; ls('stm_cust', null); }
      var form = { method: 'delivery', name: cust.name || '', phone: cust.phone || '', email: cust.email || '', county: cust.county || '', addr: cust.addr || '', notes: '', payCode: '', payAmt: '', payTouched: false }, errs = {};
      function session() {
        try {
          var x = JSON.parse(localStorage.getItem('sb-' + CFG.sbRef + '-auth-token'));
          if (x && x.access_token && x.user && (!x.expires_at || x.expires_at * 1000 > Date.now() + 30000)) return x;
        } catch (e) {}
        return null;
      }
      (function () { var u = (session() || {}).user; if (u) { var md = u.user_metadata || {}; if (!form.name) form.name = md.full_name || ''; if (!form.phone) form.phone = md.phone || ''; if (!form.email) form.email = u.email || ''; } })();
      /* If the signed-in account changes while the page is open (sign out / sign in as someone else), clear everything typed or saved for the previous person. */
      function checkWho() {
        var u = myUid(); if (u === lastUid) return; lastUid = u;
        cust = {}; ls('stm_cust', null); ref = ''; stkPhone = ''; stkMsg = ''; errs = {}; if (step === 'done') step = 'cart';
        form.name = ''; form.phone = ''; form.email = ''; form.county = ''; form.addr = ''; form.notes = ''; form.payCode = ''; form.payAmt = ''; form.payTouched = false; form.vc = null; form.vcode = '';
        var us = (session() || {}).user; if (us) { var m2 = us.user_metadata || {}; form.name = m2.full_name || ''; form.phone = m2.phone || ''; form.email = us.email || ''; }
      }
      window.addEventListener('storage', function (e) { if (e.key && e.key.indexOf('-auth-token') > -1) { checkWho(); if (isOpen) render(); } });
      var counties = [].map.call(D.querySelectorAll('.counties li'), function (l) { return l.textContent; });

      D.querySelectorAll('#featured .pcard:not(.cta)').forEach(function (c) {
        c.id = 'p-' + slug(c.querySelector('h3').textContent);
        var old = c.querySelector('.btn'), b = h('button', 'btn btn-main', 'Add to cart'); b.type = 'button';
        old.parentNode.insertBefore(b, old); old.className = 'btn btn-alt';
        b.addEventListener('click', function () { add(c, b); });
      });

      function info(id) {
        var el = D.getElementById(id); if (!el) return null;
        var im = el.querySelector('img'), p = parseInt(el.querySelector('.price').textContent.replace(/\D/g, ''), 10);
        return { id: id, name: el.querySelector('h3').textContent.replace(/^Buy\s+/i, ''), price: p || 0, img: im ? im.src : '' };   /* the shop shows "Buy <name>"; cart, orders, e-mails and WhatsApp keep the plain name */
      }
      function totals() {
        var L = [], n = 0, s = 0;
        Object.keys(cart).forEach(function (id) {
          var i = info(id);
          if (!i || !(cart[id] > 0)) { delete cart[id]; return; }
          i.qty = cart[id]; i.total = i.price * i.qty; n += i.qty; s += i.total; L.push(i);
        });
        return { L: L, n: n, s: s };
      }
      function store() { ls('stm_cart', cart); }
      function toast(t) { var e = D.getElementById('toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { e.classList.remove('on'); }, 1500); }
      function sync() {
        var T = totals();
        D.querySelectorAll('.cb').forEach(function (b) { b.textContent = T.n > 99 ? '99+' : T.n; b.hidden = !T.n; });
        var cb = D.getElementById('cartbar');
        D.getElementById('cartbar-l').textContent = 'View cart \u00b7 ' + T.n + (T.n === 1 ? ' item' : ' items');
        D.getElementById('cartbar-t').textContent = money(T.s);
        cb.classList.toggle('on', T.n > 0 && !isOpen);
        D.querySelectorAll('.pcard[id^="p-"]').forEach(function (c) {
          var b = c.querySelector('button.btn-main'), q = cart[c.id] || 0;
          c.classList.toggle('in-cart', q > 0);
          if (b && !b.dataset.sold) { b.classList.toggle('in-cart', q > 0); b.textContent = q > 0 ? '\u2713 In cart \u00b7 ' + q : 'Add to cart'; }
        });
        if (isOpen) render();
      }
      function bump() { D.querySelectorAll('.cb').forEach(function (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }); }
      function add(el, btn, q) {
        var id = el.id; cart[id] = Math.min(99, (cart[id] || 0) + (q || 1)); store(); sync(); bump(); toast('Added to cart');
      }
      function setQ(id, q) { if (q <= 0) delete cart[id]; else cart[id] = Math.min(99, q); store(); sync(); }
      window.STM = { add: add, open: function () { openDr('cart'); } };

      function qb(t, fn, label) { var b = h('button', null, t); b.type = 'button'; b.setAttribute('aria-label', label); b.onclick = fn; return b; }
      function row(f, a, b, cls) { var r = h('div', 'trow ' + (cls || '')); r.appendChild(h('span', null, a)); r.appendChild(h('span', null, b)); f.appendChild(r); }
      function btn(f, t, fn, cls) { var b = h('button', 'btn ' + (cls || 'btn-main'), t); b.type = 'button'; b.onclick = fn; f.appendChild(b); return b; }
      function normPhone(p) { var d = (p || '').replace(/[\s\-().]/g, ''), m = d.match(/^(?:\+?254|0)([17]\d{8})$/); return m ? '254' + m[1] : null; }
      function go(s) { step = s; render(); }

      function rCart(b, f, T) {
        if (!T.n) {
          var e = h('div', 'empty'); e.appendChild(h('div', 'em', '\uD83D\uDED2')); e.appendChild(h('h3', null, 'Your cart is empty')); e.appendChild(h('p', 'note', 'Add products and check out in under a minute.'));
          btn(e, 'Browse products', function () { closeDr(); D.getElementById('music-gear').scrollIntoView({ behavior: 'smooth' }); }); b.appendChild(e); return;
        }
        var ra = h('div', 'rall'); var rb = h('button', 'rm', '\u2715 Remove all (' + T.n + (T.n === 1 ? ' item)' : ' items)')); rb.type = 'button';
        var armed = false, rt0;
        rb.onclick = function () {
          if (armed) { clearTimeout(rt0); cart = {}; store(); sync(); toast('Cart cleared'); return; }
          armed = true; rb.textContent = 'Tap again to confirm'; rb.classList.add('armed');
          rt0 = setTimeout(function () { armed = false; rb.classList.remove('armed'); rb.textContent = '\u2715 Remove all (' + T.n + (T.n === 1 ? ' item)' : ' items)'); }, 4000);
        };
        ra.appendChild(rb); b.appendChild(ra);
        T.L.forEach(function (i) {
          var r = h('div', 'ci'), im = h('img'); im.src = i.img; im.alt = ''; im.width = 64; im.height = 64; r.appendChild(im);
          var m = h('div', 'cm'); m.appendChild(h('div', 'cn', i.name)); m.appendChild(h('div', 'cu', money(i.price) + ' each'));
          var q = h('div', 'qty'); q.appendChild(qb('\u2212', function () { setQ(i.id, i.qty - 1); }, 'Decrease quantity')); q.appendChild(h('span', null, i.qty)); q.appendChild(qb('+', function () { setQ(i.id, i.qty + 1); }, 'Increase quantity')); m.appendChild(q); r.appendChild(m);
          var rt = h('div', 'cr'); rt.appendChild(h('div', 'ct', money(i.total)));
          var x = h('button', 'rm', '\u2715 Remove'); x.type = 'button'; x.setAttribute('aria-label', 'Remove ' + i.name); x.onclick = function () { setQ(i.id, 0); }; rt.appendChild(x); r.appendChild(rt); b.appendChild(r);
        });
        row(f, 'Subtotal (' + T.n + (T.n === 1 ? ' item)' : ' items)'), money(T.s), 'big');
        f.appendChild(h('p', 'note', 'Delivery fee is added at checkout based on your county.'));
        btn(f, 'Checkout', function () { go('details'); });
        btn(f, 'Keep shopping', closeDr, 'btn-alt');
      }
      function fld(b, id, label, el, extra) {
        var w = h('div', 'fld'), l = h('label', null, label); l.htmlFor = id; w.appendChild(l); el.id = id; el.value = form[id] || '';
        el.setAttribute('aria-describedby', id + '-e'); if (errs[id]) el.setAttribute('aria-invalid', 'true');
        el.addEventListener('input', function () { form[id] = el.value; el.removeAttribute('aria-invalid'); var er = D.getElementById(id + '-e'); if (er) er.textContent = ''; });
        w.appendChild(el); var er = h('div', 'err', errs[id] || ''); er.id = id + '-e'; w.appendChild(er); b.appendChild(w); return el;
      }
      function inp(type, ph, ac, mode) { var i = h('input'); i.type = type; i.placeholder = ph || ''; if (ac) i.autocomplete = ac; if (mode) i.inputMode = mode; return i; }
      function rDetails(b, f, T) {
        var fs = h('div', 'fld'); fs.appendChild(h('label', null, 'How would you like to get your order?')); var os = h('div', 'opts');
        [['delivery', 'Delivery countrywide', 'All 47 counties. Delivery fee confirmed on WhatsApp.']].forEach(function (o) {
          var l = h('label', 'opt' + (form.method === o[0] ? ' sel' : '')), r = h('input'); r.type = 'radio'; r.name = 'method'; r.checked = form.method === o[0];
          r.onchange = function () { form.method = o[0]; errs = {}; render(); };
          var t = h('span'); t.appendChild(h('b', null, o[1])); t.appendChild(h('small', null, o[2])); l.appendChild(r); l.appendChild(t); os.appendChild(l);
        }); fs.appendChild(os); b.appendChild(fs);
        fld(b, 'name', 'Full name', inp('text', 'e.g. Jane Wanjiru', 'name'));
        fld(b, 'phone', 'Phone / WhatsApp number', inp('tel', '07XX XXX XXX', 'tel', 'tel'));
        fld(b, 'email', 'Email (we send your receipt here)', inp('email', 'you@example.com', 'email', 'email'));
        if (form.method === 'delivery') {
          var s = h('select'); s.appendChild(new Option('Select county', '')); counties.forEach(function (c) { s.appendChild(new Option(c, c)); });
          fld(b, 'county', 'County', s); s.value = form.county;
          var fe = h('div', 'note'); fe.id = 'fee-note'; var showFee = function () { var f = CFG.fees[form.county]; fe.textContent = form.county ? (f ? 'Delivery fee to ' + form.county + ': ' + money(f) + '. It is added to your total, so you pay everything in one M-Pesa payment.' : 'We will confirm your delivery fee to ' + form.county + ' on WhatsApp.') : ''; };
          s.addEventListener('change', showFee); showFee(); s.parentNode.appendChild(fe);
          fld(b, 'addr', 'Town / area and street', inp('text', 'e.g. Nairobi CBD, Tom Mboya Street, opposite Archives', 'street-address'));
        }
        var ta = h('textarea'); ta.rows = 2; ta.placeholder = 'Anything we should know?'; fld(b, 'notes', 'Notes (optional)', ta);
        row(f, 'Subtotal', money(T.s), 'big');
        btn(f, 'Review order', function () {
          errs = {};
          if (!form.name || form.name.trim().length < 2) errs.name = 'Enter your full name.';
          if (!normPhone(form.phone)) errs.phone = 'Enter a valid Kenyan number, e.g. 0712 345 678.';
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((form.email || '').trim())) errs.email = 'Enter a valid email so we can send your receipt.';
          if (form.method === 'delivery') { if (!form.county) errs.county = 'Choose your county.'; if (!form.addr || form.addr.trim().length < 3) errs.addr = 'Enter your town / area and street.'; }
          var k = Object.keys(errs);
          if (k.length) { render(); var e = D.getElementById(k[0]); if (e) e.focus(); return; }
          ref = newRef(); go('review');
        });
      }
      function feeOf() { return form.method === 'delivery' ? (CFG.fees[form.county] || 0) : 0; }
      function vOff(T) { return form.vc && form.vc.base === T.s ? form.vc.discount : 0; }
      function due(T) { return Math.max(0, T.s + feeOf() - vOff(T)); }
      /* voucher codes: checked on the server (check_voucher), applied to the items total only */
      function applyV(T, inp, er, ab) {
        var c = (inp.value || '').trim().toUpperCase(); form.vcode = c;
        if (c.length < 3) { er.textContent = 'Enter your voucher code.'; return; }
        ab.disabled = true; er.textContent = '';
        fetch(CFG.sbUrl + '/rest/v1/rpc/check_voucher', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: CFG.sbKey }, body: JSON.stringify({ p_code: c, p_subtotal: T.s, p_phone: form.phone || null }) })
          .then(function (r) { return r.json(); })
          .then(function (j) {
            if (j && j.ok && Number(j.discount) > 0) { form.vc = { code: String(j.code), discount: Math.round(Number(j.discount)), base: T.s }; form.vcode = ''; form.payTouched = false; render(); }
            else { er.textContent = (j && j.reason) || 'That code is not valid.'; ab.disabled = false; }
          })
          .catch(function () { er.textContent = 'Could not check the code. Try again.'; ab.disabled = false; });
      }
      function vBox(b, T) {
        var w = h('div', 'fld'), l = h('label', null, 'Voucher code (optional)'); l.htmlFor = 'vcode'; w.appendChild(l);
        if (vOff(T)) {
          var r = h('div', 'ln'); r.appendChild(h('span', null, '\uD83C\uDF9F\uFE0F ' + form.vc.code + ' applied')); r.appendChild(h('b', null, '-' + money(vOff(T)))); w.appendChild(r);
          var x = h('button', 'btn btn-alt', 'Remove voucher'); x.type = 'button'; x.onclick = function () { form.vc = null; form.payTouched = false; render(); }; w.appendChild(x);
        } else {
          var i = h('input'); i.id = 'vcode'; i.type = 'text'; i.maxLength = 24; i.autocomplete = 'off'; i.spellcheck = false; i.placeholder = 'e.g. WELCOME10'; i.value = form.vcode || ''; i.style.cssText = 'text-transform:uppercase;letter-spacing:.06em'; w.appendChild(i);
          var er = h('div', 'err', ''); w.appendChild(er);
          var a = h('button', 'btn btn-alt', 'Apply voucher'); a.type = 'button'; a.onclick = function () { applyV(T, i, er, a); }; w.appendChild(a);
          i.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); applyV(T, i, er, a); } });
        }
        b.appendChild(w);
      }
      var stkBusy = false, stkMsg = '', stkPhone = '', stkLive = false;
      /* The backend reports whether M-Pesa is in production mode; sandbox keys keep the old Paybill flow for buyers. */
      try { fetch(CFG.sbUrl + '/functions/v1/mpesa-mode', { headers: { apikey: CFG.sbKey } }).then(function (r) { return r.json(); }).then(function (j) { stkLive = !!(j && j.enabled); if (stkLive && isOpen) render(); }).catch(function () {}); } catch (e) {}
      function stkOn() { return CFG.stk === true || stkLive || /[?&]stk=1\b/.test(location.search); }
      function stkFn(name, body) {
        return fetch(CFG.sbUrl + '/functions/v1/' + name, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: CFG.sbKey }, body: JSON.stringify(body) })
          .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || ('Error ' + r.status)); return j; }); });
      }
      function stkPoll(id) {
        return new Promise(function (res, rej) {
          (function tick(k) {
            if (k > 50) { rej(new Error('We did not get your M-Pesa confirmation. If you were charged, message us on WhatsApp with the SMS.')); return; }
            setTimeout(function () {
              stkFn('stk-status', { checkoutRequestId: id }).then(function (j) {
                if (j.status === 'success') res({ receipt: j.receipt, amount: j.amount });
                else if (j.status === 'pending') tick(k + 1);
                else rej(new Error(j.message || 'The payment was not completed. You can try again.'));
              }).catch(function () { tick(k + 1); });
            }, 3000);
          })(0);
        });
      }
      function stkPay(T) {
        if (stkBusy) return;
        var phone = normPhone(stkPhone || form.phone), amt = due(T);
        if (!/^254[17]\d{8}$/.test(phone)) { stkMsg = 'Enter the M-Pesa phone number as 07XX XXX XXX.'; render(); return; }
        if (!ref) ref = newRef();
        stkBusy = true; stkMsg = 'Sending the M-Pesa prompt to your phone...'; render();
        stkFn('stk-push', { phone: phone, amount: amt, ref: ref }).then(function (j) {
          stkMsg = 'Check your phone and enter your M-Pesa PIN to pay ' + money(amt) + '.'; render();
          return stkPoll(j.checkoutRequestId);
        }).then(function (p) {
          stkBusy = false; stkMsg = '';
          form.payCode = p.receipt; form.payAmt = String(p.amount); form.payTouched = true; place(T);
        }).catch(function (e) { stkBusy = false; stkMsg = (e && e.message) || 'Payment failed. Try again.'; render(); });
      }
      function rStk(b, T) {
        var x = h('div', 'pay'); x.appendChild(h('h4', null, 'Pay with an M-Pesa prompt (fastest)'));
        var f = h('div', 'fld'), l = h('label', null, 'M-Pesa phone number'); l.htmlFor = 'stkphone'; f.appendChild(l);
        var i = h('input'); i.id = 'stkphone'; i.type = 'tel'; i.inputMode = 'tel'; i.placeholder = '07XX XXX XXX'; i.value = stkPhone || form.phone || ''; i.disabled = stkBusy;
        i.addEventListener('input', function () { stkPhone = i.value; }); f.appendChild(i); x.appendChild(f);
        if (stkMsg) x.appendChild(h('p', 'note', stkMsg));
        var bt = h('button', 'btn btn-main', stkBusy ? 'Waiting for payment...' : 'Pay ' + money(due(T)) + ' with M-Pesa'); bt.type = 'button'; bt.disabled = stkBusy; bt.onclick = function () { stkPay(T); }; x.appendChild(bt);
        x.appendChild(h('p', 'note', 'Or pay manually with the Paybill details below and enter your code.'));
        b.appendChild(x);
      }
      function cleanCode() { return String(form.payCode || '').replace(/\s+/g, '').toUpperCase(); }
      function codeOk() { return /^[A-Z0-9]{8,12}$/.test(cleanCode()); }
      function amtOk(T) { return Number(form.payAmt) >= due(T); }
      function where() { return form.method === 'pickup' ? 'Collect at ' + CFG.pickup : form.addr.trim() + ', ' + form.county; }
      function box(b, title, lines, edit) {
        var x = h('div', 'box'); x.appendChild(h('h4', null, title));
        lines.forEach(function (l) { var r = h('div', 'ln'); r.appendChild(h('span', null, l[0])); if (l[1]) r.appendChild(h('b', null, l[1])); x.appendChild(r); });
        if (edit) { var a = h('a', null, 'Edit'); a.href = '#'; a.onclick = function (e) { e.preventDefault(); go(edit); }; x.appendChild(a); }
        b.appendChild(x);
      }
      function message(T) {
        var L = ['Hello Stermont Arcade, I would like to place an order.', '', '*Order ' + (ref || doneRef) + '*'];
        T.L.forEach(function (i, k) { L.push((k + 1) + '. ' + i.name + ' x' + i.qty + ' = ' + money(i.total)); });
        L.push('', '*Subtotal:* ' + money(T.s), vOff(T) ? '*Voucher ' + form.vc.code + ':* -' + money(vOff(T)) : '', feeOf() ? '*Delivery fee:* ' + money(feeOf()) : '', (feeOf() || vOff(T)) ? '*Total to pay:* ' + money(due(T)) : '', '*Delivery:* ' + (form.method === 'pickup' ? where() : 'Deliver to ' + where() + (feeOf() ? '' : ' (fee to be confirmed)')), '', '*Name:* ' + form.name.trim(), '*Phone:* +' + normPhone(form.phone));
        if (form.notes && form.notes.trim()) L.push('*Notes:* ' + form.notes.trim());
        L.push('*Payment:* M-Pesa Paybill ' + CFG.paybill + ', account ' + CFG.payAcct, '*M-Pesa code:* ' + (doneCode || cleanCode()) + ' (paid KSh ' + (doneAmt || Number(form.payAmt)) + ')', '', 'Please confirm availability and the delivery fee. Thank you!');
        return L.join('\n');
      }
      function copyBtn(v) { var c = h('button', 'cp', 'Copy'); c.type = 'button'; c.onclick = function () { try { navigator.clipboard.writeText(v).then(function () { toast('Copied'); }); } catch (e) {} }; return c; }
      function payBox(b, amount) {
        var x = h('div', 'pay'); x.appendChild(h('h4', null, 'Payment details: M-Pesa Paybill'));
        [['Business number', CFG.paybill, 1], ['Account number', CFG.payAcct, 1]].concat(amount ? [['Amount', money(amount), 0]] : []).forEach(function (l) {
          var r = h('div', 'pl'); r.appendChild(h('span', null, l[0])); var v = h('span', 'pv', l[1]);
          if (l[2]) { var w = h('span'); w.style.cssText = 'display:flex;align-items:center;gap:.5rem'; w.appendChild(v); w.appendChild(copyBtn(l[1])); r.appendChild(w); } else r.appendChild(v);
          x.appendChild(r);
        });
        var ol = h('ol'); ['Open M-Pesa, then Lipa na M-Pesa, then Pay Bill.', 'Enter the business number and account number above.', 'Enter the amount and your M-Pesa PIN.'].forEach(function (t) { ol.appendChild(h('li', null, t)); });
        x.appendChild(ol); b.appendChild(x);
      }
      function rReview(b, f, T) {
        box(b, 'Items', T.L.map(function (i) { return [i.qty + ' × ' + i.name, money(i.total)]; }), 'cart');
        box(b, form.method === 'pickup' ? 'Collection' : 'Delivery', [[where()]], 'details');
        box(b, 'Contact', [[form.name.trim()], ['+' + normPhone(form.phone)], [(form.email || '').trim()]], 'details');
        vBox(b, T);
        var amt = due(T); if (!form.payTouched) form.payAmt = String(amt);
        var mb = b;
        if (stkOn()) { rStk(b, T); mb = h('details', 'man'); if (stkMsg && !stkBusy) mb.open = true; mb.appendChild(h('summary', null, 'Paid manually instead? Enter your M-Pesa code')); b.appendChild(mb); }
        mb.appendChild(h('p', 'note', 'Step 1: pay with M-Pesa using the details below. Step 2: enter the code from your M-Pesa SMS. Your order is only placed after you enter it.'));
        payBox(mb, amt);
        var pc = h('div', 'fld'), pl = h('label', null, 'M-Pesa transaction code'); pl.htmlFor = 'paycode'; pc.appendChild(pl);
        var pi = h('input'); pi.id = 'paycode'; pi.type = 'text'; pi.maxLength = 14; pi.autocomplete = 'off'; pi.spellcheck = false; pi.placeholder = 'e.g. SGH7A1B2C3'; pi.value = form.payCode || '';
        pi.setAttribute('autocapitalize', 'characters'); pi.style.cssText = 'text-transform:uppercase;letter-spacing:.08em;font-weight:700'; pc.appendChild(pi);
        var pe = h('div', 'err', ''); pc.appendChild(pe); mb.appendChild(pc);
        var ac = h('div', 'fld'), al = h('label', null, 'Amount you paid (KSh)'); al.htmlFor = 'payamt'; ac.appendChild(al);
        var ai = h('input'); ai.id = 'payamt'; ai.type = 'number'; ai.inputMode = 'numeric'; ai.min = '1'; ai.value = form.payAmt || ''; ac.appendChild(ai);
        var ae = h('div', 'err', ''); ac.appendChild(ae); mb.appendChild(ac);
        if (feeOf() || vOff(T)) { row(f, 'Items total', money(T.s)); if (vOff(T)) row(f, 'Voucher ' + form.vc.code, '-' + money(vOff(T))); if (feeOf()) row(f, 'Delivery to ' + form.county, money(feeOf())); row(f, 'Total to pay', money(due(T)), 'big'); } else row(f, 'Items total', money(T.s), 'big'); f.appendChild(h('p', 'note', form.method === 'delivery' && !CFG.fees[form.county] ? 'The delivery fee to your county is confirmed on WhatsApp and paid separately.' : 'Delivery is included in the total above. Pay it in one M-Pesa payment.'));
        if (sendErr) f.appendChild(h('div', 'oerr', sendErr));
        var pb = btn(f, sending ? 'Placing your order...' : 'I have paid, place order', function () { place(T); });
        function check(show) {
          pe.textContent = show && form.payCode && !codeOk() ? 'Enter the code exactly as in the SMS (8 to 12 letters and numbers).' : '';
          ae.textContent = show && form.payAmt && !amtOk(T) ? 'The amount must be at least ' + money(amt) + '.' : '';
          pb.disabled = sending || !(codeOk() && amtOk(T));
        }
        pi.addEventListener('input', function () { form.payCode = pi.value; check(true); });
        ai.addEventListener('input', function () { form.payAmt = ai.value; form.payTouched = true; check(true); });
        check(false);
        if (sendErr) btn(f, 'Send on WhatsApp instead', function () { window.open('https://wa.me/' + CFG.wa + '?text=' + encodeURIComponent(message(T)), '_blank', 'noopener'); }, 'btn-alt');
      }
      function notify(T, s) {
        if (!CFG.mailKey) return;
        var adm = new URL('admin.html', location.href).href;
        var lines = T.L.map(function (i, k) { return (k + 1) + '. ' + i.name + ' x' + i.qty + ' = ' + money(i.total); });
        if (feeOf()) lines.push('Delivery to ' + form.county + ' = ' + money(feeOf()));
        var msg = ['Order ' + ref, '', lines.join('\n'), '', 'Subtotal: ' + money(T.s) + (vOff(T) ? ' - voucher ' + form.vc.code + ' ' + money(vOff(T)) : '') + (feeOf() ? ' + delivery ' + money(feeOf()) : '') + ((feeOf() || vOff(T)) ? ' = TOTAL ' + money(due(T)) : ''), form.method === 'pickup' ? 'Collection: ' + where() : 'Deliver to: ' + where(),
          '', 'Customer: ' + form.name.trim(), 'Phone: +' + normPhone(form.phone), s && s.user && s.user.email ? 'Account email: ' + s.user.email : '',
          form.notes && form.notes.trim() ? 'Notes: ' + form.notes.trim() : '', '', 'Payment: M-Pesa Paybill ' + CFG.paybill + ', account ' + CFG.payAcct, 'M-Pesa CODE entered by customer: ' + (doneCode || cleanCode()) + ' (says paid KSh ' + (doneAmt || Number(form.payAmt)) + ')',
          'WhatsApp the customer: https://wa.me/' + normPhone(form.phone),
          '', 'STATUS: PENDING VERIFICATION. Check the M-Pesa SMS for the code above, then (customer care sign-in required):',
          'APPROVE (paid): ' + adm + '?ref=' + encodeURIComponent(ref) + '&action=approve',
          'DECLINE (not paid): ' + adm + '?ref=' + encodeURIComponent(ref) + '&action=decline'].filter(function (l, i, a) { return l !== '' || a[i - 1] !== ''; }).join('\n');
        /* Backup staff alert: Web3Forms plain text (only used if the styled EmailJS alert fails) */
        function web3() {
          try {
            [CFG.mailKey, CFG.mailKey2].forEach(function (k) {
              if (!k) return;
              fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ access_key: k, subject: 'New order ' + ref + ' - ' + money(due(T)), from_name: 'Stermont Arcade website', message: msg }) })
                .then(function (r) { return r.json().catch(function () { return {}; }); })
                .then(function (j) { if (!j || j.success !== true) console.warn('Web3Forms alert failed:', j && j.message); })
                .catch(function (e) { console.warn('Web3Forms alert error:', e && e.message); });
            });
          } catch (e) {}
        }
        /* Alert 2 + customer confirmation: EmailJS (REST, no extra script needed) */
        function ejs(tpl, params) {
          if (!CFG.ejsKey || !tpl) return Promise.resolve(false);
          return fetch('https://api.emailjs.com/api/v1.0/email/send', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ service_id: CFG.ejsService, template_id: tpl, user_id: CFG.ejsKey, template_params: params }) })
            .then(function (r) { if (!r.ok) return r.text().then(function (t) { console.warn('EmailJS failed:', r.status, t); return false; }); return true; })
            .catch(function (e) { console.warn('EmailJS error:', e && e.message); return false; });
        }
        try {
          var custEmail = ((form.email || '').trim() || (s && s.user && s.user.email) || '').toLowerCase();
          var base = { order_ref: ref, order_total: money(due(T)), order_items: lines.join('\n'), customer_name: form.name.trim(), customer_phone: '+' + normPhone(form.phone),
            delivery: form.method === 'pickup' ? 'Collection: ' + where() : 'Deliver to: ' + where(), mpesa_code: (doneCode || cleanCode()), order_message: msg };
          /* Customer confirmation: also send the same field names the (working) staff template uses, so the styled template is filled in */
          var custBtn = '<a href="https://wa.me/' + CFG.wa + '" style="display:inline-block;background:#7c3aed;color:#ffffff;font-weight:800;font-size:15px;text-decoration:none;padding:14px 22px;border-radius:14px;margin:4px;">Message us on WhatsApp</a>';
          var custMsg = 'Hello ' + form.name.trim() + ', thank you for your order. We have received your M-Pesa code ' + (doneCode || cleanCode()) + ' (KSh ' + (doneAmt || Number(form.payAmt)) + '). We will verify the payment and contact you on WhatsApp to confirm your order and delivery.';
          /* Full styled customer email. The EmailJS template body is just {{{html_body}}}, so everything is built here. */
          function hx(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }
          var itemRows = T.L.map(function (i) {
            return '<tr><td style="padding:10px 0;border-bottom:1px solid #e9e1fb;font-size:15px;color:#282828;">' + hx(i.name) + ' <span style="color:#6b6b6b;">x' + i.qty + '</span></td>' +
              '<td style="padding:10px 0;border-bottom:1px solid #e9e1fb;font-size:15px;color:#282828;text-align:right;white-space:nowrap;font-weight:bold;">' + hx(money(i.total)) + '</td></tr>';
          }).join('') + (feeOf() ? '<tr><td style="padding:14px 0;border-bottom:1px solid #eee7fb;' + CF + 'font-size:15px;color:#1b1230;">&#128666; Delivery to ' + hx(form.county) + '</td><td align="right" style="padding:14px 0;border-bottom:1px solid #eee7fb;' + CF + 'font-size:15px;font-weight:700;color:#1b1230;white-space:nowrap;">' + hx(money(feeOf())) + '</td></tr>' : '');
          var paidCode = doneCode || cleanCode(), paidAmt = doneAmt || Number(form.payAmt);
          var CF = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;", isPick = form.method === 'pickup';
          var cNames = isPick ? ['Received', 'Confirmed', 'Packed', 'Collected'] : ['Received', 'Confirmed', 'Packed', 'Delivered'];
          function cStep(i) {
            var done = i === 0, bg = done ? '#c8f31d' : '#ffffff', fg = done ? '#2a0e5c' : '#8a7fa8', bd = done ? '#c8f31d' : '#d9ccf5', note = i === 0 ? 'Done' : (i === 1 ? 'Next' : '');
            return '<td align="center" valign="top" width="25%" style="padding:0 2px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" width="34" height="34" style="width:34px;height:34px;border-radius:17px;background:' + bg + ';border:2px solid ' + bd + ';' + CF + 'font-size:16px;font-weight:800;color:' + fg + ';">' + (done ? '&#10003;' : '&middot;') + '</td></tr></table>' +
              '<div style="' + CF + 'font-size:12px;font-weight:700;color:' + (done ? '#ffffff' : '#cdbdf3') + ';padding-top:8px;line-height:1.3;">' + cNames[i] + '</div><div style="' + CF + 'font-size:11px;color:#b9a6ee;padding-top:2px;">' + note + '&nbsp;</div></td>';
          }
          var cRows = T.L.map(function (i) {
            return '<tr><td style="padding:14px 0;border-bottom:1px solid #eee7fb;' + CF + 'font-size:15px;color:#1b1230;">' + hx(i.name) + '<div style="font-size:12px;color:#8a7fa8;padding-top:2px;">Qty ' + i.qty + '</div></td>' +
              '<td align="right" style="padding:14px 0;border-bottom:1px solid #eee7fb;' + CF + 'font-size:15px;font-weight:700;color:#1b1230;white-space:nowrap;">' + hx(money(i.total)) + '</td></tr>';
          }).join('');
          var htmlBody = '<div style="background:#efe7ff;padding:28px 12px;">' +
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;border-radius:24px;overflow:hidden;background:#ffffff;box-shadow:0 12px 40px rgba(91,33,182,.22);">' +
            '<tr><td align="center" bgcolor="#5b21b6" style="background:#5b21b6;background-image:linear-gradient(135deg,#9d5cff 0%,#7c3aed 45%,#3b0f8c 100%);padding:34px 24px 26px;">' +
              '<div style="' + CF + 'font-size:13px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#e9ddff;">Stermont <span style="background:#c8f31d;color:#2a0e5c;padding:1px 7px;border-radius:5px;">Arcade</span></div>' +
              '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px auto 14px;"><tr><td align="center" width="76" height="76" style="width:76px;height:76px;border-radius:38px;background:#c8f31d;border:6px solid rgba(255,255,255,.28);' + CF + 'font-size:36px;line-height:76px;">&#128737;</td></tr></table>' +
              '<div style="' + CF + 'font-size:28px;font-weight:900;line-height:1.15;color:#ffffff;">We received your order</div>' +
              '<div style="' + CF + 'font-size:15px;color:#e9ddff;padding-top:8px;">Order <b style="color:#c8f31d;">' + hx(ref) + '</b> is being verified</div>' +
              '<div style="padding-top:14px;"><span style="display:inline-block;background:#f59e0b;color:#2a0e5c;' + CF + 'font-size:12px;font-weight:900;letter-spacing:.1em;padding:6px 14px;border-radius:20px;">&#9203; PENDING VERIFICATION</span></div>' +
            '</td></tr>' +
            '<tr><td bgcolor="#2a0e5c" style="background:#2a0e5c;padding:22px 14px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' + cStep(0) + cStep(1) + cStep(2) + cStep(3) + '</tr></table></td></tr>' +
            '<tr><td style="padding:28px 26px 8px;"><div style="' + CF + 'font-size:18px;font-weight:800;color:#1b1230;">Hi ' + hx(form.name.trim()) + ',</div>' +
              '<p style="' + CF + 'font-size:15px;line-height:1.65;color:#4a4163;margin:10px 0 0;">Thank you for shopping with us. We have your M-Pesa code and are now verifying the payment. We will contact you on WhatsApp to confirm your order and ' + (isPick ? 'collection' : 'delivery') + '. Your order is confirmed only after the payment is verified.</p></td></tr>' +
            '<tr><td style="padding:18px 26px 6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f5ff;border:1px solid #e6dcfb;border-radius:18px;">' +
              '<tr><td colspan="2" style="padding:16px 18px 2px;' + CF + 'font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#7c3aed;">Your order</td></tr>' +
              '<tr><td colspan="2" style="padding:0 18px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + cRows + '</table></td></tr>' +
              '<tr><td style="padding:16px 18px;' + CF + 'font-size:16px;font-weight:700;color:#1b1230;">' + (feeOf() ? 'Total paid' : 'Items total') + '</td><td align="right" style="padding:16px 18px;' + CF + 'font-size:24px;font-weight:900;color:#5b21b6;white-space:nowrap;">' + hx(money(due(T))) + '</td></tr>' +
            '</table></td></tr>' +
            '<tr><td style="padding:12px 20px 6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
              '<td width="50%" valign="top" style="padding:6px;"><div style="background:#f1fbd0;border-radius:16px;padding:14px 16px;"><div style="' + CF + 'font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#4d6b00;">' + (isPick ? 'Collect at' : 'Delivering to') + '</div><div style="' + CF + 'font-size:14px;font-weight:600;line-height:1.45;color:#1b1230;padding-top:6px;">' + hx(where()) + '</div></div></td>' +
              '<td width="50%" valign="top" style="padding:6px;"><div style="background:#efe7ff;border-radius:16px;padding:14px 16px;"><div style="' + CF + 'font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#5b21b6;">M-Pesa code</div><div style="font-family:Courier New,monospace;font-size:16px;font-weight:900;letter-spacing:.06em;color:#1b1230;padding-top:6px;">' + hx(paidCode) + '</div><div style="' + CF + 'font-size:12px;color:#6b5f8a;padding-top:2px;">' + hx(money(paidAmt)) + ' &middot; Awaiting check</div></div></td>' +
            '</tr></table></td></tr>' +
            '<tr><td style="padding:0 26px;"><p style="' + CF + 'font-size:13px;line-height:1.55;color:#6b5f8a;margin:6px 0 0;">The delivery fee, if any, is confirmed with you on WhatsApp.</p></td></tr>' +
            '<tr><td align="center" style="padding:18px 26px 24px;">' + custBtn + '</td></tr>' +
            '<tr><td align="center" bgcolor="#2a0e5c" style="background:#2a0e5c;padding:22px 24px;"><div style="' + CF + 'font-size:14px;font-weight:700;color:#ffffff;">Thank you for shopping with Stermont Arcade</div>' +
              '<div style="' + CF + 'font-size:12px;line-height:1.7;color:#cdbdf3;padding-top:6px;">Questions? Call +254 748 888 230 or reply to this email.<br><a href="https://stermontarcade.co.ke" style="color:#c8f31d;text-decoration:none;">stermontarcade.co.ke</a></div></td></tr>' +
            '</table></div>';
          if (custEmail) ejs(CFG.ejsCustTpl, Object.assign({ to_email: custEmail, subject: 'We received your order ' + ref }, base, {
            html_body: htmlBody,
            business: 'Stermont Arcade', name: form.name.trim(), headline: 'We received your order', message: custMsg, items: lines.join('\n'), total: money(due(T)),
            phone: '+254 748 888 230', web: 'stermontarcade.co.ke', buttons: custBtn }));
          /* Styled staff alert (EmailJS). If it fails, fall back to the plain Web3Forms alert. */
          var enc = encodeURIComponent(ref);
          function mkBtn(href, label, bg, fg) { return '<a href="' + href + '" style="display:inline-block;background:' + bg + ';color:' + fg + ';font-weight:bold;font-size:15px;text-decoration:none;padding:13px 20px;border-radius:12px;margin:4px;">' + label + '</a>'; }
          var buttons = mkBtn(adm + '?ref=' + enc + '&action=approve', 'Approve (paid)', '#c8f31d', '#2a0e5c') + mkBtn(adm + '?ref=' + enc + '&action=decline', 'Decline', '#d92d20', '#ffffff') + mkBtn('https://wa.me/' + normPhone(form.phone), 'WhatsApp customer', '#7c3aed', '#ffffff');
          var staffMsg = 'Customer: ' + form.name.trim() + '\nPhone: +' + normPhone(form.phone) + (custEmail ? '\nEmail: ' + custEmail : '') + (form.notes && form.notes.trim() ? '\nNotes: ' + form.notes.trim() : '') +
            '\n\nPayment: M-Pesa Paybill ' + CFG.paybill + ', account ' + CFG.payAcct + '\nM-Pesa code entered: ' + (doneCode || cleanCode()) + ' (says paid KSh ' + (doneAmt || Number(form.payAmt)) + ')' +
            '\n\nSTATUS: PENDING VERIFICATION. Check the M-Pesa SMS for the code above, then approve or decline (customer care sign-in required).';
          /* Designed staff alert: uses the same working EmailJS template as the customer email (body is just {{{html_body}}}). */
          var pcode = doneCode || cleanCode(), pamt = doneAmt || Number(form.payAmt), amtMatch = pamt === due(T);
          var FF = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;";
          function tile(bg, lc, label, body) { return '<td valign="top" width="50%" style="padding:6px;"><div style="background:' + bg + ';border-radius:16px;padding:14px 16px;"><div style="' + FF + 'font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:' + lc + ';">' + label + '</div><div style="' + FF + 'font-size:14px;font-weight:600;line-height:1.5;color:#1b1230;padding-top:6px;">' + body + '</div></div></td>'; }
          function bigBtn(href, label, bg, fg, extra) { return '<a href="' + href + '" style="display:inline-block;background:' + bg + ';color:' + fg + ';' + FF + 'font-size:16px;font-weight:800;text-decoration:none;padding:15px 26px;border-radius:14px;margin:5px;' + (extra || '') + '">' + label + '</a>'; }
          var sRows = T.L.map(function (i) {
            return '<tr><td style="padding:12px 0;border-bottom:1px solid #eee7fb;' + FF + 'font-size:15px;color:#1b1230;">' + hx(i.name) + '<div style="font-size:12px;color:#8a7fa8;padding-top:2px;">Qty ' + i.qty + '</div></td>' +
              '<td align="right" style="padding:12px 0;border-bottom:1px solid #eee7fb;' + FF + 'font-size:15px;font-weight:700;color:#1b1230;white-space:nowrap;">' + hx(money(i.total)) + '</td></tr>';
          }).join('') + (feeOf() ? '<tr><td style="padding:12px 0;border-bottom:1px solid #eee7fb;' + FF + 'font-size:15px;color:#1b1230;">&#128666; Delivery to ' + hx(form.county) + '</td><td align="right" style="padding:12px 0;border-bottom:1px solid #eee7fb;' + FF + 'font-size:15px;font-weight:700;color:#1b1230;white-space:nowrap;">' + hx(money(feeOf())) + '</td></tr>' : '');
          var staffHtml = '<div style="background:#efe7ff;padding:28px 12px;">' +
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;border-radius:24px;overflow:hidden;background:#ffffff;">' +
            '<tr><td align="center" bgcolor="#5b21b6" style="background:#5b21b6;background-image:linear-gradient(135deg,#9d5cff 0%,#7c3aed 45%,#3b0f8c 100%);padding:32px 24px 26px;">' +
              '<div style="' + FF + 'font-size:13px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#e9ddff;">Stermont <span style="background:#c8f31d;color:#2a0e5c;padding:1px 7px;border-radius:5px;">Arcade</span></div>' +
              '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px auto 12px;"><tr><td align="center" width="76" height="76" style="width:76px;height:76px;border-radius:38px;background:#c8f31d;border:6px solid rgba(255,255,255,.28);' + FF + 'font-size:36px;line-height:76px;">&#128722;</td></tr></table>' +
              '<div style="' + FF + 'font-size:28px;font-weight:900;line-height:1.15;color:#ffffff;">New order!</div>' +
              '<div style="' + FF + 'font-size:34px;font-weight:900;color:#c8f31d;padding-top:8px;">' + hx(money(due(T))) + '</div>' +
              '<div style="' + FF + 'font-size:14px;color:#e9ddff;padding-top:6px;">Order <b>' + hx(ref) + '</b></div>' +
              '<div style="padding-top:14px;"><span style="display:inline-block;background:#f59e0b;color:#2a0e5c;' + FF + 'font-size:12px;font-weight:900;letter-spacing:.1em;padding:6px 14px;border-radius:20px;">&#9203; PENDING VERIFICATION</span></div>' +
            '</td></tr>' +
            '<tr><td style="padding:22px 26px 4px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f5ff;border:1px solid #e6dcfb;border-radius:18px;">' +
              '<tr><td colspan="2" style="padding:16px 18px 2px;' + FF + 'font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#7c3aed;">Items ordered</td></tr>' +
              '<tr><td colspan="2" style="padding:0 18px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + sRows + '</table></td></tr>' +
              '<tr><td style="padding:14px 18px;' + FF + 'font-size:16px;font-weight:700;color:#1b1230;">Order total</td><td align="right" style="padding:14px 18px;' + FF + 'font-size:22px;font-weight:900;color:#5b21b6;white-space:nowrap;">' + hx(money(due(T))) + '</td></tr>' +
            '</table></td></tr>' +
            '<tr><td style="padding:8px 20px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
              tile('#efe7ff', '#5b21b6', '&#128100; Customer', hx(form.name.trim()) + '<br><a href="tel:+' + normPhone(form.phone) + '" style="color:#5b21b6;text-decoration:none;">+' + normPhone(form.phone) + '</a>' + (custEmail ? '<br><span style="font-size:12px;color:#6b5f8a;">' + hx(custEmail) + '</span>' : '')) +
              tile('#f1fbd0', '#4d6b00', form.method === 'pickup' ? '&#127978; Collection' : '&#128666; Deliver to', hx(where())) +
            '</tr></table></td></tr>' +
            (form.notes && form.notes.trim() ? '<tr><td style="padding:6px 26px 0;"><div style="background:#f8f5ff;border-radius:14px;padding:12px 16px;' + FF + 'font-size:13px;color:#4a4163;"><b>Customer notes:</b> ' + hx(form.notes.trim()) + '</div></td></tr>' : '') +
            '<tr><td style="padding:6px 26px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#2a0e5c" style="background:#2a0e5c;border-radius:18px;"><tr>' +
              '<td style="padding:16px 18px;"><div style="' + FF + 'font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#c8f31d;">M-Pesa code entered</div>' +
              '<div style="font-family:Courier New,monospace;font-size:24px;font-weight:900;letter-spacing:.12em;color:#ffffff;padding-top:6px;">' + hx(pcode) + '</div>' +
              '<div style="' + FF + 'font-size:12px;color:#cdbdf3;padding-top:4px;">Customer says paid ' + hx(money(pamt)) + ' &middot; Paybill ' + hx(CFG.paybill) + ' / ' + hx(CFG.payAcct) + '</div></td>' +
              '<td align="right" valign="middle" style="padding:16px 18px;"><span style="display:inline-block;background:' + (amtMatch ? '#c8f31d' : '#f59e0b') + ';color:#2a0e5c;' + FF + 'font-size:12px;font-weight:900;padding:7px 12px;border-radius:12px;">' + (amtMatch ? '&#10003; Amount matches' : '&#9888; Check amount') + '</span></td>' +
            '</tr></table></td></tr>' +
            '<tr><td style="padding:16px 26px 4px;"><div style="background:#fff8e6;border:1px solid #fde4a3;border-radius:14px;padding:12px 16px;' + FF + 'font-size:13px;line-height:1.55;color:#6b4a00;"><b>Before you approve:</b> open your M-Pesa SMS and confirm the code and amount above are real. Sign-in is required on the next page.</div></td></tr>' +
            '<tr><td align="center" style="padding:16px 20px 6px;">' + bigBtn(adm + '?ref=' + enc + '&action=approve', '&#10003; Approve (paid)', '#c8f31d', '#2a0e5c') + bigBtn(adm + '?ref=' + enc + '&action=decline', '&#10005; Decline', '#ffffff', '#dc2626', 'border:2px solid #dc2626;') + '</td></tr>' +
            '<tr><td align="center" style="padding:6px 20px 24px;">' + bigBtn('https://wa.me/' + normPhone(form.phone), '&#128172; WhatsApp customer', '#25d366', '#ffffff') + '</td></tr>' +
            '<tr><td align="center" bgcolor="#2a0e5c" style="background:#2a0e5c;padding:16px 24px;"><div style="' + FF + 'font-size:12px;color:#cdbdf3;">Stermont Arcade &middot; order alert for staff &middot; ' + hx(ref) + '</div></td></tr>' +
            '</table></div>';
          var staffParams = { to_email: CFG.staffEmail, reply_to: custEmail || CFG.staffEmail, subject: 'New order ' + money(due(T)) + ' - ' + form.name.trim() + ' (' + ref + ')', business: 'Stermont Arcade', order_ref: ref, name: 'Stermont team',
            headline: 'New order to verify', message: staffMsg, items: lines.join('\n'), total: money(due(T)), delivery: form.method === 'pickup' ? 'Collection: ' + where() : 'Deliver to: ' + where(),
            phone: '+254 748 888 230', web: 'stermontarcade.co.ke', buttons: buttons, html_body: staffHtml };
          ejs(CFG.ejsCustTpl, staffParams).then(function (ok) {
            if (ok) return true;
            return ejs(CFG.ejsStaffTpl, staffParams);   /* old staff template as second try */
          }).then(function (ok) { if (!ok) web3(); });
        } catch (e) { web3(); }
      }
      function newRef() {
        var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', out = '', i, b = new Uint8Array(6);
        try { (window.crypto || window.msCrypto).getRandomValues(b); } catch (e) { for (i = 0; i < 6; i++) b[i] = Math.floor(Math.random() * 256); }
        for (i = 0; i < 6; i++) out += A.charAt(b[i] % A.length);
        return 'STM-' + out;
      }
      function place(T) {
        if (sending) return;
        sending = true; sendErr = ''; render();
        doneCode = ''; doneAmt = 0;
        var s = session(), method = form.method, code = cleanCode(), paid = Number(form.payAmt);
        if (!codeOk() || !amtOk(T)) { sending = false; sendErr = 'Enter your M-Pesa code and the amount you paid before placing the order.'; render(); return; }
        var row = {
          ref: ref, user_id: s ? s.user.id : null, customer_name: form.name.trim().slice(0, 120), phone: '+' + normPhone(form.phone),
          email: (form.email || '').trim().toLowerCase().slice(0, 150) || (s && s.user.email) || null, method: method, county: method === 'delivery' ? form.county : null,
          address: method === 'delivery' ? form.addr.trim().slice(0, 200) : null, notes: form.notes && form.notes.trim() ? form.notes.trim().slice(0, 500) : null,
          items: T.L.map(function (i) { return { name: i.name, qty: i.qty, price: i.price, total: i.total }; }).concat(feeOf() ? [{ name: 'Delivery fee (' + form.county + ')', qty: 1, price: feeOf(), total: feeOf() }] : []), subtotal: due(T), pay_code: code, pay_amount: paid,
          voucher_code: vOff(T) ? form.vc.code : null, discount: vOff(T)
        };
        var hd = { 'Content-Type': 'application/json', apikey: CFG.sbKey, Prefer: 'return=minimal' };
        if (s) hd.Authorization = 'Bearer ' + s.access_token;
        var ctl = window.AbortController ? new AbortController() : null, to = setTimeout(function () { if (ctl) ctl.abort(); }, 20000);
        function post(rw) {
          return fetch(CFG.sbUrl + '/rest/v1/orders', { method: 'POST', headers: hd, body: JSON.stringify(rw), signal: ctl ? ctl.signal : undefined })
            .then(function (r) { if (r.ok) return; return r.text().then(function (t) { var e = new Error('status ' + r.status + ' ' + t); e.status = r.status; e.body = t; throw e; }); });
        }
        post(row)
          .catch(function (err) {   /* payment columns not set up yet: keep the code in the order notes instead */
            if (err && err.status === 400 && /pay_code|pay_amount/.test(err.body || '')) {
              var r2 = Object.assign({}, row); delete r2.pay_code; delete r2.pay_amount;
              r2.notes = ('M-Pesa code ' + code + ', paid KSh ' + paid + (row.notes ? ' | ' + row.notes : '')).slice(0, 500); return post(r2);
            }
            throw err;
          })
          .then(function () {
            clearTimeout(to); doneCode = code; doneAmt = paid;
            lastMsg = message(T); lastUrl = 'https://wa.me/' + CFG.wa + '?text=' + encodeURIComponent(lastMsg);
            notify(T, s);
            ls('stm_cust', { uid: myUid(), name: form.name.trim(), phone: form.phone, email: (form.email || '').trim(), county: form.county, addr: form.addr, method: form.method });
            doneRef = ref; doneTotal = due(T); form.vc = null; form.vcode = ''; ref = ''; cart = {}; store(); sending = false; form.notes = ''; form.payCode = ''; form.payAmt = ''; form.payTouched = false; step = 'done'; sync(); if (!isOpen) render();
          })
          .catch(function (err) {
            clearTimeout(to); sending = false;
            try { console.error('Order failed:', err && err.message); } catch (e) {}
            sendErr = err && err.status === 409 ? 'This M-Pesa code has already been used on another order. Check the code in your SMS, or message us on WhatsApp.' : 'We could not place your order. Check your connection and try again, or send it on WhatsApp instead.' + (err && err.status ? ' (Error ' + err.status + ')' : ' (Network)'); render();
          });
      }
      function rDone(b, f) {
        var c = h('div', 'center'); c.appendChild(h('div', 'done-ic', '✓')); c.appendChild(h('h3', null, 'Order received')); c.appendChild(h('p', 'note', 'Reference ' + doneRef));
        c.appendChild(h('p', null, 'Thank you! We have your M-Pesa code. We will verify the payment and contact you on WhatsApp to confirm your order and delivery.')); b.appendChild(c);
        box(b, 'Payment submitted', [['M-Pesa code', doneCode], ['Amount', money(doneAmt)]]);
        var a = h('a', 'btn btn-main', 'Message us on WhatsApp'); a.href = lastUrl; a.target = '_blank'; a.rel = 'noopener'; f.appendChild(a);
        btn(f, 'Copy order details', function () { try { navigator.clipboard.writeText(lastMsg).then(function () { toast('Copied'); }); } catch (e) {} }, 'btn-alt');
        if (session()) { var mo = h('a', 'btn btn-alt', 'View my orders'); mo.href = 'account.html'; f.appendChild(mo); }
        btn(f, 'Close', function () { step = 'cart'; closeDr(); }, 'btn-alt');
      }
      function render() {
        var T = totals(), b = D.getElementById('dr-b'), f = D.getElementById('dr-f'), idx = { cart: 0, details: 1, review: 2, done: 3 }[step];
        b.textContent = ''; f.textContent = '';
        D.getElementById('dr-back').hidden = (step === 'cart' || step === 'done'); D.getElementById('steps').hidden = (step === 'done');
        [].forEach.call(D.getElementById('steps').children, function (li, i) { li.className = i < idx ? 'done' : i === idx ? 'on' : ''; });
        D.getElementById('dr-t').textContent = { cart: 'Your cart', details: 'Delivery details', review: 'Review & pay', done: 'Order received' }[step];
        if (!T.n && step !== 'done') step = 'cart';
        ({ cart: rCart, details: rDetails, review: rReview, done: rDone })[step](b, f, T);
      }
      function openDr(s) {
        checkWho();
        step = s || 'cart'; opener = D.activeElement; isOpen = true; D.getElementById('dr').classList.add('on'); D.body.style.overflow = 'hidden';
        if (!(history.state && history.state.dr)) history.pushState({ dr: 1 }, ''); sync(); D.getElementById('dr-x').focus();
      }
      function closeDr(pop) {
        if (!isOpen) return; isOpen = false; D.getElementById('dr').classList.remove('on'); D.body.style.overflow = ''; sync();
        if (pop !== true && history.state && history.state.dr) history.back(); if (opener && opener.focus) opener.focus();
      }
      D.getElementById('cartbtn').addEventListener('click', function () { openDr('cart'); });
      D.getElementById('cartbar').addEventListener('click', function () { openDr('cart'); });
      D.getElementById('dr-x').addEventListener('click', function () { closeDr(); });
      D.getElementById('dr-back').addEventListener('click', function () { go(step === 'review' ? 'details' : 'cart'); });
      D.getElementById('dr').addEventListener('click', function (e) { if (e.target === this) closeDr(); });
      D.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDr(); });
      window.addEventListener('popstate', function () { if (isOpen) closeDr(true); });
      var ob = D.querySelector('#bar a[href="#order"]');
      if (ob) { var sp = h('span', 'cb', '0'); sp.hidden = true; ob.appendChild(sp); ob.addEventListener('click', function (e) { e.preventDefault(); openDr('cart'); }); }
      /* Sold-out products (set by customer care in the admin page) */
      try {
        fetch(CFG.sbUrl + '/rest/v1/stock?select=product&in_stock=eq.false', { headers: { apikey: CFG.sbKey } })
          .then(function (r) { return r.ok ? r.json() : []; })
          .then(function (rows) {
            rows.forEach(function (x) {
              var c = D.getElementById('p-' + x.product); if (!c) return;
              var b = c.querySelector('button.btn-main'); if (b) { b.dataset.sold = '1'; b.disabled = true; b.textContent = 'Sold out'; b.style.opacity = '.55'; }
              var im = c.querySelector('.img'); if (im && !im.querySelector('.soldtag')) { var t = h('span', 'soldtag', 'Sold out'); t.style.cssText = 'position:absolute;top:.5rem;left:.5rem;background:#b91c1c;color:#fff;font-weight:800;font-size:.75rem;padding:.2rem .6rem;border-radius:999px'; if (getComputedStyle(im).position === 'static') im.style.position = 'relative'; im.appendChild(t); }
              delete cart['p-' + x.product];
            });
            store(); sync();
          }).catch(function () {});
      } catch (e) {}
      sync();
    })();
