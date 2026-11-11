/* Checkout hand-off failsafe (2026-11-11).
   checkout.html covers the page with "Preparing your checkout..." (html.stm-co-wait) until the shell's cart has been
   rebuilt and the checkout panel has opened. If anything in that hand-off failed, the cover stayed forever with no message.
   checkout.html itself gives up after about 12 s, so this waits 16 s, then lifts the cover and shows a message with ways forward.
   It does nothing on any other page, and nothing when the checkout opened normally (the cover class is already gone by then). */
(function () {
  try {
    var root = document.documentElement;
    if (!root.classList.contains('stm-co-wait')) return;
    setTimeout(function () {
      try {
        if (!root.classList.contains('stm-co-wait')) return;
        root.classList.remove('stm-co-wait');
        var box = document.createElement('div');
        box.setAttribute('role', 'alert');
        box.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;background:#fff;font:16px/1.5 system-ui,sans-serif;color:#282828';
        var card = document.createElement('div');
        card.style.cssText = 'max-width:380px;width:100%;text-align:center';
        var h = document.createElement('h2');
        h.textContent = 'Checkout did not load';
        h.style.cssText = 'font-size:1.3rem;margin:0 0 8px';
        var p = document.createElement('p');
        p.textContent = 'Your cart is safe. Tap Try again, or go back to the shop and add your items again. You can also send your order on WhatsApp.';
        p.style.cssText = 'margin:0 0 16px;color:#555';
        function btn(label, bg, fg, border) {
          var b = document.createElement('button');
          b.type = 'button'; b.textContent = label;
          b.style.cssText = 'display:block;width:100%;margin:8px 0;padding:14px;border-radius:12px;font:700 16px system-ui,sans-serif;cursor:pointer;text-align:center;text-decoration:none;background:' + bg + ';color:' + fg + ';border:' + (border || '0');
          return b;
        }
        var again = btn('Try again', '#7c3aed', '#fff');
        again.onclick = function () { location.reload(); };
        var back = btn('Back to the shop', '#fff', '#7c3aed', '2px solid #7c3aed');
        back.onclick = function () {
          try { localStorage.removeItem('stm_handoff'); } catch (e) {}
          if (window.parent !== window) { try { window.parent.postMessage({ stmCheckout: 'closed' }, location.origin); return; } catch (e) {} }
          location.replace('/');
        };
        var wa = document.createElement('a');
        wa.href = 'https://wa.me/254748888230?text=' + encodeURIComponent('Hello Stermont Arcade, my checkout did not load. I would like to place an order.');
        wa.target = '_blank'; wa.rel = 'noopener'; wa.textContent = 'Order on WhatsApp';
        wa.style.cssText = 'display:block;margin:8px 0;padding:14px;border-radius:12px;font:700 16px system-ui,sans-serif;text-align:center;text-decoration:none;background:#25d366;color:#fff';
        card.appendChild(h); card.appendChild(p); card.appendChild(again); card.appendChild(back); card.appendChild(wa);
        box.appendChild(card);
        document.body.appendChild(box);
      } catch (e) {}
    }, 16000);
  } catch (e) {}
})();
