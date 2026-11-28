import assert from 'node:assert/strict';
import { splitInspectionResults, inspectionRaw } from './google-index-results.mjs';

const rows = [
  { url: 'https://stermontarcade.co.ke/p/a.html', verdict: 'PASS', robots: 'ALLOWED', fetch: 'SUCCESSFUL', indexing: 'INDEXING_ALLOWED', raw: { verdict: 'PASS' } },
  { url: 'https://stermontarcade.co.ke/p/b.html', verdict: 'FAIL', state: 'Discovered - currently not indexed', robots: 'ALLOWED', fetch: 'SOFT_404', indexing: 'INDEXING_ALLOWED', userCanonical: 'https://stermontarcade.co.ke/p/b.html', raw: { verdict: 'FAIL' } },
  { url: 'https://stermontarcade.co.ke/p/c.html', error: '429 rate limited', rateLimited: true }
];
const split = splitInspectionResults(rows);
assert.equal(split.checked, 2);
assert.equal(split.indexedRows.length, 1);
assert.equal(split.failedRows.length, 1);
assert.equal(split.errors.length, 1);
const raw = inspectionRaw(split.failedRows[0], '2026-11-28T08:00:00.000Z');
assert.equal(raw.robots_txt_state, 'ALLOWED');
assert.equal(raw.page_fetch_state, 'SOFT_404');
assert.equal(raw.indexing_state, 'INDEXING_ALLOWED');
assert.equal(raw.google_index_status.verdict, 'FAIL');
console.log('Google inspection diagnostics persistence tests passed.');
