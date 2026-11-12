/* Stermont Arcade admin · adds an "Accounts" item to the Customers group of the admin menu.
   It opens /admin-accounts.html (staff-only list of everyone who created an account, with email and WhatsApp links).
   The admin menu is redrawn often, so this re-adds the item whenever it is missing. The phone shell menu picks it up too.
   Loaded from admin-suggest.js (admin.html is large). To undo: delete the loader block at the end of admin-suggest.js. */
(function () {
  try {
    var D = document;
    function add() {
      var nav = D.getElementById('navg'); if (!nav || nav.querySelector('.ni[data-acc]')) return;
      var groups = nav.querySelectorAll('.ng'), host = null;
      Array.prototype.forEach.call(groups, function (g) { var l = g.querySelector('.ngl'); if (l && l.textContent.trim() === 'Customers') host = g; });
      if (!host) return;
      var b = D.createElement('button'); b.type = 'button'; b.className = 'ni'; b.setAttribute('data-acc', '1');
      var ic = D.createElement('span'); ic.className = 'ic'; ic.textContent = '\uD83D\uDC65';
      var lb = D.createElement('span'); lb.className = 'lb'; lb.textContent = 'Accounts';
      b.appendChild(ic); b.appendChild(lb);
      b.onclick = function () { location.href = '/admin-accounts.html'; };
      host.appendChild(b);
    }
    function go() {
      var nav = D.getElementById('navg'); if (!nav) return;
      add();
      if (window.MutationObserver) new MutationObserver(add).observe(nav, { childList: true });
    }
    if (D.getElementById('navg')) go(); else D.addEventListener('DOMContentLoaded', go);
  } catch (e) {}
})();
