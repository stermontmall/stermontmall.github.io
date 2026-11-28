// Stermont Arcade - saves Google Search Console performance (clicks, impressions, searches, pages) into Neon.
// Free replacement for pulling this data through a paid connector. Uses the same secrets as seo-opportunities.mjs:
//   GSC_SERVICE_ACCOUNT_JSON, GSC_PROPERTY, plus NEON_DATABASE_URL.
// Tables (created if missing):
//   public.search_performance_daily   one row per day: the true totals
//   public.search_performance_details one row per day + search + page (Google hides rare searches, so these add up to less than the totals)
// The first run loads 90 days. Later runs reload the last 10 days, because Google finalises figures a few days late.
import { createSign } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const PAGE = 25000, BATCH = 2000;
export const day = (n, now = Date.now()) => new Date(now - n * 864e5).toISOString().slice(0, 10);

export async function fetchRows(query, dimensions, startDate, endDate, pageSize = PAGE) {
  const all = [];
  for (let startRow = 0; ; startRow += pageSize) {
    const rows = await query({ startDate, endDate, dimensions, rowLimit: pageSize, startRow });
    all.push(...rows);
    if (rows.length < pageSize) return all;
  }
}

export async function sync({ sql, query, property, now = Date.now() }) {
  await sql`CREATE TABLE IF NOT EXISTS public.search_performance_daily (
    property text NOT NULL, day date NOT NULL, clicks integer NOT NULL, impressions integer NOT NULL,
    position double precision NOT NULL, synced_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (property, day))`;
  await sql`CREATE TABLE IF NOT EXISTS public.search_performance_details (
    property text NOT NULL, day date NOT NULL, query text NOT NULL, page text NOT NULL, clicks integer NOT NULL,
    impressions integer NOT NULL, position double precision NOT NULL, synced_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (property, day, query, page))`;
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM public.search_performance_daily WHERE property = ${property}`;
  const startDate = day(n ? 10 : 90, now), endDate = day(1, now);

  const daily = (await fetchRows(query, ['date'], startDate, endDate))
    .map(r => ({ day: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: r.position }));
  // Never wipe saved figures because Google returned nothing.
  if (!daily.length) throw new Error(`Search Console returned no data for ${startDate} to ${endDate}; saved figures left unchanged.`);
  const details = (await fetchRows(query, ['date', 'query', 'page'], startDate, endDate))
    .map(r => ({ day: r.keys[0], query: r.keys[1], page: r.keys[2], clicks: r.clicks, impressions: r.impressions, position: r.position }));

  // One transaction: either the whole date range is replaced or nothing changes.
  const statements = [
    sql`DELETE FROM public.search_performance_daily WHERE property = ${property} AND day BETWEEN ${startDate} AND ${endDate}`,
    sql`DELETE FROM public.search_performance_details WHERE property = ${property} AND day BETWEEN ${startDate} AND ${endDate}`,
    sql`INSERT INTO public.search_performance_daily (property, day, clicks, impressions, position)
      SELECT ${property}, x.day, x.clicks, x.impressions, x.position
      FROM jsonb_to_recordset(${JSON.stringify(daily)}::jsonb) AS x(day date, clicks int, impressions int, position float8)`,
  ];
  for (let i = 0; i < details.length; i += BATCH) statements.push(
    sql`INSERT INTO public.search_performance_details (property, day, query, page, clicks, impressions, position)
      SELECT ${property}, x.day, x.query, x.page, x.clicks, x.impressions, x.position
      FROM jsonb_to_recordset(${JSON.stringify(details.slice(i, i + BATCH))}::jsonb) AS x(day date, query text, page text, clicks int, impressions int, position float8)`);
  await sql.transaction(statements);
  return { startDate, endDate, days: daily.length, detailRows: details.length,
    clicks: daily.reduce((s, r) => s + r.clicks, 0), impressions: daily.reduce((s, r) => s + r.impressions, 0) };
}

async function main() {
  const { GSC_SERVICE_ACCOUNT_JSON: raw, GSC_PROPERTY: property, NEON_DATABASE_URL: db } = process.env;
  if (!raw || !property || !db) throw new Error('Missing GSC_SERVICE_ACCOUNT_JSON, GSC_PROPERTY or NEON_DATABASE_URL.');
  const key = JSON.parse(raw);
  const b64 = o => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
  const iat = Math.floor(Date.now() / 1000);
  const head = b64({ alg: 'RS256', typ: 'JWT' });
  const claim = b64({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', iat, exp: iat + 3600 });
  const sig = createSign('RSA-SHA256').update(`${head}.${claim}`).sign(key.private_key, 'base64url');
  const tok = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${claim}.${sig}` }) }).then(r => r.json());
  if (!tok.access_token) throw new Error('Google sign-in failed: ' + (tok.error || 'unknown error'));
  const query = async body => {
    const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, {
      method: 'POST', headers: { authorization: `Bearer ${tok.access_token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`Search Console error ${r.status}: ${(await r.text()).slice(0, 300)}`);
    return (await r.json()).rows || [];
  };
  const { neon } = await import('@neondatabase/serverless');
  const s = await sync({ sql: neon(db), query, property });
  console.log(`Saved to Neon for ${property}, ${s.startDate} to ${s.endDate}: ${s.days} days, ${s.detailRows} search/page rows, ${s.clicks} clicks, ${s.impressions} impressions.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
