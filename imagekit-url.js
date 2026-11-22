/* Stermont Arcade image delivery URL helper.
 * Original catalogue URLs remain the source of truth; this only changes rendered URLs.
 */
(function (root, factory) {
  var helper = factory();
  if (typeof module === 'object' && module.exports) module.exports = helper;
  if (root) root.STM_IMAGE_URL = helper;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var ENDPOINT = 'https://ik.imagekit.io/w6hxfnwmw/supabase';
  return function imageKitUrl(source, width) {
    if (typeof source !== 'string' || !/^https?:\\/\\//i.test(source)) return source;
    // Never proxy an ImageKit URL again; it may already belong to this account or another CDN.
    if (/^https:\\/\\/ik\\.imagekit\\.io\\//i.test(source)) return source;
    var w = Math.max(1, Math.min(2400, Math.round(Number(width) || 800)));
    return ENDPOINT + '/tr:w-' + w + ',q-75,f-auto/' + source;
  };
}));
