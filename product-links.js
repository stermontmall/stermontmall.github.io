/* Canonical human-facing product URL helper.
 * Google-facing /p/<slug>.html URLs remain reserved for SEO documents only.
 */
(function (root, factory) {
  var helper = factory();
  if (typeof module === 'object' && module.exports) module.exports = helper;
  if (root) root.shellProductLink = helper;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return function shellProductLink(slug) {
    var value = String(slug == null ? '' : slug).trim();
    if (!value) return 'https://stermontarcade.co.ke/';
    return 'https://stermontarcade.co.ke/?product=' + encodeURIComponent(value);
  };
}));
