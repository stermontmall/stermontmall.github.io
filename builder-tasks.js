/* Stermont AI Builder: task queue (up to 200 tasks).
   Loaded by builder-products.js, before the builder reads its tool list. Adds two tools for the AI:
   add_tasks     put up to 200 separate tasks in a queue
   manage_tasks  list, pause, resume or clear the queue
   The queue then sends the tasks to the builder one at a time, by itself, as if the owner typed each one, so no single reply has to do
   everything and the builder's step limit per message never blocks a big job. It waits out Gemini limits and retries, keeps going after a
   page refresh, and shows a small progress bar above the message box. If this file fails to load, the builder works as before. */
(function () {
  'use strict';
  var W = window, D = document, BP = W.BuilderProducts;
  if (!BP || W.__stmTasks) return;
  W.__stmTasks = 1;
  var KEY = 'stm_builder_tasks_v1', CHATKEY = 'stm_builder_chat_v1', MAX = 200;
  var hooks = { bound: false, busy: function () { return false; }, say: function () {} };
  var Q = fresh(), cur = null, logBefore = 0, holdUntil = 0, transient = 0, bar = null, txt = null, bPause = null, bClear = null;

  function fresh() { return { tasks: [], paused: false, told: false }; }
  function $(id) { return D.getElementById(id); }
  function load() {
    try {
      var j = JSON.parse(localStorage.getItem(KEY));
      if (j && Array.isArray(j.tasks)) { Q = j; Q.tasks.forEach(function (t) { if (t.s === 'doing') t.s = 'todo'; }); }
    } catch (e) {}
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(Q)); } catch (e) {} }
  function cnt(s) { return Q.tasks.filter(function (t) { return t.s === s; }).length; }
  function pending() { return cnt('todo') + cnt('doing'); }
  function nextTask() { return Q.tasks.filter(function (t) { return t.s === 'todo'; })[0]; }

  /* ---------- tools for the AI ---------- */
  function addTasks(a) {
    var list = (Array.isArray(a && a.tasks) ? a.tasks : []).map(function (x) { return String(x == null ? '' : x).replace(/\s+/g, ' ').trim().slice(0, 1500); }).filter(Boolean);
    if (!list.length) throw new Error('tasks is required: send a list of short, separate tasks');
    if (!pending()) Q = fresh();
    if (pending() + list.length > MAX) throw new Error('The queue holds at most ' + MAX + ' waiting tasks and ' + pending() + ' are already waiting. Add fewer tasks.');
    list.forEach(function (x) { Q.tasks.push({ t: x, s: 'todo', n: 0, c: 0 }); });
    Q.paused = false; Q.told = false; save(); render();
    return { queued: list.length, waiting: pending(), note: 'The tasks run one at a time, by themselves, starting a few seconds after this reply ends. Do NOT start them now. Tell the owner in one or two sentences that they are queued and will run by themselves, and that they can watch the progress bar above the message box.' };
  }
  function manage(a) {
    var act = String(a && a.action || 'list').toLowerCase();
    if (act === 'clear') { var n = pending(); Q = fresh(); cur = null; save(); render(); return { cleared: n }; }
    if (act === 'pause') { Q.paused = true; save(); render(); }
    if (act === 'resume') { Q.paused = false; holdUntil = 0; save(); render(); }
    return {
      waiting: pending(), done: cnt('done'), failed: cnt('failed'), paused: !!Q.paused,
      next: Q.tasks.filter(function (t) { return t.s === 'todo'; }).slice(0, 5).map(function (t) { return t.t.slice(0, 100); }),
      failed_tasks: Q.tasks.filter(function (t) { return t.s === 'failed'; }).slice(0, 10).map(function (t) { return t.t.slice(0, 80) + ' (' + (t.r || 'failed') + ')'; })
    };
  }

  /* ---------- the progress bar ---------- */
  function pill() {
    if (bar || !D.body) return;
    bar = D.createElement('div');
    bar.hidden = true;
    bar.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:176px;z-index:7;max-width:94%;display:flex;gap:.4rem;align-items:center;background:#1f1b2e;color:#fff;border-radius:999px;padding:.3rem .5rem .3rem .9rem;font:600 .82rem/1.3 system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.3)';
    txt = D.createElement('span'); bar.appendChild(txt);
    function mk(t, fn) {
      var b = D.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = fn;
      b.style.cssText = 'background:transparent;color:#fff;border:1px solid #fff;border-radius:999px;padding:.15rem .6rem;font:inherit;font-size:.8rem';
      bar.appendChild(b); return b;
    }
    bPause = mk('Pause', function () { manage({ action: Q.paused ? 'resume' : 'pause' }); });
    bClear = mk('Clear', function () { if (pending() && !confirm('Remove all waiting tasks?')) return; manage({ action: 'clear' }); });
    D.body.appendChild(bar);
  }
  function render() {
    pill();
    if (!bar) return;
    var total = Q.tasks.length, left = pending(), f = cnt('failed');
    if (!total) { bar.hidden = true; return; }
    bar.hidden = false;
    txt.textContent = left
      ? 'Tasks: ' + cnt('done') + ' of ' + total + ' done' + (f ? ', ' + f + ' failed' : '') + (Q.paused ? ' (paused)' : Date.now() < holdUntil - 5000 ? ' (waiting to retry)' : '')
      : 'Tasks finished: ' + cnt('done') + ' done' + (f ? ', ' + f + ' failed' : '');
    bPause.hidden = !left; bPause.textContent = Q.paused ? 'Resume' : 'Pause';
    bClear.textContent = left ? 'Clear' : 'Dismiss';
  }

  /* ---------- the runner ---------- */
  function bigChat() {
    var s = ''; try { s = localStorage.getItem(CHATKEY) || sessionStorage.getItem(CHATKEY) || ''; } catch (e) {}
    return s.length > 120000;
  }
  function msgFor(t) {
    var i = Q.tasks.indexOf(t) + 1, of = i + ' of ' + Q.tasks.length;
    return t.c ? 'Continue task ' + of + ' (you ran out of steps): ' + t.t : 'Task ' + of + ': ' + t.t;
  }
  function newMsgs() {
    var l = $('log'), a = [];
    if (l) for (var i = logBefore; i < l.children.length; i++) a.push(l.children[i]);
    return a;
  }
  function summary() {
    if (Q.told) return;
    var d = cnt('done'), f = cnt('failed'); if (!d && !f) return;
    Q.told = true; save();
    var bad = Q.tasks.filter(function (t) { return t.s === 'failed'; }).slice(0, 5).map(function (t) { return t.t.slice(0, 70) + ' (' + (t.r || 'failed') + ')'; }).join(' | ');
    hooks.say('Task queue finished: ' + d + ' done' + (f ? ', ' + f + ' could not be finished: ' + bad : '') + '. Website changes are published automatically when the check passes. Otherwise use the green Publish card.', f ? 'err' : 'sys');
  }
  function finishTurn() {
    var t = cur; cur = null;
    var err = null, stopped = false, steps = false, reply = '';
    newMsgs().forEach(function (e) {
      var c = e.classList, x = e.textContent || '';
      if (c.contains('err') && !/^Could not publish/.test(x)) err = x;
      else if (c.contains('sys') && x === 'Stopped.') stopped = true;
      else if (c.contains('sys') && /^I paused after 40 steps/.test(x)) steps = true;
      else if (c.contains('ai')) reply = x;
    });
    if (stopped) { t.s = 'todo'; Q.paused = true; }
    else if (err) {
      t.s = 'todo';
      if (/limit|quota|429|busy|too long|did not answer|no answer|connection|fetch|50\d|overload|Gemini/i.test(err)) {
        /* a limit or a bad connection is not the task's fault: wait longer each time and try the same task again */
        transient++; holdUntil = Date.now() + Math.min(600000, 20000 * Math.pow(2, Math.min(transient, 5)));
      } else {
        t.n = (t.n || 0) + 1; holdUntil = Date.now() + 5000;
        if (t.n >= 2) { t.s = 'failed'; t.r = err.slice(0, 140); }
      }
    } else if (steps && (t.c || 0) < 3) { t.c = (t.c || 0) + 1; t.s = 'todo'; holdUntil = Date.now() + 2500; }
    else { t.s = 'done'; t.r = reply.slice(0, 140); transient = 0; holdUntil = Date.now() + 2500; } /* a short pause lets automatic publishing finish first */
    save(); render();
    if (!pending()) summary();
  }
  function tick() {
    if (!hooks.bound) return;
    var busy = hooks.busy();
    if (cur) { if (!busy) finishTurn(); return; }
    if (busy || Q.paused || Date.now() < holdUntil) return;
    var t = nextTask(); if (!t) return;
    var inp = $('inp'), send = $('bSend'), BA = W.BuilderAttach;
    if (!inp || !send) return;
    if (BA && BA.has && BA.has()) return; /* files are waiting in the message box: never attach them to a queued task */
    if (D.activeElement === inp && inp.value.trim()) return; /* the owner is typing */
    if (bigChat()) { W.__stmNoReload = true; try { var nb = $('bNew'); if (nb) nb.click(); } finally { W.__stmNoReload = false; } } /* start the next task on a fresh, small chat */
    logBefore = $('log') ? $('log').children.length : 0;
    var draft = inp.value;
    inp.value = msgFor(t); cur = t; t.s = 'doing';
    send.click();
    inp.value = draft;
    if (!hooks.busy()) { cur = null; t.s = 'todo'; holdUntil = Date.now() + 15000; } /* the builder did not start it (for example no Gemini key yet): try again later */
    save(); render();
  }

  /* ---------- register the tools and the instructions ---------- */
  var RULES = '\nTASK QUEUE: the builder can run up to 200 tasks one after another by itself, so no single reply has to do everything. When the owner gives a big job, a long list, or asks for many changes, split it into separate short tasks that each make sense on their own (name the product id, file or page in every task) and call add_tasks once with all of them. Then tell the owner in one or two sentences that they are queued and will run by themselves. Do not start them yourself. Each queued task later arrives as its own message that starts with "Task N of M:". Do only that one task, then reply in one or two sentences. Never call add_tasks while you are doing a queued task. Use manage_tasks to list, pause, resume or clear the queue when the owner asks.';
  BP.decls.push(
    { name: 'add_tasks', description: 'Add tasks to the builder task queue (up to 200 waiting at once). The builder then does them one at a time by itself, as if the owner typed each one, even after a refresh. Use it for big jobs or long lists: split the work into separate short tasks that each make sense on their own, and send them all in one call.',
      parameters: { type: 'object', properties: { tasks: { type: 'array', items: { type: 'string' }, description: 'The tasks, in order. Each one is a complete instruction that names the product id, file or page it is about' } }, required: ['tasks'] } },
    { name: 'manage_tasks', description: 'Show the task queue (how many are waiting, done and failed), or pause, resume or clear it. Use it when the owner asks about the queue.',
      parameters: { type: 'object', properties: { action: { type: 'string', description: 'list, pause, resume or clear (default list)' } }, required: [] } }
  );
  BP.tools.add_tasks = addTasks;
  BP.tools.manage_tasks = manage;
  var oi = BP.info; BP.info = function () { return (oi ? oi.apply(BP, arguments) : '') + RULES; };
  var ob = BP.bind; BP.bind = function (o) { if (ob) ob.apply(BP, arguments); if (o) { if (o.busy) hooks.busy = o.busy; if (o.say) hooks.say = o.say; hooks.bound = true; } };

  load(); render();
  setInterval(tick, 1500);
})();
