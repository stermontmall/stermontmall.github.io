/* Stermont AI Builder: keeps working when the free Gemini limit is hit.
   Loaded by builder-attach.js. It sits between the builder and Google and:
   - waits out short "limit reached" pauses and carries on by itself, so a task is not lost
   - switches to another Gemini model, because each model has its own separate limit (six models are tried in turn)
   - tells the AI to work in fewer steps, so the free quota lasts much longer
   Google's free tier can never be truly unlimited. For no limits at all, turn on billing for the Gemini key.
   If this file fails to load, the builder keeps working without it. */
(function () {
  'use strict';
  var W = window, D = document;
  if (W.__stmBoost || !W.fetch || !W.Response) return;
  W.__stmBoost = 1;
  var real = W.fetch.bind(W);
  var HOST = 'generativelanguage.googleapis.com';
  /* a model that does not exist (404) is skipped for an hour, so old or renamed names here are harmless */
  var MODELS = ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
  var HOLD = 18000, GIVEUP = 75000; /* wait up to 18s per try (the builder gives up silent requests at 30s); longer pauses are reported */
  var cool = {}, toast = null, toastT = 0;
  var EXTRA = '\n\nWORK EFFICIENTLY (the owner uses a limited AI quota): read a file once with a large window, then make ALL the edits to it in the same step by calling edit_file several times together. Never read the same file again after every small edit. Finish a task in as few steps as possible and never repeat a step you already completed.';

  function say(t, ms) {
    if (!D.body) return;
    if (!toast) {
      toast = D.createElement('div');
      toast.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:130px;z-index:30;max-width:90%;background:#5b21b6;color:#fff;border-radius:999px;padding:.35rem .9rem;font:600 .85rem/1.3 system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.25);text-align:center';
      D.body.appendChild(toast);
    }
    clearTimeout(toastT);
    if (!t) { toast.hidden = true; return; }
    toast.hidden = false; toast.textContent = t;
    if (ms) toastT = setTimeout(function () { toast.hidden = true; }, ms);
  }
  function wait(ms, sig) {
    return new Promise(function (ok, no) {
      var t = 0;
      function stop() { clearTimeout(t); var e = new Error('Aborted'); e.name = 'AbortError'; no(e); }
      if (sig && sig.aborted) return stop();
      t = setTimeout(function () { if (sig) sig.removeEventListener('abort', stop); ok(); }, ms);
      if (sig) sig.addEventListener('abort', stop);
    });
  }
  function countdown(ms, sig) {
    var end = Date.now() + ms;
    function show() { say('Free limit reached. Continuing in ' + Math.max(0, Math.ceil((end - Date.now()) / 1000)) + 's...'); }
    show();
    var iv = setInterval(show, 500);
    return wait(ms, sig).then(function () { clearInterval(iv); }, function (e) { clearInterval(iv); say(''); throw e; });
  }
  function delayOf(txt) {
    var s = 0, m = /"retryDelay"\s*:\s*"([\d.]+)s"/.exec(txt) || /retry in ([\d.]+)\s*s/i.exec(txt);
    if (m) s = parseFloat(m[1]);
    if (/PerDay|per day/i.test(txt)) s = Math.max(s, 3600);
    return Math.ceil((s || 20) * 1000) + 500;
  }
  function fake429(left) {
    var t = left > 600000 ? 'Daily free limit used up on every model. Turn on billing for your Gemini key (see Settings) for no limits, or try again later.'
      : left >= 60000 ? 'Free limit reached. Try again in about ' + Math.ceil(left / 60000) + ' min, or turn on billing for no limits (see Settings).'
      : 'Free limit reached. Waiting about ' + Math.ceil(left / 1000) + 's, then trying again.';
    say(t, 9000);
    return new Response(JSON.stringify({ error: { code: 429, message: t, status: 'RESOURCE_EXHAUSTED' } }), { status: 429, headers: { 'Content-Type': 'application/json' } });
  }

  function boosted(url, init, asked) {
    var body = init.body;
    try {
      var j = JSON.parse(body), p = j.systemInstruction && j.systemInstruction.parts && j.systemInstruction.parts[0];
      if (p && typeof p.text === 'string' && p.text.indexOf('WORK EFFICIENTLY') < 0) { p.text += EXTRA; body = JSON.stringify(j); }
    } catch (e) {}
    var order = [asked].concat(MODELS).filter(function (x, i, a) { return x && a.indexOf(x) === i; }), sig = init.signal, waited = false;
    function urlFor(model) { return url.replace(/models\/[^:?\/]+:/, 'models/' + encodeURIComponent(model) + ':'); }
    function attempt() {
      var now = Date.now(), free = order.filter(function (x) { return !(cool[x] > now); });
      if (!free.length) {
        var left = Math.min.apply(null, order.map(function (x) { return cool[x]; })) - now;
        if (left > GIVEUP || waited) return Promise.resolve(fake429(left));
        waited = true;
        return countdown(Math.min(left, HOLD), sig).then(attempt);
      }
      var model = free[0], o = {};
      Object.keys(init).forEach(function (k) { o[k] = init[k]; });
      o.body = body;
      return real(urlFor(model), o).then(function (r) {
        if (r.ok) { say(model !== asked ? 'Using ' + model + ' for now' : '', model !== asked ? 3000 : 0); return r; }
        if (r.status === 429 || r.status >= 500 || (r.status === 404 && order.length > 1)) {
          return r.clone().text().then(function (t) {
            cool[model] = Date.now() + (r.status === 429 ? delayOf(t) : r.status === 404 ? 3600000 : 8000);
            return attempt();
          });
        }
        return r;
      });
    }
    return attempt();
  }

  W.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (url.indexOf(HOST) < 0 || url.indexOf(':streamGenerateContent') < 0 || !init || typeof init.body !== 'string') return real(input, init);
    var m = /models\/([^:?\/]+):/.exec(url);
    if (!m) return real(input, init);
    return boosted(url, init, decodeURIComponent(m[1]));
  };

  /* a short note in Settings about the one real way to remove the limit */
  function hint() {
    var s = D.getElementById('set'), l = s && s.querySelector('label[for="model"]');
    if (!l || D.getElementById('boostHint')) return;
    var p = D.createElement('p'); p.id = 'boostHint'; p.className = 'hint';
    p.innerHTML = '<b>No limits:</b> the free Gemini plan has daily caps set by Google. To remove them, open <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>, find the project of your key and set up billing. You then pay only for what you use, which is small with a flash-lite model. Set a monthly budget alert to stay in control. Until then the builder waits out short pauses and switches models by itself.';
    l.parentNode.insertBefore(p, l);
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', hint); else hint();
})();
/* automatic publishing (optional: the builder works without it) */
try { var as = document.createElement('script'); as.src = '/builder-auto.js?v=1'; as.async = true; (document.head || document.documentElement).appendChild(as); } catch (e) {}
