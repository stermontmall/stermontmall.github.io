// Offline checks for seo-search-performance.mjs (no network, no database).
import assert from 'node:assert/strict';
import { sync, fetchRows, day } from './seo-search-performance.mjs';

const now = Date.parse('2026-11-28T09:00:00Z');
assert.equal(day(1, now), '2026-11-27');

// paging keeps asking until a short page comes back
const asked = [];
const paged = await fetchRows(async b => { asked.push(b.startRow); return b.startRow < 4 ? [1, 2] : [3]; }, ['date'], 'a', 'b', 2);
assert.deepEqual(asked, [0, 2, 4]);
assert.equal(paged.length, 5);

const fake = saved => {
  const log = [], tx = [];
  const sql = (s, ...v) => { const text = s.join('?'); log.push(text); const q = { text, v }; q.then = ok => ok(text.includes('count(*)') ? [{ n: saved }] : []); return q; };
  // statements are collected unawaited, then sent together
  sql.transaction = async list => { tx.push(...list.map(q => q)); };
  return { sql, log, tx };
};
const wrap = f => { const sql = (s, ...v) => { const q = f.sql(s, ...v); return q; }; sql.transaction = f.sql.transaction; return sql; };
const query = async b => b.dimensions.length === 1
  ? [{ keys: ['2026-11-26'], clicks: 3, impressions: 40, position: 7 }]
  : Array.from({ length: 4500 }, (_, i) => ({ keys: ['2026-11-26', 'q' + i, 'https://x/p'], clicks: 0, impressions: 1, position: 5 }));

for (const [saved, start] of [[0, '2026-08-30'], [30, '2026-11-18']]) {
  const f = fake(saved);
  // a thenable inside an array is not awaited, matching the Neon driver
  const r = await sync({ sql: wrap(f), query, property: 'P', now });
  assert.equal(r.startDate, start);
  assert.equal(r.endDate, '2026-11-27');
  assert.equal(r.clicks, 3);
  assert.equal(r.detailRows, 4500);
  assert.equal(f.tx.length, 2 + 1 + 3);
}

// an empty answer from Google must not delete anything
const f = fake(30);
await assert.rejects(sync({ sql: wrap(f), query: async () => [], property: 'P', now }), /left unchanged/);
assert.equal(f.tx.length, 0);
assert.ok(!f.log.some(t => t.startsWith('DELETE')));
console.log('seo-search-performance tests passed');
