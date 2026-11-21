/* Hydrate generated SEO product/category pages with the real storefront app without changing their URL.
   The server-rendered page remains the no-JS fallback and is retained in an expandable, crawlable section. */
(function () {
  'use strict';
  var path = location.pathname;
  if (!/^\/(?:p|c)\/[A-Za-z0-9._~-]+\.html$/i.test(path) || window.__stmFullShellLoading) return;
  window.__stmFullShellLoading = true;

  /* Catalogue prefetch (2026-11-21, site speed). Same block as the inline script at the top of index.html (this page never runs that one: the homepage is only parsed
     below, not executed). The shell has to download the homepage, then app.js, and only then asks Supabase for the categories and the whole catalogue; this starts those
     requests now, in parallel with that, and hands the answers to app.js's own fetch() calls (identical URLs and headers). Kept in localStorage for 5 minutes. Anything
     unexpected falls through to the normal fetch. To undo: delete this block (and the one in index.html). */
  (function () {
    try {
      if (!window.fetch || !window.Promise || !window.Response) return;
      var REST = 'https://oewvtbnmyombbtggamor.supabase.co/rest/v1/', KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7';
      var CATS = REST + 'categories?select=id,name,slug,parent_id,sort_order,is_promo&order=sort_order.asc,id.asc', RPC = REST + 'rpc/get_store_catalog';
      var PAGE = 1000, PAGES = 2, TTL = 5 * 60 * 1000, LS = 'shell.catalogPrefetch.v1';
      var realFetch = window.fetch.bind(window), now = Date.now(), entries = {}, noop = function () {};
      var wanted = [{ k: 'cats', url: CATS, range: '' }];
      for (var i = 0; i < PAGES; i++) wanted.push({ k: 'p' + i, url: RPC, range: (i * PAGE) + '-' + (i * PAGE + PAGE - 1) });
      function net(w) {
        var h = { apikey: KEY };
        if (w.range) { h.Range = w.range; h['Range-Unit'] = 'items'; }
        return realFetch(w.url, { headers: h, cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); });
      }
      function plausible(t) { return typeof t === 'string' && t.charAt(0) === '[' && t.charAt(t.length - 1) === ']'; }
      function persist(texts) {
        try { var o = { t: Date.now() }; wanted.forEach(function (w, n) { o[w.k] = texts[n]; }); localStorage.setItem(LS, JSON.stringify(o)); } catch (e) {}
      }
      function refresh() { Promise.all(wanted.map(net)).then(persist).catch(noop); }
      var saved = null;
      try { saved = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) {}
      var age = saved ? now - saved.t : Infinity;
      var fresh = age >= 0 && age < TTL && wanted.every(function (w) { return plausible(saved[w.k]); });
      if (fresh) {
        wanted.forEach(function (w) { entries[w.k] = { t: now, p: Promise.resolve(saved[w.k]) }; });
        if (age > 60000) refresh();
      } else {
        var ps = wanted.map(function (w) { var p = net(w); entries[w.k] = { t: now, p: p }; return p; });
        Promise.all(ps).then(persist).catch(noop);
        ps.forEach(function (p) { p.catch(noop); });
      }
      var realFetchPublic = window.fetch;
      window.fetch = function (input, init) {
        try {
          var url = typeof input === 'string' ? input : (input && input.url);
          if (url && (!init || !init.method || init.method === 'GET')) {
            var key = null, hd = (init && init.headers) || {};
            if (url === CATS) key = 'cats';
            else if (url === RPC) {
              var m = /^(\d+)-(\d+)$/.exec(String(hd.Range || ''));
              if (m && +m[2] - +m[1] + 1 === PAGE && +m[1] % PAGE === 0 && +m[1] / PAGE < PAGES) key = 'p' + (+m[1] / PAGE);
            }
            var e = key && entries[key];
            if (e && Date.now() - e.t < TTL) {
              return e.p.then(function (text) {
                return new Response(text, { status: 200, headers: { 'Content-Type': 'application/json' } });
              }, function () { delete entries[key]; return realFetchPublic.call(window, input, init); });
            }
          }
        } catch (err) {}
        return realFetchPublic.call(window, input, init);
      };
    } catch (e) {}
  })();

  var isProductRoute = /^\/p\//i.test(path);
  if (isProductRoute) document.documentElement.classList.add('deep-open');
  var clearDeepOpen = function () { document.documentElement.classList.remove('deep-open'); };

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

      // Turn off the static product-page CSS before loading shell styles; generic rules such as
      // "main { max-width: ... }" would otherwise distort the app's own #views layout.
      Array.prototype.forEach.call(document.head.querySelectorAll('link[rel="stylesheet"],style'), function (node) {
        node.disabled = true;
      });

      // Bring over the shell's CSS and inline head styles, but retain this page's SEO metadata,
      // canonical URL, product JSON-LD, title and social preview tags.
      Array.prototype.forEach.call(doc.head.querySelectorAll('link[rel="stylesheet"],style'), function (node) {
        var clone = node.cloneNode(true);
        if (node.tagName === 'LINK') {
          var href = node.getAttribute('href');
          var existing = Array.prototype.find.call(document.head.querySelectorAll('link[rel="stylesheet"]'), function (link) { return link.getAttribute('href') === href; });
          if (existing) existing.disabled = false;
          else document.head.appendChild(clone);
        } else {
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

      window.__STM_PRODUCT_ROUTE_PATH = isProductRoute ? path : '';
      return loadScript('/mobile-shell/app.js?v=44').then(function () {
        if (isProductRoute) {
          var checkProductReady = function () {
            var page = document.getElementById('page-product');
            var toast = document.getElementById('toast');
            if ((page && page.classList.contains('open')) || (toast && toast.style.opacity === '1')) {
              clearDeepOpen();
              observer.disconnect();
              return true;
            }
            return false;
          };
          var observer = new MutationObserver(checkProductReady);
          observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
          checkProductReady();   // The fast product lookup may have completed before the script load event.
          setTimeout(function () { clearDeepOpen(); observer.disconnect(); }, 10000);
        }
        return loadScript('/analytics.js').catch(function () {});
      }).catch(function (error) {
        // Never strand a shopper on an inert shell if its app bundle cannot load.
        document.body.replaceChildren.apply(document.body, originalChildren);
        clearDeepOpen();
        throw error;
      });
    })
    .catch(function (error) {
      console.warn('Stermont full-shell route fallback:', error && error.message ? error.message : error);
    });
})();
