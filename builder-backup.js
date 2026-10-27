/* Stermont Office: backup AI providers.
   Loaded by builder-boost.js. When every Gemini model has hit its free limit, the builder's request is
   sent to another provider instead (Mistral, Cerebras, OpenRouter, Groq). Each provider has its own separate
   free limit, so this adds real extra room. The reply is converted back into the format the builder
   already understands, so nothing else in the builder needs to change.
   Only providers whose key you add in Settings are ever used. Keys stay in this browser.
   Photos: Mistral Small can read attached photos (up to 8 per request); the other backups cannot.
   A provider that does not answer within 15 seconds is skipped so the next one gets a turn.
   If this file fails to load, the builder keeps working without it. */
(function (root) {
  'use strict';
  var D = typeof document !== 'undefined' ? document : null;
  var STORE = 'stm_backup_keys_v1';
  var WAIT = 15000, MAXIMG = 8;
  /* tried in this order. Mistral's free plan has the biggest allowance (about 500K tokens a minute, 1 billion a month, 1 request a second).
     Groq's free plan only allows small requests (about 8K tokens a minute), so it goes last.
     visionModels: models that can read attached photos. */
  var PROV = [
    { id: 'mistral', name: 'Mistral', url: 'https://api.mistral.ai/v1/chat/completions', models: ['mistral-small-latest', 'open-mistral-nemo'], vision: false, visionModels: ['mistral-small-latest'] },
    { id: 'cerebras', name: 'Cerebras', url: 'https://api.cerebras.ai/v1/chat/completions', models: ['gpt-oss-120b', 'qwen-3.8-27b'], vision: false },
    { id: 'openrouter', name: 'OpenRouter', url: 'https://openrouter.ai/api/v1/chat/completions', models: ['openrouter/free'], vision: false },
    { id: 'groq', name: 'Groq', url: 'https://api.groq.com/openai/v1/chat/completions', models: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'], vision: false }
  ];
  var cool = {}, mem = null, lastError = '';

  /* ---------- keys ---------- */
  function getKeys() {
    if (mem) return mem;
    var s = null;
    try { s = root.localStorage.getItem(STORE); } catch (e) {}
    if (!s) { try { s = root.sessionStorage.getItem(STORE); } catch (e) {} }
    try { return JSON.parse(s) || {}; } catch (e) { return {}; }
  }
  function saveKeys(o) {
    var rem = D && D.getElementById('remember'), local = !rem || rem.checked, s = JSON.stringify(o);
    try { root.localStorage.removeItem(STORE); } catch (e) {}
    try { root.sessionStorage.removeItem(STORE); } catch (e) {}
    try { (local ? root.localStorage : root.sessionStorage).setItem(STORE, s); } catch (e) {}
  }
  function has() {
    var k = getKeys();
    return PROV.some(function (p) { return !!k[p.id]; });
  }

  /* ---------- request: Gemini format -> OpenAI-style chat ---------- */
  function lower(o) {
    if (Array.isArray(o)) return o.map(lower);
    if (o && typeof o === 'object') {
      var r = {};
      Object.keys(o).forEach(function (k) { r[k] = (k === 'type' && typeof o[k] === 'string') ? o[k].toLowerCase() : lower(o[k]); });
      return r;
    }
    return o;
  }
  /* does this request carry any attached photo? */
  function hasImage(j) {
    return (j.contents || []).some(function (c) {
      return (c.parts || []).some(function (p) { return p.inlineData && /^image\//.test(p.inlineData.mimeType || ''); });
    });
  }
  /* tool call ids: exactly 9 letters or digits, which every provider accepts (Mistral insists on it) */
  function cid(n) { return 'c' + String(100000000 + n).slice(1); }
  function toOA(j, vision) {
    var msgs = [], pending = [], n = 0, imgs = 0;
    var sys = j.systemInstruction && j.systemInstruction.parts ? j.systemInstruction.parts.map(function (p) { return p.text || ''; }).join('\n') : '';
    if (sys) msgs.push({ role: 'system', content: sys });
    (j.contents || []).forEach(function (c) {
      var parts = c.parts || [];
      if (c.role === 'model') {
        var text = '', calls = [];
        parts.forEach(function (p) {
          if (p.thought) return;
          if (p.functionCall) {
            var id = cid(++n);
            pending.push({ name: p.functionCall.name, id: id });
            calls.push({ id: id, type: 'function', function: { name: p.functionCall.name, arguments: JSON.stringify(p.functionCall.args || {}) } });
          } else if (typeof p.text === 'string') text += p.text;
        });
        if (calls.length) msgs.push({ role: 'assistant', content: text || null, tool_calls: calls });
        else if (text) msgs.push({ role: 'assistant', content: text });
      } else {
        var tools = [], content = [];
        parts.forEach(function (p) {
          if (p.functionResponse) {
            var k = -1;
            pending.forEach(function (x, i) { if (k < 0 && x.name === p.functionResponse.name) k = i; });
            var out = JSON.stringify(p.functionResponse.response === undefined ? {} : p.functionResponse.response);
            if (k >= 0) tools.push({ role: 'tool', tool_call_id: pending.splice(k, 1)[0].id, content: out });
            else content.push({ type: 'text', text: '[result of ' + p.functionResponse.name + '] ' + out });
          } else if (typeof p.text === 'string') {
            content.push({ type: 'text', text: p.text });
          } else if (p.inlineData) {
            var mt = p.inlineData.mimeType || 'file';
            if (vision && /^image\//.test(mt) && imgs < MAXIMG) { imgs++; content.push({ type: 'image_url', image_url: { url: 'data:' + mt + ';base64,' + p.inlineData.data } }); }
            else if (vision && /^image\//.test(mt)) content.push({ type: 'text', text: '[An extra photo was left out: this backup model can only read ' + MAXIMG + ' photos at once.]' });
            else content.push({ type: 'text', text: '[An attached ' + mt + ' file was here. This backup model cannot see it.]' });
          }
        });
        tools.forEach(function (t) { msgs.push(t); });
        if (content.length) msgs.push({ role: 'user', content: content.every(function (x) { return x.type === 'text'; }) ? content.map(function (x) { return x.text; }).join('\n') : content });
      }
    });
    var decls = [];
    (j.tools || []).forEach(function (t) { (t.functionDeclarations || []).forEach(function (d) { decls.push(d); }); });
    var tools2 = decls.map(function (d) {
      return { type: 'function', function: { name: d.name, description: d.description || '', parameters: d.parameters ? lower(d.parameters) : { type: 'object', properties: {} } } };
    });
    return { messages: msgs, tools: tools2 };
  }

  /* ---------- reply: OpenAI-style stream -> Gemini stream ---------- */
  function toGem(resp) {
    var rd = resp.body.getReader(), dec = new TextDecoder(), enc = new TextEncoder(), buf = '', calls = [], last = -1, reason = '', done = false;
    function chunk(parts, fin) {
      var c = { content: { role: 'model', parts: parts } };
      if (fin) c.finishReason = fin;
      return enc.encode('data: ' + JSON.stringify({ candidates: [c] }) + '\r\n\r\n');
    }
    function finish(ctl) {
      if (done) return; done = true;
      var parts = calls.filter(function (c) { return c && c.name; }).map(function (c) {
        var a = {};
        try { a = c.args ? JSON.parse(c.args) : {}; } catch (e) { a = {}; }
        /* Gemini 3 insists every earlier tool call carries a signature when a chat later returns to it; this value is its documented skip marker */
        return { functionCall: { name: c.name.replace(/^functions\./, ''), args: a }, thoughtSignature: 'skip_thought_signature_validator' };
      });
      var fin = reason === 'length' ? 'MAX_TOKENS' : 'STOP';
      ctl.enqueue(chunk(parts, fin));
    }
    function line(s, ctl) {
      s = s.trim();
      if (s.indexOf('data:') !== 0) return;
      s = s.slice(5).trim();
      if (!s) return;
      if (s === '[DONE]') { finish(ctl); return; }
      var j; try { j = JSON.parse(s); } catch (e) { return; }
      var ch = j.choices && j.choices[0]; if (!ch) return;
      var d = ch.delta || {};
      if (typeof d.content === 'string' && d.content) ctl.enqueue(chunk([{ text: d.content }]));
      (d.tool_calls || []).forEach(function (tc) {
        var i = tc.index;
        if (i == null) i = tc.id ? calls.length : Math.max(last, 0);
        last = i;
        var c = calls[i] || (calls[i] = { name: '', args: '' }), f = tc.function || {};
        if (f.name) c.name = c.name ? (c.name === f.name ? c.name : c.name + f.name) : f.name;
        if (f.arguments != null) c.args += typeof f.arguments === 'string' ? f.arguments : JSON.stringify(f.arguments);
      });
      if (ch.finish_reason) reason = ch.finish_reason;
    }
    return new ReadableStream({
      start: function (ctl) {
        (function pump() {
          return rd.read().then(function (x) {
            if (x.done) { buf.split('\n').forEach(function (l) { line(l, ctl); }); finish(ctl); ctl.close(); return; }
            buf += dec.decode(x.value, { stream: true });
            var i; while ((i = buf.indexOf('\n')) >= 0) { line(buf.slice(0, i), ctl); buf = buf.slice(i + 1); }
            return pump();
          });
        })().catch(function (e) { try { ctl.error(e); } catch (e2) {} });
      },
      cancel: function () { try { rd.cancel(); } catch (e) {} }
    });
  }

  /* ---------- trying the providers ---------- */
  function retrySecs(h) { var v = h && h.get && (h.get('retry-after') || h.get('x-ratelimit-reset-requests')); var n = parseFloat(v); return isFinite(n) ? n : 0; }
  /* mk is the model name, with "|v" added when the photo-reading version of it was tried */
  function fail(p, mk, st, txt, h) {
    var ms, msg = String(txt || ''); try { msg = JSON.parse(txt).error.message || msg; } catch (e) {}
    var photo = /\|v$/.test(mk);
    if (st === 429) { ms = Math.max(retrySecs(h) * 1000, /per day|daily|\bTPD\b|\bRPD\b/i.test(msg) ? 3600000 : 60000); cool[p.id + '|' + mk] = Date.now() + ms; }
    else if (st === 413) cool[p.id + '|' + mk] = Date.now() + 300000;
    else if (st === 401 || st === 403) cool[p.id] = Date.now() + 6 * 3600000;
    else if (st === 404 || st === 402 || (st === 400 && /model/i.test(msg) && /not found|does not exist|unsupported|invalid|not available/i.test(msg))) cool[p.id + '|' + mk] = Date.now() + 3600000;
    else if (st >= 500) cool[p.id + '|' + mk] = Date.now() + 15000;
    else cool[p.id + '|' + mk] = Date.now() + (photo && st === 400 ? 60000 : 600000);
    lastError = p.name + ' ' + st + ': ' + msg.slice(0, 160);
  }
  /* "why" is the start of the status message, so it can say Gemini is full or that the owner chose backups first */
  function run(body, sig, real, say, why) {
    var j; try { j = JSON.parse(body); } catch (e) { return Promise.resolve(null); }
    say = say || function () {};
    var keys = getKeys(), list = [], cache = {}, pics = hasImage(j);
    PROV.forEach(function (p) {
      if (!keys[p.id]) return;
      p.models.forEach(function (m) {
        if (pics && p.visionModels && p.visionModels.indexOf(m) >= 0) list.push({ p: p, m: m, v: true });
        list.push({ p: p, m: m, v: !!p.vision });
      });
    });
    function go(i) {
      if (i >= list.length) return Promise.resolve(null);
      var p = list[i].p, m = list[i].m, v = list[i].v, mk = m + (v && !p.vision ? '|v' : ''), now = Date.now();
      if (cool[p.id] > now || cool[p.id + '|' + mk] > now) return go(i + 1);
      var o = cache[v ? 1 : 0] || (cache[v ? 1 : 0] = toOA(j, v));
      var payload = { model: m, messages: o.messages, stream: true, max_tokens: 12000 };
      if (o.tools.length) { payload.tools = o.tools; payload.tool_choice = 'auto'; }
      if (/gpt-oss/.test(m) && p.id !== 'openrouter') payload.reasoning_effort = 'low';
      /* a provider that stays silent is cut off after WAIT ms so the next one gets a turn; the builder's own stop button still works */
      var ac = new AbortController(), timedOut = false;
      var tm = setTimeout(function () { timedOut = true; ac.abort(); }, WAIT);
      if (sig) { if (sig.aborted) ac.abort(); else sig.addEventListener('abort', function () { ac.abort(); }); }
      return real(p.url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + keys[p.id] }, body: JSON.stringify(payload), signal: ac.signal }).then(function (r) {
        clearTimeout(tm);
        if (r.ok && r.body) {
          say((why || 'Gemini is full for now. Using ') + p.name + ' (' + m + ')' + (v && pics ? ', reading your photos' : ''), 4000);
          try { if (root.__stmLimits) root.__stmLimits.count(p.id); } catch (e) {}
          return new Response(toGem(r), { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
        }
        return r.text().then(function (t) { fail(p, mk, r.status, t, r.headers); return go(i + 1); });
      }, function (e) {
        clearTimeout(tm);
        if (sig && sig.aborted) throw e;
        if (timedOut) {
          cool[p.id] = Date.now() + 120000;
          lastError = p.name + ' (' + m + ') did not answer in ' + (WAIT / 1000) + 's';
        } else {
          cool[p.id] = Date.now() + 120000;
          lastError = p.name + ' could not be reached (blocked by the browser, or offline)';
        }
        return go(i + 1);
      });
    }
    return go(0);
  }

  /* for the Limits panel: which configured providers are ready, and which are paused until when */
  function status() {
    var keys = getKeys(), now = Date.now(), out = [];
    PROV.forEach(function (p) {
      if (!keys[p.id]) return;
      var until = 0, free = 0;
      p.models.forEach(function (m) {
        var c = Math.max(cool[p.id] || 0, cool[p.id + '|' + m] || 0);
        if (c > now) { until = until ? Math.min(until, c) : c; } else free++;
      });
      out.push({ id: p.id, name: p.name, ready: free > 0, until: free > 0 ? 0 : until });
    });
    return out;
  }

  /* quick check used by the "Test backups" button */
  function test(real) {
    var keys = getKeys(), rows = [];
    function one(p) {
      var errs = [];
      function tryModel(i) {
        if (i >= p.models.length) return Promise.resolve(p.name + ': not working. ' + errs.join(' | '));
        var m = p.models[i], pay = { model: m, messages: [{ role: 'user', content: 'Reply with the single word OK' }], max_tokens: 300 };
        if (/gpt-oss/.test(m) && p.id !== 'openrouter') pay.reasoning_effort = 'low';
        return real(p.url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + keys[p.id] }, body: JSON.stringify(pay) }).then(function (r) {
          if (r.ok) return p.name + ': works (' + m + ')';
          return r.text().then(function (t) {
            var msg = t; try { msg = JSON.parse(t).error.message || t; } catch (e) {}
            errs.push(m + ' ' + r.status + ' ' + String(msg).slice(0, 90));
            if (r.status === 401 || r.status === 403) return p.name + ': the key was refused (' + r.status + '). Check it.';
            return tryModel(i + 1);
          });
        }, function () { return p.name + ': could not be reached. The browser may be blocking it, or you are offline.'; });
      }
      return tryModel(0);
    }
    var chain = Promise.resolve();
    PROV.forEach(function (p) { if (keys[p.id]) chain = chain.then(function () { return one(p); }).then(function (s) { rows.push(s); }); });
    return chain.then(function () { return rows; });
  }

  /* ---------- Settings panel ---------- */
  function mount() {
    var s = D && D.getElementById('set'), anchor = s && s.querySelector('label[for="ghtoken"]');
    if (!anchor || D.getElementById('bkBox')) return;
    var box = D.createElement('div'); box.id = 'bkBox';
    box.innerHTML = '<label>Backup AI keys (optional, free)</label>' +
      PROV.map(function (p) { return '<input id="bk_' + p.id + '" type="password" autocomplete="off" placeholder="' + p.name + ' API key">'; }).join('') +
      '<p class="hint">When the daily Gemini limit is used up, the builder switches to these by itself. Each one has its own separate free limit. Get a key at ' +
      '<a href="https://cloud.cerebras.ai/" target="_blank" rel="noopener noreferrer">cloud.cerebras.ai</a>, ' +
      '<a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">openrouter.ai/keys</a>, ' +
      '<a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">console.groq.com/keys</a>. ' +
      'Mistral (<a href="https://console.mistral.ai/api-keys" target="_blank" rel="noopener noreferrer">console.mistral.ai</a>) has the biggest free allowance and is the only backup that can read attached photos (up to 8 at a time). You can add any of them. Backups are a little less capable than Gemini. Free plans may let the provider use what you send, so never paste customer data or passwords.</p>' +
      '<div class="row"><button id="bkTest" type="button" class="sm">Test backups</button></div><div id="bkOut" class="hint"></div>';
    anchor.parentNode.insertBefore(box, anchor);
    var k = getKeys();
    PROV.forEach(function (p) { var el = D.getElementById('bk_' + p.id); if (el) el.value = k[p.id] || ''; });
    function collect() {
      var o = {};
      PROV.forEach(function (p) { var el = D.getElementById('bk_' + p.id); if (el && el.value.trim()) o[p.id] = el.value.trim(); });
      saveKeys(o); return o;
    }
    box.addEventListener('input', collect);
    var sv = D.getElementById('bSave'); if (sv) sv.addEventListener('click', collect);
    var cl = D.getElementById('bClear');
    if (cl) cl.addEventListener('click', function () {
      try { root.localStorage.removeItem(STORE); } catch (e) {} try { root.sessionStorage.removeItem(STORE); } catch (e) {}
      PROV.forEach(function (p) { var el = D.getElementById('bk_' + p.id); if (el) el.value = ''; });
    });
    D.getElementById('bkTest').addEventListener('click', function () {
      var out = D.getElementById('bkOut'); collect();
      if (!has()) { out.textContent = 'Paste at least one backup key first.'; return; }
      out.textContent = 'Testing...';
      test(root.fetch.bind(root)).then(function (rows) { out.textContent = rows.join('\n'); out.style.whiteSpace = 'pre-line'; });
    });
  }
  if (D) { if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', mount); else mount(); }

  var api = {
    has: has, run: run, test: test, status: status, toOA: toOA, toGem: toGem, PROV: PROV, cool: cool,
    useKeys: function (o) { mem = o; },
    lastError: function () { return lastError; }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.__stmBackup = api;
})(typeof window !== 'undefined' ? window : globalThis);
