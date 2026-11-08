/* Stermont Arcade - WhatsApp buttons inside the mobile shell product view (owner 2026-11-08: "I don't have the WhatsApp button inside the mobile shell product description").
   Adds, on the full-screen product page (#page-product):
     1. a green "Ask about this item on WhatsApp" button at the top of Product details, and
     2. a round WhatsApp button next to Add to cart / Buy now in the bottom bar,
   and the same "Ask on WhatsApp" link under the quick-buy sheet's details (#sheet-quickbuy).
   The message names the product, the selected pack size, the price and the shell link (/?product=<slug>), and it updates when the pack size changes.
   Reads only the page's own text, so it does not depend on app.js internals. The floating chat button (wa-float.js) is hidden while a product page is open (body.no-scroll),
   which is why the product view had no WhatsApp button at all.
   Loaded from index.html after app.js. To undo: delete the <script src="/mobile-shell/pp-whatsapp.js"> line in index.html. */
(function () {
  try {
    var NUMBER = '254748888230', BASE = 'https://stermontarcade.co.ke';
    var ICON = function (n) { return '<svg viewBox="0 0 32 32" width="' + n + '" height="' + n + '" aria-hidden="true"><path fill="#fff" d="M16 3C8.8 3 3 8.8 3 16c0 2.3.6 4.5 1.7 6.4L3 29l6.8-1.8A13 13 0 1 0 16 3zm0 23.7c-2 0-3.9-.5-5.6-1.5l-.4-.2-4 1 1.1-3.9-.3-.4A10.7 10.7 0 1 1 16 26.700zm5.9-8c-.3-.2-1.9-.9-2.200-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.200-.2.200-.4.200-.7.100-.3-.2-1.400-.5-2.600-1.600-1-.9-1.600-1.900-1.800-2.300-.2-.3 0-.5.100-.7l.5-.6c.2-.2.200-.3.300-.5.100-.2.100-.4 0-.6l-1-2.300c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.100-.9.400-.3.300-1.200 1.100-1.200 2.800s1.200 3.200 1.400 3.500c.2.200 2.400 3.700 5.800 5.100.8.4 1.400.600 1.900.700.8.300 1.500.200 2.100.100.600-.1 1.900-.8 2.100-1.500.3-.7.300-1.400.2-1.500-.1-.2-.3-.3-.6-.4z"/></svg>'; };
    var $ = function (s) { return document.querySelector(s); };
    var txt = function (el) { return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : ''; };
    var OK = /^[A-Za-z0-9._%~-]+$/;

    var st = document.createElement('style');
    st.textContent =
      '.pp-wa{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;box-sizing:border-box;height:44px;margin:0 0 12px;border-radius:9999px;background:#0f7a37;color:#fff!important;font:600 14px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-decoration:none;-webkit-tap-highlight-color:transparent}' +
      '.pp-wa-round{flex:none;display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:#0f7a37;text-decoration:none;-webkit-tap-highlight-color:transparent}' +
      '.pp-wa-sm{display:inline-flex;align-items:center;gap:6px;margin:8px 0 0 12px;padding:6px 12px;border-radius:9999px;background:#0f7a37;color:#fff!important;font:600 12px system-ui,sans-serif;text-decoration:none}' +
      '.pp-wa:focus-visible,.pp-wa-round:focus-visible,.pp-wa-sm:focus-visible{outline:3px solid #7c3aed;outline-offset:2px}';
    document.head.appendChild(st);

    function mk(cls, html, label) {
      var a = document.createElement('a');
      a.className = cls; a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('aria-label', label); a.innerHTML = html; a.href = 'https://wa.me/' + NUMBER;
      return a;
    }
    function wa(text) { return 'https://wa.me/' + NUMBER + '?text=' + encodeURIComponent(text); }
    function msg(name, size, price, url) {
      return 'Hello Stermont Arcade, I would like to ask about this item: ' + (name || 'a product') + (size ? ' (' + size + ')' : '') + (price ? ' - ' + price : '') + (url ? '\n' + url : '');
    }

    var page = $('#page-product'), desc = $('#pp-desc');
    var bodyBtn = null, roundBtn = null, qbBtn = null;
    if (page && desc && desc.parentNode) {
      bodyBtn = mk('pp-wa', ICON(20) + '<span>Ask about this item on WhatsApp</span>', 'Ask about this item on WhatsApp');
      var head = desc.previousElementSibling;                       // the "Product details" heading
      desc.parentNode.insertBefore(bodyBtn, head && head.nextSibling === desc ? desc : desc);
    }
    var add = $('#pp-add');
    if (page && add && add.parentNode) {
      roundBtn = mk('pp-wa-round', ICON(24), 'Chat about this item on WhatsApp');
      add.parentNode.insertBefore(roundBtn, add);
    }
    var qbDesc = $('#qb-desc');
    if (qbDesc && qbDesc.parentNode) {
      qbBtn = mk('pp-wa-sm', ICON(16) + '<span>Ask on WhatsApp</span>', 'Ask about this item on WhatsApp');
      qbDesc.parentNode.insertBefore(qbBtn, qbDesc.nextSibling);
    }

    function slugFromPath(p) { var m = /\/p\/([^\/?#]+)\.html/.exec(p || ''); return m ? m[1] : ''; }
    function shellUrl(slug) { return OK.test(slug || '') ? BASE + '/?product=' + slug : ''; }

    function update() {
      try {
        if (bodyBtn || roundBtn) {
          var sel = $('#pp-sizes [aria-selected="true"]'), size = sel ? (sel.getAttribute('data-pp-size') || txt(sel)) : '';
          var slug = slugFromPath(location.pathname) || new URLSearchParams(location.search).get('product') || '';
          if (location.hash.length > 1 && OK.test(location.hash.slice(1))) slug = location.hash.slice(1);   // a pack size slug is as good as the product slug
          var h = wa(msg(txt($('#pp-name')), size, txt($('#pp-price')), shellUrl(slug)));
          if (bodyBtn) bodyBtn.href = h; if (roundBtn) roundBtn.href = h;
        }
        if (qbBtn) {
          var qsel = $('#qb-sizes [aria-selected="true"]'), qsize = qsel ? (qsel.getAttribute('data-qb-size') || qsel.getAttribute('data-pp-size') || txt(qsel)) : '';
          var pg = $('#qb-page'), qslug = pg ? slugFromPath(pg.getAttribute('href')) : '';
          qbBtn.href = wa(msg(txt($('#qb-name')), qsize, txt($('#qb-price')), shellUrl(qslug)));
        }
      } catch (e) {}
    }
    var queued = false;
    var queue = function () { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; update(); }); };
    var opts = { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['aria-selected', 'href', 'class'] };
    var mo = new MutationObserver(queue);
    ['#page-product', '#sheet-quickbuy'].forEach(function (s) { var el = $(s); if (el) mo.observe(el, opts); });
    window.addEventListener('popstate', queue); window.addEventListener('hashchange', queue);
    update();
  } catch (e) {}
})();
