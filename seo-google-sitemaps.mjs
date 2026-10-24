// Stermont Arcade - tells Google Search Console to re-read both sitemaps (automatic Google recrawl nudge).
// Uses the official Search Console API (sitemaps.submit). No installs needed (Node 18+).
// Secrets (GitHub > Settings > Secrets and variables > Actions):
//   GSC_SERVICE_ACCOUNT_JSON  the full JSON key of a Google service account that is an Owner in Search Console
//   GSC_PROPERTY              your property exactly as Search Console shows it, e.g. sc-domain:stermontarcade.co.ke
//                             or https://stermontarcade.co.ke/  (URL-prefix properties must end with a slash)
import { createSign } from 'node:crypto';

const SITE = 'https://stermontarcade.co.ke';
const SITEMAPS = [`${SITE}/sitemap.xml`, `${SITE}/sitemap-products.xml`];
const raw = process.env.GSC_SERVICE_ACCOUNT_JSON, property = process.env.GSC_PROPERTY;
if (!raw || !property) { console.log('Skipped: add the GSC_SERVICE_ACCOUNT_JSON and GSC_PROPERTY secrets to turn this on.'); process.exit(0); }

const key = JSON.parse(raw);
const b64 = o => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const head = b64({ alg: 'RS256', typ: 'JWT' });
const claim = b64({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/webmasters', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
const sig = createSign('RSA-SHA256').update(`${head}.${claim}`).sign(key.private_key, 'base64url');

const tok = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${claim}.${sig}` }) }).then(r => r.json());
if (!tok.access_token) { console.error('Google sign-in failed:', JSON.stringify(tok)); process.exit(1); }

let failed = 0;
for (const sm of SITEMAPS) {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/sitemaps/${encodeURIComponent(sm)}`;
  const r = await fetch(url, { method: 'PUT', headers: { authorization: `Bearer ${tok.access_token}`, 'content-length': '0' } });
  console.log(r.ok ? `Submitted ${sm}` : `FAILED ${sm}: ${r.status} ${await r.text()}`);
  if (!r.ok) failed++;
}
process.exit(failed ? 1 : 0);
