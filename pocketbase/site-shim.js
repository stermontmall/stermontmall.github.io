/* Interim shim: lets the existing site keep calling Supabase REST (https://<ref>.supabase.co/rest/v1/<table>?...)
 * while the data actually lives in PocketBase. Load it BEFORE any other site script, after setting
 *   window.STM_PB_URL = 'https://<your-instance>.pockethost.io';
 * Only the tables below are intercepted; every other request passes through untouched (and will keep failing while Supabase is blocked).
 * Not included yet: Supabase Auth endpoints (/auth/v1) and RPC functions (/rest/v1/rpc/...). See README.
 * Writes: POST for any table; PATCH/DELETE only with ONE equality filter on the key (e.g. ?id=eq.abc), never bulk.
 * Staff permissions are enforced by PocketBase rules, not by this script. The PocketBase user token is read from
 * localStorage key "stm.pb.token" (set by the login adapter that comes next).
 */
(function (root) {
  'use strict';
  var TABLES = {
    products:               { key: 'pid',    keyOut: 'id', cost: true },
    categories:             { key: 'cat_id', keyOut: 'id', numericKey: true },
    product_slug_redirects: {},
    orders:                 {},
    reviews:                {},
    vouchers:               {},
  };
  var NUMERIC = /^(category_id|parent_id|price|old_price|stock|low_at|sort_order|top_sort|rating|subtotal|discount|value|min_order|max_uses|used_count|pay_amount|cat_id)$/;
  var BOOLEAN = /^(active|featured|is_promo|public_offer|first_order_only|pay_verified)$/;
  var NAME = /^[a-z_][a-z0-9_]*$/;
  var RESERVED = { select: 1, order: 1, limit: 1, offset: 1, apikey: 1 };
  var catCache = null;

  function fail(status, message) { var e = new Error(message); e.status = status; return e; }
  function token() { try { return root.localStorage.getItem('stm.pb.token') || ''; } catch (e) { return ''; } }
  function pbUrl() { return String(root.STM_PB_URL || '').replace(/\/+$/, ''); }
  function map(table, field) { var t = TABLES[table]; if (t && t.key && field === 'id') return t.key; if (table === 'categories' && field === 'created_at') return 'created'; return field; }
  function checkName(n) { if (!NAME.test(n)) throw fail(400, 'Unsupported column name: ' + n); return n; }

  function literal(field, raw) {
    if (BOOLEAN.test(field) && /^(true|false)$/.test(raw)) return raw;
    if ((NUMERIC.test(field) || field === 'id') && /^-?\d+(\.\d+)?$/.test(raw)) return raw;
    return JSON.stringify(raw);
  }

  // PostgREST filter value "eq.true", "in.(a,b)", "ilike.*foo*", "is.null" -> PocketBase filter expression.
  function filterExpr(table, field, value) {
    checkName(field);
    var f = map(table, field), dot = value.indexOf('.');
    if (dot < 0) throw fail(400, 'Bad filter for ' + field);
    var op = value.slice(0, dot), arg = value.slice(dot + 1), lit = function (v) { return literal(field, v); };
    switch (op) {
      case 'eq': return f + ' = ' + lit(arg);
      case 'neq': return f + ' != ' + lit(arg);
      case 'gt': return f + ' > ' + lit(arg);
      case 'gte': return f + ' >= ' + lit(arg);
      case 'lt': return f + ' < ' + lit(arg);
      case 'lte': return f + ' <= ' + lit(arg);
      case 'like': case 'ilike': return f + ' ~ ' + JSON.stringify(arg.replace(/^\*+|\*+$/g, ''));
      case 'is': return arg === 'null' ? '(' + f + ' = "" || ' + f + ' = null)' : f + ' = ' + arg;
      case 'in': {
        var items = arg.replace(/^\(|\)$/g, '').split(',').map(function (s) { return s.trim().replace(/^"|"$/g, ''); }).filter(Boolean);
        if (!items.length) return 'id = "__none__"';
        return '(' + items.map(function (v) { return f + ' = ' + lit(v); }).join(' || ') + ')';
      }
      default: throw fail(501, 'Filter operator not supported: ' + op);
    }
  }

  function parseQuery(table, qs) {
    var p = new URLSearchParams(qs || ''), filters = [], eqKey = null;
    p.forEach(function (value, key) {
      if (RESERVED[key]) return;
      if (key === 'or' || key === 'and' || key === 'not') throw fail(501, 'Complex filters (' + key + ') are not supported by the interim shim');
      filters.push(filterExpr(table, key, value));
      if (key === 'id' && value.indexOf('eq.') === 0) eqKey = value.slice(3);
    });
    var select = p.get('select') || '*', embed = /categories\s*\(([^)]*)\)/.exec(select), fields = null;
    if (select.trim() !== '*') {
      fields = select.replace(/[a-z_]+\s*\([^)]*\)/g, '').split(',').map(function (s) { return s.trim(); }).filter(Boolean).map(function (n) { return map(table, checkName(n)); });
      if (embed && fields.indexOf('category_id') < 0) fields.push('category_id');
    }
    var sort = (p.get('order') || '').split(',').filter(Boolean).map(function (s) {
      var bits = s.split('.'); return (bits[1] === 'desc' ? '-' : '') + map(table, checkName(bits[0]));
    }).join(',');
    return {
      filter: filters.join(' && '), fields: fields, sort: sort, eqKey: eqKey, embed: embed ? embed[1].split(',').map(function (s) { return s.trim(); }) : null,
      limit: p.has('limit') ? Math.max(0, parseInt(p.get('limit'), 10) || 0) : null, offset: p.has('offset') ? Math.max(0, parseInt(p.get('offset'), 10) || 0) : 0,
      wantsCost: select === '*' || /(^|,)\s*cost\s*(,|$)/.test(select),
    };
  }

  function isoDate(v) { return typeof v === 'string' && /^\d{4}-\d\d-\d\d \d/.test(v) ? v.replace(' ', 'T') : v; }
  function toRow(table, rec) {
    var t = TABLES[table] || {}, row = {};
    Object.keys(rec).forEach(function (k) {
      if (k === 'collectionId' || k === 'collectionName' || k === 'expand') return;
      if (k === 'id') { if (!t.key) row.id = rec.id; return; }
      if (k === 'created' || k === 'updated') { if (!rec.created_at && k === 'created') row.created_at = isoDate(rec[k]); return; }
      row[k === t.key ? 'id' : k] = isoDate(rec[k]);
    });
    return row;
  }
  function toBody(table, row) {
    var t = TABLES[table] || {}, out = {};
    Object.keys(row).forEach(function (k) { if (k === 'cost' && t.cost) return; out[k === 'id' && t.key ? t.key : k] = row[k]; });
    return out;
  }

  async function pb(path, opts) {
    var base = pbUrl(); if (!base) throw fail(500, 'STM_PB_URL is not set');
    opts = opts || {};
    var headers = { 'Content-Type': 'application/json' }, tk = token(); if (tk) headers.Authorization = tk;
    var res = await root.__stmRealFetch(base + path, { method: opts.method || 'GET', headers: headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) });
    var text = await res.text(), data = {}; try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { raw: text }; }
    if (!res.ok) throw fail(res.status, (data && data.message) || ('PocketBase HTTP ' + res.status));
    return data;
  }
  function q(o) { var s = new URLSearchParams(); Object.keys(o).forEach(function (k) { if (o[k] !== '' && o[k] != null) s.set(k, o[k]); }); return s.toString(); }

  async function listAll(table, qy, want) {
    var items = [], page = 1, per = 200, total = null, skip = qy.offset, need = qy.limit == null ? Infinity : qy.offset + qy.limit;
    while (items.length < need && page <= 100) {
      var r = await pb('/api/collections/' + table + '/records?' + q({ page: page, perPage: per, filter: qy.filter, sort: qy.sort, fields: qy.fields ? qy.fields.join(',') : '' }));
      items = items.concat(r.items || []); total = r.totalItems; if (!r.items || r.items.length < per) break; page++;
    }
    items = items.slice(skip, qy.limit == null ? undefined : skip + qy.limit);
    return { items: items, total: total };
  }

  async function categories() {
    if (catCache && Date.now() - catCache.at < 600000) return catCache.map;
    var r = await listAll('categories', { filter: '', sort: '', fields: null, offset: 0, limit: null }), m = {};
    r.items.forEach(function (c) { m[c.cat_id] = c; }); catCache = { at: Date.now(), map: m }; return m;
  }

  async function select(table, qs, accept) {
    var qy = parseQuery(table, qs), r = await listAll(table, qy), rows = r.items.map(function (rec) { return toRow(table, rec); });
    if (qy.embed) {
      var cm = await categories();
      rows.forEach(function (row) { var c = cm[row.category_id]; row.categories = c ? qy.embed.reduce(function (o, k) { if (k) o[k] = c[k]; return o; }, {}) : null; });
    }
    if (TABLES[table].cost && qy.wantsCost && token()) {
      try {
        var costs = await listAll('product_costs', { filter: '', sort: '', fields: null, offset: 0, limit: null }), cm2 = {};
        costs.items.forEach(function (c) { cm2[c.pid] = c.cost; });
        rows.forEach(function (row) { if (row.id in cm2) row.cost = cm2[row.id]; });
      } catch (e) { /* not staff: cost stays hidden */ }
    }
    var headers = { 'Content-Type': 'application/json', 'Content-Range': (rows.length ? qy.offset + '-' + (qy.offset + rows.length - 1) : '*') + '/' + (r.total == null ? '*' : r.total) };
    if (/vnd\.pgrst\.object/.test(accept || '')) {
      if (rows.length !== 1) return new Response(JSON.stringify({ message: 'Expected a single row, got ' + rows.length }), { status: 406, headers: headers });
      return new Response(JSON.stringify(rows[0]), { status: 200, headers: headers });
    }
    return new Response(JSON.stringify(rows), { status: 200, headers: headers });
  }

  async function findOne(table, qs) {
    var qy = parseQuery(table, qs);
    if (!qy.filter || qy.eqKey == null) throw fail(400, 'Refusing bulk write: use exactly one ?id=eq.<value> filter');
    var r = await pb('/api/collections/' + table + '/records?' + q({ filter: qy.filter, perPage: 2, fields: 'id' + (TABLES[table].key ? ',' + TABLES[table].key : '') }));
    if (!r.items || r.items.length !== 1) throw fail(404, 'No single matching record');
    return r.items[0];
  }

  async function saveCost(table, row, pid) {
    if (!TABLES[table].cost || row.cost === undefined) return;
    var ex = await pb('/api/collections/product_costs/records?' + q({ filter: 'pid = ' + JSON.stringify(pid), perPage: 1, fields: 'id' }));
    if (ex.items && ex.items[0]) await pb('/api/collections/product_costs/records/' + ex.items[0].id, { method: 'PATCH', body: { cost: row.cost } });
    else await pb('/api/collections/product_costs/records', { method: 'POST', body: { pid: pid, cost: row.cost } });
  }

  async function write(table, method, qs, init) {
    var raw = init && init.body ? JSON.parse(init.body) : null, prefer = (init && init.headers && (init.headers.Prefer || init.headers.prefer)) || '';
    var out = [];
    if (method === 'POST') {
      var list = Array.isArray(raw) ? raw : [raw];
      for (var i = 0; i < list.length; i++) {
        var rec = await pb('/api/collections/' + table + '/records', { method: 'POST', body: toBody(table, list[i]) });
        await saveCost(table, list[i], list[i].id);
        out.push(toRow(table, rec));
      }
    } else if (method === 'PATCH') {
      var one = await findOne(table, qs), body = toBody(table, raw || {});
      var upd = Object.keys(body).length ? await pb('/api/collections/' + table + '/records/' + one.id, { method: 'PATCH', body: body }) : one;
      await saveCost(table, raw || {}, one[TABLES[table].key]);
      out.push(toRow(table, upd));
    } else if (method === 'DELETE') {
      var del = await findOne(table, qs); await pb('/api/collections/' + table + '/records/' + del.id, { method: 'DELETE' }); out.push(toRow(table, del));
    }
    var rep = /return=representation/.test(prefer);
    return new Response(rep ? JSON.stringify(out) : null, { status: rep ? (method === 'POST' ? 201 : 200) : 204, headers: { 'Content-Type': 'application/json' } });
  }

  async function handle(table, qs, init, accept) {
    var method = ((init && init.method) || 'GET').toUpperCase();
    try {
      if (method === 'GET' || method === 'HEAD') return await select(table, qs, accept);
      return await write(table, method, qs, init);
    } catch (e) {
      return new Response(JSON.stringify({ message: e.message, code: 'STM_PB_SHIM' }), { status: e.status || 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  var REST = /^https:\/\/[a-z0-9-]+\.supabase\.co\/rest\/v1\/([a-z_]+)(?:\?(.*))?$/i;
  function install() {
    if (!root.fetch || root.__stmRealFetch) return;
    root.__stmRealFetch = root.fetch.bind(root);
    root.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '', m = REST.exec(url);
      if (!m || !pbUrl() || !TABLES[m[1]]) return root.__stmRealFetch(input, init);
      var hdr = (init && init.headers) || (input && input.headers) || {}, accept = typeof hdr.get === 'function' ? hdr.get('Accept') : (hdr.Accept || hdr.accept);
      if (!init && input && typeof input === 'object') init = { method: input.method };
      return handle(m[1], m[2], init, accept);
    };
  }

  root.STM_PB_SHIM = { install: install, parseQuery: parseQuery, filterExpr: filterExpr, toRow: toRow, toBody: toBody };
  if (root.STM_PB_URL) install();
})(typeof globalThis !== 'undefined' ? globalThis : this);
