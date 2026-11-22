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
      if (!img.dataset.imagekitFallbackTried && String(img.src || '').indexOf(ENDPOINT + '/') === 0) {
        img.dataset.imagekitFallbackTried = '1';
        img.src = img.dataset.imagekitOriginal;
        return;
      }
      if (img.dataset.imagekitFallbackTried) {
        var list = [];
        try { list = JSON.parse(img.dataset.fallbacks || '[]'); } catch (_) {}
        var next = Number(img.dataset.imagekitFallbackIndex || 0);
        if (next < list.length) {
          img.dataset.imagekitFallbackIndex = String(next + 1);
          img.src = list[next];
        }
      }
    }, true);
  }
  return function imageKitUrl(source, width) {
    if (typeof source !== 'string' || !/^https?:\\/\\//i.test(source)) return source;
    // Never proxy an ImageKit URL again; it may already belong to this account or another CDN.
    if (/^https:\\/\\/ik\\.imagekit\\.io\\//i.test(source)) return source;
    var w = Math.max(1, Math.min(2400, Math.round(Number(width) || 800)));
    return ENDPOINT + '/tr:w-' + w + ',q-75,f-auto/' + source;
  };
}));
