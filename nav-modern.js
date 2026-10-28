/* Stermont Arcade - Kilimall-style homepage navigation.
   Same structure and category names as kilimall.co.ke:
   1. DEPARTMENT TABS sit right under the search box (bold + underline on the active one): Pest Control and
      Agrovet (your specialties) first, then Kilimall's own list - TVs, Appliances, Kitchen, Home, Phones,
      Refurbished Phones, Accessories, Personal Care, Beauty, Health Care, Wigs and Tools, Men/Women/Kids Shoes,
      Women/Men Accessories, Women/Men Clothes, Women/Men Bags, Computers & Accessories, Watches & Jewellery,
      Kids & Baby Products, Automotive, Others.
   2. Under the tabs, a grid of round-corner icons shows the sub-categories of the active department
      (5 per row on a phone, 8 on a desktop). Tapping an icon opens that category, exactly as before.
      Each icon shows a real photo of one of YOUR products in that category (picked automatically from the
      loaded catalogue); a category with no photo yet keeps its emoji.
   3. The product feed below shows ONLY the active department. A department with no products yet shows a short
      "ask us on WhatsApp" note instead of an empty page.
   Products are placed by category slug, or by category NAME (create a category called "Men Shoes" in the admin
   and it lands in the Men Shoes tab). Safe by design: the original #cats icon strip and category sections are
   reused, never deleted. If anything here fails, the page keeps its old layout.
   While a search is running, every department is shown so no result is ever hidden. Loaded from img-protect.js. */
