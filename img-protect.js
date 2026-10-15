/* Stermont Arcade - light deterrent against casual copying of product photos.
   Blocks right-click "Save image", dragging an image out of the page, and long-press save on phones.
   It only touches images (text, links and buttons behave normally) and does not affect Google, the
   Merchant feed or the page's HTML. It cannot stop screenshots or determined users: a browser has to
   receive an image in order to display it. */
(function () {
  'use strict';
  try {
    var s = document.createElement('style');
    s.textContent = 'img{-webkit-user-drag:none;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}';
    document.head.appendChild(s);
  } catch (e) {}
  function isImg(t) { return !!t && t.nodeType === 1 && (t.tagName === 'IMG' || t.tagName === 'PICTURE'); }
  document.addEventListener('contextmenu', function (e) { if (isImg(e.target)) e.preventDefault(); });
  document.addEventListener('dragstart', function (e) { if (isImg(e.target)) e.preventDefault(); });
})();
