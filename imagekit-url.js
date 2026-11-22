/* Stermont Arcade image delivery URL helper.
 * Original catalogue URLs remain the source of truth; this only changes rendered URLs.
 *
 * - Browser: STM_IMAGE_URL(url, width) returns the ImageKit Web Proxy URL for a photo.
 *   If that request fails, the untouched original URL is retried once (see the window listener below)
 *   before any gallery fallback in app.js / img-protect.js runs.
 * - Node (static page generator): only small card thumbnails (<= BUILD_MAX_WIDTH) are proxied. Large images
 *   feed Product JSON-LD, og:image, the image sitemap and the hero photo, so they keep the original URL.
 */
(function (root, factory) {
  var helper = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = helper;
  if (root) root.STM_IMAGE_URL = helper;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  var ENDPOINT = 'https://ik.imagekit.io/w6hxfnwmw/supabase';
  var PROXIED = /^https:\/\/ik\.imagekit\.io\/w6hxfnwmw\/supabase\/tr:[^\/]+\/(https?:\/\/.+)$/i;
  var BUILD_MAX_WIDTH = 640;
  var inBrowser = !!(root && root.document);

  /* The untouched source URL inside one of our proxy URLs, or null for any other URL. */
  function original(url) {
    var m = PROXIED.exec(String(url == null ? '' : url));
    return m ? m[1] : null;
  }

  function imageKitUrl(source, width) {
    if (typeof source !== 'string' || !/^https?:\/\//i.test(source)) return source;
    // Never proxy an ImageKit URL again; it may already belong to this account or another CDN.
    if (/^https:\/\/ik\.imagekit\.io\//i.test(source)) return source;
    var w = Math.max(1, Math.min(2400, Math.round(Number(width) || 800)));
    if (!inBrowser && w > BUILD_MAX_WIDTH) return source;
    return ENDPOINT + '/tr:w-' + w + ',q-75,f-auto/' + source;
  }
  imageKitUrl.original = original;

  if (inBrowser && root.addEventListener && !root.__STM_IMAGE_FALLBACK_INSTALLED) {
    root.__STM_IMAGE_FALLBACK_INSTALLED = true;
    // A window-level capture listener runs before the document-level gallery handlers, so a failed
    // ImageKit request is retried against the original photo first and those handlers never see it.
    // If the original also fails, this listener steps aside and they take over as before.
    root.addEventListener('error', function (event) {
      var img = event.target;
      if (!img || img.tagName !== 'IMG') return;
      var fallback = original(img.getAttribute('src'));
      if (!fallback) return;
      event.stopImmediatePropagation();
      img.src = fallback;
    }, true);
  }
  return imageKitUrl;
}));
