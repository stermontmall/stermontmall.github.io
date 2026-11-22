// POST /ingest: lets an automation (ChatGPT Action or Claude) store a vendor photo without an admin login.
// Auth: "Authorization: Bearer <key>"; only the SHA-256 hash of the key is stored in public.ingest_keys.
// The server downloads the image itself, validates it, stores the real bytes in Neon Object Storage,
// verifies the stored object, and only then appends it to products.images.
// It NEVER changes active, price, stock, slug or product_code.
import pg from "pg";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { createHash, randomUUID } from "node:crypto";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const s3 = new S3Client({ forcePathStyle: true, region: process.env.AWS_REGION });
const bucket = "product-photos";
const maxBytes = 12 * 1024 * 1024;
const minBytes = 15001;
const minSide = 500;
const exts = new Map([["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/webp", ".webp"]]);
const bases = new Set(["manufacturer", "authorized_distributor", "kenyan_vendor"]);

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

function privateIp(ip) {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) ||
      (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19))
    );
  }
  const v = ip.toLowerCase();
  if (v === "::" || v === "::1") return true;
  if (v.startsWith("::ffff:")) return privateIp(v.slice(7));
  return v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb");
}

async function checkedUrl(raw) {
  const u = new URL(raw);
  if (u.protocol !== "https:" || u.username || u.password) throw new Error("URL must be public HTTPS");
  if (u.port && u.port !== "443") throw new Error("Only port 443 is allowed");
  const host = u.hostname;
  if (!host.includes(".") || /^(localhost|.*\.localhost|.*\.local|.*\.internal)$/i.test(host)) throw new Error("Host not allowed");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => privateIp(a.address))) throw new Error("Host resolves to a private address");
  return u;
}

