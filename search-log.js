/* Stermont Arcade · records what shoppers search for (words only, no personal data).
   index.html calls STM_searchLog(term, resultsShown, source). Fire and forget: it never slows or breaks the shop.
   Skips visitors with Do Not Track, anything that looks like a phone number or email, and caps each visit at 40 searches. */

/* The storefront owns its Neon catalogue cache; search telemetry is sent to Neon. */
(function () {
  'use strict';
  var NEON_REST = 'https://ep-dry-butterfly-bhytt90y.apirest.c-10.eu-central-1.aws.neon.tech/stermont/rest/v1/', sent = 0, sid = '';
  try { sid = sessionStorage.getItem('stm_sid') || ''; if (!sid) { sid = Math.random().toString(36).slice(2, 12) + Date.now().toString(36); sessionStorage.setItem('stm_sid', sid); } } catch (e) {}
  window.STM_searchLog = function (term, results, source) {
    try {
      if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || sent >= 40) return;
      term = String(term || '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 80);
      if (term.length < 2 || /@/.test(term) || term.replace(/\D/g, '').length >= 7) return;
      sent++;
      fetch(NEON_REST + 'rpc/log_search', {
        method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_term: term, p_results: Math.max(0, Math.min(5000, Number(results) || 0)), p_source: source || 'typed', p_session_id: sid || null, p_page: location.pathname.slice(0, 80) })
      }).catch(function () {});
    } catch (e) {}
  };
})();

/* Loads the Jumia-style search behaviour (search-jumia.js) on the page that has the homepage search box. */
(function () {
  try {
    if (!document.getElementById('search-form') || !document.getElementById('sugg')) return;
    var s = document.createElement('script'); s.src = 'search-jumia.js?v=3'; document.head.appendChild(s);
  } catch (e) {}
})();

/* Loads the Kilimall-style browsing (kili-feel.js) on the homepage only. */
(function () {
  try {
    if (!document.getElementById('music-gear')) return;
    var s = document.createElement('script'); s.src = 'kili-feel.js?v=1'; s.defer = true; document.head.appendChild(s);
  } catch (e) {}
})();
