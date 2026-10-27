/* Stermont Office: attach photos, screenshots, PDFs and text/code files.
   Loaded by builder.html. Adds a paperclip button, previews, and gives the builder the parts to send to Gemini.
   If this file fails to load, the builder keeps working without attachments. */
(function () {
  'use strict';
  var W = window, D = document;
  /* 30 files per message (was 12) so one upload can post 15 or more shop items in a single go. The size cap stays under Gemini's 20 MB request limit. */
  var MAX_FILES = 30, MAX_BYTES = 18 * 1024 * 1024, MAX_PDF = 6 * 1024 * 1024, MAX_RAW_IMG = 1200 * 1024, MAX_HEIC = 4 * 1024 * 1024, MAX_SIDE = 1600, MAX_TEXT = 60000;
  var TEXT_EXT = /\.(txt|md|markdown|json|csv|tsv|log|js|mjs|cjs|ts|tsx|jsx|css|scss|html?|xml|svg|sql|ya?ml|toml|ini|sh|py|php|rb|go|java|c|h|cpp|cs|rs|vue|conf|diff|patch)$/i;
  var IMG_EXT = /\.(png|jpe?g|webp|gif|heic|heif)$/i;
  var NOGO_NAME = /(^|\/)\.env(\.|$)|\.(pem|key|p12|pfx)$/i;
  var SECRET = /(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AIza[0-9A-Za-z_-]{30,}|sk-[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/;
  var items = [], pending = 0, tray = null, errTimer = 0;

  function kindOf(f) {
    var t = String(f.type || '').toLowerCase(), n = String(f.name || '');
    if (NOGO_NAME.test(n)) return 'secret';
    if (/svg/.test(t) || /\.svg$/i.test(n)) return 'text';
    if (/^image\//.test(t) || IMG_EXT.test(n)) return 'image';
    if (t === 'application/pdf' || /\.pdf$/i.test(n)) return 'pdf';
    if (/^text\//.test(t) || /(json|xml|javascript|x-sh|yaml|sql)/.test(t) || TEXT_EXT.test(n)) return 'text';
    return '';
  }
  function readURL(f) { return new Promise(function (ok, no) { var r = new FileReader(); r.onload = function () { ok(String(r.result)); }; r.onerror = function () { no(new Error('it could not be read')); }; r.readAsDataURL(f); }); }
  function readText(f) { return new Promise(function (ok, no) { var r = new FileReader(); r.onload = function () { ok(String(r.result)); }; r.onerror = function () { no(new Error('it could not be read')); }; r.readAsText(f); }); }
  function loadImg(url) { return new Promise(function (ok, no) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = function () { no(new Error('decode')); }; i.src = url; }); }
  function thumbOf(img, w, h) {
    var s = Math.min(1, 140 / Math.max(w, h)), c = D.createElement('canvas'), x;
    c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(h * s));
    x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.7);
  }

  /* big phone photos are shrunk so they upload fast and fit Gemini's limits; small screenshots are sent untouched */
  function prepImage(f) {
    return readURL(f).then(function (url) {
      var t = String(f.type || '').toLowerCase();
      return loadImg(url).then(function (img) {
        var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
        if (!w || !h) throw new Error('it could not be opened as a picture');
        var sc = Math.min(1, MAX_SIDE / Math.max(w, h)), th = thumbOf(img, w, h);
        if (sc === 1 && f.size <= MAX_RAW_IMG && /^image\/(png|jpeg|webp)$/.test(t)) return { mime: t, data: url.split(',')[1], thumb: th };
        var c = D.createElement('canvas'), x;
        c.width = Math.max(1, Math.round(w * sc)); c.height = Math.max(1, Math.round(h * sc));
        x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        return { mime: 'image/jpeg', data: c.toDataURL('image/jpeg', 0.86).split(',')[1], thumb: th };
      }, function () {
        if (/^image\/(heic|heif)$/i.test(t) || /\.(heic|heif)$/i.test(f.name || '')) {
          if (f.size > MAX_HEIC) throw new Error('this photo type is too big. Share it as JPG or take a screenshot of it');
          return { mime: /heif/i.test(t) || /\.heif$/i.test(f.name || '') ? 'image/heif' : 'image/heic', data: url.split(',')[1], thumb: null };
        }
        throw new Error('it could not be opened as a picture');
      });
    });
  }
  function prepPdf(f) {
    if (f.size > MAX_PDF) return Promise.reject(new Error('the PDF is over 6 MB'));
    return readURL(f).then(function (url) { return { mime: 'application/pdf', data: url.split(',')[1], thumb: null }; });
  }
  function prepText(f) {
    return readText(f).then(function (s) {
      if (s.indexOf('\u0000') >= 0) throw new Error('it is not a text file');
      if (SECRET.test(s)) throw new Error('it contains what looks like a secret key. Remove the key first');
      var cut = false;
      if (s.length > MAX_TEXT) { s = s.slice(0, 40000) + '\n...[middle of the file cut]...\n' + s.slice(-20000); cut = true; }
      return { text: s, cut: cut, thumb: null };
    });
  }
  function sizeOf(r) { return r.data ? r.data.length : r.text.length; }
  function total() { var n = 0; items.forEach(function (it) { n += sizeOf(it); }); return n; }

  function showErr(t) {
    var e = D.getElementById('aerr'); if (!e) return;
    e.textContent = t; e.hidden = !t; render();
    clearTimeout(errTimer); if (t) errTimer = setTimeout(function () { var x = D.getElementById('aerr'); if (x) { x.textContent = ''; x.hidden = true; render(); } }, 9000);
  }
  function render() {
    if (!tray) return;
    var keep = D.getElementById('aerr'), err = keep && !keep.hidden ? keep.textContent : '';
    tray.innerHTML = '';
    items.forEach(function (it, i) {
      var c = D.createElement('div'); c.className = 'ach';
      if (it.thumb) { var im = D.createElement('img'); im.src = it.thumb; im.alt = ''; c.appendChild(im); }
      else { var ic = D.createElement('div'); ic.className = 'ico'; ic.textContent = it.kind === 'pdf' ? '\uD83D\uDCD5' : it.kind === 'image' ? '\uD83D\uDDBC' : '\uD83D\uDCC4'; c.appendChild(ic); }
      var n = D.createElement('span'); n.className = 'n'; n.textContent = it.name; c.appendChild(n);
      var x = D.createElement('button'); x.type = 'button'; x.textContent = '\u00D7'; x.setAttribute('aria-label', 'Remove ' + it.name);
      x.onclick = function () { items.splice(i, 1); render(); };
      c.appendChild(x); tray.appendChild(c);
    });
    if (pending > 0) { var p = D.createElement('span'); p.className = 'n'; p.textContent = 'Getting your file ready...'; tray.appendChild(p); }
    var e = D.createElement('div'); e.id = 'aerr'; e.textContent = err; e.hidden = !err; tray.appendChild(e);
    tray.hidden = !items.length && pending === 0 && !err;
    if (D.body) D.body.style.paddingBottom = tray.hidden ? '' : '260px';
  }

  function add(fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    if (!files.length) return Promise.resolve();
    var errs = [], chain = Promise.resolve();
    pending += files.length; render();
    files.forEach(function (f) {
      chain = chain.then(function () {
        if (items.length >= MAX_FILES) throw new Error('you can attach up to ' + MAX_FILES + ' files at once');
        var k = kindOf(f);
        if (k === 'secret') throw new Error('it looks like a keys file, so it was not attached');
        if (!k) throw new Error('this file type is not supported. Use a photo, screenshot, PDF, or text or code file');
        return (k === 'image' ? prepImage(f) : k === 'pdf' ? prepPdf(f) : prepText(f)).then(function (r) {
          r.kind = k; r.name = f.name || (k === 'image' ? 'photo' : 'file');
          if (total() + sizeOf(r) > MAX_BYTES) throw new Error('the attachments would be too big. Remove one first');
          items.push(r);
        });
      }).catch(function (e) { errs.push((f.name || 'file') + ' was not added: ' + String(e && e.message || e) + '.'); })
        .then(function () { pending--; render(); });
    });
    return chain.then(function () { if (errs.length) showErr(errs.join(' ')); });
  }

  /* hands the builder everything it needs for one message, and empties the tray */
  function take() {
    if (!items.length) return null;
    var parts = [], names = [], thumbs = [];
    items.forEach(function (it, i) {
      names.push(it.name); if (it.thumb) thumbs.push(it.thumb);
      if (it.kind === 'text') parts.push({ text: '[Attached file: ' + it.name + (it.cut ? ' (long file, the middle was cut)' : '') + ']\n' + it.text + '\n[End of ' + it.name + ']' });
      else { parts.push({ text: '[Attached ' + (it.kind === 'pdf' ? 'PDF' : 'photo') + ' ' + (i + 1) + ': ' + it.name + ']' }); parts.push({ inlineData: { mimeType: it.mime, data: it.data } }); }
    });
    var att = { parts: parts, names: names, thumbs: thumbs, items: items, label: '\n\uD83D\uDCCE ' + names.join(', ') };
    items = []; render(); return att;
  }
  function restore(att) { if (!att || !att.items) return; items = att.items.concat(items).slice(0, MAX_FILES); render(); }
  function renderMsg(el, att) {
    if (!el || !att || !att.thumbs || !att.thumbs.length) return;
    var d = D.createElement('div'); d.style.cssText = 'display:flex;gap:.3rem;flex-wrap:wrap;margin-top:.4rem';
    att.thumbs.forEach(function (s) { var i = D.createElement('img'); i.src = s; i.alt = 'attached photo'; i.style.cssText = 'height:72px;width:auto;max-width:120px;border-radius:8px;border:1px solid rgba(255,255,255,.5);object-fit:cover'; d.appendChild(i); });
    el.appendChild(d);
  }

  /* pictures are only kept in the chat history for the message they belong to (and the next follow-up), so requests stay small and saved chats never fill up the phone */
  function hasMedia(h) { return !!(h && h.role === 'user' && h.parts && h.parts.some(function (p) { return p.inlineData; })); }
  function plain(p) { return p.inlineData ? { text: '(file from an earlier message, no longer included)' } : p; }
  function stripOld(hist, keepRecent) {
    var keep = -1, i;
    if (keepRecent) for (i = hist.length - 1; i >= 0; i--) if (hasMedia(hist[i])) { keep = i; break; }
    hist.forEach(function (h, j) { if (j !== keep && hasMedia(h)) h.parts = h.parts.map(plain); });
  }
  function safeHist(hist) { return hist.map(function (h) { return hasMedia(h) ? { role: h.role, parts: h.parts.map(plain) } : h; }); }

  function build() {
    var bar = D.getElementById('bar'), inn = bar && bar.querySelector('.in'), ta = D.getElementById('inp');
    if (!bar || !inn || !ta || D.getElementById('bAtt')) return;
    var st = D.createElement('style');
    st.textContent = '#atray{max-width:860px;margin:0 auto .4rem;display:flex;gap:.4rem;flex-wrap:wrap;align-items:center}' +
      '.ach{display:flex;align-items:center;gap:.3rem;border:1px solid var(--ln);border-radius:10px;background:var(--pl);padding:.2rem .3rem .2rem .2rem;max-width:100%}' +
      '.ach img{width:40px;height:40px;object-fit:cover;border-radius:6px}' +
      '.ach .ico{width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:1.3rem}' +
      '#atray .n{font-size:.8rem;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--mu)}' +
      '.ach button{padding:0 .45rem;font-size:1.1rem;line-height:1.5;border-radius:8px}' +
      '#aerr{font-size:.8rem;color:var(--no);width:100%}' +
      '#bAtt{height:44px;min-width:44px;padding:0 .5rem;font-size:1.25rem;line-height:1}';
    D.head.appendChild(st);
    tray = D.createElement('div'); tray.id = 'atray'; tray.hidden = true; bar.insertBefore(tray, inn);
    var btn = D.createElement('button'); btn.type = 'button'; btn.id = 'bAtt'; btn.title = 'Attach photos or files'; btn.setAttribute('aria-label', 'Attach photos or files'); btn.textContent = '\uD83D\uDCCE';
    var fi = D.createElement('input'); fi.type = 'file'; fi.multiple = true; fi.hidden = true;
    fi.accept = 'image/*,application/pdf,text/*,.txt,.md,.json,.csv,.log,.js,.mjs,.css,.html,.htm,.xml,.svg,.sql,.yml,.yaml,.ts,.tsx,.jsx,.py,.php,.sh';
    btn.onclick = function () { fi.value = ''; fi.click(); };
    fi.onchange = function () { add(fi.files); };
    inn.insertBefore(btn, ta); inn.appendChild(fi);
    ta.addEventListener('paste', function (e) {
      var cd = e.clipboardData, fl = [], i;
      if (cd && cd.items) for (i = 0; i < cd.items.length; i++) { if (cd.items[i].kind === 'file') { var f = cd.items[i].getAsFile(); if (f) fl.push(f); } }
      if (fl.length) { if (!cd.getData('text/plain')) e.preventDefault(); add(fl); }
    });
    D.addEventListener('dragover', function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) e.preventDefault(); });
    D.addEventListener('drop', function (e) { var fl = e.dataTransfer && e.dataTransfer.files; if (fl && fl.length) { e.preventDefault(); add(fl); } });
  }

  W.BuilderAttach = {
    add: add, take: take, restore: restore, render: renderMsg, stripOld: stripOld, safeHist: safeHist,
    has: function () { return items.length > 0; }, busy: function () { return pending > 0; },
    _t: { kindOf: kindOf, SECRET: SECRET, setItems: function (a) { items = a; } }
  };
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', build); else build();
  /* keeps the builder going when the free AI limit is hit (optional: the builder works without it) */
  try { var bs = D.createElement('script'); bs.src = '/builder-boost.js?v=4'; bs.async = true; (D.head || D.documentElement).appendChild(bs); } catch (e) {}
})();