async function download(raw) {
  let url = raw;
  for (let hop = 0; hop < 4; hop++) {
    const u = await checkedUrl(url);
    const res = await fetch(u, {
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
      headers: { Accept: "image/jpeg,image/png,image/webp", "User-Agent": "StermontPhotoIngest/1.0" },
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error("Redirect without location");
      url = new URL(loc, u).toString();
      continue;
    }
    if (!res.ok) throw new Error("Source returned HTTP " + res.status);
    const type = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (Number(res.headers.get("content-length") || 0) > maxBytes) throw new Error("Image exceeds 12 MB");
    const chunks = [];
    let size = 0;
    for await (const c of res.body) {
      size += c.length;
      if (size > maxBytes) throw new Error("Image exceeds 12 MB");
      chunks.push(c);
    }
    return { bytes: Buffer.concat(chunks), type, finalUrl: u.toString() };
  }
  throw new Error("Too many redirects");
}

function signatureOk(b, type) {
  if (type === "image/jpeg") return b[0] === 255 && b[1] === 216 && b[2] === 255;
  if (type === "image/png") return b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (type === "image/webp") return b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP";
  return false;
}

export function dimensions(b, type) {
  try {
    if (type === "image/png") return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    if (type === "image/jpeg") {
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m === 0xff) { i++; continue; }
        if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
        i += 2 + b.readUInt16BE(i + 2);
      }
      return null;
    }
    if (type === "image/webp") {
      const k = b.toString("ascii", 12, 16);
      if (k === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
      if (k === "VP8L") { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
      if (k === "VP8X") return { w: b.readUIntLE(24, 3) + 1, h: b.readUIntLE(27, 3) + 1 };
    }
  } catch { /* fall through */ }
  return null;
}

async function authorised(req) {
  const m = req.headers.get("authorization")?.match(/^Bearer\s+(\S{20,200})$/i);
  if (!m) return null;
  const hash = createHash("sha256").update(m[1], "utf8").digest("hex");
  const r = await pool.query("SELECT label FROM public.ingest_keys WHERE key_hash=$1 AND active LIMIT 1", [hash]);
  if (r.rows[0]) pool.query("UPDATE public.ingest_keys SET last_used_at=now() WHERE key_hash=$1", [hash]).catch(() => {});
  return r.rows[0] || null;
}

const clean = (v, n = 500) => String(v ?? "").trim().slice(0, n);

export async function ingest(req) {
  let who;
  try { who = await authorised(req); } catch (e) { console.error("ingest auth", e); return json({ error: "Authentication failed" }, 401); }
  if (!who) return json({ error: "Valid ingest key required" }, 401);

  let body;
  try { body = await req.json(); } catch { return json({ error: "Send JSON" }, 400); }
  const code = clean(body.product_code, 40);
  const imageUrl = clean(body.image_url, 2000);
  const pageUrl = clean(body.source_page_url, 2000);
  const sourceName = clean(body.source_name, 200);
  const basis = clean(body.photo_basis, 40);
  const rights = clean(body.rights_note, 1000);
  const packNote = clean(body.pack_match_note, 500);
  const alt = clean(body.alt_text, 300);
  if (!code || !imageUrl || !pageUrl || !sourceName || !alt) return json({ error: "product_code, image_url, source_page_url, source_name and alt_text are required" }, 400);
  if (!bases.has(basis)) return json({ error: "photo_basis must be manufacturer, authorized_distributor or kenyan_vendor" }, 400);
  if (rights.length < 15) return json({ error: "rights_note is required: say what the source terms or permission allow" }, 400);
  if (packNote.length < 10) return json({ error: "pack_match_note is required: say how the photo matches the exact product and pack" }, 400);
  try { await checkedUrl(pageUrl); } catch (e) { return json({ error: "source_page_url: " + e.message }, 400); }

  const p = await pool.query("SELECT id,name,images FROM public.products WHERE product_code=$1 LIMIT 1", [code]);
  if (!p.rows[0]) return json({ error: "Product code not found" }, 404);

  let got;
  try { got = await download(imageUrl); } catch (e) { return json({ error: "Download failed: " + e.message }, 502); }
  const { bytes, type } = got;
  if (!exts.has(type)) return json({ error: "Only image/jpeg, image/png and image/webp are accepted (got " + (type || "unknown") + ")" }, 415);
  if (!signatureOk(bytes, type)) return json({ error: "File bytes do not match the image type" }, 415);
  if (bytes.length < minBytes) return json({ error: "Image must be larger than 15,000 bytes" }, 422);
  const d = dimensions(bytes, type);
  if (!d || d.w < minSide || d.h < minSide) return json({ error: "Image must be at least 500 x 500 px", width: d?.w ?? null, height: d?.h ?? null }, 422);

  const key = `products/${code.toUpperCase()}/${randomUUID()}${exts.get(type)}`;
  const base = process.env.AWS_ENDPOINT_URL_S3;
  if (!base) return json({ error: "Storage endpoint missing" }, 502);
  const publicUrl = `${base.replace(/\/$/, "")}/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;
  try {
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentLength: bytes.length, ContentType: type, CacheControl: "public, max-age=31536000, immutable" }));
    const check = await fetch(publicUrl, { signal: AbortSignal.timeout(15000) });
    const checkType = (check.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    const stored = Buffer.from(await check.arrayBuffer());
    if (!check.ok || checkType !== type || stored.length !== bytes.length) {
      return json({ error: "Stored object failed verification; product not changed", status: check.status, content_type: checkType }, 502);
    }
    const images = [...new Set([...(p.rows[0].images || []), publicUrl])];
    const prov = {
      photo_source: pageUrl, photo_asset_url: imageUrl, photo_source_name: sourceName, photo_basis: basis,
      photo_rights_note: rights, pack_match_note: packNote, photo_retrieved_on: new Date().toISOString().slice(0, 10),
      photo_dimensions: `${d.w}x${d.h}`, photo_stored_key: key,
    };
    await pool.query(
      "UPDATE public.products SET images=$1, alt_text=COALESCE(NULLIF(alt_text,''),$2), attributes=COALESCE(attributes,'{}'::jsonb)||$3::jsonb, updated_at=now() WHERE id=$4",
      [images, alt, JSON.stringify(prov), p.rows[0].id],
    );
    await pool.query(
      "INSERT INTO public.admin_audit_log(actor_email,action,details,created_at) VALUES($1,'product_photo_ingested',$2::jsonb,now())",
      ["ingest:" + who.label, JSON.stringify({ product_code: code, object_key: key, mime_type: type, bytes: bytes.length, ...prov })],
    ).catch((e) => console.warn("audit log skipped", e.message));
    return json({ ok: true, product_code: code, product_name: p.rows[0].name, image_url: publicUrl, mime_type: type, bytes: bytes.length, width: d.w, height: d.h, verified: true, active_unchanged: true }, 201);
  } catch (e) {
    console.error("ingest", e);
    return json({ error: "Storage upload or product update failed" }, 502);
  }
}
