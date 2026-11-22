import assert from 'node:assert/strict';
import { parseCsv, pgArray, toBool, toNum, toJson, toDate } from './csv.mjs';

// Quotes, escaped quotes, commas and line breaks inside a field, CRLF, BOM, trailing newline.
const rows = parseCsv('﻿id,name,description\r\na,"Hello, ""World""","line1\nline2"\r\nb,Plain,\r\n');
assert.equal(rows.length, 2);
assert.deepEqual(rows[0], { id: 'a', name: 'Hello, "World"', description: 'line1\nline2' });
assert.deepEqual(rows[1], { id: 'b', name: 'Plain', description: '' });

// Postgres arrays and JSON arrays.
assert.deepEqual(pgArray('{}'), []);
assert.deepEqual(pgArray(''), []);
assert.deepEqual(pgArray('{a,b}'), ['a', 'b']);
assert.deepEqual(pgArray('{"https://x/a b.jpg","c,d"}'), ['https://x/a b.jpg', 'c,d']);
assert.deepEqual(pgArray('["u1","u2"]'), ['u1', 'u2']);

// Scalars.
assert.equal(toBool('true'), true);
assert.equal(toBool('f'), false);
assert.equal(toNum(''), null);
assert.equal(toNum('448.50'), 448.5);
assert.deepEqual(toJson('[{"name":"x","qty":2}]'), [{ name: 'x', qty: 2 }]);
assert.equal(toJson('not json'), null);
assert.equal(toDate('2026-11-18 17:55:50.899135+00'), '2026-11-18 17:55:50.899Z');

console.log('pocketbase csv helpers: all checks passed.');
