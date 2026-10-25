/* Stermont Arcade - cleaner homepage navigation.
   1. The 41 category icons become 6 department tiles (Pest Control and Agrovet first, as the core of the shop).
      Tapping a tile opens a short row of sub-category chips right under it.
   2. The 73 category sections further down are grouped under the same 6 departments, closed by default.
   3. The header tabs follow the same departments.
   Safe by design: the original icon strip and sections are reused, not replaced. If anything here fails, the
   page keeps its old layout (the old icon strip is only hidden once the new one is built). Loaded from img-protect.js. */
(function () {
  'use strict';
  function start() {
    try {
      var cats = document.getElementById('cats');
      if (!cats || document.getElementById('stm-verts')) return;
      var q = document.getElementById('q'), root = document.querySelector('#music-gear .wrap'), htabs = document.getElementById('htabs');
      function h(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }

      var V = [
        { k: 'pest', e: '\uD83D\uDC1B', n: 'Pest Control & Hygiene', t: 'Pest Control', d: 'Bed bugs, rodents, termites', spec: 1,
          q: ['pest control', 'rodent', 'termite', 'disinfectant'],
          s: ['pest-control-fumigation', 'bed-bug-killers', 'cockroach-ant-killers', 'mosquito-fly-control', 'rodent-control', 'termite-control', 'fumigation-chemicals', 'sprayers-equipment', 'disinfectants-hygiene'] },
        { k: 'agro', e: '\uD83C\uDF3E', n: 'Agrovet & Farm', t: 'Agrovet', d: 'Crop care, vet drugs, feeds', spec: 1,
          q: ['agrovet', 'herbicide', 'fungicide', 'insecticide', 'veterinary', 'animal feed', 'fertilizer', 'garden outdoors'],
          s: ['agrovet', 'agrochemicals', 'herbicides', 'fungicides', 'crop-insecticides', 'adjuvants-growth-regulators', 'fertilizers', 'veterinary-drugs', 'animal-feeds', 'seeds-seedlings', 'poultry-dairy-equipment', 'water-tanks-irrigation', 'beekeeping', 'fish-farming', 'protective-wear-safety', 'garden-outdoors'] },
        { k: 'elec', e: '\uD83D\uDCF1', n: 'Electronics', t: 'Electronics', d: 'Phones, TVs, audio, solar',
          q: ['tvs', 'phones', 'home theatre', 'bluetooth speaker', 'wall mount', 'computing', 'gaming', 'music', 'security cctv', 'solar power'],
          s: ['phones-tablets', 'phone-accessories', 'tvs-audio', 'televisions', 'home-theatre', 'bluetooth-speakers', 'tv-mounts-accessories', 'computing', 'printers-office-machines', 'networking-smart-home', 'cameras-photography', 'gaming', 'music-audio', 'security-cctv', 'solar-power', 'electrical-lighting'] },
        { k: 'home', e: '\uD83C\uDFE0', n: 'Home & Kitchen', t: 'Home', d: 'Appliances, furniture, tools',
          q: ['appliances', 'washing machine', 'fridge', 'home office', 'kitchen dining', 'furniture', 'cleaning laundry', 'building hardware', 'supermarket'],
          s: ['appliances', 'washing-machines', 'fridges-freezers', 'kitchen-dining', 'furniture', 'bedding-decor', 'cleaning-laundry', 'home-office', 'supermarket', 'building-hardware', 'tools-machinery'] },
        { k: 'fash', e: '\uD83D\uDC57', n: 'Fashion & Beauty', t: 'Fashion', d: 'Clothes, shoes, beauty',
          q: ['fashion', 'shoes', 'bags', 'watches jewellery', 'health beauty'],
          s: ['fashion', 'mens-fashion', 'womens-fashion', 'kids-fashion', 'shoes', 'bags', 'watches-jewellery', 'health-beauty', 'wedding-events'] },
        { k: 'more', e: '\uD83C\uDF81', n: 'More Departments', t: 'More', d: 'Baby, auto, books, toys',
          q: [], s: [] }
      ];
      var byK = {}, vOf = {}, sOf = {}, last = V[V.length - 1];
      V.forEach(function (v) { byK[v.k] = v; v.q.forEach(function (x) { vOf[x] = v; }); v.s.forEach(function (x) { sOf[x] = v; }); });

      /* ---- 1. department tiles + sub-category chips ---- */
      var pool = {}; V.forEach(function (v) { pool[v.k] = []; });
      [].slice.call(cats.querySelectorAll('.cat')).forEach(function (b) { pool[(vOf[b.getAttribute('data-q')] || last).k].push(b); });

      var grid = h('div', 'stm-verts'); grid.id = 'stm-verts'; grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', 'Shop by department');
      var panel = h('div', 'stm-sub'); panel.id = 'stm-sub'; panel.hidden = true; panel.setAttribute('role', 'region'); panel.setAttribute('aria-label', 'Categories');
      var tiles = [], open = null, tabs = [];
      V.forEach(function (v) {
        if (!pool[v.k].length) return;
        var t = h('button', 'stm-vt' + (v.spec ? ' spec' : '')); t.type = 'button'; t.setAttribute('data-v', v.k);
        t.setAttribute('aria-expanded', 'false'); t.setAttribute('aria-controls', 'stm-sub');
        var e = h('span', 'e', v.e); e.setAttribute('aria-hidden', 'true');
        t.appendChild(e); t.appendChild(h('b', '', v.n)); t.appendChild(h('small', '', v.d));
        if (v.spec) t.appendChild(h('i', 'tag', 'Specialty'));
        t.onclick = function () { toggle(v.k); };
        v.tile = t; tiles.push(t); grid.appendChild(t);
      });
      cats.parentNode.insertBefore(grid, cats);

      function label(b) { return (b.lastChild && b.lastChild.textContent || b.textContent).trim(); }
      function markTab(k) { tabs.forEach(function (b) { var on = b.getAttribute('data-v') === (k || 'all'); b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); }); }
      function close() {
        open = null; panel.hidden = true; tiles.forEach(function (t) { t.setAttribute('aria-expanded', 'false'); }); markTab(null);
      }
      function toggle(k, scroll) {
        if (open === k) { close(); return; }
        var v = byK[k]; if (!v || !v.tile) return;
        open = k; panel.textContent = '';
        tiles.forEach(function (t) { t.setAttribute('aria-expanded', t === v.tile ? 'true' : 'false'); });
        var hd = h('div', 'stm-sub-h'), x = h('button', 'stm-x', 'Close'); x.type = 'button'; x.onclick = close;
        hd.appendChild(h('b', '', v.n)); hd.appendChild(x); panel.appendChild(hd);
        var row = h('div', 'stm-chips');
        pool[k].forEach(function (b) {
          var c = h('button', 'stm-chip'); c.type = 'button';
          var r = b.querySelector('.ring');
          if (r) { var s = h('span', '', r.textContent); s.setAttribute('aria-hidden', 'true'); c.appendChild(s); }
          c.appendChild(document.createTextNode(label(b)));
          c.onclick = function () { b.click(); };
          row.appendChild(c);
        });
        panel.appendChild(row);
        if (root && groups[k]) {
          var all = h('button', 'stm-all', 'Browse every ' + v.t + ' category \u2193'); all.type = 'button';
          all.onclick = function () { setGroup(k, true); groups[k].el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
          panel.appendChild(all);
        }
        /* place the panel right under the row of tiles that holds the tapped tile */
        var cols = Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(' ').length);
        var i = tiles.indexOf(v.tile), endIdx = Math.min(tiles.length - 1, (Math.floor(i / cols) + 1) * cols - 1);
        grid.insertBefore(panel, tiles[endIdx].nextSibling);
        panel.hidden = false; markTab(k);
        if (scroll) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      /* ---- 2. group the category sections ---- */
      var groups = {};
      function setGroup(k, on) {
        var g = groups[k]; if (!g) return;
        g.el.classList.toggle('open', on); g.hd.setAttribute('aria-expanded', on ? 'true' : 'false'); g.tg.textContent = on ? '\u2212' : '+';
      }
      function place(m) { var v = sOf[m.getAttribute('data-slug')] || last, g = groups[v.k]; if (g && m.parentNode !== g.body) g.body.appendChild(m); }
      var mo = null, opts = { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] };
      function sync() {
        if (mo) mo.disconnect();
        try {
          [].slice.call(root.children).forEach(function (n) { if (n.classList && n.classList.contains('mcat')) place(n); });
          V.forEach(function (v) {
            var g = groups[v.k]; if (!g) return;
            var n = g.body.querySelectorAll('.mcat:not(.stm-empty)').length, txt = n + (n === 1 ? ' category' : ' categories');
            if (g.c.textContent !== txt) g.c.textContent = txt;
            g.el.hidden = n === 0;
          });
        } finally { if (mo) mo.observe(root, opts); }
      }
      if (root) {
        var first = root.querySelector('.mcat');
        if (first) {
          var wrap = h('div', 'stm-vgs');
          V.forEach(function (v) {
            var el = h('div', 'stm-vg'); el.setAttribute('data-v', v.k);
            var hd = h('button', 'stm-vg-h'); hd.type = 'button'; hd.setAttribute('aria-expanded', 'false');
            var e = h('span', 'e', v.e); e.setAttribute('aria-hidden', 'true');
            var c = h('span', 'c', ''), tg = h('span', 't', '+'); tg.setAttribute('aria-hidden', 'true');
            hd.appendChild(e); hd.appendChild(h('span', 'n', v.n)); hd.appendChild(c); hd.appendChild(tg);
            var body = h('div', 'stm-vg-b'); el.appendChild(hd); el.appendChild(body); wrap.appendChild(el);
            groups[v.k] = { el: el, hd: hd, body: body, c: c, tg: tg };
            hd.onclick = function () { setGroup(v.k, !el.classList.contains('open')); };
          });
          root.insertBefore(wrap, first);
          mo = new MutationObserver(function (recs) {
            recs.forEach(function (r) {   /* a category opened from elsewhere (hot deals, discount filter): open its department too */
              var t = r.target;
              if (r.type === 'attributes' && t.classList && t.classList.contains('mcat') && t.classList.contains('open')) {
                var g = t.closest && t.closest('.stm-vg'); if (g) setGroup(g.getAttribute('data-v'), true);
              }
            });
            clearTimeout(sync.t); sync.t = setTimeout(sync, 60);
          });
          sync();
        }
      }

      /* ---- 3. header tabs follow the departments ---- */
      if (htabs) {
        htabs.textContent = ''; tabs = [];
        var mk = function (k, text, fn) {
          var b = h('button', '', text); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('data-v', k);
          b.onclick = fn; tabs.push(b); htabs.appendChild(b); return b;
        };
        mk('all', 'ALL', function () { close(); if (q) { q.value = ''; q.dispatchEvent(new Event('input')); } window.scrollTo({ top: 0, behavior: 'smooth' }); });
        V.forEach(function (v) { if (v.tile) mk(v.k, v.t, function () { if (open !== v.k) toggle(v.k, true); else grid.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); });
        markTab(null);
        if (q) q.addEventListener('input', function () { if (!q.value.trim() && !open) markTab(null); });
      }

      var s = document.createElement('style');
      s.textContent =
        '.stm-nav-on #cats{display:none!important}' +
        '.stm-verts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem;margin:.2rem 0 .6rem}' +
        '@media(min-width:760px){.stm-verts{grid-template-columns:repeat(3,minmax(0,1fr));gap:.9rem}}' +
        '@media(min-width:1100px){.stm-verts{grid-template-columns:repeat(6,minmax(0,1fr))}}' +
        '.stm-vt{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:.15rem;text-align:left;min-height:112px;border:1px solid var(--line,#e6e1f5);background:var(--card,#fff);color:var(--ink,#1b1230);border-radius:18px;padding:.85rem .8rem;font:inherit;cursor:pointer;transition:transform .2s,box-shadow .2s,border-color .2s}' +
        '.stm-vt .e{display:grid;place-items:center;width:46px;height:46px;border-radius:14px;background:var(--tint,#f1ecfc);font-size:1.6rem;margin-bottom:.35rem}' +
        '.stm-vt b{font-size:.95rem;line-height:1.2}.stm-vt small{color:var(--muted,#6b6580);font-size:.76rem;line-height:1.3}' +
        '.stm-vt.spec{background:linear-gradient(145deg,#5b21b6,#7c3aed);color:#fff;border-color:transparent}.stm-vt.spec small{color:rgba(255,255,255,.85)}.stm-vt.spec .e{background:rgba(255,255,255,.18)}' +
        '.stm-vt .tag{position:absolute;top:.6rem;right:.6rem;font-style:normal;font-size:.6rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;background:#c8f31d;color:#2a0e5c;border-radius:999px;padding:.12rem .45rem}' +
        '.stm-vt:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(91,33,182,.18)}.stm-vt[aria-expanded=true]{border-color:#7c3aed;box-shadow:0 0 0 2px #7c3aed}' +
        '.stm-vt:focus-visible,.stm-chip:focus-visible,.stm-vg-h:focus-visible,.stm-x:focus-visible,.stm-all:focus-visible{outline:3px solid #7c3aed;outline-offset:2px}' +
        '.stm-sub{grid-column:1/-1;background:var(--panel,#f6f3fd);border-radius:18px;padding:.8rem}.stm-sub[hidden]{display:none}' +
        '.stm-sub-h{display:flex;justify-content:space-between;align-items:center;gap:.5rem;margin-bottom:.6rem}.stm-sub-h b{font-size:1rem}' +
        '.stm-x{border:0;background:none;color:var(--muted,#6b6580);font:inherit;font-weight:700;cursor:pointer;padding:.3rem .5rem}' +
        '.stm-chips{display:flex;flex-wrap:wrap;gap:.45rem}' +
        '.stm-chip{display:inline-flex;align-items:center;gap:.4rem;border:1px solid var(--line,#e6e1f5);background:#fff;color:var(--ink,#1b1230);border-radius:999px;padding:.5rem .85rem;font:inherit;font-size:.88rem;font-weight:600;cursor:pointer}' +
        '.stm-chip:hover{border-color:#7c3aed;color:#5b21b6}' +
        '.stm-all{display:inline-block;margin-top:.7rem;border:0;background:none;color:#5b21b6;font:inherit;font-weight:700;cursor:pointer;padding:.2rem 0}' +
        '.stm-vgs{display:grid;gap:.6rem;margin:.6rem 0 1rem}' +
        '.stm-vg{border:1px solid var(--line,#e6e1f5);border-radius:16px;background:var(--card,#fff);overflow:hidden}.stm-vg[hidden]{display:none}' +
        '.stm-vg-h{width:100%;display:flex;align-items:center;gap:.7rem;border:0;background:none;font:inherit;color:inherit;cursor:pointer;padding:.8rem .9rem;text-align:left}' +
        '.stm-vg-h .e{font-size:1.4rem}.stm-vg-h .n{font-weight:800;flex:1}.stm-vg-h .c{color:var(--muted,#6b6580);font-size:.8rem}.stm-vg-h .t{font-weight:800;font-size:1.3rem;color:var(--orange,#f97316);width:1rem;text-align:center}' +
        '.stm-vg-b{display:none;padding:0 .8rem .4rem}.stm-vg.open .stm-vg-b{display:block}' +
        '@media(prefers-reduced-motion:reduce){.stm-vt{transition:none}.stm-vt:hover{transform:none}}';
      document.head.appendChild(s);
      document.documentElement.classList.add('stm-nav-on');
    } catch (e) { try { console.warn('nav-modern:', e); } catch (x) {} }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
