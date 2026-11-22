// Checks pocketbase/site-shim.js against a FAKE PocketBase (query translation, paging, safety). Run: node pocketbase/site-shim.test.mjs
import assert from 'node:assert/strict';

const SB = 'https://oewvtbnmyombbtggamor.supabase.co';
const calls = [];
const store = {
  products: Array.from({ length: 450 }, (_, i) => ({ id: 'pb' + i, collectionId: 'x', collectionName: 'products', pid: 'p' + i, name: 'Item ' + i, price: 100 + i, active: true,
    category_id: i % 2 ? 31 : 99, images: ['https://ik/x.png'], created: '2026-11-18 17:31:16.039Z', created_at: '2026-11-18 17:31:16.039Z' })),
  categories: [{ id: 'c1', cat_id: 31, name: 'Pest control', slug: 'pest-control', created: '2026-10-01 00:00:00.000Z' }],
  product_costs: [{ id: 'k1', pid: 'p1', cost: 80 }],
  orders: [],
};
const store2 = { token: '' };
globalThis.localStorage = { getItem: k => (k === 'stm.pb.token' ? store2.token : null) };
globalThis.STM_PB_URL = 'http://pb.test';
globalThis.fetch = async (url, init = {}) => {
  const u = new URL(url); calls.push({ method: init.method || 'GET', path: u.pathname, params: Object.fromEntries(u.searchParams), body: init.body, auth: init.headers?.Authorization });
  const json = (s, o) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });
  const m = u.pathname.match(/^\/api\/collections\/([^/]+)\/records(?:\/(.+))?$/);
  if (!m) return json(200, { passthrough: url });
  const [, col, rid] = m, method = init.method || 'GET';
  if (method === 'GET') {
    if (col === 'product_costs' && !init.headers?.Authorization) return json(403, { message: 'forbidden' });
    const page = +u.searchParams.get('page') || 1, per = +u.searchParams.get('perPage') || 30, all = store[col] || [];
    const f = u.searchParams.get('filter') || '', one = f.match(/pid = "(\w+)"/);
    const rows = one ? all.filter(r => r.pid === one[1]) : all;
    return json(200, { page, perPage: per, totalItems: rows.length, items: rows.slice((page - 1) * per, page * per) });
  }
  if (method === 'POST') { const rec = { id: 'new1', ...JSON.parse(init.body) }; (store[col] ||= []).push(rec); return json(200, rec); }
  if (method === 'PATCH') return json(200, { id: rid, ...JSON.parse(init.body) });
  if (method === 'DELETE') return new Response(null, { status: 204 });
  return json(400, {});
};
await import('./site-shim.js');
const J = async r => (r.status === 204 ? null : r.json());
const last = () => calls[calls.length - 1];

// 1. List with column list, embed, order: ids mapped, embed joined, PocketBase internals hidden.
let r = await fetch(`${SB}/rest/v1/products?active=eq.true&select=id,name,price,images,categories(name,slug)&order=created_at.asc`);
let rows = await J(r);
assert.equal(r.status, 200);
assert.equal(rows.length, 450, 'must return the whole catalogue, not one page of 30');
assert.equal(rows[1].id, 'p1'); assert.equal(rows[1].name, 'Item 1');
assert.deepEqual(rows[1].categories, { name: 'Pest control', slug: 'pest-control' });
assert.equal(rows[0].categories, null);
assert.ok(!('collectionId' in rows[0]) && !('pid' in rows[0]));
assert.equal(rows[0].created_at, '2026-11-18T17:31:16.039Z');
const firstList = calls.find(c => c.path.endsWith('/products/records'));
assert.equal(firstList.params.filter, 'active = true');
assert.equal(firstList.params.sort, 'created_at');
assert.ok(firstList.params.fields.split(',').includes('pid') && firstList.params.fields.split(',').includes('category_id'));
assert.ok(!firstList.params.fields.includes('description'), 'must not download descriptions for list views');
assert.ok(!('cost' in rows[1]), 'cost hidden without a staff token');

// 2. limit/offset, in-filter, injection-safe names.
rows = await J(await fetch(`${SB}/rest/v1/products?select=id&limit=5&offset=10`)); assert.deepEqual(rows.map(x => x.id), ['p10', 'p11', 'p12', 'p13', 'p14']);
await fetch(`${SB}/rest/v1/products?id=in.(a,b)&select=id`); assert.equal(last().params.filter, '(pid = "a" || pid = "b")');
r = await fetch(`${SB}/rest/v1/products?${encodeURIComponent('name" || 1=1 || "')}=eq.x`); assert.equal(r.status, 400);
r = await fetch(`${SB}/rest/v1/products?or=(a.eq.1,b.eq.2)`); assert.equal(r.status, 501);

// 3. Safety: no bulk writes.
r = await fetch(`${SB}/rest/v1/products?active=eq.true`, { method: 'PATCH', body: JSON.stringify({ price: 1 }) }); assert.equal(r.status, 400);
r = await fetch(`${SB}/rest/v1/products`, { method: 'DELETE' }); assert.equal(r.status, 400);

// 4. Single-row PATCH by id, with cost routed to the staff-only collection.
store2.token = 'STAFFTOKEN';
r = await fetch(`${SB}/rest/v1/products?id=eq.p1`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ price: 150, cost: 90 }) });
assert.equal(r.status, 200);
const patch = calls.filter(c => c.method === 'PATCH');
assert.equal(patch[0].path, '/api/collections/products/records/pb1'); assert.deepEqual(JSON.parse(patch[0].body), { price: 150 });
assert.equal(patch[1].path, '/api/collections/product_costs/records/k1'); assert.deepEqual(JSON.parse(patch[1].body), { cost: 90 });
assert.equal(patch[0].auth, 'STAFFTOKEN');

// 5. Staff token: cost is merged into rows.
rows = await J(await fetch(`${SB}/rest/v1/products?select=id,cost&limit=3`)); assert.equal(rows[1].cost, 80);

// 6. Orders: anyone can create; representation returned.
store2.token = '';
r = await fetch(`${SB}/rest/v1/orders`, { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ ref: 'ORD1', items: [{ name: 'x', qty: 1 }], subtotal: 100 }) });
assert.equal(r.status, 201); assert.equal((await J(r))[0].ref, 'ORD1');
const orderPost = calls.filter(c => c.method === 'POST' && c.path.endsWith('/orders/records'));
assert.equal(orderPost.length, 1); assert.ok(!orderPost[0].auth);

// 7. Single-object header and pass-through for anything not handled (RPC, other tables).
r = await fetch(`${SB}/rest/v1/products?id=eq.p2&select=id`, { headers: { Accept: 'application/vnd.pgrst.object+json' } }); assert.equal((await J(r)).id, 'p2');
const before = calls.length;
r = await fetch(`${SB}/rest/v1/rpc/check_voucher`, { method: 'POST', body: '{}' });
assert.equal(calls.length, before + 1); assert.equal(last().path, '/rest/v1/rpc/check_voucher', 'RPC must pass through to the original fetch');

console.log('pocketbase site shim (fake PocketBase): all checks passed.');
