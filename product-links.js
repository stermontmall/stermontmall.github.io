/* Canonical public product URL helper.
 * Product links use the indexable /p/<slug>.html page; that page hydrates the mobile shell in place.
 */
(function (root, factory) {
  var helper = factory();
  if (typeof module === 'object' && module.exports) module.exports = helper;
  if (root) root.shellProductLink = helper;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return function shellProductLink(slug) {
    var value = String(slug == null ? '' : slug).trim();
    if (!value) return 'https://stermontarcade.co.ke/';
    return 'https://stermontarcade.co.ke/p/' + encodeURIComponent(value) + '.html';
  };
}));
