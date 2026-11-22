// Creates the interim-shop collections and access rules on a PocketBase instance (v0.23+). Safe to run again.
// Usage:  PB_URL=https://xxxx.pockethost.io PB_ADMIN_EMAIL=you@example.com PB_ADMIN_PASSWORD=... node pocketbase/setup.mjs
// Nothing is deleted. Existing collections only get missing fields added and their rules refreshed.
import { collections, SYSTEM_FIELDS, usersPatch } from './schema.mjs';

const PB = (process.env.PB_URL || '').replace(/\/+$/, '');
const EMAIL = process.env.PB_ADMIN_EMAIL, PASSWORD = process.env.PB_ADMIN_PASSWORD;
if (!PB || !EMAIL || !PASSWORD) { console.error('Set PB_URL, PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD first.'); process.exit(1); }

let token = '';
async function api(path, { method = 'GET', body, allow = [] } = {}) {
  const r = await fetch(PB + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  let data; try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!r.ok && !allow.includes(r.status)) {
    const err = new Error(`${method} ${path} -> HTTP ${r.status}: ${JSON.stringify(data).slice(0, 600)}`);
    err.status = r.status; err.data = data; throw err;
  }
  return { status: r.status, data };
}

async function login() {
  // PocketBase 0.23+ uses the _superusers collection; older versions use /api/admins.
  for (const path of ['/api/collections/_superusers/auth-with-password', '/api/admins/auth-with-password']) {
    const r = await api(path, { method: 'POST', body: { identity: EMAIL, password: PASSWORD }, allow: [400, 404] });
    if (r.status === 200 && r.data.token) { token = r.data.token; return; }
  }
  throw new Error('Could not sign in as the PocketBase admin. Check PB_URL, email and password.');
}

const rules = c => ({ listRule: c.listRule, viewRule: c.viewRule, createRule: c.createRule, updateRule: c.updateRule, deleteRule: c.deleteRule });

async function ensureCollection(def) {
  const existing = await api(`/api/collections/${def.name}`, { allow: [404] });
  if (existing.status === 200) {
    const have = new Set(existing.data.fields.map(f => f.name));
    const missing = def.fields.filter(f => !have.has(f.name));
    await api(`/api/collections/${def.name}`, { method: 'PATCH', body: { fields: [...existing.data.fields, ...missing], indexes: def.indexes, ...rules(def) } });
    console.log(`updated   ${def.name} (+${missing.length} fields, rules refreshed)`);
    return;
  }
  // First try with explicit system fields; if the server rejects that, retry with only our fields.
  const attempts = [[...SYSTEM_FIELDS, ...def.fields], def.fields];
  let lastErr;
  for (const fields of attempts) {
    try {
      await api('/api/collections', { method: 'POST', body: { name: def.name, type: 'base', fields, indexes: def.indexes, ...rules(def) } });
      console.log(`created   ${def.name}`);
      return;
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

async function patchUsers() {
  const users = await api('/api/collections/users');
  const fields = users.data.fields.some(f => f.name === 'role') ? users.data.fields : [...users.data.fields, usersPatch.extraField];
  await api('/api/collections/users', { method: 'PATCH', body: { fields, createRule: usersPatch.createRule, updateRule: usersPatch.updateRule } });
  console.log('updated   users (role field added; nobody can grant themselves staff)');
}

async function enableBatch() {
  try {
    await api('/api/settings', { method: 'PATCH', body: { batch: { enabled: true, maxRequests: 100, timeout: 30, maxBodySize: 0 } } });
    console.log('enabled   batch API (used by the importer)');
  } catch (e) { console.warn('warning   could not enable the batch API automatically; the importer will fall back to slower single requests.\n         ' + e.message); }
}

await login();
console.log('signed in to', PB);
await patchUsers();
for (const def of collections) await ensureCollection(def);
await enableBatch();
console.log('\nDone. Next: create your staff accounts in the PocketBase admin (users collection, role = staff), then run import.mjs.');
