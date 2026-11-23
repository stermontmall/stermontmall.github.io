/* Canonical static product URL helper. Product pages are generated at /p/<slug>.html. */
(function (root, factory) {
  var helper = factory();
  if (typeof module === 'object' && module.exports) module.exports = helper;
  if (root) root.shellProductLink = helper;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return function shellProductLink(slug) {
    var value = String(slug == null ? '' : slug).trim();
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(value)) return 'https://stermontarcade.co.ke/';
    return '/p/' + encodeURIComponent(value) + '.html';
  };
}));
