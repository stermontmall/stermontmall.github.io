// Runs setup.mjs and import.mjs against a tiny FAKE PocketBase server to check the scripts' own logic
// (request shapes, resuming, filtering, cost split). It does NOT prove behaviour of a real PocketBase.
import http from 'node:http';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const db = { collections: { users: { name: 'users', fields: [{ name: 'email', type: 'email' }] } }, records: {}, settings: null };
const hits = [];

const server = http.createServer((req, res) => {
  let raw = ''; req.on('data', c => raw += c); req.on('end', () => {
    const body = raw ? JSON.parse(raw) : {}; const url = new URL(req.url, 'http://x'); const p = url.pathname;
    hits.push(req.method + ' ' + p);
    const send = (s, o) => { res.writeHead(s, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
    if (p === '/api/collections/_superusers/auth-with-password') return send(200, { token: 'T' });
    if (req.headers.authorization !== 'T') return send(401, { message: 'no' });
    if (p === '/api/settings') { db.settings = body; return send(200, {}); }
    if (p === '/api/batch') {
      return send(200, body.requests.map(r => { const c = r.url.split('/')[3]; (db.records[c] ||= []).push(r.body); return { status: 200, body: r.body }; }));
    }
    let m = p.match(/^\/api\/collections\/([^/]+)\/records$/);
    if (m) {
      const c = m[1]; if (!db.collections[c]) return send(404, {});
      if (req.method === 'GET') return send(200, { items: (db.records[c] || []).slice(0, 500) });
      (db.records[c] ||= []).push(body); return send(200, body);
    }
    m = p.match(/^\/api\/collections\/([^/]+)$/);
    if (m) {
      const c = m[1];
      if (req.method === 'GET') return db.collections[c] ? send(200, db.collections[c]) : send(404, {});
      if (req.method === 'PATCH') { Object.assign(db.collections[c], body); return send(200, db.collections[c]); }
    }
    if (p === '/api/collections' && req.method === 'POST') { db.collections[body.name] = body; return send(200, body); }
    send(404, { message: 'unhandled ' + p });
  });
});
await new Promise(r => server.listen(0, r));
const env = { ...process.env, PB_URL: 'http://127.0.0.1:' + server.address().port, PB_ADMIN_EMAIL: 'a@b.c', PB_ADMIN_PASSWORD: 'x' };
const execP = promisify(execFile);
// Async on purpose: the fake server lives in this process, so a blocking call would deadlock.
const run = async (script, ...a) => (await execP('node', [join(here, script), ...a], { env, encoding: 'utf8' })).stdout;

// 1. setup creates every collection and locks down users.
const out = await run('setup.mjs');
for (const name of ['categories', 'products', 'product_costs', 'vouchers', 'orders', 'reviews', 'product_slug_redirects']) assert.ok(db.collections[name], name + ' created');
assert.equal(db.collections.users.createRule, '@request.body.role:isset = false');
assert.ok(db.collections.users.fields.some(f => f.name === 'role'));
assert.equal(db.collections.product_costs.listRule, '@request.auth.role = "staff"');
assert.ok(!db.collections.products.fields.some(f => f.name === 'cost'), 'cost must not be on the public products collection');
assert.ok(db.settings?.batch?.enabled);
await run('setup.mjs'); // idempotent second run
assert.ok(out.includes('Done.'));

// 2. import: active-with-photo filter, cost split, array/JSON parsing.
const dir = mkdtempSync(join(tmpdir(), 'pbimp-'));
writeFileSync(join(dir, 'products.csv'),
  'id,category_id,name,price,cost,stock,low_at,featured,active,images,description,created_at\n'
  + 'p-one,31,"Kensil Guard, 3kg",5850,4500,1000,20,false,true,"{https://ik.example/a.png}","Line1\nLine2",2026-11-18 17:31:16.039411+00\n'
  + 'p-hidden,31,Hidden,100,80,1000,20,false,false,"{https://ik.example/b.png}",x,2026-11-18 17:31:16+00\n'
  + 'p-nophoto,31,No photo,100,80,1000,20,false,true,{},x,2026-11-18 17:31:16+00\n');
writeFileSync(join(dir, 'orders.csv'), 'ref,items,subtotal,created_at\nORD1,"[{""name"":""x"",""qty"":2}]",900,2026-11-20 10:00:00+00\n');
await run('import.mjs', '--dir', dir);
assert.equal(db.records.products.length, 1);
assert.equal(db.records.products[0].pid, 'p-one');
assert.deepEqual(db.records.products[0].images, ['https://ik.example/a.png']);
assert.equal(db.records.products[0].description, 'Line1\nLine2');
assert.equal(db.records.products[0].created_at, '2026-11-18 17:31:16.039Z');
assert.ok(!('cost' in db.records.products[0]), 'cost must not be imported into the public collection');
assert.deepEqual(db.records.product_costs, [{ pid: 'p-one', cost: 4500 }]);
assert.deepEqual(db.records.orders[0].items, [{ name: 'x', qty: 2 }]);

// 3. re-running skips what already exists only when the server lists it (fake server lists all stored rows).
db.records.products[0].pid = 'p-one';
await run('import.mjs', '--dir', dir);
assert.equal(db.records.products.length, 1, 'resume must not duplicate rows');

server.close();
console.log('pocketbase scripts (fake server): all checks passed.');
