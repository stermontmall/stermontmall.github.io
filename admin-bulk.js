/* Stermont Arcade · Bulk import: add many products from a spreadsheet (CSV) + photos, and attach photos to existing items.
   Mounted by admin-extras.js -> STMBulk.mount(containerEl). Uses window.STMAdmin (api, raw, base, money) and STMCatalog.autoPrice. */
(function () {
  var D = document, BUCKET = 'product-images';
  function h(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function slug(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function norm(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
  function baseName(f) { return String(f).replace(/\.[^.]+$/, ''); }
  function A() { return window.STMAdmin; }
  function autoPrice(c) { return window.STMCatalog && STMCatalog.autoPrice ? STMCatalog.autoPrice(c) : 0; }

  /* ---------- CSV ---------- */
  function parseCSV(t) {
    t = String(t).replace(/^﻿/, '');
    var first = t.split(/\r?\n/)[0] || '', d = first.split(';').length > first.split(',').length ? ';' : ',';
    var out = [], row = [], f = '', q = false;
    for (var i = 0; i < t.length; i++) {
      var ch = t[i];
      if (q) { if (ch === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
      else if (ch === '"') q = true;
      else if (ch === d) { row.push(f); f = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; row.push(f); f = ''; out.push(row); row = []; }
      else f += ch;
    }
    if (f !== '' || row.length) { row.push(f); out.push(row); }
    return out.filter(function (r) { return r.some(function (x) { return String(x).trim() !== ''; }); });
  }
  function csvCell(x) { x = String(x == null ? '' : x); return /[",\n;]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; }
  var HEAD = { name: ['name', 'product', 'item', 'product name', 'item name'], category: ['category', 'cat'], cost: ['cost', 'cost price', 'buying price', 'buy price'],
    price: ['selling price', 'price', 'sell price'], old: ['old price', 'was price', 'previous price'], stock: ['stock', 'qty', 'quantity', 'pieces'], unit: ['unit'],
    pack: ['pack size', 'size', 'variant', 'pack'], desc: ['description', 'details'], photo: ['photo', 'photos', 'image', 'images', 'picture', 'pictures'], feat: ['featured'] };
  function mapHeaders(r) { var m = {}; r.forEach(function (c, i) { var k = norm(c); Object.keys(HEAD).forEach(function (f) { if (HEAD[f].indexOf(k) > -1 && m[f] == null) m[f] = i; }); }); return m; }
  var TEMPLATE = [['name', 'category', 'cost', 'selling_price', 'old_price', 'stock', 'unit', 'pack_size', 'description', 'photo', 'featured'],
    ['Kungu Nil 200 SL Bed Bug Killer', 'Bed Bug Killers', 2200, '', '', 50, '', '1 Litre', 'Short description shoppers will read.', 'kungu-nil-1l.jpg', 'no'],
    ['Kungu Nil 200 SL Bed Bug Killer', 'Bed Bug Killers', 800, '', '', 80, '', '100 ml', 'Short description shoppers will read.', 'kungu-nil-1l.jpg', 'no'],
    ['Haier 7L Air Fryer', 'Appliances', 9500, 12500, 14000, 5, '', '', 'Digital air fryer, 7 litre.', 'haier-air-fryer.jpg;haier-air-fryer-2.jpg', 'yes']];
  function download(name, text) { var a = h('a'); a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv' })); a.download = name; D.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 500); }

  /* ---------- images (resized in the browser, stored in Supabase Storage like the Catalog does) ---------- */
  function shrink(file) {
    return new Promise(function (res, rej) {
      var img = new Image(); img.onload = function () {
        var k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = D.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(function (b) { b ? res(b) : rej(new Error('Image failed')); }, 'image/jpeg', 0.9);
      }; img.onerror = function () { rej(new Error('"' + file.name + '" is not a readable image')); }; img.src = URL.createObjectURL(file);
    });
  }
  function upload(file, base) {
    return shrink(file).then(function (b) {
      var path = slug(base).slice(0, 80) + '-' + Date.now() + Math.floor(Math.random() * 99) + '.jpg';
      return A().raw('/storage/v1/object/' + BUCKET + '/' + path, { method: 'POST', body: b, headers: { 'Content-Type': 'image/jpeg' } }).then(function (r) {
        if (!r.ok) throw new Error('Photo upload failed (' + r.status + ')'); return A().base + '/storage/v1/object/public/' + BUCKET + '/' + path; });
    });
  }
  function fileMap(files) { var m = {}; Array.prototype.forEach.call(files || [], function (f) { m[f.name.toLowerCase()] = f; m[slug(baseName(f.name))] = m[slug(baseName(f.name))] || f; }); return m; }
  function findFile(m, token) { token = String(token).trim(); return m[token.toLowerCase()] || m[slug(baseName(token))] || null; }
  function req(path, method, body, prefer) {
    return A().api(path, { method: method || 'GET', body: body, headers: prefer ? { Prefer: prefer } : {} }).then(function (r) {
      if (r.status === 401) throw new Error('Your session expired. Sign in again.');
      if (!r.ok) return r.text().then(function (t) { var m = ''; try { m = JSON.parse(t).message; } catch (e) {} throw new Error(m || 'Request failed (' + r.status + ')'); });
      return r.status === 204 ? null : r.text().then(function (t) { return t ? JSON.parse(t) : null; });
    });
  }
  function msg(root, text, ok) { var e = root.querySelector('.xm') || root.insertBefore(h('div', 'err xm'), root.firstChild); e.textContent = text; e.style.color = ok ? '#15803d' : ''; e.style.background = ok ? '#dcfce7' : ''; e.hidden = !text; }
  function fileInput(multi, accept) { var i = h('input'); i.type = 'file'; i.multiple = !!multi; i.accept = accept; i.style.cssText = 'width:100%;padding:.5rem;border:1px dashed var(--ln);border-radius:10px;background:#fff'; return i; }
  function btn(t, c, fn) { var b = h('button', 'btn ' + (c || ''), t); b.type = 'button'; b.onclick = fn; return b; }
  function table(head, rows) {
    var w = h('div'); w.style.cssText = 'overflow-x:auto'; var t = h('table', 'cx-t'); t.style.fontSize = '.82rem';
    var tr = h('tr'); head.forEach(function (x, i) { var th = h('th', null, x); if (i === 0 || i === head.length - 1) th.style.textAlign = 'left'; tr.appendChild(th); }); var th0 = h('thead'); th0.appendChild(tr); t.appendChild(th0);
    var tb = h('tbody'); rows.forEach(function (r) { var tr2 = h('tr'); r.forEach(function (c, i) { var td = h('td', c && c.cls || '', c && c.t != null ? c.t : c); if (i === 0 || i === r.length - 1) { td.style.textAlign = 'left'; td.style.whiteSpace = 'normal'; } tr2.appendChild(td); }); tb.appendChild(tr2); }); t.appendChild(tb); w.appendChild(t); return w;
  }

  function mount(root) {
    root.textContent = '';
    var c = h('div'); root.appendChild(c);
    var cats = [], prods = [], plan = [], busy = false;

    /* =============== 1. spreadsheet import =============== */
    var c1 = h('div', 'card'); c.appendChild(c1);
    c1.appendChild(h('h3', null, '1 · Add many products from a spreadsheet')); c1.firstChild.style.margin = '0 0 .3rem';
    c1.appendChild(h('p', 'meta', 'Fill the template in Excel or Google Sheets, save as CSV, then choose it below together with the product photos. Leave selling_price empty to price automatically from the cost (cost + 30%, rounded up to KSh 50). Rows with the same name and different pack_size become sizes of one product.'));
    var a1 = h('div', 'acts'); a1.appendChild(btn('⬇ Download template', 'alt sm', function () { download('stermont-products-template.csv', TEMPLATE.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n')); })); c1.appendChild(a1);
    var csvIn = fileInput(false, '.csv,text/csv,text/plain'), phIn = fileInput(true, 'image/*');
    var lb1 = h('label', null, 'Spreadsheet (.csv)'), lb2 = h('label', null, 'Photos (select all of them together)');
    [lb1, csvIn, lb2, phIn].forEach(function (x) { c1.appendChild(x); });
    var chk = btn('Check my spreadsheet', null, function () { check(); }); chk.style.cssText = 'width:100%;margin-top:.8rem'; c1.appendChild(chk);
    var out1 = h('div'); out1.style.marginTop = '.8rem'; c1.appendChild(out1);

    function load() {
      return Promise.all([req('/rest/v1/categories?select=id,name,slug'), req('/rest/v1/products?select=id,name,images,variant_group,variant_label&limit=3000')]).then(function (r) { cats = r[0] || []; prods = r[1] || []; });
    }

    function check() {
      out1.textContent = ''; plan = []; msg(c, '');
      if (!csvIn.files.length) { msg(c, 'Choose your CSV file first.'); return; }
      chk.disabled = true;
      Promise.all([load(), csvIn.files[0].text()]).then(function (r) {
        var rows = parseCSV(r[1]); if (rows.length < 2) throw new Error('The spreadsheet has no product rows.');
        var m = mapHeaders(rows[0]); if (m.name == null) throw new Error('No "name" column found. Download the template to see the expected columns.');
        var files = fileMap(phIn.files), seen = {}, exist = {}; prods.forEach(function (p) { exist[p.id] = p; });
        var catBy = {}; cats.forEach(function (x) { catBy[norm(x.name)] = x; });
        rows.slice(1).forEach(function (r, i) {
          var g = function (k) { return m[k] == null ? '' : String(r[m[k]] == null ? '' : r[m[k]]).trim(); };
          var o = { line: i + 2, name: g('name'), pack: g('pack'), catName: g('category'), errs: [], warns: [], photos: [], missing: [], files: [] };
          if (!o.name) { o.errs.push('No name'); plan.push(o); return; }
          o.id = slug(o.name + (o.pack ? ' ' + o.pack : '')) || 'item';
          if (seen[o.id]) o.errs.push('Same name and size appears twice'); seen[o.id] = 1;
          var cat = catBy[norm(o.catName)]; o.cat = cat || null; if (!o.catName) o.errs.push('No category'); else if (!cat) o.newCat = true;
          var cost = g('cost') === '' ? null : Number(g('cost').replace(/,/g, '')), price = g('price') === '' ? null : Number(g('price').replace(/,/g, ''));
          if ((cost != null && !(cost >= 0)) || (price != null && !(price >= 0))) o.errs.push('Cost or price is not a number');
          o.cost = cost == null ? 0 : cost; o.price = price != null ? price : (cost > 0 ? autoPrice(cost) : null); o.auto = price == null && cost > 0;
          if (o.price == null || !(o.price >= 0)) o.errs.push('Needs a cost or a selling price');
          if (price != null && cost == null) o.warns.push('No cost: profit will show as 100%');
          var old = g('old') === '' ? null : Number(g('old').replace(/,/g, '')); if (old != null && !(old > o.price)) { o.warns.push('Old price ignored (must be higher than the price)'); old = null; } o.old = old;
          o.stock = g('stock') === '' ? 0 : parseInt(g('stock'), 10); if (!(o.stock >= 0)) { o.errs.push('Stock is not a number'); o.stock = 0; } else if (o.stock === 0) o.warns.push('Stock 0: shows as sold out');
          o.unit = g('unit'); o.desc = g('desc'); o.featured = /^(y|yes|true|1)$/i.test(g('feat'));
          var toks = g('photo').split(/[;|]/).map(function (x) { return x.trim(); }).filter(Boolean);
          if (!toks.length) { var auto = files[slug(o.name + (o.pack ? ' ' + o.pack : ''))] || files[slug(o.name)]; if (auto) toks = [auto.name]; }
          toks.forEach(function (t) { var f = findFile(files, t); if (f) { o.files.push(f); o.photos.push(f.name); } else o.missing.push(t); });
          if (o.missing.length) o.warns.push('Photo not selected: ' + o.missing.join(', '));
          if (!o.files.length && !(exist[o.id] && (exist[o.id].images || []).length)) o.warns.push('No photo: left out of Google Shopping');
          var ex = exist[o.id]; o.action = ex ? 'update' : 'create'; o.existing = ex || null;
          if (o.action === 'create') {
            var sib = prods.filter(function (p) { return norm(p.name) === norm(o.name); });
            if (sib.length) { var withG = sib.filter(function (p) { return p.variant_group; })[0]; if (o.pack && withG) o.group = withG.variant_group; else if (o.pack) o.errs.push('"' + o.name + '" exists without a pack size: use Catalog → ＋ Pack size'); else o.errs.push('"' + o.name + '" already exists: add a pack_size or change the name'); }
            if (o.pack && !o.group) o.group = slug(o.name);
          }
          plan.push(o);
        });
        draw();
      }).catch(function (e) { msg(c, e.message); }).then(function () { chk.disabled = false; });
    }

    function draw() {
      out1.textContent = '';
      var ok = plan.filter(function (o) { return !o.errs.length; }), bad = plan.length - ok.length;
      var cr = ok.filter(function (o) { return o.action === 'create'; }).length, up = ok.length - cr, newCats = {}; ok.forEach(function (o) { if (o.newCat) newCats[norm(o.catName)] = o.catName; });
      out1.appendChild(h('p', null, plan.length + ' rows read: ' + cr + ' to add, ' + up + ' existing to update' + (bad ? ', ' + bad + ' with problems (skipped)' : '') + '.'));
      out1.lastChild.style.fontWeight = '700';
      if (Object.keys(newCats).length) out1.appendChild(h('p', 'meta', 'New categories to create: ' + Object.keys(newCats).map(function (k) { return newCats[k]; }).join(', ')));
      out1.appendChild(table(['Row', 'Item', 'Price', 'Stock', 'Photos', 'Result'], plan.map(function (o) {
        var res = o.errs.length ? { t: '✖ ' + o.errs.join('; '), cls: 'neg' } : { t: (o.action === 'update' ? '↻ Update existing' : '＋ Add') + (o.warns.length ? ' · ⚠ ' + o.warns.join('; ') : '') };
        return [{ t: String(o.line) }, { t: (o.name || '—') + (o.pack ? ' · ' + o.pack : '') }, { t: o.price != null ? A().money(o.price) + (o.auto ? ' (auto)' : '') : '—' }, { t: String(o.stock || 0) }, { t: String(o.photos.length) }, res];
      })));
      if (ok.length) { var go = btn('Import ' + ok.length + ' item' + (ok.length === 1 ? '' : 's'), 'ok', function () { run(ok, go); }); go.style.cssText = 'width:100%;margin-top:.8rem'; out1.appendChild(go); }
      var note = h('p', 'meta', 'Existing items only get new photos, description, old price and unit; their stock, cost and price are never changed here.'); out1.appendChild(note);
    }

    function run(list, go) {
      if (busy) return; busy = true; go.disabled = true; msg(c, '');
      var bar = h('div', 'meta', 'Starting…'), done = 0, fails = [], upCache = {}, catCache = {}; out1.appendChild(bar);
      function photoUrl(f, base) { var k = f.name + f.size; return upCache[k] ? Promise.resolve(upCache[k]) : upload(f, base).then(function (u) { return upCache[k] = u; }); }
      function catId(o) {
        if (o.cat) return Promise.resolve(o.cat.id); var k = norm(o.catName); if (catCache[k]) return Promise.resolve(catCache[k]);
        return req('/rest/v1/categories?on_conflict=slug', 'POST', { name: o.catName, slug: slug(o.catName) }, 'resolution=merge-duplicates,return=representation').then(function (r) { return catCache[k] = r[0].id; });
      }
      function one(o) {
        var imgs = []; return o.files.reduce(function (p, f) { return p.then(function () { return photoUrl(f, o.name).then(function (u) { imgs.push(u); }); }); }, Promise.resolve()).then(function () {
          if (o.action === 'update') {
            var patch = {}; if (imgs.length) patch.images = (o.existing.images || []).concat(imgs); if (o.desc) patch.description = o.desc; if (o.old != null) patch.old_price = o.old; if (o.unit) patch.unit = o.unit;
            if (!Object.keys(patch).length) return null; return req('/rest/v1/products?id=eq.' + encodeURIComponent(o.id), 'PATCH', patch, 'return=minimal');
          }
          return catId(o).then(function (cid) {
            var row = { id: o.id, category_id: cid, name: o.name, price: o.price, cost: o.cost, stock: o.stock, low_at: 5, featured: o.featured, active: true, images: imgs };
            if (o.desc) row.description = o.desc; if (o.old != null) row.old_price = o.old; if (o.unit) row.unit = o.unit; if (o.pack) { row.variant_label = o.pack; row.variant_group = o.group; }
            return req('/rest/v1/products', 'POST', row, 'return=minimal');
          });
        });
      }
      var chain = Promise.resolve();
      list.forEach(function (o) { chain = chain.then(function () { return one(o).catch(function (e) { fails.push('Row ' + o.line + ' (' + o.name + '): ' + e.message); }).then(function () { done++; bar.textContent = 'Importing… ' + done + ' / ' + list.length; }); }); });
      chain.then(function () {
        busy = false; out1.textContent = '';
        var okN = list.length - fails.length; msg(c, okN + ' of ' + list.length + ' items imported.' + (fails.length ? ' ' + fails.length + ' failed: ' + fails.slice(0, 5).join(' | ') : ' Pages and the Google feed refresh within about 3 hours.'), !fails.length);
        load().then(drawMissing);
      });
    }

    /* =============== 2. photos for existing items =============== */
    var c2 = h('div', 'card'); c.appendChild(c2);
    c2.appendChild(h('h3', null, '2 · Attach photos to items that have none')); c2.firstChild.style.margin = '0 0 .3rem';
    c2.appendChild(h('p', 'meta', 'Name each photo after the item (the name shown below, e.g. fuko-kil-rat-poison-25-g.jpg), select them together, and attach. Items with a photo are skipped.'));
    var missBox = h('div'); c2.appendChild(missBox);
    var phIn2 = fileInput(true, 'image/*'); c2.appendChild(phIn2);
    var out2 = h('div'); out2.style.marginTop = '.6rem'; c2.appendChild(out2);
    var m2 = [];
    function drawMissing() {
      missBox.textContent = ''; var none = prods.filter(function (p) { return !(p.images || []).length; });
      missBox.appendChild(h('p', null, none.length ? none.length + ' item' + (none.length === 1 ? '' : 's') + ' without a photo:' : 'Every item has a photo. 🎉')); missBox.lastChild.style.fontWeight = '700';
      if (none.length) { var ul = h('ul', 'meta'); none.slice(0, 60).forEach(function (p) { ul.appendChild(h('li', null, p.name + (p.variant_label ? ' · ' + p.variant_label : '') + '  →  ' + p.id + '.jpg')); }); ul.style.cssText = 'margin:.3rem 0 .6rem;padding-left:1.1rem'; missBox.appendChild(ul); }
    }
    phIn2.addEventListener('change', function () {
      out2.textContent = ''; m2 = []; var by = {}; prods.forEach(function (p) { by[p.id] = p; by[slug(p.name + (p.variant_label ? ' ' + p.variant_label : ''))] = by[slug(p.name + (p.variant_label ? ' ' + p.variant_label : ''))] || p; });
      Array.prototype.forEach.call(phIn2.files, function (f) { var b = slug(baseName(f.name)), p = by[b]; m2.push({ f: f, p: p || null, skip: p && (p.images || []).length }); });
      if (!m2.length) return;
      out2.appendChild(table(['Photo', 'Matched item'], m2.map(function (x) { return [{ t: x.f.name }, { t: !x.p ? '✖ No item with this name' : x.skip ? '– Already has a photo' : '＋ ' + x.p.name + (x.p.variant_label ? ' · ' + x.p.variant_label : '') }]; })));
      var good = m2.filter(function (x) { return x.p && !x.skip; });
      if (good.length) { var b = btn('Attach ' + good.length + ' photo' + (good.length === 1 ? '' : 's'), 'ok', function () {
        if (busy) return; busy = true; b.disabled = true; var n = 0, bad = [];
        good.reduce(function (pr, x) { return pr.then(function () { return upload(x.f, x.p.id).then(function (u) { return req('/rest/v1/products?id=eq.' + encodeURIComponent(x.p.id), 'PATCH', { images: (x.p.images || []).concat([u]) }, 'return=minimal'); }).then(function () { n++; }).catch(function (e) { bad.push(x.f.name + ': ' + e.message); }); }); }, Promise.resolve())
          .then(function () { busy = false; out2.textContent = ''; phIn2.value = ''; msg(c, n + ' photo' + (n === 1 ? '' : 's') + ' attached.' + (bad.length ? ' Failed: ' + bad.join(' | ') : ''), !bad.length); return load(); }).then(drawMissing);
      }); b.style.cssText = 'width:100%;margin-top:.8rem'; out2.appendChild(b); }
    });
    load().then(drawMissing).catch(function (e) { msg(c, e.message); });
  }

  window.STMBulk = { mount: mount };
})();
