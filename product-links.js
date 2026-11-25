'use strict';

// Customer-facing product links must open the mobile shop shell.
// The /p/<slug>.html documents remain published separately as canonical,
// indexable SEO pages; they are not the destination for customer actions.
function shellProductLink(slug) {
  const value = String(slug || '').trim().replace(/^\/+|\/+$/g, '');
  if (!value) return 'https://stermontarcade.co.ke/';
  return 'https://stermontarcade.co.ke/?product=' + encodeURIComponent(value);
}

module.exports = shellProductLink;
module.exports.shellProductLink = shellProductLink;
