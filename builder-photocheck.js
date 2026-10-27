/* Stermont Office: photo-to-item check.
   The most common mistake when posting many items is a photo given to the wrong item (item mismatch). Before the green Post card is built,
   every photo is shown to Gemini together with the item name it was given to, in small batches. Then:
   - a photo that clearly shows a DIFFERENT product or brand: the item is refused and the AI is told what the photo really shows, so it fixes that item and resends only it
   - a photo that is a screenshot of a web page or price list (a source of details, not a product photo): it is left off the item, so another site's page is never posted as a product picture
   - "unsure" or any error in the check: the item goes through as before (the check never blocks work because Gemini was busy)
   Loaded last by builder-quickdesc.js. If this file fails to load, the builder works without the check. */
(function () {
  'use strict';
  var W = window, D = document;
  var BP = W.BuilderProducts; if (!BP || !BP.getPhoto || W.__stmPhotoCheck) return;
  W.__stmPhotoCheck = 1;
  var MODELS = ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-2.5-flash'];
  var BATCH = 5, PARALLEL = 2, WAIT = 50000, MAX_PER_ITEM = 3;

  function norm(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  function key() { var e = D.getElementById('gkey'); return e ? String(e.value || '').trim() : ''; }

  var PROMPT = 'You check product photos for an online shop in Kenya. Below are numbered checks. Each has a product name (and pack size) typed by a shop assistant, followed by ONE picture. ' +
    'For every check decide three things. ' +
    '(1) match: "yes" if the picture shows that product (same kind of product and, when a brand is readable on the picture, the same brand); "no" ONLY if the picture clearly shows a different product, a different brand or a different kind of product; "unsure" if you cannot tell (blurry, brand not visible, packaging partly hidden). A different pack size of the same product is NOT a mismatch. ' +
    '(2) kind: "product_photo" for a photo of a physical product or its packaging; "web_screenshot" for a screenshot of a web page, shop listing, price list, chat or document; "other" for anything else. ' +
    '(3) shows: at most 12 words saying what the picture actually shows, with the brand and product exactly as printed. Do not guess text you cannot read. ' +
    'Answer ONLY with JSON in this shape: [{"check":1,"match":"yes","kind":"product_photo","shows":""}]';

  function ask(model, parts, sig) {
    var body = { contents: [{ role: 'user', parts: parts }], generationConfig: { temperature: 0, responseMimeType: 'application/json' } };
    return fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key() }, body: JSON.stringify(body), signal: sig
    }).then(function (r) {
      if (!r.ok) throw new Error('check error ' + r.status);
      return r.json();
    }).then(function (j) {
      var c = j.candidates && j.candidates[0], t = c && c.content && c.content.parts ? c.content.parts.map(function (p) { return p.text || ''; }).join('') : '';
      t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
      var v = JSON.parse(t.slice(t.indexOf('['), t.lastIndexOf(']') + 1));
      if (!Array.isArray(v)) throw new Error('bad answer');
      return v;
    });
  }
  function runBatch(batch) {
    var parts = [{ text: PROMPT }];
    batch.forEach(function (u, i) {
      parts.push({ text: 'Check ' + (i + 1) + ': product name = "' + u.name + '"' + (u.pack ? ', pack size = "' + u.pack + '"' : '') + ', category = "' + u.cat + '"' });
      parts.push({ inlineData: { mimeType: u.photo.mime, data: u.photo.data } });
    });
    var m = 0;
    function go() {
      var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, WAIT);
      return ask(MODELS[m], parts, ctl.signal).then(function (v) { clearTimeout(t); return v; }, function (e) {
        clearTimeout(t);
        if (++m < MODELS.length) return go();
        throw e;
      });
    }
    return go().then(function (v) {
      v.forEach(function (x) { var u = batch[(parseInt(x && x.check, 10) || 0) - 1]; if (u) { u.match = String(x.match || '').toLowerCase(); u.kind = String(x.kind || '').toLowerCase(); u.shows = String(x.shows || '').slice(0, 120); u.done = true; } });
    });
  }
  function pool(jobs, n) {
    var next = 0, failed = 0;
    function worker() {
      if (next >= jobs.length) return Promise.resolve();
      var j = jobs[next++];
      return runBatch(j).then(null, function () { failed++; }).then(worker);
    }
    var ws = []; for (var i = 0; i < Math.min(n, jobs.length); i++) ws.push(worker());
    return Promise.all(ws).then(function () { return failed; });
  }

  var orig = BP.tools.post_products;
  BP.tools.post_products = function (a) {
    a = a || {};
    var list = Array.isArray(a.items) ? a.items : [];
    if (!list.length || !key()) return orig(a);
    /* one check per distinct (product name, photo): packs of the same product share the same photos and are checked once */
    var units = [], byKey = {};
    list.forEach(function (it) {
      if (!it) return;
      var nums = (Array.isArray(it.photos) ? it.photos : [it.photo]).map(Number).filter(function (n) { return n > 0; }).slice(0, MAX_PER_ITEM);
      nums.forEach(function (n) {
        var p = BP.getPhoto(n), k = norm(it.name) + '#' + n;
        if (!p || p.bad || !p.data || !it.name || byKey[k]) return;
        byKey[k] = { n: n, name: String(it.name).slice(0, 120), pack: '', cat: String(it.category || '').slice(0, 60), photo: p };
        units.push(byKey[k]);
      });
    });
    if (!units.length) return orig(a);
    var jobs = []; for (var i = 0; i < units.length; i += BATCH) jobs.push(units.slice(i, i + BATCH));
    return pool(jobs, PARALLEL).then(function (failed) {
      var rejected = [], dropped = [], kept = [], unchecked = units.filter(function (u) { return !u.done; }).length;
      list.forEach(function (it) {
        if (!it) return;
        var nums = (Array.isArray(it.photos) ? it.photos : [it.photo]).map(Number).filter(function (n) { return n > 0; });
        var bad = null, goodNums = [];
        nums.forEach(function (n) {
          var u = byKey[norm(it.name) + '#' + n];
          if (!u || !u.done) { goodNums.push(n); return; }
          if (u.kind === 'web_screenshot') { dropped.push('Photo ' + n + ' (a screenshot of a web page or list, not a product photo) was left off "' + it.name + '"'); return; }
          if (u.match === 'no' && !bad) { bad = 'Photo ' + n + ' shows "' + (u.shows || 'a different product') + '", which does not match "' + it.name + '". Look at the photo again: fix the name or category if you misread it, or use the photo that really shows this product, then resend only this item'; }
          goodNums.push(n);
        });
        if (bad) { rejected.push({ item: it.name || 'item', problem: bad }); return; }
        var c = {}; Object.keys(it).forEach(function (k) { c[k] = it[k]; });
        c.photos = goodNums; delete c.photo; kept.push(c);
      });
      function note(r) {
        r = r || {};
        r.photo_check = 'Checked ' + (units.length - unchecked) + ' of ' + units.length + ' photo(s) against their items.' + (failed || unchecked ? ' Some photos could not be checked (Gemini busy), so look at the thumbnails on the green card.' : '') + (dropped.length ? ' ' + dropped.join('. ') + '.' : '');
        if (rejected.length) r.needs_attention = (r.needs_attention || []).concat(rejected);
        return r;
      }
      if (!kept.length) return note({ card_shown: false, note: 'No item was added because every photo failed the match check. Fix the items listed in needs_attention and resend only those.' });
      var a2 = {}; Object.keys(a).forEach(function (k) { a2[k] = a[k]; }); a2.items = kept;
      return orig(a2).then(note);
    }, function () { return orig(a); });
  };
  BP.decls.forEach(function (d) {
    if (d.name !== 'post_products') return;
    d.description += ' PHOTO CHECK: every photo is compared with the item it was given to. An item whose photo clearly shows a different product comes back in needs_attention with what the photo really shows; fix only those items and resend them. Screenshots of web pages or price lists are never used as item photos.';
  });
})();
