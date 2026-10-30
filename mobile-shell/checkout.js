/* Stermont Arcade mobile shell: checkout sheet.
   Opens from the Cart tab's "Checkout with M-Pesa" button (#checkout) and uses the SAME backend as the main site's
   checkout-deferred.js: M-Pesa prompt (Supabase functions stk-push / stk-status), or Paybill + the M-Pesa code typed by the buyer,
   then one insert into the `orders` table (status stays "pending verification": staff approve it in admin.html after checking the SMS)
   and the same staff + customer e-mails. The cart is read from localStorage ("shell.cart", written by app.js); app.js is not touched.
   NOTE: CFG, FEES and COUNTIES are copied from checkout-deferred.js. If you change a fee or the Paybill there, change it here too. */
(() => {
'use strict';
const CFG = {
  paybill: '714777', payAcct: '0748888230', wa: '254748888230',
  sbUrl: 'https://oewvtbnmyombbtggamor.supabase.co', sbKey: 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7', sbRef: 'oewvtbnmyombbtggamor',
  mailKey: '2c55cbd0-5ec1-4603-a6a0-293b8a68faab',
  ejsKey: 'PayiXKhM6gVQLHYAE', ejsService: 'service_zoho', ejsCustTpl: 'template_n60yao4', ejsStaffTpl: 'template_cv2qjgm',
  staffEmail: 'info@stermontarcade.co.ke'
};
const FEES = { 'Nairobi': 300, 'Kiambu': 400, 'Machakos': 400, 'Kajiado': 400, 'Nakuru': 600, 'Nyeri': 600, 'Meru': 600, 'Tharaka-Nithi': 600, 'Embu': 600, 'Kirinyaga': 600, "Murang'a": 600, 'Nyandarua': 600, 'Laikipia': 600, 'Mombasa': 600, 'Kisumu': 600, 'Uasin Gishu': 600,
  'Kwale': 800, 'Kilifi': 800, 'Taita-Taveta': 800, 'Garissa': 800, 'Isiolo': 800, 'Kitui': 800, 'Makueni': 800, 'Trans Nzoia': 800, 'Elgeyo-Marakwet': 800, 'Nandi': 800, 'Baringo': 800, 'Narok': 800, 'Kericho': 800, 'Bomet': 800, 'Kakamega': 800, 'Vihiga': 800, 'Bungoma': 800, 'Busia': 800, 'Siaya': 800, 'Homa Bay': 800, 'Migori': 800, 'Kisii': 800, 'Nyamira': 800 };
/* all 47 counties; the ones without a fee above (Lamu, Mandera, Marsabit, Samburu, Tana River, Turkana, Wajir, West Pokot) get "fee confirmed on WhatsApp" */
const COUNTIES = ['Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa', "Murang'a", 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'];

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => 'KSh ' + Number(n).toLocaleString('en-KE');
const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const normPhone = p => { const d = String(p || '').replace(/[\s\-().]/g, ''), m = d.match(/^(?:\+?254|0)([17]\d{8})$/); return m ? '254' + m[1] : null; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
function session() {   /* the same sign-in the main site keeps in localStorage; guests have none */
  try { const x = JSON.parse(localStorage.getItem('sb-' + CFG.sbRef + '-auth-token')); if (x && x.access_token && x.user && (!x.expires_at || x.expires_at * 1000 > Date.now() + 30000)) return x; } catch {}
  return null;
}
const myUid = () => { const s = session(); return s ? s.user.id : null; };
function newRef() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = new Uint8Array(6); let out = '';
  try { crypto.getRandomValues(b); } catch { for (let i = 0; i < 6; i++) b[i] = Math.floor(Math.random() * 256); }
  for (let i = 0; i < 6; i++) out += A.charAt(b[i] % A.length);
  return 'STM-' + out;
}

/* ---------- cart + state ---------- */
/* The shop shows "Buy <name>"; orders, e-mails and WhatsApp keep the plain name (same rule as checkout-deferred.js). */
const plain = n => String(n || '').replace(/^Buy\s+/i, '');
const cartItems = () => lsGet('shell.cart', []).filter(i => i && i.rowId && i.qty > 0 && Number(i.price) > 0).map(i => {
  const qty = Math.min(99, i.qty | 0), price = Number(i.price);
  return { rowId: i.rowId, name: plain(i.name) + (i.size && i.size !== 'Standard' ? ' \u2013 ' + i.size : ''), qty, price, total: price * qty };
});
const blank = () => ({ name: '', phone: '', email: '', county: '', addr: '', notes: '' });
const S = { step: 'details', f: blank(), errs: {}, ref: '', stkPhone: '', stkBusy: false, stkMsg: '', payCode: '', payAmt: '', payTouched: false, manOpen: false, sending: false, err: '', done: null };
(function prefill() {
  const c = lsGet('shell.cust', null), u = (session() || {}).user;
  if (c && c.uid === myUid()) Object.assign(S.f, { name: c.name || '', phone: c.phone || '', email: c.email || '', county: c.county || '', addr: c.addr || '' });
  if (u) { const md = u.user_metadata || {}; if (!S.f.name) S.f.name = md.full_name || ''; if (!S.f.phone) S.f.phone = md.phone || ''; if (!S.f.email) S.f.email = u.email || ''; }
})();
const sub = () => cartItems().reduce((n, i) => n + i.total, 0);
const fee = () => FEES[S.f.county] || 0;
const due = () => sub() + fee();
const cleanCode = () => String(S.payCode || '').replace(/\s+/g, '').toUpperCase();
const codeOk = () => /^[A-Z0-9]{8,12}$/.test(cleanCode());
const amtOk = () => Number(S.payAmt) >= due();
const where = f => f.addr.trim() + ', ' + f.county;
const busy = () => S.stkBusy || S.sending;
const feeText = () => !S.f.county ? '' : FEES[S.f.county] ? 'Delivery fee to ' + S.f.county + ': ' + money(FEES[S.f.county]) + '. It is added to your total, so you pay everything in one M-Pesa payment.' : 'We will confirm your delivery fee to ' + S.f.county + ' on WhatsApp.';
const snapNow = () => { const items = cartItems(), s = items.reduce((n, i) => n + i.total, 0), fe = FEES[S.f.county] || 0; return { ref: S.ref, items, sub: s, fee: fe, due: s + fe, f: { ...S.f }, code: cleanCode(), paid: Number(S.payAmt) || 0 }; };

/* ---------- DOM ---------- */
const CSS = `
#co{position:fixed;inset:0;z-index:80;display:flex;flex-direction:column;background:#f7f7fb;color:#1b1230;font:14px/1.4 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
#co[hidden]{display:none}
#co header{display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top,0px) + 6px) 8px 6px;background:#fff;border-bottom:1px solid #e5e7eb}
#co header h2{flex:1;margin:0;font-size:16px;font-weight:700}
#co header button{width:40px;height:40px;border:0;background:none;font-size:20px;color:#1b1230}
#co header button[hidden]{display:none}
#co-b{flex:1;overflow-y:auto;padding:12px}
#co footer{padding:10px 12px calc(env(safe-area-inset-bottom,0px) + 10px);background:#fff;border-top:1px solid #e5e7eb}
#co .co-f{margin-bottom:12px}
#co .co-f label{display:block;font-weight:600;font-size:12px;margin-bottom:4px}
#co .co-f input,#co .co-f select,#co .co-f textarea{width:100%;box-sizing:border-box;min-height:44px;padding:10px 12px;border:1px solid #d1d5db;border-radius:10px;background:#fff;font:inherit;font-size:16px;color:#1b1230}
#co .co-f [aria-invalid]{border-color:#dc2626}
#co .co-e,#co .co-err{color:#dc2626;font-size:12px;margin-top:3px}
#co .co-note{color:#6b7280;font-size:12px;margin:4px 0}
#co .co-box{background:#fff;border-radius:12px;padding:12px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
#co .co-box h4{margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#7c3aed}
#co .co-box summary{font-weight:600;color:#5b21b6}
#co .co-ln{display:flex;justify-content:space-between;gap:10px;padding:3px 0}
#co .co-ln b{white-space:nowrap}
#co .co-edit{display:inline-block;margin-top:4px;color:#7c3aed;font-size:12px;background:none;border:0;padding:4px 0;text-decoration:underline}
#co .co-tot{display:flex;justify-content:space-between;font-size:16px;font-weight:800}
#co .co-btn{display:block;width:100%;box-sizing:border-box;min-height:46px;border:0;border-radius:999px;background:#7c3aed;color:#fff;font:inherit;font-weight:700;font-size:15px;margin-top:8px;text-align:center;text-decoration:none;line-height:46px;padding:0 12px}
#co .co-btn[disabled]{opacity:.5}
#co .co-btn.alt{background:#ede9fe;color:#5b21b6}
#co .co-cp{border:0;background:#ede9fe;color:#5b21b6;border-radius:8px;padding:4px 10px;font:inherit;font-size:12px;margin-left:8px}
#co .co-done{text-align:center;padding:16px 0 8px}
#co .co-ic{width:56px;height:56px;margin:0 auto 8px;border-radius:50%;background:#c8f31d;color:#2a0e5c;font-size:30px;line-height:56px;font-weight:800}
#co .co-empty{text-align:center;color:#6b7280;padding:40px 0}`;
let ov = null, isOpen = false;
function ensure() {
  if (ov) return;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  ov = document.createElement('div'); ov.id = 'co'; ov.hidden = true; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Checkout');
  ov.innerHTML = '<header><button id="co-back" data-act="back" aria-label="Back" hidden>\u2190</button><h2 id="co-t"></h2><button id="co-x" data-act="close" aria-label="Close">\u2715</button></header><div id="co-b"></div><footer id="co-f"></footer>';
  document.body.appendChild(ov);
  ov.addEventListener('click', onClick);
  ov.addEventListener('input', onInput);
  ov.addEventListener('toggle', e => { if (e.target.classList && e.target.classList.contains('co-man')) S.manOpen = e.target.open; }, true);
}
const line = (a, b) => '<div class="co-ln"><span>' + a + '</span>' + (b != null ? '<b>' + b + '</b>' : '') + '</div>';
const box = (title, lines, edit) => '<div class="co-box"><h4>' + title + '</h4>' + lines.map(l => line(l[0], l[1])).join('') + (edit ? '<button class="co-edit" data-act="' + edit[0] + '">' + edit[1] + '</button>' : '') + '</div>';
const fld = (id, label, inner) => '<div class="co-f"><label for="co-' + id + '">' + label + '</label>' + inner + '<div class="co-e" id="e-' + id + '">' + esc(S.errs[id] || '') + '</div></div>';

function render() {
  const b = $('#co-b'), f = $('#co-f'), items = cartItems();
  $('#co-back').hidden = S.step !== 'review' || busy();
  $('#co-x').hidden = busy();
  $('#co-t').textContent = { details: 'Delivery details', review: 'Review & pay', done: 'Order received' }[S.step];
  if (!items.length && S.step !== 'done') { b.innerHTML = '<p class="co-empty">Your cart is empty.</p>'; f.innerHTML = ''; return; }
  ({ details: rDetails, review: rReview, done: rDone })[S.step](b, f, items);
}
function rDetails(b, f, items) {
  const v = k => esc(S.f[k] || ''), bad = k => S.errs[k] ? ' aria-invalid="true"' : '';
  b.innerHTML = '<div class="co-box"><h4>Delivery countrywide</h4><p class="co-note" style="margin:0">All 47 counties. The delivery fee depends on your county and is added to your total.</p></div>' +
    fld('name', 'Full name', '<input id="co-name" data-f="name" type="text" autocomplete="name" placeholder="e.g. Jane Wanjiru" value="' + v('name') + '"' + bad('name') + '>') +
    fld('phone', 'Phone / WhatsApp number', '<input id="co-phone" data-f="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="07XX XXX XXX" value="' + v('phone') + '"' + bad('phone') + '>') +
    fld('email', 'Email (we send your receipt here)', '<input id="co-email" data-f="email" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" value="' + v('email') + '"' + bad('email') + '>') +
    fld('county', 'County', '<select id="co-county" data-f="county"' + bad('county') + '><option value="">Select county</option>' + COUNTIES.map(c => '<option' + (c === S.f.county ? ' selected' : '') + '>' + esc(c) + '</option>').join('') + '</select><div class="co-note" id="co-fee">' + esc(feeText()) + '</div>') +
    fld('addr', 'Town / area and street', '<input id="co-addr" data-f="addr" type="text" autocomplete="street-address" placeholder="e.g. Nairobi CBD, Tom Mboya Street" value="' + v('addr') + '"' + bad('addr') + '>') +
    fld('notes', 'Notes (optional)', '<textarea id="co-notes" data-f="notes" rows="2" placeholder="Anything we should know?">' + v('notes') + '</textarea>');
  f.innerHTML = line('Subtotal (' + items.reduce((n, i) => n + i.qty, 0) + ' items)', money(sub())) + '<button class="co-btn" data-act="review">Review order</button>';
}
function rReview(b, f, items) {
  const F = S.f, amt = due(); if (!S.payTouched) S.payAmt = String(amt);
  const man = '<details class="co-box co-man"' + (S.manOpen || S.err ? ' open' : '') + '><summary>Paid manually instead? Enter your M-Pesa code</summary>' +
    '<p class="co-note">Step 1: pay with M-Pesa Paybill using the details below. Step 2: enter the code from your M-Pesa SMS. Your order is only placed after you enter it.</p>' +
    '<div class="co-ln"><span>Business number</span><span><b>' + CFG.paybill + '</b><button class="co-cp" data-act="copyv" data-v="' + CFG.paybill + '">Copy</button></span></div>' +
    '<div class="co-ln"><span>Account number</span><span><b>' + CFG.payAcct + '</b><button class="co-cp" data-act="copyv" data-v="' + CFG.payAcct + '">Copy</button></span></div>' +
    line('Amount', money(amt)) +
    '<p class="co-note">Open M-Pesa, then Lipa na M-Pesa, then Pay Bill. Enter the numbers above, the amount and your PIN.</p>' +
    '<div class="co-f"><label for="co-code">M-Pesa transaction code</label><input id="co-code" type="text" maxlength="14" autocomplete="off" spellcheck="false" autocapitalize="characters" placeholder="e.g. SGH7A1B2C3" style="text-transform:uppercase;letter-spacing:.08em;font-weight:700" value="' + esc(S.payCode) + '"><div class="co-e" id="e-code"></div></div>' +
    '<div class="co-f"><label for="co-amt">Amount you paid (KSh)</label><input id="co-amt" type="number" inputmode="numeric" min="1" value="' + esc(S.payAmt) + '"><div class="co-e" id="e-amt"></div></div>' +
    '<button class="co-btn" id="co-place" data-act="place"' + (S.sending ? ' disabled' : '') + '>' + (S.sending ? 'Placing your order...' : 'I have paid, place order') + '</button></details>';
  b.innerHTML = box('Items', items.map(i => [i.qty + ' \u00d7 ' + esc(i.name), money(i.total)]), ['editcart', 'Edit cart']) +
    box('Delivery', [[esc(where(F))]], ['editdetails', 'Edit']) +
    box('Contact', [[esc(F.name.trim())], ['+' + normPhone(F.phone)], [esc(F.email.trim())]], ['editdetails', 'Edit']) +
    '<div class="co-box"><h4>Pay with an M-Pesa prompt (fastest)</h4><div class="co-f"><label for="co-stkphone">M-Pesa phone number</label><input id="co-stkphone" type="tel" inputmode="tel" placeholder="07XX XXX XXX" value="' + esc(S.stkPhone || F.phone) + '"' + (S.stkBusy ? ' disabled' : '') + '></div>' +
    (S.stkMsg ? '<p class="co-note" id="co-stkmsg">' + esc(S.stkMsg) + '</p>' : '') +
    '<button class="co-btn" id="co-stk" data-act="stk"' + (busy() ? ' disabled' : '') + '>' + (S.stkBusy ? 'Waiting for payment...' : 'Pay ' + money(amt) + ' with M-Pesa') + '</button></div>' + man;
  f.innerHTML = (fee() ? line('Items total', money(sub())) + line('Delivery to ' + esc(F.county), money(fee())) : '') +
    '<div class="co-tot"><span>Total to pay</span><span>' + money(amt) + '</span></div>' +
    (FEES[F.county] ? '' : '<p class="co-note">The delivery fee to your county is confirmed on WhatsApp and paid separately.</p>') +
    (S.err ? '<div class="co-err" id="co-err">' + esc(S.err) + '</div><button class="co-btn alt" data-act="wa">Send on WhatsApp instead</button>' : '');
  syncPay();
}
function rDone(b, f) {
  const d = S.done;
  b.innerHTML = '<div class="co-done"><div class="co-ic">\u2713</div><h3 style="margin:0 0 4px">Order received</h3><p class="co-note">Reference ' + esc(d.ref) + '</p><p>Thank you! We have your M-Pesa code. We will verify the payment and contact you on WhatsApp to confirm your order and delivery.</p></div>' +
    box('Payment submitted', [['M-Pesa code', esc(d.code)], ['Amount', money(d.paid)]]);
  f.innerHTML = '<a class="co-btn" href="' + esc(d.url) + '" target="_blank" rel="noopener">Message us on WhatsApp</a><button class="co-btn alt" data-act="copy">Copy order details</button><button class="co-btn alt" data-act="finish">Close</button>';
}
function syncPay() {   /* enable "place order" only for a valid code + enough money; no re-render, so typing keeps its focus */
  const pb = $('#co-place'); if (!pb) return;
  const ce = $('#e-code'), ae = $('#e-amt');
  if (ce) ce.textContent = S.payCode && !codeOk() ? 'Enter the code exactly as in the SMS (8 to 12 letters and numbers).' : '';
  if (ae) ae.textContent = S.payAmt && !amtOk() ? 'The amount must be at least ' + money(due()) + '.' : '';
  pb.disabled = S.sending || !(codeOk() && amtOk());
}

/* ---------- events ---------- */
function onInput(e) {
  const t = e.target, k = t.dataset && t.dataset.f;
  if (k) { S.f[k] = t.value; t.removeAttribute('aria-invalid'); const er = $('#e-' + k); if (er) er.textContent = ''; if (k === 'county') $('#co-fee').textContent = feeText(); return; }
  if (t.id === 'co-stkphone') S.stkPhone = t.value;
  else if (t.id === 'co-code') { S.payCode = t.value; S.err = ''; syncPay(); }
  else if (t.id === 'co-amt') { S.payAmt = t.value; S.payTouched = true; syncPay(); }
}
function validate() {
  const f = S.f, E = {};
  if (!f.name || f.name.trim().length < 2) E.name = 'Enter your full name.';
  if (!normPhone(f.phone)) E.phone = 'Enter a valid Kenyan number, e.g. 0712 345 678.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((f.email || '').trim())) E.email = 'Enter a valid email so we can send your receipt.';
  if (!f.county) E.county = 'Choose your county.';
  if (!f.addr || f.addr.trim().length < 3) E.addr = 'Enter your town / area and street.';
  S.errs = E; return Object.keys(E);
}
const copy = t => { try { navigator.clipboard.writeText(t).then(() => toast('Copied')); } catch {} };
const toast = m => { const t = $('#toast'); if (!t) return; t.textContent = m; t.style.opacity = 1; clearTimeout(toast.t); toast.t = setTimeout(() => { t.style.opacity = 0; }, 1600); };
function onClick(e) {
  const a = e.target.closest('[data-act]'); if (!a || a.disabled) return;
  switch (a.dataset.act) {
    case 'close': return close();
    case 'back': case 'editdetails': S.step = 'details'; S.err = ''; return render();
    case 'editcart': return close();
    case 'review': { const k = validate(); if (k.length) { render(); const el = $('#co-' + k[0]); if (el) el.focus(); return; } if (!S.ref) S.ref = newRef(); S.step = 'review'; S.err = ''; render(); const bd = $('#co-b'); if (bd) bd.scrollTop = 0; return; }
    case 'stk': return stkPay();
    case 'place': return place();
    case 'copyv': return copy(a.dataset.v);
    case 'copy': return copy(S.done.msg);
    case 'wa': return window.open(waUrl(snapNow()), '_blank', 'noopener');
    case 'finish': return finish();
  }
}

/* ---------- M-Pesa prompt ---------- */
async function stkFn(name, body) {
  const r = await fetch(CFG.sbUrl + '/functions/v1/' + name, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: CFG.sbKey }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Error ' + r.status);
  return j;
}
async function stkPoll(id) {
  for (let k = 0; k <= 50; k++) {
    await sleep(3000);
    let j; try { j = await stkFn('stk-status', { checkoutRequestId: id }); } catch { continue; }   /* a failed poll is retried */
    if (j.status === 'success') return { receipt: j.receipt, amount: j.amount };
    if (j.status !== 'pending') throw new Error(j.message || 'The payment was not completed. You can try again.');
  }
  throw new Error('We did not get your M-Pesa confirmation. If you were charged, message us on WhatsApp with the SMS.');
}
async function stkPay() {
  if (busy()) return;
  const phone = normPhone(S.stkPhone || S.f.phone), amt = due();
  if (!phone) { S.stkMsg = 'Enter the M-Pesa phone number as 07XX XXX XXX.'; return render(); }
  if (!S.ref) S.ref = newRef();
  S.stkBusy = true; S.stkMsg = 'Sending the M-Pesa prompt to your phone...'; render();
  try {
    const j = await stkFn('stk-push', { phone, amount: amt, ref: S.ref });
    S.stkMsg = 'Check your phone and enter your M-Pesa PIN to pay ' + money(amt) + '.'; render();
    const p = await stkPoll(j.checkoutRequestId);
    S.stkBusy = false; S.stkMsg = ''; S.payCode = p.receipt; S.payAmt = String(p.amount || amt); S.payTouched = true; place();
  } catch (err) { S.stkBusy = false; S.stkMsg = (err && err.message) || 'Payment failed. Try again.'; render(); }
}

/* ---------- placing the order ---------- */
function waMsg(o) {
  const L = ['Hello Stermont Arcade, I would like to place an order.', '', '*Order ' + o.ref + '*'];
  o.items.forEach((i, k) => L.push((k + 1) + '. ' + i.name + ' x' + i.qty + ' = ' + money(i.total)));
  L.push('', '*Subtotal:* ' + money(o.sub));
  if (o.fee) L.push('*Delivery fee:* ' + money(o.fee), '*Total to pay:* ' + money(o.due));
  L.push('*Delivery:* Deliver to ' + where(o.f) + (o.fee ? '' : ' (fee to be confirmed)'), '', '*Name:* ' + o.f.name.trim(), '*Phone:* +' + normPhone(o.f.phone));
  if (o.f.notes && o.f.notes.trim()) L.push('*Notes:* ' + o.f.notes.trim());
  L.push('*Payment:* M-Pesa Paybill ' + CFG.paybill + ', account ' + CFG.payAcct);
  if (o.code) L.push('*M-Pesa code:* ' + o.code + ' (paid KSh ' + o.paid + ')');
  L.push('', 'Please confirm availability and the delivery fee. Thank you!');
  return L.join('\n');
}
const waUrl = o => 'https://wa.me/' + CFG.wa + '?text=' + encodeURIComponent(waMsg(o));
async function place() {
  if (S.sending) return;
  const o = snapNow();
  if (!o.items.length) return;
  if (!/^[A-Z0-9]{8,12}$/.test(o.code) || !(o.paid >= o.due)) { S.err = 'Enter your M-Pesa code and the amount you paid before placing the order.'; return render(); }
  S.sending = true; S.err = ''; render();
  const s = session(), email = (o.f.email || '').trim().toLowerCase();
  const row = {
    ref: o.ref, user_id: s ? s.user.id : null, customer_name: o.f.name.trim().slice(0, 120), phone: '+' + normPhone(o.f.phone),
    email: email.slice(0, 150) || (s && s.user.email) || null, method: 'delivery', county: o.f.county, address: o.f.addr.trim().slice(0, 200),
    notes: o.f.notes && o.f.notes.trim() ? o.f.notes.trim().slice(0, 500) : null,
    items: o.items.map(i => ({ name: i.name, qty: i.qty, price: i.price, total: i.total })).concat(o.fee ? [{ name: 'Delivery fee (' + o.f.county + ')', qty: 1, price: o.fee, total: o.fee }] : []),
    subtotal: o.due, pay_code: o.code, pay_amount: o.paid, voucher_code: null, discount: 0
  };
  const hd = { 'Content-Type': 'application/json', apikey: CFG.sbKey, Prefer: 'return=minimal' };
  if (s) hd.Authorization = 'Bearer ' + s.access_token;
  const ctl = window.AbortController ? new AbortController() : null, to = setTimeout(() => { if (ctl) ctl.abort(); }, 20000);
  const post = async rw => {
    const r = await fetch(CFG.sbUrl + '/rest/v1/orders', { method: 'POST', headers: hd, body: JSON.stringify(rw), signal: ctl ? ctl.signal : undefined });
    if (!r.ok) { const t = await r.text(); const e = new Error('status ' + r.status + ' ' + t); e.status = r.status; e.body = t; throw e; }
  };
  try {
    try { await post(row); }
    catch (err) {   /* payment columns not set up yet: keep the code in the order notes instead (same fallback as the main site) */
      if (err && err.status === 400 && /pay_code|pay_amount/.test(err.body || '')) {
        const r2 = { ...row }; delete r2.pay_code; delete r2.pay_amount;
        r2.notes = ('M-Pesa code ' + o.code + ', paid KSh ' + o.paid + (row.notes ? ' | ' + row.notes : '')).slice(0, 500); await post(r2);
      } else throw err;
    }
    clearTimeout(to);
    notify(o, s);
    lsSet('shell.cust', { uid: myUid(), name: o.f.name.trim(), phone: o.f.phone, email: email, county: o.f.county, addr: o.f.addr });
    lsSet('shell.cart', []);   /* the order is saved: empty the cart (app.js picks this up when the page reloads on Close) */
    S.done = { ref: o.ref, code: o.code, paid: o.paid, msg: waMsg(o), url: waUrl(o) };
    S.sending = false; S.err = ''; S.ref = ''; S.payCode = ''; S.payAmt = ''; S.payTouched = false; S.manOpen = false; S.f.notes = ''; S.step = 'done'; render();
  } catch (err) {
    clearTimeout(to); S.sending = false;
    try { console.error('Order failed:', err && err.message); } catch {}
    S.err = err && err.status === 409 ? 'This M-Pesa code has already been used on another order. Check the code in your SMS, or message us on WhatsApp.'
      : 'We could not place your order. Check your connection and try again, or send it on WhatsApp instead.' + (err && err.status ? ' (Error ' + err.status + ')' : ' (Network)');
    render();
  }
}

/* ---------- staff + customer e-mails (same services and templates as the main site, shorter layout) ---------- */
function ejs(tpl, params) {
  if (!CFG.ejsKey || !tpl) return Promise.resolve(false);
  return fetch('https://api.emailjs.com/api/v1.0/email/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ service_id: CFG.ejsService, template_id: tpl, user_id: CFG.ejsKey, template_params: params }) })
    .then(r => r.ok ? true : r.text().then(t => { console.warn('EmailJS failed:', r.status, t); return false; })).catch(err => { console.warn('EmailJS error:', err && err.message); return false; });
}
function notify(o, s) {
  try {
    const adm = new URL('../admin.html', location.href).href, enc = encodeURIComponent(o.ref), phone = normPhone(o.f.phone);
    const cust = ((o.f.email || '').trim() || (s && s.user && s.user.email) || '').toLowerCase();
    const lines = o.items.map((i, k) => (k + 1) + '. ' + i.name + ' x' + i.qty + ' = ' + money(i.total)); if (o.fee) lines.push('Delivery to ' + o.f.county + ' = ' + money(o.fee));
    const text = ['Order ' + o.ref, '', lines.join('\n'), '', 'TOTAL ' + money(o.due), 'Deliver to: ' + where(o.f), '', 'Customer: ' + o.f.name.trim(), 'Phone: +' + phone, cust ? 'Email: ' + cust : '',
      o.f.notes && o.f.notes.trim() ? 'Notes: ' + o.f.notes.trim() : '', '', 'Payment: M-Pesa Paybill ' + CFG.paybill + ', account ' + CFG.payAcct, 'M-Pesa CODE entered by customer: ' + o.code + ' (says paid KSh ' + o.paid + ')',
      'WhatsApp the customer: https://wa.me/' + phone, '', 'STATUS: PENDING VERIFICATION. Check the M-Pesa SMS for the code above, then (customer care sign-in required):',
      'APPROVE (paid): ' + adm + '?ref=' + enc + '&action=approve', 'DECLINE (not paid): ' + adm + '?ref=' + enc + '&action=decline'].filter((l, i, a) => l !== '' || a[i - 1] !== '').join('\n');
    const FF = 'font-family:Arial,Helvetica,sans-serif;';
    const rows = o.items.map(i => '<tr><td style="padding:8px 0;border-bottom:1px solid #eee7fb">' + esc(i.name) + ' <span style="color:#6b7280">x' + i.qty + '</span></td><td align="right" style="padding:8px 0;border-bottom:1px solid #eee7fb;white-space:nowrap"><b>' + esc(money(i.total)) + '</b></td></tr>').join('') +
      (o.fee ? '<tr><td style="padding:8px 0;border-bottom:1px solid #eee7fb">Delivery to ' + esc(o.f.county) + '</td><td align="right" style="padding:8px 0;border-bottom:1px solid #eee7fb"><b>' + esc(money(o.fee)) + '</b></td></tr>' : '');
    const card = (title, intro, extra) => '<div style="background:#efe7ff;padding:20px 10px;' + FF + '"><div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden"><div style="background:#5b21b6;color:#fff;padding:22px;text-align:center"><div style="font-size:12px;letter-spacing:.15em;text-transform:uppercase;color:#e9ddff">Stermont Arcade</div><div style="font-size:24px;font-weight:800;padding-top:8px">' + title + '</div><div style="color:#c8f31d;padding-top:6px">Order ' + esc(o.ref) + ' &middot; pending verification</div></div><div style="padding:20px;color:#1b1230;font-size:14px;line-height:1.5">' + intro +
      '<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px">' + rows + '<tr><td style="padding-top:12px"><b>Total</b></td><td align="right" style="padding-top:12px;font-size:20px;color:#5b21b6"><b>' + esc(money(o.due)) + '</b></td></tr></table>' + extra + '</div></div></div>';
    const btn = (href, label, bg, fg) => '<a href="' + href + '" style="display:inline-block;background:' + bg + ';color:' + fg + ';font-weight:bold;font-size:15px;text-decoration:none;padding:13px 20px;border-radius:12px;margin:4px">' + label + '</a>';
    const staffHtml = card('New order!', '<p style="margin:0"><b>' + esc(o.f.name.trim()) + '</b> &middot; +' + phone + (cust ? ' &middot; ' + esc(cust) : '') + '<br>Deliver to: ' + esc(where(o.f)) + (o.f.notes && o.f.notes.trim() ? '<br>Notes: ' + esc(o.f.notes.trim()) : '') + '</p>',
      '<p style="background:#2a0e5c;color:#fff;border-radius:12px;padding:14px;margin:16px 0 0">M-Pesa code entered: <b style="font-family:Courier New,monospace;font-size:20px;letter-spacing:.1em;color:#c8f31d">' + esc(o.code) + '</b><br><span style="font-size:12px;color:#cdbdf3">Customer says paid ' + esc(money(o.paid)) + (o.paid === o.due ? ' (matches)' : ' (CHECK AMOUNT)') + '</span></p>' +
      '<p style="font-size:13px;color:#6b4a00;background:#fff8e6;border-radius:12px;padding:10px 14px">Before you approve: open your M-Pesa SMS and confirm the code and amount are real.</p><p style="text-align:center">' +
      btn(adm + '?ref=' + enc + '&action=approve', 'Approve (paid)', '#c8f31d', '#2a0e5c') + btn(adm + '?ref=' + enc + '&action=decline', 'Decline', '#d92d20', '#ffffff') + btn('https://wa.me/' + phone, 'WhatsApp customer', '#7c3aed', '#ffffff') + '</p>');
    const custHtml = card('We received your order', '<p style="margin:0">Hi ' + esc(o.f.name.trim()) + ', thank you for shopping with us. We have your M-Pesa code <b>' + esc(o.code) + '</b> (' + esc(money(o.paid)) + ') and are verifying the payment. We will contact you on WhatsApp to confirm your order and delivery. Your order is confirmed only after the payment is verified.</p>',
      '<p style="text-align:center;margin-bottom:0">' + btn('https://wa.me/' + CFG.wa, 'Message us on WhatsApp', '#7c3aed', '#ffffff') + '</p><p style="font-size:12px;color:#6b7280;text-align:center">Questions? Call +254 748 888 230 &middot; stermontarcade.co.ke</p>');
    const base = { order_ref: o.ref, order_total: money(o.due), order_items: lines.join('\n'), customer_name: o.f.name.trim(), customer_phone: '+' + phone, delivery: 'Deliver to: ' + where(o.f), mpesa_code: o.code, order_message: text, business: 'Stermont Arcade', phone: '+254 748 888 230', web: 'stermontarcade.co.ke' };
    if (cust) ejs(CFG.ejsCustTpl, { ...base, to_email: cust, subject: 'We received your order ' + o.ref, name: o.f.name.trim(), headline: 'We received your order', message: 'We have your M-Pesa code ' + o.code + ' and are verifying the payment.', items: lines.join('\n'), total: money(o.due), html_body: custHtml });
    const staff = { ...base, to_email: CFG.staffEmail, reply_to: cust || CFG.staffEmail, subject: 'New order ' + money(o.due) + ' - ' + o.f.name.trim() + ' (' + o.ref + ')', name: 'Stermont team', headline: 'New order to verify', message: text, items: lines.join('\n'), total: money(o.due), html_body: staffHtml };
    ejs(CFG.ejsCustTpl, staff).then(ok => ok || ejs(CFG.ejsStaffTpl, staff)).then(ok => {
      if (ok || !CFG.mailKey) return;   /* last resort: plain-text alert */
      fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ access_key: CFG.mailKey, subject: 'New order ' + o.ref + ' - ' + money(o.due), from_name: 'Stermont Arcade website', message: text }) }).catch(() => {});
    });
  } catch (err) { console.warn('notify failed:', err && err.message); }
}

