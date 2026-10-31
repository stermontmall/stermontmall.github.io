/* Stermont Arcade - small site-wide additions, loaded from img-protect.js (already on every public store and product page).
   1. Footer links to the About, FAQ, Contact and Terms pages.
   2. On product pages (/p/...): share buttons, a "tell me when it is back in stock" form for sold-out items, and an
      "alert me if the price drops" form. Requests land in the shop's existing customer messages inbox (public.messages),
      tagged [ALERT: ...], so no extra database table is needed.
   Safe by design: each part does nothing if its target is missing, and never adds anything twice. */
(function () {
  'use strict';
  var WA = '254748888230';
  var SB = 'https://oewvtbnmyombbtggamor.supabase.co';
  var KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7';   // public (publishable) key, same one the product-page builder uses
  function el(tag, css, text) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (text) e.textContent = text; return e; }

  function footerLinks() {
    var foot = document.querySelector('footer .wrap') || document.querySelector('footer');
    if (!foot || foot.getAttribute('data-site-links')) return;
    foot.setAttribute('data-site-links', '1');
    [['Services', '/services/'], ['About', '/about.html'], ['FAQ', '/faq.html'], ['Contact us', '/contact.html'], ['Terms', '/terms.html']].forEach(function (it) {
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

    // 2. Back-in-stock and price-drop alerts.
    function notify(label) {
      return 'https://wa.me/' + WA + '?text=' + enc('Hello Stermont Arcade, please tell me when this is back in stock: ' + label + ' ' + url);
    }
    // Alert form: saves the shopper's phone number to the customer messages inbox.
    function alertForm(kind, blurb, btnLabel) {
      var wrap = el('div');
      wrap.appendChild(el('p', 'margin:.2rem 0 .6rem;font-size:.92rem;color:#5f5b6e', blurb));
      var f = el('div', 'display:flex;flex-wrap:wrap;gap:.5rem');
      var inp = el('input', 'flex:1 1 180px;min-width:0;padding:.6rem .8rem;border:1px solid #cfc7e6;border-radius:10px;font:1rem system-ui,sans-serif');
      inp.type = 'tel'; inp.placeholder = 'Your phone, e.g. 0712 345 678'; inp.autocomplete = 'tel'; inp.setAttribute('aria-label', 'Your phone number');
      var hp = el('input', 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0'); hp.type = 'text'; hp.tabIndex = -1; hp.autocomplete = 'off'; hp.setAttribute('aria-hidden', 'true');
      var btn = el('button', 'padding:.6rem 1.1rem;border:0;border-radius:10px;background:#7c3aed;color:#fff;font:700 1rem system-ui,sans-serif;cursor:pointer', btnLabel);
      btn.type = 'button';
      var msg = el('p', 'margin:.5rem 0 0;font-size:.9rem'); msg.setAttribute('role', 'status');
      var key = 'stm-alert:' + kind + ':' + url;
      function say(t, bad) { msg.textContent = t; msg.style.color = bad ? '#b91c1c' : '#15803d'; }
      btn.addEventListener('click', function () {
        if (hp.value) return;
        var phone = inp.value.replace(/[^0-9+]/g, ''), n = phone.replace(/\D/g, '').length;
        if (n < 9 || n > 15) { say('Please enter a valid phone number.', true); return; }
        try { if (localStorage.getItem(key)) { say('You already asked for this alert. We have your number.'); return; } } catch (e) {}
        btn.disabled = true; btn.textContent = 'Sending\u2026';
        var what = kind === 'restock' ? 'back in stock' : 'price drop';
        fetch(SB + '/rest/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: KEY, Prefer: 'return=minimal' },
          body: JSON.stringify({ name: 'Stock alert request', phone: phone.slice(0, 20), body: ('[ALERT: ' + what + '] Please contact me about: ' + title + ' ' + url).slice(0, 1000) })
        }).then(function (r) {
          if (!r.ok) throw new Error('status ' + r.status);
          try { localStorage.setItem(key, '1'); } catch (e) {}
          say('Thank you. We have your number and will contact you.'); btn.textContent = 'Sent';
        }).catch(function () {
          btn.disabled = false; btn.textContent = btnLabel;
          msg.style.color = '#b91c1c'; msg.textContent = 'Sorry, that did not go through. ';
          var a = el('a', '', 'Tell us on WhatsApp instead'); a.href = notify(title); a.target = '_blank'; a.rel = 'noopener'; msg.appendChild(a);
        });
      });
      f.appendChild(inp); f.appendChild(hp); f.appendChild(btn); wrap.appendChild(f); wrap.appendChild(msg);
      return wrap;
    }

    var sold = pg.querySelector('p.no');
    var isSold = sold && /sold out/i.test(sold.textContent);
    if (isSold) {
      var sb = el('div', 'background:#fff;border:1px solid #e6e1f5;border-radius:14px;padding:.9rem 1rem;margin:.8rem 0');
      sb.appendChild(el('strong', 'display:block', 'Tell me when it is back in stock'));
      sb.appendChild(alertForm('restock', 'Leave your number and we will contact you as soon as it is available again.', 'Notify me'));
      sold.parentNode.insertBefore(sb, sold.nextSibling);
    } else {
      var det = el('details', 'background:#fff;border:1px solid #e6e1f5;border-radius:14px;padding:.7rem 1rem;margin:1rem 0');
      det.appendChild(el('summary', 'cursor:pointer;font-weight:700', 'Alert me if the price drops'));
      det.appendChild(alertForm('price', 'Leave your number and we will contact you if the price of this product goes down.', 'Alert me'));
      box.parentNode.insertBefore(det, box.nextSibling);
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
