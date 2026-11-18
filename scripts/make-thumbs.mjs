#!/usr/bin/env node
/* Makes a small 400 px copy of every product photo so product cards load fast.
 *
 * Reads  product-images/<name>          (the full photos)
 * Writes product-images/thumbs/<name>   (small copies, same file name)
 *
 * storefront-live.js already looks for the copy in thumbs/ and falls back to the full photo when it is missing,
 * so it is safe to run this any time. It skips photos that already have a small copy, so run it again after
 * you add new products and the new photos get their small copies too.
 *
 * How to run (on your own computer, in a copy of this repo):
 *   npm install sharp
 *   SUPABASE_SERVICE_KEY="your service_role key" node scripts/make-thumbs.mjs
 *
 * Find the key in Supabase > Project Settings > API Keys (service_role / secret). Never commit it or paste it into a page.
 * Add --dry-run to see what would be made without uploading anything.
 */
import sharp from 'sharp';

const SB = 'https://oewvtbnmyombbtggamor.supabase.co';
const BUCKET = 'product-images';
const KEY = process.env.SUPABASE_SERVICE_KEY;
const DRY = process.argv.includes('--dry-run');
const SIZE = 400;
const QUALITY = 75;
const PARALLEL = 4;

if (!KEY) {
  console.error('Set SUPABASE_SERVICE_KEY first (see the instructions at the top of this file).');
  process.exit(1);
}
const AUTH = { apikey: KEY, Authorization: 'Bearer ' + KEY };

async function list(prefix) {
  const out = [];
  for (let offset = 0; ; offset += 100) {
    const r = await fetch(`${SB}/storage/v1/object/list/${BUCKET}`, {
      method: 'POST',
      headers: { ...AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix, limit: 100, offset, sortBy: { column: 'name', order: 'asc' } })
    });
    if (!r.ok) throw new Error(`List failed (${r.status}): ${await r.text()}`);
    const rows = await r.json();
    out.push(...rows);
    if (rows.length < 100) break;
  }
  return out;
}

const isImage = (n) => /\.(jpe?g|png|webp)$/i.test(n);

async function makeThumb(name) {
  const src = await fetch(`${SB}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(name)}`);
  if (!src.ok) throw new Error(`download ${src.status}`);
  const small = await sharp(Buffer.from(await src.arrayBuffer()))
    .rotate()
    .resize({ width: SIZE, height: SIZE, fit: 'inside', withoutEnlargement: true })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toBuffer();
  const up = await fetch(`${SB}/storage/v1/object/${BUCKET}/thumbs/${encodeURIComponent(name)}`, {
    method: 'POST',
    headers: { ...AUTH, 'Content-Type': 'image/jpeg', 'x-upsert': 'true', 'cache-control': 'max-age=31536000' },
    body: small
  });
  if (!up.ok) throw new Error(`upload ${up.status}: ${await up.text()}`);
  return small.length;
}

const files = (await list('')).filter((o) => o.id && isImage(o.name)).map((o) => o.name);
const have = new Set((await list('thumbs')).filter((o) => o.id).map((o) => o.name));
const todo = files.filter((n) => !have.has(n));
console.log(`${files.length} photos, ${have.size} already have a small copy, ${todo.length} to make.`);
if (DRY) {
  todo.slice(0, 20).forEach((n) => console.log('  would make', n));
  if (todo.length > 20) console.log(`  ... and ${todo.length - 20} more`);
  process.exit(0);
}

let done = 0, failed = 0, saved = 0;
async function worker() {
  while (todo.length) {
    const name = todo.shift();
    try {
      saved += await makeThumb(name);
      done++;
    } catch (e) {
      failed++;
      console.error(`  failed: ${name} (${e.message})`);
    }
    if ((done + failed) % 25 === 0) console.log(`  ${done + failed} processed...`);
  }
}
await Promise.all(Array.from({ length: PARALLEL }, worker));
console.log(`Done. Made ${done} small copies (${Math.round(saved / 1024)} KB total), ${failed} failed.`);
