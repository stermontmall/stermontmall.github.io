/* Stermont Arcade - adds links to the About, Contact, FAQ and Terms pages in the footer.
   Loaded from img-protect.js, which is already on every public store and product page.
   Safe by design: does nothing if there is no footer, and never adds a link twice. */
(function () {
  'use strict';
  try {
    if (/^\/(admin|account|upload-photos)/.test(location.pathname)) return;
    function run() {
      var foot = document.querySelector('footer .wrap') || document.querySelector('footer');
      if (!foot || foot.getAttribute('data-site-links')) return;
      foot.setAttribute('data-site-links', '1');
      var items = [['About', '/about.html'], ['FAQ', '/faq.html'], ['Contact us', '/contact.html'], ['Terms', '/terms.html']];
      items.forEach(function (it) {
        if (foot.querySelector('a[href$="' + it[1].slice(1) + '"]')) return;
        foot.appendChild(document.createTextNode(' \u00b7 '));
        var a = document.createElement('a');
        a.href = it[1];
        a.textContent = it[0];
        foot.appendChild(a);
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  } catch (e) {}
})();
