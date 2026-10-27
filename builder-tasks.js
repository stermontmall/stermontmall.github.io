/* Stermont AI Builder: task queue (up to 6000 tasks), saved in Supabase.
   Adds a Tasks button next to Settings. Paste a list (one task per line), press Start, and the builder does the tasks one after another
   by sending each one to the AI as if you had typed it. It keeps going on its own:
   - when the AI pauses after 40 steps it sends "continue" for you
   - when the free Gemini limit is reached it waits 5 minutes and tries again (the tab must stay open)
   - each task can start in a fresh chat (page reload), which saves quota and loads the newest code
   - batch mode: send 2, 3, 5 or 10 tasks in one request, so far fewer requests count against the daily limit
   Extras:
   - Supabase: the queue is saved in the shop database (table builder_tasks, see setup-builder-tasks.sql), so it survives clearing the browser
     and can be opened on another device. It uses the same admin sign-in as /admin.html. If you are signed out, the queue still works and is
     saved on this device, and it is uploaded the next time you are signed in.
   - Template: write "Write a better description for {item}" and paste a list of items, and one task is made per item.
   - Import: load tasks from a .txt or .csv file. Report: download what was done and what failed.
   - Run the queue on ONE device at a time, otherwise two devices will do the same task.
   Website changes are published by the automatic publishing, product edits save straight to the shop.
   If this file fails to load, the builder works as before. */
