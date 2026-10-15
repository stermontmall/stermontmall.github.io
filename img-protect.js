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
