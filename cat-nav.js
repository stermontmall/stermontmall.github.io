/* Stermont Arcade · points every "Categories" button of the mobile bottom menu at the Kilimall-style Categories page (/categories.html).
   The bottom menu exists on the home page, /c/ category pages and /products.html. A button counts only when its text ends in
   "Categories" and it sits inside a fixed bar at the bottom of the screen, so the "Browse categories" tabs and chips are left alone.
   Loaded by img-protect.js. To switch off: remove the cat-nav loader at the bottom of img-protect.js. */
(function () {
  'use strict';
  try {
    var P = location.pathname, T = '/categories.html';
    if (/^\/categories(\.html)?$/.test(P) || /admin|upload-photos/.test(P)) return;
    function inBottomBar(el) {
      for (var n = el, i = 0; n && n !== document.body && i < 7; n = n.parentElement, i++) {
        var cs = getComputedStyle(n);
        if (cs.position === 'fixed' && (parseFloat(cs.bottom) <= 2 || n.getBoundingClientRect().top > window.innerHeight * 0.6)) return true;
      }
      return false;
    }
    function go(e) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); location.href = T; }
    function scan() {
      [].forEach.call(document.querySelectorAll('a,button'), function (b) {
        if (b.__kcat) return;
        var t = (b.textContent || '').replace(/\s+/g, ' ').trim();
        if (t.length > 16 || !/(^|[^a-z])categories$/i.test(t) || !inBottomBar(b)) return;
        b.__kcat = 1;
        if (b.tagName === 'A') b.setAttribute('href', T);
        b.addEventListener('click', go, true);
      });
    }
    var tm = null, mo = new MutationObserver(function () { clearTimeout(tm); tm = setTimeout(scan, 150); });
    function start() { scan(); mo.observe(document.body, { childList: true, subtree: true }); setTimeout(function () { mo.disconnect(); }, 20000); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  } catch (e) { /* never break the shop */ }
})();
