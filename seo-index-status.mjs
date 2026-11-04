// Stermont Arcade - seo-index-status
// Asks Google (Search Console URL Inspection API) whether each page in your sitemaps is indexed, and prints a Markdown report:
//   1) how many pages are indexed vs not, grouped by Google's own reason
//   2) every page that is NOT indexed, with the reason, last crawl date and which page Google chose instead (if any)
//   3) a short "request these first" list for the Search Console "Request indexing" button (about 10 per day are allowed)
// Google offers no official way to force indexing of product pages (the Indexing API is for job and live-stream pages only),
// so this tool shows you exactly what is blocking each page instead of guessing.
// Uses the same secrets as seo-google-sitemaps.mjs (GitHub > Settings > Secrets and variables > Actions):
//   GSC_SERVICE_ACCOUNT_JSON, GSC_PROPERTY. The service account must be added as a user on the property in Search Console.
// Optional: MAX_URLS (default 250; Google allows about 2000 inspections per day per property),
//           MAX_MINUTES (default 20; the run stops and reports what it has instead of hanging for hours).
import { createSign } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';

const SITE = 'https://stermontarcade.co.ke';
const raw = process.env.GSC_SERVICE_ACCOUNT_JSON, property = process.env.GSC_PROPERTY;
if (!raw || !property) {
  console.log('# Google indexing status\n\nNot switched on yet. Add the `GSC_SERVICE_ACCOUNT_JSON` and `GSC_PROPERTY` secrets (same ones as the sitemap ping) and run this again.');
  process.exit(1);
}

const MAX = Number(process.env.MAX_URLS) || 250;
const deadline = Date.now() + (Number(process.env.MAX_MINUTES) || 20) * 60000;

// ---- Sign in to Google with the service account ----
const key = JSON.parse(raw);
const b64 = o => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const head = b64({ alg: 'RS256', typ: 'JWT' });
const claim = b64({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
const sig = createSign('RSA-SHA256').update(`${head}.${claim}`).sign(key.private_key, 'base64url');
const tok = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${claim}.${sig}` }) }).then(r => r.json());
if (!tok.access_token) { console.error('Google sign-in failed:', JSON.stringify(tok)); process.exit(1); }

// ---- Collect the URLs to check: products first (they matter most), then the other pages ----
const locs = f => (existsSync(f) ? [...readFileSync(f, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]) : []);
const products = locs('sitemap-products.xml').filter(u => u.includes('/p/'));
const others = [...locs('sitemap.xml'), ...locs('sitemap-products.xml').filter(u => !u.includes('/p/'))];
const urls = [...new Set([...products, ...others])].slice(0, MAX);
if (!urls.length) { console.error('No URLs found in sitemap.xml or sitemap-products.xml.'); process.exit(1); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
const inspect = async url => {
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
      method: 'POST', headers: { authorization: `Bearer ${tok.access_token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ inspectionUrl: url, siteUrl: property, languageCode: 'en-US' }) });
    if (r.status === 429) { await sleep(5000 * (attempt + 1)); continue; }
    if (!r.ok) return { url, error: `${r.status} ${(await r.text()).slice(0, 160).replace(/\s+/g, ' ')}` };
    const j = await r.json();
    const s = (j.inspectionResult || {}).indexStatusResult || {};
    return { url, verdict: s.verdict || 'UNKNOWN', state: s.coverageState || 'Unknown', crawled: (s.lastCrawlTime || '').slice(0, 10),
      canonical: s.googleCanonical && s.googleCanonical !== url ? s.googleCanonical : '', robots: s.robotsTxtState, fetch: s.pageFetchState, indexing: s.indexingState };
  }
  return { url, error: 'rate limited, try again later', rateLimited: true };
};

// Stop early instead of hanging: 3 rate-limited pages in a row means Google's quota is used up for now,
// and a run time limit keeps the job from ever sitting for hours (the old version could take over an hour and then fail).
const results = [];
let limitedInRow = 0, notChecked = 0, stopReason = '';
for (const u of urls) {
  if (Date.now() > deadline) { stopReason = 'the run time limit was reached'; break; }
  const r = await inspect(u);
  results.push(r);
  limitedInRow = r.rateLimited ? limitedInRow + 1 : 0;
  if (limitedInRow >= 3) { stopReason = "Google's inspection quota is used up for now (it resets daily)"; break; }
  await sleep(250);
}
notChecked = urls.length - results.length;

