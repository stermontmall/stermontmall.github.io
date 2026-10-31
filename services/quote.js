/* Stermont Arcade: service QUOTE request drawer. NO payment. Mirrors how product orders notify (checkout-deferred.js):
   1) insert a row in public.service_quotes (publishable key, RLS lets anyone INSERT only),
   2) EmailJS alert to info@stermontarcade.co.ke (template_n60yao4, then template_cv2qjgm, then Web3Forms) + confirmation to the customer.
   Loaded by /services/page.js and /services/hub.js. It takes over "Book" and "Get a quote" buttons in the capture phase and
   only cancels the old WhatsApp / booking sheet when the drawer really opened, so a failure here leaves the old buttons working.
   Public API: STMQuote.open({ id, name }). To undo: remove the loader line from page.js and hub.js. */
(function () {
  'use strict';
  if (window.STMQuote) return;
  var D = document;
  var C = { sb: 'https://oewvtbnmyombbtggamor.supabase.co', key: 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7', ref: 'oewvtbnmyombbtggamor',
    ejsKey: 'PayiXKhM6gVQLHYAE', ejsService: 'service_zoho', tpl: 'template_n60yao4', tpl2: 'template_cv2qjgm', staff: 'info@stermontarcade.co.ke',
    web3: '2c55cbd0-5ec1-4603-a6a0-293b8a68faab', wa: '254748888230', site: 'https://stermontarcade.co.ke' };
  var COUNTIES = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Uasin Gishu', 'Kiambu', 'Machakos', 'Kajiado', 'Nyeri', 'Meru', 'Kisii', 'Kakamega', 'Kilifi', 'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kericho', 'Kirinyaga', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Makueni', 'Mandera', 'Marsabit', 'Migori', "Murang'a", 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Vihiga', 'Wajir', 'West Pokot'];
  /* ids of the hub items (services/app.js) are kept so data-book="<id>" preselects the right service */
  var GROUPS = [
    ['Pest control and fumigation', [['bed-bugs', 'Bed bug eradication'], ['cockroaches', 'Cockroach control'], ['termites', 'Termite treatment (before or after building)'], ['rodents', 'Rat and mouse control'], ['ants', 'Ant control'], ['fleas-ticks', 'Flea and tick control'], ['mosquitoes-flies', 'Mosquito and fly control'], ['bees-wasps', 'Bee, wasp and hornet removal'], ['spiders-scorpions', 'Spider, scorpion and centipede control'], ['fabric-pests', 'Silverfish, moth and carpet beetle control'], ['lice-mites', 'Lice and mite control'], ['stored-grain', 'Stored-grain pests (weevils, grain borer)'], ['snakes', 'Snake exclusion advice'], ['bats-birds', 'Bat and bird proofing'], ['fumigation', 'Full-premises fumigation'], ['pest-inspection', 'Not sure what pest it is: inspection']]],
    ['Cleaning and facility care', [['upholstery', 'Sofa, carpet and mattress disinfection'], ['move-in-out', 'Move-in and move-out deep cleaning'], ['post-construction', 'Post-construction cleaning'], ['airbnb', 'Airbnb and apartment turnover'], ['office-janitorial', 'Office janitorial services']]],
    ['Security, power and smart home', [['cctv', 'CCTV camera and DVR installation'], ['4g-antenna', '4G and 5G router and antenna setup'], ['electric-fence', 'Electric fence and solar perimeter lighting'], ['inverter', 'Inverter and backup power'], ['solar', 'Solar system installation'], ['tv-mounting', 'TV mounting and audio-visual setup']]],
    ['Repairs and farming', [['plumbing', 'Plumbing and drainage'], ['electrical', 'Electrical repairs and wiring'], ['appliance-repair', 'Home appliance repair'], ['agrovet', 'Agrovet spraying and crop consultancy'], ['other', 'Something else (describe below)']]]
  ];
  var PROPS = ['Home or apartment', 'Office or shop', 'Restaurant, hotel or Airbnb', 'School, hospital or institution', 'Farm or agribusiness', 'Warehouse, factory or construction site', 'Other'];
  var SLOTS = ['Morning', 'Afternoon', 'Evening', 'Any time'];
  var ALL = [];
  GROUPS.forEach(function (g) { g[1].forEach(function (x) { ALL.push(x); }); });

  function hx(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function el(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function slug(t) { return String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'other'; }
  function normPhone(p) { var d = String(p || '').replace(/[\s\-().]/g, ''), m = d.match(/^(?:\+?254|0)([17]\d{8})$/); return m ? '254' + m[1] : null; }
  function session() { try { var x = JSON.parse(localStorage.getItem('sb-' + C.ref + '-auth-token')); if (x && x.access_token && x.user && (!x.expires_at || x.expires_at * 1000 > Date.now() + 30000)) return x; } catch (e) {} return null; }
  function ls(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} return null; }
  function newRef() {
    var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', out = '', i, b = new Uint8Array(6);
    try { (window.crypto || window.msCrypto).getRandomValues(b); } catch (e) { for (i = 0; i < 6; i++) b[i] = Math.floor(Math.random() * 256); }
    for (i = 0; i < 6; i++) out += A.charAt(b[i] % A.length);
    return 'SQ-' + out;
  }

  /* ---------- styles ---------- */
  var css = '#stmq-s{position:fixed;inset:0;background:rgba(20,15,40,.62);z-index:70;display:none}#stmq-s.on{display:block}' +
    '#stmq{position:fixed;left:0;right:0;bottom:0;max-height:92vh;max-height:92dvh;overflow:auto;-webkit-overflow-scrolling:touch;background:var(--bg,#fff);color:var(--fg,#1e1b2e);border-radius:22px 22px 0 0;z-index:71;padding:16px 16px calc(20px + env(safe-area-inset-bottom,0px));box-shadow:0 -10px 40px rgba(0,0,0,.3);display:none;font:16px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}' +
    '#stmq.on{display:block}@media(min-width:640px){#stmq{left:50%;right:auto;bottom:auto;top:50%;transform:translate(-50%,-50%);width:520px;border-radius:22px;max-height:90vh}}' +
    '#stmq h2{margin:0 0 2px;font-size:1.2rem;color:var(--link,#5b21b6);border:0;padding:0}#stmq .sub{margin:0 0 12px;color:var(--mut,#5f5a73);font-size:.9rem}' +
    '#stmq .x{position:absolute;right:10px;top:10px;width:40px;height:40px;border-radius:50%;border:0;background:var(--card,#f1ebff);color:inherit;font-size:1.2rem;cursor:pointer}' +
    '#stmq label{display:block;font-weight:600;font-size:.9rem;margin:12px 0 4px}#stmq label small{font-weight:400;color:var(--mut,#5f5a73)}' +
    '#stmq input,#stmq select,#stmq textarea{width:100%;padding:12px;border:1px solid var(--line,#e6e1f5);border-radius:12px;font:inherit;background:var(--card,#fff);color:inherit;min-height:46px}' +
    '#stmq textarea{min-height:84px;resize:vertical}#stmq [aria-invalid=true]{border-color:#b91c1c}#stmq input:focus,#stmq select:focus,#stmq textarea:focus{outline:2px solid #a78bfa;outline-offset:1px}' +
    '#stmq .e{color:#b91c1c;font-size:.82rem;min-height:1em;margin-top:3px}#stmq .row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
    '#stmq .go{width:100%;margin-top:16px;min-height:50px;border:0;border-radius:999px;background:var(--brand,#7c3aed);color:var(--brand-fg,#fff);font:inherit;font-weight:700;cursor:pointer}#stmq .go:disabled{opacity:.6}' +
    '#stmq .alt{display:flex;align-items:center;justify-content:center;width:100%;margin-top:10px;min-height:46px;border-radius:999px;border:1px solid var(--brand,#7c3aed);color:var(--link,#5b21b6);background:transparent;text-decoration:none;font:inherit;font-weight:600;cursor:pointer}' +
    '#stmq .note{font-size:.82rem;color:var(--mut,#5f5a73);margin:10px 0 0}#stmq .bad{background:#fee2e2;color:#991b1b;border-radius:12px;padding:10px 12px;margin-top:12px;font-size:.9rem}' +
    '#stmq .ok{text-align:center;padding:8px 0}#stmq .tick{width:64px;height:64px;border-radius:50%;background:#16a34a;color:#fff;font-size:2rem;display:grid;place-items:center;margin:6px auto 10px}' +
    '#stmq .ref{display:inline-block;font-family:ui-monospace,Menlo,monospace;font-weight:800;letter-spacing:.08em;background:var(--card,#f1ebff);padding:6px 12px;border-radius:10px}' +
    '#stmq ol{text-align:left;margin:12px 0 0;padding-left:1.2em}#stmq .hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}' +
    '@media(prefers-color-scheme:dark){#stmq{--bg:#14111f;--fg:#ece8f7;--mut:#a79fbd;--card:#1d1830;--link:#c4b5fd;--line:#322a4a;--brand:#a78bfa;--brand-fg:#1b1033}}';
  var st = el('style'); st.textContent = css; D.head.appendChild(st);

  /* ---------- state + drawer ---------- */
  var scrim = el('div'); scrim.id = 'stmq-s';
  var box = el('div'); box.id = 'stmq'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'stmq-t');
  D.body.appendChild(scrim); D.body.appendChild(box);
  var opener = null, busy = false, F = {}, done = null;

  function close() {
    box.classList.remove('on'); scrim.classList.remove('on'); D.body.style.overflow = '';
    if (opener && opener.focus) { try { opener.focus(); } catch (e) {} }
  }
  scrim.addEventListener('click', close);
  D.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box.classList.contains('on')) close(); });

  function field(parent, id, label, node, opt) {
    var w = el('div'), l = el('label'); l.htmlFor = 'q-' + id; l.appendChild(D.createTextNode(label)); if (opt) l.appendChild(el('small', null, ' (optional)'));
    w.appendChild(l); node.id = 'q-' + id; node.name = id; if (F[id] != null) node.value = F[id];
    node.addEventListener('input', function () { F[id] = node.value; node.removeAttribute('aria-invalid'); var er = D.getElementById('qe-' + id); if (er) er.textContent = ''; });
    node.addEventListener('change', function () { F[id] = node.value; });
    w.appendChild(node); var er = el('div', 'e'); er.id = 'qe-' + id; er.setAttribute('aria-live', 'polite'); w.appendChild(er); parent.appendChild(w); return node;
  }
  function inp(type, ph, ac, mode) { var i = el('input'); i.type = type; if (ph) i.placeholder = ph; if (ac) i.autocomplete = ac; if (mode) i.inputMode = mode; return i; }
  function sel(first, opts) { var s = el('select'); s.appendChild(new Option(first, '')); opts.forEach(function (o) { s.appendChild(typeof o === 'string' ? new Option(o, o) : new Option(o[1], o[0])); }); return s; }
  function today() { var t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset()); return t.toISOString().slice(0, 10); }
  function svcName(id) { for (var i = 0; i < ALL.length; i++) if (ALL[i][0] === id) return ALL[i][1]; return F.svcCustom && F.svcCustom[0] === id ? F.svcCustom[1] : ''; }

  function renderForm() {
    box.textContent = '';
    var x = el('button', 'x', '\u2715'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.onclick = close; box.appendChild(x);
    var h = el('h2', null, 'Request a quote'); h.id = 'stmq-t'; box.appendChild(h);
    box.appendChild(el('p', 'sub', 'Tell us what you need. No payment now: we review your request and send you a quote.'));
    var f = el('form'); f.noValidate = true; box.appendChild(f);
    var opts = GROUPS.map(function (g) { return g; });
    var s = el('select'); s.appendChild(new Option('Choose a service', ''));
    if (F.svcCustom) s.appendChild(new Option(F.svcCustom[1], F.svcCustom[0]));
    opts.forEach(function (g) { var og = el('optgroup'); og.label = g[0]; g[1].forEach(function (o) { og.appendChild(new Option(o[1], o[0])); }); s.appendChild(og); });
    field(f, 'svc', 'Service', s);
    var r = el('div', 'row2'); f.appendChild(r);
    field(r, 'county', 'County', sel('Choose county', COUNTIES));
    field(r, 'town', 'Town or estate', inp('text', 'e.g. Kilimani', 'address-level2'));
    field(f, 'prop', 'Type of property', sel('Choose', PROPS), true);
    var r2 = el('div', 'row2'); f.appendChild(r2);
    var d = inp('date'); d.min = today(); field(r2, 'date', 'Preferred date', d, true);
    field(r2, 'slot', 'Time', sel('Any', SLOTS), true);
    var ta = el('textarea'); ta.maxLength = 1000; ta.placeholder = 'What is the problem? Size of the place, how long it has been happening, photos you can send on WhatsApp...'; field(f, 'details', 'Details', ta, true);
    field(f, 'name', 'Your name', inp('text', 'e.g. Jane Wanjiru', 'name'));
    field(f, 'phone', 'Phone / WhatsApp number', inp('tel', '07XX XXX XXX', 'tel', 'tel'));
    field(f, 'email', 'Email (we send your confirmation here)', inp('email', 'you@example.com', 'email', 'email'), true);
    var hp = el('div', 'hp'); hp.setAttribute('aria-hidden', 'true'); var hi = inp('text'); hi.tabIndex = -1; hi.autocomplete = 'off'; hi.name = 'website'; hi.id = 'q-website'; hp.appendChild(hi); f.appendChild(hp);
    var bad = el('div', 'bad'); bad.id = 'stmq-err'; bad.hidden = true; bad.setAttribute('role', 'alert'); f.appendChild(bad);
    var go = el('button', 'go', 'Send quote request'); go.type = 'submit'; go.id = 'stmq-go'; f.appendChild(go);
    f.appendChild(el('p', 'note', 'We only use your details to prepare your quote. Prices are confirmed after inspection and you pay nothing to ask.'));
    f.addEventListener('submit', function (e) { e.preventDefault(); submit(hi.value); });
  }
  var RULES = {
    svc: function (v) { return v ? '' : 'Choose the service you need.'; },
    county: function (v) { return v ? '' : 'Choose your county.'; },
    town: function (v) { return String(v || '').trim().length >= 2 ? '' : 'Enter your town or estate.'; },
    date: function (v) { return !v || v >= today() ? '' : 'Pick today or a later date.'; },
    name: function (v) { return String(v || '').trim().length >= 2 ? '' : 'Enter your name.'; },
    phone: function (v) { return normPhone(v) ? '' : 'Enter a Kenyan number like 0712 345 678.'; },
    email: function (v) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()) ? '' : 'That email does not look right.'; }
  };
  function showErr(id, msg) { var n = D.getElementById('q-' + id), er = D.getElementById('qe-' + id); if (n) n.setAttribute('aria-invalid', String(!!msg)); if (er) er.textContent = msg; }
  function banner(msg) { var b = D.getElementById('stmq-err'); if (!b) return; b.textContent = msg || ''; b.hidden = !msg; }

  function submit(trap) {
    if (busy) return;
    banner('');
    var bad = Object.keys(RULES).filter(function (k) { var m = RULES[k](F[k]); showErr(k, m); return !!m; });
    if (bad.length) { var n = D.getElementById('q-' + bad[0]); if (n) n.focus(); return; }
    if (trap) { showDone({ ref: newRef(), fake: true }); return; }   /* honeypot filled: act as if sent, store nothing */
    var last = ls('stm_quote_last'); if (last && Date.now() - last < 30000) { banner('You just sent a request. Please wait about 30 seconds before sending another.'); return; }
    var s = session(), ph = normPhone(F.phone), id = String(F.svc), name = svcName(id) || id;
    var row = { ref: newRef(), user_id: s ? s.user.id : null, service_id: slug(id), service_name: name.slice(0, 160), customer_name: String(F.name).trim().slice(0, 120), phone: '+' + ph,
      email: String(F.email || '').trim().toLowerCase().slice(0, 150) || (s && s.user.email) || null, county: F.county, location: String(F.town).trim().slice(0, 200),
      property_type: F.prop || null, preferred_date: F.date || null, preferred_slot: F.slot || null, details: String(F.details || '').trim().slice(0, 1000) || null };
    busy = true; var go = D.getElementById('stmq-go'); go.disabled = true; go.textContent = 'Sending...';
    var hd = { 'Content-Type': 'application/json', apikey: C.key, Prefer: 'return=minimal' }; if (s) hd.Authorization = 'Bearer ' + s.access_token;
    var ctl = window.AbortController ? new AbortController() : null, to = setTimeout(function () { if (ctl) ctl.abort(); }, 20000);
    fetch(C.sb + '/rest/v1/service_quotes', { method: 'POST', headers: hd, body: JSON.stringify(row), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { if (r.ok) return; return r.text().then(function (t) { var e = new Error('status ' + r.status + ' ' + t); e.status = r.status; throw e; }); })
      .then(function () {
        clearTimeout(to); busy = false; ls('stm_quote_last', Date.now());
        ls('stm_quote_cust', { uid: s ? s.user.id : null, name: row.customer_name, phone: F.phone, email: row.email || '', county: F.county });
        notify(row); showDone(row);
      })
      .catch(function (err) {
        clearTimeout(to); busy = false; go.disabled = false; go.textContent = 'Send quote request';
        try { console.error('Quote failed:', err && err.message); } catch (e) {}
        banner('We could not send your request' + (err && err.status ? ' (error ' + err.status + ')' : '. Check your connection') + '. Please try again, or send it on WhatsApp.');
        var wa = D.getElementById('stmq-wa'); if (!wa) { wa = el('a', 'alt', 'Send on WhatsApp instead'); wa.id = 'stmq-wa'; wa.target = '_blank'; wa.rel = 'noopener'; go.parentNode.insertBefore(wa, go.nextSibling); }
        wa.href = waLink(row);
      });
  }
  function waLink(row) {
    var L = ['Hello Stermont Arcade, I would like a quote.', '', '*Service:* ' + row.service_name, '*Location:* ' + row.location + ', ' + row.county];
    if (row.property_type) L.push('*Property:* ' + row.property_type);
    if (row.preferred_date) L.push('*Preferred:* ' + row.preferred_date + (row.preferred_slot ? ', ' + row.preferred_slot : ''));
    if (row.details) L.push('*Details:* ' + row.details);
    L.push('*Name:* ' + row.customer_name, '*Phone:* ' + row.phone);
    if (row.ref && !row.fake) L.push('*Request:* ' + row.ref);
    return 'https://wa.me/' + C.wa + '?text=' + encodeURIComponent(L.join('\n'));
  }
  function showDone(row) {
    done = row; box.textContent = '';
    var x = el('button', 'x', '\u2715'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.onclick = close; box.appendChild(x);
    var o = el('div', 'ok'); o.appendChild(el('div', 'tick', '\u2713')); var h = el('h2', null, 'Quote request sent'); h.id = 'stmq-t'; o.appendChild(h);
    o.appendChild(el('p', 'sub', 'Your reference')); o.appendChild(el('span', 'ref', row.ref));
    var ol = el('ol'); ['We read your request and may ask for photos or a quick call.', 'We send you a quote, confirmed after inspection where needed.', 'You only pay once you agree the quote.'].forEach(function (t) { ol.appendChild(el('li', null, t)); }); o.appendChild(ol);
    box.appendChild(o);
    if (!row.fake) { var a = el('a', 'alt', 'Chat with us on WhatsApp'); a.href = waLink(row); a.target = '_blank'; a.rel = 'noopener'; box.appendChild(a); }
    var c = el('button', 'alt', 'Close'); c.type = 'button'; c.onclick = close; box.appendChild(c);
    box.scrollTop = 0; c.focus();
  }

  /* ---------- notifications (same route as product orders) ---------- */
  var FF = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;";
  function kv(k, v) { return v ? '<tr><td valign="top" style="padding:8px 0;border-bottom:1px solid #eee7fb;' + FF + 'font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#7c3aed;width:34%;">' + k + '</td><td style="padding:8px 0;border-bottom:1px solid #eee7fb;' + FF + 'font-size:15px;color:#1b1230;">' + v + '</td></tr>' : ''; }
  function btn(href, label, bg, fg) { return '<a href="' + href + '" style="display:inline-block;background:' + bg + ';color:' + fg + ';' + FF + 'font-size:15px;font-weight:800;text-decoration:none;padding:14px 22px;border-radius:14px;margin:4px;">' + label + '</a>'; }
  function shell(o) {
    return '<div style="background:#efe7ff;padding:28px 12px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;border-radius:24px;overflow:hidden;background:#ffffff;">' +
      '<tr><td align="center" bgcolor="#5b21b6" style="background:#5b21b6;background-image:linear-gradient(135deg,#9d5cff 0%,#7c3aed 45%,#3b0f8c 100%);padding:32px 24px 26px;">' +
      '<div style="' + FF + 'font-size:13px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#e9ddff;">Stermont <span style="background:#c8f31d;color:#2a0e5c;padding:1px 7px;border-radius:5px;">Arcade</span></div>' +
      '<div style="' + FF + 'font-size:28px;font-weight:900;line-height:1.15;color:#ffffff;padding-top:18px;">' + o.title + '</div>' +
      '<div style="' + FF + 'font-size:15px;color:#e9ddff;padding-top:8px;">' + o.sub + '</div>' +
      '<div style="padding-top:14px;"><span style="display:inline-block;background:#f59e0b;color:#2a0e5c;' + FF + 'font-size:12px;font-weight:900;letter-spacing:.1em;padding:6px 14px;border-radius:20px;">' + o.badge + '</span></div></td></tr>' +
      '<tr><td style="padding:22px 26px 6px;">' + o.body + '</td></tr>' +
      '<tr><td align="center" style="padding:10px 20px 24px;">' + o.btns + '</td></tr>' +
      '<tr><td align="center" bgcolor="#2a0e5c" style="background:#2a0e5c;padding:16px 24px;"><div style="' + FF + 'font-size:12px;line-height:1.7;color:#cdbdf3;">' + o.foot + '</div></td></tr></table></div>';
  }
  function ejs(tpl, params) {
    return fetch('https://api.emailjs.com/api/v1.0/email/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ service_id: C.ejsService, template_id: tpl, user_id: C.ejsKey, template_params: params }) })
      .then(function (r) { if (!r.ok) return r.text().then(function (t) { console.warn('EmailJS failed:', r.status, t); return false; }); return true; })
      .catch(function (e) { console.warn('EmailJS error:', e && e.message); return false; });
  }
  function notify(row) {
    try {
      var when = row.preferred_date ? hx(row.preferred_date) + (row.preferred_slot ? ', ' + hx(row.preferred_slot) : '') : '';
      var table = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + kv('Service', '<b>' + hx(row.service_name) + '</b>') + kv('Where', hx(row.location) + ', ' + hx(row.county)) + kv('Property', hx(row.property_type)) + kv('Preferred', when) + kv('Details', hx(row.details).replace(/\n/g, '<br>')) + '</table>';
      var admin = C.site + '/admin.html?quote=' + encodeURIComponent(row.ref), wa = 'https://wa.me/' + row.phone.replace(/\D/g, '');
      var staffBody = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + kv('Customer', hx(row.customer_name)) + kv('Phone', '<a href="tel:' + hx(row.phone) + '" style="color:#5b21b6;text-decoration:none;">' + hx(row.phone) + '</a>') + kv('Email', hx(row.email)) + '</table><div style="height:14px"></div>' + table +
        '<div style="background:#fff8e6;border:1px solid #fde4a3;border-radius:14px;padding:12px 16px;margin-top:16px;' + FF + 'font-size:13px;line-height:1.55;color:#6b4a00;"><b>No payment was taken.</b> Call or WhatsApp the customer, agree the scope, then record the quote in the admin console (staff sign-in required).</div>';
      var staffHtml = shell({ title: 'New quote request', sub: 'Request <b>' + hx(row.ref) + '</b>', badge: '&#9203; QUOTE NEEDED', body: staffBody,
        btns: btn(admin, 'Open in admin', '#c8f31d', '#2a0e5c') + btn(wa, '&#128172; WhatsApp customer', '#25d366', '#ffffff'), foot: 'Stermont Arcade &middot; quote alert for staff &middot; ' + hx(row.ref) });
      var plain = ['Quote request ' + row.ref, '', 'Service: ' + row.service_name, 'Where: ' + row.location + ', ' + row.county, row.property_type ? 'Property: ' + row.property_type : '', row.preferred_date ? 'Preferred: ' + row.preferred_date + (row.preferred_slot ? ', ' + row.preferred_slot : '') : '', row.details ? 'Details: ' + row.details : '', '',
        'Customer: ' + row.customer_name, 'Phone: ' + row.phone, row.email ? 'Email: ' + row.email : '', 'WhatsApp: https://wa.me/' + row.phone.replace(/\D/g, ''), 'Admin: ' + admin, '', 'NO PAYMENT TAKEN. Call or WhatsApp the customer to agree a quote.'].filter(function (l, i, a) { return l !== '' || a[i - 1] !== ''; }).join('\n');
      var staff = { to_email: C.staff, reply_to: row.email || C.staff, subject: 'New quote request - ' + row.service_name + ' - ' + row.customer_name + ' (' + row.ref + ')', business: 'Stermont Arcade', order_ref: row.ref, name: 'Stermont team', headline: 'New quote request', message: plain, items: row.service_name, total: 'Quote needed', delivery: row.location + ', ' + row.county, phone: '+254 748 888 230', web: 'stermontarcade.co.ke', buttons: '', html_body: staffHtml };
      ejs(C.tpl, staff).then(function (ok) { return ok || ejs(C.tpl2, staff); }).then(function (ok) {
        if (ok) return;
        try { fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ access_key: C.web3, subject: 'New quote request ' + row.ref + ' - ' + row.service_name, from_name: 'Stermont Arcade website', message: plain }) }).catch(function () {}); } catch (e) {}
      });
      if (row.email) {
        var custBody = '<div style="' + FF + 'font-size:18px;font-weight:800;color:#1b1230;">Hi ' + hx(row.customer_name.split(/\s+/)[0]) + ',</div><p style="' + FF + 'font-size:15px;line-height:1.65;color:#4a4163;margin:10px 0 16px;">Thank you for asking for a quote. We have your request and nothing is due now. We will contact you on WhatsApp or by phone to confirm the details, and send your quote. Prices are confirmed after inspection where the job needs one.</p><div style="background:#f8f5ff;border:1px solid #e6dcfb;border-radius:18px;padding:6px 18px 10px;">' + table + '</div>';
        ejs(C.tpl, { to_email: row.email, reply_to: C.staff, subject: 'We received your quote request ' + row.ref, business: 'Stermont Arcade', order_ref: row.ref, name: row.customer_name, headline: 'We received your quote request', message: 'Hello ' + row.customer_name + ', we received your quote request ' + row.ref + ' for ' + row.service_name + '. No payment is due now. We will contact you to confirm the details and send your quote.', items: row.service_name, total: 'Quote to follow', delivery: row.location + ', ' + row.county, phone: '+254 748 888 230', web: 'stermontarcade.co.ke', buttons: '',
          html_body: shell({ title: 'We received your request', sub: 'Request <b style="color:#c8f31d;">' + hx(row.ref) + '</b>', badge: 'NO PAYMENT NEEDED', body: custBody, btns: btn('https://wa.me/' + C.wa, 'Message us on WhatsApp', '#7c3aed', '#ffffff'), foot: 'Questions? Call +254 748 888 230 or reply to this email.<br><a href="https://stermontarcade.co.ke" style="color:#c8f31d;text-decoration:none;">stermontarcade.co.ke</a>' }) });
      }
    } catch (e) { try { console.warn('Quote alert error:', e && e.message); } catch (x) {} }
  }

  /* ---------- open ---------- */
  function open(o) {
    try {
      o = o || {}; opener = o.opener || D.activeElement; done = null; F = {}; F.svcCustom = null;
      var c = ls('stm_quote_cust'), u = session(), uid = u ? u.user.id : null;
      if (c && c.uid === uid) { F.name = c.name || ''; F.phone = c.phone || ''; F.email = c.email || ''; F.county = c.county || ''; }
      else if (u) { var md = u.user.user_metadata || {}; F.name = md.full_name || ''; F.phone = md.phone || ''; F.email = u.user.email || ''; }
      var id = o.id || '';
      if (!id && o.name) {
        var low = String(o.name).toLowerCase().trim();
        for (var i = 0; i < ALL.length; i++) if (ALL[i][1].toLowerCase() === low || ALL[i][0] === slug(o.name)) { id = ALL[i][0]; break; }
        if (!id) { id = slug(o.name); F.svcCustom = [id, String(o.name).trim()]; }
      }
      if (id && !svcName(id)) id = '';
      F.svc = id;
      renderForm(); scrim.classList.add('on'); box.classList.add('on'); D.body.style.overflow = 'hidden'; box.scrollTop = 0;
      var first = D.getElementById(id ? 'q-county' : 'q-svc'); if (first) first.focus();
      return true;
    } catch (e) { try { console.warn('Quote drawer error:', e && e.message); } catch (x) {} return false; }
  }
  window.STMQuote = { open: open, close: close };

  /* ---------- take over the old buttons (capture phase, fail-safe) ---------- */
  window.addEventListener('click', function (e) {
    try {
      var t = e.target; if (!t || !t.closest) return;
      var b = t.closest('[data-book]');
      if (b) { if (open({ id: b.getAttribute('data-book'), opener: b })) { e.preventDefault(); e.stopImmediatePropagation(); } return; }
      var a = t.closest('a[href^="https://wa.me/' + C.wa + '?text="]');
      if (!a || !/(^|\s)btn(\s|$)/.test(a.className)) return;
      var txt = ''; try { txt = decodeURIComponent(a.getAttribute('href').split('?text=')[1] || ''); } catch (x) { return; }
      if (!/quote|book/i.test(txt)) return;
      var m = txt.match(/(?:quote|book) for (.+?)\.?\s*My location/i);
      if (open({ name: m ? m[1] : '', opener: a })) { e.preventDefault(); e.stopImmediatePropagation(); }
    } catch (err) {}
  }, true);
  if (/[?&]quote=1\b/.test(location.search)) setTimeout(function () { open({}); }, 300);
})();
