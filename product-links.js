'use strict';

// Customer-facing product links use the published /p/<slug>.html product page.
// The product page retains its canonical, indexable SEO content and opens the mobile shell.
function shellProductLink(slug) {
  const value = String(slug || '').trim().replace(/^\/+|\/+$/g, '');
  if (!value) return 'https://stermontarcade.co.ke/';
  return 'https://stermontarcade.co.ke/p/' + encodeURIComponent(value) + '.html';
}

module.exports = shellProductLink;
module.exports.shellProductLink = shellProductLink;
