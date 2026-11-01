import test from 'node:test';
import assert from 'node:assert/strict';

// Guardrail test: report text must never contain customer contact fields.
const source = await (await import('node:fs/promises')).readFile(new URL('./sales-leads-report.mjs', import.meta.url), 'utf8');
test('daily report is read-only and does not select customer contact details', () => {
  assert.match(source, /readTable\('orders', 'id,ref,created_at,subtotal,status,method'\)/);
  assert.match(source, /readTable\('service_quotes', 'id,ref,created_at,service_name,status,preferred_date,county'\)/);
  assert.doesNotMatch(source, /select[^\n]*(customer_name|phone|email|address)/i);
  assert.match(source, /does not send messages or change order\/quote statuses/);
});
