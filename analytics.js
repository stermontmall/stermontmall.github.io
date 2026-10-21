/* Stermont Arcade - optional visitor analytics.
   Does nothing until you paste an ID into CONFIG below, so it is safe to leave as it is.
   - ga4:       Google Analytics 4 measurement ID, looks like G-XXXXXXXXXX
   - plausible: your site domain as set up in Plausible, e.g. stermontarcade.co.ke
   - metaPixel: Facebook/Meta Pixel ID (digits only), useful if you run Facebook or Instagram ads
   Skips the admin and account pages, and visitors who have "Do Not Track" switched on.
   Also records taps on WhatsApp order links, so you can see which pages bring enquiries. */
(function () {
  'use strict';
  var CONFIG = { ga4: 'G-51B6TZQ0ZN', plausible: '', metaPixel: '' };

  if (!(CONFIG.ga4 || CONFIG.plausible || CONFIG.metaPixel)) return;
  if (/^\/(admin|account)/.test(location.pathname)) return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;

  function load(src, attrs) {
    var s = document.createElement('script');
    s.async = true; s.src = src;
    if (attrs) for (var k in attrs) s.setAttribute(k, attrs[k]);
    document.head.appendChild(s);
  }

  try {
    if (CONFIG.ga4) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', CONFIG.ga4);
      load('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CONFIG.ga4));
    }
    if (CONFIG.plausible) {
      window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
      load('https://plausible.io/js/script.js', { 'data-domain': CONFIG.plausible });
    }
    if (CONFIG.metaPixel) {
      (function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n;
        n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
        t = b.createElement(e); t.async = true; t.src = v;
        s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', CONFIG.metaPixel);
      window.fbq('track', 'PageView');
    }

    // Count taps on WhatsApp order / enquiry links.
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href*="wa.me"]') : null;
      if (!a) return;
      try {
        if (window.gtag && CONFIG.ga4) window.gtag('event', 'whatsapp_click', { page_path: location.pathname });
        if (window.plausible && CONFIG.plausible) window.plausible('WhatsApp Click');
        if (window.fbq && CONFIG.metaPixel) window.fbq('track', 'Contact');
      } catch (err) {}
    }, true);
  } catch (e) {}
})();
