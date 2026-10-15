/* Stermont Arcade admin · type-ahead suggestions for any search box.
   STMSuggest.attach(input, source, onPick)
     source(query)  -> array of { label, sub, value }   (already filtered; best match first)
     onPick(item)   -> called when a suggestion is tapped / Enter is pressed on a highlighted one
   Plain search typing still works: the list filters as before, this only adds the dropdown. */
(function () {
  var D = document, MAX = 8, box, cur = null;

  function injectCss() {
    if (D.getElementById('sg-css')) return;
    var s = D.createElement('style'); s.id = 'sg-css';
    s.textContent =
      '#stm-sg{position:fixed;z-index:60;background:#fff;border:1px solid #d9c9fb;border-radius:12px;box-shadow:0 10px 28px rgba(42,14,92,.22);overflow:hidden;display:none;max-height:60vh;overflow-y:auto}' +
      '#stm-sg .sg-i{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid #eee8fa;background:#fff;padding:.6rem .8rem;font:inherit;cursor:pointer}' +
      '#stm-sg .sg-i:last-child{border-bottom:0}#stm-sg .sg-i.on,#stm-sg .sg-i:active{background:#f3eefc}' +
      '#stm-sg .sg-l{display:block;font-weight:700;color:#2a0e5c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '#stm-sg .sg-l mark{background:#e9ddff;color:inherit;border-radius:3px;padding:0 1px}' +
      '#stm-sg .sg-s{display:block;font-size:.78rem;color:#6b6585;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}' +
      '#stm-sg .sg-e{padding:.6rem .8rem;font-size:.85rem;color:#6b6585}';
    D.head.appendChild(s);
  }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hl(text, q) {
    var t = String(text == null ? '' : text), words = String(q).toLowerCase().split(/\s+/).filter(Boolean), low = t.toLowerCase(), marks = [];
    words.forEach(function (w) { var i = low.indexOf(w); if (i > -1) marks.push([i, i + w.length]); });
    if (!marks.length) return esc(t);
    marks.sort(function (a, b) { return a[0] - b[0]; });
    var out = '', pos = 0;
    marks.forEach(function (m) { if (m[0] < pos) return; out += esc(t.slice(pos, m[0])) + '<mark>' + esc(t.slice(m[0], m[1])) + '</mark>'; pos = m[1]; });
    return out + esc(t.slice(pos));
  }
  function ensureBox() {
    injectCss();
    if (!box || !D.body.contains(box)) { box = D.createElement('div'); box.id = 'stm-sg'; box.setAttribute('role', 'listbox'); D.body.appendChild(box); }
    return box;
  }
  function place(input) {
    var r = input.getBoundingClientRect(), b = ensureBox();
    b.style.left = Math.max(6, r.left) + 'px';
    b.style.width = Math.min(r.width, window.innerWidth - 12) + 'px';
    b.style.top = (r.bottom + 4) + 'px';
  }
  function hide() { if (box) box.style.display = 'none'; cur = null; }

  function attach(input, source, onPick) {
    var items = [], act = -1, justPicked = false;
    input.setAttribute('autocomplete', 'off'); input.setAttribute('autocorrect', 'off'); input.setAttribute('spellcheck', 'false');
    input.setAttribute('enterkeyhint', 'search');

    function draw() {
      var q = input.value.trim();
      if (!q || !D.body.contains(input)) { hide(); return; }
      var res = [];
      try { res = source(q) || []; } catch (e) { res = []; }
      items = res.slice(0, MAX); act = -1;
      var b = ensureBox(); cur = input; b.textContent = '';
      if (!items.length) { b.innerHTML = '<div class="sg-e">No suggestion for “' + esc(q) + '”. Try fewer letters.</div>'; }
      items.forEach(function (it, i) {
        var a = D.createElement('button'); a.type = 'button'; a.className = 'sg-i'; a.setAttribute('role', 'option');
        a.innerHTML = '<span class="sg-l">' + hl(it.label, q) + '</span>' + (it.sub ? '<span class="sg-s">' + esc(it.sub) + '</span>' : '');
        a.addEventListener('pointerdown', function (e) { e.preventDefault(); });   /* keep the keyboard open */
        a.addEventListener('click', function () { pick(i); });
        b.appendChild(a);
      });
      place(input); b.style.display = 'block';
    }
    function mark() {
      if (!box) return;
      Array.prototype.forEach.call(box.querySelectorAll('.sg-i'), function (n, i) { n.classList.toggle('on', i === act); if (i === act && n.scrollIntoView) n.scrollIntoView({ block: 'nearest' }); });
    }
    function pick(i) {
      var it = items[i]; if (!it) return;
      justPicked = true; hide();
      input.value = it.value != null ? it.value : it.label;
      onPick(it);
      setTimeout(function () { justPicked = false; }, 0);
    }
    input.addEventListener('input', draw);
    input.addEventListener('focus', function () { if (!justPicked && input.value.trim()) draw(); });
    input.addEventListener('blur', function () { setTimeout(function () { if (cur === input) hide(); }, 120); });
    input.addEventListener('keydown', function (e) {
      var open = box && box.style.display === 'block' && cur === input;
      if (e.key === 'ArrowDown' && open && items.length) { e.preventDefault(); act = (act + 1) % items.length; mark(); }
      else if (e.key === 'ArrowUp' && open && items.length) { e.preventDefault(); act = act <= 0 ? items.length - 1 : act - 1; mark(); }
      else if (e.key === 'Enter') { if (open && act > -1) { e.preventDefault(); pick(act); } else { hide(); input.blur(); } }
      else if (e.key === 'Escape') { hide(); }
    });
  }

  /* ranking helpers shared by every admin search */
  function words(q) { return String(q).toLowerCase().split(/\s+/).filter(Boolean); }
  function rank(label, q) {
    var l = String(label || '').toLowerCase(), w = words(q), full = w.join(' ');
    if (l.indexOf(full) === 0) return 0;
    if (w.length && l.split(/[\s\-\/(),]+/).some(function (t) { return t.indexOf(w[0]) === 0; })) return 1;
    if (l.indexOf(full) > -1) return 2;
    return 3;
  }

  window.addEventListener('scroll', function () { if (cur) { if (D.body.contains(cur)) place(cur); else hide(); } }, true);
  window.addEventListener('resize', function () { if (cur && D.body.contains(cur)) place(cur); });
  D.addEventListener('pointerdown', function (e) { if (cur && e.target !== cur && !(box && box.contains(e.target))) hide(); });

  window.STMSuggest = { attach: attach, rank: rank, words: words, hide: hide };
})();
