// Stermont Arcade - upload product photos from the internet to ImageKit (used by Claude and ChatGPT when publishing products).
//
// Input (env PHOTOS): one photo per line. Each line is either a direct image address or a product PAGE address,
// optionally with a file name first:
//   osho-rat-glue-trap-large|https://example.co.ke/images/rat-trap.jpg
//   osho-rat-glue-trap-large|https://example.co.ke/product/osho-rat-glue-trap/
//   https://example.co.ke/product/osho-rat-glue-trap/        (file name is taken from the page address)
// When the address is a web page, the script finds the product photo on it (Open Graph, Twitter, image_src and Product
// JSON-LD, like the old Supabase upload-photos function) and tries each candidate until one passes the size check.
// ImageKit downloads the image itself (upload-by-URL), stores it in the folder /products/, and this script then checks that
// the stored file loads, is an image, and is big enough.
// Size rule: every accepted image must be at least 200 x 200 pixels.
// Accepted formats: JPG, JPEG, PNG, WebP and AVIF. Save the verified ImageKit browser_url.
// Needs the GitHub secret IMAGEKIT_PRIVATE_KEY. It never deletes anything and never touches the database.
import { appendFileSync } from 'node:fs';

const IK_UPLOAD = 'https://upload.imagekit.io/api/v1/files/upload';
const IK_ENDPOINT = 'https://ik.imagekit.io/w6hxfnwmw';
const FOLDER = '/products';
const MIN_SIDE = 200;
const MAX_LINES = 40;
const BROWSER_SAFE = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif']);
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

const UA = 'Mozilla/5.0 (compatible; StermontPhotoBot/1.0; +https://stermontarcade.co.ke)';

// Own-site shell links (/?product=slug) are JavaScript pages; the static product page /p/slug.html has the real tags.
export function normalizePageUrl(u) {
  try {
    const x = new URL(u);
    if (/(^|\.)stermontarcade\.co\.ke$/i.test(x.hostname) && x.searchParams.get('product')) {
      return `https://${x.hostname}/p/${x.searchParams.get('product')}.html`;
    }
  } catch { /* leave as is */ }
  return u;
}

export function nameFromUrl(u) {
  try {
    const x = new URL(u);
    const slug = x.searchParams.get('product') || x.pathname.split('/').filter(Boolean).pop() || x.hostname;
    return cleanName(slug);
  } catch { return ''; }
}

