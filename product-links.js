/* Shared canonical product URL helper. Customer, SEO and share links all use the sitemap URL. */
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
