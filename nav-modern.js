/* Stermont Arcade - Kilimall-style homepage navigation.
   Same structure as kilimall.co.ke:
   1. DEPARTMENT TABS sit right under the search box (bold + underline on the active one).
   2. Under the tabs, a grid of round-corner icons shows the sub-categories of the active department
      (5 per row on a phone, 8 on a desktop). Tapping an icon opens that category, exactly as before.
      Each icon shows a real photo of one of YOUR products in that category (picked automatically from the
      loaded catalogue); a category with no photo yet keeps its emoji.
   3. The product feed below shows ONLY the active department (no more closed "+" accordions).
   Safe by design: the original #cats icon strip and the category sections are reused, never deleted.
   If anything here fails, the page keeps its old layout (the old icon strip is only hidden once the new one is built).
   While a search is running, every department is shown so no result is ever hidden. Loaded from img-protect.js. */
(function () {
  'use strict';
  function start() {
    try {
      var cats = document.getElementById('cats');
      if (!cats || document.getElementById('stm-verts')) return;
      var q = document.getElementById('q'), root = document.querySelector('#music-gear .wrap'), htabs = document.getElementById('htabs');
      function h(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }

      var V = [
        { k: 'pest', n: 'Pest Control & Hygiene', t: 'Pest Control',
          q: ['pest control', 'rodent', 'termite', 'disinfectant'],
          s: ['pest-control-fumigation', 'bed-bug-killers', 'cockroach-ant-killers', 'mosquito-fly-control', 'rodent-control', 'termite-control', 'fumigation-chemicals', 'sprayers-equipment', 'disinfectants-hygiene'] },
        { k: 'agro', n: 'Agrovet & Farm', t: 'Agrovet',
          q: ['agrovet', 'herbicide', 'fungicide', 'insecticide', 'veterinary', 'animal feed', 'fertilizer', 'garden outdoors'],
          s: ['agrovet', 'agrochemicals', 'herbicides', 'fungicides', 'crop-insecticides', 'adjuvants-growth-regulators', 'fertilizers', 'veterinary-drugs', 'animal-feeds', 'seeds-seedlings', 'poultry-dairy-equipment', 'water-tanks-irrigation', 'beekeeping', 'fish-farming', 'protective-wear-safety', 'garden-outdoors'] },
        { k: 'elec', n: 'Electronics', t: 'Electronics',
          q: ['tvs', 'phones', 'home theatre', 'bluetooth speaker', 'wall mount', 'computing', 'gaming', 'music', 'security cctv', 'solar power'],
          s: ['phones-tablets', 'phone-accessories', 'tvs-audio', 'televisions', 'home-theatre', 'bluetooth-speakers', 'tv-mounts-accessories', 'computing', 'printers-office-machines', 'networking-smart-home', 'cameras-photography', 'gaming', 'music-audio', 'security-cctv', 'solar-power', 'electrical-lighting'] },
        { k: 'home', n: 'Home & Kitchen', t: 'Home',
          q: ['appliances', 'washing machine', 'fridge', 'home office', 'kitchen dining', 'furniture', 'cleaning laundry', 'building hardware', 'supermarket'],
          s: ['appliances', 'washing-machines', 'fridges-freezers', 'kitchen-dining', 'furniture', 'bedding-decor', 'cleaning-laundry', 'home-office', 'supermarket', 'building-hardware', 'tools-machinery'] },
        { k: 'fash', n: 'Fashion & Beauty', t: 'Fashion',
          q: ['fashion', 'shoes', 'bags', 'watches jewellery', 'health beauty'],
          s: ['fashion', 'mens-fashion', 'womens-fashion', 'kids-fashion', 'shoes', 'bags', 'watches-jewellery', 'health-beauty', 'wedding-events'] },
        { k: 'more', n: 'More Departments', t: 'More', q: [], s: [] }
      ];
      var byK = {}, vOf = {}, sOf = {}, last = V[V.length - 1];
      V.forEach(function (v) { byK[v.k] = v; v.q.forEach(function (x) { vOf[x] = v; }); v.s.forEach(function (x) { sOf[x] = v; }); });

      /* ---- 1. one pane of sub-category icons per department (they click the original icons) ---- */
      var pool = {}; V.forEach(function (v) { pool[v.k] = []; });
      [].slice.call(cats.querySelectorAll('.cat')).forEach(function (b) { pool[(vOf[b.getAttribute('data-q')] || last).k].push(b); });

      var grid = h('div', 'kc-icons'); grid.id = 'stm-verts'; grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', 'Sub-categories');
      var panes = {}, icons = [];
      function label(b) { return (b.lastChild && b.lastChild.textContent || b.textContent).trim(); }
      V.forEach(function (v) {
        var p = h('div', 'kc-pane'); p.setAttribute('data-v', v.k); panes[v.k] = p;
        pool[v.k].forEach(function (b) {
          var i = h('button', 'kc-i'); i.type = 'button';
          var r = b.querySelector('.ring'), rs = h('span', 'r', r ? r.textContent : ''); rs.setAttribute('aria-hidden', 'true');
          i.appendChild(rs); i.appendChild(h('span', 'l', label(b)));
          i.onclick = function () { b.click(); };
          icons.push({ q: b.getAttribute('data-q') || '', r: rs, emoji: rs.textContent, done: false });
          p.appendChild(i);
        });
        grid.appendChild(p);
      });
      cats.parentNode.insertBefore(grid, cats);

      /* ---- 2. the product sections, grouped by department ---- */
      var groups = {}, wrap = null;
      function place(m) { var v = sOf[m.getAttribute('data-slug')] || last, g = groups[v.k]; if (g && m.parentNode !== g.body) g.body.appendChild(m); }
      var mo = null, opts = { childList: true, subtree: true };
      function count(k) { var g = groups[k]; return g ? g.body.querySelectorAll('.mcat:not(.stm-empty)').length : 0; }
      /* ---- real product photos on the icons (your own catalogue, nothing hot-linked from other sites) ---- */
      function words(x) { return String(x || '').toLowerCase().split(/[^a-z0-9]+/).map(function (w) { return w === 'tvs' ? 'tv' : w; }).filter(function (w) { return w.length > 1 && w !== 'control'; }); }
      function paintPhotos() {
        if (!root || !icons.length) return;
        var cards = [].slice.call(root.querySelectorAll('.pcard')).filter(function (c) { return c._p && c._p.images && c._p.images[0]; });
        if (!cards.length) return;
        var hay = cards.map(function (c) { var p = c._p, ct = p.categories || {}; return { cat: ((ct.slug || '') + ' ' + (ct.name || '')).toLowerCase(), nm: String(p.vbase || p.name || '').toLowerCase() }; });
        icons.forEach(function (ic) {
          if (ic.done) return;
          var ws = words(ic.q), best = 0, bi = -1;
          cards.forEach(function (c, i) {
            var sc = 0; ws.forEach(function (w) { sc += hay[i].cat.indexOf(w) > -1 ? 2 : hay[i].nm.indexOf(w) > -1 ? 1 : 0; });
            if (sc > 0 && c._p.stock > 0) sc += 0.5;
            if (sc > best) { best = sc; bi = i; }
          });
          if (bi < 0) return;
          var im = new Image(); im.alt = ''; im.width = im.height = 64; im.loading = 'lazy'; im.decoding = 'async';
          im.onerror = function () { ic.r.classList.remove('ph'); ic.r.textContent = ic.emoji; ic.done = false; ic.bad = true; };
          if (ic.bad) return;
          im.src = cards[bi]._p.images[0]; ic.r.textContent = ''; ic.r.classList.add('ph'); ic.r.appendChild(im); ic.done = true;
        });
      }
      function sync() {
        if (mo) mo.disconnect();
        try {
          [].slice.call(root.children).forEach(function (n) { if (n.classList && n.classList.contains('mcat')) place(n); });
          V.forEach(function (v) { var g = groups[v.k]; if (g) g.el.hidden = count(v.k) === 0; });
          drawTabs();
          paintPhotos();
          /* the first department that actually has products opens by default, until the shopper picks one */
          if (!chosen && active && count(active) === 0) {
            for (var i = 0; i < V.length; i++) { if (count(V[i].k) > 0) { activate(V[i].k, false); break; } }
          }
        } finally { if (mo) mo.observe(root, opts); }
      }
      if (root) {
        var first = root.querySelector('.mcat');
        if (first) {
          wrap = h('div', 'stm-vgs');
          V.forEach(function (v) {
            var el = h('div', 'stm-vg'); el.setAttribute('data-v', v.k);
            var body = h('div', 'stm-vg-b'); el.appendChild(body); wrap.appendChild(el);
            groups[v.k] = { el: el, body: body };
          });
          root.insertBefore(wrap, first);
          mo = new MutationObserver(function () { clearTimeout(sync.t); sync.t = setTimeout(sync, 60); });
        }
      }

      /* ---- 3. department tabs under the search box ---- */
      var active = null, chosen = false, tabEls = {}, tabSig = '';
      function live(v) { return pool[v.k].length > 0 || count(v.k) > 0; }
      function activate(k, byUser) {
        if (!byK[k]) return;
        active = k; if (byUser) chosen = true;
        V.forEach(function (v) {
          panes[v.k].classList.toggle('on', v.k === k);
          if (groups[v.k]) groups[v.k].el.classList.toggle('kc-on', v.k === k);
          var b = tabEls[v.k]; if (b) { var on = v.k === k; b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); }
        });
        var t = tabEls[k]; if (t && t.scrollIntoView) { try { t.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); } catch (e) {} }
        if (byUser) {
          if (q && q.value.trim()) { q.value = ''; q.dispatchEvent(new Event('input')); }
          if (grid.getBoundingClientRect().top < 0) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      function drawTabs() {
        if (!htabs) return;
        var vs = V.filter(live), sig = vs.map(function (v) { return v.k; }).join('|');
        if (sig === tabSig) return;
        tabSig = sig; htabs.textContent = ''; tabEls = {};
        vs.forEach(function (v) {
          var b = h('button', '', v.t); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('data-v', v.k);
          b.onclick = function () { activate(v.k, true); };
          tabEls[v.k] = b; htabs.appendChild(b);
        });
        if (active && !tabEls[active] && vs.length) { activate(vs[0].k, false); } else if (active) { activate(active, false); }
      }
      var firstLive = V.filter(live)[0] || V[0];
      active = firstLive.k;
      drawTabs();
      activate(active, false);
      if (mo) sync();

      var s = document.createElement('style');
      s.textContent =
        '.stm-nav-on #cats{display:none!important}' +
        '.kc-icons{background:var(--card,#fff);border-radius:12px;padding:.9rem .3rem;margin:.2rem 0 .8rem;scroll-margin-top:calc(var(--kf-top,0px) + 8px)}' +
        '.kc-pane{display:none;grid-template-columns:repeat(5,minmax(0,1fr));gap:.9rem .2rem}.kc-pane.on{display:grid}.kc-pane:empty.on{display:none}' +
        '@media(min-width:760px){.kc-pane{grid-template-columns:repeat(8,minmax(0,1fr));gap:1.2rem .6rem}}' +
        '.kc-i{display:flex;flex-direction:column;align-items:center;gap:.35rem;border:0;background:none;font:inherit;font-size:.72rem;font-weight:500;line-height:1.2;color:var(--ink,#1b1230);cursor:pointer;padding:0 .1rem;text-align:center}' +
        '.kc-i .r{width:100%;max-width:64px;aspect-ratio:1;border-radius:16px;background:var(--tint,#f1ecfc);display:grid;place-items:center;font-size:1.7rem;overflow:hidden;transition:transform .2s}' +
        '.kc-i .r.ph{background:#fff;border:1px solid var(--line,#e6e1f5)}.kc-i .r img{width:100%;height:100%;object-fit:contain;display:block}' +
        '.kc-i .l{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}' +
        '.kc-i:hover .r{transform:scale(1.05)}' +
        '.kc-i:focus-visible,.tabs button:focus-visible{outline:3px solid #7c3aed;outline-offset:2px}' +
        '.stm-vgs{margin:.2rem 0 1rem}' +
        '.stm-vg{display:none}.stm-vg.kc-on:not([hidden]){display:block}' +
        'html.stm-nav-on #kf-chips{display:none!important}' +
        'body.stm-results .stm-vg:not([hidden]){display:block}body.stm-results .kc-icons{display:none}' +
        '@media(prefers-reduced-motion:reduce){.kc-i .r{transition:none}.kc-i:hover .r{transform:none}}';
      document.head.appendChild(s);
      document.documentElement.classList.add('stm-nav-on');
    } catch (e) { try { console.warn('nav-modern:', e); } catch (x) {} }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
