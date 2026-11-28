// Stermont Arcade - fetches the two data sets generate-products.mjs reads besides products:
//   1. product_slug_redirects (every slug a product ever had), and
//   2. approved customer reviews,
// from the live Neon Data API (anonymous Neon Auth token), never from the retired Supabase project.
// It writes slug-redirects.json and reviews.json into the folder given as the first argument
// (default: the current folder) and, inside GitHub Actions, exports SLUG_REDIRECTS_JSON and
// REVIEWS_JSON so generate-products.mjs picks the files up through its existing test hooks.
// A failed or empty slug fetch stops the build on purpose: silently continuing is what dropped
// old product URLs before. Reviews are optional and only produce a warning.
import { writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const AUTH = 'https://ep-dry-butterfly-bhytt90y.neonauth.c-10.eu-central-1.aws.neon.tech/stermont/auth';
const REST = 'https://ep-dry-butterfly-bhytt90y.apirest.c-10.eu-central-1.aws.neon.tech/stermont/rest/v1/';
const outDir = process.argv[2] || '.';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getJson(url, headers = {}) {
  let last = 'no attempt';
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(url, { headers: { accept: 'application/json', ...headers }, signal: AbortSignal.timeout(30000) });
      if (r.ok) return await r.json();
      last = `HTTP ${r.status}: ${(await r.text()).replace(/\s+/g, ' ').slice(0, 250)}`;
      if (r.status === 401 || r.status === 403 || r.status === 404) break;
    } catch (error) {
      last = String(error?.message || error).slice(0, 250);
    }
    if (attempt < 3) await pause(700 * attempt);
  }
  throw new Error(last);
}

const tokenPayload = await getJson(AUTH + '/token/anonymous');
if (typeof tokenPayload?.token !== 'string' || !tokenPayload.token) throw new Error('Neon Auth returned no anonymous token');
const headers = { Authorization: 'Bearer ' + tokenPayload.token };

// 1. Historical slugs - required.
const slugs = await getJson(`${REST}product_slug_redirects?select=old_slug,product_id&order=old_slug.asc&limit=5000`, headers);
if (!Array.isArray(slugs) || slugs.length === 0) throw new Error('Neon returned no historical product slugs; refusing to build without them.');
if (slugs.length >= 1000) console.warn('Slug list has 1000+ rows; confirm the Data API is not truncating it.');
writeFileSync(join(outDir, 'slug-redirects.json'), JSON.stringify(slugs));
console.log(`Historical slug mappings from Neon: ${slugs.length}.`);

// 2. Approved reviews - optional.
let reviews = [];
try {
  const payload = await getJson(`${REST}reviews?status=eq.approved&select=product_name,rating,body,reviewer,created_at&order=created_at.desc&limit=1000`, headers);
  if (Array.isArray(payload)) reviews = payload;
} catch (error) {
  console.warn(`Could not read reviews from Neon (continuing without review markup): ${error.message}`);
}
writeFileSync(join(outDir, 'reviews.json'), JSON.stringify(reviews));
console.log(`Approved reviews from Neon: ${reviews.length}.`);

if (process.env.GITHUB_ENV) {
  appendFileSync(process.env.GITHUB_ENV, `SLUG_REDIRECTS_JSON=${join(outDir, 'slug-redirects.json')}\nREVIEWS_JSON=${join(outDir, 'reviews.json')}\n`);
}
