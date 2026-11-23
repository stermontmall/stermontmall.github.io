/* Stermont Arcade image delivery URL helper.
 * Original catalogue URLs remain the source of truth; this only changes rendered URLs.
 *
 * - Browser: STM_IMAGE_URL(url, width) returns the ImageKit Web Proxy URL for a photo.
 *   If that request fails, the untouched original URL is retried once (see the window listener below)
 *   before any gallery fallback in app.js / img-protect.js runs.
 * - Node (static page generator): only small card thumbnails (<= BUILD_MAX_WIDTH) are proxied. Large images
 *   feed Product JSON-LD, og:image, the image sitemap and the hero photo, so they keep the original URL.
 *   Supabase Storage photos are never proxied in Node, so static HTML keeps the original URL.
 * - Supabase Storage photos in the browser are proxied only while the ImageKit proxy is proven to work for
 *   them (SUPABASE_MODE = 'auto'). The first time a Supabase photo is requested, one tiny probe image
 *   (16 px wide) is loaded through ImageKit. Until the probe succeeds the original URL is used, so a
 *   misconfigured ImageKit origin can never cost visitors a failed request per photo. The verdict is cached
 *   in localStorage (6 h when working, 10 min when not), so later page loads decide on first paint and the
 *   proxy switches itself on soon after the ImageKit origin is fixed, with no redeploy.
 *   Set SUPABASE_MODE to 'off' to force originals or 'on' to skip the probe.
 */
