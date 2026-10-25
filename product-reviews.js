/* Stermont Arcade · shows approved customer reviews on the storefront.
   Add at the end of index.html, AFTER account-panel.js:  <script src="product-reviews.js?v=1" defer></script>
   Reads only reviews you approved in admin > Customers > Reviews (public read, row security allows approved rows only).
   Adds a small star line to each product card and a reviews block to the product popup. All text is set with textContent. */
(function () {
  var D = document, SBU = 'https://oewvtbnmyombbtggamor.supabase.co', KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7';
  var by = {}, ready = false;

  function el(t, c, x) { var e = D.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function key(n) { return String(n || '').replace(/\s+/g, ' ').trim().toLowerCase(); }
  function stars(avg) { var f = Math.round(avg), s = ''; for (var i = 1; i <= 5; i++) s += i <= f ? '★' : '☆'; return s; }
  function dmy(d) { d = new Date(d); if (isNaN(d)) return ''; var p = function (n) { return (n < 10 ? '0' : '') + n; }; return p(d.getDate()) + '-' + p(d.getMonth() + 1) + '-' + d.getFullYear(); }
  function stat(list) { var t = 0; list.forEach(function (r) { t += r.rating; }); return { avg: t / list.length, n: list.length }; }

  var st = el('style'); st.textContent =
    '.rv-s{display:block;margin:.15rem 0;font-size:.82rem;color:#f6a800;font-weight:700;letter-spacing:.04em}.rv-s span{color:var(--muted,#6b6b6b);letter-spacing:0;font-weight:600;margin-left:.3rem}' +
    '.rv-box{margin:.6rem 0;padding:.7rem .8rem;background:var(--panel,#f4f1fa);border-radius:12px;text-align:left}.rv-box h4{margin:0 0 .35rem;font-size:.92rem}' +
    '.rv-it{padding:.45rem 0;border-top:1px solid var(--line,#e5e0f0);font-size:.88rem}.rv-it:first-of-type{border-top:0}.rv-it b{color:#f6a800;letter-spacing:.04em}.rv-it small{display:block;color:var(--muted,#6b6b6b)}';
  D.head.appendChild(st);

  function cardStars() {
    [].forEach.call(D.querySelectorAll('.pcard[id^="p-"]'), function (c) {
      var h3 = c.querySelector('h3'), old = c.querySelector('.rv-s'); if (old) old.remove();
      var l = h3 && by[key(h3.textContent)]; if (!l) return;
      var s = stat(l), line = el('span', 'rv-s', stars(s.avg)); line.appendChild(el('span', null, s.avg.toFixed(1) + ' (' + s.n + ')'));
      var price = c.querySelector('.price'); if (price && price.parentNode) price.parentNode.insertBefore(line, price.nextSibling);
    });
  }
  function popup() {
    var om = D.getElementById('om'), t = D.getElementById('om-t'), d = D.getElementById('om-d'); if (!om || !t || !d) return;
    var old = D.getElementById('om-rev'); if (old) old.remove();
    var l = by[key(t.textContent)]; if (!l) return;
    var s = stat(l), box = el('div', 'rv-box'); box.id = 'om-rev';
    var hd = el('h4', null, stars(s.avg) + '  ' + s.avg.toFixed(1) + ' · ' + s.n + (s.n === 1 ? ' review' : ' reviews')); box.appendChild(hd);
    l.slice(0, 3).forEach(function (r) {
      var it = el('div', 'rv-it'); it.appendChild(el('b', null, stars(r.rating)));
      if (r.body) it.appendChild(el('div', null, r.body));
      it.appendChild(el('small', null, (r.reviewer || 'Verified buyer') + ' · ' + dmy(r.created_at))); box.appendChild(it);
    });
    d.parentNode.insertBefore(box, d.nextSibling);
  }


  /* "What our customers say": approved ratings of our service, shown on the home page above the FAQ */
  function serviceSection() {
    var l = by['our service']; if (!l || !l.length || D.getElementById('svc-rev')) return;
    var anchor = D.getElementById('faq') || D.querySelector('footer'); if (!anchor || !anchor.parentNode) return;
    var s = stat(l), sec = el('section'); sec.id = 'svc-rev';
    var st2 = el('style'); st2.textContent = '#svc-rev{max-width:980px;margin:1.6rem auto;padding:0 1rem}#svc-rev h2{margin:0 0 .3rem}#svc-rev .sv-top{display:flex;align-items:center;gap:.7rem;flex-wrap:wrap;margin-bottom:.8rem}#svc-rev .sv-big{font-size:2rem;font-weight:800}#svc-rev .sv-st{color:#f6a800;font-size:1.4rem;letter-spacing:.06em}#svc-rev .sv-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:.7rem}#svc-rev .sv-c{background:var(--panel,#f4f1fa);border-radius:12px;padding:.8rem .9rem;font-size:.92rem}#svc-rev .sv-c b{color:#f6a800;letter-spacing:.05em}#svc-rev .sv-c small{display:block;color:var(--muted,#6b6b6b);margin-top:.3rem}';
    sec.appendChild(st2); sec.appendChild(el('h2', null, 'What our customers say'));
    var top = el('div', 'sv-top'); top.appendChild(el('span', 'sv-big', s.avg.toFixed(1))); top.appendChild(el('span', 'sv-st', stars(s.avg)));
    top.appendChild(el('span', null, 'from ' + s.n + (s.n === 1 ? ' customer rating' : ' customer ratings') + ' of our service')); sec.appendChild(top);
    var g = el('div', 'sv-g');
    l.slice(0, 6).forEach(function (r) {
      var c = el('div', 'sv-c'); c.appendChild(el('b', null, stars(r.rating)));
      c.appendChild(el('div', null, r.body || 'Great service!')); c.appendChild(el('small', null, (r.reviewer || 'Verified buyer') + ' \u00b7 ' + dmy(r.created_at))); g.appendChild(c);
    });
    sec.appendChild(g); anchor.parentNode.insertBefore(sec, anchor);
  }

  fetch(SBU + '/rest/v1/reviews?select=product_name,rating,body,reviewer,created_at&status=eq.approved&order=created_at.desc&limit=1000', { headers: { apikey: KEY } })
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (rows) {
      (rows || []).forEach(function (r) { var k = key(r.product_name), n = Number(r.rating); if (!k || !(n >= 1 && n <= 5)) return; r.rating = n; (by[k] = by[k] || []).push(r); });
      ready = true; cardStars(); popup(); serviceSection();
    }).catch(function () {});

  /* refresh the popup block whenever a product is opened */
  var t = D.getElementById('om-t');
  if (t && window.MutationObserver) new MutationObserver(function () { if (ready) popup(); }).observe(t, { childList: true, characterData: true, subtree: true });
})();
