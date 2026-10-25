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

    // Real-visitor speed (Core Web Vitals) from Google's web-vitals library, sent to GA4 as events.
    // In GA4 look for the events LCP, INP, CLS, FCP and TTFB (metric_rating = good / needs-improvement / poor).
    if (CONFIG.ga4) {
      var wv = document.createElement('script');
      wv.async = true;
      wv.src = 'https://cdn.jsdelivr.net/npm/web-vitals@4/dist/web-vitals.iife.js';
      wv.onload = function () {
        try {
          var send = function (m) {
            window.gtag('event', m.name, {
              value: Math.round(m.name === 'CLS' ? m.delta * 1000 : m.delta),
              metric_id: m.id,
              metric_value: m.value,
              metric_rating: m.rating,
              page_path: location.pathname,
              non_interaction: true
            });
          };
          ['onLCP', 'onINP', 'onCLS', 'onFCP', 'onTTFB'].forEach(function (k) {
            if (window.webVitals && window.webVitals[k]) window.webVitals[k](send);
          });
        } catch (err) {}
      };
      document.head.appendChild(wv);
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

/* Floating WhatsApp button on every public page, including blog posts (see /wa-float.js).
   Kept in this separate block so it still runs when analytics is switched off or Do Not Track is on. Safe to load more than once. */
(function () {
  try {
    if (/^\/(admin|upload-photos)/.test(location.pathname) || document.getElementById('wa-float')) return;
    var w = document.createElement('script'); w.src = '/wa-float.js?v=2'; w.defer = true; document.head.appendChild(w);
  } catch (e) {}
})();
