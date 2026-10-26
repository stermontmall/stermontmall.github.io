/* Stermont Arcade · Posted adverts.
   Reads adverts.json (written by advert-poster.html) and shows each advert as a slide at the top of the home page.
   Loaded from index.html right after advert-banner.js. */
(function () {
  var D = document, WA = '254748888230', MAX = 5;
  var CSS = '.slide.adx{color:#fff;padding:0;min-height:230px;flex-direction:row;align-items:stretch;justify-content:flex-start;border:2px solid rgba(200,243,29,.55);box-shadow:0 8px 24px rgba(91,33,182,.35);cursor:pointer;text-align:left}' +
    '.slide.adx .adx-t{flex:1 1 54%;min-width:0;padding:1.1rem 0 1.1rem 1.1rem;display:flex;flex-direction:column;justify-content:center;gap:.35rem}' +
    '.slide.adx .adx-b{align-self:flex-start;background:#c8f31d;color:#1a2e05;font-size:.7rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase;border-radius:999px;padding:.25rem .65rem}' +
    '.slide.adx h2{font-size:1.15rem;line-height:1.2;margin:.1rem 0;max-width:none;font-weight:800;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}' +
    '.slide.adx .adx-s{font-size:.85rem;opacity:.9;font-weight:600}' +
    '.slide.adx .adx-p{font-size:1.55rem;font-weight:900;color:#c8f31d;line-height:1.1}.slide.adx .adx-o{font-size:.85rem;font-weight:600;color:#fff;opacity:.8;margin-left:.45rem}' +
    '.slide.adx .adx-btn{align-self:flex-start;border:0;border-radius:999px;font:inherit;font-weight:800;font-size:.82rem;padding:.55rem .95rem;cursor:pointer;background:#c8f31d;color:#1a2e05;margin-top:.3rem}' +
    '.slide.adx .adx-i{flex:0 0 46%;background:#fff;border-radius:60px 0 0 60px;display:grid;place-items:center;overflow:hidden}' +
    '.slide.adx .adx-i img{position:static;width:100%;height:100%;object-fit:contain;padding:.6rem;border-radius:0}' +
    '.slide.adx::after{display:none}';
  function mk(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function money(n) { return 'KSh ' + Math.round(Number(n) || 0).toLocaleString('en-KE'); }
  function card(a, i) {
    var s = mk('div', 'slide adx'), t = mk('div', 'adx-t'), im = mk('div', 'adx-i');
    s.style.background = ['linear-gradient(135deg,#7c3aed,#3b0f8c 70%)', 'linear-gradient(135deg,#1d0745,#5b21b6 75%)'][(i || 0) % 2];
    s.setAttribute('data-adx', a.id || '');
    if (a.badge) t.appendChild(mk('span', 'adx-b', a.badge));
    t.appendChild(mk('h2', '', a.headline));
    if (a.text) t.appendChild(mk('div', 'adx-s', a.text));
    if (+a.price > 0) { var p = mk('div', 'adx-p', money(a.price)); if (+a.old_price > +a.price) p.appendChild(mk('s', 'adx-o', money(a.old_price))); t.appendChild(p); }
    var b = mk('button', 'adx-btn', a.cta || 'Order on WhatsApp'); b.type = 'button';
    function go() { window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent('Hello Stermont Arcade, I would like to order: ' + a.headline), '_blank', 'noopener'); }
    b.onclick = function (e) { e.stopPropagation(); go(); }; s.onclick = go; t.appendChild(b);
    if (a.image) { var g = new Image(); g.src = a.image; g.alt = a.headline; im.appendChild(g); } else im.appendChild(mk('span', '', '\uD83D\uDCE6'));
    s.appendChild(t); s.appendChild(im); return s;
  }
  if (window.STM_ADS_NORUN) { window.STMAds = { css: CSS, card: card }; return; }
  var sl = D.getElementById('slides'), dots = D.getElementById('dots'); if (!sl) return;
  fetch('adverts.json?v=' + Date.now()).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
    var list = ((j && j.adverts) || []).filter(function (a) { return a && a.headline && a.active !== false; }).slice(0, MAX);
    if (!list.length) return;
    var st = mk('style'); st.textContent = CSS; D.head.appendChild(st);
    var first = sl.firstChild;
    list.forEach(function (a, i) { if (!sl.querySelector('[data-adx="' + a.id + '"]')) sl.insertBefore(card(a, i), first); });
    sl.scrollLeft = 0;
    if (dots) while (dots.children.length < sl.children.length) {
      (function (k) { var d = D.createElement('i'); d.onclick = function () { var el = sl.children[k]; if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }); }; dots.appendChild(d); })(dots.children.length);
    }
  }).catch(function () {});
})();
