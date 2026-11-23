/* Functional no-shell fallback for generated /p/<slug>.html pages.
   Uses the exact shell.cart schema consumed by mobile-shell/app.js and checkout.html. */
(function () {
  'use strict';
  if (!/^\/p\/[A-Za-z0-9._~-]+\.html$/i.test(location.pathname)) return;
  var $ = function (s, root) { return (root || document).querySelector(s); };
  var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };
  var read = function () { try { var v = JSON.parse(localStorage.getItem('shell.cart') || '[]'); return Array.isArray(v) ? v : []; } catch (_) { return []; } };
  var write = function (cart) { try { localStorage.setItem('shell.cart', JSON.stringify(cart)); window.dispatchEvent(new Event('stm:cart-updated')); return true; } catch (_) { return false; } };
  var money = function (n) { return 'KSh ' + Math.round(Number(n) || 0).toLocaleString('en-KE'); };
  var meta = $('meta[name="stm-id"]');
  var productId = meta ? meta.content : location.pathname.split('/').pop().replace(/\.html$/i, '');
  var name = ($('h1') && $('h1').textContent.trim()) || document.title;
  var image = ($('.pg img') && $('.pg img').getAttribute('src')) || '';
  var bg = '#ede9fe';
  var header = $('header');
  if (header && !$('#stm-static-cart-button')) {
    var cartButton = document.createElement('button');
    cartButton.id = 'stm-static-cart-button'; cartButton.type = 'button';
    cartButton.innerHTML = 'Cart <span data-static-cart-count>0</span>';
    cartButton.style.cssText = 'margin-left:auto;border:1px solid #ddd6fe;border-radius:999px;background:#fff;color:#4c1d95;padding:8px 13px;font-weight:800;cursor:pointer';
    header.appendChild(cartButton);
  }
  var qtyWrap = document.createElement('label');
  qtyWrap.className = 'box'; qtyWrap.style.cssText = 'display:flex;align-items:center;gap:12px;justify-content:space-between';
  qtyWrap.innerHTML = '<b>Quantity</b><span style="display:flex;align-items:center;gap:10px"><button type="button" data-qty-minus aria-label="Decrease quantity">−</button><input data-product-qty type="number" min="1" max="99" value="1" inputmode="numeric" style="width:64px;text-align:center;padding:7px;border:1px solid #ddd6fe;border-radius:8px"><button type="button" data-qty-plus aria-label="Increase quantity">+</button></span>';
  var controls = $('.pg > div:last-child');
  if (controls && !controls.querySelector('[data-product-qty]')) {
    var cartButton = controls.querySelector('[data-pack-cart]');
    if (cartButton) controls.insertBefore(qtyWrap, cartButton);
  }
  var drawer = document.createElement('div');
  drawer.id = 'stm-static-cart-drawer';
  drawer.hidden = true;
  drawer.innerHTML = '<div data-cart-backdrop style="position:fixed;inset:0;background:#11182799;z-index:9998"></div><section role="dialog" aria-modal="true" aria-label="Your cart" style="position:fixed;z-index:9999;right:0;top:0;bottom:0;width:min(440px,100%);background:#fff;box-shadow:-12px 0 35px #11182733;padding:18px;display:flex;flex-direction:column;gap:12px"><header style="display:flex;align-items:center;justify-content:space-between"><b style="font-size:20px">Your cart</b><button type="button" data-cart-close aria-label="Close cart">✕</button></header><div data-cart-items style="overflow:auto;flex:1"></div><div style="border-top:1px solid #e5e7eb;padding-top:12px"><p style="display:flex;justify-content:space-between;font-weight:800"><span>Subtotal</span><span data-cart-total></span></p><button type="button" data-cart-checkout style="width:100%;padding:14px;border:0;border-radius:12px;background:#6d28d9;color:white;font-weight:800">Continue to M-Pesa checkout</button><p style="font-size:12px;color:#64748b">Delivery fee is confirmed at checkout. Pay using M-Pesa Paybill 714777, account 0789514060.</p></div></section>';
  document.body.appendChild(drawer);
  var selected = function (button) {
    return {
      id: button.dataset.productId || productId,
      rowId: button.dataset.productRowId || productId,
      name: button.dataset.productName || name,
      size: button.dataset.productSize || 'Standard',
      price: Number(button.dataset.productPrice || 0),
      img: button.dataset.productImage || image,
      emoji: '🛍️',
      bg: bg
    };
  };
  function paint() {
    var cart = read(), count = cart.reduce(function (n, item) { return n + (Number(item.qty) || 0); }, 0);
    $$('[data-static-cart-count]').forEach(function (el) { el.textContent = count > 99 ? '99+' : String(count); });
    var items = $('[data-cart-items]', drawer), total = cart.reduce(function (n, item) { return n + Number(item.price || 0) * Number(item.qty || 0); }, 0);
    if (items) {
      items.innerHTML = cart.length ? cart.map(function (item, i) {
        return '<div style="display:grid;grid-template-columns:1fr auto;gap:8px;padding:12px 0;border-bottom:1px solid #eee"><div><b>' + String(item.name || 'Product').replace(/[&<>"]/g, '') + '</b><small style="display:block;color:#64748b">' + String(item.size || '').replace(/[&<>"]/g, '') + ' · ' + money(item.price) + '</small><button type="button" data-cart-remove="' + i + '" style="color:#b91c1c;text-decoration:underline;font-size:12px">Remove</button></div><div style="display:flex;align-items:center;gap:7px"><button type="button" data-cart-dec="' + i + '">−</button><b>' + Number(item.qty || 0) + '</b><button type="button" data-cart-inc="' + i + '">+</button></div></div>';
      }).join('') : '<p style="color:#64748b;padding:24px 0;text-align:center">Your cart is empty.</p>';
    }
    var sum = $('[data-cart-total]', drawer); if (sum) sum.textContent = money(total);
  }
  function open() { drawer.hidden = false; paint(); }
  function close() { drawer.hidden = true; }
  function add(button) {
    var item = selected(button), qty = Math.max(1, Math.min(99, Number(($('[data-product-qty]') || {}).value) || 1));
    if (!(item.price > 0) || !item.rowId) { window.alert('This product price is not available. Please contact us on WhatsApp.'); return; }
    var cart = read(), key = item.id + '|' + item.size, found = cart.find(function (x) { return x.key === key; });
    if (found) found.qty = Math.min(99, Number(found.qty || 0) + qty);
    else cart.push({ key: key, id: item.id, rowId: item.rowId, name: item.name, size: item.size, qty: qty, price: item.price, img: item.img, emoji: item.emoji, bg: item.bg });
    if (!write(cart)) { window.alert('Could not save your cart. Please enable site storage and try again.'); return; }
    paint(); open();
  }
  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-pack-cart]');
    if (button) { event.preventDefault(); add(button); return; }
    if (event.target.closest('#stm-static-cart-button')) { open(); return; }
    if (event.target.closest('[data-qty-minus]')) { var q = $('[data-product-qty]'); q.value = Math.max(1, Number(q.value || 1) - 1); return; }
    if (event.target.closest('[data-qty-plus]')) { var q2 = $('[data-product-qty]'); q2.value = Math.min(99, Number(q2.value || 1) + 1); return; }
    if (event.target.closest('[data-cart-close], [data-cart-backdrop]')) { close(); return; }
    var inc = event.target.closest('[data-cart-inc]'), dec = event.target.closest('[data-cart-dec]'), rem = event.target.closest('[data-cart-remove]');
    if (inc || dec || rem) {
      var index = Number((inc || dec || rem).dataset.cartInc ?? (inc || dec || rem).dataset.cartDec ?? (inc || dec || rem).dataset.cartRemove);
      var cart = read();
      if (rem) cart.splice(index, 1);
      else if (cart[index]) { cart[index].qty = Number(cart[index].qty || 0) + (inc ? 1 : -1); if (cart[index].qty < 1) cart.splice(index, 1); }
      write(cart); paint(); return;
    }
    if (event.target.closest('[data-cart-checkout]')) {
      var cart = read();
      if (!cart.length) { window.alert('Your cart is empty.'); return; }
      try {
        localStorage.setItem('stm_handoff', JSON.stringify(cart.map(function (item) { return { rowId: item.rowId, qty: item.qty, price: item.price, name: item.name, size: item.size }; })));
        location.href = '/checkout.html';
      } catch (_) { window.alert('Could not start checkout. Please enable site storage and try again.'); }
    }
  });
  window.addEventListener('storage', function (event) { if (event.key === 'shell.cart') paint(); });
  window.addEventListener('stm:cart-updated', paint);
  paint();
})();