/* Stermont Arcade · AI photo-to-product drafts (10 per session). */
(function () {
  'use strict';
  var D = document, MAX = 10;
  function el(tag, cls, text) { var n = D.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function button(text, cls, fn) { var b = el('button', 'btn ' + (cls || ''), text); b.type = 'button'; b.onclick = fn; return b; }
  function mount(root) {
    root.textContent = '';
    var wrap = el('div'), head = el('div', 'card'), rowsBox = el('div'), results = el('div'), rows = [], running = false;
    head.appendChild(el('h3', null, 'AI product photo uploader'));
    head.appendChild(el('h3', null, 'Attach an online photo to an existing product'));
    head.appendChild(el('p', 'meta', 'Paste the exact product ID and a direct HTTPS link to its JPG, PNG or WebP photo. This attaches the image to the existing product without changing its price, cost, description or stock. Staff sign-in is required.'));
    var attachId = el('input'); attachId.type = 'text'; attachId.placeholder = 'Existing product ID, e.g. yago-3-in-1-soil-ph-meter'; attachId.autocomplete = 'off'; attachId.style.cssText = 'width:100%;padding:.7rem .8rem;border:1px solid var(--ln);border-radius:10px;font:inherit;margin:.35rem 0';
    var attachUrl = el('input'); attachUrl.type = 'url'; attachUrl.placeholder = 'https://supplier.com/path/product-photo.jpg'; attachUrl.style.cssText = 'width:100%;padding:.7rem .8rem;border:1px solid var(--ln);border-radius:10px;font:inherit;margin:.35rem 0';
    var attachStatus = el('p', 'meta');
    var attachBtn = button('Attach photo to existing product', 'ok', function () {
      var id = attachId.value.trim(), imageUrl = attachUrl.value.trim();
      if (!id || !imageUrl) { alert('Enter the existing product ID and direct photo link.'); return; }
      if (!/^https:\/\//i.test(imageUrl)) { alert('The photo link must start with https://'); return; }
      attachBtn.disabled = true; attachStatus.textContent = 'Downloading photo and attaching it…';
      window.STMAdmin.raw('/functions/v1/ai-add-product', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'attach_existing', product_id: id, image_url: imageUrl })
      }).then(function (response) {
        return response.text().then(function (raw) {
          var data = {}; try { data = raw ? JSON.parse(raw) : {}; } catch (_e) {}
          if (!response.ok || !data.ok) throw new Error(data.error || 'Photo attachment failed (' + response.status + ').');
          attachStatus.textContent = '✓ Photo attached and saved in Supabase Storage for ' + data.product_id + '.';
          attachStatus.appendChild(D.createTextNode(' '));
          var link = el('a', null, 'Open stored image'); link.href = data.image_url; link.target = '_blank'; link.rel = 'noopener'; attachStatus.appendChild(link);
        });
      }).catch(function (error) { attachStatus.textContent = 'Not attached: ' + error.message; })
        .finally(function () { attachBtn.disabled = false; });
    });
    head.append(attachId, attachUrl, attachBtn, attachStatus);
    head.appendChild(el('hr'));

    head.appendChild(el('p', 'meta', 'Add up to 10 products in one session. For each item, upload its photo from your device OR paste a direct link to the photo, and paste the exact product page URL. AI reads the product and source price, writes the listing and SEO fields, then saves it as an unpublished draft for your review.'));
    head.appendChild(el('p', 'meta', 'Price rule: use the exact source KSh/KES price with the minimum 25% markup, or enter your own selling price to override it. Owner-set prices are saved exactly with no markup.'));
    var status = el('p', 'meta', '0 of 10 product slots used.');
    var actions = el('div', 'acts');
    var add = button('+ Add product', 'alt', addRow);
    var run = button('Generate product drafts', 'ok', process);
    run.disabled = true;
    actions.append(add, run); head.append(status, actions);
    wrap.append(findCard(), head, rowsBox, results); root.appendChild(wrap);

    /* ---- Find photos online for live products that have none (Edge Function find-photo, staff only) ---- */
    function callJson(fn, body) {
      return window.STMAdmin.raw('/functions/v1/' + fn, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.text().then(function (t) { var d = {}; try { d = t ? JSON.parse(t) : {}; } catch (_e) {} d._status = r.status; return d; }); });
    }
    function findCard() {
      var card = el('div', 'card'), list = el('div'), top = el('div', 'acts'), note = el('p', 'meta');
      card.appendChild(el('h3', null, 'Find photos online'));
      card.appendChild(el('p', 'meta', 'Lists active products that have no photo. "Find photo" shows picture options from an online image search for you to pick; "Find & attach all" lets the server check each picture against the product name (same brand, model and pack size, at least 450×450, no other shop’s branding) and attaches only the ones that pass. Existing photos are never replaced; price, stock and live status never change.'));
      var loadBtn = button('Load products without a photo', 'alt', load), allBtn = button('Find & attach all', 'ok', attachAll);
      allBtn.disabled = true; top.append(loadBtn, allBtn); card.append(top, note, list);
      var items = [], busy = false;
      function setBusy(v) { busy = v; loadBtn.disabled = v; allBtn.disabled = v || !items.length; items.forEach(function (it) { it.btn.disabled = v; }); }
      function load() {
        note.textContent = 'Loading…'; list.textContent = ''; items = [];
        window.STMAdmin.raw('/rest/v1/products?select=id,name,unit,images&active=eq.true&order=name&limit=1000').then(function (r) { return r.json(); }).then(function (rows) {
          if (!Array.isArray(rows)) throw new Error('Could not load products. Sign in again.');
          rows.filter(function (p) { return !(p.images || []).length; }).forEach(function (p) {
            var row = el('div', 'card'), line = el('div', 'acts'), status = el('p', 'meta'), thumbs = el('div');
            thumbs.style.cssText = 'display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.5rem';
            row.appendChild(el('h4', null, p.name + (p.unit ? ' · ' + p.unit : '')));
            var btn = button('Find photo', 'alt sm', function () { suggest(it); });
            line.appendChild(btn); row.append(line, status, thumbs); list.appendChild(row);
            var it = { p: p, btn: btn, status: status, thumbs: thumbs, row: row }; items.push(it);
          });
          note.textContent = items.length ? items.length + ' active product' + (items.length === 1 ? '' : 's') + ' without a photo.' : 'Every active product has a photo. 🎉';
          allBtn.disabled = !items.length;
        }).catch(function (e) { note.textContent = e.message; });
      }
      function suggest(it) {
        if (busy) return; setBusy(true); it.status.textContent = 'Searching…'; it.thumbs.textContent = '';
        return callJson('find-photo', { product_id: it.p.id, mode: 'suggest' }).then(function (d) {
          if (!d.ok) { it.status.textContent = 'No options: ' + (d.error || 'search failed (' + d._status + ')'); return; }
          it.status.textContent = 'Pick the picture that shows exactly this product (same brand and pack size):';
          (d.candidates || []).forEach(function (c) {
            var box = el('div'), img = el('img'), use = button('Use this', 'ok sm', function () { choose(it, c, use); });
            img.src = c.thumb; img.alt = 'Option from ' + c.site; img.referrerPolicy = 'no-referrer'; img.style.cssText = 'display:block;width:120px;height:120px;object-fit:contain;background:#fff;border:1px solid var(--ln);border-radius:8px';
            box.append(img, el('span', 'meta', c.site), use); it.thumbs.appendChild(box);
          });
        }).catch(function (e) { it.status.textContent = 'No options: ' + e.message; }).then(function () { setBusy(false); });
      }
      function choose(it, c, useBtn) {
        useBtn.disabled = true; it.status.textContent = 'Downloading and attaching…';
        callJson('ai-add-product', { action: 'attach_existing', product_id: it.p.id, image_url: c.url }).then(function (d) {
          if (d.ok) { done(it, d.image_url, 'attached from ' + c.site); }
          else { it.status.textContent = 'Not attached: ' + (d.error || 'failed (' + d._status + ')') + ' Try another picture.'; useBtn.disabled = false; }
        });
      }
      function done(it, url, text) {
        it.thumbs.textContent = ''; it.btn.remove(); it.row.classList.add('done');
        it.status.textContent = '✓ Photo ' + text + '. ';
        var a = el('a', null, 'Open stored image'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; it.status.appendChild(a); it.done = true;
      }
      function attachAll() {
        var todo = items.filter(function (it) { return !it.done; });
        if (!todo.length || busy) return;
        if (!confirm('Search and attach photos for ' + todo.length + ' product' + (todo.length === 1 ? '' : 's') + '? Only pictures that pass the server’s product-match check are attached; the rest are left for you to pick.')) return;
        setBusy(true); var ok = 0, chain = Promise.resolve(), stop = false;
        todo.forEach(function (it, i) {
          chain = chain.then(function () {
            if (stop) return;
            note.textContent = 'Working on ' + (i + 1) + ' of ' + todo.length + '… attached so far: ' + ok;
            it.status.textContent = 'Searching and checking pictures…';
            return callJson('find-photo', { product_id: it.p.id, mode: 'auto' }).then(function (d) {
              if (d.ok && d.attached) { ok++; done(it, d.image_url, 'attached from ' + d.found_on + (d.ai_note ? ' (' + d.ai_note + ')' : '')); }
              else if (d.ok && d.mode === 'suggest') { stop = true; it.status.textContent = 'Automatic checking is not switched on (GEMINI_API_KEY missing), so use "Find photo" and pick pictures yourself.'; }
              else if (d._status === 429) { stop = true; it.status.textContent = 'Stopped: ' + d.error; }
              else it.status.textContent = 'Not attached: ' + (d.error || 'failed (' + d._status + ')') + ' Use "Find photo" to pick one yourself.';
            }).catch(function (e) { it.status.textContent = 'Not attached: ' + e.message; });
          });
        });
        chain.then(function () { setBusy(false); note.textContent = 'Finished. Attached ' + ok + ' of ' + todo.length + '. Rebuild product pages after this so the photos show on the site.'; });
      }
      return card;
    }

    function hasPhoto(r) { return !!(r.file || r.photoUrl.value.trim()); }
    function update() {
      status.textContent = rows.length + ' of ' + MAX + ' product slots used.';
      add.disabled = running || rows.length >= MAX;
      run.disabled = running || !rows.some(function (r) { return hasPhoto(r) && r.url.value.trim(); });
      rows.forEach(function (r) { r.fileInput.disabled = running; r.photoUrl.disabled = running; r.url.disabled = running; r.price.disabled = running; r.remove.disabled = running; });
    }
    function addRow() {
      if (rows.length >= MAX || running) return;
      var index = rows.length + 1, card = el('div', 'card'), label = el('h4', null, 'Product ' + index);
      var photoLabel = el('label', null, 'Product photo (upload from your device)'), file = el('input');
      file.type = 'file'; file.accept = 'image/*'; file.style.cssText = 'display:block;width:100%;padding:.55rem;border:1px dashed var(--ln);border-radius:10px;background:#fff';
      var photoUrlLabel = el('label', null, 'OR paste a direct photo link (jpg, png or webp)'), photoUrl = el('input');
      photoUrl.type = 'url'; photoUrl.placeholder = 'https://example.com/product-photo.jpg'; photoUrl.style.cssText = 'width:100%;padding:.7rem .8rem;border:1px solid var(--ln);border-radius:10px;font:inherit';
      var urlLabel = el('label', null, 'Source product website URL'), url = el('input');
      url.type = 'url'; url.placeholder = 'https://example.com/product-page'; url.style.cssText = 'width:100%;padding:.7rem .8rem;border:1px solid var(--ln);border-radius:10px;font:inherit';
      var priceLabel = el('label', null, 'Your selling price in KSh (optional override)'), price = el('input');
      price.type = 'number'; price.min = '1'; price.step = '0.01'; price.placeholder = 'Leave blank to use source price + 25%'; price.style.cssText = 'width:100%;padding:.7rem .8rem;border:1px solid var(--ln);border-radius:10px;font:inherit';
      var preview = el('img'); preview.alt = 'Selected product preview'; preview.hidden = true; preview.style.cssText = 'display:block;max-width:140px;max-height:120px;object-fit:contain;margin-top:.6rem;border-radius:8px';
      var remove = button('Remove', 'alt sm', function () { rows = rows.filter(function (r) { return r.card !== card; }); card.remove(); renumber(); update(); });
      var line = el('div', 'acts'); line.append(remove);
      card.append(label, photoLabel, file, photoUrlLabel, photoUrl, urlLabel, url, priceLabel, price, preview, line); rowsBox.appendChild(card);
      var row = { card: card, fileInput: file, photoUrl: photoUrl, url: url, price: price, preview: preview, remove: remove, file: null, done: false };
      rows.push(row);
      function showPreview() {
        if (row.file) { preview.src = URL.createObjectURL(row.file); preview.hidden = false; }
        else if (photoUrl.value.trim()) { preview.src = photoUrl.value.trim(); preview.hidden = false; }
        else { preview.removeAttribute('src'); preview.hidden = true; }
      }
      preview.onerror = function () { preview.hidden = true; };
      file.addEventListener('change', function () {
        row.file = file.files && file.files[0] || null;
        showPreview();
        update();
      });
      photoUrl.addEventListener('input', function () { showPreview(); update(); });
      url.addEventListener('input', update);
      price.addEventListener('input', update);
      update();
    }
    function renumber() { rows.forEach(function (r, i) { r.card.querySelector('h4').textContent = 'Product ' + (i + 1); }); }
    function imageData(file) {
      return new Promise(function (resolve, reject) {
        var img = new Image(), objectUrl = URL.createObjectURL(file);
        img.onload = function () {
          var scale = Math.min(1, 1600 / Math.max(img.width, img.height));
          var canvas = D.createElement('canvas'); canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale));
          var ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(objectUrl);
          canvas.toBlob(function (blob) {
            if (!blob) return reject(new Error('Could not compress the photo.'));
            var reader = new FileReader();
            reader.onload = function () { resolve(String(reader.result).split(',')[1]); };
            reader.onerror = function () { reject(new Error('Could not read the photo.')); };
            reader.readAsDataURL(blob);
          }, 'image/jpeg', 0.86);
        };
        img.onerror = function () { URL.revokeObjectURL(objectUrl); reject(new Error('This photo could not be opened.')); };
        img.src = objectUrl;
      });
    }
    /* Uploaded file wins; otherwise the server downloads the photo link (browsers cannot, because of CORS). */
    function photoPayload(r) {
      if (r.file) return imageData(r.file).then(function (image) { return { image: image, media_type: 'image/jpeg' }; });
      return Promise.resolve({ image_url: r.photoUrl.value.trim() });
    }
    function process() {
      if (running) return;
      var chosen = rows.filter(function (r) { return !r.done && (hasPhoto(r) || r.url.value.trim()); });
      if (!chosen.length) return;
      var incomplete = chosen.filter(function (r) { return !hasPhoto(r) || !r.url.value.trim(); });
      if (incomplete.length) { alert('Each product needs a photo (uploaded file or photo link) and its exact source product URL.'); return; }
      if (!confirm('Generate and save ' + chosen.length + ' unpublished product draft' + (chosen.length === 1 ? '' : 's') + '? Nothing will go live automatically.')) return;
      running = true; results.textContent = ''; update();
      var progress = el('div', 'card', 'Starting…'); results.appendChild(progress);
      var completed = 0, saved = 0, failed = [];
      var chain = Promise.resolve();
      chosen.forEach(function (r, i) {
        chain = chain.then(function () {
          progress.textContent = 'Processing ' + (i + 1) + ' of ' + chosen.length + '…';
          return photoPayload(r).then(function (photo) {
            var body = { url: r.url.value.trim(), selling_price_kes: r.price.value.trim() || undefined };
            Object.keys(photo).forEach(function (k) { body[k] = photo[k]; });
            return window.STMAdmin.raw('/functions/v1/ai-add-product', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
          }).then(function (response) {
            return response.text().then(function (raw) {
              var data = {}; try { data = raw ? JSON.parse(raw) : {}; } catch (_e) {}
              if (!response.ok || !data.ok) throw new Error(data.error || 'Product generation failed (' + response.status + ').');
              saved++;
              var card = el('div', 'card done');
              card.appendChild(el('h4', null, '✓ Draft saved: ' + data.product.name));
              card.appendChild(el('p', null, data.source_price_kes == null ? 'Owner-set selling price: KSh ' + Number(data.selling_price_kes).toLocaleString('en-KE') + ' · No markup · Not published' : 'Source price: KSh ' + Number(data.source_price_kes).toLocaleString('en-KE') + ' · Selling price includes 25% markup · Not published'));
              card.appendChild(el('p', 'meta', 'SEO title: ' + data.seo_title));
              card.appendChild(el('p', 'meta', 'Meta description preview: ' + data.meta_description_preview));
              card.appendChild(el('p', 'meta', data.price_note || data.page_note || 'Source price verified.'));
              var a = el('a', 'btn alt sm', 'Open draft in Catalog');
              a.href = '/admin.html#catalog'; a.target = '_blank'; a.rel = 'noopener'; card.appendChild(a);
              results.appendChild(card);
              r.done = true;
            });
          }).catch(function (error) {
            failed.push('Product ' + (i + 1) + ': ' + error.message);
            var card = el('div', 'card'); card.appendChild(el('h4', null, 'Product ' + (i + 1) + ' needs attention'));
            card.appendChild(el('p', 'meta', error.message)); results.appendChild(card);
          }).then(function () { completed++; progress.textContent = 'Finished ' + completed + ' of ' + chosen.length + ' · Drafts saved: ' + saved; });
        });
      });
      chain.then(function () {
        running = false;
        var summary = el('div', 'card'); summary.appendChild(el('h3', null, saved + ' drafts saved · ' + failed.length + ' need attention'));
        summary.appendChild(el('p', 'meta', 'All successful items are unpublished. Review names, descriptions, categories, pack sizes, images and SEO titles in Catalog before activating them.'));
        results.appendChild(summary);
        update();
      });
    }
    addRow();
  }
  window.STMPhotoAI = { mount: mount };
})();
