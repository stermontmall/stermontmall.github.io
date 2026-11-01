// Read-only daily sales and service-lead report for SterMont Arcade.
// Uses the Supabase service-role secret only in GitHub Actions; never exposes customer contact details.
// Reports counts and internal reference IDs so staff can follow up in the existing admin.
import { writeFileSync } from 'node:fs';

const BASE = process.env.SUPABASE_URL || 'https://oewvtbnmyombbtggamor.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_KEY;
const now = new Date();
const since30 = new Date(now.getTime() - 30 * 86400000).toISOString();
const staleBefore = new Date(now.getTime() - 24 * 3600000).toISOString();

if (!KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY. Add it in GitHub repository Settings > Secrets and variables > Actions.');
  process.exit(1);
}

async function readTable(table, select, filters = '') {
  const url = BASE + '/rest/v1/' + table + '?select=' + encodeURIComponent(select) +
    '&created_at=gte.' + encodeURIComponent(since30) + '&order=created_at.desc&limit=5000' + filters;
  const response = await fetch(url, {
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(table + ' query failed (' + response.status + '): ' + (await response.text()).slice(0, 500));
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error(table + ' returned an unexpected response.');
  return rows;
}

const [orders, quotes] = await Promise.all([
  readTable('orders', 'id,ref,created_at,subtotal,status,method'),
  readTable('service_quotes', 'id,ref,created_at,service_name,status,preferred_date,county')
]);

const staleOrders = orders.filter(x => x.status === 'new' && x.created_at < staleBefore);
const staleQuotes = quotes.filter(x => x.status === 'new' && x.created_at < staleBefore);
const sum = (rows, statuses) => rows.filter(x => statuses.includes(x.status)).reduce((n, x) => n + (Number(x.subtotal) || 0), 0);
const paidRevenue = sum(orders, ['paid', 'confirmed', 'delivered']);
const ksh = n => 'KSh ' + Math.round(n).toLocaleString('en-KE');
const date = now.toISOString().slice(0, 10);

let md = '# SterMont daily sales & service leads\n\n';
md += 'Report date: ' + date + ' (last 30 days; follow-up queue checks items older than 24 hours).\n\n';
md += '## Sales\n\n';
md += '- Orders received: **' + orders.length + '**\n';
md += '- New / awaiting action: **' + orders.filter(x => x.status === 'new').length + '**\n';
md += '- Paid, confirmed or delivered: **' + orders.filter(x => ['paid','confirmed','delivered'].includes(x.status)).length + '**\n';
md += '- Cancelled: **' + orders.filter(x => x.status === 'cancelled').length + '**\n';
md += '- Value of paid / confirmed / delivered orders: **' + ksh(paidRevenue) + '** (based on stored order subtotals)\n';
md += '- New orders older than 24 hours: **' + staleOrders.length + '**\n\n';
md += '## Service enquiries\n\n';
md += '- Quote requests received: **' + quotes.length + '**\n';
md += '- New enquiries: **' + quotes.filter(x => x.status === 'new').length + '**\n';
md += '- Contacted / quoted: **' + quotes.filter(x => ['contacted','quoted'].includes(x.status)).length + '**\n';
md += '- Won: **' + quotes.filter(x => x.status === 'won').length + '**\n';
md += '- New enquiries older than 24 hours: **' + staleQuotes.length + '**\n\n';

if (staleOrders.length) {
  md += '## Orders needing follow-up\n\n';
  md += staleOrders.slice(0, 50).map(x => '- ' + x.ref + ' — ' + x.status + ' — ' + x.created_at.slice(0, 16).replace('T', ' ') + ' UTC').join('\n') + '\n\n';
}
if (staleQuotes.length) {
  md += '## Service enquiries needing follow-up\n\n';
  md += staleQuotes.slice(0, 50).map(x => '- ' + x.ref + ' — ' + x.service_name + ' — ' + x.created_at.slice(0, 16).replace('T', ' ') + ' UTC').join('\n') + '\n\n';
}
md += '> Privacy: this report intentionally excludes customer names, phone numbers, email addresses and street addresses. Open the authorised admin to contact customers. This report does not send messages or change order/quote statuses.\n';
writeFileSync('sales-leads-report.md', md);
writeFileSync('sales-leads-count.txt', String(staleOrders.length + staleQuotes.length));
console.log(md);
