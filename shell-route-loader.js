/* Hydrate generated SEO product/category pages with the real storefront app without changing their URL.
   The server-rendered page remains the no-JS fallback and is retained in an expandable, crawlable section. */
(function () {
  'use strict';
  var path = location.pathname;
  if (!/^\/(?:p|c)\/[A-Za-z0-9._~-]+\.html$/i.test(path) || window.__stmFullShellLoading) return;
  window.__stmFullShellLoading = true;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Could not load ' + src)); };
      document.body.appendChild(s);
    });
  }

  fetch('/', { credentials: 'same-origin', cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) throw new Error('Storefront shell returned HTTP ' + response.status);
      return response.text();
    })
    .then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      if (!doc.querySelector('#appbar') || !doc.querySelector('#bottom-nav') || !doc.querySelector('#page-product')) {
        throw new Error('The homepage response is not the complete mobile shell');
      }

      var originalMain = document.querySelector('main');
      var fallback = null;
      if (originalMain) {
        fallback = document.createElement('details');
        fallback.className = 'stm-seo-fallback';
        var summary = document.createElement('summary');
        summary.textContent = 'Read the full product or category information';
        fallback.appendChild(summary);
        fallback.appendChild(originalMain.cloneNode(true));
      }

      // Bring over the shell's CSS and inline head styles, but retain this page's SEO metadata,
      // canonical URL, product JSON-LD, title and social preview tags.
      Array.prototype.forEach.call(doc.head.querySelectorAll('link[rel="stylesheet"],style'), function (node) {
        var clone = node.cloneNode(true);
        if (node.tagName === 'LINK' && !document.head.querySelector('link[href="' + node.getAttribute('href') + '"]')) {
          document.head.appendChild(clone);
        } else if (node.tagName === 'STYLE') {
          document.head.appendChild(clone);
        }
      });

      var originalChildren = Array.prototype.map.call(document.body.childNodes, function (node) { return node.cloneNode(true); });
      document.body.className = doc.body.className;
      var shellChildren = Array.prototype.filter.call(doc.body.childNodes, function (node) {
        return !(node.nodeType === 1 && node.tagName === 'SCRIPT');
      }).map(function (node) { return node.cloneNode(true); });
      document.body.replaceChildren.apply(document.body, shellChildren);
      if (fallback) {
        var style = document.createElement('style');
        style.textContent = '.stm-seo-fallback{max-width:1160px;margin:24px auto 90px;padding:12px 16px;background:#fff;border:1px solid #e5e7eb;border-radius:14px;color:#172033}.stm-seo-fallback>summary{cursor:pointer;font-weight:700;color:#5b21b6}.stm-seo-fallback main{width:100%;padding:16px 0}';
        document.head.appendChild(style);
        document.body.appendChild(fallback);
      }

      return loadScript('/mobile-shell/app.js?v=41').then(function () {
        return loadScript('/analytics.js').catch(function () {});
      }).catch(function (error) {
        // Never strand a shopper on an inert shell if its app bundle cannot load.
        document.body.replaceChildren.apply(document.body, originalChildren);
        throw error;
      });
    })
    .catch(function (error) {
      console.warn('Stermont full-shell route fallback:', error && error.message ? error.message : error);
    });
})();
