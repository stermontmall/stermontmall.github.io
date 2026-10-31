/* Stermont Arcade - generated services pages. Runs after /shell-chrome.js (both deferred).
   shell-chrome.js marks "Account" as the current tab; Services live under Categories, so move the highlight there.
   Does nothing on desktop, where shell-chrome adds no nav. To undo: remove the script tag from build-services.mjs.
   Also loads the quote drawer (no payment), which takes over the "Get a quote" buttons. To undo: delete the loader line. */
(function () { try { var q = document.createElement('script'); q.src = '/services/quote.js?v=1'; q.defer = true; document.head.appendChild(q); } catch (e) {} })();
(function () {
  try {
    var nav = document.getElementById('stm-nav');
    if (!nav) return;
    var cur = nav.querySelector('[aria-current]');
    if (cur) cur.removeAttribute('aria-current');
    var cat = nav.querySelector('a[href="/?tab=categories"]');
    if (cat) cat.setAttribute('aria-current', 'page');
  } catch (e) {}
})();
