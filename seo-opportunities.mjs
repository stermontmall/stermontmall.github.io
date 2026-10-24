// Stermont Arcade - seo-opportunities
// Reads your real Google Search Console data (last 28 days) and prints a Markdown report of the fastest ranking wins:
//   1) "Almost page 1"  - searches where you rank 8-20 and people already see you. A small push moves these onto page 1.
//   2) "Low clicks"     - you rank in the top 7 and get seen a lot, but few people click. Fix the title/description.
//   3) "Top pages"      - your best pages by clicks, so you know what to copy.
// Uses the same secrets as seo-google-sitemaps.mjs (GitHub > Settings > Secrets and variables > Actions):
//   GSC_SERVICE_ACCOUNT_JSON, GSC_PROPERTY. Without them it prints how to turn it on and exits.
import { createSign } from 'node:crypto';

const raw = process.env.GSC_SERVICE_ACCOUNT_JSON, property = process.env.GSC_PROPERTY;
if (!raw || !property) {
  console.log('# Ranking opportunities\n\nNot switched on yet. Add the `GSC_SERVICE_ACCOUNT_JSON` and `GSC_PROPERTY` secrets (same ones as the sitemap ping) and run this again.');
  process.exit(0);
}

const key = JSON.parse(raw);
const b64 = o => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const head = b64({ alg: 'RS256', typ: 'JWT' });
const claim = b64({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
const sig = createSign('RSA-SHA256').update(`${head}.${claim}`).sign(key.private_key, 'base64url');
const tok = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${claim}.${sig}` }) }).then(r => r.json());
if (!tok.access_token) { console.error('Google sign-in failed:', JSON.stringify(tok)); process.exit(1); }

const day = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const query = async (dimensions, rowLimit = 1000) => {
  const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, {
    method: 'POST', headers: { authorization: `Bearer ${tok.access_token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ startDate: day(30), endDate: day(2), dimensions, rowLimit }) });   // data lags about 2 days
  if (!r.ok) { console.error(`Search Console error ${r.status}: ${await r.text()}`); process.exit(1); }
  return (await r.json()).rows || [];
};

const rows = await query(['query', 'page']);
const pages = await query(['page'], 15);
const pct = x => (x * 100).toFixed(1) + '%';
const short = u => u.replace('https://stermontarcade.co.ke', '') || '/';
const table = (head, body) => body.length ? `| ${head.join(' | ')} |\n|${head.map(() => '---').join('|')}|\n${body.join('\n')}\n` : '_Nothing yet._\n';

const near = rows.filter(r => r.position >= 8 && r.position <= 20 && r.impressions >= 5)
  .sort((a, b) => b.impressions - a.impressions).slice(0, 25)
  .map(r => `| ${r.keys[0]} | ${r.position.toFixed(1)} | ${r.impressions} | ${r.clicks} | ${short(r.keys[1])} |`);
const low = rows.filter(r => r.position < 8 && r.impressions >= 20 && r.ctr < 0.03)
  .sort((a, b) => b.impressions - a.impressions).slice(0, 15)
  .map(r => `| ${r.keys[0]} | ${r.position.toFixed(1)} | ${r.impressions} | ${pct(r.ctr)} | ${short(r.keys[1])} |`);
const top = pages.map(r => `| ${short(r.keys[0])} | ${r.clicks} | ${r.impressions} | ${r.position.toFixed(1)} |`);

console.log(`# Ranking opportunities (${day(30)} to ${day(2)})\n`);
console.log(`## Almost page 1 (position 8-20)\nAdd the exact search words to that page's title, H1 and first paragraph, and link to it from your home page and category page.\n`);
console.log(table(['Search', 'Position', 'Seen', 'Clicks', 'Page'], near));
console.log(`## Seen a lot, rarely clicked\nRewrite the title and description to include price, "M-Pesa" and "delivery in Kenya".\n`);
console.log(table(['Search', 'Position', 'Seen', 'Click rate', 'Page'], low));
console.log(`## Your best pages\n`);
console.log(table(['Page', 'Clicks', 'Seen', 'Avg position'], top));
