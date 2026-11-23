import pg from "pg";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createHash, timingSafeEqual } from "node:crypto";
import { lookup } from "node:dns/promises";
import net from "node:net";

/* Stermont product photo ingestion (publish-products rule v9/v10).
   An assistant (ChatGPT or Claude) sends a product code plus a public HTTPS image link and the
   source/rights details. This function downloads the image itself, validates the real bytes,
   stores them in the public product-photos bucket, reads the stored object back, and only then
   adds the stable URL and provenance to the product. It never changes active, price, stock,
   slug or product_code. */

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
const s3 = new S3Client({ forcePathStyle: true, region: process.env.AWS_REGION });
const bucket = "product-photos";
const maxBytes = 12 * 1024 * 1024;
const minSide = 500;
const maxHops = 3;
const exts = new Map([["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/webp", ".webp"], ["image/gif", ".gif"]]);
const rightsBases = new Set(["manufacturer", "authorized_distributor", "kenyan_vendor", "licensed", "own"]);
const needsEvidence = new Set(["kenyan_vendor", "licensed", "authorized_distributor"]);

function reply(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

// The key itself is never stored. INGEST_KEY_SHA256 holds only its SHA-256 hex digest.
function authorised(req) {
  const want = process.env.INGEST_KEY_SHA256 || "";
  const tok = req.headers.get("authorization")?.match(/^Bearer\s+(.{20,200})$/i)?.[1];
  if (!/^[0-9a-f]{64}$/i.test(want) || !tok) return false;
  const got = createHash("sha256").update(tok).digest();
  return timingSafeEqual(got, Buffer.from(want, "hex"));
}

function privateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  if (net.isIPv6(ip)) {
    const s = ip.toLowerCase();
    return s === "::1" || s === "::" || s.startsWith("fc") || s.startsWith("fd") || s.startsWith("fe80") || s.startsWith("::ffff:");
  }
  return true;
}

async function safeUrl(raw) {
  const u = new URL(raw);
  if (u.protocol !== "https:" || u.username || u.password || (u.port && u.port !== "443")) throw new Error("image URL must be public HTTPS");
  if (net.isIP(u.hostname) || !u.hostname.includes(".") || /\.(local|localhost|internal)$/i.test(u.hostname)) throw new Error("blocked host");
  const addrs = await lookup(u.hostname, { all: true });
  if (!addrs.length || addrs.some((a) => privateIp(a.address))) throw new Error("blocked address");
  return u;
}