(function (root, factory) {
  var helper = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = helper;
  if (root) root.STM_IMAGE_URL = helper;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  var ENDPOINT = 'https://ik.imagekit.io/w6hxfnwmw/supabase';
  var PROXIED = /^https:\/\/ik\.imagekit\.io\/w6hxfnwmw\/supabase\/tr:[^\/]+\/(https?:\/\/.+)$/i;
  var SUPABASE = /^https:\/\/[a-z0-9-]+\.supabase\.co\//i;
  var SUPABASE_MODE = 'auto'; // 'auto' | 'on' | 'off'
  var BUILD_MAX_WIDTH = 640;
  var PROBE_KEY = 'stm.imagekit.supabase.v1';
  var PROBE_OK_TTL = 6 * 60 * 60 * 1000;
  var PROBE_FAIL_TTL = 10 * 60 * 1000;
  var PROBE_TIMEOUT = 8000;
  var PLACEHOLDER = '/placeholder.svg'; // same-origin "Photo coming soon" image: the clear photo-unavailable state
  var DOWN_KEY = 'stm.supabase.photos.down.v1';
  var DOWN_TTL = 10 * 60 * 1000;
  var supabaseDownMemo = false;
  var inBrowser = !!(root && root.document);
  var supabaseProxyWorks = false;
  var probeStarted = false;

  /* The untouched source URL inside one of our proxy URLs, or null for any other URL. */
  function original(url) {
    var m = PROXIED.exec(String(url == null ? '' : url));
    return m ? m[1] : null;
  }

  function readVerdict() {
    try {
      var v = JSON.parse(root.localStorage.getItem(PROBE_KEY) || 'null');
      if (v && typeof v.t === 'number' && Date.now() - v.t < (v.ok ? PROBE_OK_TTL : PROBE_FAIL_TTL)) return v.ok === true;
    } catch (e) {}
    return null;
  }

  function saveVerdict(ok) {
    supabaseProxyWorks = ok;
    try { root.localStorage.setItem(PROBE_KEY, JSON.stringify({ ok: ok, t: Date.now() })); } catch (e) {}
  }

  /* Load one tiny proxied Supabase photo. A detached Image never reaches the window error listener below. */
  function probe(source) {
    if (probeStarted) return;
    probeStarted = true;
    var done = false;
    var finish = function (ok) { if (done) return; done = true; saveVerdict(ok); };
    var img = new root.Image();
    img.onload = function () { finish(true); };
    img.onerror = function () { finish(false); };
    root.setTimeout(function () { finish(false); }, PROBE_TIMEOUT);
    img.src = ENDPOINT + '/tr:w-16,q-50,f-auto/' + source;
  }

  /* True while Supabase Storage originals are known to fail (HTTP 402 quota restriction, outage). Set the first time one
     original photo errors, remembered for 10 minutes, so the page never keeps requesting a URL it already knows is broken. */
  function supabaseDown() {
    if (!inBrowser) return false;
    if (supabaseDownMemo) return true;
    try {
      var t = Number(root.localStorage.getItem(DOWN_KEY));
      if (t && Date.now() - t < DOWN_TTL) { supabaseDownMemo = true; return true; }
    } catch (e) {}
    return false;
  }
  function markSupabaseDown() {
    supabaseDownMemo = true;
    try { root.localStorage.setItem(DOWN_KEY, String(Date.now())); } catch (e) {}
    root.setTimeout && root.setTimeout(function () { supabaseDownMemo = false; }, DOWN_TTL);
  }

  function supabaseAllowed(source) {
    if (SUPABASE_MODE === 'off' || !inBrowser) return false;
    if (SUPABASE_MODE === 'on' || supabaseProxyWorks) return true;
    var cached = readVerdict();
    if (cached === true) { supabaseProxyWorks = true; return true; }
    if (cached === null) probe(source);
    return false;
  }

  function imageKitUrl(source, width) {
    if (typeof source !== 'string' || !/^https?:\/\//i.test(source)) return source;
    // Never proxy an ImageKit URL again; it may already belong to this account or another CDN.
    if (/^https:\/\/ik\.imagekit\.io\//i.test(source)) return source;
    if (SUPABASE.test(source) && !supabaseAllowed(source)) return supabaseDown() ? PLACEHOLDER : source;
    var w = Math.max(1, Math.min(2400, Math.round(Number(width) || 800)));
    if (!inBrowser && w > BUILD_MAX_WIDTH) return source;
    return ENDPOINT + '/tr:w-' + w + ',q-75,f-auto/' + source;
  }
  imageKitUrl.original = original;
  imageKitUrl.placeholder = PLACEHOLDER;
  imageKitUrl.supabaseDown = supabaseDown;

  if (inBrowser && root.addEventListener && !root.__STM_IMAGE_FALLBACK_INSTALLED) {
    root.__STM_IMAGE_FALLBACK_INSTALLED = true;
    // A window-level capture listener runs before the document-level gallery handlers, so a failed
    // ImageKit request is retried against the original photo first and those handlers never see it.
    // If the original also fails, this listener steps aside and they take over as before.
    root.addEventListener('error', function (event) {
      var img = event.target;
      if (!img || img.tagName !== 'IMG') return;
      var src = img.getAttribute('src') || '';
      if (src === PLACEHOLDER) { event.stopImmediatePropagation(); return; } // never loop on the placeholder itself
      var fallback = original(src);
      var failed = fallback || src;
      if (!SUPABASE.test(failed)) { if (!fallback) return; event.stopImmediatePropagation(); img.src = fallback; return; }
      // The failing photo lives in Supabase Storage. A failed proxy request is retried against the original only while
      // Supabase is not known to be down; otherwise (or when the original itself failed) remember that it is down and use a
      // verified non-Supabase gallery photo if the product has one, else the photo-unavailable placeholder.
      if (fallback && !supabaseDown()) { event.stopImmediatePropagation(); img.src = fallback; return; }
      markSupabaseDown();
      event.stopImmediatePropagation();
      var next = [];
      try { next = JSON.parse(img.getAttribute('data-fallbacks') || '[]'); } catch (e) {}
      var i = 0; while (i < next.length && SUPABASE.test(next[i] || '')) i++;
      if (i < next.length) { img.setAttribute('data-fallbacks', JSON.stringify(next.slice(i + 1))); img.src = next[i]; return; }
      img.setAttribute('data-fallbacks', '[]');
      img.setAttribute('data-photo-unavailable', 'true');
      img.src = PLACEHOLDER;
    }, true);
  }
  return imageKitUrl;
}));
