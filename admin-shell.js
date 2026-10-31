/* Stermont Arcade admin - mobile shell look.
   On a phone it replaces the purple header and the scrolling pill menu with the shop shell's pattern: a white top bar (logo, section title,
   refresh, sign out), a chip row with the tabs of the current section, a bottom nav (Orders, Services, Store, Finance, More) and a
   "More" sheet that lists every section. It only wraps the existing admin: every tap clicks the real menu button, so no admin logic changes.
   Desktop screens (min-width 900px with a mouse) keep the side menu. Loaded from admin-suggest.js (admin.html is large).
   To undo: delete the loader block at the end of admin-suggest.js. */
(function () {
  try {
    if (window.__stmAdminShell) return; window.__stmAdminShell = 1;
    if (window.matchMedia && matchMedia('(min-width:900px) and (pointer:fine)').matches) return;
    var D = document, P = '#7c3aed', LINE = '#e6e2f2', pending = false;
    var css =
      'body.adm-shell{padding-bottom:0}' +
      'body.adm-shell.adm-in{padding-bottom:calc(64px + env(safe-area-inset-bottom,0px))}' +
      'body.adm-shell>header,body.adm-shell nav#nav,body.adm-shell .ptop h2{display:none!important}' +
      'body.adm-shell .ptop{margin:0 0 .6rem}' +
      'body.adm-shell main{padding:.7rem .75rem 1rem}' +
      '#adm-bar{position:sticky;top:0;z-index:7;display:flex;align-items:center;gap:8px;height:52px;padding:env(safe-area-inset-top,0px) 10px 0;box-sizing:content-box;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.08);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
      '#adm-bar .adm-logo{width:34px;height:34px;border-radius:10px;background:' + P + ';color:#fff;font-weight:800;display:grid;place-items:center;flex:none}' +
      '#adm-bar .adm-t{flex:1;min-width:0;font-weight:700;font-size:1rem;color:#1c1830;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '#adm-bar button{position:relative;display:grid;place-items:center;width:40px;height:40px;border:0;border-radius:50%;background:none;color:#1f2937;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
      '#adm-bar button:active{background:#f3eefc}' +
      'body:not(.adm-in) #adm-bar button{display:none}' +
      '#adm-chips{position:sticky;top:calc(52px + env(safe-area-inset-top,0px));z-index:6;display:none;gap:6px;overflow-x:auto;padding:8px 10px;background:#f6f4fb;border-bottom:1px solid ' + LINE + ';scrollbar-width:none;margin:-.7rem -.75rem .7rem}' +
      '#adm-chips::-webkit-scrollbar{display:none}' +
      'body.adm-in #adm-chips.has{display:flex}' +
      '#adm-chips button{flex:none;display:inline-flex;align-items:center;gap:6px;border:1px solid ' + LINE + ';background:#fff;border-radius:999px;padding:6px 12px;font:600 13px system-ui,sans-serif;color:#1c1830;white-space:nowrap;cursor:pointer}' +
      '#adm-chips button.on{background:' + P + ';border-color:' + P + ';color:#fff}' +
      '.adm-c{min-width:18px;padding:0 5px;border-radius:999px;background:#eceaf5;color:#5b21b6;font:700 11px/18px system-ui,sans-serif;text-align:center}' +
      '.adm-c.hot{background:#f59e0b;color:#fff}' +
      '#adm-chips .on .adm-c{background:rgba(255,255,255,.28);color:#fff}' +
      '#adm-nav{position:fixed;left:0;right:0;bottom:0;z-index:8;display:none;background:#fff;border-top:1px solid ' + LINE + ';padding-bottom:env(safe-area-inset-bottom,0px);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
      'body.adm-in #adm-nav{display:flex}' +
      '#adm-nav button{position:relative;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;height:56px;border:0;background:none;color:#6b6785;font-size:11px;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
      '#adm-nav button.on{color:' + P + ';font-weight:700}' +
      '#adm-nav .adm-b{position:absolute;top:5px;left:55%;min-width:16px;height:16px;padding:0 4px;box-sizing:border-box;border-radius:999px;background:#e11d48;color:#fff;font:700 10px/16px system-ui,sans-serif;text-align:center}' +
      '#adm-sheet{position:fixed;inset:0;z-index:9;display:none;background:rgba(20,15,40,.55);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
      '#adm-sheet.open{display:block}' +
      '#adm-sheet .adm-p{position:absolute;left:0;right:0;bottom:0;max-height:82vh;overflow-y:auto;background:#fff;border-radius:18px 18px 0 0;padding:10px 14px calc(16px + env(safe-area-inset-bottom,0px))}' +
      '#adm-sheet .adm-h{width:40px;height:4px;border-radius:2px;background:#d9d4ea;margin:0 auto 10px}' +
      '#adm-sheet .adm-g{font:800 11px system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#6b6785;margin:12px 4px 4px}' +
      '#adm-sheet .adm-r{display:flex;align-items:center;gap:12px;width:100%;border:0;background:none;text-align:left;padding:11px 8px;border-radius:12px;font:15px system-ui,sans-serif;color:#1c1830;cursor:pointer}' +
      '#adm-sheet .adm-r:active{background:#f3eefc}' +
      '#adm-sheet .adm-r.on{background:#ede9fe;color:#5b21b6;font-weight:700}' +
      '#adm-sheet .adm-i{width:26px;text-align:center;font-size:1.15rem}' +
      '#adm-sheet .adm-l{flex:1}' +
      '#adm-sheet .adm-s{border-top:1px solid ' + LINE + ';margin-top:10px;padding-top:6px}';
    var st = D.createElement('style'); st.textContent = css; D.head.appendChild(st);

    var ic = function (d) { return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
    var BN = [
      ['Orders', 'Orders', ic('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM8.5 12h7M8.5 16h5"/>')],
      ['Services', 'Services', ic('<path d="M14.5 6.5a4 4 0 005 5L10 21l-3-3 9.5-9.5zM14.5 6.5L17 4"/>')],
      ['Store', 'Store', ic('<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 016 0v2"/>')],
      ['Finance', 'Finance', ic('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>')]
    ];
    var MORE = ic('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>');
    var $ = function (id) { return D.getElementById(id); };
    var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

    function groups() {
      var out = [];
      each(D.querySelectorAll('#navg .ng'), function (g) {
        var l = g.querySelector('.ngl');
        out.push({ name: l ? l.textContent.trim() : '', items: Array.prototype.slice.call(g.querySelectorAll('.ni')) });
      });
      return out;
    }
    function lab(b) { var l = b.querySelector('.lb'); return (l ? l.textContent : b.textContent).trim(); }
    function emo(b) { var i = b.querySelector('.ic'); return i ? i.textContent : ''; }
    function cn(b) { var c = b.querySelector('.cnt'); return c ? { t: c.textContent, hot: c.classList.contains('hot') } : null; }
    function isOn(b) { return b.classList.contains('on'); }
    function curGroup(gs) { for (var i = 0; i < gs.length; i++) if (gs[i].items.some(isOn)) return gs[i]; return null; }
    function hotOf(g) { for (var i = 0; i < g.items.length; i++) { var c = cn(g.items[i]); if (c && c.hot && +c.t > 0) return c.t; } return ''; }

    var bar = D.createElement('div'); bar.id = 'adm-bar';
    bar.innerHTML = '<span class="adm-logo">S</span><span class="adm-t" id="adm-title">Admin console</span>' +
      '<button type="button" id="adm-rf" aria-label="Refresh">' + ic('<path d="M20 12a8 8 0 11-2.5-5.8M20 4v5h-5"/>') + '</button>' +
      '<button type="button" id="adm-out" aria-label="Sign out">' + ic('<path d="M10 4H6a1 1 0 00-1 1v14a1 1 0 001 1h4M15 8l4 4-4 4M19 12H9"/>') + '</button>';
    var chips = D.createElement('div'); chips.id = 'adm-chips'; chips.setAttribute('role', 'tablist');
    var nav = D.createElement('nav'); nav.id = 'adm-nav'; nav.setAttribute('aria-label', 'Admin');
    var sheet = D.createElement('div'); sheet.id = 'adm-sheet';

    function closeSheet() { sheet.classList.remove('open'); }
    function openSheet() {
      var gs = groups(), h = '<div class="adm-p" role="dialog" aria-label="All sections"><div class="adm-h"></div>';
      gs.forEach(function (g, gi) {
        h += '<div class="adm-g">' + g.name + '</div>';
        g.items.forEach(function (b, bi) {
          var c = cn(b);
          h += '<button type="button" class="adm-r' + (isOn(b) ? ' on' : '') + '" data-g="' + gi + '" data-b="' + bi + '"><span class="adm-i">' + emo(b) + '</span><span class="adm-l">' + lab(b) + '</span>' +
            (c ? '<span class="adm-c' + (c.hot ? ' hot' : '') + '">' + c.t + '</span>' : '') + '</button>';
        });
      });
      h += '<div class="adm-s"><button type="button" class="adm-r" data-x="sig"><span class="adm-i">\u270D\uFE0F</span><span class="adm-l">My signature</span></button>' +
        '<button type="button" class="adm-r" data-x="out"><span class="adm-i">\u21AA\uFE0F</span><span class="adm-l">Sign out</span></button></div></div>';
      sheet.innerHTML = h; sheet.classList.add('open');
    }
    sheet.addEventListener('click', function (e) {
      if (e.target === sheet) { closeSheet(); return; }
      var r = e.target.closest ? e.target.closest('.adm-r') : null; if (!r) return;
      closeSheet();
      if (r.dataset.x === 'sig') { var s = $('sg-open'); if (s) s.click(); return; }
      if (r.dataset.x === 'out') { var o = $('out'); if (o) o.click(); return; }
      var gs = groups(), g = gs[+r.dataset.g], b = g && g.items[+r.dataset.b];
      if (b) b.click();
    });
    D.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });

    function sync() {
      pending = false;
      var app = $('app'), inApp = !!app && !app.hidden;
      D.body.classList.toggle('adm-in', inApp);
      var t = $('ptitle'), at = $('adm-title');
      at.textContent = inApp && t && t.textContent.trim() ? t.textContent.trim() : (inApp ? 'Admin console' : 'Stermont Arcade admin');
      if (!inApp) { chips.className = ''; chips.textContent = ''; return; }
      var gs = groups(), cg = curGroup(gs);
      chips.textContent = '';
      if (cg && cg.items.length > 1) {
        chips.className = 'has';
        cg.items.forEach(function (b) {
          var c = cn(b), x = D.createElement('button'); x.type = 'button'; x.className = isOn(b) ? 'on' : ''; x.setAttribute('role', 'tab');
          x.innerHTML = '<span>' + lab(b) + '</span>' + (c ? '<span class="adm-c' + (c.hot ? ' hot' : '') + '">' + c.t + '</span>' : '');
          x.onclick = function () { b.click(); };
          chips.appendChild(x);
        });
        var on = chips.querySelector('.on'); if (on && on.scrollIntoView) { try { on.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) {} }
      } else chips.className = '';
      nav.textContent = '';
      BN.forEach(function (n) {
        var g = null; gs.forEach(function (x) { if (x.name === n[0]) g = x; });
        if (!g) return;
        var b = D.createElement('button'); b.type = 'button'; b.className = cg && cg.name === n[0] ? 'on' : '';
        b.innerHTML = n[2] + n[1]; var hot = hotOf(g); if (hot) b.innerHTML += '<span class="adm-b">' + hot + '</span>';
        b.onclick = function () { if (b.className === 'on') { window.scrollTo(0, 0); return; } if (g.items[0]) g.items[0].click(); };
        nav.appendChild(b);
      });
      var more = D.createElement('button'); more.type = 'button';
      more.className = cg && !BN.some(function (n) { return n[0] === cg.name; }) ? 'on' : '';
      more.innerHTML = MORE + 'More'; more.onclick = openSheet; nav.appendChild(more);
    }
    function later() { if (!pending) { pending = true; (window.requestAnimationFrame || setTimeout)(sync); } }

    function go() {
      var main = D.querySelector('main'), content = D.querySelector('.content');
      D.body.classList.add('adm-shell');
      D.body.insertBefore(bar, D.body.firstChild);
      if (content) content.insertBefore(chips, content.firstChild); else if (main) main.insertBefore(chips, main.firstChild);
      D.body.appendChild(nav); D.body.appendChild(sheet);
      $('adm-rf').onclick = function () { var r = $('refresh'); if (r) r.click(); };
      $('adm-out').onclick = function () { var o = $('out'); if (o) o.click(); };
      if (window.MutationObserver) {
        var mo = new MutationObserver(later);
        var ng = $('navg'); if (ng) mo.observe(ng, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'], characterData: true });
        var pt = $('ptitle'); if (pt) mo.observe(pt, { childList: true, characterData: true, subtree: true });
        var ap = $('app'); if (ap) mo.observe(ap, { attributes: true, attributeFilter: ['hidden'] });
      }
      sync();
    }
    if (D.body && D.getElementById('app')) go(); else D.addEventListener('DOMContentLoaded', go);
  } catch (e) {}
})();
