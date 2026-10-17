/* Stermont Arcade · live chat for logged-in customers.
   Add at the end of index.html, AFTER account-panel.js:  <script src="chat.js?v=1" defer></script>
   Uses the public.chat_messages table (run setup-chat.sql once). One conversation per customer, back and forth.
   Customers only ever see their own messages (row security). Staff reply from admin > Customers > Live chat.
   The screen refreshes every few seconds while the chat is open. All text is set with textContent. */
(function () {
  var D = document, REF = 'oewvtbnmyombbtggamor', SBU = 'https://' + REF + '.supabase.co',
      KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7', SK = 'sb-' + REF + '-auth-token', SEEN = 'stm_chat_seen';
  var rows = [], isOpen = false, timer = null, sending = false, loadedOnce = false;
  var B, P, L, T, S, X, DOT, ERR;

  function el(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function get(k) { try { return JSON.parse(localStorage.getItem(k)) || null; } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function sess() { var x = get(SK); return x && x.user && x.access_token && (!x.expires_at || x.expires_at * 1000 > Date.now()) ? x : null; }
  function hm(d) { d = new Date(d); if (isNaN(d)) return ''; var p = function (n) { return (n < 10 ? '0' : '') + n; }; return p(d.getDate()) + '-' + p(d.getMonth() + 1) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); }
  function nameOf(s) {
    var u = s.user || {}, m = u.user_metadata || {}, n = String(m.full_name || m.name || '').trim();
    if (!n && u.email) n = String(u.email).split('@')[0];
    n = n.slice(0, 80); return n.length >= 2 ? n : 'Customer';
  }
  function api(path, opt) {
    var s = sess(); if (!s) return Promise.reject(new Error('login'));
    opt = opt || {};
    var hd = { apikey: KEY, Authorization: 'Bearer ' + s.access_token, 'Content-Type': 'application/json' };
    if (opt.prefer) hd.Prefer = opt.prefer;
    return fetch(SBU + path, { method: opt.method || 'GET', headers: hd, body: opt.body ? JSON.stringify(opt.body) : undefined });
  }

  /* ---------- styles ---------- */
  var st = el('style'); st.textContent =
    '.stc-b{position:fixed;right:1rem;bottom:calc(150px + env(safe-area-inset-bottom,0px));z-index:45;width:54px;height:54px;border-radius:50%;border:0;cursor:pointer;color:#fff;background:linear-gradient(135deg,#f68b1e,#d96a00);box-shadow:0 8px 22px rgba(0,0,0,.3);display:grid;place-items:center;font-size:1.5rem}' +
    '.stc-b i{position:absolute;top:2px;right:2px;width:14px;height:14px;border-radius:50%;background:#d92d20;border:2px solid #fff;display:none}' +
    '.stc-p{position:fixed;right:0;bottom:0;z-index:66;width:min(420px,100%);height:min(78vh,600px);display:none;flex-direction:column;background:var(--paper,#fff);color:var(--ink,#1b1230);border-radius:16px 16px 0 0;box-shadow:0 -8px 30px rgba(0,0,0,.35);overflow:hidden}' +
    '.stc-p.on{display:flex}@media(min-width:600px){.stc-p{right:1rem;bottom:1rem;border-radius:16px}}' +
    '.stc-h{display:flex;align-items:center;justify-content:space-between;padding:.85rem 1rem;background:linear-gradient(135deg,#f68b1e,#d96a00);color:#fff}' +
    '.stc-h b{font-size:1rem}.stc-h small{display:block;opacity:.9;font-size:.78rem}.stc-h button{border:0;background:none;color:#fff;font-size:1.7rem;line-height:1;cursor:pointer}' +
    '.stc-l{flex:1;overflow-y:auto;padding:.8rem;background:var(--panel,#f4f1fa);display:flex;flex-direction:column;gap:.45rem}' +
    '.stc-m{max-width:82%;padding:.55rem .75rem;border-radius:14px;font-size:.93rem;line-height:1.35;white-space:pre-wrap;word-wrap:break-word}' +
    '.stc-m small{display:block;margin-top:.2rem;font-size:.7rem;opacity:.7}' +
    '.stc-m.me{align-self:flex-end;background:#f68b1e;color:#fff;border-bottom-right-radius:4px}' +
    '.stc-m.us{align-self:flex-start;background:var(--paper,#fff);border:1px solid var(--line,#e5e0f0);border-bottom-left-radius:4px}' +
    '.stc-e{margin:auto;text-align:center;color:var(--muted,#6b6b6b);padding:1rem;font-size:.92rem}' +
    '.stc-e a{display:inline-block;margin-top:.7rem;padding:.7rem 1.2rem;border-radius:10px;background:#f68b1e;color:#fff;font-weight:800;text-decoration:none}' +
    '.stc-er{padding:.4rem .9rem;color:#d92d20;font-size:.82rem;background:var(--paper,#fff)}' +
    '.stc-f{display:flex;gap:.5rem;padding:.6rem;border-top:1px solid var(--line,#e5e0f0);background:var(--paper,#fff)}' +
    '.stc-f textarea{flex:1;resize:none;font:inherit;font-size:16px;border:2px solid transparent;background:var(--panel,#f4f1fa);color:inherit;border-radius:12px;padding:.6rem .75rem;max-height:90px}' +
    '.stc-f textarea:focus{outline:0;border-color:#f68b1e}.stc-f button{border:0;border-radius:12px;padding:0 1rem;font:inherit;font-weight:800;color:#fff;background:#f68b1e;cursor:pointer}.stc-f button:disabled{opacity:.55}';
  D.head.appendChild(st);

  /* ---------- data ---------- */
  function lastReplyAt() { var m = 0; rows.forEach(function (r) { if (r.sender === 'staff') { var t = Date.parse(r.created_at); if (t > m) m = t; } }); return m; }
  function refreshDot() { var seen = get(SEEN) || 0; DOT.style.display = (!isOpen && lastReplyAt() > seen) ? 'block' : 'none'; }
  function load() {
    if (!sess()) { rows = []; loadedOnce = true; draw(); return Promise.resolve(); }
    return api('/rest/v1/chat_messages?select=id,sender,body,created_at&order=created_at.asc&limit=300')
      .then(function (r) { if (r.status === 401) throw new Error('login'); if (!r.ok) throw new Error('load'); return r.json(); })
      .then(function (j) { rows = Array.isArray(j) ? j : []; loadedOnce = true; ERR.textContent = ''; ERR.style.display = 'none'; if (isOpen) { put(SEEN, lastReplyAt() || Date.now()); } draw(); refreshDot(); })
      .catch(function (e) { loadedOnce = true; if (e && e.message === 'login') { rows = []; draw(); } else { ERR.textContent = 'Could not refresh. Check your connection.'; ERR.style.display = 'block'; } });
  }

  /* ---------- UI ---------- */
  function draw() {
    var near = L.scrollHeight - L.scrollTop - L.clientHeight < 80, first = !L.childNodes.length;
    L.textContent = '';
    if (!sess()) {
      var e = el('div', 'stc-e', 'Log in to chat with the Stermont Arcade team.'); var a = el('a', null, 'Log in or create account'); a.href = 'account.html'; e.appendChild(a); L.appendChild(e);
      T.disabled = S.disabled = true; return;
    }
    T.disabled = S.disabled = sending;
    if (!loadedOnce) { L.appendChild(el('div', 'stc-e', 'Loading…')); return; }
    if (!rows.length) { L.appendChild(el('div', 'stc-e', 'Hi 👋 Ask us anything about a product, your order or delivery. We reply here.')); return; }
    rows.forEach(function (m) {
      var mine = m.sender !== 'staff', b = el('div', 'stc-m ' + (mine ? 'me' : 'us'), m.body);
      b.appendChild(el('small', null, (mine ? '' : 'Stermont Arcade · ') + hm(m.created_at))); L.appendChild(b);
    });
    if (near || first) L.scrollTop = L.scrollHeight;
  }
  function poll() { clearTimeout(timer); timer = setTimeout(function () { if (!D.hidden) load(); poll(); }, isOpen ? 5000 : 45000); }
  function open() { isOpen = true; P.classList.add('on'); B.style.display = 'none'; put(SEEN, lastReplyAt() || Date.now()); DOT.style.display = 'none'; load().then(function () { L.scrollTop = L.scrollHeight; }); poll(); try { if (sess()) T.focus(); } catch (e) {} }
  function shut() { isOpen = false; P.classList.remove('on'); B.style.display = ''; poll(); }
  function send() {
    var s = sess(), t = T.value.trim();
    if (!s) { draw(); return; }
    if (t.length < 2) { ERR.textContent = 'Type at least 2 characters.'; ERR.style.display = 'block'; return; }
    sending = true; S.disabled = true; ERR.style.display = 'none';
    api('/rest/v1/chat_messages', { method: 'POST', prefer: 'return=minimal', body: { user_id: s.user.id, sender: 'customer', name: nameOf(s), body: t.slice(0, 1000) } })
      .then(function (r) {
        if (r.status === 401) throw new Error('Your session expired. Please log in again.');
        if (!r.ok) return r.text().then(function (x) { var m = ''; try { m = JSON.parse(x).message; } catch (e) {} throw new Error(m || 'Could not send. Try again.'); });
        T.value = ''; T.style.height = ''; return load().then(function () { L.scrollTop = L.scrollHeight; });
      })
      .catch(function (e) { ERR.textContent = e.message || 'Could not send. Try again.'; ERR.style.display = 'block'; })
      .then(function () { sending = false; S.disabled = !sess(); });
  }
  function build() {
    B = el('button', 'stc-b', '💬'); B.type = 'button'; B.setAttribute('aria-label', 'Chat with us'); DOT = el('i'); B.appendChild(DOT); B.addEventListener('click', open);
    P = el('div', 'stc-p'); P.setAttribute('role', 'dialog'); P.setAttribute('aria-label', 'Chat with Stermont Arcade');
    var h = el('div', 'stc-h'), w = el('div'); w.appendChild(el('b', null, 'Chat with us')); w.appendChild(el('small', null, 'Stermont Arcade · we reply here')); h.appendChild(w);
    X = el('button', null, '×'); X.type = 'button'; X.setAttribute('aria-label', 'Close chat'); X.addEventListener('click', shut); h.appendChild(X);
    L = el('div', 'stc-l'); ERR = el('div', 'stc-er'); ERR.style.display = 'none';
    var f = el('form', 'stc-f'); T = el('textarea'); T.rows = 1; T.maxLength = 1000; T.placeholder = 'Type your message'; S = el('button', null, 'Send'); S.type = 'submit';
    T.addEventListener('input', function () { T.style.height = 'auto'; T.style.height = Math.min(T.scrollHeight, 90) + 'px'; });
    T.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
    f.addEventListener('submit', function (e) { e.preventDefault(); send(); });
    f.appendChild(T); f.appendChild(S);
    P.appendChild(h); P.appendChild(L); P.appendChild(ERR); P.appendChild(f);
    D.body.appendChild(B); D.body.appendChild(P);
    D.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen) shut(); });
    draw(); if (sess()) load(); poll();
  }
  if (D.body) build(); else D.addEventListener('DOMContentLoaded', build);
})();