(function () {
  'use strict';
  function start() {
    try {
      var cats = document.getElementById('cats');
      if (!cats || document.getElementById('stm-verts')) return;
      var q = document.getElementById('q'), root = document.querySelector('#music-gear .wrap'), htabs = document.getElementById('htabs');
      function h(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }

      /* k = key, t = tab name (Kilimall's wording), q = existing icons (data-q) shown here, s = category slugs placed here,
         x = extra icons [label, emoji, search word] that mirror Kilimall's sub-category grids */
      var V = [
        { k: 'pest', t: 'Pest Control', q: ['pest control', 'rodent', 'termite', 'disinfectant'],
          s: ['pest-control-fumigation', 'bed-bug-killers', 'cockroach-ant-killers', 'mosquito-fly-control', 'rodent-control', 'termite-control', 'fumigation-chemicals', 'sprayers-equipment', 'disinfectants-hygiene'] },
        { k: 'agro', t: 'Agrovet', q: ['agrovet', 'herbicide', 'fungicide', 'insecticide', 'veterinary', 'animal feed', 'fertilizer', 'garden outdoors'],
          s: ['agrovet', 'agrochemicals', 'herbicides', 'fungicides', 'crop-insecticides', 'adjuvants-growth-regulators', 'fertilizers', 'veterinary-drugs', 'animal-feeds', 'seeds-seedlings', 'poultry-dairy-equipment', 'water-tanks-irrigation', 'beekeeping', 'fish-farming', 'protective-wear-safety', 'garden-outdoors'] },
        { k: 'tvs', t: 'TVs', q: ['tvs', 'home theatre', 'bluetooth speaker', 'wall mount', 'music'],
          s: ['tvs-audio', 'televisions', 'home-theatre', 'bluetooth-speakers', 'tv-mounts-accessories', 'music-audio'] },
        { k: 'appl', t: 'Appliances', q: ['appliances', 'washing machine', 'fridge', 'solar power'],
          s: ['appliances', 'washing-machines', 'fridges-freezers', 'solar-power'] },
        { k: 'kitch', t: 'Kitchen', q: ['kitchen dining'], s: ['kitchen-dining'] },
        { k: 'home', t: 'Home', q: ['home office', 'cleaning laundry', 'building hardware', 'supermarket'],
          s: ['furniture', 'bedding-decor', 'cleaning-laundry', 'home-office', 'supermarket', 'building-hardware', 'tools-machinery', 'electrical-lighting'],
          x: [['Duvets', '\uD83D\uDECF\uFE0F', 'duvet'], ['Mattress', '\uD83D\uDECC', 'mattress'], ['Furniture', '\uD83D\uDECB\uFE0F', 'furniture'], ['Mosquito Net', '\uD83E\uDD9F', 'mosquito net'], ['Wardrobe', '\uD83D\uDEAA', 'wardrobe'],
              ['Shoe Rack', '\uD83D\uDC5F', 'shoe rack'], ['Carpet', '\uD83E\uDDF6', 'carpet'], ['Curtain', '\uD83E\uDE9F', 'curtain'], ['Tools', '\uD83D\uDEE0\uFE0F', 'tools'], ['Garden', '\uD83C\uDF33', 'garden']] },
        { k: 'phones', t: 'Phones', q: [], s: ['phones-tablets'],
          x: [['New phones', '\uD83D\uDCF1', 'phones'], ['Refurbished', '\u267B\uFE0F', 'refurbished'], ['iPhone', '\uD83D\uDCF1', 'iphone'], ['Samsung', '\uD83D\uDCF1', 'samsung'], ['Redmi', '\uD83D\uDCF1', 'redmi'],
              ['Infinix', '\uD83D\uDCF1', 'infinix'], ['itel', '\uD83D\uDCF1', 'itel'], ['Tecno', '\uD83D\uDCF1', 'tecno'], ['Realme', '\uD83D\uDCF1', 'realme'], ['HONOR', '\uD83D\uDCF1', 'honor']] },
        { k: 'refurb', t: 'Refurbished Phones', q: [], s: ['refurbished-phones'] },
        { k: 'acc', t: 'Accessories', q: [], s: ['phone-accessories'] },
        { k: 'pcare', t: 'Personal Care', q: [], s: ['personal-care'] },
        { k: 'beauty', t: 'Beauty', q: ['health beauty'], s: ['health-beauty', 'beauty'] },
        { k: 'hcare', t: 'Health Care', q: [], s: ['health-care'] },
        { k: 'wigs', t: 'Wigs and Tools', q: [], s: ['wigs-and-tools'] },
        { k: 'mshoes', t: 'Men Shoes', q: ['shoes'], s: ['shoes', 'men-shoes', 'mens-shoes'] },
        { k: 'wshoes', t: 'Women Shoes', q: [], s: ['women-shoes', 'womens-shoes'] },
        { k: 'kshoes', t: 'Kids Shoes', q: [], s: ['kids-shoes'] },
        { k: 'wacc', t: 'Women Accessories', q: [], s: ['women-accessories', 'womens-accessories'] },
        { k: 'macc', t: 'Men Accessories', q: [], s: ['men-accessories', 'mens-accessories'] },
        { k: 'wcl', t: 'Women Clothes', q: ['fashion'], s: ['fashion', 'womens-fashion', 'women-clothes', 'wedding-events'] },
        { k: 'mcl', t: 'Men Clothes', q: [], s: ['mens-fashion', 'men-clothes'] },
        { k: 'wbag', t: 'Women Bags', q: ['bags'], s: ['bags', 'women-bags', 'womens-bags'] },
        { k: 'mbag', t: 'Men Bags', q: [], s: ['men-bags', 'mens-bags'] },
        { k: 'comp', t: 'Computers & Accessories', q: ['computing'], s: ['computing', 'printers-office-machines', 'networking-smart-home', 'computers-accessories'] },
        { k: 'watch', t: 'Watches & Jewellery', q: ['watches jewellery'], s: ['watches-jewellery'] },
        { k: 'kids', t: 'Kids & Baby Products', q: [], s: ['kids-fashion', 'kids-baby-products', 'baby-products'] },
        { k: 'auto', t: 'Automotive', q: [], s: ['automotive'] },
        { k: 'more', t: 'Others', q: [], s: ['gaming', 'security-cctv', 'cameras-photography', 'others'] }
      ];
      var byK = {}, vOf = {}, sOf = {}, nOf = {}, last = V[V.length - 1];
      function norm(x) { return String(x || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim(); }
      V.forEach(function (v) { byK[v.k] = v; v.q.forEach(function (x) { vOf[x] = v; }); v.s.forEach(function (x) { sOf[x] = v; }); nOf[norm(v.t)] = v; });
      /* a category called exactly like a tab (in any wording) goes to that tab even if its slug is new */
      [['pest control and fumigation', 'pest'], ['pest control and hygiene', 'pest'], ['agrovet and farm', 'agro'], ['tv audio and video', 'tvs'], ['tvs and audio', 'tvs'], ['home and kitchen', 'kitch'], ['phones and accessories', 'phones'],
       ['health and beauty', 'beauty'], ['clothes', 'wcl'], ['shoes', 'mshoes'], ['bags', 'wbag'], ['computers', 'comp'], ['watches', 'watch'], ['baby products', 'kids']].forEach(function (a) { nOf[a[0]] = byK[a[1]]; });
      function deptOf(m) {
        var sl = m.getAttribute('data-slug'); if (sOf[sl]) return sOf[sl];
        var hd = m.querySelector('.sub'), nm = norm(m.getAttribute('data-cat') || (hd && hd.firstChild ? hd.firstChild.textContent : ''));
        return nOf[nm] || last;
      }

      /* ---- 1. one pane of sub-category icons per department (they click the original icons) ---- */
      var pool = {}; V.forEach(function (v) { pool[v.k] = []; });
      [].slice.call(cats.querySelectorAll('.cat')).forEach(function (b) { pool[(vOf[b.getAttribute('data-q')] || last).k].push(b); });

      var grid = h('div', 'kc-icons'); grid.id = 'stm-verts'; grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', 'Sub-categories');
      var panes = {}, icons = [];
      function label(b) { return (b.lastChild && b.lastChild.textContent || b.textContent).trim(); }
      function searchFor(term) {
        if (!q) return; q.value = term; q.setAttribute('data-src', 'category'); q.dispatchEvent(new Event('input'));
        var rg = document.getElementById('range'); if (rg && rg.scrollIntoView) rg.scrollIntoView({ behavior: 'smooth' });
      }
      function icon(p, em, text, term, go) {
        var i = h('button', 'kc-i'); i.type = 'button';
        var rs = h('span', 'r', em); rs.setAttribute('aria-hidden', 'true');
        i.appendChild(rs); i.appendChild(h('span', 'l', text)); i.onclick = go;
        icons.push({ q: term, r: rs, emoji: em, done: false }); p.appendChild(i);
      }
      V.forEach(function (v) {
        var p = h('div', 'kc-pane'); p.setAttribute('data-v', v.k); panes[v.k] = p;
        (v.x || []).forEach(function (e) { icon(p, e[1], e[0], e[2], function () { searchFor(e[2]); }); });
        pool[v.k].forEach(function (b) {
          var r = b.querySelector('.ring');
          icon(p, r ? r.textContent : '', label(b), b.getAttribute('data-q') || '', function () { b.click(); });
        });
        grid.appendChild(p);
      });
      cats.parentNode.insertBefore(grid, cats);

      /* ---- 2. the product sections, grouped by department ---- */
      var groups = {}, wrap = null;
      function place(m) { var v = deptOf(m), g = groups[v.k]; if (g && m.parentNode !== g.body) g.body.appendChild(m); }
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
          V.forEach(function (v) { var g = groups[v.k]; if (g) g.el.classList.toggle('kc-none', count(v.k) === 0); });
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
            var body = h('div', 'stm-vg-b'), em = h('div', 'kc-e'); el.appendChild(body); wrap.appendChild(el);
            em.appendChild(h('b', '', 'No ' + v.t + ' products yet'));
            em.appendChild(document.createTextNode('New items arrive often. Tell us what you need on '));
            var wa = h('a', '', 'WhatsApp'); wa.href = 'https://wa.me/254748888230?text=' + encodeURIComponent('Hello Stermont Arcade, I am looking for: ' + v.t); wa.target = '_blank'; wa.rel = 'noopener';
            em.appendChild(wa); em.appendChild(document.createTextNode(' and we will find it for you.')); el.appendChild(em);
            groups[v.k] = { el: el, body: body };
          });
          root.insertBefore(wrap, first);
          mo = new MutationObserver(function () { clearTimeout(sync.t); sync.t = setTimeout(sync, 60); });
        }
      }

      /* ---- 3. department tabs under the search box ---- */
      var active = null, chosen = false, tabEls = {}, tabSig = '';
      function live(v) { return true; }
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
        '.stm-vg{display:none}.stm-vg.kc-on{display:block}.stm-vg .kc-e{display:none}.stm-vg.kc-none .kc-e{display:block;text-align:center;color:var(--muted,#6b6580);font-size:.92rem;line-height:1.5;padding:2rem 1rem}.stm-vg .kc-e b{display:block;color:var(--ink,#1b1230);font-size:1rem;margin-bottom:.3rem}.stm-vg .kc-e a{color:#166534;font-weight:700}' +
        'html.stm-nav-on #kf-chips{display:none!important}' +
        'body.stm-results .stm-vg:not(.kc-none){display:block}body.stm-results .stm-vg.kc-none{display:none}body.stm-results .kc-icons{display:none}' +
        '@media(prefers-reduced-motion:reduce){.kc-i .r{transition:none}.kc-i:hover .r{transform:none}}';
      document.head.appendChild(s);
      document.documentElement.classList.add('stm-nav-on');
    } catch (e) { try { console.warn('nav-modern:', e); } catch (x) {} }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
