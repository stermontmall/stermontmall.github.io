/* Stermont Arcade - generated services pages. Runs after /shell-chrome.js (both deferred).
   shell-chrome.js marks "Account" as the current tab; Services live under Categories, so move the highlight there.
   Does nothing on desktop, where shell-chrome adds no nav. To undo: remove the script tag from build-services.mjs. */
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
