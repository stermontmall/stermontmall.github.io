/* Stermont Arcade · cart bridge (homepage only).
   Product, category and all-products pages cannot talk to the shop's cart directly (the cart lives inside index.html).
   They save "added from another page" items under the browser key stm_pending_cart. This script runs on the homepage,
   waits for the product cards to appear, then adds each saved item with the shop's own STM.add() (so totals, stock rules,
   the cart bar and checkout all behave exactly as if the shopper had tapped Add to cart on the homepage).
   It also opens the cart when the address ends in #cart (the Cart buttons on other pages use this).
   It never touches checkout or payments. Loaded by search-log.js on the homepage only. */
(function () {
  'use strict';
  try {
    var K = 'stm_pending_cart', D = document, tries = 0, wantCart = location.hash === '#cart';
    function read() { try { var o = JSON.parse(localStorage.getItem(K) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
    function write(o) { try { if (Object.keys(o).length) localStorage.setItem(K, JSON.stringify(o)); else localStorage.removeItem(K); } catch (e) {} }
    function flush() {
      tries++;
      var o = read(), left = 0;
      Object.keys(o).forEach(function (id) {
        var c = D.getElementById('p-' + id);
        if (c && window.STM) {
          var q = Math.max(1, Math.min(99, parseInt(o[id], 10) || 1));
          delete o[id]; write(o);   /* forget it first, so it can never be added twice */
          try { window.STM.add(c, null, q); } catch (e) {}
        } else left++;
      });
      if (left && tries < 40) { setTimeout(flush, 400); return; }   /* products are still loading: try again for up to ~16 seconds */
      if (wantCart && window.STM) { wantCart = false; setTimeout(function () { try { window.STM.open(); } catch (e) {} }, 250); }
    }
    setTimeout(flush, 300);
  } catch (e) { /* never break the shop */ }
})();
