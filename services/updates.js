/* Stermont Arcade: live "Latest work and updates" for the services pages (hub, service pages, pest pages).
   Loaded by services/page.js and services/hub.js. Reads public.service_posts (published rows only) and public.service_catalog
   (price range, notice, paused bookings, cover photo) with the public key, so a staff post in the admin shows here without a rebuild.
   Nothing here can write. Every text is inserted with textContent; media URLs must come from our own storage bucket.
   To undo: delete the loader line in page.js and hub.js. */
(function () {
  'use strict';
  var SB = 'https://oewvtbnmyombbtggamor.supabase.co', KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7', MEDIA = SB + '/storage/v1/object/public/service-media/';
  var D = document, path = location.pathname.replace(/\/index\.html$/, '/');
  var PEST = 'pest-control-fumigation-nairobi', slug = '', hub = false;
  var m = path.match(/^\/services\/([a-z0-9-]+)\.html$/);
  if (m) slug = m[1];
  else if (/^\/services\/pests\//.test(path)) slug = PEST;
  else if (/^\/services\/?$/.test(path)) hub = true;
  if (!slug && !hub) return;
  var KIND = { update: 'Update', before_after: 'Before and after', completed: 'Job completed', tip: 'Tip', offer: 'Offer' };
  function h(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function get(q) { return fetch(SB + '/rest/v1/' + q, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }); }
  function ours(u) { return typeof u === 'string' && u.indexOf(MEDIA) === 0; }
  function kes(n) { return 'KSh ' + Number(n).toLocaleString('en-US'); }
  function when(d) { try { return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; } }

  var css = '#updates{margin:1.6rem 0}#updates .sp-grid{display:grid;gap:12px;grid-template-columns:1fr}@media(min-width:640px){#updates .sp-grid{grid-template-columns:1fr 1fr}}' +
    '.sp-card{background:var(--card,#f1ebff);border:1px solid var(--line,#e6e1f5);border-radius:16px;overflow:hidden;color:var(--fg,#1e1b2e)}' +
    '.sp-card .m{display:grid;gap:2px;grid-template-columns:repeat(2,1fr);background:#000}.sp-card .m.one{grid-template-columns:1fr}' +
    '.sp-card .m img,.sp-card .m video{width:100%;height:100%;aspect-ratio:4/3;object-fit:cover;display:block;background:#1d1830;cursor:zoom-in}.sp-card .m video{cursor:auto}' +
    '.sp-card .t{padding:12px 14px 14px}.sp-card .k{font-size:.72rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--link,#5b21b6)}' +
    '.sp-card h3{margin:.2rem 0 .3rem;font-size:1.02rem;line-height:1.3}.sp-card p{margin:.3rem 0;font-size:.93rem;color:var(--mut,#5f5a73)}.sp-card .w{font-size:.8rem;color:var(--mut,#5f5a73)}' +
    '.sp-note{border-radius:14px;padding:12px 14px;margin:12px 0;font-weight:600;background:#fef3c7;color:#92400e;border:1px solid #fcd34d}.sp-note.ok{background:#ede9fe;color:#4c1d95;border-color:#c4b5fd}' +
    '.sp-box{position:fixed;inset:0;z-index:100;background:rgba(10,8,20,.92);display:flex;align-items:center;justify-content:center;padding:12px}.sp-box img{max-width:100%;max-height:100%;border-radius:8px}';
  var st = h('style'); st.textContent = css; D.head.appendChild(st);

  function zoom(src) { var b = h('div', 'sp-box'); b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Photo'); var i = h('img'); i.src = src; i.alt = ''; b.appendChild(i); b.onclick = function () { b.remove(); }; D.body.appendChild(b); }

  function card(p) {
    var c = h('article', 'sp-card'), media = (p.media || []).filter(function (x) { return x && ours(x.u) && (x.t === 'image' || x.t === 'video'); }).slice(0, 4);
    if (media.length) {
      var m = h('div', 'm' + (media.length === 1 ? ' one' : ''));
      media.forEach(function (x) {
        if (x.t === 'video') { var v = h('video'); v.controls = true; v.preload = 'metadata'; v.playsInline = true; v.setAttribute('playsinline', ''); v.src = x.u + '#t=0.1'; m.appendChild(v); }
        else { var i = h('img'); i.src = x.u; i.alt = p.title; i.loading = 'lazy'; i.decoding = 'async'; i.onclick = function () { zoom(x.u); }; m.appendChild(i); }
      });
      c.appendChild(m);
    }
    var t = h('div', 't'); t.appendChild(h('div', 'k', KIND[p.kind] || 'Update')); t.appendChild(h('h3', null, p.title));
    if (p.body) { String(p.body).split(/\n{1,}/).slice(0, 6).forEach(function (l) { if (l.trim()) t.appendChild(h('p', null, l.trim())); }); }
    t.appendChild(h('div', 'w', [p.town, when(p.created_at)].filter(Boolean).join(' \u00b7 '))); c.appendChild(t); return c;
  }

  function anchor() { return D.getElementById('faq') || D.querySelector('footer') || D.querySelector('main') || D.body; }

  function showPosts(list) {
    if (!list.length) return;
    var sec = h(hub ? 'section' : 'div'); sec.id = 'updates';
    var hd = h('h2', null, 'Latest work and updates'); sec.appendChild(hd);
    sec.appendChild(h('p', null, 'Photos and videos from our recent jobs, posted by our team.'));
    var g = h('div', 'sp-grid'); list.forEach(function (p) { g.appendChild(card(p)); }); sec.appendChild(g);
    var a = anchor(); a.parentNode.insertBefore(sec, a);
  }

  function applyService(row) {
    if (!row) return;
    var hero = D.querySelector('.hero') || D.querySelector('main');
    function note(txt, cls) { var n = h('div', 'sp-note' + (cls ? ' ' + cls : ''), txt); n.setAttribute('role', 'status'); if (hero && hero.parentNode) hero.parentNode.insertBefore(n, hero.nextSibling); }
    if (row.active === false) note('We are not taking new bookings for this service right now. Message us on WhatsApp and we will tell you the next available date.');
    if (row.notice) note(row.notice);
    if (row.headline) note(row.headline, 'ok');
    if (row.price_min != null && row.price_max != null && !(+row.price_min > +row.price_max)) {
      var txt = kes(row.price_min) + ' to ' + kes(row.price_max) + (row.price_open ? '+' : '');
      var b = D.querySelector('.pricebox b'); if (b) b.textContent = txt;
      if (row.price_note) { var s = D.querySelector('.pricebox small'); if (s) s.textContent = row.price_note; }
    }
  }

  function applyHub(rows) {
    rows.forEach(function (r) {
      var a = D.querySelector('a.tile[href="/services/' + r.slug + '.html"]'); if (!a) return;
      if (r.cover_url && ours(r.cover_url)) { var i = a.querySelector('img'); if (i) { i.src = r.cover_url; } else { var art = a.querySelector('.art'); if (art) { var n = h('img'); n.alt = ''; n.loading = 'lazy'; n.src = r.cover_url; art.appendChild(n); } } }
      var sm = a.querySelector('small');
      if (sm && r.price_min != null && r.price_max != null && !(+r.price_min > +r.price_max)) sm.textContent = kes(r.price_min) + ' to ' + kes(r.price_max) + (r.price_open ? '+' : '') + (sm.textContent.indexOf('.') > -1 ? sm.textContent.slice(sm.textContent.indexOf('.')) : '');
      if (r.active === false && sm) sm.textContent = 'Not taking new bookings right now. Ask on WhatsApp for the next date.';
    });
  }

  var sel = 'service_posts?select=id,created_at,service_slug,kind,title,body,town,media&published=eq.true&order=pinned.desc,created_at.desc&limit=' + (hub ? 12 : 8);
  if (slug) sel += '&service_slug=eq.' + encodeURIComponent(slug);
  get(sel).then(showPosts);
  if (slug) get('service_catalog?select=*&slug=eq.' + encodeURIComponent(slug)).then(function (r) { applyService(r && r[0]); });
  else get('service_catalog?select=*').then(applyHub);
})();
