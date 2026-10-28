/* Stermont Arcade · admin: AI Add Product.
   Mounted by admin.html through STMAI.mount(containerEl).
   Pick a product photo (+ optional price link) -> the ai-add-product function (Gemini) writes the listing and saves it as a DRAFT
   (hidden from the shop). Review it here, then tap Publish. Uses window.STMAdmin (raw, ready, money) exposed by admin.html.
   All text from the server is set with textContent. */
(function () {
  var D = document;
  function h(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function inp(tag, attrs) { var i = D.createElement(tag); Object.keys(attrs || {}).forEach(function (k) { i.setAttribute(k, attrs[k]); }); i.style.cssText = 'width:100%;padding:.65rem .75rem;border:1px solid var(--ln);border-radius:10px;font:inherit;background:#fff'; return i; }
  function field(label, input) { var w = h('div'); w.appendChild(h('label', null, label)); w.appendChild(input); return w; }
  function btn(text, cls, fn) { var b = h('button', 'btn ' + (cls || ''), text); b.type = 'button'; b.onclick = fn; b.style.width = '100%'; b.style.marginTop = '.8rem'; return b; }

  // shrink the photo in the browser so it uploads fast on mobile data
  function shrink(file, prev) {
    return new Promise(function (ok, bad) {
      var img = new Image();
      img.onload = function () {
        var s = Math.min(1, 1400 / Math.max(img.width, img.height)), c = D.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        var d = c.toDataURL('image/jpeg', 0.85);
        prev.src = d; prev.style.display = 'block';
        ok(d.split(',')[1]);
      };
      img.onerror = function () { bad(new Error('Could not read that image')); };
      img.src = window.URL.createObjectURL(file);
    });
  }

  function mount(root) {
    root.textContent = '';
    var A = window.STMAdmin, b64 = '', draftId = '', busy = false;
    var card = h('div', 'card'); root.appendChild(card);
    card.appendChild(h('p', 'meta', 'Take or choose a product photo, paste the price link (optional) and tap the button. The product is saved as a hidden draft. Nothing goes on the shop until you tap Publish.'));

    var photo = inp('input', { type: 'file', accept: 'image/*' });
    var prev = h('img'); prev.alt = ''; prev.style.cssText = 'max-width:100%;max-height:220px;border-radius:10px;margin-top:.6rem;display:none';
    var url = inp('input', { type: 'url', placeholder: 'https://www.jumia.co.ke/…' });
    var mk = inp('input', { type: 'number', step: '0.05', min: '1', value: '1.3' });
    var pr = inp('input', { type: 'number', min: '1', placeholder: 'auto' });
    card.appendChild(field('Product photo', photo)); card.appendChild(prev);
    card.appendChild(field('Page with the price (optional link)', url));
    var row = h('div'); row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:.6rem';
    row.appendChild(field('Markup (× source price)', mk)); row.appendChild(field('Or set price (KES)', pr)); card.appendChild(row);

    var st = h('div', 'meta'); st.style.marginTop = '.7rem';
    function say(t, kind) { st.textContent = t || ''; st.className = kind === 'err' ? 'err' : 'meta'; st.style.color = kind === 'ok' ? '#15803d' : ''; st.hidden = !t; }
    var run = btn('Create draft product', '', go);
    card.appendChild(run); card.appendChild(st);

    var res = h('div', 'card'); res.hidden = true; root.appendChild(res);
    var rn = h('b'), rd = h('p'), rp = h('b'), rc = h('small', 'meta'), rm = h('small', 'meta');
    rd.style.fontSize = '.92rem';
    var pub = btn('Publish', '', publish), again = btn('Add another', 'alt', reset);
    var rpp = h('p'); rpp.appendChild(rp); rpp.appendChild(D.createTextNode(' ')); rpp.appendChild(rc);
    [rn, rd, rpp, rm, pub, again].forEach(function (e) { res.appendChild(e); });

    photo.onchange = function () {
      var f = photo.files[0]; b64 = '';
      if (f) shrink(f, prev).then(function (d) { b64 = d; }, function (e) { say(e.message, 'err'); });
    };

    function go() {
      if (busy) return;
      if (!b64) return say('Choose a product photo first.', 'err');
      busy = true; run.disabled = true; say('Reading photo and page… about 20 seconds');
      A.ready().then(function () {
        return A.raw('/functions/v1/ai-add-product', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: b64, media_type: 'image/jpeg', url: url.value.trim() || undefined, markup: +mk.value || 1.3, price: +pr.value || undefined })
        });
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (!j.ok) {
          if (j.needs_price) { pr.focus(); return say(j.error + ' Type a price above and tap the button again.', 'err'); }
          return say(j.error || 'Something went wrong', 'err');
        }
        var p = j.product; draftId = p.id;
        rn.textContent = p.name; rd.textContent = p.description;
        rp.textContent = 'KES ' + Number(p.price).toLocaleString('en-KE');
        rc.textContent = p.cost ? '(cost ' + Number(p.cost).toLocaleString('en-KE') + ')' : '';
        rm.textContent = [j.price_note, j.page_note, j.meta_description ? 'SEO: ' + j.meta_description : ''].filter(Boolean).join(' ');
        pub.disabled = false; res.hidden = false;
        say('Draft saved. Not on the shop until you publish.', 'ok');
      }).catch(function (e) { say(e.message, 'err'); }).then(function () { busy = false; run.disabled = false; });
    }

    function publish() {
      if (!draftId) return;
      pub.disabled = true;
      A.raw('/rest/v1/products?id=eq.' + encodeURIComponent(draftId), { method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ active: true }) })
        .then(function (r) { if (!r.ok) throw new Error('Could not publish (' + r.status + ')'); say('Published on the shop.', 'ok'); })
        .catch(function (e) { pub.disabled = false; say(e.message, 'err'); });
    }

    function reset() { res.hidden = true; photo.value = ''; url.value = ''; pr.value = ''; prev.style.display = 'none'; b64 = ''; draftId = ''; say(''); }
  }

  window.STMAI = { mount: mount };
})();
