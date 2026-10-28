/* Stermont Arcade - Jumia-style search (same page, no new results page).
   Loaded by search-log.js. It sits on top of the search script in index.html.
   - While you type: suggestions drop down (like Jumia) and the product list narrows to what matches.
   - Search / Enter / tapping a suggestion, a category or a tab: RESULTS MODE. The banners, promo strips, category icons and
     the long info sections are hidden, so the matching products sit directly under the search bar. Nothing opens by itself:
     even a single match shows as a result card first.
   - The message under the bar reads "N results for "term" - Clear". Clear (or emptying the box, or tapping the logo/Home)
     brings the normal home page back.
   Safe by design: on a page without the search box this does nothing, and if it fails the page's own search remains. */
(function () {
  'use strict';
  try {
    var form = document.getElementById('search-form'), input = document.getElementById('q');
    if (!form || !input) return;
    var msg = document.getElementById('search-msg'), box = document.getElementById('sugg');
    var body = document.body, header = document.querySelector('header');
    input.setAttribute('enterkeyhint', 'search');   /* phone keyboard shows a Search key */

    /* results mode: hide everything except the matching products */
    var st = document.createElement('style');
    st.textContent =
      'body.stm-results .slides,body.stm-results #dots,body.stm-results .trust,body.stm-results #cats,body.stm-results #featured,' +
      'body.stm-results #pest-control,body.stm-results #order,body.stm-results #delivery,body.stm-results #faq,' +
      'body.stm-results #policies,body.stm-results #visit,body.stm-results #contact,body.stm-results .seo-links,' +
      'body.stm-results #music-gear .t,body.stm-results #music-gear .lead,body.stm-results #range .t,body.stm-results #range .lead,' +
      'body.stm-results footer,body.stm-results #tbar{display:none!important}' +
      'body.stm-results main>.wrap:has(>.trust){display:none!important}' +
      'body.stm-results #music-gear{padding-top:1rem}';
    document.head.appendChild(st);

    function saveRecent(t) {
      t = (t || '').replace(/\s+/g, ' ').trim(); if (t.length < 2) return;
      try {
        var r = JSON.parse(localStorage.getItem('stm_recent') || '[]'); if (!Array.isArray(r)) r = [];
        r = r.filter(function (x) { return typeof x === 'string' && x.toLowerCase() !== t.toLowerCase(); }); r.unshift(t);
        localStorage.setItem('stm_recent', JSON.stringify(r.slice(0, 5)));
      } catch (x) {}
    }
    function productCount() { return document.querySelectorAll('#music-gear .pcard:not(.hidden):not(.vhide)').length; }
    function listCount() { return document.querySelectorAll('#range .range > div:not(.hidden) li:not(.hidden)').length; }
    function clearSearch() {
      input.value = ''; input.dispatchEvent(new Event('input'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    function toResults() {
      requestAnimationFrame(function () {
        var t = document.getElementById('music-gear');
        if (!t || t.classList.contains('hidden')) t = document.getElementById('range');
        if (!t) return;
        var hh = 0; if (header) { var p = getComputedStyle(header).position; if (p === 'sticky' || p === 'fixed') hh = header.offsetHeight; }
        window.scrollTo({ top: Math.max(0, t.getBoundingClientRect().top + window.pageYOffset - hh - 8), behavior: 'smooth' });
      });
    }

    /* keep the page in step with the box: results mode on while there is text, and a Jumia-style message */
    var commit = false, mo = null;
    function sync() {
      var term = input.value.trim(), on = !!term;
      body.classList.toggle('stm-results', on);
      if (on && msg) {
        var n = productCount() || listCount();
        if (n) {
          var want = n + (n === 1 ? ' result' : ' results') + ' for "' + term + '" · ';
          if (msg.firstChild && msg.firstChild.nodeType === 3 && msg.firstChild.nodeValue === want && msg.querySelector('a')) { /* already right */ }
          else {
            if (mo) mo.disconnect();
            msg.textContent = want;
            var c = document.createElement('a'); c.href = '#top'; c.textContent = 'Clear';
            c.addEventListener('click', function (ev) { ev.preventDefault(); clearSearch(); });
            msg.appendChild(c);
            if (mo) mo.observe(msg, { childList: true, characterData: true, subtree: true });
          }
        } else if (msg.textContent && !msg.querySelector('.stm-clr')) {
          /* nothing found: keep the page's "Ask on WhatsApp" message and add a Clear link */
          if (mo) mo.disconnect();
          msg.appendChild(document.createTextNode(' · '));
          var c2 = document.createElement('a'); c2.href = '#top'; c2.className = 'stm-clr'; c2.textContent = 'Clear';
          c2.addEventListener('click', function (ev) { ev.preventDefault(); clearSearch(); });
          msg.appendChild(c2);
          if (mo) mo.observe(msg, { childList: true, characterData: true, subtree: true });
        }
      }
      if (on && (commit || input.getAttribute('data-src'))) { commit = false; toResults(); }
      if (!on) commit = false;
    }
    if (msg && window.MutationObserver) {
      mo = new MutationObserver(function () { sync(); });
      mo.observe(msg, { childList: true, characterData: true, subtree: true });
    }
    input.addEventListener('input', function () { setTimeout(sync, 0); });

    /* tapping a suggestion / recent search counts as pressing Search */
    if (box) box.addEventListener('click', function () { commit = true; }, true);

    /* Search / Enter: show the results list (never auto-open a single product), close suggestions and keyboard */
    document.addEventListener('submit', function (e) {
      if (e.target !== form) return;
      e.preventDefault(); e.stopImmediatePropagation();
      var term = input.value.trim();
      if (!term) { input.focus(); return; }
      commit = true;
      input.dispatchEvent(new Event('input'));   /* untrusted: runs the page filter and the search logging */
      saveRecent(term);
      input.blur();                              /* closes the phone keyboard */
      if (box) { box.classList.remove('on'); box.innerHTML = ''; }
      sync();
    }, true);

    /* the logo goes back to the normal home page */
    var logo = document.querySelector('header .logo');
    if (logo) logo.addEventListener('click', function () { if (input.value) { input.value = ''; input.dispatchEvent(new Event('input')); } });

    sync();
  } catch (err) { try { console.warn('search-jumia:', err); } catch (x) {} }
})();