export function extractImageCandidates(html, baseUrl) {
  const out = [];
  const add = (v) => {
    if (!v || typeof v !== 'string') return;
    try { const abs = new URL(v.trim().replace(/&amp;/g, '&'), baseUrl).href; if (/^https:/i.test(abs) && !out.includes(abs)) out.push(abs); } catch { /* skip */ }
  };
  // Prefer actual product-gallery images over generic Open Graph store banners.
  const attr = (tag, key) => (tag.match(new RegExp('\\\\b' + key + '\\\\s*=\\\\s*["\\\\']([^"\\\\']+)["\\\\']', 'i')) || [])[1] || '';
  for (const tag of html.match(/<img\\b[^>]*>/gi) || []) {
    const alt = attr(tag, 'alt');
    if (!alt || /logo|payment|visa|mastercard|facebook|instagram|whatsapp|twitter|tiktok|avatar|icon/i.test(alt)) continue;
    for (const key of ['data-zoom-image', 'data-original', 'data-src', 'data-lazy-src', 'src']) add(attr(tag, key));
    for (const key of ['data-srcset', 'srcset']) {
      const srcset = attr(tag, key);
      for (const part of srcset.split(',')) add(part.trim().split(/\\s+/)[0]);
    }
  }
  const metaRe = /<meta\\s+[^>]*>/gi;
  for (const m of html.match(metaRe) || []) {
    const key = (m.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i) || [])[1] || '';
    if (/^(og:image(:secure_url|:url)?|twitter:image(:src)?)$/i.test(key)) add((m.match(/content\s*=\s*["']([^"']+)["']/i) || [])[1]);
  }
  for (const m of html.match(/<link\s+[^>]*>/gi) || []) {
    if (/rel\s*=\s*["']image_src["']/i.test(m)) add((m.match(/href\s*=\s*["']([^"']+)["']/i) || [])[1]);
  }
  for (const m of html.matchAll(/<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (n) => {
        if (!n || typeof n !== 'object') return;
        if (Array.isArray(n)) { n.forEach(walk); return; }
        const t = [].concat(n['@type'] || []).join(',');
        if (/Product/i.test(t) && n.image) {
          for (const i of [].concat(n.image)) add(typeof i === 'string' ? i : i && (i.url || i.contentUrl));
        }
        Object.values(n).forEach(walk);
      };
      walk(JSON.parse(m[1]));
    } catch { /* ignore bad JSON-LD */ }
  }
  return out;
}

// Returns the list of direct image addresses to try for one source address.
async function resolveSources(src) {
  const page = normalizePageUrl(src);
  const r = await fetch(page, { headers: { 'User-Agent': UA, Accept: 'text/html,image/*;q=0.8,*/*;q=0.5' }, redirect: 'follow' });
  const type = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!r.ok) throw new Error(`could not open the address (HTTP ${r.status})`);
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
  if (allowedTypes.has(type)) return { list: [r.url], from: 'direct' };
  if (type.startsWith('image/')) throw new Error(`unsupported image format (${type})`);
  if (!/html|xml/.test(type)) throw new Error(`address is not an image or a web page (${type || 'unknown type'})`);
  const html = await r.text();
  const list = extractImageCandidates(html, r.url).slice(0, 6);
  if (!list.length) throw new Error('no product photo found on that page; send a direct image address instead');
  return { list, from: 'page' };
}

async function uploadOne(name, src) {
  const download = await fetch(src, { headers: { 'User-Agent': UA, Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' }, redirect: 'follow' });
  const contentType = (download.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
  if (!download.ok || !allowedTypes.has(contentType)) return { error: `source download failed or unsupported format (HTTP ${download.status}, ${contentType || 'no image content type'})` };
  const bytes = await download.arrayBuffer();
  const extension = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' })[contentType];
  if (!extension) return { error: `unsupported source image format (${contentType})` };
  const fileName = `${name}.${extension}`;
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: contentType }), fileName);
  form.append('fileName', fileName);
  form.append('folder', FOLDER);
  form.append('useUniqueFileName', 'true');
  form.append('tags', 'product-photo,auto-upload');
  const r = await fetch(IK_UPLOAD, { method: 'POST', headers: { Authorization: auth }, body: form });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) return { error: `ImageKit ${r.status}: ${body.message || 'upload failed'}` };
  if (body.fileType && body.fileType !== 'image') return { error: `ImageKit classified the uploaded file as ${body.fileType}` };
  return { body, extension, contentType };
}

async function one(line) {
  const sep = line.indexOf('|');
  let name = cleanName(sep > 0 ? line.slice(0, sep) : '');
  const src = (sep > 0 ? line.slice(sep + 1) : line).trim();
  if (!/^https:\/\/[^\s]+$/i.test(src)) return { name, source: src, ok: false, error: 'address must be a full https URL (a product page or a direct image address)' };
  if (!name) name = nameFromUrl(src);
  if (!name) return { name, source: src, ok: false, error: 'could not make a file name; put a name before the | sign' };
  const res = { name, source: src, ok: false };
  const minSide = MIN_SIDE;
  try {
    const { list, from } = await resolveSources(src);
    let lastError = 'no candidate worked';
    for (const cand of list) {
      const up = await uploadOne(name, cand);
      if (up.error) { lastError = up.error; continue; }
      const body = up.body;
      const ext = String(up.extension || '').toLowerCase();
      const filePath = body.filePath || `${FOLDER}/${body.name}`;
      const plain = `${IK_ENDPOINT}${filePath}`;
      if (!BROWSER_SAFE.has(ext)) { lastError = `unsupported verified image format (${ext || 'unknown'})`; continue; }
      const browserUrl = plain;
      const w = Number(body.width) || 0, h = Number(body.height) || 0;
      const out = { ...res, image_found_via: from, image_source: cand, original_format: ext, width: w, height: h, bytes: body.size, original_url: plain, browser_url: browserUrl, trusted_source: false, relaxed_size: false };
      if (w < minSide || h < minSide) { lastError = `image is ${w}x${h}; at least ${minSide}x${minSide} is required`; continue; }
      const check = await fetch(browserUrl, { headers: { 'User-Agent': UA } });
      const type = check.headers.get('content-type') || '';
      if (!check.ok || !type.startsWith('image/')) { lastError = `stored file did not load as an image (HTTP ${check.status}, ${type || 'no type'})`; continue; }
      return { ...out, ok: true, content_type: type };
    }
    return { ...res, error: lastError };
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
