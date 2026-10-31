/* Stermont Arcade - mobile shell look for the static pages (account, track, shipping, returns, contact, faq, about, privacy, terms).
   On a phone it adds the shell's top bar (back, search, cart) and the bottom nav (Home, Categories, Deals, Cart, Account) around the page, and hides the
   page's own desktop header. The page text is not changed (crawlers and desktop screens see the page as before). The nav links open the shell
   (/?tab=...), and the search opens the shell's search (/?q=...). The cart badge reads the shell cart (localStorage "shell.cart").
   Load with: <script src="/shell-chrome.js?v=1" defer></script>. To undo: remove that line from the page. */
(function () {
  try {
    if (window.__stmChrome) return; window.__stmChrome = 1;
    if (window.matchMedia && matchMedia('(min-width:900px) and (pointer:fine)').matches) return;   // desktop keeps the full page
    var P = '#7c3aed', LINE = '#e5e7eb';
    var css = 'body.stm-chrome{padding-bottom:calc(64px + env(safe-area-inset-bottom,0px))}' +
      'body.stm-chrome>header{display:none}' +
      '#stm-bar{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:4px;height:52px;padding:env(safe-area-inset-top,0px) 8px 0;box-sizing:content-box;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.08);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
      '#stm-bar a,#stm-bar button{position:relative;display:grid;place-items:center;width:40px;height:40px;border:0;border-radius:50%;background:none;color:#1f2937;cursor:pointer;text-decoration:none;-webkit-tap-highlight-color:transparent}' +
      '#stm-bar form{position:relative;flex:1;margin:0}' +
      '#stm-bar input{width:100%;height:36px;box-sizing:border-box;padding:0 12px 0 34px;border:0;border-radius:999px;background:#f3f4f6;font:14px system-ui,sans-serif;color:#1f2937;outline:none}' +
      '#stm-bar input:focus{box-shadow:0 0 0 2px rgba(124,58,237,.35)}' +
      '#stm-bar form svg{position:absolute;left:11px;top:50%;margin-top:-8px;width:16px;height:16px;color:#6b7280;pointer-events:none}' +
      '.stm-badge{position:absolute;top:1px;right:1px;min-width:16px;height:16px;padding:0 4px;box-sizing:border-box;border-radius:999px;background:#e11d48;color:#fff;font:600 10px/16px system-ui,sans-serif;text-align:center}' +
      '#stm-nav{position:fixed;left:0;right:0;bottom:0;z-index:50;display:flex;background:#fff;border-top:1px solid ' + LINE + ';padding-bottom:env(safe-area-inset-bottom,0px);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
      '#stm-nav a{position:relative;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;height:56px;color:#6b7280;font-size:11px;text-decoration:none;-webkit-tap-highlight-color:transparent}' +
      '#stm-nav a[aria-current="page"]{color:' + P + ';font-weight:600}' +
      '#stm-nav .stm-badge{top:5px;right:auto;left:55%}' +
      'body.stm-chrome #wa-float{bottom:calc(72px + env(safe-area-inset-bottom,0px))!important}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var ic = function (d) { return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
    var I = {
      back: ic('<path d="M15 5l-7 7 7 7"/>'),
      cart: ic('<path d="M3 4h2.5l2.2 10.5h9.6L19.5 8H6.2"/><circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>'),
      user: ic('<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20c1-4 4-5.5 7.5-5.5s6.5 1.5 7.5 5.5"/>'),
      home: ic('<path d="M4 11l8-6.5 8 6.5v8.5a1 1 0 01-1 1h-4.5v-6h-5v6H5a1 1 0 01-1-1z"/>'),
      grid: ic('<rect x="4" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2"/>'),
      bolt: ic('<path d="M13 3L5.5 13.5H11L10 21l7.5-10.5H12z"/>')
    };
    var count = 0;
    try { (JSON.parse(localStorage.getItem('shell.cart')) || []).forEach(function (i) { count += Number(i.qty) || 0; }); } catch (e) {}
    var badge = count > 0 ? '<span class="stm-badge">' + (count > 99 ? '99+' : count) + '</span>' : '';
    var bar = document.createElement('div'); bar.id = 'stm-bar';
    bar.innerHTML = '<a href="/" id="stm-back" aria-label="Back">' + I.back + '</a>' +
      '<form action="/" method="get" role="search"><input name="q" type="search" enterkeyhint="search" autocomplete="off" placeholder="Search pest control, agrovet, phones..." aria-label="Search the shop">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg></form>' +
      '<a href="/?tab=cart" aria-label="Cart">' + I.cart + badge + '</a>';
    var nav = document.createElement('nav'); nav.id = 'stm-nav'; nav.setAttribute('aria-label', 'Main');
    nav.innerHTML = '<a href="/">' + I.home + 'Home</a><a href="/?tab=categories">' + I.grid + 'Categories</a><a href="/?tab=deals">' + I.bolt + 'Deals</a>' +
      '<a href="/?tab=cart">' + I.cart + 'Cart' + badge + '</a><a href="/account.html" aria-current="page">' + I.user + 'Account</a>';   // these pages are reached from the shell's Account tab
    var go = function () {
      document.body.classList.add('stm-chrome');
      document.body.insertBefore(bar, document.body.firstChild); document.body.appendChild(nav);
      document.getElementById('stm-back').addEventListener('click', function (e) {
        var same = document.referrer && document.referrer.indexOf(location.origin) === 0;
        if (same && history.length > 1) { e.preventDefault(); history.back(); }
      });
    };
    if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
  } catch (e) {}
})();