/* ---------- open / close (tied to the browser Back button like the shell's other sheets) ---------- */
const HIDE = ['#views', '#appbar', '#bottom-nav'];
function openCheckout() {
  if (!cartItems().length || isOpen) return;
  ensure(); S.step = 'details'; S.errs = {}; S.err = ''; S.stkMsg = '';
  isOpen = true; ov.hidden = false; document.body.style.overflow = 'hidden';
  HIDE.forEach(s => { const el = $(s); if (el) el.inert = true; });
  history.pushState({ tab: (history.state && history.state.tab) || 'cart', stack: [], co: 1 }, '');
  render(); const first = $('#co-name'); if (first) first.focus({ preventScroll: true });
}
function closeCheckout(fromPop) {
  if (!isOpen) return;
  if (S.step === 'done') return finish();
  isOpen = false; ov.hidden = true; document.body.style.overflow = '';
  HIDE.forEach(s => { const el = $(s); if (el) el.inert = false; });
  if (fromPop !== true && history.state && history.state.co) history.back();
}
function finish() { lsSet('shell.cart', []); location.reload(); }   /* after an order: reload so the shell starts with an empty cart */
function close() { if (!busy()) closeCheckout(); }
window.addEventListener('popstate', () => {
  if (!isOpen) return;
  if (busy()) { history.pushState({ tab: 'cart', stack: [], co: 1 }, ''); return; }   /* a payment is in progress: Back must not close the sheet */
  closeCheckout(true);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) close(); });
/* capture phase: runs before app.js's own handler on the button (which only showed a prototype toast) */
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#checkout')) { e.preventDefault(); e.stopPropagation(); openCheckout(); } }, true);
})();
