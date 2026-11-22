/* Stermont interim data adapter: bounded Supabase-js compatibility over PocketBase.
 * This adapter never contains superuser credentials. PocketBase API rules remain authoritative.
 */
(function (global) {
  "use strict";
  const PB_URL = (global.STM_PB_URL || "").replace(/\/+$/, "");
  const AUTH_KEY = "stm_pb_auth_v1";
  const PAGE_SIZE = 200;
  const MAX_READ_ROWS = 10000;
  let auth = { token: "", record: null };
  try { auth = JSON.parse(global.localStorage.getItem(AUTH_KEY) || "{}"); } catch (_) {}
  const listeners = new Set();

  function persist() { try { global.localStorage.setItem(AUTH_KEY, JSON.stringify(auth)); } catch (_) {} }
  function headers(extra) { return { "Content-Type": "application/json", ...(auth.token ? { Authorization: auth.token } : {}), ...(extra || {}) }; }
  async function api(url, options) {
    if (!PB_URL) throw new Error("STM_PB_URL is not configured");
    const response = await global.fetch(PB_URL + url, { ...(options || {}), headers: headers(options && options.headers) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(body.message || ("PocketBase HTTP " + response.status)); error.status = response.status; error.data = body.data; throw error; }
    return body;
  }
  function emit(event) {
    const session = auth.token ? { access_token: auth.token, user: auth.record } : null;
    listeners.forEach(fn => { try { fn(event, session); } catch (error) { global.console && global.console.error(error); } });
  }
  // Supabase IDs are stored separately because PocketBase owns its native record ID.
  // Auth users are the exception: their native PocketBase ID is the public user ID.
  function fieldName(table, name) { return name === "id" && table !== "users" ? "supabase_id" : name; }
  function encodeFilter(table, filters) {
    return filters.map(filter => {
      const key = fieldName(table, filter.field);
      if (filter.op === "__in") return "(" + filter.value.map(value => key + " = " + literal(value)).join(" || ") + ")";
      return key + " " + filter.op + " " + literal(filter.value);
    }).join(" && ");
  }
  function literal(value) {
    if (value === null) return "null";
    if (typeof value === "object") return JSON.stringify(value);
    if (typeof value === "string") return JSON.stringify(value);
    return String(value);
  }
  function queryString(query, page) {
    const params = new URLSearchParams();
    if (query.filters.length) params.set("filter", encodeFilter(query.table, query.filters));
    if (query.sort.length) params.set("sort", query.sort.map(item => (item.desc ? "-" : "") + fieldName(query.table, item.field)).join(","));
    if (query.columns && query.columns !== "*") {
      const fields = query.columns.split(",").map(value => value.trim()).filter(Boolean).map(value => fieldName(query.table, value));
      // Request the legacy ID column even when the caller explicitly selects id.
      if (query.table !== "users" && query.columns.split(",").map(x => x.trim()).includes("id") && !fields.includes("supabase_id")) fields.push("supabase_id");
      params.set("fields", fields.join(","));
    }
    params.set("perPage", String(PAGE_SIZE));
    params.set("page", String(page));
    return params.toString();
  }
  function mapRecord(table, record) {
    if (!record) return record;
    const output = { ...record };
    if (table !== "users" && output.supabase_id !== undefined) {
      output.id = table === "categories" ? Number(output.supabase_id) : output.supabase_id;
      delete output.supabase_id;
    }
    if (table === "products") delete output.cost;
    if (table === "categories" && output.parent_id === 0) output.parent_id = null;
    return output;
  }
  class Query {
    constructor(table) {
      this.table = table; this.action = "select"; this.columns = "*"; this.filters = []; this.sort = [];
      this.limitValue = null; this.rangeStart = 0; this.rangeEnd = null; this.payload = null;
      this.returning = false; this.one = false;
    }
    select(columns) { this.columns = columns || "*"; this.returning = true; return this; }
    eq(field, value) { this.filters.push({ field, op: "=", value }); return this; }
    neq(field, value) { this.filters.push({ field, op: "!=", value }); return this; }
    gt(field, value) { this.filters.push({ field, op: ">", value }); return this; }
    gte(field, value) { this.filters.push({ field, op: ">=", value }); return this; }
    lt(field, value) { this.filters.push({ field, op: "<", value }); return this; }
    lte(field, value) { this.filters.push({ field, op: "<=", value }); return this; }
    like(field, value) { this.filters.push({ field, op: "~", value }); return this; }
    ilike(field, value) { this.filters.push({ field, op: "~", value }); return this; }
    in(field, values) { this.filters.push({ field, op: "__in", value: values }); return this; }
    is(field, value) { this.filters.push({ field, op: "=", value }); return this; }
    order(field, options) { this.sort.push({ field, desc: !!(options && options.ascending === false) }); return this; }
    limit(value) { this.limitValue = Math.max(0, Number(value) || 0); return this; }
    range(start, end) { this.rangeStart = Math.max(0, Number(start) || 0); this.rangeEnd = Math.max(this.rangeStart, Number(end) || this.rangeStart); return this; }
    single() { this.one = true; return this; }
    maybeSingle() { this.one = true; return this; }
    insert(rows) { this.action = "insert"; this.payload = Array.isArray(rows) ? rows : [rows]; return this; }
    update(values) { this.action = "update"; this.payload = values; return this; }
    delete() { this.action = "delete"; return this; }
    async readAll() {
      const records = []; let page = 1; let totalItems = 0; let totalPages = 1;
      do {
        const result = await api("/api/collections/" + encodeURIComponent(this.table) + "/records?" + queryString(this, page));
        const items = result.items || [];
        records.push(...items);
        totalItems = Number(result.totalItems || 0); totalPages = Number(result.totalPages || 1);
        if (records.length >= MAX_READ_ROWS && page < totalPages) throw new Error("PocketBase compatibility read exceeded " + MAX_READ_ROWS + " records; add filters or pagination.");
        page += 1;
      } while (page <= totalPages && records.length < MAX_READ_ROWS);
      return { records, totalItems };
    }
    async execute() {
      try {
        if (this.action === "select") {
          const result = await this.readAll();
          let rows = result.records.slice(this.rangeStart, this.rangeEnd === null ? undefined : this.rangeEnd + 1);
          if (this.limitValue !== null) rows = rows.slice(0, this.limitValue);
          rows = rows.map(row => mapRecord(this.table, row));
          if (this.one) {
            if (rows.length > 1) throw new Error("Expected one record but received multiple");
            return { data: rows[0] || null, error: null, count: result.totalItems };
          }
          return { data: rows, error: null, count: result.totalItems };
        }
        if (this.action === "insert") {
          const rows = [];
          for (const input of this.payload || []) {
            const body = { ...input };
            if (this.table !== "users" && body.id !== undefined) { body.supabase_id = String(body.id); delete body.id; }
            const record = await api("/api/collections/" + encodeURIComponent(this.table) + "/records", { method: "POST", body: JSON.stringify(body) });
            rows.push(mapRecord(this.table, record));
          }
          return { data: this.returning ? rows : null, error: null, count: rows.length };
        }
        const found = await this.readAll();
        const changed = [];
        for (const record of found.records) {
          const recordUrl = "/api/collections/" + encodeURIComponent(this.table) + "/records/" + encodeURIComponent(record.id);
          if (this.action === "update") {
            const patch = { ...this.payload };
            if (this.table !== "users" && patch.id !== undefined) { patch.supabase_id = String(patch.id); delete patch.id; }
            changed.push(mapRecord(this.table, await api(recordUrl, { method: "PATCH", body: JSON.stringify(patch) })));
          } else if (this.action === "delete") {
            await api(recordUrl, { method: "DELETE" });
          }
        }
        return { data: this.returning ? changed : null, error: null, count: found.records.length };
      } catch (error) { return { data: null, error, count: null }; }
    }
    then(resolve, reject) { return this.execute().then(resolve, reject); }
  }
  const authApi = {
    getSession: async () => ({ data: { session: auth.token ? { access_token: auth.token, user: auth.record } : null }, error: null }),
    getUser: async () => ({ data: { user: auth.record || null }, error: null }),
    signInWithPassword: async ({ email, password }) => {
      try { const result = await api("/api/collections/users/auth-with-password", { method: "POST", body: JSON.stringify({ identity: email, password }) }); auth = { token: result.token, record: result.record }; persist(); emit("SIGNED_IN"); return { data: { user: result.record, session: { access_token: result.token, user: result.record } }, error: null }; }
      catch (error) { return { data: { user: null, session: null }, error }; }
    },
    signUp: async ({ email, password, options }) => {
      try { const data = options && options.data || {}; const result = await api("/api/collections/users/records", { method: "POST", body: JSON.stringify({ email, password, passwordConfirm: password, role: "customer", ...data }) }); return { data: { user: result, session: null }, error: null }; }
      catch (error) { return { data: { user: null, session: null }, error }; }
    },
    updateUser: async data => {
      try { if (!auth.record || !auth.record.id) throw new Error("Sign in first"); const patch = { ...data }; if (patch.password && !patch.passwordConfirm) patch.passwordConfirm = patch.password; const record = await api("/api/collections/users/records/" + encodeURIComponent(auth.record.id), { method: "PATCH", body: JSON.stringify(patch) }); auth.record = record; persist(); return { data: { user: record }, error: null }; }
      catch (error) { return { data: { user: null }, error }; }
    },
    signOut: async () => { auth = { token: "", record: null }; persist(); emit("SIGNED_OUT"); return { error: null }; },
    onAuthStateChange: callback => { listeners.add(callback); callback("INITIAL_SESSION", auth.token ? { access_token: auth.token, user: auth.record } : null); return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } }; }
  };
  const client = {
    from: table => new Query(table), auth: authApi,
    rpc: async () => ({ data: null, error: new Error("RPCs are not implemented in the interim PocketBase adapter; use a server-side PocketBase hook for privileged operations.") }),
    storage: { from: () => ({ getPublicUrl: key => ({ data: { publicUrl: key } }) }) }
  };
  global.STM_DB = client;
  global.supabase = { createClient: () => client };
})(window);
