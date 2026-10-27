/* Stermont Office: limit tools (all free, all in your browser).
   Loaded by builder-boost.js. Adds a "Limit tools" box to Settings:
   - a usage counter per AI for today, so you can see how much of the free allowance is gone
   - a countdown to Gemini's daily reset (Google resets free limits at midnight Pacific time)
   - which AIs are ready and which are paused, and until when
   - a switch: Gemini first (best quality) or Backups first (keeps Gemini's allowance for later)
   - Lean mode: the builder keeps a shorter memory, so every request is smaller
   The numbers are counted by this browser only. They are a guide, not Google's own meter.
   If this file fails to load, the builder keeps working without it. */
(function (root) {
  'use strict';
  var D = typeof document !== 'undefined' ? document : null;
  var CFG = 'stm_limits_cfg_v1', USE = 'stm_usage_v1';
  var NAMES = { gemini: 'Gemini', mistral: 'Mistral', cerebras: 'Cerebras', openrouter: 'OpenRouter', groq: 'Groq' };

  function readJ(k, d) { try { return JSON.parse(root.localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function writeJ(k, v) { try { root.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function cfg() { var c = readJ(CFG, {}), B = window.__stmBackup; /* until the owner picks a mode, backups answer first whenever a backup key exists (faster than a slow Gemini) */ return { mode: c.mode === 'backups' || c.mode === 'gemini' ? c.mode : (B && B.has && B.has() ? 'backups' : 'gemini'), lean: !!c.lean }; }
  function setCfg(p) { var c = cfg(); Object.keys(p).forEach(function (k) { c[k] = p[k]; }); writeJ(CFG, c); }

  /* Google's free limits reset at midnight Pacific time, so "today" is counted in that time zone */
  function pacificDay(now) {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date(now)); }
    catch (e) { return new Date(now).toISOString().slice(0, 10); }
  }
  function msToReset(now) {
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour12: false, hour: 'numeric', minute: 'numeric', second: 'numeric' }).formatToParts(new Date(now));
      var g = function (t) { for (var i = 0; i < parts.length; i++) if (parts[i].type === t) return parseInt(parts[i].value, 10) || 0; return 0; };
      return (86400 - ((g('hour') % 24) * 3600 + g('minute') * 60 + g('second'))) * 1000;
    } catch (e) { return 0; }
  }
  function count(id) {
    var d = pacificDay(Date.now()), u = readJ(USE, {});
    if (u.day !== d) u = { day: d, n: {} };
    u.n = u.n || {}; u.n[id] = (u.n[id] || 0) + 1;
    writeJ(USE, u);
  }
  function usage() { var u = readJ(USE, {}); return u.day === pacificDay(Date.now()) ? (u.n || {}) : {}; }
  function clock(ts) { var d = new Date(ts), p = function (n) { return (n < 10 ? '0' : '') + n; }; return p(d.getHours()) + ':' + p(d.getMinutes()); }
  function span(ms) { var m = Math.max(0, Math.round(ms / 60000)), h = Math.floor(m / 60); return h ? h + 'h ' + (m % 60) + 'm' : m + 'm'; }

  /* the text shown in the box; kept separate so it can be tested */
  function summary(now) {
    var u = usage(), lines = [], used = Object.keys(u).sort().map(function (k) { return (NAMES[k] || k) + ' ' + u[k]; });
    lines.push('Requests today (counted by this browser): ' + (used.length ? used.join(', ') : 'none yet') + '.');
    var left = msToReset(now);
    if (left) lines.push('Gemini\'s daily limit resets in ' + span(left) + ' (about ' + clock(now + left) + ' your time).');
    var st = [], G = root.__stmGem;
    if (G) {
      var free = G.models.filter(function (m) { return !(G.cool[m] > now); }).length;
      if (free) st.push('Gemini ready');
      else { var e = Math.min.apply(null, G.models.map(function (m) { return G.cool[m] || Infinity; })); st.push('Gemini paused' + (isFinite(e) ? ' until ' + clock(e) : '')); }
    }
    if (root.__stmBackup) root.__stmBackup.status().forEach(function (s) { st.push(s.name + (s.ready ? ' ready' : ' paused' + (s.until ? ' until ' + clock(s.until) : ''))); });
    if (st.length) lines.push(st.join(' · '));
    return lines.join('\n');
  }

  function mount() {
    var s = D && D.getElementById('set'), anchor = s && (D.getElementById('bkBox') || s.querySelector('label[for="ghtoken"]'));
    if (!anchor || D.getElementById('limBox')) return;
    var c = cfg(), box = D.createElement('div'); box.id = 'limBox';
    box.innerHTML = '<label>Limit tools</label><div id="limUse" class="hint" style="white-space:pre-line"></div>' +
      '<label style="font-weight:500">Which AI answers first? <select id="limMode"><option value="gemini">Gemini first (best quality)</option><option value="backups">Backups first (keeps Gemini for later)</option></select></label>' +
      '<label style="font-weight:500"><input id="limLean" type="checkbox"> Lean mode: shorter memory, fewer tokens per request</label>' +
      '<p class="hint">"Backups first" needs at least one backup key below. Lean mode helps most with Cerebras and Groq, which only allow small requests, and it makes every Gemini request cheaper. A very long chat may forget older details sooner, so press New chat between unrelated jobs.</p>';
    anchor.parentNode.insertBefore(box, anchor);
    D.getElementById('limMode').value = c.mode; D.getElementById('limLean').checked = c.lean;
    D.getElementById('limMode').addEventListener('change', function () { setCfg({ mode: this.value }); });
    D.getElementById('limLean').addEventListener('change', function () { setCfg({ lean: this.checked }); });
    function refresh() { var el = D.getElementById('limUse'); if (el && el.offsetParent !== null) el.textContent = summary(Date.now()); }
    var bs = D.getElementById('bSet'); if (bs) bs.addEventListener('click', function () { setTimeout(refresh, 50); });
    setInterval(refresh, 5000); refresh();
  }
  if (D) { if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', function () { setTimeout(mount, 0); }); else setTimeout(mount, 0); }

  var api = {
    count: count, usage: usage, summary: summary, msToReset: msToReset, pacificDay: pacificDay,
    mode: function () { return cfg().mode; },
    lean: function () { return cfg().lean; },
    setCfg: setCfg
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.__stmLimits = api;
})(typeof window !== 'undefined' ? window : globalThis);