(function () {
  'use strict';
  var D = document, KEY = 'stm_builder_tasks_v1', CHAT = 'stm_builder_chat_v1', MAX = 6000;
  var SB = 'https://oewvtbnmyombbtggamor.supabase.co', PK = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7', SK = 'stm_admin_session';
  if (window.__stmTasks) return;
  window.__stmTasks = 1;
  var SUFFIX = ' (Queued task: do the whole job now without asking questions. If something essential is missing, say exactly what in one sentence and stop.)';
  /* batch mode: several waiting tasks go to the AI in ONE request, so far fewer requests count against the daily limit.
     Only fresh tasks are batched; a task that already failed once is always sent alone. */
  function pickGroup(items, i, size) {
    var g = [items[i]];
    if (size > 1 && items[i].n === 0) for (var k = i + 1; k < items.length && g.length < size; k++) if (items[k].s === 'p' && items[k].n === 0) g.push(items[k]);
    return g;
  }
  function batchMsg(g) {
    return 'Do ALL ' + g.length + ' jobs below in this one go, in order. Use your tools as needed and finish every job before you stop. When all are done, reply with one short line per job number saying what you did, or exactly why you could not.\n\n' +
      g.map(function (x, k) { return (k + 1) + '. ' + x.t; }).join('\n') + SUFFIX;
  }
  window.__stmTasksPure = { pickGroup: pickGroup, batchMsg: batchMsg };
  function $(id) { return D.getElementById(id); }
  function load() {
    var o = null; try { o = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (!o || !Array.isArray(o.items)) o = { run: false, fresh: true, items: [], retryAt: 0 };
    if (!Array.isArray(o.del)) o.del = [];
    o.batch = [1, 2, 3, 5, 10].indexOf(o.batch) >= 0 ? o.batch : 1;
    o.items = o.items.filter(function (i) { return i && typeof i.t === 'string'; });
    return o;
  }
  var st = load(), working = false, panel = null, listEl = null, infoEl = null, cloudEl = null, barEl = null, btn = null, startBtn = null, freshCb = null, batchSel = null, toast = null, toastT = 0;
  var cloud = 'connecting', cloudMsg = '', synced = false, renewing = null, view = 'all', shown = 150;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(st)); return; } catch (e) {}
    /* browser storage is full (thousands of long tasks): keep only what Supabase does not have yet. The rest is read back from Supabase on the next load. */
    try {
      localStorage.setItem(KEY, JSON.stringify({ run: st.run, fresh: st.fresh, retryAt: st.retryAt, del: st.del, syncedAt: 0, items: st.items.map(function (i) { return i.id && !i.x ? { id: i.id, s: i.s, n: i.n, r: '' } : i; }) }));
    } catch (e) {}
  }
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

  /* ---------- Supabase (same admin sign-in as /admin.html and builder-products.js) ---------- */
  var SIGNED_OUT = 'Signed out of the Admin console on this device. Open /admin.html, sign in, then come back.';
  function tok() {
    var s; try { s = JSON.parse(localStorage.getItem(SK)); } catch (e) {}
    if (!s || !s.access_token) return Promise.reject(new Error(SIGNED_OUT));
    if (Date.now() < s.exp) return Promise.resolve(s.access_token);
    if (!renewing) {
      renewing = fetch(SB + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { apikey: PK, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: s.refresh_token }) }).then(function (r) {
        if (!r.ok) throw new Error('The admin session expired. Open /admin.html and sign in again.');
        return r.json();
      }).then(function (j) {
        s.access_token = j.access_token; s.refresh_token = j.refresh_token; s.exp = Date.now() + (j.expires_in || 3600) * 1000 - 60000;
        try { localStorage.setItem(SK, JSON.stringify(s)); } catch (e) {}
        renewing = null; return s.access_token;
      }, function (e) { renewing = null; throw e; });
    }
    return renewing;
  }
  function api(path, method, body, prefer) {
    return tok().then(function (t) {
      var hd = { apikey: PK, Authorization: 'Bearer ' + t }, ac = typeof AbortController === 'function' ? new AbortController() : null, to = ac ? setTimeout(function () { ac.abort(); }, 15000) : 0;
      if (body !== undefined) hd['Content-Type'] = 'application/json';
      if (prefer) hd.Prefer = prefer;
      return fetch(SB + path, { method: method || 'GET', headers: hd, body: body !== undefined ? JSON.stringify(body) : undefined, signal: ac ? ac.signal : undefined }).then(function (r) { clearTimeout(to); return r; }, function (e) { clearTimeout(to); throw new Error('Could not reach Supabase.'); });
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (x) { var m = x; try { m = JSON.parse(x).message || x; } catch (e) {} throw new Error(String(m).slice(0, 200)); });
      return r.text().then(function (tx) { return tx ? JSON.parse(tx) : null; });
    });
  }
  function cloudFail(e) { cloud = 'off'; cloudMsg = String(e && e.message || e || '').slice(0, 160); render(); }
  function cloudGood() { if (cloud !== 'on') { cloud = 'on'; cloudMsg = ''; render(); } }

  /* send tasks that have no cloud id yet (added while signed out or offline) */
  function pushNew(list) {
    var todo = list.filter(function (i) { return !i.id; }), chunks = [];
    for (var k = 0; k < todo.length; k += 100) chunks.push(todo.slice(k, k + 100));
    return chunks.reduce(function (p, ch) {
      return p.then(function () {
        return api('/rest/v1/builder_tasks?select=id', 'POST', ch.map(function (i) { return { text: i.t, status: i.s, tries: i.n || 0, result: i.r ? String(i.r).slice(0, 600) : null }; }), 'return=representation').then(function (rows) {
          (rows || []).forEach(function (r, j) { if (ch[j]) ch[j].id = r.id; });
          save();
        });
      });
    }, Promise.resolve());
  }
  /* send removals and changed tasks. Changes stay marked on the task until Supabase confirms them, so nothing is lost if the network drops. */
  function chunks(a, n) { var o = []; for (var k = 0; k < a.length; k += n) o.push(a.slice(k, k + n)); return o; }
  function flush() {
    if (cloud === 'off' && !st.del.length && !st.items.some(function (i) { return i.x; })) return Promise.resolve();
    /* big queues: removals and changes go in groups of 200 (a long list of ids will not fit in one web address), and tasks with the same new status share one request */
    var dels = st.del.slice(), p = Promise.resolve(), groups = {};
    chunks(dels, 200).forEach(function (ch) {
      p = p.then(function () { return api('/rest/v1/builder_tasks?id=in.(' + ch.join(',') + ')', 'DELETE'); }).then(function () { var gone = {}; ch.forEach(function (x) { gone[x] = 1; }); st.del = st.del.filter(function (x) { return !gone[x]; }); save(); });
    });
    st.items.forEach(function (i) {
      if (!i.id || !i.x) return;
      var b = { status: i.s, tries: i.n || 0, result: i.r ? String(i.r).slice(0, 600) : null }, k = JSON.stringify(b);
      (groups[k] = groups[k] || { b: b, its: [] }).its.push({ it: i, v: i.v || 0 });
    });
    Object.keys(groups).forEach(function (k) {
      chunks(groups[k].its, 200).forEach(function (ch) {
        p = p.then(function () { return api('/rest/v1/builder_tasks?id=in.(' + ch.map(function (z) { return z.it.id; }).join(',') + ')', 'PATCH', groups[k].b); }).then(function () { ch.forEach(function (z) { if ((z.it.v || 0) === z.v) z.it.x = 0; }); });
      });
    });
    return p.then(function () { save(); cloudGood(); }, cloudFail);
  }
  function touch(it) { it.x = 1; it.v = (it.v || 0) + 1; save(); if (cloud === 'on') flush(); }
  /* Supabase hands out at most 1000 rows per request, so a big queue is read page by page */
  function pull() {
    var all = [];
    function page(off) {
      return api('/rest/v1/builder_tasks?select=id,text,status,tries,result&order=id.asc&limit=1000&offset=' + off).then(function (rows) {
        rows = rows || []; all = all.concat(rows);
        if (rows.length === 1000 && all.length < MAX) return page(off + 1000);
      });
    }
    return page(0).then(function () {
      st.items = all.map(function (r) { return { id: r.id, t: r.text, s: r.status, n: r.tries || 0, r: r.result || '' }; });
      st.syncedAt = Date.now(); save();
    });
  }
  /* every page load checks the queue with Supabase, but a big queue that was read less than 10 minutes ago is not downloaded again for each fresh-chat reload. "Sync now" always reads it. */
  function syncStart(force) {
    cloud = 'connecting'; render();
    return tok().then(function () { return flush(); }).then(function () { return pushNew(st.items); }).then(function () {
      if (!force && st.syncedAt && Date.now() - st.syncedAt < 600000 && st.items.length) return;
      return pull();
    }).then(function () { cloudGood(); }, cloudFail).then(function () { synced = true; render(); });
  }

  /* clear the saved chat and reload, so the next task starts with an empty chat and the newest code */
  function wipe() { try { localStorage.removeItem(CHAT); } catch (e) {} try { sessionStorage.removeItem(CHAT); } catch (e) {} }
  function fresh() { wipe(); window.addEventListener('pagehide', wipe); setTimeout(function () { try { location.reload(); } catch (e) {} }, 200); }

  function parse(txt) {
    return String(txt || '').split(/\r?\n/).map(function (l) { return l.replace(/^\s*(?:[-*•]|\d{1,3}[.)])\s+/, '').trim(); }).filter(Boolean).map(function (l) { return l.slice(0, 2000); });
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
    if (working || !st.run || !synced) return;
    if (st.retryAt > Date.now()) { render(); return; }
    if (!ready() || busy()) return;
    var i = first('p');
    if (i < 0) { st.run = false; save(); render(); say('All tasks are finished.', 6000); return; }
    var it = st.items[i];
    if (!($('gkey') && $('gkey').value.trim())) { st.run = false; save(); render(); try { $('set').hidden = false; } catch (e) {} say('Add your Gemini key in Settings, then press Start.', 7000); return; }
    if (it.n >= 3) { it.s = 'f'; it.r = it.r || 'Gave up after 3 tries'; touch(it); render(); return; }
    var grp = pickGroup(st.items, i, st.batch || 1);
    working = true; grp.forEach(function (x) { x.n++; touch(x); }); render();
    var more = 0;
    function go(msg) {
      sendTask(msg).then(function (r) {
        if (r.stopped) { st.run = false; grp.forEach(function (x) { x.n--; touch(x); }); working = false; render(); return; }
        if (r.err) {
          working = false;
          /* a daily limit will not clear in a few minutes, so check less often (the check costs nothing while the limit is on) */
          if (/limit|quota|429/i.test(r.err)) { grp.forEach(function (x) { x.n--; x.r = 'Waiting for the AI limit, trying again later'; }); st.retryAt = Date.now() + (/daily/i.test(r.err) ? 15 : 5) * 60000; }
          else { grp.forEach(function (x) { x.r = r.err.slice(0, 160); }); st.retryAt = Date.now() + 20000; }
          grp.forEach(function (x) { touch(x); }); render(); return;
        }
        if (r.more && more < 6) { more++; go('continue'); return; }
        var rep = String(r.reply || 'Done').replace(/\s+/g, ' ').slice(0, 300);
        grp.forEach(function (x) { x.s = 'd'; x.r = grp.length > 1 ? '(batch of ' + grp.length + ') ' + rep : rep; touch(x); });
        st.retryAt = 0; render();
        settle(function () { (cloud === 'on' ? flush() : Promise.resolve()).then(function () { working = false; if (st.run && st.fresh && first('p') >= 0) fresh(); else render(); }); });
      });
    }
    go(grp.length > 1 ? batchMsg(grp) : it.t + SUFFIX);
  }

  function render() {
    var p = count('p'), d = count('d'), f = count('f'), n = st.items.length;
    if (btn) btn.textContent = (st.run ? '▶ ' : '') + 'Tasks' + (p ? ' (' + p + ')' : '');
    if (!panel) return;
    var wait = st.run && st.retryAt > Date.now() ? ' Waiting until ' + new Date(st.retryAt).toTimeString().slice(0, 5) + ', then trying again.' : '';
    infoEl.textContent = (st.run ? 'Running.' : 'Paused.') + ' ' + p + ' waiting, ' + d + ' done, ' + f + ' failed. ' + n + ' of ' + MAX + ' places used.' + wait;
    barEl.firstChild.style.width = (n ? Math.round((d + f) * 100 / n) : 0) + '%';
    cloudEl.textContent = cloud === 'on' ? '☁ Saved in Supabase. You can open this queue on another device.' : cloud === 'connecting' ? '☁ Connecting to Supabase...' : '☁ Supabase is off (' + (cloudMsg || 'not connected') + '). The queue is still saved on this device and uploads when you are signed in.';
    cloudEl.style.color = cloud === 'off' ? 'var(--no)' : '';
    startBtn.textContent = st.run ? 'Pause' : 'Start';
    freshCb.checked = !!st.fresh;
    if (batchSel) batchSel.value = String(st.batch || 1);
    listEl.innerHTML = '';
    var cur = first('p'), rows = [];
    st.items.forEach(function (x, k) { if (view === 'all' || x.s === view) rows.push(k); });
    rows.slice(0, shown).forEach(function (i) {
      var it = st.items[i], li = D.createElement('li'), sp = D.createElement('span');
      var tag = it.s === 'd' ? '✓' : it.s === 'f' ? '✗' : (working && i === cur ? '▶' : '·');
      sp.textContent = tag + ' ' + (i + 1) + '. ' + it.t.slice(0, 160) + (it.r ? ' — ' + it.r.slice(0, 160) : '');
      sp.style.color = it.s === 'f' ? 'var(--no)' : it.s === 'd' ? 'var(--ok)' : '';
      li.appendChild(sp);
      if (it.s === 'f') { var rb = mk('↻', 'sm', function () { it.s = 'p'; it.n = 0; it.r = ''; st.retryAt = 0; touch(it); render(); }); rb.title = 'Try again'; rb.style.marginLeft = '.4rem'; li.appendChild(rb); }
      if (!(working && i === cur)) { var xb = mk('✕', 'sm', function () { var k = st.items.indexOf(it); if (k < 0) return; st.items.splice(k, 1); if (it.id) st.del.push(it.id); save(); render(); flush(); }); xb.title = 'Remove'; xb.style.marginLeft = '.3rem'; li.appendChild(xb); }
      listEl.appendChild(li);
    });
    if (rows.length > shown) { var mo = D.createElement('li'); mo.appendChild(mk('Show 200 more (' + (rows.length - shown) + ' hidden)', 'sm', function () { shown += 200; render(); })); listEl.appendChild(mo); }
  }

  function report() {
    var lines = ['Stermont I.T task report, ' + new Date().toLocaleString(), count('d') + ' done, ' + count('f') + ' failed, ' + count('p') + ' waiting', ''];
    st.items.forEach(function (it, i) { lines.push((i + 1) + '. [' + (it.s === 'd' ? 'DONE' : it.s === 'f' ? 'FAILED' : 'WAITING') + '] ' + it.t + (it.r ? '\n     ' + it.r : '')); });
    var txt = lines.join('\n');
    try {
      var a = D.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
      a.download = 'builder-task-report.txt'; D.body.appendChild(a); a.click(); D.body.removeChild(a);
      say('Report downloaded.', 3000);
    } catch (e) {
      try { navigator.clipboard.writeText(txt); say('Report copied. Paste it into a note.', 4000); } catch (e2) { say('Could not make the report on this browser.', 4000); }
    }
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
    var tpl = D.createElement('input'); tpl.type = 'text'; tpl.autocomplete = 'off'; tpl.placeholder = 'Optional template, for example: Write a better description for {item}'; tpl.style.marginBottom = '.4rem';
    panel.appendChild(tpl);
    var ta = D.createElement('textarea'); ta.rows = 6; ta.placeholder = 'One task per line, for example:\nFix typos on the About page\nWrite a banner for the weekend offer\nCheck all pages for broken links\n\nWith a template above, put one item per line (product names, page names...) and each line becomes its own task.';
    panel.appendChild(ta);
    var row = D.createElement('div'); row.className = 'row'; row.style.marginTop = '.5rem';
    row.appendChild(mk('Add to queue', 'pri', function () {
      if (!synced) { say('Connecting to Supabase, try again in a moment.', 3000); return; }
      var lines = parse(ta.value), t = tpl.value.trim(), room = MAX - st.items.length;
      if (!lines.length) { say('Type or paste some tasks first.', 3000); return; }
      var tasks = /\{item\}/i.test(t) ? lines.map(function (l) { return t.replace(/\{item\}/gi, l).slice(0, 2000); }) : lines;
      var add = tasks.slice(0, Math.max(0, room)), made = add.map(function (x) { return { t: x, s: 'p', n: 0, r: '' }; });
      made.forEach(function (it) { st.items.push(it); });
      ta.value = ''; save(); render();
      say(add.length < tasks.length ? 'Added ' + add.length + '. The queue is full at ' + MAX + ' tasks. Clear finished ones to make room.' : 'Added ' + add.length + ' task' + (add.length === 1 ? '' : 's') + '.', 5000);
      if (made.length && cloud !== 'off') pushNew(made).then(cloudGood, cloudFail);
    }));
    startBtn = mk('Start', 'ok', function () {
      if (st.run) { st.run = false; save(); render(); return; }
      if (first('p') < 0) { say('Add some tasks first.', 3000); return; }
      st.run = true; st.retryAt = 0; save(); render();
      if (st.fresh && D.querySelector('#log .m.user') && !busy()) fresh();
    });
    row.appendChild(startBtn);
    row.appendChild(mk('Retry failed', '', function () { st.items.forEach(function (i) { if (i.s === 'f') { i.s = 'p'; i.n = 0; i.r = ''; touch(i); } }); st.retryAt = 0; save(); render(); }));
    row.appendChild(mk('Clear finished', '', function () {
      st.items.forEach(function (i) { if (i.s !== 'p' && i.id) st.del.push(i.id); });
      st.items = st.items.filter(function (i) { return i.s === 'p'; }); save(); render(); flush();
    }));
    row.appendChild(mk('Clear all', '', function () {
      if (!confirm('Remove every task from the queue?')) return;
      st.items.forEach(function (i) { if (i.id) st.del.push(i.id); });
      st.items = []; st.run = false; save(); render(); flush();
    }));
    panel.appendChild(row);
    var row2 = D.createElement('div'); row2.className = 'row'; row2.style.marginTop = '.4rem';
    var fi = D.createElement('input'); fi.type = 'file'; fi.accept = '.txt,.csv,.md,text/plain'; fi.hidden = true;
    fi.onchange = function () {
      var f = fi.files && fi.files[0]; if (!f) return;
      if (f.size > 400000) { say('That file is too big. Use a list of up to ' + MAX + ' lines.', 4000); fi.value = ''; return; }
      var rd = new FileReader();
      rd.onload = function () { ta.value = (ta.value ? ta.value + '\n' : '') + String(rd.result || ''); say('Loaded ' + parse(ta.value).length + ' lines. Check them, then press Add to queue.', 5000); fi.value = ''; };
      rd.readAsText(f);
    };
    row2.appendChild(fi);
    row2.appendChild(mk('Import list from file', 'sm', function () { fi.click(); }));
    row2.appendChild(mk('Download report', 'sm', report));
    var sel = D.createElement('select'); sel.title = 'Show which tasks';
    [['all', 'Show all'], ['p', 'Waiting'], ['d', 'Done'], ['f', 'Failed']].forEach(function (o) { var op = D.createElement('option'); op.value = o[0]; op.textContent = o[1]; sel.appendChild(op); });
    sel.onchange = function () { view = sel.value; shown = 150; render(); };
    row2.appendChild(sel);
    row2.appendChild(mk('Sync now', 'sm', function () { if (working) { say('Wait until the current task finishes.', 3000); return; } synced = false; syncStart(true); }));
    panel.appendChild(row2);
    var lab = D.createElement('label'); lab.style.fontWeight = '500'; freshCb = D.createElement('input'); freshCb.type = 'checkbox';
    freshCb.onchange = function () { st.fresh = freshCb.checked; save(); };
    lab.appendChild(freshCb); lab.appendChild(D.createTextNode(' Start every task in a fresh chat (saves quota, recommended)')); panel.appendChild(lab);
    var bl = D.createElement('label'); bl.style.fontWeight = '500'; bl.appendChild(D.createTextNode('Tasks per request: '));
    batchSel = D.createElement('select');
    [1, 2, 3, 5, 10].forEach(function (n) { var op = D.createElement('option'); op.value = String(n); op.textContent = n === 1 ? '1 (one by one, most careful)' : n + ' at a time'; batchSel.appendChild(op); });
    batchSel.onchange = function () { st.batch = parseInt(batchSel.value, 10) || 1; save(); };
    bl.appendChild(batchSel); panel.appendChild(bl);
    var bh = D.createElement('p'); bh.className = 'hint'; bh.textContent = 'Sending several tasks in one request uses far fewer requests, so the daily limit lasts much longer. Best for simple repeated jobs such as product descriptions. Use 1 for tricky fixes. If a batch fails, its tasks are tried again one by one. Check the results line of each task.'; panel.appendChild(bh);
    barEl = D.createElement('div'); barEl.style.cssText = 'height:8px;border-radius:99px;background:rgba(127,127,127,.25);overflow:hidden;margin:.5rem 0 .3rem';
    var fill = D.createElement('div'); fill.style.cssText = 'height:100%;width:0;background:var(--ok,#15803d);transition:width .3s'; barEl.appendChild(fill); panel.appendChild(barEl);
    infoEl = D.createElement('p'); infoEl.className = 'hint'; panel.appendChild(infoEl);
    cloudEl = D.createElement('p'); cloudEl.className = 'hint'; panel.appendChild(cloudEl);
    listEl = D.createElement('ul'); listEl.style.cssText = 'list-style:none;margin:.4rem 0 0;padding:0;font-size:.85rem;max-height:40vh;overflow:auto'; panel.appendChild(listEl);
    var hint = D.createElement('p'); hint.className = 'hint'; hint.textContent = 'Keep this page open while the queue runs. It carries on through the 40-step pause, waits out Gemini limits, and resumes after a refresh. Pause stops it after the current task. Run the queue on one device at a time.'; panel.appendChild(hint);
    log.parentNode.insertBefore(panel, log);
    render();
    syncStart();
    setInterval(step, 1500);
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();
})();
