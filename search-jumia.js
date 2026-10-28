/* Stermont Arcade - Jumia-style search behaviour (same page, no new results page).
   Loaded by search-log.js. It sits on top of the search script in index.html and only polishes how the box reacts:
   1. Typing filters the products straight away AND shows suggestions (the page's own live filter is no longer blocked).
   2. Pressing Search / Enter with an empty box does nothing. With text it closes the suggestions and the phone keyboard
      and shows the results (the page scrolls to them; a single match opens by itself, as before).
   3. The message above the results reads "N results for "term"" with a Clear link.
   Safe by design: on any page without the search box this file does nothing, and if it fails the page's own search remains. */
(function () {
  'use strict';
  try {
    var form = document.getElementById('search-form'), input = document.getElementById('q');
    if (!form || !input) return;
    var msg = document.getElementById('search-msg'), box = document.getElementById('sugg');
    input.setAttribute('enterkeyhint', 'search');   /* phone keyboard shows a Search key */

    function visible(el) { return el && !el.classList.contains('hidden'); }
    function count() {
      var n = visible(document.getElementById('featured')) ? 1 : 0;
      n += document.querySelectorAll('#music-gear .pcard:not(.hidden)').length;
      n += document.querySelectorAll('#range .range > div:not(.hidden) li:not(.hidden)').length;
      return n;
    }

    /* Runs after the page's own submit handler (which filters, scrolls, logs and opens a single match). */
    form.addEventListener('submit', function () {
      var term = input.value.trim();
      if (!term) { input.focus(); return; }
      input.blur();                              /* closes the phone keyboard */
      if (box) { box.classList.remove('on'); box.innerHTML = ''; }
      var n = count();
      if (msg && n) {
        msg.textContent = n + (n === 1 ? ' result' : ' results') + ' for "' + term + '" · ';
        var c = document.createElement('a'); c.href = '#top'; c.textContent = 'Clear';
        c.addEventListener('click', function (ev) { ev.preventDefault(); input.value = ''; input.dispatchEvent(new Event('input')); });
        msg.appendChild(c);
      }
    });
  } catch (err) { try { console.warn('search-jumia:', err); } catch (x) {} }
})();