const limited = results.filter(r => r.rateLimited);
const errs = results.filter(r => r.error && !r.rateLimited);

// A permission problem affects every URL, so say it once and clearly.
if (results.length && errs.length === results.length) {
  console.log('# Google indexing status\n\nGoogle refused every check: `' + errs[0].error + '`\n\nUsually the service account is not added as a user on this property. In Search Console open Settings > Users and permissions > Add user, paste the service account email (`' + key.client_email + '`) and give it **Full** or **Restricted** access. Also check that `GSC_PROPERTY` matches the property exactly (for example `sc-domain:stermontarcade.co.ke`).');
  process.exit(1);
}
if (results.length && limited.length === results.length) {
  console.log('# Google indexing status ' + new Date().toISOString().slice(0, 10) + '\n\nGoogle\'s URL Inspection quota is used up right now, so no pages could be checked. This is not a setup problem. Run it again tomorrow, or lower `MAX_URLS` if other tools also use this quota.');
  process.exit(0);
}

const ok = results.filter(r => !r.error);
const indexed = ok.filter(r => r.verdict === 'PASS');
const notIndexed = ok.filter(r => r.verdict !== 'PASS');
const byState = {};
for (const r of notIndexed) (byState[r.state] ||= []).push(r);

const short = u => u.replace(SITE, '');
const advice = {
  'Discovered - currently not indexed': 'Google knows the page but has not visited it yet. Link to it from the home page, its category and 2 related products, then request indexing.',
  'Crawled - currently not indexed': 'Google visited and chose not to index it. Make the description clearly unique, add real photos and reviews, and link to it from stronger pages.',
  'URL is unknown to Google': 'Google has not found it yet. Make sure it is in the sitemap and linked from other pages, then request indexing.',
  'Duplicate without user-selected canonical': 'Google thinks it duplicates another page. Make the title and description clearly different from similar products.',
  'Alternate page with proper canonical tag': 'Google treats it as a copy of the canonical page shown. Usually fine for size or colour variants.',
};

const unchecked = results.length - ok.length + notChecked;
const out = [];
out.push(`# Google indexing status ${new Date().toISOString().slice(0, 10)}`);
out.push('');
out.push(`Checked **${ok.length}** pages with Google (products first). **${indexed.length} indexed**, **${notIndexed.length} not indexed**${unchecked ? `, ${unchecked} not checked` : ''}.`);
if (stopReason) out.push('', `> Stopped early because ${stopReason}. The pages not checked are the last ones in the list; they will be checked on a later run.`);
out.push('');
if (notIndexed.length) {
  out.push('## Why pages are not indexed');
  out.push('| Reason (from Google) | Pages | What to do |', '|---|---|---|');
  for (const [state, list] of Object.entries(byState).sort((a, b) => b[1].length - a[1].length))
    out.push(`| ${state} | ${list.length} | ${advice[state] || 'Open the page in Search Console > URL Inspection for details.'} |`);
  out.push('');
  const todo = notIndexed.filter(r => r.url.includes('/p/')).slice(0, 10);
  if (todo.length) {
    out.push('## Request indexing for these first (Search Console > URL Inspection > Request indexing, about 10 per day)');
    for (const r of todo) out.push(`- ${r.url}`);
    out.push('');
  }
  out.push('## All pages not indexed');
  out.push('| Page | Reason | Last crawled | Google chose instead |', '|---|---|---|---|');
  for (const r of notIndexed) out.push(`| ${short(r.url)} | ${r.state} | ${r.crawled || 'never'} | ${r.canonical ? short(r.canonical) : ''} |`);
  out.push('');
}
if (errs.length) {
  out.push('## Pages that could not be checked');
  out.push('| Page | Error |', '|---|---|');
  for (const r of errs) out.push(`| ${short(r.url)} | ${r.error} |`);
  out.push('');
}
out.push('_Google decides what to index. This report shows what is blocking each page; it cannot force indexing._');
console.log(out.join('\n'));
// Only fail the job for real problems (more than 1 in 10 checks erroring), not for quota or time limits.
if (errs.length > Math.max(2, results.length / 10)) process.exitCode = 1;
