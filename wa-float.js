/* Floating WhatsApp button, shown on every public page so customers can ask about stock and delivery fees in one tap.
   Loaded directly by the info pages, and from /img-protect.js and /analytics.js (storefront, product, category and blog pages).
   Loading it twice is harmless: the second run sees the button and stops. */
(function () {
  if (document.getElementById('wa-float')) return;
  if (/admin|upload-photos/.test(location.pathname)) return;
  var NUMBER = '254748888230';
  var page = document.title || 'your website';
  var msg = 'Hello Stermont Arcade, I would like to ask about stock and delivery for: ' + page + ' (' + location.href + ')';
  var a = document.createElement('a');
  a.id = 'wa-float';
  a.href = 'https://wa.me/' + NUMBER + '?text=' + encodeURIComponent(msg);
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('aria-label', 'Chat with us on WhatsApp');
  /* On the storefront the chat button and back-to-top button already sit bottom right, so this one sits above them. */
  if (document.getElementById('music-gear')) a.className = 'wa-store';
  a.innerHTML = '<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path fill="#fff" d="M16 3C8.8 3 3 8.8 3 16c0 2.3.6 4.5 1.7 6.4L3 29l6.8-1.8A13 13 0 1 0 16 3zm0 23.7c-2 0-3.9-.5-5.6-1.5l-.4-.2-4 1 1.1-3.9-.3-.4A10.7 10.7 0 1 1 16 26.700zm5.9-8c-.3-.2-1.9-.9-2.200-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.200-.2.200-.4.200-.7.100-.3-.2-1.400-.5-2.600-1.600-1-.9-1.600-1.900-1.800-2.300-.2-.3 0-.5.100-.7l.5-.6c.2-.2.200-.3.300-.5.100-.2.100-.4 0-.6l-1-2.300c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.100-.9.400-.3.300-1.200 1.100-1.200 2.800s1.200 3.200 1.400 3.500c.2.200 2.400 3.700 5.800 5.100.8.4 1.400.600 1.900.700.8.300 1.500.200 2.100.100.600-.1 1.900-.8 2.100-1.500.3-.7.300-1.400.2-1.500-.1-.2-.3-.3-.6-.4z"/></svg><span class="wa-t">Chat with us on WhatsApp</span>';
  var s = document.createElement('style');
  s.textContent = '#wa-float{box-sizing:border-box;position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9999;display:flex;align-items:center;justify-content:center;gap:9px;width:56px;height:56px;border-radius:28px;background:#0f7a37;color:#fff;border:2px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.3);font:700 15px/1 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-decoration:none;transition:transform .15s}' +
    '#wa-float .wa-t{display:none}' +
    '@media(min-width:600px){#wa-float{width:auto;padding:0 18px 0 14px}#wa-float .wa-t{display:inline}}' +
    '#wa-float:hover{transform:scale(1.06)}#wa-float:focus-visible{outline:3px solid #7c3aed;outline-offset:3px}' +
    '#wa-float.wa-store{bottom:calc(214px + env(safe-area-inset-bottom,0px))}@media(min-width:760px){#wa-float.wa-store{bottom:84px}}' +
    '@media print{#wa-float{display:none}}';
  document.head.appendChild(s);
  document.body.appendChild(a);
})();
