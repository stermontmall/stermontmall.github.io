// Stermont Arcade - ONE-TIME copy of Supabase Storage photos into the ImageKit Media Library.
//
// Safe by design:
//  - It only COPIES. It never deletes anything and never changes the database or the live site.
//  - Re-running is harmless: photos that already exist in ImageKit are skipped.
//  - DRY_RUN (default true) only lists what would be copied and does not touch Supabase Storage or ImageKit.
//  - If Supabase Storage answers 402 (quota exceeded) the run stops straight away instead of hammering it.
//
// Which photos: every Supabase Storage photo URL found in the PUBLIC catalogue (products.images, categories.image_url and,
// when the anon key can read them, service_posts.media / service_updates.media). Anon key only, no Supabase secret needed.
// Where they go: ImageKit folder /<bucket>/<same file path>, e.g. /product-images/dolphy-jycd05-5l-electric-ulv-cold-fogger.jpg
// Needs (real copy only): the GitHub secret IMAGEKIT_PRIVATE_KEY.
import { appendFileSync } from 'node:fs';

const SB = 'https://oewvtbnmyombbtggamor.supabase.co';
const KEY = 'sb_publishable_CQiZr-INuot9C4fbdJDz1Q_4OiWEQL7'; // publishable key, designed to be public
const IK_UPLOAD = 'https://upload.imagekit.io/api/v1/files/upload';
const IK_PRIVATE = process.env.IMAGEKIT_PRIVATE_KEY || '';
const DRY = String(process.env.DRY_RUN ?? 'true').toLowerCase() !== 'false';
const LIMIT = Math.max(0, parseInt(process.env.LIMIT || '0', 10) || 0);
const CONCURRENCY = 4;
const PUBLIC_URL = /https:\/\/oewvtbnmyombbtggamor\.supabase\.co\/storage\/v1\/object\/public\/([^\/\s"'\\?#]+)\/([^\s"'\\?#]+)/g;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const safeDecode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, accept: 'application/json' };

function summary(md) {
  console.log(md);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
}

if (!DRY && !IK_PRIVATE) {
  summary('## ❌ Missing secret\nAdd a repository secret named `IMAGEKIT_PRIVATE_KEY` (Settings → Secrets and variables → Actions), then run again.');
  process.exit(1);
}

// ---- 1. Collect every Supabase Storage photo URL from the public catalogue ----
const found = new Map(); // key -> { key, bucket, folder, name, url }
function collect(value) {
  for (const m of JSON.stringify(value ?? '').matchAll(PUBLIC_URL)) {
    const bucket = m[1];
    const rel = safeDecode(m[2]);
    const key = `${bucket}/${rel}`;
    if (found.has(key)) continue;
    const parts = rel.split('/').filter(Boolean);
    const name = parts.pop();
    if (!name) continue;
    found.set(key, { key, bucket, folder: '/' + [bucket, ...parts].join('/'), name, url: m[0] });
  }
}

async function readTable(table, select, { paged = false } = {}) {
  const PAGE = 200;
  const rows = [];
  for (let offset = 0; ; offset += PAGE) {
    const q = paged
      ? `${SB}/rest/v1/${table}?select=${select}&order=id.asc&limit=${PAGE}&offset=${offset}`
      : `${SB}/rest/v1/${table}?select=${select}&limit=1000`;
    const r = await fetch(q, { headers, signal: AbortSignal.timeout(30000) });
    if (!r.ok) return { ok: false, status: r.status, rows };
    const batch = await r.json();
    if (!Array.isArray(batch)) return { ok: false, status: 'bad JSON', rows };
    rows.push(...batch);
    if (!paged || batch.length < PAGE) break;
  }
  return { ok: true, rows };
}

const products = await readTable('products', 'images', { paged: true });
if (!products.ok) {
  summary(`## ❌ Could not read the product catalogue (HTTP ${products.status}).`);
  process.exit(1);
}
products.rows.forEach((row) => collect(row.images));
const notes = [`products read: ${products.rows.length}`];
for (const [table, select] of [['categories', 'image_url'], ['service_posts', 'media'], ['service_updates', 'media']]) {
  const t = await readTable(table, select);
  if (t.ok) { t.rows.forEach((row) => collect(row)); notes.push(`${table} read: ${t.rows.length}`); }
  else notes.push(`${table}: skipped (HTTP ${t.status}, not publicly readable)`);
}

let items = [...found.values()].sort((a, b) => a.key.localeCompare(b.key));
const totalFound = items.length;
if (LIMIT > 0) items = items.slice(0, LIMIT);
const perBucket = {};
items.forEach((it) => { perBucket[it.bucket] = (perBucket[it.bucket] || 0) + 1; });

if (DRY) {
  summary([
    '## 🔎 Dry run: nothing was copied',
    `Photos found in the catalogue: **${totalFound}**${LIMIT > 0 ? ` (this run would copy the first ${items.length})` : ''}`,
    ...Object.entries(perBucket).map(([b, n]) => `- ${b}: ${n}`),
    '',
    notes.join(' · '),
    '',
    'First 10: ' + items.slice(0, 10).map((it) => '`' + it.key + '`').join(', '),
    '',
    'Run again with **dry_run = false** to copy for real (try limit = 5 first).',
  ].join('\n'));
  process.exit(0);
}

// ---- 2. Copy ----
const AUTH = 'Basic ' + Buffer.from(IK_PRIVATE + ':').toString('base64');
const stats = { uploaded: 0, exists: 0, missing: 0, failed: 0 };
const failures = [];
const missing = [];
let fatal = null;

async function copyOne(it) {
  // download from Supabase Storage
  let res = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      res = await fetch(it.url, { signal: AbortSignal.timeout(60000) });
    } catch (e) {
      if (attempt < 3) { await sleep(800 * attempt); continue; }
      throw e;
    }
    if (res.status === 402) { fatal = 'Supabase Storage answered 402 (quota exceeded). Wait for the quota to reset, then run again; photos already copied are skipped.'; return; }
    if (res.status === 404) { stats.missing++; missing.push(it.key); return; }
    if (res.ok) break;
    if (attempt < 3 && [408, 425, 429, 500, 502, 503, 504].includes(res.status)) { await sleep(800 * attempt); continue; }
    throw new Error(`download HTTP ${res.status}`);
  }
  const bytes = await res.arrayBuffer();
  const type = res.headers.get('content-type') || 'application/octet-stream';

  // upload into ImageKit (never overwrite an existing file)
  const form = new FormData();
  form.set('file', new Blob([bytes], { type }), it.name);
  form.set('fileName', it.name);
  form.set('folder', it.folder);
  form.set('useUniqueFileName', 'false');
  form.set('overwriteFile', 'false');
  for (let attempt = 1; attempt <= 3; attempt++) {
    const up = await fetch(IK_UPLOAD, { method: 'POST', headers: { Authorization: AUTH }, body: form, signal: AbortSignal.timeout(120000) });
    const text = await up.text();
    if (up.ok) { stats.uploaded++; return; }
    if (/already exists/i.test(text)) { stats.exists++; return; }
    if (up.status === 401 || up.status === 403) { fatal = `ImageKit rejected the request (HTTP ${up.status}). Check that the IMAGEKIT_PRIVATE_KEY secret is the Private key from ImageKit > Developer options.`; return; }
    if (attempt < 3 && (up.status === 429 || up.status >= 500)) { await sleep(1500 * attempt); continue; }
    throw new Error(`upload HTTP ${up.status}: ${text.slice(0, 200)}`);
  }
}

