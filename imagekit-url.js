/* Stermont Arcade image delivery URL helper.
 * Original catalogue URLs remain the source of truth; this only changes rendered URLs.
 */
(function (root, factory) {
  var helper = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = helper;
  if (root) root.STM_IMAGE_URL = helper;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  var ENDPOINT = 'https://ik.imagekit.io/w6hxfnwmw/supabase';
  if (root && root.document && !root.__STM_IMAGE_FALLBACK_INSTALLED) {
    root.__STM_IMAGE_FALLBACK_INSTALLED = true;
    root.document.addEventListener('error', function (event) {
      var img = event.target;
      if (!img || img.tagName !== 'IMG' || !img.dataset || !img.dataset.imagekitOriginal) return;
      // A failed ImageKit request gets exactly one retry against the untouched catalogue URL.
      if (!img.dataset.imagekitFallbackTried && String(img.src || '').indexOf(ENDPOINT + '/') === 0) {
        img.dataset.imagekitFallbackTried = '1';
        img.src = img.dataset.imagekitOriginal;
        return;
      }
      // If the original is missing, try each remaining genuine gallery photo in order.
      var list = [];
      try { list = JSON.parse(img.dataset.fallbacks || '[]'); } catch (_) {}
      var next = Number(img.dataset.imagekitFallbackIndex || 0);
      if (next < list.length) {
        img.dataset.imagekitFallbackIndex = String(next + 1);
        img.src = list[next];
        return;
      }
      // Never leave a broken-image icon or an empty card.
      if (img.parentNode && root.document.createElement) {
        var placeholder = root.document.createElement('span');
        placeholder.className = 'photo-unavailable';
        placeholder.setAttribute('role', 'img');
        placeholder.setAttribute('aria-label', 'Product photo unavailable');
        placeholder.textContent = 'Photo unavailable';
        placeholder.style.cssText = 'display:grid;place-items:center;width:100%;height:100%;padding:8px;color:#64748b;background:#f8fafc;font:12px/1.4 system-ui;text-align:center';
        img.parentNode.replaceChild(placeholder, img);
      }
    }, true);
  }
  return function imageKitUrl(source, width) {
    if (typeof source !== 'string' || !/^https?:\/\//i.test(source)) return source;
    // Never proxy an ImageKit URL again; it may already belong to this account or another CDN.
    if (/^https:\/\/ik\.imagekit\.io\//i.test(source)) return source;
    var w = Math.max(1, Math.min(2400, Math.round(Number(width) || 800)));
    return ENDPOINT + '/tr:w-' + w + ',q-75,f-auto/' + source;
  };
}));
