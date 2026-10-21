/* Stermont Arcade - small site-wide additions, loaded from img-protect.js (already on every public store and product page).
   1. Footer links to the About, FAQ, Contact and Terms pages.
   2. On product pages (/p/...): share buttons, and "tell me when it is back" buttons for sold-out items.
   Safe by design: each part does nothing if its target is missing, and never adds anything twice. */
(function () {
  'use strict';
  var WA = '254748888230';
  function el(tag, css, text) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (text) e.textContent = text; return e; }

  function footerLinks() {
    var foot = document.querySelector('footer .wrap') || document.querySelector('footer');
    if (!foot || foot.getAttribute('data-site-links')) return;
    foot.setAttribute('data-site-links', '1');
    [['About', '/about.html'], ['FAQ', '/faq.html'], ['Contact us', '/contact.html'], ['Terms', '/terms.html']].forEach(function (it) {
      if (foot.querySelector('a[href$="' + it[1].slice(1) + '"]')) return;
      foot.appendChild(document.createTextNode(' \u00b7 '));
      var a = document.createElement('a'); a.href = it[1]; a.textContent = it[0]; foot.appendChild(a);
    });
  }

  function productExtras() {
    if (location.pathname.indexOf('/p/') !== 0) return;
    var pg = document.querySelector('.pg'), h1 = document.querySelector('h1');
    if (!pg || !h1 || pg.getAttribute('data-extras')) return;
    pg.setAttribute('data-extras', '1');
    var title = h1.textContent.trim();
    var can = document.querySelector('link[rel="canonical"]');
    var url = (can && can.href) || location.href.split('#')[0];
    var enc = encodeURIComponent;

    // 1. Share buttons, placed right under the product block.
    var box = el('div', 'background:#fff;border:1px solid #e6e1f5;border-radius:14px;padding:.9rem 1rem;margin:1rem 0');
    box.appendChild(el('strong', 'display:block;margin-bottom:.5rem', 'Share this product'));
    var row = el('div', 'display:flex;flex-wrap:wrap;gap:.5rem');
    function pill(label, href, onclick) {
      var a = el(href ? 'a' : 'button', 'display:inline-block;padding:.5rem .9rem;border-radius:999px;border:1px solid #7c3aed;background:#fff;color:#5b21b6;font:600 .9rem system-ui,sans-serif;text-decoration:none;cursor:pointer', label);
      if (href) { a.href = href; a.target = '_blank'; a.rel = 'noopener'; } else { a.type = 'button'; }
      if (onclick) a.addEventListener('click', onclick);
      row.appendChild(a); return a;
    }
    if (navigator.share) pill('Share\u2026', null, function () { navigator.share({ title: title, url: url }).catch(function () {}); });
    pill('WhatsApp', 'https://wa.me/?text=' + enc(title + ' ' + url));
    pill('Facebook', 'https://www.facebook.com/sharer/sharer.php?u=' + enc(url));
    pill('X', 'https://twitter.com/intent/tweet?text=' + enc(title) + '&url=' + enc(url));
    var copy = pill('Copy link', null, function () {
      function done() { copy.textContent = 'Link copied'; setTimeout(function () { copy.textContent = 'Copy link'; }, 2000); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () {});
      else { var t = el('textarea'); t.value = url; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) {} document.body.removeChild(t); }
    });
    box.appendChild(row);
    pg.parentNode.insertBefore(box, pg.nextSibling);

    // 2. Back-in-stock requests by WhatsApp (no sign-up needed; the message reaches the shop directly).
    function notify(label) {
      return 'https://wa.me/' + WA + '?text=' + enc('Hello Stermont Arcade, please tell me when this is back in stock: ' + label + ' ' + url);
    }
    var sold = pg.querySelector('p.no');
    if (sold && /sold out/i.test(sold.textContent)) {
      var a = el('a', 'display:block;text-align:center;background:#fff;color:#6d28d9;border:2px solid #7c3aed;font-weight:800;padding:.85rem;border-radius:12px;margin:.8rem 0 .4rem;text-decoration:none', 'Tell me when it is back in stock');
      a.href = notify(title); a.target = '_blank'; a.rel = 'noopener';
      sold.parentNode.insertBefore(a, sold.nextSibling);
    }
    [].slice.call(document.querySelectorAll('ul.g li small.no')).forEach(function (s) {
      var li = s.parentNode, label = (li.firstChild && li.firstChild.textContent || '').trim();
      var a = el('a', 'display:inline-block;margin-top:.3rem;font-size:.85rem', 'Tell me when it is back');
      a.href = notify(title + (label ? ' \u2013 ' + label : '')); a.target = '_blank'; a.rel = 'noopener';
      li.appendChild(document.createElement('br')); li.appendChild(a);
    });
  }

  function run() { try { footerLinks(); } catch (e) {} try { productExtras(); } catch (e) {} }
  try {
    if (/^\/(admin|account|upload-photos)/.test(location.pathname)) return;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  } catch (e) {}
})();
