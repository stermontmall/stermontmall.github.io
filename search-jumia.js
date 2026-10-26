/* Stermont Arcade - Jumia-style search behaviour (same page, no new results page).
   Loaded by search-log.js. It sits on top of the search script in index.html and changes only how the box reacts:
   1. Typing shows suggestions only. The page is NOT re-filtered on every keystroke (Jumia acts when you press Search / Enter).
   2. Pressing Search / Enter with an empty box does nothing. With text it shows the results, closes the suggestions and
      the phone keyboard, and scrolls to the results. A single match no longer opens by itself: you get the results list first.
   3. The message above the results reads "N results for "term"" with a Clear link.
   Clearing the box, tapping a category, a tab, a suggestion or a recent search still work exactly as before.
   Safe by design: on any page without the search box this file does nothing, and if it fails the old behaviour remains. */
(function () {
  'use strict';
  try {
    var form = document.getElementById('search-form'), input = document.getElementById('q');
    if (!form || !input) return;
    var msg = document.getElementById('search-msg'), box = document.getElementById('sugg');
    input.setAttribute('enterkeyhint', 'search');   /* phone keyboard shows a Search key */

    /* 1. typing: suggestions only. Real keystrokes with text are held back from the page filter; the suggestion list is
          refreshed through the box's own focus handler. Empty box and programmatic events (categories, tabs) pass through. */
    document.addEventListener('input', function (e) {
      if (e.target !== input || !e.isTrusted || !input.value.trim()) return;
      e.stopImmediatePropagation();
      input.dispatchEvent(new Event('focus'));
    }, true);

    function saveRecent(t) {
      t = (t || '').replace(/\s+/g, ' ').trim(); if (t.length < 2) return;
      try {
        var r = JSON.parse(localStorage.getItem('stm_recent') || '[]'); if (!Array.isArray(r)) r = [];
        r = r.filter(function (x) { return typeof x === 'string' && x.toLowerCase() !== t.toLowerCase(); }); r.unshift(t);
        localStorage.setItem('stm_recent', JSON.stringify(r.slice(0, 5)));
      } catch (x) {}
    }
    function visible(el) { return el && !el.classList.contains('hidden'); }
    function count() {
      var n = visible(document.getElementById('featured')) ? 1 : 0;
      n += document.querySelectorAll('#music-gear .pcard:not(.hidden)').length;
      n += document.querySelectorAll('#range .range > div:not(.hidden) li:not(.hidden)').length;
      return n;
    }

    /* 2. submit */
    document.addEventListener('submit', function (e) {
      if (e.target !== form) return;
      e.preventDefault(); e.stopImmediatePropagation();
      var term = input.value.trim();
      if (!term) { input.focus(); return; }
      input.dispatchEvent(new Event('input'));   /* untrusted: runs the page filter, and the box's own search logging */
      saveRecent(term);
      input.blur();                              /* closes the phone keyboard */
      if (box) { box.classList.remove('on'); box.innerHTML = ''; }

      /* 3. result message */
      var n = count();
      if (msg && n) {
        msg.textContent = n + (n === 1 ? ' result' : ' results') + ' for "' + term + '" \u00b7 ';
        var c = document.createElement('a'); c.href = '#top'; c.textContent = 'Clear';
        c.addEventListener('click', function (ev) { ev.preventDefault(); input.value = ''; input.dispatchEvent(new Event('input')); });
        msg.appendChild(c);
      }
      var music = document.getElementById('music-gear'), feat = document.getElementById('featured');
      if (n) {
        var target = visible(feat) ? feat : (visible(music) ? music : document.getElementById('range'));
        if (target && target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth' });
      }
    }, true);
  } catch (err) { try { console.warn('search-jumia:', err); } catch (x) {} }
})();
