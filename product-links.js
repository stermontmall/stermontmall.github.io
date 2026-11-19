/* One canonical URL builder for every human-facing product link.
   SEO product documents remain at /p/<slug>.html; this helper is only for customer/staff links. */
(function (root, factory) {
  var build = factory();
  if (typeof module === 'object' && module.exports) module.exports = build;
  if (root) root.shellProductLink = build;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  return function shellProductLink(slug, origin) {
    var value = String(slug == null ? '' : slug).trim();
    var base = String(origin || 'https://stermontarcade.co.ke').replace(/\\/+$/, '');
    if (!value) return base + '/';
    return base + '/?product=' + encodeURIComponent(value);
  };
});
