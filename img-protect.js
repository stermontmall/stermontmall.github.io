/* Stermont Arcade - light deterrent against casual copying of product photos.
   Blocks right-click "Save image", dragging an image out of the page, and long-press save on phones.
   It only touches images (text, links and buttons behave normally) and does not affect Google, the
   Merchant feed or the page's HTML. It cannot stop screenshots or determined users: a browser has to
   receive an image in order to display it. */
(function () {
  'use strict';
  try {
    var s = document.createElement('style');
    // Large photos (product popup, order popup, generated product pages) have no click handler on the image itself,
    // so they can safely let pointer events pass through: right-click / long-press then land on the page, not the photo.
    // Small card photos keep their click handlers, so they are covered by the listeners below instead.
    s.textContent = 'img{-webkit-user-drag:none;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}' +
      '#om-i,#stm-pd .main img,.pg img{pointer-events:none}';
    document.head.appendChild(s);
  } catch (e) {}
  function isImg(t) { return !!t && t.nodeType === 1 && (t.tagName === 'IMG' || t.tagName === 'PICTURE'); }
  document.addEventListener('contextmenu', function (e) { if (isImg(e.target)) e.preventDefault(); });
  document.addEventListener('dragstart', function (e) { if (isImg(e.target)) e.preventDefault(); });
})();

/* Visitor analytics: loads /analytics.js, which does nothing until an ID is set inside it.
   It is loaded from here only because this script is already on every public store and product page. */
(function () {
  try { var a = document.createElement('script'); a.src = '/analytics.js'; a.defer = true; document.head.appendChild(a); } catch (e) {}
})();

/* Floating WhatsApp button on every store, product and category page (see /wa-float.js). Loading it twice is harmless. */
(function () {
  try { if (/admin|upload-photos/.test(location.pathname)) return; var w = document.createElement('script'); w.src = '/wa-float.js?v=2'; w.defer = true; document.head.appendChild(w); } catch (e) {}
})();

/* Delivery times and customer reviews on product pages and in the storefront product view (see /product-trust.js). */
(function () {
  try { if (/admin|upload-photos/.test(location.pathname)) return; var t = document.createElement('script'); t.src = '/product-trust.js?v=2'; t.defer = true; document.head.appendChild(t); } catch (e) {}
})();

/* Footer links to the About, FAQ, Contact and Terms pages (see /site-links.js). */
(function () {
  try { var l = document.createElement('script'); l.src = '/site-links.js'; l.defer = true; document.head.appendChild(l); } catch (e) {}
})();

/* Homepage department navigation (see /nav-modern.js). Does nothing on pages without the homepage category strip. */
(function () {
  try { if (!document.getElementById('cats')) return; var n = document.createElement('script'); n.src = '/nav-modern.js?v=1'; n.defer = true; document.head.appendChild(n); } catch (e) {}
})();
