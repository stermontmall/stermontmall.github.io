/* Stermont AI Builder: task queue (up to 200 tasks).
   Adds a Tasks button next to Settings. Paste a list (one task per line), press Start, and the builder does the tasks one after another
   by sending each one to the AI as if you had typed it. It keeps going on its own:
   - when the AI pauses after 40 steps it sends "continue" for you
   - when the free Gemini limit is reached it waits 5 minutes and tries again (the tab must stay open)
   - each task can start in a fresh chat (page reload), which saves quota and loads the newest code
   The queue is saved on this device, so it survives a refresh. Website changes are published by the automatic publishing,
   product edits save straight to the shop. If this file fails to load, the builder works as before. */
(function () {
  'use strict';
  var D = document, KEY = 'stm_builder_tasks_v1', CHAT = 'stm_builder_chat_v1', MAX = 200;
  if (window.__stmTasks) return;
  window.__stmTasks = 1;
  var SUFFIX = ' (Queued task: do the whole job now without asking questions. If something essential is missing, say exactly what in one sentence and stop.)';
  function $(id) { return D.getElementById(id); }
  function load() {
    var o = null; try { o = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (!o || !Array.isArray(o.items)) o = { run: false, fresh: true, items: [], retryAt: 0 };
    return o;
  }
  var st = load(), working = false, panel = null, listEl = null, infoEl = null, btn = null, startBtn = null, freshCb = null, toast = null, toastT = 0;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function count(s) { return st.items.filter(function (i) { return i.s === s; }).length; }
  function first(s) { for (var i = 0; i < st.items.length; i++) if (st.items[i].s === s) return i; return -1; }
  function busy() { var s = $('bStop'); return !!(s && !s.hidden); }
  function ready() { var s = $('bSend'); return !!(s && typeof s.onclick === 'function' && $('inp') && $('log') && $('bStop')); }
  function say(t, ms) {
    if (!D.body) return;
    if (!toast) {
      toast = D.createElement('div');
      toast.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:130px;z-index:30;max-width:90%;background:#15803d;color:#fff;border-radius:999px;padding:.35rem .9rem;font:600 .85rem/1.3 system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.25);text-align:center';
      D.body.appendChild(toast);
    }
    clearTimeout(toastT); toast.hidden = false; toast.textContent = t;
    if (ms) toastT = setTimeout(function () { toast.hidden = true; }, ms);
  }

  /* clear the saved chat and reload, so the next task starts with an empty chat and the newest code */
  function wipe() { try { localStorage.removeItem(CHAT); } catch (e) {} try { sessionStorage.removeItem(CHAT); } catch (e) {} }
  function fresh() { wipe(); window.addEventListener('pagehide', wipe); setTimeout(function () { try { location.reload(); } catch (e) {} }, 200); }

  function parse(txt) {
    return String(txt || '').split(/\r?\n/).map(function (l) { return l.replace(/^\s*(?:[-*\u2022]|\d{1,3}[.)])\s+/, '').trim(); }).filter(Boolean).map(function (l) { return l.slice(0, 2000); });
  }

  /* send one task to the builder and report how it went */
  function inspect(before, seen) {
    var kids = Array.prototype.slice.call($('log').children, before), r = { err: '', stopped: false, more: false, reply: '', started: seen };
    kids.forEach(function (n) {
      var c = n.classList, tx = n.textContent || '';
      if (c.contains('err')) r.err = tx;
      else if (c.contains('sys') && /^Stopped\./.test(tx)) r.stopped = true;
      else if (c.contains('sys') && /paused after 40 steps/i.test(tx)) r.more = true;
      else if (c.contains('ai')) r.reply = tx;
    });
    return r;
  }
  function sendTask(text) {
    var before = $('log').children.length, inp = $('inp');
    inp.value = text; inp.dispatchEvent(new Event('input'));
    $('bSend').click();
    return new Promise(function (res) {
      var t0 = Date.now(), seen = false, iv = setInterval(function () {
        var b = busy(), r;
        if (b) seen = true;
        if (seen && !b) { clearInterval(iv); res(inspect(before, true)); return; }
        if (!seen) {
          r = inspect(before, false);
          if (r.err || Date.now() - t0 > 20000) { clearInterval(iv); if (!r.err) r.err = 'The task did not start.'; res(r); }
        }
      }, 500);
    });
  }
  /* after a task: wait until the builder has been idle for 3 seconds (automatic publishing may still be running) */
  function settle(cb) {
    var idle = 0, iv = setInterval(function () {
      if (busy()) idle = 0; else idle += 500;
      if (idle >= 3000) { clearInterval(iv); cb(); }
    }, 500);
  }

  function step() {
    if (working || !st.run) return;
    if (st.retryAt > Date.now()) { render(); return; }
    if (!ready() || busy()) return;
    var i = first('p');
    if (i < 0) { st.run = false; save(); render(); say('All tasks are finished.', 6000); return; }
    var it = st.items[i];
    if (!($('gkey') && $('gkey').value.trim())) { st.run = false; save(); render(); try { $('set').hidden = false; } catch (e) {} say('Add your Gemini key in Settings, then press Start.', 7000); return; }
    if (it.n >= 3) { it.s = 'f'; it.r = it.r || 'Gave up after 3 tries'; save(); render(); return; }
    working = true; it.n++; save(); render();
    var more = 0;
    function go(msg) {
      sendTask(msg).then(function (r) {
        if (r.stopped) { st.run = false; it.n--; save(); working = false; render(); return; }
        if (r.err) {
          working = false;
          if (/limit|quota|429/i.test(r.err)) { it.n--; it.r = 'Waiting for the Gemini limit, trying again later'; st.retryAt = Date.now() + 5 * 60000; }
          else { it.r = r.err.slice(0, 160); st.retryAt = Date.now() + 20000; }
          save(); render(); return;
        }
        if (r.more && more < 6) { more++; go('continue'); return; }
        it.s = 'd'; it.r = String(r.reply || 'Done').replace(/\s+/g, ' ').slice(0, 300); st.retryAt = 0; save(); render();
        settle(function () { working = false; if (st.run && st.fresh && first('p') >= 0) fresh(); else render(); });
      });
    }
    go(it.t + SUFFIX);
  }

  function render() {
    var p = count('p'), d = count('d'), f = count('f');
    if (btn) btn.textContent = (st.run ? '\u25B6 ' : '') + 'Tasks' + (p ? ' (' + p + ')' : '');
    if (!panel) return;
    var wait = st.run && st.retryAt > Date.now() ? ' Waiting until ' + new Date(st.retryAt).toTimeString().slice(0, 5) + ', then trying again.' : '';
    infoEl.textContent = (st.run ? 'Running.' : 'Paused.') + ' ' + p + ' waiting, ' + d + ' done, ' + f + ' failed. The queue holds up to ' + MAX + ' tasks.' + wait;
    startBtn.textContent = st.run ? 'Pause' : 'Start';
    freshCb.checked = !!st.fresh;
    listEl.innerHTML = '';
    var cur = first('p');
    st.items.forEach(function (it, i) {
      var li = D.createElement('li'), sp = D.createElement('span');
      var tag = it.s === 'd' ? '\u2713' : it.s === 'f' ? '\u2717' : (working && i === cur ? '\u25B6' : '\u00B7');
      sp.textContent = tag + ' ' + (i + 1) + '. ' + it.t.slice(0, 160) + (it.r ? ' \u2014 ' + it.r.slice(0, 160) : '');
      sp.style.color = it.s === 'f' ? 'var(--no)' : it.s === 'd' ? 'var(--ok)' : '';
      li.appendChild(sp); listEl.appendChild(li);
    });
  }

  function mk(txt, cls, fn) { var b = D.createElement('button'); b.type = 'button'; b.className = cls || ''; b.textContent = txt; b.onclick = fn; return b; }
  function init() {
    var bSet = $('bSet'), log = $('log');
    if (!bSet || !log || $('bTasks')) return;
    btn = mk('Tasks', '', function () { panel.hidden = !panel.hidden; render(); });
    btn.id = 'bTasks';
    bSet.parentNode.insertBefore(btn, bSet);
    panel = D.createElement('section'); panel.className = 'card'; panel.hidden = true;
    var h = D.createElement('h2'); h.textContent = 'Task queue (up to ' + MAX + ' tasks)'; panel.appendChild(h);
    var ta = D.createElement('textarea'); ta.rows = 6; ta.placeholder = 'One task per line, for example:\nFix typos on the About page\nWrite a banner for the weekend offer\nCheck all pages for broken links';
    panel.appendChild(ta);
    var row = D.createElement('div'); row.className = 'row'; row.style.marginTop = '.5rem';
    row.appendChild(mk('Add to queue', 'pri', function () {
      var tasks = parse(ta.value), room = MAX - st.items.length;
      if (!tasks.length) { say('Type or paste some tasks first.', 3000); return; }
      var add = tasks.slice(0, Math.max(0, room));
      add.forEach(function (t) { st.items.push({ t: t, s: 'p', n: 0, r: '' }); });
      ta.value = ''; save(); render();
      say(add.length < tasks.length ? 'Added ' + add.length + '. The queue is full at ' + MAX + ' tasks. Clear finished ones to make room.' : 'Added ' + add.length + ' task' + (add.length === 1 ? '' : 's') + '.', 5000);
    }));
    startBtn = mk('Start', 'ok', function () {
      if (st.run) { st.run = false; save(); render(); return; }
      if (first('p') < 0) { say('Add some tasks first.', 3000); return; }
      st.run = true; st.retryAt = 0; save(); render();
      if (st.fresh && D.querySelector('#log .m.user') && !busy()) fresh();
    });
    row.appendChild(startBtn);
    row.appendChild(mk('Retry failed', '', function () { st.items.forEach(function (i) { if (i.s === 'f') { i.s = 'p'; i.n = 0; i.r = ''; } }); st.retryAt = 0; save(); render(); }));
    row.appendChild(mk('Clear finished', '', function () { st.items = st.items.filter(function (i) { return i.s === 'p'; }); save(); render(); }));
    row.appendChild(mk('Clear all', '', function () { if (confirm('Remove every task from the queue?')) { st.items = []; st.run = false; save(); render(); } }));
    panel.appendChild(row);
    var lab = D.createElement('label'); lab.style.fontWeight = '500'; freshCb = D.createElement('input'); freshCb.type = 'checkbox';
    freshCb.onchange = function () { st.fresh = freshCb.checked; save(); };
    lab.appendChild(freshCb); lab.appendChild(D.createTextNode(' Start every task in a fresh chat (saves quota, recommended)')); panel.appendChild(lab);
    infoEl = D.createElement('p'); infoEl.className = 'hint'; panel.appendChild(infoEl);
    listEl = D.createElement('ul'); listEl.style.cssText = 'list-style:none;margin:.4rem 0 0;padding:0;font-size:.85rem;max-height:40vh;overflow:auto'; panel.appendChild(listEl);
    var hint = D.createElement('p'); hint.className = 'hint'; hint.textContent = 'Keep this page open while the queue runs. It carries on through the 40-step pause, waits out Gemini limits, and resumes after a refresh. Pause stops it after the current task.'; panel.appendChild(hint);
    log.parentNode.insertBefore(panel, log);
    render();
    setInterval(step, 1500);
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();
})();
