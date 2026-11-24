// Stermont Arcade — fetch, validate, JPEG-normalize and upload product photos to ImageKit.
// Queue: data/photo-queue.txt. Results: data/photo-results.json (written by the workflow).
// Requires IMAGEKIT_PRIVATE_KEY and the sharp package installed by the workflow.
import { appendFileSync, readFileSync } from 'node:fs';

const IK_UPLOAD = 'https://upload.imagekit.io/api/v1/files/upload';
const IK_ENDPOINT = 'https://ik.imagekit.io/w6hxfnwmw';
const FOLDER = '/products';
const MIN_SIDE = 200;
const MIN_SOURCE_SIDE = 150;
const MAX_LINES = 200;
const KEY = process.env.IMAGEKIT_PRIVATE_KEY || '';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const IMAGE_ACCEPT = 'image/avif,image/webp,image/apng,image/png,image/jpeg,image/*;q=0.9,*/*;q=0.5';
const summaryFile = process.env.GITHUB_STEP_SUMMARY;
const say = (s) => console.log(s);
const summary = (s) => { if (summaryFile) appendFileSync(summaryFile, s + '\n'); };

if (!KEY) {
  console.error('::error::Repository secret IMAGEKIT_PRIVATE_KEY is not set.');
  process.exit(1);
}
const lines = String(process.env.PHOTOS || '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
if (!lines.length) { console.error('::error::No photos given.'); process.exit(1); }
if (lines.length > MAX_LINES) { console.error(`::error::Too many photos (${lines.length}); maximum is ${MAX_LINES}.`); process.exit(1); }
const auth = 'Basic ' + Buffer.from(KEY + ':').toString('base64');
const cleanName = (s) => s.toLowerCase().replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);
function refererFor(u) {
  try {
    const x = new URL(u);
    const h = x.hostname.toLowerCase();
    if (h === 'cdn.mafrservices.com' || h.endsWith('.mafrservices.com') || h.includes('mafretailproxy')) return 'https://www.carrefour.ke/';
    return x.origin + '/';
  } catch { return ''; }
}
const latestLineByName = new Map();
for (const line of lines) {
  const sep = line.indexOf('|');
  const name = cleanName(sep >= 0 ? line.slice(0, sep) : line);
  if (name) latestLineByName.set(name, line);
}
const uniqueLines = [...latestLineByName.values()];
let previousResults = [];
try { previousResults = JSON.parse(readFileSync('data/photo-results.json', 'utf8')); } catch {}
const previousByName = new Map(previousResults.filter((x) => x && x.ok && x.browser_url).map((x) => [x.name, x]));