async function download(raw) {
  let u = await safeUrl(raw);
  for (let hop = 0; hop <= maxHops; hop++) {
    const res = await fetch(u, {
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
      headers: { Accept: "image/*", "User-Agent": "StermontArcade-ProductIngest/1.0" }
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error("redirect without location");
      u = await safeUrl(new URL(loc, u).toString());
      continue;
    }
    if (!res.ok) throw new Error(`source returned ${res.status}`);
    if (Number(res.headers.get("content-length") || 0) > maxBytes) throw new Error("image exceeds 12 MB");
    const chunks = [];
    let n = 0;
    for await (const c of res.body) {
      n += c.length;
      if (n > maxBytes) throw new Error("image exceeds 12 MB");
      chunks.push(c);
    }
    return { bytes: Buffer.concat(chunks), finalUrl: u.toString() };
  }
  throw new Error("too many redirects");
}

// The real file signature decides the type, never the filename or the Content-Type header.
function sniff(b) {
  if (b.length < 16) return null;
  if (b[0] === 255 && b[1] === 216 && b[2] === 255) return "image/jpeg";
  if (b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (["GIF87a", "GIF89a"].includes(b.toString("ascii", 0, 6))) return "image/gif";
  return null;
}

function dimensions(b, type) {
  try {
    if (type === "image/png") return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    if (type === "image/gif") return { w: b.readUInt16LE(6), h: b.readUInt16LE(8) };
    if (type === "image/jpeg") {
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 255) { i++; continue; }
        const m = b[i + 1];
        if (m === 255) { i++; continue; }
        if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
        if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
        i += 2 + b.readUInt16BE(i + 2);
      }
      return null;
    }
    if (type === "image/webp") {
      const f = b.toString("ascii", 12, 16);
      if (f === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
      if (f === "VP8L") { const v = b.readUInt32LE(21); return { w: 1 + (v & 0x3fff), h: 1 + ((v >> 14) & 0x3fff) }; }
      if (f === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    }
  } catch { /* fall through */ }
  return null;
}

function httpsUrl(v) {
  try { const u = new URL(String(v || "")); return u.protocol === "https:" && !u.username && !u.password ? u.toString() : null; } catch { return null; }
}

export default {
  async fetch(req) {
    const url = new URL(req.url);
    if (req.method === "GET" && url.pathname === "/health") return reply({ ok: true, service: "stermont-product-ingest" });
    if (req.method !== "POST" || url.pathname !== "/ingest") return reply({ error: "Not found" }, 404);
    if (!authorised(req)) return reply({ error: "Invalid or missing ingest key" }, 401);

    let body;
    try { body = await req.json(); } catch { return reply({ error: "Send JSON" }, 400); }
    const code = String(body.product_code || "").trim();
    const imageUrl = httpsUrl(body.image_url);
    const sourcePage = httpsUrl(body.source_page_url);
    const sourceName = String(body.source_name || "").trim().slice(0, 200);
    const basis = String(body.rights_basis || "");
    const evidence = String(body.rights_evidence || "").trim().slice(0, 1000);
    const packNote = String(body.exact_pack_match || "").trim().slice(0, 500);
    const alt = String(body.alt_text || "").trim().slice(0, 200);
    const main = body.main === true;

    if (!code) return reply({ error: "product_code is required" }, 400);
    if (!imageUrl) return reply({ error: "image_url must be a public HTTPS link" }, 400);
    if (!sourcePage || !sourceName) return reply({ error: "source_page_url (HTTPS) and source_name are required" }, 400);
    if (!rightsBases.has(basis)) return reply({ error: `rights_basis must be one of ${[...rightsBases].join(", ")}` }, 400);
    if (needsEvidence.has(basis) && evidence.length < 15) return reply({ error: "rights_evidence is required: say which terms or permission you checked" }, 400);
    if (packNote.length < 10) return reply({ error: "exact_pack_match is required: describe the brand, product and pack size visible in the photo" }, 400);
    if (alt.length < 5) return reply({ error: "alt_text is required" }, 400);

    const p = await pool.query("SELECT id, name, active, images, attributes FROM public.products WHERE product_code = $1 LIMIT 1", [code]);
    const product = p.rows[0];
    if (!product) return reply({ error: "Product code not found" }, 404);

    let dl;
    try { dl = await download(imageUrl); } catch (e) { return reply({ error: `Could not download image: ${e.message}` }, 502); }

    const type = sniff(dl.bytes);
    if (!type || !exts.has(type)) return reply({ error: "Not a supported image. Accepted: JPEG, PNG, WebP, GIF" }, 415);
    const dim = dimensions(dl.bytes, type);
    if (!dim) return reply({ error: "Could not read image dimensions" }, 422);
    if (dim.w < minSide || dim.h < minSide) return reply({ error: `Image is ${dim.w}x${dim.h}; minimum is ${minSide}x${minSide}` }, 422);

    const sha = createHash("sha256").update(dl.bytes).digest("hex");
    const prior = Array.isArray(product.attributes?.photo_provenance) ? product.attributes.photo_provenance : [];
    const same = prior.find((x) => x && x.sha256 === sha);
    if (same) return reply({ ok: true, duplicate: true, product_code: code, image_url: same.stored_url, active: product.active });

    const key = `products/${code.toUpperCase()}/${sha.slice(0, 16)}${exts.get(type)}`;
    const base = process.env.AWS_ENDPOINT_URL_S3;
    if (!base) return reply({ error: "Storage endpoint is not configured" }, 500);
    const stored = `${base.replace(/\/$/, "")}/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;

    try {
      await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: dl.bytes, ContentLength: dl.bytes.length, ContentType: type, CacheControl: "public, max-age=31536000, immutable" }));
      const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      if (Number(head.ContentLength) !== dl.bytes.length) throw new Error("stored size does not match");
      const pub = await fetch(stored, { method: "HEAD", signal: AbortSignal.timeout(10000) });
      const pubType = (pub.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
      if (!pub.ok || pubType !== type) throw new Error(`public URL check failed (${pub.status} ${pubType || "no type"})`);
    } catch (e) {
      console.error("store/verify", e);
      return reply({ error: `Stored the file but could not verify it, so the product was not changed: ${e.message}` }, 502);
    }

    const provenance = {
      sha256: sha, stored_url: stored, object_key: key, mime_type: type, width: dim.w, height: dim.h, bytes: dl.bytes.length,
      source_page_url: sourcePage, source_asset_url: imageUrl, source_final_url: dl.finalUrl, source_name: sourceName,
      source_basis: basis, rights_evidence: evidence || null, exact_pack_match: packNote, retrieved_at: new Date().toISOString()
    };
    try {
      await pool.query(
        `UPDATE public.products SET
           images = CASE WHEN $2::boolean OR cardinality(images) = 0 THEN array_prepend($1::text, images) ELSE array_append(images, $1::text) END,
           alt_text = CASE WHEN $2::boolean OR alt_text = '' THEN $3::text ELSE alt_text END,
           attributes = jsonb_set(attributes || jsonb_build_object('photo_source', $4::text),
             '{photo_provenance}', COALESCE(attributes->'photo_provenance', '[]'::jsonb) || $5::jsonb),
           updated_at = now()
         WHERE id = $6`,
        [stored, main, alt, sourcePage, JSON.stringify(provenance), product.id]
      );
      await pool.query(
        `INSERT INTO public.admin_audit_log(actor_email, action, entity_type, entity_id, details, created_at) VALUES('ingest-api', 'product_photo_ingested', 'product', $1, $2::jsonb, now())`,
        [product.id, JSON.stringify({ product_code: code, ...provenance })]
      ).catch((e) => console.warn("audit log skipped", e.message));
    } catch (e) {
      console.error("update", e);
      return reply({ error: "Photo stored but the product update failed" }, 502);
    }
    return reply({ ok: true, product_code: code, product_name: product.name, image_url: stored, width: dim.w, height: dim.h, mime_type: type, active: product.active, note: "Photo only. active, price, stock, slug and product_code were not changed." }, 201);
  }
};
