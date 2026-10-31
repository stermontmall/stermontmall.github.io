/* Admin console: SERVICE POSTS and SERVICE SETTINGS tab (admin.html tab "media"). STMServiceMedia.mount(listEl) is called by admin.html render().
   1) "Photos and posts": staff create, EDIT, hide, pin and delete photo/video posts for ANY service page, any pest page, or "General" (the hub).
      Files go to the public Supabase Storage bucket "service-media" (writes are staff only); the post goes to public.service_posts.
      Photos are shrunk in the browser (max 1600 px, JPEG) before upload. Videos go up as they are (MP4, WebM or MOV, 50 MB max).
      Each media item is stored as { url, type: 'image'|'video', name, w, h }.
   2) "Service settings": per service page (public.service_catalog): taking bookings on/off, notice, headline, price range override, cover photo.
   The public pages read both tables live (services/updates.js), so nothing needs a rebuild. */
(function () {
  'use strict';
  var D = document, BUCKET = 'service-media', MAXF = 12, MAXVID = 50 * 1024 * 1024, MAXPX = 1600;
  var KINDS = [['update', 'Update'], ['completed', 'Completed job'], ['before_after', 'Before and after'], ['tip', 'Tip'], ['offer', 'Offer']];
  var OKIMG = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }, OKVID = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };
  var EXTRA = [['antenna-4g-5g-signal-booster-kenya', '4G/5G antenna setup'], ['electric-fence-installation-kenya', 'Electric fence installation']];
  var FALLBACK = [['pest-control-fumigation-nairobi', 'Pest Control & Fumigation'], ['solar-system-installation-kenya', 'Solar System Setup & Maintenance'], ['cctv-smart-security-installation-nairobi', 'CCTV & Smart Security Installation'], ['tv-mounting-audio-visual-setup-nairobi', 'TV Mounting & Audio Visual Setup'], ['agrovet-spraying-crop-consultancy-kenya', 'Agrovet Spraying & Crop Consultancy'], ['home-appliance-repair-nairobi', 'Home Appliance Repair & Service'], ['deep-cleaning-carpet-wash-nairobi', 'Professional Deep Cleaning & Carpet Wash'], ['electrical-plumbing-maintenance-nairobi', 'Electrical & Plumbing Maintenance']];
  var names = {}, groups = [], svcSlugs = [], pestSet = {}, defs = {}, posts = [], cat = {}, busy = false, view = 'posts', flt = { svc: '', st: '' };

  function h(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function api(p, o) { return STMAdmin.ready().then(function () { return STMAdmin.api(p, o); }); }
  function note(msg, ok) { var e = D.getElementById('aerr'); if (!e) return; e.textContent = msg; e.style.color = ok ? '#15803d' : ''; e.hidden = !msg; }
  function mb(n) { return (n / 1048576).toFixed(n > 10485760 ? 0 : 1) + ' MB'; }
  function getJson(u) { return fetch(u, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function kes(n) { return 'KSh ' + Number(n).toLocaleString('en-KE'); }
  function ask(title, text, label, fn) {
    var t = D.getElementById('cf-t'), b = D.getElementById('cf-b'), y = D.getElementById('cf-y');
    if (!t || !b || !y) { if (window.confirm(title + ' ' + text)) fn(); return; }
    t.textContent = title; b.textContent = ''; b.appendChild(h('p', 'meta', text));
    y.className = 'btn no'; y.textContent = label; y.disabled = false;
    y.onclick = function () { D.getElementById('cf').hidden = true; fn(); };
    D.getElementById('cf').hidden = false;
  }
  /* turn a failed Response into a thrown Error that human() can explain */
  function fail(r) {
    return r.text().then(function (t) {
      var m = ''; try { var j = JSON.parse(t); m = j.message || j.error || ''; } catch (x) {}
      var e = new Error(r.status === 401 ? 'expired' : (m || 'Request failed (' + r.status + ')')); e.status = r.status; throw e;
    });
  }
  function human(e) {
    if (!e) return 'Something went wrong.';
    if (e.message === 'expired' || e.status === 401) return 'Your session expired. Refresh the page and sign in again.';
    if (e.status === 403 || /row-level security|policy/i.test(e.message)) return 'You do not have staff access. Ask an admin to add your email to the staff table.';
    if (e.status === 413 || /too large|exceeded/i.test(e.message)) return 'That file is too large. The limit is 50 MB per file.';
    if (e.status === 404 || /schema cache|does not exist/i.test(e.message)) return 'The service tables are missing in Supabase. Tell the developer to run the service_posts_and_catalog migration.';
    if (e.status === 400 || e.status === 409) return 'The server rejected this: ' + e.message;
    return e.message || 'Something went wrong.';
  }

  var css = '.sm .fld{display:block;margin:.65rem 0 0}.sm .fld>span{display:block;font-size:.78rem;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.04em;margin-bottom:.2rem}' +
    '.sm input[type=text],.sm input[type=number],.sm select,.sm textarea{width:100%;padding:.65rem .75rem;border:1px solid var(--ln);border-radius:10px;font:inherit;background:#fff;color:var(--tx)}.sm textarea{min-height:84px;resize:vertical}' +
    '.sm-row{display:grid;gap:.6rem}@media(min-width:700px){.sm-row{grid-template-columns:1fr 1fr}}' +
    '.sm-prev,.sm-media{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:.5rem;margin-top:.6rem}' +
    '.sm-th{position:relative;border-radius:10px;overflow:hidden;background:#eceaf5;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;text-align:center;font-size:.72rem;color:var(--mu);padding:.2rem;word-break:break-all}' +
    '.sm-th img,.sm-th video{width:100%;height:100%;object-fit:cover;display:block}.sm-th .x{position:absolute;top:3px;right:3px;width:28px;height:28px;border-radius:50%;border:0;background:rgba(0,0,0,.65);color:#fff;font-size:16px;line-height:1;cursor:pointer}' +
    '.sm-th .tag{position:absolute;left:3px;bottom:3px;background:rgba(0,0,0,.65);color:#fff;border-radius:6px;padding:0 .35rem;font-size:.68rem}' +
    '.sm-pick{display:inline-block;position:relative;cursor:pointer;overflow:hidden}.sm-pick input{position:absolute;opacity:0;width:1px;height:1px}.sm-chk{display:flex;align-items:center;gap:.5rem;margin:.6rem 0 0;font-weight:600}.sm-chk input{width:20px;height:20px}' +
    '.sm-st{margin:.6rem 0 0;font-size:.92rem;color:var(--mu)}.sm .acts .btn{flex:1 1 120px}.sm-seg{display:flex;gap:.4rem;margin-bottom:.8rem}.sm-seg .btn{flex:1}' +
    '.sm-cov{width:100%;max-width:260px;aspect-ratio:16/9;object-fit:cover;border-radius:10px;display:block;margin-top:.5rem;background:#eceaf5}.sm-hint{font-size:.82rem;color:var(--mu);margin:.25rem 0 0}';
  if (!D.getElementById('sm-css')) { var s = h('style'); s.id = 'sm-css'; s.textContent = css; D.head.appendChild(s); }

  /* ---------- service list (every service page, every pest page) ---------- */
  function loadServices() {
    return Promise.all([getJson('services/services-data.json'), getJson('services/pests-data.json')]).then(function (r) {
      names = {}; defs = {}; pestSet = {}; svcSlugs = [];
      var main = [], pests = [], d = r[0], p = r[1];
      if (d && d.services && d.services.length) d.services.forEach(function (s) {
        if (!s || !s.slug) return; names[s.slug] = s.name || s.slug; main.push([s.slug, names[s.slug]]); svcSlugs.push(s.slug);
        defs[s.slug] = { name: names[s.slug], min: s.priceMin, max: s.priceMax, open: !!s.priceOpen, note: s.priceNote || '' };
      });
      else FALLBACK.forEach(function (s) { names[s[0]] = s[1]; main.push(s); svcSlugs.push(s[0]); defs[s[0]] = { name: s[1] }; });
      EXTRA.forEach(function (s) { names[s[0]] = s[1]; main.push(s); });
      if (p && p.pests) p.pests.forEach(function (x) { if (!x || !x.slug) return; var n = 'Pest: ' + (x.name || x.slug); names[x.slug] = n; pestSet[x.slug] = 1; pests.push([x.slug, n]); });
      groups = [{ label: 'Services', items: main }]; if (pests.length) groups.push({ label: 'Pest pages', items: pests });
    });
  }
  function svcSelect(cur, first) {
    var s = h('select'), fixed = first || [];
    fixed.forEach(function (o) { s.appendChild(new Option(o[1], o[0])); });
    groups.forEach(function (g) { var og = D.createElement('optgroup'); og.label = g.label; g.items.forEach(function (it) { og.appendChild(new Option(it[1], it[0])); }); s.appendChild(og); });
    if (cur && !names[cur] && !fixed.some(function (o) { return o[0] === cur; })) s.appendChild(new Option(cur, cur));
    s.value = cur || (fixed.length ? fixed[0][0] : '');
    return s;
  }
  function viewUrl(slug) {
    if (!slug) return '/services/';
    if (pestSet[slug]) return '/services/pests/' + slug + '.html';
    if (defs[slug]) return '/services/' + slug + '.html';
    return null;
  }

  /* ---------- files ---------- */
  function info(f) {
    var t = f.type || '', n = String(f.name || '').toLowerCase();
    if (!t) { if (/\.(mp4|m4v)$/.test(n)) t = 'video/mp4'; else if (/\.webm$/.test(n)) t = 'video/webm'; else if (/\.mov$/.test(n)) t = 'video/quicktime'; else if (/\.jpe?g$/.test(n)) t = 'image/jpeg'; else if (/\.png$/.test(n)) t = 'image/png'; else if (/\.webp$/.test(n)) t = 'image/webp'; else if (/\.(heic|heif)$/.test(n)) t = 'image/heic'; }
    return { type: t, video: /^video\//.test(t), image: /^image\//.test(t) };
  }
  function shrink(f, type) {   /* resolves { blob, type, ext, w, h }; rejects only when a non-standard photo (e.g. HEIC) cannot be read */
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(f), im = new Image();
      function orig(w, hh) { if (OKIMG[type]) res({ blob: f, type: type, ext: OKIMG[type], w: w, h: hh }); else rej(new Error('Could not read ' + (f.name || 'this photo') + '. Save it as JPG, PNG or WebP and try again.')); }
      im.onload = function () {
        var w = im.naturalWidth, hh = im.naturalHeight, k = Math.min(1, MAXPX / Math.max(w, hh)), c = D.createElement('canvas');
        c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(hh * k));
        var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) {
          if (b && (!OKIMG[type] || b.size < f.size)) res({ blob: b, type: 'image/jpeg', ext: 'jpg', w: c.width, h: c.height });
          else orig(w, hh);
        }, 'image/jpeg', 0.82);
      };
      im.onerror = function () { URL.revokeObjectURL(url); orig(); };
      im.src = url;
    });
  }
  function prepare(f) {
    var i = info(f);
    if (i.video) return Promise.resolve({ blob: f, type: i.type, ext: OKVID[i.type], video: true });
    return shrink(f, i.type);
  }
  function rnd() { var a = new Uint8Array(6); (window.crypto || window.msCrypto).getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function mkPath(slug, ext) { var d = new Date(); return (slug || 'general') + '/' + d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + Date.now().toString(36) + '-' + rnd() + '.' + ext; }
  function pubUrl(p) { return STMAdmin.base + '/storage/v1/object/public/' + BUCKET + '/' + p; }
  function pathOf(u) { var k = '/object/public/' + BUCKET + '/', i = String(u || '').indexOf(k); return i > -1 ? u.slice(i + k.length) : null; }
  function upload(it, path) {
    return STMAdmin.raw('/storage/v1/object/' + BUCKET + '/' + path, { method: 'POST', headers: { 'Content-Type': it.type, 'x-upsert': 'false' }, body: it.blob }).then(function (r) { if (!r.ok) return fail(r); });
  }
  function removeObjects(paths) { return Promise.all((paths || []).map(function (p) { return STMAdmin.raw('/storage/v1/object/' + BUCKET + '/' + p, { method: 'DELETE' }).catch(function () {}); })); }

  function thumb(o, onx) {
    var t = h('div', 'sm-th');
    if (o.video && o.src) { var v = D.createElement('video'); v.src = o.src + '#t=0.1'; v.preload = 'metadata'; v.muted = true; v.setAttribute('playsinline', ''); t.appendChild(v); }
    else if (o.src) { var im = new Image(); im.alt = ''; im.src = o.src; if (o.revoke) im.onload = function () { URL.revokeObjectURL(o.src); }; t.appendChild(im); }
    else t.appendChild(D.createTextNode(o.text || ''));
    t.appendChild(h('span', 'tag', o.tag || ''));
    if (onx) { var x = h('button', 'x', '\u00d7'); x.type = 'button'; x.setAttribute('aria-label', 'Remove'); x.onclick = onx; t.appendChild(x); }
    return t;
  }

  /* ---------- post form (used for NEW posts and for EDITING a post) ---------- */
  function form(init, title, sub, label, save, cancel) {
    var keep = (init.media || []).filter(function (m) { return m && /^https:\/\//.test(m.url || ''); }), add = [], c = h('div', 'card sm');
    c.appendChild(h('div', 'ref', title)); if (sub) c.appendChild(h('p', 'meta', sub));
    var row = h('div', 'sm-row');
    var f1 = h('label', 'fld'); f1.appendChild(h('span', null, 'Service page')); var sv = svcSelect(init.service_slug || '', [['', 'General (hub and all services)']]); f1.appendChild(sv);
    var f2 = h('label', 'fld'); f2.appendChild(h('span', null, 'Type')); var kd = h('select'); KINDS.forEach(function (k) { kd.appendChild(new Option(k[1], k[0])); }); kd.value = init.kind || 'update'; f2.appendChild(kd);
    row.appendChild(f1); row.appendChild(f2); c.appendChild(row);
    var f3 = h('label', 'fld'); f3.appendChild(h('span', null, 'Title')); var ti = h('input'); ti.type = 'text'; ti.maxLength = 140; ti.placeholder = 'e.g. Bed bug treatment, Kilimani apartment'; ti.value = init.title || ''; f3.appendChild(ti); c.appendChild(f3);
    var f4 = h('label', 'fld'); f4.appendChild(h('span', null, 'Town (optional)')); var tw = h('input'); tw.type = 'text'; tw.maxLength = 80; tw.placeholder = 'e.g. Nairobi'; tw.value = init.town || ''; f4.appendChild(tw); c.appendChild(f4);
    var f5 = h('label', 'fld'); f5.appendChild(h('span', null, 'Message (optional, up to 2000 characters)')); var bd = h('textarea'); bd.maxLength = 2000; bd.value = init.body || ''; f5.appendChild(bd); c.appendChild(f5);
    var pick = h('label', 'btn alt sm sm-pick', 'Add photos or videos'); var fi = h('input'); fi.type = 'file'; fi.multiple = true; fi.accept = 'image/*,video/mp4,video/webm,video/quicktime'; pick.appendChild(fi);
    var pw = h('div'); pw.style.marginTop = '.8rem'; pw.appendChild(pick); pw.appendChild(h('span', 'sm-hint', '  Up to ' + MAXF + ' files. Tap \u00d7 on a photo to remove it.')); c.appendChild(pw);
    var pv = h('div', 'sm-prev'); c.appendChild(pv);
    var ck1 = h('label', 'sm-chk'); var pubC = h('input'); pubC.type = 'checkbox'; pubC.checked = init.published !== false; ck1.appendChild(pubC); ck1.appendChild(D.createTextNode('Live on the site (untick to keep it hidden)')); c.appendChild(ck1);
    var ck2 = h('label', 'sm-chk'); var pinC = h('input'); pinC.type = 'checkbox'; pinC.checked = !!init.pinned; ck2.appendChild(pinC); ck2.appendChild(D.createTextNode('Pin to the top')); c.appendChild(ck2);
    var er = h('div', 'err'); er.hidden = true; c.appendChild(er);
    var st = h('div', 'sm-st'); st.hidden = true; c.appendChild(st);
    var a = h('div', 'acts'); var go = h('button', 'btn', label); go.type = 'button'; a.appendChild(go);
    if (cancel) { var cb = h('button', 'btn alt', 'Cancel'); cb.type = 'button'; cb.onclick = function () { if (!busy) cancel(); }; a.appendChild(cb); }
    c.appendChild(a);

    function showErr(m, ok) { er.textContent = m || ''; er.style.background = ok ? '#dcfce7' : ''; er.style.color = ok ? '#15803d' : ''; er.hidden = !m; }
    function draw() {
      pv.textContent = '';
      keep.forEach(function (m, i) { pv.appendChild(thumb({ src: m.url, video: m.type === 'video', tag: m.type === 'video' ? 'Video' : 'Photo' }, function () { if (busy) return; keep.splice(i, 1); draw(); })); });
      add.forEach(function (f, i) {
        var n = info(f), ok = n.image && OKIMG[n.type];
        pv.appendChild(thumb({ src: ok ? URL.createObjectURL(f) : '', revoke: ok, text: (n.video ? '\uD83C\uDFAC ' : '\uD83D\uDDBC ') + f.name, tag: n.video ? 'Video ' + mb(f.size) : 'New photo' }, function () { if (busy) return; add.splice(i, 1); draw(); }));
      });
    }
    draw();
    fi.onchange = function () {
      showErr(''); var bad = [];
      [].forEach.call(fi.files, function (f) {
        var n = info(f);
        if (keep.length + add.length >= MAXF) { bad.push('Only ' + MAXF + ' files per post.'); return; }
        if (n.video) { if (!OKVID[n.type]) { bad.push(f.name + ': use MP4, WebM or MOV.'); return; } if (f.size > MAXVID) { bad.push(f.name + ' is ' + mb(f.size) + '. Videos must be under 50 MB.'); return; } }
        else if (!n.image) { bad.push(f.name + ' is not a photo or video.'); return; }
        add.push(f);
      });
      fi.value = ''; draw(); if (bad.length) showErr(bad.filter(function (x, i) { return bad.indexOf(x) === i; }).join(' '));
    };
    go.onclick = function () {
      if (busy) return; showErr('');
      var title = ti.value.trim();
      if (title.length < 2) { showErr('Add a short title (at least 2 characters).'); ti.focus(); return; }
      if (!keep.length && !add.length && !bd.value.trim()) { showErr('Add at least one photo or video, or write a message.'); return; }
      busy = true; go.disabled = true; st.hidden = false;
      var slug = sv.value || null, up = [], nm = [], i = 0;
      function step() {
        if (i >= add.length) return Promise.resolve();
        var f = add[i]; st.textContent = 'Uploading ' + (i + 1) + ' of ' + add.length + '...';
        return prepare(f).then(function (it) {
          var path = mkPath(slug, it.ext);
          return upload(it, path).then(function () {
            up.push(path); var m = { url: pubUrl(path), type: it.video ? 'video' : 'image', name: String(f.name || '').slice(0, 80) };
            if (it.w) { m.w = it.w; m.h = it.h; } nm.push(m); i++; return step();
          });
        });
      }
      step().then(function () {
        st.textContent = 'Saving...';
        return save({ service_slug: slug, kind: kd.value, title: title, body: bd.value.trim() || null, town: tw.value.trim() || null, published: pubC.checked, pinned: pinC.checked }, keep.concat(nm));
      }).catch(function (e) {
        showErr(human(e)); return removeObjects(up);   /* a failed save never leaves orphan files */
      }).then(function () { busy = false; go.disabled = false; st.hidden = true; });
    };
    return {
      el: c,
      msg: function (m) { showErr(m, true); },
      reset: function () { keep = []; add = []; ti.value = ''; tw.value = ''; bd.value = ''; pinC.checked = false; pubC.checked = true; draw(); }
    };
  }

  /* ---------- existing posts ---------- */
  function patch(p, fields, b, list) {
    b.disabled = true;
    api('/rest/v1/service_posts?id=eq.' + encodeURIComponent(p.id) + '&select=id', { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: Object.assign({ updated_at: new Date().toISOString() }, fields) })
      .then(function (r) { if (!r.ok) return fail(r); return r.json(); })
      .then(function (j) { if (!j.length) throw Object.assign(new Error('not allowed'), { status: 403 }); Object.assign(p, fields); paint(list); note('Saved.', true); })
      .catch(function (e) { b.disabled = false; note(human(e), false); });
  }
  function remove(p, list) {
    api('/rest/v1/service_posts?id=eq.' + encodeURIComponent(p.id) + '&select=id', { method: 'DELETE', headers: { Prefer: 'return=representation' } })
      .then(function (r) { if (!r.ok) return fail(r); return r.json(); })
      .then(function (j) {
        if (!j.length) throw Object.assign(new Error('not allowed'), { status: 403 });
        var paths = (p.media || []).map(function (m) { return pathOf(m.url); }).filter(Boolean); posts = posts.filter(function (x) { return x.id !== p.id; }); paint(list); note('Post deleted.', true);
        return removeObjects(paths);
      }).catch(function (e) { note(human(e), false); });
  }
  function editPost(p, c, list) {
    var ed = form(p, 'Edit post', 'Change the text, the service page, or add and remove photos and videos.', 'Save changes', function (vals, media) {
      var removed = (p.media || []).filter(function (m) { return !media.some(function (x) { return x.url === m.url; }); }).map(function (m) { return pathOf(m.url); }).filter(Boolean);
      var fields = Object.assign({}, vals, { media: media, updated_at: new Date().toISOString() });
      return api('/rest/v1/service_posts?id=eq.' + encodeURIComponent(p.id) + '&select=id', { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: fields })
        .then(function (r) { if (!r.ok) return fail(r); return r.json(); })
        .then(function (j) {
          if (!j.length) throw Object.assign(new Error('not allowed'), { status: 403 });
          Object.assign(p, fields); paint(list); note('Saved: ' + p.title, true); return removeObjects(removed);   /* files the staff removed are deleted only after the save worked */
        });
    }, function () { paint(list); });
    c.parentNode.replaceChild(ed.el, c); if (ed.el.scrollIntoView) ed.el.scrollIntoView({ block: 'start' });
  }
  function card(p, list) {
    var c = h('div', 'card sm'), top = h('div', 'top'), l = h('div');
    l.appendChild(h('div', 'ref', (p.pinned ? '\uD83D\uDCCC ' : '') + p.title)); l.appendChild(h('div', 'when', STMAdmin.fmt(p.created_at) + (p.created_by ? ' \u00b7 ' + p.created_by : '')));
    top.appendChild(l); top.appendChild(h('span', 'badge ' + (p.published ? 'b-paid' : 'b-pending'), p.published ? 'Live' : 'Hidden')); c.appendChild(top);
    function meta(k, v) { if (!v) return; var m = h('div', 'meta'); m.appendChild(h('b', null, k + ': ')); m.appendChild(D.createTextNode(v)); c.appendChild(m); }
    var kn = ''; KINDS.forEach(function (k) { if (k[0] === p.kind) kn = k[1]; });
    meta('Service', p.service_slug ? (names[p.service_slug] || p.service_slug) : 'General (hub)'); meta('Type', kn); meta('Town', p.town); meta('Message', p.body);
    var ms = (p.media || []).filter(function (m) { return m && /^https:\/\//.test(m.url || ''); });
    if (ms.length) {
      var g = h('div', 'sm-media');
      ms.forEach(function (m) {
        var t = h('div', 'sm-th');
        if (m.type === 'video') { var v = D.createElement('video'); v.src = m.url + '#t=0.1'; v.preload = 'metadata'; v.controls = true; v.muted = true; v.setAttribute('playsinline', ''); t.appendChild(v); }
        else { var im = new Image(); im.loading = 'lazy'; im.alt = ''; im.src = m.url; t.appendChild(im); }
        g.appendChild(t);
      }); c.appendChild(g);
    }
    var a = h('div', 'acts');
    var b0 = h('button', 'btn sm', 'Edit'); b0.type = 'button'; b0.onclick = function () { editPost(p, c, list); }; a.appendChild(b0);
    var b1 = h('button', 'btn alt sm', p.published ? 'Hide' : 'Publish'); b1.type = 'button'; b1.onclick = function () { patch(p, { published: !p.published }, b1, list); }; a.appendChild(b1);
    var b2 = h('button', 'btn alt sm', p.pinned ? 'Unpin' : 'Pin to top'); b2.type = 'button'; b2.onclick = function () { patch(p, { pinned: !p.pinned }, b2, list); }; a.appendChild(b2);
    var u = p.published ? viewUrl(p.service_slug) : null;
    if (u) { var b4 = h('a', 'btn alt sm', 'View page'); b4.href = u; b4.target = '_blank'; b4.rel = 'noopener'; a.appendChild(b4); }
    var b3 = h('button', 'btn no sm', 'Delete'); b3.type = 'button'; b3.onclick = function () { ask('Delete this post?', 'The post and its ' + ms.length + ' photo/video file(s) will be removed from the site. This cannot be undone.', 'Delete', function () { remove(p, list); }); }; a.appendChild(b3);
    c.appendChild(a); return c;
  }
  function paint(list) {
    var rows = posts.filter(function (p) {
      if (flt.svc === '_general' && p.service_slug) return false;
      if (flt.svc && flt.svc !== '_general' && p.service_slug !== flt.svc) return false;
      if (flt.st === 'live' && !p.published) return false;
      if (flt.st === 'hidden' && p.published) return false;
      return true;
    });
    list.textContent = ''; list.appendChild(h('h3', null, 'Posts (' + rows.length + (rows.length !== posts.length ? ' of ' + posts.length : '') + ')'));
    if (!rows.length) { list.appendChild(h('div', 'empty', posts.length ? 'No posts match this filter.' : 'No posts yet. Your first photo or video post will appear here.')); return; }
    rows.forEach(function (p) { list.appendChild(card(p, list)); });
  }
  function loadPosts(list) {
    return api('/rest/v1/service_posts?select=*&order=pinned.desc,created_at.desc&limit=300').then(function (r) { if (!r.ok) return fail(r); return r.json(); })
      .then(function (j) { if (!list.isConnected) return; posts = j; paint(list); })
      .catch(function (e) { if (!list.isConnected) return; list.textContent = ''; list.appendChild(h('div', 'err', human(e))); });
  }
  function postsView(L) {
    var list = h('div'), f = form({ published: true }, 'New post', 'Show clients your work on any service page. Photos are shrunk automatically. Videos can be MP4, WebM or MOV up to 50 MB.', 'Post', function (vals, media) {
      vals.media = media; vals.created_by = STMAdmin.email() || null;
      return api('/rest/v1/service_posts?select=id', { method: 'POST', headers: { Prefer: 'return=representation' }, body: vals })
        .then(function (r) { if (!r.ok) return fail(r); return r.json(); })
        .then(function () { var where = vals.service_slug ? (names[vals.service_slug] || vals.service_slug) : 'General (hub)'; f.reset(); f.msg('Posted to ' + where + ': ' + vals.title); note('Posted to ' + where + ': ' + vals.title, true); return loadPosts(list); });
    });
    L.appendChild(f.el);
    var fb = h('div', 'card sm'), fr = h('div', 'sm-row');
    var a1 = h('label', 'fld'); a1.appendChild(h('span', null, 'Show posts for')); var fs = svcSelect(flt.svc, [['', 'All services'], ['_general', 'General only']]); a1.appendChild(fs);
    var a2 = h('label', 'fld'); a2.appendChild(h('span', null, 'Status')); var fz = h('select'); [['', 'Live and hidden'], ['live', 'Live only'], ['hidden', 'Hidden only']].forEach(function (o) { fz.appendChild(new Option(o[1], o[0])); }); fz.value = flt.st; a2.appendChild(fz);
    fr.appendChild(a1); fr.appendChild(a2); fb.appendChild(fr); L.appendChild(fb);
    fs.onchange = function () { flt.svc = fs.value; paint(list); }; fz.onchange = function () { flt.st = fz.value; paint(list); };
    list.appendChild(h('div', 'empty', 'Loading posts...')); L.appendChild(list);
    return loadPosts(list);
  }

  /* ---------- service settings (public.service_catalog) ---------- */
  function catCard(slug, L) {
    var row = cat[slug] || {}, d = defs[slug] || {}, c = h('div', 'card sm'), top = h('div', 'top'), l = h('div');
    var cover = row.cover_url || null, newCover = null, dropCover = false, er = h('div', 'err');
    er.hidden = true;
    l.appendChild(h('div', 'ref', names[slug] || slug)); l.appendChild(h('div', 'when', cat[slug] ? 'Customised' + (row.updated_by ? ' by ' + row.updated_by : '') + (row.updated_at ? ' \u00b7 ' + STMAdmin.fmt(row.updated_at) : '') : 'Standard page (nothing changed)'));
    top.appendChild(l); top.appendChild(h('span', 'badge ' + (row.active === false ? 'b-declined' : 'b-paid'), row.active === false ? 'Not booking' : 'Booking')); c.appendChild(top);
    var ck = h('label', 'sm-chk'); var ac = h('input'); ac.type = 'checkbox'; ac.checked = row.active !== false; ck.appendChild(ac); ck.appendChild(D.createTextNode('Taking new bookings and quotes')); c.appendChild(ck);
    c.appendChild(h('p', 'sm-hint', 'Untick when you are fully booked: the page shows a notice and the hub tile says bookings are paused.'));
    var f1 = h('label', 'fld'); f1.appendChild(h('span', null, 'Notice at the top of the page (up to 300 characters)')); var nt = h('textarea'); nt.maxLength = 300; nt.style.minHeight = '60px'; nt.placeholder = 'e.g. Fully booked until 5 November. Message us for the next slot.'; nt.value = row.notice || ''; f1.appendChild(nt); c.appendChild(f1);
    var f2 = h('label', 'fld'); f2.appendChild(h('span', null, 'Highlight or offer line (up to 160 characters)')); var hd = h('input'); hd.type = 'text'; hd.maxLength = 160; hd.placeholder = 'e.g. 10% off for November bookings'; hd.value = row.headline || ''; f2.appendChild(hd); c.appendChild(f2);
    var pr = h('div', 'sm-row');
    var p1 = h('label', 'fld'); p1.appendChild(h('span', null, 'Price from (KSh)')); var pmin = h('input'); pmin.type = 'number'; pmin.min = '0'; pmin.step = '1'; pmin.inputMode = 'numeric'; pmin.placeholder = d.min != null ? String(d.min) : ''; pmin.value = row.price_min != null ? row.price_min : ''; p1.appendChild(pmin);
    var p2 = h('label', 'fld'); p2.appendChild(h('span', null, 'Price to (KSh)')); var pmax = h('input'); pmax.type = 'number'; pmax.min = '0'; pmax.step = '1'; pmax.inputMode = 'numeric'; pmax.placeholder = d.max != null ? String(d.max) : ''; pmax.value = row.price_max != null ? row.price_max : ''; p2.appendChild(pmax);
    pr.appendChild(p1); pr.appendChild(p2); c.appendChild(pr);
    c.appendChild(h('p', 'sm-hint', 'Leave both empty to keep the standard range' + (d.min != null ? ' (' + kes(d.min) + ' to ' + kes(d.max) + (d.open ? '+' : '') + ')' : '') + '. Fill both to change it on the page and the hub.'));
    var ck2 = h('label', 'sm-chk'); var po = h('input'); po.type = 'checkbox'; po.checked = row.price_open != null ? !!row.price_open : !!d.open; ck2.appendChild(po); ck2.appendChild(D.createTextNode('Show a "+" after the top price (bigger jobs cost more)')); c.appendChild(ck2);
    var f3 = h('label', 'fld'); f3.appendChild(h('span', null, 'Price note (up to 400 characters, optional)')); var pn = h('textarea'); pn.maxLength = 400; pn.style.minHeight = '60px'; pn.placeholder = d.note || ''; pn.value = row.price_note || ''; f3.appendChild(pn); c.appendChild(f3);
    var f4 = h('div', 'fld'); f4.appendChild(h('span', null, 'Cover photo for the hub tile')); var cv = h('img', 'sm-cov'); cv.alt = ''; cv.hidden = true; f4.appendChild(cv);
    var pick = h('label', 'btn alt sm sm-pick', 'Choose photo'); var fi = h('input'); fi.type = 'file'; fi.accept = 'image/*'; pick.appendChild(fi); pick.style.marginTop = '.5rem';
    var rm = h('button', 'btn alt sm', 'Remove cover'); rm.type = 'button'; rm.style.marginLeft = '.4rem'; rm.hidden = true;
    f4.appendChild(pick); f4.appendChild(rm); c.appendChild(f4);
    function showCover() { var src = newCover ? newCover.prev : (dropCover ? null : cover); cv.hidden = !src; if (src) cv.src = src; rm.hidden = !src; }
    showCover();
    fi.onchange = function () {
      var f = fi.files && fi.files[0]; fi.value = ''; if (!f) return; var n = info(f);
      if (!n.image) { er.textContent = f.name + ' is not a photo.'; er.hidden = false; return; }
      er.hidden = true; prepare(f).then(function (it) { newCover = { it: it, prev: URL.createObjectURL(it.blob) }; dropCover = false; showCover(); }).catch(function (e) { er.textContent = human(e); er.hidden = false; });
    };
    rm.onclick = function () { newCover = null; dropCover = true; showCover(); };
    c.appendChild(er);
    var a = h('div', 'acts'); var go = h('button', 'btn', 'Save settings'); go.type = 'button'; a.appendChild(go);
    var u = viewUrl(slug); if (u) { var vw = h('a', 'btn alt', 'View page'); vw.href = u; vw.target = '_blank'; vw.rel = 'noopener'; a.appendChild(vw); }
    if (cat[slug]) { var rs = h('button', 'btn no', 'Reset to standard'); rs.type = 'button'; rs.onclick = function () { ask('Reset ' + (names[slug] || slug) + '?', 'The notice, offer line, price override and cover photo are removed and the page goes back to its standard content.', 'Reset', function () { reset(); }); }; a.appendChild(rs); }
    c.appendChild(a);
    function reset() {
      api('/rest/v1/service_catalog?slug=eq.' + encodeURIComponent(slug) + '&select=slug', { method: 'DELETE', headers: { Prefer: 'return=representation' } })
        .then(function (r) { if (!r.ok) return fail(r); return r.json(); })
        .then(function () { var old = pathOf(row.cover_url); delete cat[slug]; note('Reset to standard.', true); L.textContent = ''; drawSettings(L); return removeObjects(old ? [old] : []); })
        .catch(function (e) { er.textContent = human(e); er.hidden = false; });
    }
    go.onclick = function () {
      if (busy) return; er.hidden = true;
      var mn = pmin.value.trim(), mx = pmax.value.trim(), nmin = null, nmax = null;
      if ((mn === '') !== (mx === '')) { er.textContent = 'Fill both price boxes, or leave both empty.'; er.hidden = false; return; }
      if (mn !== '') {
        nmin = Number(mn); nmax = Number(mx);
        if (!isFinite(nmin) || !isFinite(nmax) || nmin < 0 || nmax < 0) { er.textContent = 'Enter prices as plain numbers, 0 or more.'; er.hidden = false; return; }
        if (nmin > nmax) { er.textContent = 'The first price must not be higher than the second.'; er.hidden = false; return; }
      }
      busy = true; go.disabled = true; go.textContent = 'Saving...';
      var up = null, first = Promise.resolve();
      if (newCover) { var path = mkPath('cover-' + slug, newCover.it.ext); first = upload(newCover.it, path).then(function () { up = path; }); }
      first.then(function () {
        var body = { slug: slug, active: ac.checked, price_min: nmin, price_max: nmax, price_open: nmin == null ? null : po.checked, price_note: pn.value.trim() || null, headline: hd.value.trim() || null, notice: nt.value.trim() || null,
          cover_url: up ? pubUrl(up) : (dropCover ? null : cover), updated_by: STMAdmin.email() || null, updated_at: new Date().toISOString() };
        return api('/rest/v1/service_catalog?on_conflict=slug&select=*', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: body })
          .then(function (r) { if (!r.ok) return fail(r); return r.json(); })
          .then(function (j) {
            if (!j.length) throw Object.assign(new Error('not allowed'), { status: 403 });
            var old = (up || dropCover) ? pathOf(cover) : null; cat[slug] = j[0]; note('Saved settings for ' + (names[slug] || slug) + '.', true); L.textContent = ''; drawSettings(L);
            return removeObjects(old ? [old] : []);
          });
      }).catch(function (e) { er.textContent = human(e); er.hidden = false; return removeObjects(up ? [up] : []); })
        .then(function () { busy = false; go.disabled = false; go.textContent = 'Save settings'; });
    };
    return c;
  }
  function drawSettings(L) {
    L.appendChild(h('p', 'meta', 'Control what customers see on each service page without waiting for a rebuild. Changes show on the public page within a minute.'));
    svcSlugs.forEach(function (s) { L.appendChild(catCard(s, L)); });
  }
  function settingsView(L) {
    L.appendChild(h('div', 'empty', 'Loading settings...'));
    return api('/rest/v1/service_catalog?select=*').then(function (r) { if (!r.ok) return fail(r); return r.json(); })
      .then(function (rows) { if (!L.isConnected) return; cat = {}; rows.forEach(function (x) { cat[x.slug] = x; }); L.textContent = ''; drawSettings(L); })
      .catch(function (e) { if (!L.isConnected) return; L.textContent = ''; L.appendChild(h('div', 'err', human(e))); });
  }

  window.STMServiceMedia = {
    mount: function (L) {
      busy = false; L.textContent = '';
      var bar = h('div', 'sm-seg'), body = h('div'), btns = {};
      [['posts', '\uD83D\uDDBC\uFE0F Photos and posts'], ['settings', '\u2699\uFE0F Service settings']].forEach(function (v) {
        var b = h('button', 'btn ' + (view === v[0] ? '' : 'alt'), v[1]); b.type = 'button'; btns[v[0]] = b;
        b.onclick = function () { if (busy) return; view = v[0]; go(); }; bar.appendChild(b);
      });
      L.appendChild(bar); L.appendChild(body);
      function go() {
        if (bar.parentNode !== L) return;
        Object.keys(btns).forEach(function (k) { btns[k].className = 'btn ' + (view === k ? '' : 'alt'); });
        body.textContent = ''; if (view === 'settings') settingsView(body); else postsView(body);
      }
      body.appendChild(h('div', 'empty', 'Loading...'));
      loadServices().then(go, go);
    }
  };
})();