export function normalizePageUrl(u) {
  try {
    const x = new URL(u);
    if (/(^|\.)stermontarcade\.co\.ke$/i.test(x.hostname) && x.searchParams.get('product')) {
      return `https://${x.hostname}/p/${x.searchParams.get('product')}.html`;
    }
  } catch {}
  return u;
}
export function nameFromUrl(u) {
  try {
    const x = new URL(u);
    return cleanName(x.searchParams.get('product') || x.pathname.split('/').filter(Boolean).pop() || x.hostname);
  } catch { return ''; }
}
export function extractImageCandidates(html, baseUrl, productName = '') {
  const ranked = new Map();
  const tokens = String(productName).toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !['product','spray','bait','insecticide','pellets'].includes(t));
  const add = (v, score = 0) => {
    if (!v || typeof v !== 'string') return;
    try {
      const abs = new URL(v.trim().replace(/&amp;/g, '&'), baseUrl).href;
      if (/^https:/i.test(abs)) {
        const prior = ranked.get(abs);
        if (!prior || score > prior.score) ranked.set(abs, { url: abs, score });
      }
    } catch {}
  };
  const attr = (tag, key) => (tag.match(new RegExp("\\b" + key + "\\s*=\\s*(['\\\"])(.*?)\\1", "i")) || [])[2] || "";
  // Actual product/gallery images first, excluding logos and UI artwork.
  for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
    const alt = attr(tag, 'alt');
    const context = (alt + ' ' + attr(tag, 'class') + ' ' + attr(tag, 'itemprop')).toLowerCase();
    if (/logo|payment|visa|mastercard|facebook|instagram|whatsapp|twitter|tiktok|avatar|icon|banner/i.test(context)) continue;
    const values = ['data-zoom-image','data-original','data-src','data-lazy-src','src'].map((key) => attr(tag, key)).filter(Boolean);
    const imageText = (alt + ' ' + attr(tag, 'title') + ' ' + values.join(' ')).toLowerCase();
    const score = tokens.reduce((n, token) => n + (imageText.includes(token) ? 5 : 0), 0);
    for (const value of values) add(value, score);
    for (const key of ['data-srcset','srcset']) {
      const srcset = attr(tag, key);
      for (const part of srcset.split(',')) add(part.trim().split(/\s+/)[0], score);
    }
  }
  for (const tag of html.match(/<meta\s+[^>]*>/gi) || []) {
    const key = (tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i) || [])[1] || '';
    if (/^(og:image(:secure_url|:url)?|twitter:image(:src)?)$/i.test(key)) add((tag.match(/content\s*=\s*["']([^"']+)["']/i) || [])[1], 1);
  }
  for (const tag of html.match(/<link\s+[^>]*>/gi) || []) {
    if (/rel\s*=\s*["']image_src["']/i.test(tag)) add((tag.match(/href\s*=\s*["']([^"']+)["']/i) || [])[1], 1);
  }
  for (const m of html.matchAll(/<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (n) => {
        if (!n || typeof n !== 'object') return;
        if (Array.isArray(n)) { n.forEach(walk); return; }
        if ([].concat(n['@type'] || []).some((t) => /Product/i.test(t)) && n.image) {
          for (const i of [].concat(n.image)) add(typeof i === 'string' ? i : i && (i.url || i.contentUrl), 8);
        }
        Object.values(n).forEach(walk);
      };
      walk(JSON.parse(m[1]));
    } catch {}
  }
  return [...ranked.values()].sort((a, b) => b.score - a.score).map((x) => x.url);
}

async function resolveSources(src, productName = '') {
  const page = normalizePageUrl(src);
  const r = await fetch(page, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,' + IMAGE_ACCEPT, ...(refererFor(page) ? { Referer: refererFor(page) } : {}) },
    redirect: 'follow'
  });
  if (!r.ok) throw new Error(`source page HTTP ${r.status}`);
  const type = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (type.startsWith('image/')) return { list: [r.url], from: 'direct' };
  if (type === 'text/html' || type === 'application/xhtml+xml' || type.includes('xml')) {
    const html = await r.text();
    const list = extractImageCandidates(html, r.url, productName).slice(0, 12);
    if (!list.length) throw new Error('source page returned HTML but no product image was found');
    return { list, from: 'product-page' };
  }
  throw new Error(`source returned non-image, non-HTML content-type: ${type || 'missing'}`);
}

async function uploadOne(name, src) {
  const referer = refererFor(src);
  const download = await fetch(src, {
    headers: { 'User-Agent': UA, Accept: IMAGE_ACCEPT, ...(referer ? { Referer: referer } : {}) },
    redirect: 'follow'
  });
  const contentType = (download.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!download.ok) return { error: `image download HTTP ${download.status} (${contentType || 'no content-type'})` };
  if (!contentType.startsWith('image/')) return { error: `rejected source response: expected image/*, received ${contentType || 'missing content-type'} (HTML/block pages are never uploaded)` };

  const input = Buffer.from(await download.arrayBuffer());
  if (input.length < 128) return { error: 'source image is empty or too small to be valid' };
  const sharpModule = await import('sharp');
  const sharp = sharpModule.default;
  let converted;
  try {
    const image = sharp(input, { failOn: 'error', limitInputPixels: 40000000, animated: false });
    const metadata = await image.metadata();
    if (!['jpeg','png','webp','heif','avif','tiff','gif'].includes(metadata.format)) {
      return { error: `unsupported raster image encoding: ${metadata.format || contentType}` };
    }
    const rotated = await image.rotate().toBuffer({ resolveWithObject: true });
    const width = Number(rotated.info.width) || 0;
    const height = Number(rotated.info.height) || 0;
    if (width < MIN_SOURCE_SIDE || height < MIN_SOURCE_SIDE) {
      return { error: `source image is ${width}x${height}; both source sides must be at least ${MIN_SOURCE_SIDE}px` };
    }
    const padX = Math.max(0, MIN_SIDE - width);
    const padY = Math.max(0, MIN_SIDE - height);
    converted = await sharp(rotated.data)
      .extend({
        left: Math.floor(padX / 2), right: Math.ceil(padX / 2),
        top: Math.floor(padY / 2), bottom: Math.ceil(padY / 2),
        background: '#ffffff'
      })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();
  } catch (e) {
    return { error: `image decode/JPEG conversion failed: ${e.message}` };
  }
  // JPEG magic bytes are checked before upload; this prevents HTML/error bodies or mislabeled formats.
  if (converted[0] !== 0xff || converted[1] !== 0xd8 || converted[2] !== 0xff) {
    return { error: 'JPEG conversion did not produce a valid JPEG binary' };
  }
  const fileName = `${name}.jpg`;
  const form = new FormData();
  form.append('file', new Blob([converted], { type: 'image/jpeg' }), fileName);
  form.append('fileName', fileName);
  form.append('folder', FOLDER);
  form.append('useUniqueFileName', 'true');
  form.append('tags', 'product-photo,auto-upload,jpeg-normalized');
  const response = await fetch(IK_UPLOAD, { method: 'POST', headers: { Authorization: auth }, body: form });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) return { error: `ImageKit ${response.status}: ${body.message || 'upload failed'}` };
  if (body.fileType && body.fileType !== 'image') return { error: `ImageKit classified upload as ${body.fileType}` };
  const width = Number(body.width) || 0;
  const height = Number(body.height) || 0;
  if (width < MIN_SIDE || height < MIN_SIDE) return { error: `ImageKit stored image is ${width}x${height}; minimum is ${MIN_SIDE}x${MIN_SIDE}` };
  const filePath = body.filePath || `${FOLDER}/${body.name}`;
  const browserUrl = `${IK_ENDPOINT}${filePath}`;
  const verify = await fetch(browserUrl, { headers: { 'User-Agent': UA, Accept: 'image/jpeg,*/*;q=0.8' }, redirect: 'follow' });
  const verifiedType = (verify.headers.get('content-type') || '').split(';')[0].toLowerCase();
  if (verify.status !== 200 || verifiedType !== 'image/jpeg') {
    return { error: `ImageKit URL verification failed (HTTP ${verify.status}, ${verifiedType || 'no content-type'})` };
  }
  return {
    ok: true, browser_url: browserUrl, original_url: browserUrl, width, height,
    bytes: Number(body.size) || converted.length, content_type: verifiedType,
    original_format: 'jpg', converted_from: contentType, image_source: src,
    http_status: verify.status
  };
}

