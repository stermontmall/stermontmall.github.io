/* Stermont AI Builder: list shop items, post new products from attached photos, edit live products, and start a fresh chat.
   Loaded by builder.html after builder-attach.js. Uses the same admin sign-in as /admin.html on this device.
   New items: the AI prepares them, the owner taps Post on a green card in the chat, then they go into the shop (Supabase).
   Existing items: update_products saves straight to the shop (no card), because the owner asked for it. Old values are kept in a backup on this device.
   Description length is enforced by the tools: at least 300 words by default, or whatever minimum and maximum the owner asks for.
   new_chat: clears the saved chat and reloads the builder so it starts fresh on the newest code. The header New chat button does the same.
   More tools live in their own files (see the end of this file), so new tools can be added without touching this one.
   If this file fails to load, the builder keeps working without these tools. */
(function () {
  'use strict';
  var W = window, D = document;
  var SB = 'https://oewvtbnmyombbtggamor.supabase.co', KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7', SK = 'stm_admin_session', BK = 'stm_builder_backup_v1', CHATKEY = 'stm_builder_chat_v1';
  var UNITS = ['g', 'kg', 'tonne', 'ml', 'litre', 'piece', 'pair', 'dozen', 'set', 'bundle', 'pack', 'bag', '50 kg bag', 'bottle', 'carton', 'box', 'crate', 'sachet', 'tin', 'metre', 'roll'];
  /* the owner's standard settings, same as /list-products.html: price = cost + 30% (at least KSh 150), rounded up to KSh 50 */
  var DEF = { pm: 30, mode: 'cost', dmin: 6, dmax: 12, disc: true, stock: 1000, low: 20, feat: true };
  var MINW = 300; /* default minimum words for a product description */
  var H = { busy: function () { return false; }, note: function () {}, say: function () {} };
  var photos = {}, queue = [], cats = [], shop = [], card = null, renewing = null;

  function h(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function slug(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function norm(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  function str(v, n) { return String(v == null ? '' : v).replace(/[ \t]+/g, ' ').trim().slice(0, n); }
  function num(v) { v = parseFloat(String(v == null ? '' : v).replace(/[^0-9.]/g, '')); return v > 0 ? Math.round(v) : 0; }
  function money(n) { return 'KSh ' + Math.round(Number(n) || 0).toLocaleString('en-KE'); }
  function down() { try { W.scrollTo(0, D.body.scrollHeight); } catch (e) {} }
  function words(t) { t = String(t == null ? '' : t).trim(); return t ? t.split(/\s+/).length : 0; }
  /* minimum and maximum words: the owner's numbers if given (0 turns a limit off), otherwise at least 300 and no maximum */
  function range(lo, hi) { return { min: lo != null ? Math.max(0, parseInt(lo, 10) || 0) : MINW, max: Math.max(0, parseInt(hi, 10) || 0) }; }
  function lengthProblem(text, r) {
    var w = words(text);
    if (r.min && w < r.min) return 'description has ' + w + ' words but needs at least ' + r.min + '. Write a longer, useful description and send it again';
    if (r.max && w > r.max) return 'description has ' + w + ' words but must be at most ' + r.max + '. Shorten it and send it again';
    return '';
  }

  /* ---------- fresh start: clear the saved chat and reload the builder ---------- */
  function wipeChat() {
    try { localStorage.removeItem(CHATKEY); } catch (e) {}
    try { sessionStorage.removeItem(CHATKEY); } catch (e) {}
  }
  function reloadSoon(ms) { setTimeout(function () { try { W.location.reload(); } catch (e) {} }, ms); }
  /* tool for the AI. The turn that called it would normally save the chat again when it ends, so the chat is wiped once more as the page unloads */
  function freshStart() {
    wipeChat();
    W.addEventListener('pagehide', wipeChat);
    reloadSoon(300);
    return { ok: true, note: 'The chat is cleared and the builder is reloading on the newest code. Changes that were waiting to be published are kept. The page reloads in a moment, so reply with at most one short sentence such as "Starting fresh..." and nothing more.' };
  }
  /* the header New chat button: the builder clears the chat itself (it does nothing while the AI is working); this then reloads so the newest code is used.
     The task queue sets __stmNoReload when it clears a long chat between two tasks, because that must not reload the page. */
  (function () {
    var b = D.getElementById('bNew'); if (!b) return;
    b.addEventListener('click', function () { if (H.busy() || W.__stmNoReload) return; reloadSoon(150); });
  })();

  /* ---------- standard settings and prices (same method as the admin Catalog) ---------- */
  function settings(a) {
    a = a || {};
    function n(v, d, lo, hi) { v = parseFloat(v); return v >= lo && v <= hi ? v : d; }
    var s = { pm: n(a.profit_percent, DEF.pm, 0, 500), mode: a.profit_mode === 'margin' || a.profit_mode === 'cost' ? a.profit_mode : DEF.mode, disc: typeof a.show_previous_price === 'boolean' ? a.show_previous_price : DEF.disc,
      stock: Math.round(n(a.stock, DEF.stock, 0, 1000000)), low: Math.round(n(a.low_stock_alert, DEF.low, 0, 100000)), feat: typeof a.featured === 'boolean' ? a.featured : DEF.feat };
    var lo = n(a.discount_min, DEF.dmin, 0, 90), hi = n(a.discount_max, DEF.dmax, 0, 90);
    s.dmin = Math.min(lo, hi); s.dmax = Math.max(lo, hi);
    return s;
  }
  function auto(c, o) {
    c = Number(c); if (!(c > 0)) return 0;
    var t = o.mode === 'margin' && o.pm < 95 ? Math.max(c / (1 - o.pm / 100), c + 150) : c + Math.max(c * o.pm / 100, 150);
    return Math.ceil(t / 50 - 1e-9) * 50;
  }
  function autoOld(price, d) { return price > 0 && d > 0 ? Math.ceil(price / (1 - d / 100) / 10) * 10 : 0; }

  /* ---------- admin sign-in (re-uses the Admin console login on this device) ---------- */
  var SIGNED_OUT = 'The owner is signed out of the Admin console on this device. Tell them to open /admin.html, sign in, then come back here and ask again (or tap Post).';
  function tok() {
    var s; try { s = JSON.parse(localStorage.getItem(SK)); } catch (e) {}
    if (!s || !s.access_token) return Promise.reject(new Error(SIGNED_OUT));
    if (Date.now() < s.exp) return Promise.resolve(s.access_token);
    if (!renewing) {
      renewing = fetch(SB + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: s.refresh_token }) }).then(function (r) {
        if (!r.ok) throw new Error('The admin session expired. Tell the owner to open /admin.html, sign in again, then come back here.');
        return r.json();
      }).then(function (j) {
        s.access_token = j.access_token; s.refresh_token = j.refresh_token; s.exp = Date.now() + (j.expires_in || 3600) * 1000 - 60000;
        try { localStorage.setItem(SK, JSON.stringify(s)); } catch (e) {}
        renewing = null; return s.access_token;
      }, function (e) { renewing = null; throw e; });
    }
    return renewing;
  }
  function api(path, method, body, prefer, anon) {
    return (anon ? Promise.resolve('') : tok()).then(function (t) {
      var hd = { apikey: KEY };
      if (t) hd.Authorization = 'Bearer ' + t;
      if (body !== undefined) hd['Content-Type'] = 'application/json';
      if (prefer) hd.Prefer = prefer;
      return fetch(SB + path, { method: method || 'GET', headers: hd, body: body !== undefined ? JSON.stringify(body) : undefined });
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (x) { var m = x; try { m = JSON.parse(x).message || x; } catch (e) {} throw new Error(String(m).slice(0, 220)); });
      return r.text().then(function (tx) { return tx ? JSON.parse(tx) : null; });
    });
  }
  function loadCats(anon) {
    return api('/rest/v1/categories?select=id,name,slug&order=name', 'GET', undefined, '', anon).then(function (r) { cats = r || []; return cats; });
  }
  function loadShop() {
    return Promise.all([loadCats(false), api('/rest/v1/products?select=id,name,variant_group,variant_label&limit=3000')]).then(function (r) { shop = r[1] || []; });
  }
  function findCat(name) { var n = norm(name); return n ? cats.filter(function (c) { return norm(c.name) === n; })[0] || null : null; }
  function hasId(id) { return shop.some(function (p) { return p.id === id; }); }

  /* ---------- photos attached in the chat (numbered like the AI sees them: Photo 1, Photo 2 ...) ---------- */
  function setPhotos(att) {
    if (!att || !att.items) return;
    var m = {}, any = false;
    att.items.forEach(function (it, i) {
      if (it.kind === 'image' && it.data) { m[i + 1] = { name: it.name, mime: it.mime, data: it.data, thumb: it.thumb, bad: /hei[cf]/i.test(it.mime || '') }; any = true; }
    });
    if (any) photos = m;
  }
  function toBlob(p) {
    if (p.blob) return Promise.resolve(p.blob);
    return new Promise(function (ok, no) {
      var im = new Image();
      im.onload = function () {
        var k = Math.min(1, 1600 / Math.max(im.width, im.height)), c = D.createElement('canvas'), x;
        c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
        x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
        c.toBlob(function (b) { if (b) { p.blob = b; ok(b); } else no(new Error('The photo could not be prepared')); }, 'image/jpeg', 0.9);
      };
      im.onerror = function () { no(new Error('The photo could not be opened')); };
      im.src = 'data:' + p.mime + ';base64,' + p.data;
    });
  }
  function upload(p, base) {
    if (p.url) return Promise.resolve(p.url);
    return toBlob(p).then(function (b) {
      return tok().then(function (t) {
        var path = slug(base).slice(0, 60) + '-' + Date.now() + Math.floor(Math.random() * 99) + '.jpg';
        return fetch(SB + '/storage/v1/object/product-images/' + path, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + t, 'Content-Type': 'image/jpeg' }, body: b }).then(function (r) {
          if (!r.ok) throw new Error('Photo upload failed (' + r.status + ')');
          p.url = SB + '/storage/v1/object/public/product-images/' + path; return p.url;
        });
      });
    });
  }
  function uploadAll(q) {
    var urls = [], chain = Promise.resolve();
    q.files.forEach(function (p) { chain = chain.then(function () { return upload(p, q.name); }).then(function (u) { urls.push(u); }); });
    return chain.then(function () { return urls; });
  }
  function catId(name) {
    var c = findCat(name); if (c) return Promise.resolve(c.id);
    return api('/rest/v1/categories?on_conflict=slug', 'POST', { name: name.trim(), slug: slug(name) }, 'resolution=merge-duplicates,return=representation').then(function (r) {
      cats.push({ id: r[0].id, name: name.trim(), slug: slug(name) }); return r[0].id;
    });
  }

  /* ---------- tool: post_products (prepares items and shows the Post card; nothing is live until the owner taps Post) ---------- */
  function prepare(a) {
    a = a || {};
    var list = Array.isArray(a.items) ? a.items : [];
    if (!list.length) throw new Error('items is required: send one entry for every product');
    if (list.length > 100) throw new Error('Send at most 100 products at a time');
    var o = settings(a.settings), rg = range(a.min_description_words, a.max_description_words);
    return loadShop().then(function () {
      var ok = [], problems = [], seen = {};
      list.forEach(function (it, i) {
        it = it || {};
        var m = { name: str(it.name, 120), cat: str(it.category, 60), pack: str(it.pack_size, 30), unit: UNITS.indexOf(it.unit) > -1 ? it.unit : '', cost: num(it.cost), price: num(it.price), old: num(it.old_price),
          desc: String(it.description || '').replace(/^[\s*\-\u2022]+/gm, '').slice(0, 8000).trim(), feat: !!it.featured || o.feat, low: o.low, nums: [], files: [], manual: false };
        var label = m.name || ('item ' + (i + 1)), st = parseInt(it.stock, 10), bad = [], lp;
        m.stock = st >= 0 ? st : o.stock;
        (Array.isArray(it.photos) ? it.photos : [it.photo]).map(Number).forEach(function (n) {
          if (!n) return;
          if (!photos[n]) bad.push('Photo ' + n + ' is not attached (attach it again)');
          else if (photos[n].bad) bad.push('Photo ' + n + ' is a HEIC photo that cannot be posted. Ask the owner to share it as JPG');
          else if (m.nums.indexOf(n) < 0) { m.nums.push(n); m.files.push(photos[n]); }
        });
        if (!m.name) bad.push('needs a product name');
        if (!m.cat) bad.push('needs a category');
        lp = lengthProblem(m.desc, rg); if (lp) bad.push(lp);
        m.manual = m.price > 0;
        if (!m.manual && !(m.cost > 0)) bad.push('needs the cost price (COGS) in KSh from the owner, or the selling price. Never guess it');
        m.price = m.manual ? m.price : auto(m.cost, o);
        m.id = slug(m.name + (m.pack ? ' ' + m.pack : '')) || 'item';
        if (m.name) {
          if (seen[m.id]) bad.push('appears twice in this request (same name and pack size)'); seen[m.id] = 1;
          if (hasId(m.id)) bad.push('is already in the shop (' + m.id + '). Skipped. If it is a different product, change the name or pack size');
          var sib = shop.filter(function (p) { return norm(p.name) === norm(m.name); }), withG = sib.filter(function (p) { return p.variant_group; })[0];
          if (m.pack) { m.group = withG ? withG.variant_group : slug(m.name); if (sib.length && !withG) bad.push('exists in the shop without a pack size. Add the pack size to the existing item in Admin, Catalog first'); }
          else if (sib.length && !hasId(m.id)) bad.push('has the same name as a shop item that has pack sizes. Add a pack size or change the name');
        }
        if (m.old && !(m.old > m.price)) m.old = 0;
        if (!m.old && o.disc && m.price > 0) m.old = autoOld(m.price, Math.round(o.dmin + Math.random() * (o.dmax - o.dmin)));
        m.newCat = !!m.cat && !findCat(m.cat);
        if (bad.length) problems.push({ item: label, problem: bad.join('; ') }); else ok.push(m);
      });
      var ids = {}; ok.forEach(function (m) { ids[m.id] = 1; });
      queue = queue.filter(function (q) { return !ids[q.id]; }).concat(ok);
      drawCard();
      return {
        card_shown: queue.length > 0,
        waiting_for_owner_to_tap_post: queue.map(function (q) { return q.name + (q.pack ? ' ' + q.pack : ''); }),
        prepared: ok.map(function (m) { return { name: m.name, pack_size: m.pack || undefined, category: m.cat, new_category: m.newCat || undefined, selling_price_ksh: m.price, previous_price_ksh: m.old || undefined, stock: m.stock, description_words: words(m.desc), photos: m.files.length, no_photo_warning: m.files.length ? undefined : 'no photo attached' }; }),
        needs_attention: problems,
        categories_in_shop: cats.map(function (c) { return c.name; }),
        note: 'Nothing is in the shop yet. The owner must tap Post on the green card. Items listed in needs_attention were NOT added to the card: fix them yourself when the problem is a description length (rewrite and resend only those items), and ask the owner in one short message only for things you cannot know, such as a cost price.'
      };
    });
  }

  /* ---------- the green Post card ---------- */
  function dropCard() { if (card) { try { card.remove(); } catch (e) {} card = null; } }
  function drawCard() {
    dropCard(); if (!queue.length) return;
    var log = D.getElementById('log'); if (!log) return;
    var d = h('div', 'm pub'), btns = [], st = h('p', 'hint');
    card = d; d.appendChild(h('b', '', 'Ready to post to your shop: ' + queue.length + ' item' + (queue.length === 1 ? '' : 's')));
    var ul = h('ul');
    queue.forEach(function (q) {
      var li = h('li');
      if (q.files[0] && q.files[0].thumb) { var im = D.createElement('img'); im.src = q.files[0].thumb; im.alt = ''; im.style.cssText = 'width:40px;height:40px;object-fit:cover;border-radius:6px;flex:none'; li.appendChild(im); }
      var f = h('span', 'f', q.name + (q.pack ? ' \u00B7 ' + q.pack : '') + ' \u00B7 ' + q.cat + (q.newCat ? ' (new category)' : '') + ' \u00B7 ' + money(q.price) + (q.old ? ' (was ' + money(q.old) + ')' : '') + (q.cost ? ' \u00B7 cost ' + money(q.cost) : '') + ' \u00B7 stock ' + q.stock + ' \u00B7 ' + q.files.length + ' photo' + (q.files.length === 1 ? '' : 's') + ' \u00B7 ' + words(q.desc) + ' words');
      f.style.wordBreak = 'normal'; li.appendChild(f); ul.appendChild(li);
    });
    d.appendChild(ul);
    var row = h('div', 'row'), go = h('button', 'ok', 'Post to my website'), no = h('button', '', 'Not now');
    go.type = 'button'; no.type = 'button'; btns.push(go, no);
    go.onclick = function () { post(btns, st); };
    no.onclick = function () { queue = []; dropCard(); };
    row.appendChild(go); row.appendChild(no); d.appendChild(row);
    st.textContent = 'Nothing is in your shop until you tap Post. Prices come from your standard settings. The shop and Google feed refresh within about 3 hours.'; d.appendChild(st);
    log.appendChild(d); down();
  }
  function one(q) {
    if (hasId(q.id)) return Promise.reject(new Error('already in the shop'));
    return uploadAll(q).then(function (imgs) {
      return catId(q.cat).then(function (cid) {
        var row = { id: q.id, category_id: cid, name: q.name, price: q.price, cost: q.cost, stock: q.stock, low_at: q.low, featured: !!q.feat, active: true, images: imgs };
        if (q.desc) row.description = q.desc; if (q.old) row.old_price = q.old; if (q.unit) row.unit = q.unit;
        if (q.pack) { row.variant_label = q.pack; row.variant_group = q.group; }
        return api('/rest/v1/products', 'POST', row, 'return=minimal');
      });
    }).then(function () { shop.push({ id: q.id, name: q.name, variant_group: q.group || null, variant_label: q.pack || null }); });
  }
  function post(btns, st) {
    if (H.busy()) { st.textContent = 'The AI is still working. Tap Post again in a moment.'; return; }
    var list = queue.slice(); if (!list.length) return;
    btns.forEach(function (b) { b.disabled = true; }); st.textContent = 'Checking your admin sign-in...';
    tok().then(loadShop).then(function () {
      var done = [], fails = [], chain = Promise.resolve();
      list.forEach(function (q, i) {
        chain = chain.then(function () { st.textContent = 'Posting ' + (i + 1) + ' of ' + list.length + ': ' + q.name; return one(q); })
          .then(function () { done.push(q); }, function (e) { fails.push(q.name + ': ' + String(e && e.message || e).slice(0, 160)); });
      });
      return chain.then(function () { finish(list, done, fails); });
    }, function (e) { st.textContent = String(e && e.message || e).replace(/^The owner is signed out/, 'You are signed out').replace(/Tell them to/, 'Please').replace(/ask again \(or tap Post\)\./, 'tap Post again.'); btns.forEach(function (b) { b.disabled = false; }); });
  }
  function finish(list, done, fails) {
    var dn = {}; done.forEach(function (q) { dn[q.id] = 1; });
    queue = queue.filter(function (q) { return !dn[q.id]; });
    dropCard();
    var names = done.map(function (q) { return q.name + (q.pack ? ' ' + q.pack : ''); });
    H.say(done.length + ' of ' + list.length + ' item' + (list.length === 1 ? '' : 's') + ' posted to your shop.' + (done.some(function (q) { return q.feat; }) ? ' Items marked as advert show in the home page banner (newest 6 featured items that are in stock).' : '') + (fails.length ? ' Not posted: ' + fails.join(' | ') : ' The shop and Google feed refresh within about 3 hours.'), fails.length ? 'err' : 'sys');
    H.note('[The owner tapped Post. Posted to the shop: ' + (names.join('; ') || 'none') + '.' + (fails.length ? ' Failed: ' + fails.join(' | ') + '.' : '') + ' Photos are still attached in the tool, so failed items can be posted again.]');
    if (queue.length) drawCard();
  }

  /* ---------- tool: list_products (admin view of what is stored in the shop) ---------- */
  function list(a) {
    a = a || {};
    var lim = Math.max(1, Math.min(parseInt(a.limit, 10) || 100, 300)), off = Math.max(0, parseInt(a.offset, 10) || 0);
    return tok().then(function () { return true; }, function () { return false; }).then(function (admin) {
      return loadCats(!admin).then(function () {
        var q = '/rest/v1/products?select=id,name,price,old_price,unit,stock,low_at,featured,active,category_id,images,variant_label,created_at' + (admin && a.include_cost ? ',cost' : '');
        if (a.search) q += '&name=ilike.' + encodeURIComponent('*' + String(a.search).replace(/[*%,()]/g, ' ').trim() + '*');
        if (a.category) {
          var c = findCat(a.category); if (!c) throw new Error('No category called "' + a.category + '". Categories: ' + cats.map(function (x) { return x.name; }).join(', '));
          q += '&category_id=eq.' + c.id;
        }
        if (a.missing_photos) q += '&images=eq.' + encodeURIComponent('{}');
        if (!admin || a.status === 'live') q += '&active=eq.true'; else if (a.status === 'hidden') q += '&active=eq.false';
        q += '&order=created_at.desc&limit=' + lim + '&offset=' + off;
        return api(q, 'GET', undefined, '', !admin).then(function (rows) {
          var cn = {}; cats.forEach(function (x) { cn[x.id] = x.name; });
          rows = (rows || []).map(function (p) {
            var r = { id: p.id, name: p.name, pack_size: p.variant_label || undefined, category: cn[p.category_id] || '', price: p.price, was: p.old_price || undefined, unit: p.unit || undefined, stock: p.stock, low_stock_alert: p.low_at, advert: !!p.featured, live: !!p.active, photos: (p.images || []).length, added: String(p.created_at || '').slice(0, 10) };
            if (p.cost != null) r.cost = p.cost; return r;
          });
          return { admin_view: admin, note: admin ? undefined : 'Signed out of Admin, so hidden items are not shown. Tell the owner to sign in at /admin.html for the full list.', count: rows.length, more_available: rows.length === lim, next_offset: off + rows.length, rows: rows, categories: cats.map(function (x) { return x.name; }) };
        });
      });
    });
  }

  /* ---------- tools: product_descriptions and update_products (edit products that are already in the shop) ---------- */
  function allRows(sel) {
    var out = [];
    function more(off) {
      return api('/rest/v1/products?select=' + sel + '&order=id.asc&limit=1000&offset=' + off).then(function (r) {
        r = r || []; out = out.concat(r); return r.length === 1000 && off < 4000 ? more(off + 1000) : out;
      });
    }
    return more(0);
  }
  function descList(a) {
    a = a || {};
    var min = Math.max(1, parseInt(a.min_words, 10) || MINW), lim = Math.max(1, Math.min(parseInt(a.limit, 10) || 8, 25)), off = Math.max(0, parseInt(a.offset, 10) || 0), max = Math.max(0, parseInt(a.max_words, 10) || 0);
    return tok().then(function () { return loadCats(false); }).then(function () {
      return allRows('id,name,variant_label,category_id,price,unit,active,description');
    }).then(function (rows) {
      var cn = {}; cats.forEach(function (c) { cn[c.id] = c.name; });
      var short = rows.filter(function (p) { var w = words(p.description); return w < min || (max && w > max); });
      var page = short.slice(off, off + lim).map(function (p) {
        return { id: p.id, name: p.name, pack_size: p.variant_label || undefined, category: cn[p.category_id] || '', price: p.price, unit: p.unit || undefined, live: !!p.active, words_now: words(p.description), current_description: String(p.description || '').slice(0, 3000) };
      });
      return { total_products: rows.length, outside_word_range: short.length, min_words: min, max_words: max || undefined, returned: page.length, next_offset: off + page.length, more_available: off + page.length < short.length, rows: page,
        note: 'Fixed items leave this list, so after you update a batch call this again with offset 0. Keep going until outside_word_range is 0, or only items you could not fix remain.' };
    });
  }
  function patchOf(it) {
    var p = {}, bad = [], v;
    if (it.name != null) { v = str(it.name, 120); if (v) p.name = v; else bad.push('name is empty'); }
    if (it.description != null) p.description = String(it.description).replace(/^[\s*\-\u2022]+/gm, '').slice(0, 12000).trim();
    if (it.price != null) { v = num(it.price); if (v > 0) p.price = v; else bad.push('price must be above 0'); }
    if (it.old_price != null) p.old_price = num(it.old_price) || null;
    if (it.cost != null) { v = num(it.cost); if (v > 0) p.cost = v; else bad.push('cost must be above 0'); }
    if (it.stock != null) { v = parseInt(it.stock, 10); if (v >= 0) p.stock = v; else bad.push('stock must be 0 or more'); }
    if (it.low_stock_alert != null) { v = parseInt(it.low_stock_alert, 10); if (v >= 0) p.low_at = v; else bad.push('low_stock_alert must be 0 or more'); }
    if (typeof it.featured === 'boolean') p.featured = it.featured;
    if (typeof it.live === 'boolean') p.active = it.live;
    if (it.unit != null && it.unit !== '') { if (UNITS.indexOf(it.unit) > -1) p.unit = it.unit; else bad.push('unit must be one of: ' + UNITS.join(', ')); }
    return { patch: p, bad: bad };
  }
  /* the old values of every product that is changed are kept on this device, so a mistake can be put back */
  function backup(id, old) {
    try { var b = JSON.parse(localStorage.getItem(BK) || '[]'); b.push({ t: new Date().toISOString(), id: id, before: old }); localStorage.setItem(BK, JSON.stringify(b.slice(-200))); } catch (e) {}
  }
  function update(a) {
    a = a || {};
    var items = Array.isArray(a.items) ? a.items : [];
    if (!items.length) return Promise.reject(new Error('items is required: send one entry per product, each with its id'));
    if (items.length > 100) return Promise.reject(new Error('Send at most 100 products at a time'));
    var rg = range(a.require_min_words, a.max_words);
    return tok().then(function () { return loadCats(false); }).then(function () {
      var jobs = [], bad = [], ids = [], keys = {};
      items.forEach(function (it) {
        it = it || {};
        var id = String(it.id == null ? '' : it.id).trim(), r = patchOf(it), problems = r.bad.slice(), lp;
        if (!id) { bad.push({ id: '(missing)', problem: 'id is required. Get it from list_products or product_descriptions' }); return; }
        if (it.category != null && it.category !== '') {
          var c = findCat(it.category);
          if (c) r.patch.category_id = c.id; else problems.push('no category called "' + it.category + '". Categories: ' + cats.map(function (x) { return x.name; }).join(', '));
        }
        if (r.patch.description != null) { lp = lengthProblem(r.patch.description, rg); if (lp) problems.push(lp); }
        if (!Object.keys(r.patch).length && !problems.length) problems.push('nothing to change');
        if (problems.length) { bad.push({ id: id, problem: problems.join('; ') }); return; }
        jobs.push({ id: id, patch: r.patch }); ids.push(id);
        Object.keys(r.patch).forEach(function (k) { keys[k] = 1; });
      });
      if (!jobs.length) return { updated: [], not_changed: bad, note: 'Nothing was saved. Fix the problems listed (for a description length, rewrite it and send it again) and send those items again.' };
      var sel = ['id'].concat(Object.keys(keys)).join(','), inList = '(' + ids.map(function (i) { return '"' + i.replace(/"/g, '') + '"'; }).join(',') + ')';
      return api('/rest/v1/products?select=' + sel + '&id=in.' + encodeURIComponent(inList)).then(function (old) {
        var before = {}; (old || []).forEach(function (p) { before[p.id] = p; });
        var done = [], chain = Promise.resolve();
        jobs.forEach(function (j) {
          chain = chain.then(function () {
            if (!before[j.id]) { bad.push({ id: j.id, problem: 'no product with this id in the shop' }); return; }
            return api('/rest/v1/products?select=id&id=eq.' + encodeURIComponent(j.id), 'PATCH', j.patch, 'return=representation').then(function (r) {
              if (r && r.length) { done.push(j); backup(j.id, before[j.id]); }
              else bad.push({ id: j.id, problem: 'the shop did not accept the change. The owner may need to sign in again at /admin.html' });
            }, function (e) { bad.push({ id: j.id, problem: String(e && e.message || e).slice(0, 200) }); });
          });
        });
        return chain.then(function () {
          return { saved_to_live_shop: done.length, updated: done.map(function (j) { return { id: j.id, changed: Object.keys(j.patch), words: j.patch.description != null ? words(j.patch.description) : undefined }; }), not_changed: bad,
            note: 'These changes are already live in the shop (no Post or Publish needed). The shop and Google feed refresh within about 3 hours.' };
        });
      });
    });
  }

  var P = function (props, req) { return { type: 'object', properties: props, required: req || [] }; };
  var S = { type: 'string' }, N = { type: 'number' }, I = { type: 'integer' }, B = { type: 'boolean' };
  var decls = [
    { name: 'new_chat', description: 'Clear this whole chat and reload the builder so it starts fresh on the newest code. Use it only when the owner asks to clear the chat, start a new chat, start fresh or refresh the builder. Changes waiting to be published are kept.' },
    { name: 'list_products', description: 'List the items stored in the shop (admin view: includes hidden items, stock, price, previous price, advert flag and how many photos each has). Use it when the owner asks what is in the shop, to check for duplicates, or to find items with no photo. Pages through with offset.',
      parameters: P({ search: S, category: S, status: { type: 'string', description: 'live, hidden or all (default all)' }, missing_photos: B, include_cost: { type: 'boolean', description: 'only when the owner asks to see cost prices' }, limit: I, offset: I }) },
    { name: 'product_descriptions', description: 'Find shop products whose description has fewer than min_words words (default 300), or more than max_words if given, and read their current text. Returns the product ids, names, categories and current descriptions so you can rewrite them. Then save the new text with update_products.',
      parameters: P({ min_words: I, max_words: I, limit: { type: 'integer', description: 'how many to return, up to 25 (default 8)' }, offset: I }) },
    { name: 'update_products', description: 'Change products that are ALREADY in the shop. Saves straight to the live shop with no card and no Publish (the owner is signed in as admin and asked for direct edits). Can change description, name, price, previous price, cost, stock, low-stock alert, advert flag, live/hidden, category and unit. Send up to 100 products per call, each with its id. Only change what the owner asked for. Descriptions are checked: at least 300 words unless you pass another require_min_words (0 turns the minimum off), and at most max_words if given. A description outside the range is refused, so rewrite it and send it again.',
      parameters: P({
        items: { type: 'array', items: P({
          id: { type: 'string', description: 'The product id from list_products or product_descriptions' },
          description: { type: 'string', description: 'Full new description in store format: short paragraphs or one point per line, section titles on their own line, no bullets or markdown' },
          name: S, price: N, old_price: { type: 'number', description: 'Previous price in KSh. 0 removes it' }, cost: N, stock: I, low_stock_alert: I,
          featured: { type: 'boolean', description: 'Show as advert on the home page' }, live: { type: 'boolean', description: 'false hides the product from the shop' },
          category: { type: 'string', description: 'An existing category name' }, unit: S
        }, ['id']) },
        require_min_words: { type: 'integer', description: 'Minimum words for a description (default 300). Use the owner\'s number if they gave one' },
        max_words: { type: 'integer', description: 'Maximum words for a description. Only if the owner gave a limit' }
      }, ['items']) },
    { name: 'post_products', description: 'Prepare shop products from the attached photos and show the owner a green Post card in the chat. Nothing is in the shop until the owner taps Post. Prices, previous price, stock, low-stock alert and advert are worked out from the standard settings, so send only what the owner stated or what is visible on the photos. Call it once with every product (up to 100). Every description is checked: at least 300 words unless you pass another min_description_words, and at most max_description_words if given. Items with a description outside the range are refused, so rewrite and send those again. It returns the prices it worked out and anything missing (for example a cost price).',
      parameters: P({
        items: { type: 'array', items: P({
          photos: { type: 'array', items: I, description: 'Numbers of the attached photos that show this product (Photo 1, Photo 2 ...)' },
          name: { type: 'string', description: 'Title Case: brand, product, and size or model only if visible on the photo or stated by the owner' },
          category: { type: 'string', description: 'Best match from the shop category list, or a short new category name only if none fits' },
          cost: { type: 'number', description: 'Buying price in KSh (COGS) ONLY if the owner stated it for this product. Never guess' },
          price: { type: 'number', description: 'Selling price ONLY if the owner stated it. Otherwise leave out: it is worked out from the cost' },
          pack_size: { type: 'string', description: 'Size or variant such as 1 Litre, only if visible or stated' },
          unit: { type: 'string', description: 'One of: ' + UNITS.join(', ') + ' (only if clear)' },
          description: { type: 'string', description: 'Store format: one point per line, no bullets, section titles on their own line, Brand: line when visible. At least 300 words unless the owner set another length' },
          stock: { type: 'integer', description: 'Only if the owner stated it' },
          old_price: { type: 'number', description: 'Only if the owner stated a previous price' },
          featured: { type: 'boolean', description: 'Only if the owner asked for this item to be an advert' }
        }, ['name', 'category']) },
        settings: P({ profit_percent: N, profit_mode: { type: 'string', description: 'cost (cost plus percent) or margin' }, discount_min: N, discount_max: N, show_previous_price: B, stock: I, low_stock_alert: I, featured: B }),
        min_description_words: { type: 'integer', description: 'Minimum words for every description (default 300). Use the owner\'s number if they gave one' },
        max_description_words: { type: 'integer', description: 'Maximum words for every description. Only if the owner gave a limit' }
      }, ['items']) }
  ];

  /* added to the AI instructions: it must know it CAN edit live products */
  var EDIT_RULES = '\n\nEDITING THE LIVE SHOP: you CAN change products that are already in the shop. Use update_products (description, name, price, previous price, cost, stock, advert, live or hidden, category, unit). It saves straight to the live shop with no Post card and no Publish, because the owner is signed in as admin and wants direct edits. Never tell the owner you cannot edit product text or that they must use SQL or the admin panel. Do what the owner asked, change only that, and afterwards say plainly what you changed. To find short descriptions call product_descriptions, then fix them in batches of about 5 with update_products, and repeat until none are left. If a tool says the owner is signed out, tell them to open /admin.html, sign in, and ask again.' +
    '\nNEW CHAT: when the owner asks to clear the chat, start a new chat, start fresh or refresh the builder, call new_chat at once without asking anything, then reply with one short sentence. It clears this chat and reloads the builder on the newest code. Changes waiting to be published are kept.' +
    '\nWORD COUNTS: every product description must be at least 300 words unless the owner gives another length. If the owner gives a number or a range, pass it as min and max (min_description_words and max_description_words for post_products, require_min_words and max_words for update_products). The tools COUNT the words and refuse a description outside the range, so when a tool says a description is too short or too long, rewrite it and send it again yourself without asking the owner.' +
    '\nWRITING PRODUCT DESCRIPTIONS: use only facts from the product name, pack size, category, the existing description and what the owner told you, and keep any facts already there (Brand: lines, sizes). Write plain, useful English: what the product is, who it is for, common uses, general handling and storage tips, a reminder to read and follow the label and keep it away from children and food (for pest control, fumigation, agrovet and chemical products), and how buying works at Stermont Arcade (pay by M-Pesa, delivery to all 47 counties, questions on WhatsApp). NEVER invent brand claims, ingredients, strengths, dosages, mixing ratios, certifications, awards, guarantees, ratings, statistics or delivery times. Format: short paragraphs, section titles on their own line, no bullets and no markdown. Reach the word count with real content, not repetition.';
  function info() {
    return (cats.length ? '\n\nShop categories right now (use these names for post_products and update_products): ' + cats.map(function (c) { return c.name; }).join(' | ') : '\n\nThe shop category list is not loaded yet: call list_products first to see the category names.') + EDIT_RULES;
  }
  loadCats(true).catch(function () {});

  W.BuilderProducts = {
    decls: decls, tools: { new_chat: freshStart, list_products: list, product_descriptions: descList, update_products: update, post_products: prepare }, setPhotos: setPhotos, info: info,
    bind: function (o) { if (o) { if (o.busy) H.busy = o.busy; if (o.note) H.note = o.note; if (o.say) H.say = o.say; } },
    _t: { auto: auto, autoOld: autoOld, settings: settings, prepare: prepare, setCats: function (c) { cats = c; }, setShop: function (s) { shop = s; }, queue: function () { return queue; } }
  };

  /* More tool files. A file written here runs right now, before the builder reads its tool list, so it can add tools to BuilderProducts.
     Add a new tool by creating its own file and listing it here. If a file is missing the builder simply works without it. */
  if (D.readyState === 'loading') { try { D.write('<scr' + 'ipt src="/builder-tasks.js?v=2"></scr' + 'ipt>'); } catch (e) {} }
})();