let next = 0;
let done = 0;
async function worker() {
  while (!fatal) {
    const it = items[next++];
    if (!it) return;
    try { await copyOne(it); }
    catch (e) { stats.failed++; failures.push(`${it.key}: ${String(e?.message || e).slice(0, 200)}`); }
    if (++done % 100 === 0) console.log(`...${done}/${items.length} processed`, JSON.stringify(stats));
  }
}
const started = Date.now();
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const mins = ((Date.now() - started) / 60000).toFixed(1);
const lines = [
  fatal ? '## ⛔ Stopped early' : (stats.failed ? '## ⚠️ Finished with some failures' : '## ✅ Copy finished'),
  fatal ? `**${fatal}**` : '',
  `Processed ${done} of ${items.length} photos in ${mins} min`,
  `- Copied to ImageKit: **${stats.uploaded}**`,
  `- Already in ImageKit (skipped): ${stats.exists}`,
  `- Missing in Supabase Storage (404, listed in the catalogue but no file): ${stats.missing}`,
  `- Failed: ${stats.failed}`,
];
if (failures.length) lines.push('', 'Failures (first 30):', ...failures.slice(0, 30).map((f) => `- ${f}`));
if (missing.length) lines.push('', 'Missing files (first 30):', ...missing.slice(0, 30).map((f) => `- ${f}`));
lines.push('', 'The website and database were NOT changed. Next step: point the site at the ImageKit copies once you have checked a few.');
summary(lines.filter((l) => l !== '').join('\n'));
process.exit(fatal || stats.failed ? 1 : 0);
