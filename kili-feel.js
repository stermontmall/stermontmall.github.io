/* Stermont Arcade · Kilimall-style browsing.
   - Every category shows its products straight away (no "+" accordion to tap open).
   - A sticky row of category chips: tap one and the page glides to that section.
   - Grey placeholder cards while products load, so the page never looks empty.
   Loaded by search-log.js on the homepage only. If anything here fails, the old layout still works.
   To switch this off: remove the loader at the bottom of search-log.js. */
(function () {
  'use strict';
  try {
    var D = document, mg = D.getElementById('music-gear');
    if (!mg) return;
    var root = mg.querySelector('.wrap') || mg, io = null;

    var st = D.createElement('style');
    st.textContent =
      '#music-gear .mcat:not(.stm-empty)>.mgrid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem;max-height:none!important;height:auto!important;overflow:visible!important;opacity:1!important;visibility:visible!important}' +
      '@media(min-width:640px){#music-gear .mcat:not(.stm-empty)>.mgrid,#kf-skel{grid-template-columns:repeat(3,minmax(0,1fr))}}' +
      '@media(min-width:920px){#music-gear .mcat:not(.stm-empty)>.mgrid,#kf-skel{grid-template-columns:repeat(4,minmax(0,1fr))}}' +
      '@media(min-width:1180px){#music-gear .mcat:not(.stm-empty)>.mgrid,#kf-skel{grid-template-columns:repeat(5,minmax(0,1fr))}}' +
      '#music-gear .mcat>h3::after{display:none!important}#music-gear .mcat>h3{cursor:default}' +
      '#music-gear .mcat{scroll-margin-top:calc(var(--kf-top,0px) + 58px)}' +
      '#kf-chips{position:sticky;top:var(--kf-top,0px);z-index:30;display:flex;gap:.5rem;overflow-x:auto;padding:.55rem .1rem;margin:.2rem 0 .8rem;background:var(--bg,#fff);scrollbar-width:none;-webkit-overflow-scrolling:touch}' +
      '#kf-chips::-webkit-scrollbar{display:none}' +
      '#kf-chips button{flex:none;font:inherit;font-weight:600;font-size:.9rem;color:var(--ink,#1b1230);background:var(--panel,#f6f3fd);border:1px solid var(--line,#e6e1f5);border-radius:999px;padding:.45rem .95rem;cursor:pointer;white-space:nowrap}' +
      '#kf-chips button.on{background:var(--orange,#7c3aed);border-color:var(--orange,#7c3aed);color:#fff}' +
      '#kf-skel{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem;margin:.4rem 0 1rem}' +
      '#kf-skel .s{border:1px solid var(--line,#e6e1f5);border-radius:14px;padding:.6rem;background:var(--panel,#fff)}' +
      '#kf-skel i,#kf-skel b{display:block;border-radius:10px;background:linear-gradient(90deg,#ece8f6 25%,#f7f4fd 50%,#ece8f6 75%);background-size:200% 100%;animation:kfsh 1.2s linear infinite}' +
      '#kf-skel i{aspect-ratio:1;margin-bottom:.6rem}#kf-skel b{height:.8rem;margin:.35rem 0}#kf-skel b+b{width:55%}' +
      '@keyframes kfsh{to{background-position:-200% 0}}@media(prefers-reduced-motion:reduce){#kf-skel i,#kf-skel b{animation:none}}';
    D.head.appendChild(st);

    /* grey placeholder cards until the first real product appears */
    if (!root.querySelector('.pcard')) {
      var sk = D.createElement('div'); sk.id = 'kf-skel'; sk.setAttribute('aria-hidden', 'true');
      for (var n = 0; n < 8; n++) sk.insertAdjacentHTML('beforeend', '<div class="s"><i></i><b></b><b></b></div>');
      var first = root.querySelector('.mcat'); root.insertBefore(sk, first || null);
      setTimeout(function () { var s = D.getElementById('kf-skel'); if (s) s.remove(); }, 10000);
    }

    /* the sticky chip row sits just under the site header, if the header is fixed */
    function setTop() {
      var h = D.querySelector('header'), t = 0;
      if (h) { var p = getComputedStyle(h).position; if (p === 'fixed' || p === 'sticky') t = h.getBoundingClientRect().height; }
      D.documentElement.style.setProperty('--kf-top', Math.round(t) + 'px');
    }
    setTop(); window.addEventListener('resize', setTop);

    function nameOf(m) { var h = m.querySelector('h3'); return h && h.firstChild ? h.firstChild.textContent.trim() : ''; }
    function setOn(m) {
      var bar = D.getElementById('kf-chips'); if (!bar) return;
      [].forEach.call(bar.children, function (b) {
        var on = b._m === m; b.classList.toggle('on', on);
        if (on && bar.scrollTo) bar.scrollTo({ left: Math.max(0, b.offsetLeft - 60), behavior: 'smooth' });
      });
    }
    function watch(cats) {
      if (!('IntersectionObserver' in window)) return;
      if (io) io.disconnect();
      io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) setOn(e.target); }); }, { rootMargin: '-30% 0px -65% 0px' });
      cats.forEach(function (m) { io.observe(m); });
    }
    function chips(cats) {
      if (!cats.length) return;
      var sig = cats.map(function (m) { return m.getAttribute('data-slug') || nameOf(m); }).join('|'), bar = D.getElementById('kf-chips');
      if (bar && bar._sig === sig) return;
      if (!bar) { bar = D.createElement('nav'); bar.id = 'kf-chips'; bar.setAttribute('aria-label', 'Categories'); cats[0].parentNode.insertBefore(bar, cats[0]); }
      bar._sig = sig; bar.textContent = '';
      cats.forEach(function (m) {
        var label = nameOf(m); if (!label) return;
        var b = D.createElement('button'); b.type = 'button'; b.textContent = label; b._m = m;
        b.onclick = function () { m.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
        bar.appendChild(b);
      });
      watch(cats);
    }
    function sync() {
      var cats = [].filter.call(root.querySelectorAll('.mcat'), function (m) { return !m.classList.contains('stm-empty') && m.querySelector('.pcard'); });
      if (cats.length) { var s = D.getElementById('kf-skel'); if (s) s.remove(); }
      cats.forEach(function (m) { if (!m.classList.contains('open')) m.classList.add('open'); });
      chips(cats);
    }
    var t = null;
    new MutationObserver(function () { clearTimeout(t); t = setTimeout(sync, 120); }).observe(root, { childList: true, subtree: true });
    sync();
  } catch (e) { /* never break the shop */ }
})();