async function one(line) {
  const sep = line.indexOf('|');
  let name = cleanName(sep > 0 ? line.slice(0, sep) : '');
  const src = (sep > 0 ? line.slice(sep + 1) : line).trim();
  if (!/^https:\/\/[^\s]+$/i.test(src)) return { name, source: src, ok: false, error: 'source must be a full HTTPS URL' };
  if (!name) name = nameFromUrl(src);
  if (!name) return { name, source: src, ok: false, error: 'could not determine product photo filename' };
  const result = { name, source: src, ok: false };
  try {
    // Reuse earlier verified JPEGs when a retry only needs to replace blocked sources.
    const cached = previousByName.get(name);
    if (cached && cached.content_type === 'image/jpeg' && cached.http_status === 200) {
      const check = await fetch(cached.browser_url, { headers: { 'User-Agent': UA, Accept: 'image/jpeg,*/*;q=0.8' }, redirect: 'follow' });
      const type = (check.headers.get('content-type') || '').split(';')[0].toLowerCase();
      if (check.status === 200 && type === 'image/jpeg') {
        return { ...cached, ...result, ok: true, browser_url: cached.browser_url, original_url: cached.browser_url, content_type: type, http_status: 200, reused: true };
      }
    }
    const { list, from } = await resolveSources(src, name);
    const failures = [];
    for (const candidate of list) {
      const uploaded = await uploadOne(name, candidate);
      if (uploaded.error) { failures.push(`${candidate}: ${uploaded.error}`); continue; }
      return { ...result, ...uploaded, image_found_via: from };
    }
    return { ...result, error: failures.join(' | ').slice(0, 1800) || 'no image candidate could be uploaded' };
  } catch (e) {
    return { ...result, error: String(e && e.message || e) };
  }
}

const results = [];
for (const line of uniqueLines) results.push(await one(line));
summary('## ImageKit photo upload — JPEG normalized');
summary('| Result | Product | Dimensions | Verified ImageKit URL / error |');
summary('|---|---|---|---|');
for (const result of results) {
  summary(`| ${result.ok ? 'OK' : 'FAILED'} | ${result.name} | ${result.width && result.height ? result.width + 'x' + result.height : '-'} | ${result.ok ? result.browser_url : result.error} |`);
  say(`${result.ok ? (result.reused ? 'REUSED' : 'OK') : 'FAILED'} ${result.name}: ${result.ok ? result.browser_url : result.error}`);
}
say('RESULTS_JSON_BEGIN');
say(JSON.stringify(results, null, 2));
say('RESULTS_JSON_END');
const failed = results.filter((x) => !x.ok).length;
say(`Done: ${results.length - failed} verified JPEG uploads, ${failed} failed.`);
process.exit(failed ? 1 : 0);
