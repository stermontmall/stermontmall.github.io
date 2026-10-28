/* Stermont Arcade · records what shoppers search for (words only, no personal data).
   index.html calls STM_searchLog(term, resultsShown, source). Fire and forget: it never slows or breaks the shop.
   Skips visitors with Do Not Track, anything that looks like a phone number or email, and caps each visit at 40 searches. */

/* Speed: open the connection to the product database early, and remember the homepage product list for 3 minutes.
   Going to a product and pressing Back (or reopening the shop) then shows products instantly instead of waiting for the network.
   After 3 minutes the list is fetched fresh again, so prices and stock stay current. Set CACHE_MS to 0 to switch the memory off. */
(function () {
  try {
    var SBH = 'https://oewvtbnmyombbtggamor.supabase.co', CACHE_MS = 180000, CK = 'stm_prod_cache_v1', of = window.fetch;
    var pc = document.createElement('link'); pc.rel = 'preconnect'; pc.href = SBH; pc.crossOrigin = ''; document.head.appendChild(pc);
    if (!of || !window.Response || !CACHE_MS) return;
    window.fetch = function (u, o) {
      var url = typeof u === 'string' ? u : (u && u.url) || '';
      var isGet = !o || !o.method || String(o.method).toUpperCase() === 'GET';
      if (!isGet || url.indexOf('/rest/v1/products?active=eq.true') === -1 || url.indexOf('categories(name,slug)') === -1) return of.apply(this, arguments);
      try {
        var c = JSON.parse(localStorage.getItem(CK) || 'null');
        if (c && c.u === url && Date.now() - c.t < CACHE_MS) return Promise.resolve(new Response(c.b, { status: 200, headers: { 'Content-Type': 'application/json' } }));
      } catch (e) {}
      return of.apply(this, arguments).then(function (r) {
        if (r && r.ok) r.clone().text().then(function (b) { try { localStorage.setItem(CK, JSON.stringify({ u: url, t: Date.now(), b: b })); } catch (e) {} }).catch(function () {});
        return r;
      });
    };
  } catch (e) {}
})();

(function () {
  'use strict';
  var SB = 'https://oewvtbnmyombbtggamor.supabase.co', KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7', sent = 0, sid = '';
  try { sid = sessionStorage.getItem('stm_sid') || ''; if (!sid) { sid = Math.random().toString(36).slice(2, 12) + Date.now().toString(36); sessionStorage.setItem('stm_sid', sid); } } catch (e) {}
  window.STM_searchLog = function (term, results, source) {
    try {
      if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || sent >= 40) return;
      term = String(term || '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 80);
      if (term.length < 2 || /@/.test(term) || term.replace(/\D/g, '').length >= 7) return;
      sent++;
      fetch(SB + '/rest/v1/search_logs', {
        method: 'POST', keepalive: true,
        headers: { apikey: KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ term: term, results: Math.max(0, Math.min(5000, Number(results) || 0)), source: source || 'typed', session_id: sid || null, page: location.pathname.slice(0, 80) })
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
