/* Stermont Arcade · Kilimall-style category pages (/c/...).
   - Two-column product grid on phones (3 to 5 on bigger screens) with tidy cards.
   - Sticky bar under the header: sub-category chips (on hub pages) + sort (Price low/high, Name).
   - Products load as you scroll (20 at a time) instead of one very long page.
   The page's own HTML is untouched, so Google still sees every product link.
   Loaded by img-protect.js on /c/ pages only. To switch off: remove the cat-feel loader at the bottom of img-protect.js. */
(function () {
  'use strict';
  try {
    if (!/^\/c\//.test(location.pathname)) return;
    var D = document, main = D.querySelector('main'); if (!main) return;
    var PAGE = 20, shown = PAGE;

    var st = D.createElement('style');
    st.textContent =
      'header{position:sticky;top:0;z-index:40}' +
      'h1{font-size:1.25rem}' +
      'main ul.g{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:.6rem!important}' +
      '@media(min-width:640px){main ul.g{grid-template-columns:repeat(3,minmax(0,1fr))!important}}' +
      '@media(min-width:920px){main ul.g{grid-template-columns:repeat(4,minmax(0,1fr))!important}}' +
      '@media(min-width:1180px){main{max-width:1180px!important}main ul.g{grid-template-columns:repeat(5,minmax(0,1fr))!important}}' +
      'main ul.g li[hidden]{display:none!important}' +
      'main ul.g li{display:flex;flex-direction:column;padding:.55rem!important;border-radius:12px!important}' +
      'main ul.g li img{height:auto!important;aspect-ratio:1/1;object-fit:contain!important;margin-bottom:.45rem!important}' +
      'main ul.g li .kf-a{display:block;font-size:.86rem;line-height:1.3}' +
      'main ul.g li .kf-t{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.6em}' +
      'main ul.g li>span{margin-top:auto;padding-top:.35rem;font-size:1.05rem}' +
      '#kf-bar{position:sticky;top:var(--kf-top,0px);z-index:30;background:#faf9fd;padding:.5rem 0 .4rem;margin:0 0 .6rem}' +
      '#kf-bar ul.kf-chips{display:flex!important;gap:.5rem;overflow-x:auto;margin:0 0 .5rem;padding:.1rem 0;scrollbar-width:none;-webkit-overflow-scrolling:touch}' +
      '#kf-bar ul.kf-chips::-webkit-scrollbar{display:none}' +
      '#kf-bar ul.kf-chips li{flex:none;padding:0!important;border-radius:999px!important}' +
      '#kf-bar ul.kf-chips a{display:block;font-size:.88rem;white-space:nowrap;padding:.42rem .9rem}' +
      '#kf-row{display:flex;align-items:center;justify-content:space-between;gap:.6rem}' +
      '#kf-row select{font:inherit;font-size:.9rem;color:#1f1b2e;background:#fff;border:1px solid #e6e1f5;border-radius:999px;padding:.42rem .9rem}' +
      '#kf-row span{font-size:.85rem;color:#6b6b80}' +
      '#kf-more{display:block;margin:1rem auto;font:inherit;font-weight:700;color:#6d28d9;background:#fff;border:2px solid #7c3aed;border-radius:12px;padding:.7rem 1.4rem;cursor:pointer}' +
      '#kf-more[hidden]{display:none}';
    D.head.appendChild(st);

    /* the sticky bar sits just under the sticky header */
    function setTop() { var h = D.querySelector('header'); D.documentElement.style.setProperty('--kf-top', (h ? Math.round(h.getBoundingClientRect().height) : 0) + 'px'); }
    setTop(); window.addEventListener('resize', setTop);

    var lists = [].slice.call(main.querySelectorAll('ul.g'));
    var prod = lists.filter(function (u) { return u.querySelector('a[href^="/p/"]'); })[0];
    var subs = lists.filter(function (u) { return u !== prod && u.querySelector('a[href^="/c/"]') && !u.querySelector('a[href^="/p/"]'); })[0];

    /* card tidy-up: image on top, name clamped to two lines, price at the bottom */
    function tidy(li) {
      var a = li.querySelector('a'); if (!a || a._k) return;
      var img = a.querySelector('img'), t = D.createElement('span'); t.className = 'kf-t';
      [].slice.call(a.childNodes).forEach(function (n) { if (n !== img) t.appendChild(n); });
      a.appendChild(t); a._k = 1; a.classList.add('kf-a');
    }
    if (prod) [].forEach.call(prod.children, tidy);

    if (!prod) return;   /* /c/ index page: only the grid styling above applies */

    var items = [].slice.call(prod.children);
    items.forEach(function (li, i) { li._i = i; var p = li.lastElementChild; li._p = parseInt(String((p && p.textContent) || '').replace(/[^\d]/g, ''), 10) || 0; li._n = (li.textContent || '').trim().toLowerCase(); });

    var bar = D.createElement('div'); bar.id = 'kf-bar';
    if (subs) {   /* hub pages: the "by type" links become chips; the lonely heading above them is hidden */
      var hd = subs.previousElementSibling; if (hd && /^H[23]$/.test(hd.tagName)) hd.style.display = 'none';
      subs.classList.add('kf-chips'); bar.appendChild(subs);
    }
    var row = D.createElement('div'); row.id = 'kf-row';
    var sel = D.createElement('select'); sel.setAttribute('aria-label', 'Sort products');
    [['d', 'Sort: Default'], ['pa', 'Price: low to high'], ['pd', 'Price: high to low'], ['n', 'Name: A to Z']].forEach(function (o) { sel.appendChild(new Option(o[1], o[0])); });
    var cnt = D.createElement('span'); row.appendChild(sel); row.appendChild(cnt); bar.appendChild(row);
    prod.parentNode.insertBefore(bar, prod);

    var more = D.createElement('button'); more.id = 'kf-more'; more.type = 'button'; more.textContent = 'Show more products';
    prod.parentNode.insertBefore(more, prod.nextSibling);

    function paint() {
      items.forEach(function (li, i) { li.hidden = i >= shown; });
      cnt.textContent = Math.min(shown, items.length) + ' of ' + items.length + ' products';
      more.hidden = shown >= items.length;
    }
    function sort() {
      var k = sel.value;
      items.sort(function (a, b) { return k === 'pa' ? a._p - b._p || a._i - b._i : k === 'pd' ? b._p - a._p || a._i - b._i : k === 'n' ? (a._n < b._n ? -1 : a._n > b._n ? 1 : 0) : a._i - b._i; });
      items.forEach(function (li) { prod.appendChild(li); });
      shown = PAGE; paint();
    }
    sel.onchange = sort;
    more.onclick = function () { shown += PAGE; paint(); };
    if ('IntersectionObserver' in window) {   /* load the next 20 a little before the shopper reaches the end */
      new IntersectionObserver(function (es) { if (es[0].isIntersecting && shown < items.length) { shown += PAGE; paint(); } }, { rootMargin: '700px 0px' }).observe(more);
    }
    paint();
  } catch (e) { /* never break the page */ }
})();
