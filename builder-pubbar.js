/* Stermont AI Builder: always-visible Publish button.
   While there are changes waiting to be published, a green "Publish" button stays on the screen (bottom right, above the message box),
   so the owner never has to scroll the chat to look for the Publish card. One tap publishes through the same check as the card.
   If the automatic check found a problem, the tap scrolls to the card with the warning instead of publishing.
   If this file fails to load, the builder works as before (the Publish card in the chat and the Publish button in the waiting-changes box). */
(function () {
  'use strict';
  var D = document;
  if (window.__stmPubBar) return;
  window.__stmPubBar = 1;
  var bar = null, n = 0;

  function card() { var l = D.getElementById('log'); return l ? l.querySelector('.pub') : null; }
  function waiting() {
    var c = card(); if (c) return c;
    var s = D.getElementById('stg'); return s && !s.hidden ? s : null;
  }
  function count(c) { var li = c && c.querySelectorAll ? c.querySelectorAll('li') : []; return li.length; }
  function press() {
    var c = card();
    if (c) {
      if (c.querySelector('.warn')) { c.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
      var b = Array.prototype.filter.call(c.querySelectorAll('button'), function (x) { return x.textContent === 'Publish to my website'; })[0];
      if (b && !b.disabled) { b.click(); return; }
    }
    var p = D.getElementById('bPub'); if (p && !p.disabled) p.click();
  }
  function make() {
    bar = D.createElement('button'); bar.type = 'button'; bar.id = 'pubBar'; bar.hidden = true;
    bar.style.cssText = 'position:fixed;right:12px;bottom:140px;z-index:31;background:#15803d;color:#fff;border:0;border-radius:999px;padding:.6rem 1.05rem;font:700 .95rem/1.2 system-ui,sans-serif;box-shadow:0 3px 14px rgba(0,0,0,.35);cursor:pointer';
    bar.onclick = press;
    D.body.appendChild(bar);
  }
  var wasBusy = null;
  function refresh() {
    if (!bar) return;
    var w = waiting();
    if (!w) { bar.hidden = true; wasBusy = null; return; }
    var c = card(), pb = D.getElementById('bPub'), busy = !!(pb && pb.disabled && !c), warn = c && c.querySelector('.warn');
    var k = c ? count(c.querySelector('ul')) : count(D.getElementById('stl'));
    bar.textContent = warn ? 'Check the warning' : busy ? 'Changes waiting' + (k ? ' (' + k + ')' : '') + ' - Publish ready when the AI finishes' : 'Publish' + (k ? ' (' + k + ')' : '') + ' to my website';
    bar.style.background = warn ? '#b45309' : busy ? '#6b7280' : '#15803d';
    bar.disabled = busy;
    if (wasBusy === true && !busy && !warn) { bar.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 600, iterations: 2 }); }
    wasBusy = busy;
    bar.hidden = false;
  }
  function init() {
    var log = D.getElementById('log'), stg = D.getElementById('stg'); if (!log || !D.body) return;
    make();
    new MutationObserver(function () { clearTimeout(n); n = setTimeout(refresh, 80); }).observe(log, { childList: true, subtree: true });
    if (stg) new MutationObserver(function () { clearTimeout(n); n = setTimeout(refresh, 80); }).observe(stg, { attributes: true, attributeFilter: ['hidden'], childList: true, subtree: true });
    var pbn = D.getElementById('bPub');
    if (pbn) new MutationObserver(function () { clearTimeout(n); n = setTimeout(refresh, 50); }).observe(pbn, { attributes: true, attributeFilter: ['disabled'] });
    refresh();
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();
})();
