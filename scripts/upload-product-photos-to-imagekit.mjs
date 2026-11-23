// Stermont Arcade - upload product photos from the internet to ImageKit (used by Claude and ChatGPT when publishing products).
//
// Input (env PHOTOS): one photo per line, "file-name|https://image-url". Example:
//   osho-rat-glue-trap-large|https://example.co.ke/images/rat-trap.jpg
// ImageKit downloads the image itself (upload-by-URL), stores it in the folder /products/, and this script then checks that
// the stored file loads, is an image, and is at least 500 x 500 px.
// Any common format is accepted (JPEG, PNG, WebP, AVIF, GIF, HEIC, TIFF, BMP). Formats that browsers may not show are
// delivered as WebP through an ImageKit transformation URL; always save "browser_url" as the product image.
// Needs the GitHub secret IMAGEKIT_PRIVATE_KEY. It never deletes anything and never touches the database.
import { appendFileSync } from 'node:fs';

const IK_UPLOAD = 'https://upload.imagekit.io/api/v1/files/upload';
const IK_ENDPOINT = 'https://ik.imagekit.io/w6hxfnwmw';
const FOLDER = '/products';
const MIN_SIDE = 500;
const MAX_LINES = 40;
const BROWSER_SAFE = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
const KEY = process.env.IMAGEKIT_PRIVATE_KEY || '';

const summaryFile = process.env.GITHUB_STEP_SUMMARY;
const say = (s) => { console.log(s); };
const summary = (s) => { if (summaryFile) appendFileSync(summaryFile, s + '\n'); };

if (!KEY) {
  console.error('::error::Repository secret IMAGEKIT_PRIVATE_KEY is not set.');
  process.exit(1);
}

const lines = String(process.env.PHOTOS || '')
  .split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
if (!lines.length) { console.error('::error::No photos given. Use one "file-name|https://image-url" per line.'); process.exit(1); }
if (lines.length > MAX_LINES) { console.error(`::error::Too many photos (${lines.length}). Maximum is ${MAX_LINES} per run.`); process.exit(1); }

const auth = 'Basic ' + Buffer.from(KEY + ':').toString('base64');
const cleanName = (s) => s.toLowerCase().replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);

async function one(line) {
  const sep = line.indexOf('|');
  const name = cleanName(sep > 0 ? line.slice(0, sep) : '');
  const src = sep > 0 ? line.slice(sep + 1).trim() : '';
  const res = { name, source: src, ok: false };
  if (!name) return { ...res, error: 'missing file name before the | sign' };
  if (!/^https:\/\/[^\s]+$/i.test(src)) return { ...res, error: 'image address must be a full https URL' };
  try {
    const form = new FormData();
    form.append('file', src);
    form.append('fileName', name);
    form.append('folder', FOLDER);
    form.append('useUniqueFileName', 'true');
    form.append('tags', 'product-photo,auto-upload');
    const r = await fetch(IK_UPLOAD, { method: 'POST', headers: { Authorization: auth }, body: form });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) return { ...res, error: `ImageKit ${r.status}: ${body.message || 'upload failed'}` };
    const ext = String(body.fileType === 'image' ? (body.name || '').split('.').pop() : body.fileType || '').toLowerCase();
    const filePath = body.filePath || `${FOLDER}/${body.name}`;
    const plain = `${IK_ENDPOINT}${filePath}`;
    const safe = BROWSER_SAFE.has(ext);
    const browserUrl = safe ? plain : `${IK_ENDPOINT}/tr:f-webp${filePath}`;
    const w = Number(body.width) || 0, h = Number(body.height) || 0;
    const out = { ...res, original_format: ext || 'unknown', width: w, height: h, bytes: body.size, original_url: plain, browser_url: browserUrl, converted_to_webp: !safe };
    if (w < MIN_SIDE || h < MIN_SIDE) return { ...out, error: `image is ${w}x${h}; at least ${MIN_SIDE}x${MIN_SIDE} is required` };
    const check = await fetch(browserUrl);
    const type = check.headers.get('content-type') || '';
    if (!check.ok || !type.startsWith('image/')) return { ...out, error: `stored file did not load as an image (HTTP ${check.status}, ${type || 'no type'})` };
    return { ...out, ok: true, content_type: type };
  } catch (e) {
    return { ...res, error: String(e && e.message || e) };
  }
}

const results = [];
for (const l of lines) results.push(await one(l));

summary('## ImageKit photo upload');
summary('| Result | Name | Size | browser_url (save this in products.images) |');
summary('|---|---|---|---|');
for (const r of results) {
  summary(`| ${r.ok ? 'OK' : 'FAILED'} | ${r.name || '-'} | ${r.width && r.height ? r.width + 'x' + r.height : '-'} | ${r.ok ? r.browser_url : r.error} |`);
  say(`${r.ok ? 'OK    ' : 'FAILED'} ${r.name || '-'} ${r.ok ? r.browser_url : r.error}`);
}
say('RESULTS_JSON=' + JSON.stringify(results));
const failed = results.filter((r) => !r.ok).length;
say(`Done: ${results.length - failed} uploaded and verified, ${failed} failed.`);
process.exit(failed ? 1 : 0);
