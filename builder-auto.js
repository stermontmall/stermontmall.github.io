/* Stermont AI Builder: automatic publishing.
   When the AI finishes a job and the built-in check finds no problems and no unverified claims,
   this presses the Publish button for you, so the change is committed straight to the website.
   If the check finds anything, nothing is published automatically and the normal card is shown.
   It only acts on jobs you start in this session, never on old waiting changes restored after a refresh.
   Turn it off any time with the checkbox in Settings. If this file fails to load, the builder works as before. */
(function () {
  'use strict';
  var D = document, KEY = 'stm_builder_auto_v1';
  if (window.__stmAuto) return;
  window.__stmAuto = 1;
  var armed = false, toast = null, toastT = 0;

  function on() { try { return localStorage.getItem(KEY) !== '0'; } catch (e) { return true; } }
  function setOn(v) { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {} }
  function say(t, ms) {
    if (!D.body) return;
    if (!toast) {
      toast = D.createElement('div');
      toast.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:130px;z-index:30;max-width:90%;background:#15803d;color:#fff;border-radius:999px;padding:.35rem .9rem;font:600 .85rem/1.3 system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.25);text-align:center';
      D.body.appendChild(toast);
    }
    clearTimeout(toastT);
    toast.hidden = false; toast.textContent = t;
    if (ms) toastT = setTimeout(function () { toast.hidden = true; }, ms);
  }

  function tryAuto(card) {
    if (!armed || !on()) return;
    if (card.querySelector('.warn')) {
      armed = false;
      say('Not published automatically: please read the warning on the card.', 7000);
      return;
    }
    var btn = Array.prototype.filter.call(card.querySelectorAll('button'), function (b) { return b.textContent === 'Publish to my website'; })[0];
    if (!btn || btn.disabled) return;
    armed = false;
    say('Check passed. Publishing automatically...', 5000);
    setTimeout(function () { if (btn.isConnected && !btn.disabled) btn.click(); }, 400);
  }

  function init() {
    var log = D.getElementById('log'), rem = D.getElementById('remember');
    if (!log) return;
    if (rem && rem.parentNode && rem.parentNode.parentNode && !D.getElementById('autoPub')) {
      var lab = D.createElement('label'); lab.style.fontWeight = '500';
      var cb = D.createElement('input'); cb.type = 'checkbox'; cb.id = 'autoPub'; cb.checked = on();
      cb.onchange = function () { setOn(cb.checked); };
      lab.appendChild(cb);
      lab.appendChild(D.createTextNode(' Publish automatically when the check finds no problems (no need to press Publish)'));
      rem.parentNode.parentNode.insertBefore(lab, rem.parentNode.nextSibling);
    }
    /* a new message from you starts a job; the next clean Publish card from that job is published for you */
    new MutationObserver(function (list) {
      list.forEach(function (m) {
        Array.prototype.forEach.call(m.addedNodes, function (n) {
          if (!n.classList) return;
          if (n.classList.contains('user')) armed = true;
          else if (n.classList.contains('pub')) tryAuto(n);
        });
      });
    }).observe(log, { childList: true });
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();
})();
/* task queue (optional: the builder works without it) */
try { var ts = document.createElement('script'); ts.src = '/builder-tasks.js?v=3'; ts.async = true; (document.head || document.documentElement).appendChild(ts); } catch (e) {}
