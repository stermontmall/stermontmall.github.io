/* Admin console: SERVICE MEDIA tab. STMServiceMedia.mount(listEl) is called by admin.html render().
   Staff upload photos and videos of their work and post them as updates for the service pages.
   Files go to the public Supabase Storage bucket "service-media" (writes are staff only); the post goes to public.service_posts.
   Photos are shrunk in the browser (max 1600 px, JPEG) before upload. Videos go up as they are (MP4, WebM or MOV, 50 MB max). */
(function () {
  'use strict';
  var D = document, BUCKET = 'service-media', MAXF = 12, MAXVID = 50 * 1024 * 1024, MAXPX = 1600;
  var KINDS = [['update', 'Update'], ['completed', 'Completed job'], ['before_after', 'Before and after'], ['tip', 'Tip'], ['offer', 'Offer']];
  var OKIMG = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }, OKVID = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };
  var names = {}, slugs = [], posts = [], files = [], busy = false, box = null;

  function h(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function api(p, o) { return STMAdmin.ready().then(function () { return STMAdmin.api(p, o); }); }
  function note(msg, ok) { var e = D.getElementById('aerr'); if (!e) return; e.textContent = msg; e.style.color = ok ? '#15803d' : ''; e.hidden = !msg; }
  function mb(n) { return (n / 1048576).toFixed(n > 10485760 ? 0 : 1) + ' MB'; }
  function getJson(u) { return fetch(u, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
  function ask(title, text, label, fn) {
    var t = D.getElementById('cf-t'), b = D.getElementById('cf-b'), y = D.getElementById('cf-y');
    if (!t || !b || !y) { if (window.confirm(title + ' ' + text)) fn(); return; }
    t.textContent = title; b.textContent = ''; b.appendChild(h('p', 'meta', text));
    y.className = 'btn no'; y.textContent = label; y.disabled = false;
    y.onclick = function () { D.getElementById('cf').hidden = true; fn(); };
    D.getElementById('cf').hidden = false;
  }

  var css = '.sm .fld{display:block;margin:.65rem 0 0}.sm .fld>span{display:block;font-size:.78rem;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.04em;margin-bottom:.2rem}' +
    '.sm input[type=text],.sm select,.sm textarea{width:100%;padding:.65rem .75rem;border:1px solid var(--ln);border-radius:10px;font:inherit;background:#fff;color:var(--tx)}.sm textarea{min-height:84px;resize:vertical}' +
    '.sm-row{display:grid;gap:.6rem}@media(min-width:700px){.sm-row{grid-template-columns:1fr 1fr}}' +
    '.sm-prev,.sm-media{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:.5rem;margin-top:.6rem}' +
    '.sm-th{position:relative;border-radius:10px;overflow:hidden;background:#eceaf5;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;text-align:center;font-size:.72rem;color:var(--mu);padding:.2rem}' +
    '.sm-th img,.sm-th video{width:100%;height:100%;object-fit:cover;display:block}.sm-th .x{position:absolute;top:3px;right:3px;width:26px;height:26px;border-radius:50%;border:0;background:rgba(0,0,0,.65);color:#fff;font-size:15px;line-height:1;cursor:pointer}' +
    '.sm-th .tag{position:absolute;left:3px;bottom:3px;background:rgba(0,0,0,.65);color:#fff;border-radius:6px;padding:0 .35rem;font-size:.68rem}' +
    '.sm-pick{display:inline-block;cursor:pointer}.sm-pick input{position:absolute;opacity:0;width:1px;height:1px}.sm-chk{display:flex;align-items:center;gap:.5rem;margin:.6rem 0 0;font-weight:600}.sm-chk input{width:20px;height:20px}' +
    '.sm-st{margin:.6rem 0 0;font-size:.92rem;color:var(--mu)}.sm .acts .btn{flex:1 1 120px}';
  if (!D.getElementById('sm-css')) { var s = h('style'); s.id = 'sm-css'; s.textContent = css; D.head.appendChild(s); }

  /* ---------- files ---------- */
  function info(f) {
    var t = f.type || '', n = String(f.name || '').toLowerCase();
    if (!t) { if (/\.(mp4|m4v)$/.test(n)) t = 'video/mp4'; else if (/\.webm$/.test(n)) t = 'video/webm'; else if (/\.mov$/.test(n)) t = 'video/quicktime'; else if (/\.jpe?g$/.test(n)) t = 'image/jpeg'; else if (/\.png$/.test(n)) t = 'image/png'; else if (/\.webp$/.test(n)) t = 'image/webp'; else if (/\.(heic|heif)$/.test(n)) t = 'image/heic'; }
    return { type: t, video: /^video\//.test(t), image: /^image\//.test(t) };
  }
  function shrink(f, type) {   /* resolves { blob, type, ext, w, h } ; never rejects */
    return new Promise(function (res) {
      var url = URL.createObjectURL(f), im = new Image();
      function keep() { URL.revokeObjectURL(url); res({ blob: f, type: type, ext: OKIMG[type] || 'jpg' }); }
      im.onload = function () {
        var w = im.naturalWidth, hh = im.naturalHeight, k = Math.min(1, MAXPX / Math.max(w, hh)), c = D.createElement('canvas');
        c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(hh * k));
        var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) {
          var okOrig = !!OKIMG[type];
          if (b && (!okOrig || b.size < f.size)) res({ blob: b, type: 'image/jpeg', ext: 'jpg', w: c.width, h: c.height });
          else if (okOrig) res({ blob: f, type: type, ext: OKIMG[type], w: w, h: hh });
          else res({ blob: f, type: type, ext: 'jpg' });
        }, 'image/jpeg', 0.82);
      };
      im.onerror = keep; im.src = url;
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
    return STMAdmin.raw('/storage/v1/object/' + BUCKET + '/' + path, { method: 'POST', headers: { 'Content-Type': it.type, 'x-upsert': 'false' }, body: it.blob }).then(function (r) {
      if (r.ok) return;
      return r.text().then(function (t) {
        var m = ''; try { m = JSON.parse(t).message || ''; } catch (e) {}
        var e = new Error(r.status === 401 ? 'expired' : (m || 'Upload failed (' + r.status + ')')); e.status = r.status; throw e;
      });
    });
  }
  function removeObjects(paths) { return Promise.all(paths.map(function (p) { return STMAdmin.raw('/storage/v1/object/' + BUCKET + '/' + p, { method: 'DELETE' }).catch(function () {}); })); }
  function human(e) {
    if (!e) return 'Something went wrong.';
    if (e.message === 'expired' || e.status === 401) return 'Your session expired. Refresh the page and sign in again.';
    if (e.status === 403 || /row-level security|policy/i.test(e.message)) return 'You do not have staff access to upload. Ask an admin to add your email to the staff table.';
    if (e.status === 413 || /too large|exceeded/i.test(e.message)) return 'That file is too large. The limit is 50 MB per file.';
    return e.message || 'Something went wrong.';
  }

  /* ---------- composer ---------- */
  function composer(list) {
    var c = h('div', 'card sm');
    c.appendChild(h('div', 'ref', 'New photo or video post'));
    c.appendChild(h('p', 'meta', 'Show clients your work. Photos are shrunk automatically. Videos can be MP4, WebM or MOV up to 50 MB.'));
    var row = h('div', 'sm-row');
    var f1 = h('label', 'fld'); f1.appendChild(h('span', null, 'Service')); var sv = h('select'); sv.appendChild(new Option('General (all services)', ''));
    slugs.forEach(function (s) { sv.appendChild(new Option(names[s], s)); }); f1.appendChild(sv);
    var f2 = h('label', 'fld'); f2.appendChild(h('span', null, 'Type')); var kd = h('select'); KINDS.forEach(function (k) { kd.appendChild(new Option(k[1], k[0])); }); f2.appendChild(kd);
    row.appendChild(f1); row.appendChild(f2); c.appendChild(row);
    var f3 = h('label', 'fld'); f3.appendChild(h('span', null, 'Title')); var ti = h('input'); ti.type = 'text'; ti.maxLength = 140; ti.placeholder = 'e.g. Bed bug treatment, Kilimani apartment'; f3.appendChild(ti); c.appendChild(f3);
    var f4 = h('label', 'fld'); f4.appendChild(h('span', null, 'Town (optional)')); var tw = h('input'); tw.type = 'text'; tw.maxLength = 80; tw.placeholder = 'e.g. Nairobi'; f4.appendChild(tw); c.appendChild(f4);
    var f5 = h('label', 'fld'); f5.appendChild(h('span', null, 'Message (optional)')); var bd = h('textarea'); bd.maxLength = 2000; f5.appendChild(bd); c.appendChild(f5);
    var pick = h('label', 'btn alt sm sm-pick', 'Add photos or videos'); var fi = h('input'); fi.type = 'file'; fi.multiple = true; fi.accept = 'image/*,video/mp4,video/webm,video/quicktime'; pick.appendChild(fi);
    var pw = h('div'); pw.style.marginTop = '.8rem'; pw.appendChild(pick); c.appendChild(pw);
    var pv = h('div', 'sm-prev'); c.appendChild(pv);
    var ck1 = h('label', 'sm-chk'); var pubC = h('input'); pubC.type = 'checkbox'; pubC.checked = true; ck1.appendChild(pubC); ck1.appendChild(D.createTextNode('Publish now (untick to save as hidden)')); c.appendChild(ck1);
    var ck2 = h('label', 'sm-chk'); var pinC = h('input'); pinC.type = 'checkbox'; ck2.appendChild(pinC); ck2.appendChild(D.createTextNode('Pin to the top')); c.appendChild(ck2);
    var er = h('div', 'err'); er.hidden = true; c.appendChild(er);
    var st = h('div', 'sm-st'); st.hidden = true; c.appendChild(st);
    var a = h('div', 'acts'); var go = h('button', 'btn', 'Post'); go.type = 'button'; a.appendChild(go); c.appendChild(a);

    function showErr(m) { er.textContent = m || ''; er.hidden = !m; }
    function draw() {
      pv.textContent = '';
      files.forEach(function (f, i) {
        var t = h('div', 'sm-th'), n = info(f);
        if (n.image && /^(image\/jpeg|image\/png|image\/webp)$/.test(n.type)) { var im = new Image(); im.alt = ''; im.src = URL.createObjectURL(f); im.onload = function () { URL.revokeObjectURL(im.src); }; t.appendChild(im); }
        else t.appendChild(D.createTextNode((n.video ? '\uD83C\uDFAC ' : '\uD83D\uDDBC ') + f.name));
        t.appendChild(h('span', 'tag', n.video ? 'Video ' + mb(f.size) : 'Photo'));
        var x = h('button', 'x', '\u00d7'); x.type = 'button'; x.setAttribute('aria-label', 'Remove'); x.onclick = function () { if (busy) return; files.splice(i, 1); draw(); }; t.appendChild(x); pv.appendChild(t);
      });
    }
    fi.onchange = function () {
      showErr(''); var bad = [];
      [].forEach.call(fi.files, function (f) {
        var n = info(f);
        if (files.length >= MAXF) { bad.push('Only ' + MAXF + ' files per post.'); return; }
        if (n.video) { if (!OKVID[n.type]) { bad.push(f.name + ': use MP4, WebM or MOV.'); return; } if (f.size > MAXVID) { bad.push(f.name + ' is ' + mb(f.size) + '. Videos must be under 50 MB.'); return; } }
        else if (!n.image) { bad.push(f.name + ' is not a photo or video.'); return; }
        files.push(f);
      });
      fi.value = ''; draw(); if (bad.length) showErr(bad.filter(function (x, i) { return bad.indexOf(x) === i; }).join(' '));
    };
    go.onclick = function () {
      if (busy) return; showErr('');
      var title = ti.value.trim();
      if (title.length < 2) { showErr('Add a short title (at least 2 characters).'); ti.focus(); return; }
      if (!files.length && !bd.value.trim()) { showErr('Add at least one photo or video, or write a message.'); return; }
      busy = true; go.disabled = true; st.hidden = false;
      var slug = sv.value || null, up = [], media = [], i = 0;
      function step() {
        if (i >= files.length) return Promise.resolve();
        var f = files[i]; st.textContent = 'Uploading ' + (i + 1) + ' of ' + files.length + '...';
        return prepare(f).then(function (it) {
          var path = mkPath(slug, it.ext);
          return upload(it, path).then(function () {
            up.push(path); var m = { url: pubUrl(path), type: it.video ? 'video' : 'image', name: String(f.name || '').slice(0, 80) };
            if (it.w) { m.w = it.w; m.h = it.h; } media.push(m); i++; return step();
          });
        });
      }
      step().then(function () {
        st.textContent = 'Saving post...';
        return api('/rest/v1/service_posts?select=id', { method: 'POST', headers: { Prefer: 'return=representation' }, body: { service_slug: slug, kind: kd.value, title: title, body: bd.value.trim() || null, town: tw.value.trim() || null, media: media, published: pubC.checked, pinned: pinC.checked, created_by: STMAdmin.email() || null } });
      }).then(function (r) {
        if (!r.ok) { var e = new Error('Could not save the post. Run setup-services-admin.sql in Supabase and check you are staff.'); e.status = r.status; throw e; }
        files = []; draw(); ti.value = ''; tw.value = ''; bd.value = ''; pinC.checked = false; pubC.checked = true;
        note('Posted: ' + title, true); return loadPosts(list);
      }).catch(function (e) {
        showErr(human(e)); if (up.length) return removeObjects(up);
      }).then(function () { busy = false; go.disabled = false; st.hidden = true; });
    };
    return c;
  }

  /* ---------- existing posts ---------- */
  function patch(p, fields, b, list) {
    b.disabled = true;
    api('/rest/v1/service_posts?id=eq.' + encodeURIComponent(p.id) + '&select=id', { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: Object.assign({ updated_at: new Date().toISOString() }, fields) })
      .then(function (r) { if (!r.ok) throw r.status; return r.json(); })
      .then(function (j) { if (!j.length) throw 0; Object.assign(p, fields); paint(list); note('Saved.', true); })
      .catch(function () { b.disabled = false; note('Could not save. You may not have staff access.', false); });
  }
  function remove(p, list) {
    api('/rest/v1/service_posts?id=eq.' + encodeURIComponent(p.id) + '&select=id', { method: 'DELETE', headers: { Prefer: 'return=representation' } })
      .then(function (r) { if (!r.ok) throw r.status; return r.json(); })
      .then(function (j) {
        if (!j.length) throw 0;
        var paths = (p.media || []).map(function (m) { return pathOf(m.url); }).filter(Boolean); posts = posts.filter(function (x) { return x.id !== p.id; }); paint(list); note('Post deleted.', true);
        return removeObjects(paths);
      }).catch(function () { note('Could not delete. You may not have staff access.', false); });
  }
  function card(p, list) {
    var c = h('div', 'card sm'), top = h('div', 'top'), l = h('div');
    l.appendChild(h('div', 'ref', (p.pinned ? '\uD83D\uDCCC ' : '') + p.title)); l.appendChild(h('div', 'when', STMAdmin.fmt(p.created_at) + (p.created_by ? ' \u00b7 ' + p.created_by : '')));
    top.appendChild(l); top.appendChild(h('span', 'badge ' + (p.published ? 'b-paid' : 'b-pending'), p.published ? 'Live' : 'Hidden')); c.appendChild(top);
    function meta(k, v) { if (!v) return; var m = h('div', 'meta'); m.appendChild(h('b', null, k + ': ')); m.appendChild(D.createTextNode(v)); c.appendChild(m); }
    var kn = ''; KINDS.forEach(function (k) { if (k[0] === p.kind) kn = k[1]; });
    meta('Service', p.service_slug ? (names[p.service_slug] || p.service_slug) : 'General'); meta('Type', kn); meta('Town', p.town); meta('Message', p.body);
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
    var b1 = h('button', 'btn alt sm', p.published ? 'Hide' : 'Publish'); b1.type = 'button'; b1.onclick = function () { patch(p, { published: !p.published }, b1, list); }; a.appendChild(b1);
    var b2 = h('button', 'btn alt sm', p.pinned ? 'Unpin' : 'Pin to top'); b2.type = 'button'; b2.onclick = function () { patch(p, { pinned: !p.pinned }, b2, list); }; a.appendChild(b2);
    var b3 = h('button', 'btn no sm', 'Delete'); b3.type = 'button'; b3.onclick = function () { ask('Delete this post?', 'The post and its ' + ms.length + ' photo/video file(s) will be removed from the site. This cannot be undone.', 'Delete', function () { remove(p, list); }); }; a.appendChild(b3);
    c.appendChild(a); return c;
  }
  function paint(list) {
    list.textContent = ''; list.appendChild(h('h3', null, 'Posts (' + posts.length + ')'));
    if (!posts.length) { list.appendChild(h('div', 'empty', 'No posts yet. Your first photo or video post will appear here.')); return; }
    posts.forEach(function (p) { list.appendChild(card(p, list)); });
  }
  function loadPosts(list) {
    return api('/rest/v1/service_posts?select=*&order=pinned.desc,created_at.desc&limit=100').then(function (r) {
      if (r.status === 401) throw new Error('expired'); if (!r.ok) throw new Error('load'); return r.json();
    }).then(function (j) { posts = j; paint(list); }).catch(function (e) {
      list.textContent = ''; list.appendChild(h('div', 'err', e && e.message === 'expired' ? 'Your session expired. Refresh the page and sign in again.' : 'Could not load posts. Run setup-services-admin.sql in Supabase and make sure your email is in the staff table.'));
    });
  }

  window.STMServiceMedia = {
    mount: function (L) {
      box = L; L.textContent = ''; files = []; busy = false;
      var list = h('div'); list.appendChild(h('div', 'empty', 'Loading posts...'));
      getJson('services/services-data.json').then(function (d) {
        names = {}; slugs = [];
        if (d && d.services) d.services.forEach(function (s) { if (s && s.slug) { names[s.slug] = s.name || s.slug; slugs.push(s.slug); } });
        if (!box || !box.isConnected) return;
        L.appendChild(composer(list)); L.appendChild(list); return loadPosts(list);
      });
    }
  };
})();
